import { getClientDb } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface WorkingPaymentRequest {
  id: string;
  landlordUserId: string;
  tenantEmail: string;
  tenantName: string;
  amount: number;
  description: string;
  unitName: string;
  propertyName: string;
  xenditInvoiceId: string;
  xenditInvoiceUrl: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  platformFee: number;
  landlordAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LandlordBankDetails {
  id: string;
  userId: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export class WorkingXenditService {
  private static readonly API_BASE = 'https://api.xendit.co';
  private static readonly API_KEY = process.env.XENDIT_SECRET_KEY || '';

  /**
   * Create a real payment request using your main Xendit account
   * This will create actual payment links that tenants can use
   */
  static async createRealPaymentRequest(
    landlordUserId: string,
    tenantEmail: string,
    tenantName: string,
    amount: number,
    description: string,
    unitName: string,
    propertyName: string
  ): Promise<WorkingPaymentRequest> {
    try {
      console.log('🚀 Creating real Xendit payment request...');
      
      // Calculate platform fee (2.5%)
      const platformFeePercentage = 0.025;
      const platformFee = Math.round(amount * platformFeePercentage);
      const landlordAmount = amount - platformFee;

      const externalId = `rentmatic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        external_id: externalId,
        amount: amount,
        description: `${description} - ${unitName} at ${propertyName}`,
        customer: {
          given_names: tenantName,
          email: tenantEmail
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/failure`,
        currency: 'PHP',
        payment_methods: ['EWALLET', 'BANK_TRANSFER', 'RETAIL_OUTLET', 'CREDIT_CARD'],
        // Add platform fee as a fee
        fees: [
          {
            type: 'PLATFORM_FEE',
            value: platformFee
          }
        ]
      };

      console.log('📤 Sending request to Xendit API...', paymentData);

      const response = await this.makeRequest('/v2/invoices', 'POST', paymentData);
      const invoice = response as any;

      console.log('✅ Xendit response received:', invoice);

      // Save payment request to Firestore
      const paymentRequest: WorkingPaymentRequest = {
        id: externalId,
        landlordUserId,
        tenantEmail,
        tenantName,
        amount,
        description,
        unitName,
        propertyName,
        xenditInvoiceId: invoice.id,
        xenditInvoiceUrl: invoice.invoice_url,
        status: 'pending',
        platformFee,
        landlordAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const db = getClientDb();
      if (db) {
        await setDoc(doc(db, 'users', landlordUserId, 'working_payments', externalId), paymentRequest);
        console.log('💾 Payment request saved to Firestore');
      }

      return paymentRequest;
    } catch (error) {
      console.error('❌ Error creating payment request:', error);
      throw new Error('Failed to create payment request. Please try again.');
    }
  }

  /**
   * Add landlord bank details for payouts
   */
  static async addLandlordBankDetails(
    userId: string,
    bankDetails: Omit<LandlordBankDetails, 'id' | 'createdAt' | 'updatedAt' | 'isVerified'>
  ): Promise<LandlordBankDetails> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const bankId = `bank_${Date.now()}`;
      const newBankDetails: LandlordBankDetails = {
        id: bankId,
        userId,
        ...bankDetails,
        isVerified: false, // Will be verified by Xendit
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userId, 'bank_details', bankId), newBankDetails);
      console.log('💾 Bank details saved to Firestore');

      return newBankDetails;
    } catch (error) {
      console.error('❌ Error adding bank details:', error);
      throw error;
    }
  }

  /**
   * Get landlord bank details
   */
  static async getLandlordBankDetails(userId: string): Promise<LandlordBankDetails | null> {
    try {
      const db = getClientDb();
      if (!db) return null;

      const q = query(collection(db, 'users', userId, 'bank_details'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data() as LandlordBankDetails;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting bank details:', error);
      return null;
    }
  }

  /**
   * Process payout to landlord when payment is received
   * This will send real money to the landlord's bank account
   */
  static async processPayoutToLandlord(
    landlordUserId: string,
    amount: number,
    paymentId: string
  ): Promise<void> {
    try {
      console.log('💰 Processing payout to landlord...');
      
      const bankDetails = await this.getLandlordBankDetails(landlordUserId);
      if (!bankDetails) {
        console.error('❌ No bank details found for landlord:', landlordUserId);
        return;
      }

      // Create payout request to Xendit
      const payoutData = {
        external_id: `payout_${paymentId}_${Date.now()}`,
        amount: amount,
        email: bankDetails.accountName, // Use account name as email for payout
        bank_code: bankDetails.bankCode,
        account_holder_name: bankDetails.accountName,
        account_number: bankDetails.accountNumber
      };

      console.log('📤 Creating payout via Xendit...', payoutData);

      const response = await this.makeRequest('/v2/payouts', 'POST', payoutData);
      console.log('✅ Payout created successfully:', response);

      // Update payment status
      await this.updatePaymentStatus(landlordUserId, paymentId, 'paid');
    } catch (error) {
      console.error('❌ Error processing payout:', error);
      // Don't throw error - we'll retry later
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    landlordUserId: string,
    paymentId: string,
    status: WorkingPaymentRequest['status']
  ): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) return;

      await updateDoc(doc(db, 'users', landlordUserId, 'working_payments', paymentId), {
        status,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Payment status updated to:', status);
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
    }
  }

  /**
   * Get payment history for a landlord
   */
  static async getPaymentHistory(landlordUserId: string): Promise<WorkingPaymentRequest[]> {
    try {
      const db = getClientDb();
      if (!db) return [];

      const q = query(collection(db, 'users', landlordUserId, 'working_payments'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as WorkingPaymentRequest);
    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Make API request to Xendit
   */
  private static async makeRequest(endpoint: string, method: string, data?: unknown): Promise<unknown> {
    const url = `${this.API_BASE}${endpoint}`;
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${this.API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json'
    };

    console.log(`🌐 Making ${method} request to: ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Xendit API Error:', response.status, error);
      throw new Error(`Xendit API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ Xendit API Success:', result);
    return result;
  }

  /**
   * Test Xendit connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Xendit connection...');
      const response = await this.makeRequest('/v2/balance', 'GET');
      console.log('✅ Xendit connection successful:', response);
      return true;
    } catch (error) {
      console.error('❌ Xendit connection failed:', error);
      return false;
    }
  }
}












