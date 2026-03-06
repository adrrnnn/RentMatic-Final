// Xendit xenPlatform API integration for RentMatic marketplace

export interface SubAccount {
  id: string;
  email: string;
  type: 'OWNED' | 'MANAGED';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  public_profile: {
    business_name: string;
    business_type: string;
  };
  created: string;
  updated: string;
}

export interface CreateSubAccountRequest {
  email: string;
  type: 'OWNED' | 'MANAGED';
  public_profile: {
    business_name: string;
    business_type: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SplitPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  sub_account_id: string;
  platform_fee_percentage?: number;
  platform_fee_amount?: number;
  metadata?: Record<string, unknown>;
}

export interface SplitPaymentResponse {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  sub_account_id: string;
  platform_fee: number;
  net_amount: number;
  created: string;
}

export class XenPlatformService {
  private static readonly API_BASE = 'https://api.xendit.co';
  private static readonly API_KEY = 'xnd_development_VRqY7U2iYPEF71ZeP4NuwGvjpss59jXWV1Zd4LGoRJGK3NEE61QSiMPA77Ugm';

  /**
   * Create a sub-account for a landlord
   */
  static async createSubAccount(request: CreateSubAccountRequest): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: request.email,
          type: request.type,
          public_profile: request.public_profile,
          metadata: {
            ...request.metadata,
            platform: 'RentMatic',
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XenPlatform API error:', response.status, response.statusText, errorText);
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error creating sub-account:', error);
      throw error;
    }
  }

  /**
   * Get sub-account details
   */
  static async getSubAccount(accountId: string): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error getting sub-account:', error);
      throw error;
    }
  }

  /**
   * List all sub-accounts
   */
  static async listSubAccounts(): Promise<SubAccount[]> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error listing sub-accounts:', error);
      throw error;
    }
  }

  /**
   * Create a split payment to route funds to landlord's sub-account
   */
  static async createSplitPayment(request: SplitPaymentRequest): Promise<SplitPaymentResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/split_payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          sub_account_id: request.sub_account_id,
          platform_fee_percentage: request.platform_fee_percentage || 2.5, // Default 2.5% platform fee
          platform_fee_amount: request.platform_fee_amount,
          metadata: {
            ...request.metadata,
            platform: 'RentMatic',
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XenPlatform Split Payment API error:', response.status, response.statusText, errorText);
        throw new Error(`XenPlatform Split Payment API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const splitPayment = await response.json();
      return splitPayment;
    } catch (error) {
      console.error('Error creating split payment:', error);
      throw error;
    }
  }

  /**
   * Create a payment request that routes to landlord's sub-account
   */
  static async createPaymentWithSplit(
    amount: number,
    currency: string,
    description: string,
    landlordSubAccountId: string,
    tenantEmail: string,
    tenantName: string,
    platformFeePercentage: number = 2.5
  ): Promise<{
    paymentUrl: string;
    splitPaymentId: string;
    platformFee: number;
    netAmount: number;
  }> {
    try {
      // Calculate platform fee and net amount
      const platformFee = (amount * platformFeePercentage) / 100;
      const netAmount = amount - platformFee;

      // Create split payment first
      const splitPayment = await this.createSplitPayment({
        amount,
        currency,
        description,
        sub_account_id: landlordSubAccountId,
        platform_fee_percentage: platformFeePercentage,
        metadata: {
          tenant_email: tenantEmail,
          tenant_name: tenantName,
          payment_type: 'rent_payment'
        }
      });

      // Create invoice that will be routed to the sub-account
      const invoiceResponse = await fetch(`${this.API_BASE}/v2/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_id: `rent_${Date.now()}_${landlordSubAccountId}`,
          amount: amount,
          description: description,
          currency: currency,
          customer: {
            given_names: tenantName,
            email: tenantEmail
          },
          items: [{
            name: description,
            quantity: 1,
            price: amount,
            category: 'Rent Payment'
          }],
          should_send_email: true,
          success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/success`,
          failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/failure`,
          metadata: {
            split_payment_id: splitPayment.id,
            landlord_sub_account_id: landlordSubAccountId,
            platform_fee: platformFee,
            net_amount: netAmount
          }
        })
      });

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error('Xendit Invoice API error:', invoiceResponse.status, invoiceResponse.statusText, errorText);
        throw new Error(`Xendit Invoice API error: ${invoiceResponse.status} ${invoiceResponse.statusText} - ${errorText}`);
      }

      const invoice = await invoiceResponse.json();

      return {
        paymentUrl: invoice.invoice_url,
        splitPaymentId: splitPayment.id,
        platformFee,
        netAmount
      };
    } catch (error) {
      console.error('Error creating payment with split:', error);
      throw error;
    }
  }

  /**
   * Get split payment status
   */
  static async getSplitPaymentStatus(splitPaymentId: string): Promise<SplitPaymentResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/split_payments/${splitPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const splitPayment = await response.json();
      return splitPayment;
    } catch (error) {
      console.error('Error getting split payment status:', error);
      throw error;
    }
  }

  /**
   * Update sub-account status
   */
  static async updateSubAccountStatus(accountId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error updating sub-account status:', error);
      throw error;
    }
  }
}

export interface SubAccount {
  id: string;
  email: string;
  type: 'OWNED' | 'MANAGED';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  public_profile: {
    business_name: string;
    business_type: string;
  };
  created: string;
  updated: string;
}

export interface CreateSubAccountRequest {
  email: string;
  type: 'OWNED' | 'MANAGED';
  public_profile: {
    business_name: string;
    business_type: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SplitPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  sub_account_id: string;
  platform_fee_percentage?: number;
  platform_fee_amount?: number;
  metadata?: Record<string, unknown>;
}

export interface SplitPaymentResponse {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  sub_account_id: string;
  platform_fee: number;
  net_amount: number;
  created: string;
}

export class XenPlatformService {
  private static readonly API_BASE = 'https://api.xendit.co';
  private static readonly API_KEY = 'xnd_development_VRqY7U2iYPEF71ZeP4NuwGvjpss59jXWV1Zd4LGoRJGK3NEE61QSiMPA77Ugm';

  /**
   * Create a sub-account for a landlord
   */
  static async createSubAccount(request: CreateSubAccountRequest): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: request.email,
          type: request.type,
          public_profile: request.public_profile,
          metadata: {
            ...request.metadata,
            platform: 'RentMatic',
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XenPlatform API error:', response.status, response.statusText, errorText);
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error creating sub-account:', error);
      throw error;
    }
  }

  /**
   * Get sub-account details
   */
  static async getSubAccount(accountId: string): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error getting sub-account:', error);
      throw error;
    }
  }

  /**
   * List all sub-accounts
   */
  static async listSubAccounts(): Promise<SubAccount[]> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error listing sub-accounts:', error);
      throw error;
    }
  }

  /**
   * Create a split payment to route funds to landlord's sub-account
   */
  static async createSplitPayment(request: SplitPaymentRequest): Promise<SplitPaymentResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/split_payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          sub_account_id: request.sub_account_id,
          platform_fee_percentage: request.platform_fee_percentage || 2.5, // Default 2.5% platform fee
          platform_fee_amount: request.platform_fee_amount,
          metadata: {
            ...request.metadata,
            platform: 'RentMatic',
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XenPlatform Split Payment API error:', response.status, response.statusText, errorText);
        throw new Error(`XenPlatform Split Payment API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const splitPayment = await response.json();
      return splitPayment;
    } catch (error) {
      console.error('Error creating split payment:', error);
      throw error;
    }
  }

  /**
   * Create a payment request that routes to landlord's sub-account
   */
  static async createPaymentWithSplit(
    amount: number,
    currency: string,
    description: string,
    landlordSubAccountId: string,
    tenantEmail: string,
    tenantName: string,
    platformFeePercentage: number = 2.5
  ): Promise<{
    paymentUrl: string;
    splitPaymentId: string;
    platformFee: number;
    netAmount: number;
  }> {
    try {
      // Calculate platform fee and net amount
      const platformFee = (amount * platformFeePercentage) / 100;
      const netAmount = amount - platformFee;

      // Create split payment first
      const splitPayment = await this.createSplitPayment({
        amount,
        currency,
        description,
        sub_account_id: landlordSubAccountId,
        platform_fee_percentage: platformFeePercentage,
        metadata: {
          tenant_email: tenantEmail,
          tenant_name: tenantName,
          payment_type: 'rent_payment'
        }
      });

      // Create invoice that will be routed to the sub-account
      const invoiceResponse = await fetch(`${this.API_BASE}/v2/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_id: `rent_${Date.now()}_${landlordSubAccountId}`,
          amount: amount,
          description: description,
          currency: currency,
          customer: {
            given_names: tenantName,
            email: tenantEmail
          },
          items: [{
            name: description,
            quantity: 1,
            price: amount,
            category: 'Rent Payment'
          }],
          should_send_email: true,
          success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/success`,
          failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/failure`,
          metadata: {
            split_payment_id: splitPayment.id,
            landlord_sub_account_id: landlordSubAccountId,
            platform_fee: platformFee,
            net_amount: netAmount
          }
        })
      });

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error('Xendit Invoice API error:', invoiceResponse.status, invoiceResponse.statusText, errorText);
        throw new Error(`Xendit Invoice API error: ${invoiceResponse.status} ${invoiceResponse.statusText} - ${errorText}`);
      }

      const invoice = await invoiceResponse.json();

      return {
        paymentUrl: invoice.invoice_url,
        splitPaymentId: splitPayment.id,
        platformFee,
        netAmount
      };
    } catch (error) {
      console.error('Error creating payment with split:', error);
      throw error;
    }
  }

  /**
   * Get split payment status
   */
  static async getSplitPaymentStatus(splitPaymentId: string): Promise<SplitPaymentResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/split_payments/${splitPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const splitPayment = await response.json();
      return splitPayment;
    } catch (error) {
      console.error('Error getting split payment status:', error);
      throw error;
    }
  }

  /**
   * Update sub-account status
   */
  static async updateSubAccountStatus(accountId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<SubAccount> {
    try {
      const response = await fetch(`${this.API_BASE}/v1/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${btoa(this.API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`XenPlatform API error: ${response.status} ${response.statusText}`);
      }

      const subAccount = await response.json();
      return subAccount;
    } catch (error) {
      console.error('Error updating sub-account status:', error);
      throw error;
    }
  }
}


