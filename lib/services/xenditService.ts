import { getClientDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'ewallet' | 'bank' | 'card' | 'retail';
  icon: string;
  description: string;
  enabled: boolean;
}

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  created: string;
}

export interface CreateSubAccountRequest {
  name: string;
  email: string;
  type: string;
}

export interface PaymentRequest {
  external_id: string;
  amount: number;
  description: string;
  invoice_duration: number;
  customer: {
    given_names: string;
    email: string;
  };
  customer_notification_preference: {
    invoice_created: string[];
    invoice_reminder: string[];
    invoice_paid: string[];
  };
  success_redirect_url: string;
  failure_redirect_url: string;
  currency: string;
  payment_methods: string[];
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  amount: number;
  description: string;
  status: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
}

export interface Invoice {
  id: string;
  external_id: string;
  amount: number;
  description: string;
  status: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
}

export interface PaymentHistoryItem {
  id: string;
  external_id: string;
  tenant_email: string;
  tenant_name: string;
  amount: number;
  description: string;
  unit_name: string;
  property_name: string;
  status: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
}

export class XenditService {
  private static readonly API_BASE = 'https://api.xendit.co';
  private static readonly API_KEY = process.env.XENDIT_API_KEY || 'xnd_development_VRqY7U2iYPEF71ZeP4NuwGvjpss59jXWV1Zd4LGoRJGK3NEE61QSiMPA77Ugm';

  /**
   * Make authenticated request to Xendit API
   */
  private static async makeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Xendit API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Create a sub-account for a landlord
   */
  static async createSubAccount(request: CreateSubAccountRequest): Promise<SubAccount> {
    try {
      const response = await this.makeRequest('/v1/accounts', 'POST', request);
      
      // Save sub-account to Firestore
      const db = getClientDb();
      if (db) {
        await setDoc(doc(db, 'sub_accounts', response.id), {
          id: response.id,
          name: response.name,
          email: response.email,
          type: response.type,
          status: response.status,
          created: response.created,
          updated: new Date().toISOString()
        });
      }

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        type: response.type,
        status: response.status,
        created: response.created
      };
    } catch (error) {
      console.error('Error creating sub-account:', error);
      throw new Error(`Failed to create sub-account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sub-account details
   */
  static async getSubAccount(subAccountId: string): Promise<SubAccount | null> {
    try {
      const response = await this.makeRequest(`/v1/accounts/${subAccountId}`, 'GET');
      return {
        id: response.id,
        name: response.name,
        email: response.email,
        type: response.type,
        status: response.status,
        created: response.created
      };
    } catch (error) {
      console.error('Error getting sub-account:', error);
      return null;
    }
  }

  /**
   * Create payment invoice
   */
  static async createPaymentInvoice(
    landlordUserId: string,
    tenantEmail: string,
    tenantName: string,
    amount: number,
    description: string,
    unitName: string,
    propertyName: string
  ): Promise<Invoice> {
    try {
      // Get landlord's sub-account
      const subAccount = await this.getSubAccount(landlordUserId);
      if (!subAccount) {
        throw new Error('Landlord payment account not found');
      }

      const externalId = `rent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentRequest: PaymentRequest = {
        external_id: externalId,
        amount: amount,
        description: `${description} - ${unitName} at ${propertyName}`,
        invoice_duration: 7 * 24 * 60 * 60, // 7 days in seconds
        customer: {
          given_names: tenantName,
          email: tenantEmail
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failure`,
        currency: 'PHP',
        payment_methods: ['EWALLET', 'BANK_TRANSFER', 'RETAIL_OUTLET', 'CREDIT_CARD']
      };

      const response = await this.makeRequest('/v2/invoices', 'POST', paymentRequest);
      const invoice = response as XenditInvoice;
      
      // Save invoice to Firestore
      const db = getClientDb();
      if (db) {
        await setDoc(doc(db, 'users', landlordUserId, 'payments', invoice.id), {
          id: invoice.id,
          external_id: invoice.external_id,
          tenant_email: tenantEmail,
          tenant_name: tenantName,
          amount: amount,
          description: description,
          unit_name: unitName,
          property_name: propertyName,
          status: invoice.status,
          invoice_url: invoice.invoice_url,
          expiry_date: invoice.expiry_date,
          created: invoice.created,
          updated: new Date().toISOString()
        });
      }

      return {
        id: invoice.id,
        external_id: invoice.external_id,
        amount: invoice.amount,
        description: invoice.description,
        status: invoice.status,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
        created: invoice.created
      };
    } catch (error) {
      console.error('Error creating payment invoice:', error);
      throw new Error(`Failed to create payment invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available payment methods
   */
  static async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    // IDs align with Xendit worker usage; icons map to local logos in /public/payment-logos
    return [
      { id: 'GCASH', name: 'GCash', type: 'ewallet', icon: 'gcash', description: 'Pay via GCash', enabled: true },
      { id: 'PAYMAYA', name: 'Maya', type: 'ewallet', icon: 'maya', description: 'Pay via Maya (PayMaya)', enabled: true },
      { id: 'GRABPAY', name: 'GrabPay', type: 'ewallet', icon: 'grabpay', description: 'Pay via GrabPay', enabled: true },
      { id: 'BPI', name: 'BPI', type: 'bank', icon: 'bpi', description: 'Pay via BPI online', enabled: true },
      { id: 'BDO', name: 'BDO', type: 'bank', icon: 'bdo', description: 'Pay via BDO online', enabled: true },
      { id: 'CREDIT_CARD', name: 'Credit Card', type: 'card', icon: 'credit_card', description: 'Visa/Mastercard/JCB', enabled: true },
      { id: '7ELEVEN', name: '7‑Eleven', type: 'retail', icon: '7eleven', description: 'Pay at 7‑Eleven', enabled: true },
      { id: 'CEBUANA', name: 'Cebuana Lhuillier', type: 'retail', icon: 'cebuana', description: 'Pay at Cebuana', enabled: true },
    ];
  }

  /**
   * Get payment history for a landlord
   */
  static async getPaymentHistory(landlordUserId: string): Promise<PaymentHistoryItem[]> {
    try {
      const db = getClientDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const paymentsRef = collection(db, 'users', landlordUserId, 'payments');
      const snapshot = await getDocs(paymentsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        external_id: doc.data().external_id,
        tenant_email: doc.data().tenant_email,
        tenant_name: doc.data().tenant_name,
        amount: doc.data().amount,
        description: doc.data().description,
        unit_name: doc.data().unit_name,
        property_name: doc.data().property_name,
        status: doc.data().status,
        invoice_url: doc.data().invoice_url,
        expiry_date: doc.data().expiry_date,
        created: doc.data().created,
        updated: doc.data().updated
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    try {
      const db = getClientDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Find the payment document
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('id', '==', paymentId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Payment not found');
      }

      const paymentDoc = snapshot.docs[0];
      await updateDoc(paymentDoc.ref, {
        status: status,
        updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    // Note: In a real implementation, you'd use Node.js crypto module
    // For now, we'll do a simple comparison (not secure for production)
    return signature === 'valid_signature';
  }
}