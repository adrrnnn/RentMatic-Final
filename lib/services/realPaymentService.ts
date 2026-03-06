import { getClientDb } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface LandlordPayoutMethod {
  id: string;
  type: 'bank_account' | 'ewallet' | 'cash';
  bankCode?: string; // For bank accounts
  accountNumber?: string;
  accountName?: string;
  ewalletCode?: string; // For e-wallets like GCash, PayMaya
  ewalletNumber?: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RealPaymentRequest {
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

export interface SplitPaymentData {
  external_id: string;
  amount: number;
  description: string;
  customer: {
    given_names: string;
    email: string;
  };
  success_redirect_url: string;
  failure_redirect_url: string;
  currency: string;
  payment_methods: string[];
  split_payment: {
    split_rule: {
      split_rule_id: string;
      merchant_id: string;
      merchant_name: string;
      amount: number;
    }[];
  };
}

export class RealPaymentService {
  private static readonly API_BASE = 'https://api.xendit.co';
  private static readonly API_KEY = process.env.XENDIT_SECRET_KEY || '';

  /**
   * Create a real payment request with split payment
   * This ensures money goes to Xendit first, then gets split to landlord
   */
  static async createRealPaymentRequest(
    landlordUserId: string,
    tenantEmail: string,
    tenantName: string,
    amount: number,
    description: string,
    unitName: string,
    propertyName: string
  ): Promise<RealPaymentRequest> {
    try {
      // Get landlord's payout method
      const payoutMethod = await this.getDefaultPayoutMethod(landlordUserId);
      if (!payoutMethod) {
        throw new Error('Landlord has no payout method configured');
      }

      // Calculate platform fee (2.5% for now)
      const platformFeePercentage = 0.025;
      const platformFee = Math.round(amount * platformFeePercentage);
      const landlordAmount = amount - platformFee;

      // Create split payment rule
      const splitRuleId = await this.createSplitRule(landlordUserId, payoutMethod);
      
      const externalId = `rent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const splitPaymentData: SplitPaymentData = {
        external_id: externalId,
        amount: amount,
        description: `${description} - ${unitName} at ${propertyName}`,
        customer: {
          given_names: tenantName,
          email: tenantEmail
        },
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failure`,
        currency: 'PHP',
        payment_methods: ['EWALLET', 'BANK_TRANSFER', 'RETAIL_OUTLET', 'CREDIT_CARD'],
        split_payment: {
          split_rule: [
            {
              split_rule_id: splitRuleId,
              merchant_id: landlordUserId, // Your main Xendit account
              merchant_name: 'RentMatic Platform',
              amount: platformFee
            }
          ]
        }
      };

      // Create invoice with split payment
      const response = await this.makeRequest('/v2/invoices', 'POST', splitPaymentData);
      const invoice = response as any;

      // Save payment request to Firestore
      const paymentRequest: RealPaymentRequest = {
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
        await setDoc(doc(db, 'users', landlordUserId, 'real_payments', externalId), paymentRequest);
      }

      return paymentRequest;
    } catch (error) {
      console.error('Error creating real payment request:', error);
      throw new Error('Failed to create payment request. Please try again.');
    }
  }

  /**
   * Add landlord payout method (bank account, e-wallet, etc.)
   */
  static async addPayoutMethod(
    landlordUserId: string,
    payoutMethod: Omit<LandlordPayoutMethod, 'id' | 'createdAt' | 'updatedAt' | 'isVerified'>
  ): Promise<LandlordPayoutMethod> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const methodId = `payout_${Date.now()}`;
      const newPayoutMethod: LandlordPayoutMethod = {
        id: methodId,
        ...payoutMethod,
        isVerified: false, // Will be verified by Xendit
        isDefault: payoutMethod.isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', landlordUserId, 'payout_methods', methodId), newPayoutMethod);

      // If this is set as default, unset others
      if (payoutMethod.isDefault) {
        await this.setAsDefaultPayoutMethod(landlordUserId, methodId);
      }

      return newPayoutMethod;
    } catch (error) {
      console.error('Error adding payout method:', error);
      throw error;
    }
  }

  /**
   * Get landlord's default payout method
   */
  static async getDefaultPayoutMethod(landlordUserId: string): Promise<LandlordPayoutMethod | null> {
    try {
      const db = getClientDb();
      if (!db) return null;

      const q = query(
        collection(db, 'users', landlordUserId, 'payout_methods'),
        where('isDefault', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data() as LandlordPayoutMethod;
      }

      return null;
    } catch (error) {
      console.error('Error getting default payout method:', error);
      return null;
    }
  }

  /**
   * Get all payout methods for a landlord
   */
  static async getPayoutMethods(landlordUserId: string): Promise<LandlordPayoutMethod[]> {
    try {
      const db = getClientDb();
      if (!db) return [];

      const q = query(collection(db, 'users', landlordUserId, 'payout_methods'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as LandlordPayoutMethod);
    } catch (error) {
      console.error('Error getting payout methods:', error);
      return [];
    }
  }

  /**
   * Set a payout method as default
   */
  static async setAsDefaultPayoutMethod(landlordUserId: string, methodId: string): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      // Get all payout methods
      const payoutMethods = await this.getPayoutMethods(landlordUserId);
      
      // Update all methods to set isDefault to false
      for (const method of payoutMethods) {
        await updateDoc(doc(db, 'users', landlordUserId, 'payout_methods', method.id), {
          isDefault: false,
          updatedAt: new Date().toISOString()
        });
      }

      // Set the selected method as default
      await updateDoc(doc(db, 'users', landlordUserId, 'payout_methods', methodId), {
        isDefault: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error setting default payout method:', error);
      throw error;
    }
  }

  /**
   * Process automatic payout to landlord when payment is received
   */
  static async processPayoutToLandlord(
    landlordUserId: string,
    amount: number,
    paymentId: string
  ): Promise<void> {
    try {
      const payoutMethod = await this.getDefaultPayoutMethod(landlordUserId);
      if (!payoutMethod) {
        console.error('No payout method configured for landlord:', landlordUserId);
        return;
      }

      // Create payout request to Xendit
      const payoutData = {
        external_id: `payout_${paymentId}_${Date.now()}`,
        amount: amount,
        email: payoutMethod.ewalletNumber || payoutMethod.accountNumber,
        ...(payoutMethod.type === 'bank_account' && {
          bank_code: payoutMethod.bankCode,
          account_holder_name: payoutMethod.accountName,
          account_number: payoutMethod.accountNumber
        }),
        ...(payoutMethod.type === 'ewallet' && {
          ewallet_type: payoutMethod.ewalletCode
        })
      };

      const response = await this.makeRequest('/v2/payouts', 'POST', payoutData);
      console.log('Payout created:', response);

      // Update payment status
      await this.updatePaymentStatus(landlordUserId, paymentId, 'paid');
    } catch (error) {
      console.error('Error processing payout:', error);
      // Don't throw error - we'll retry later
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    landlordUserId: string,
    paymentId: string,
    status: RealPaymentRequest['status']
  ): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) return;

      await updateDoc(doc(db, 'users', landlordUserId, 'real_payments', paymentId), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  /**
   * Create split rule for payments
   */
  private static async createSplitRule(
    landlordUserId: string,
    payoutMethod: LandlordPayoutMethod
  ): Promise<string> {
    try {
      const splitRuleData = {
        name: `RentMatic Split Rule - ${landlordUserId}`,
        description: `Automatic split for landlord ${landlordUserId}`,
        actions: [
          {
            type: 'SPLIT',
            value: 'PERCENTAGE',
            value_amount: 2.5, // 2.5% platform fee
            destination: {
              type: 'ACCOUNT',
              account_id: process.env.XENDIT_MAIN_ACCOUNT_ID // Your main Xendit account
            }
          }
        ]
      };

      const response = await this.makeRequest('/v1/split_rules', 'POST', splitRuleData);
      return (response as any).id;
    } catch (error) {
      console.error('Error creating split rule:', error);
      throw error;
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

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}












