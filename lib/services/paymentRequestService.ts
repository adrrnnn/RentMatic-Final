import { getClientDb } from '@/lib/firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { LandlordAccountService } from './landlordAccountService';
import { EmailJSService } from './emailJSService';
import { TenantService } from '@/lib/firestore/properties/tenantService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';

export interface PaymentRequest {
  id: string;
  landlordId: string;
  propertyId: string;
  tenantId: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  xenditInvoiceId?: string;
  xenditInvoiceUrl?: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  paymentMethods: string[];
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  receiptSent?: boolean;
}

export interface CreatePaymentRequestData {
  landlordId: string;
  propertyId: string;
  tenantId: string;
  amount: number;
  currency?: string;
  description: string;
  dueDate: Date;
  paymentMethods: string[];
}

export class PaymentRequestService {
  private static readonly COLLECTION = 'working_payments';

  /**
   * Create a payment request and Xendit invoice
   */
  static async createPaymentRequest(data: CreatePaymentRequestData): Promise<PaymentRequest> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // Get current auth user first to ensure we have the correct userId
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Ensure landlordId matches authenticated user
    const authUid = String(currentUser.uid).trim();
    const providedLandlordId = String(data.landlordId).trim();
    
    if (authUid !== providedLandlordId) {
      throw new Error(`Security check failed: landlordId "${providedLandlordId}" does not match authenticated user "${authUid}"`);
    }
    
    // Get landlord account to get Xendit for_user_id
    let landlordAccount;
    try {
      console.log('🔍 [PAYMENT] Step 1: Fetching landlord account for userId:', authUid);
      console.log('🔍 [PAYMENT] Auth user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      });
      
      landlordAccount = await LandlordAccountService.getLandlordAccount(authUid);
      console.log('✅ [PAYMENT] Landlord account fetched:', landlordAccount ? 'Found' : 'Not found');
      
      if (landlordAccount) {
        console.log('✅ [PAYMENT] Landlord account details:', {
          id: landlordAccount.id,
          userId: landlordAccount.userId,
          hasXenditForUserId: !!landlordAccount.xenditForUserId,
          status: landlordAccount.status
        });
      }
    } catch (error: any) {
      console.error('❌ [PAYMENT] Error fetching landlord account:', {
        code: error?.code,
        message: error?.message,
        userId: authUid,
        errorType: error?.constructor?.name,
        stack: error?.stack?.substring(0, 500)
      });
      
      // If it's a permission error, try to create the account instead
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.log('⚠️ [PAYMENT] Permission denied, attempting to create landlord account...');
        try {
          const userEmail = currentUser.email;
          const userName = currentUser.displayName || 'User';
          
          if (!userEmail) {
            throw new Error('User email not found. Please ensure your account has an email address.');
          }
          
          landlordAccount = await LandlordAccountService.createOrGetLandlordAccount(
            authUid,
            userEmail,
            userName
          );
          console.log('✅ [PAYMENT] Created landlord account:', landlordAccount);
        } catch (createError: any) {
          console.error('❌ [PAYMENT] Failed to create landlord account:', createError);
          throw new Error('Permission denied when accessing payment account. Please ensure you are logged in and try setting up your payment account again in the Payments tab.');
        }
      } else {
        throw new Error(`Failed to fetch landlord account: ${error?.message || 'Unknown error'}`);
      }
    }
    
    if (!landlordAccount) {
      // Try to get user info to create account if needed
      const userEmail = currentUser.email;
      const userName = currentUser.displayName || 'User';
      
      if (!userEmail) {
        throw new Error('User email not found. Please ensure your account has an email address.');
      }
      
      // Try to create the landlord account
      try {
        landlordAccount = await LandlordAccountService.createOrGetLandlordAccount(
          authUid,
          userEmail,
          userName
        );
        console.log('Created landlord account:', landlordAccount);
      } catch (createError: any) {
        console.error('Error creating landlord account:', createError);
        throw new Error('Landlord account not found and could not be created. Please complete payment setup first in the Payments tab (Management > Payment Methods).');
      }
    }
    
    if (!landlordAccount.xenditForUserId) {
      throw new Error('Payment account not configured. Please set up your payment account in the Payments tab (Management > Payment Methods).');
    }
    
    console.log('Creating payment request:', {
      tenantId: data.tenantId,
      amount: data.amount,
      for_user_id: landlordAccount.xenditForUserId,
      hasPaymentMethods: data.paymentMethods.length > 0
    });
    
    // Create Xendit invoice via Cloudflare Worker
    const workerUrl = 'https://rentmatic-xendit-api.rentmatic495.workers.dev';
    const invoiceResponse = await fetch(`${workerUrl}/xendit/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `rent_${Date.now()}_${data.tenantId}`,
        amount: data.amount,
        currency: data.currency || 'PHP',
        description: data.description,
        invoice_duration: (() => {
          const dueDateMs = data.dueDate.getTime();
          const nowMs = Date.now();
          const daysUntilDue = Math.ceil((dueDateMs - nowMs) / (1000 * 60 * 60 * 24));
          // Ensure minimum 7 days for sandbox testing, convert days to seconds
          const days = Math.max(7, daysUntilDue); // Minimum 7 days for sandbox
          return days * 24 * 60 * 60; // Convert days to seconds
        })(),
        for_user_id: landlordAccount.xenditForUserId,
        payment_methods: (() => {
          const validMethods = ['GCASH', 'PAYMAYA', 'GRABPAY', 'BPI', 'BDO', 'CREDIT_CARD', '7ELEVEN', 'CEBUANA'];
          const filtered = data.paymentMethods.filter(m => validMethods.includes(m));
          // If no valid methods, use defaults
          return filtered.length > 0 ? filtered : ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'];
        })(),
        should_send_email: true
      })
    });
    
    const calculatedDuration = (() => {
      const dueDateMs = data.dueDate.getTime();
      const nowMs = Date.now();
      const daysUntilDue = Math.ceil((dueDateMs - nowMs) / (1000 * 60 * 60 * 24));
      const days = Math.max(7, daysUntilDue);
      return days * 24 * 60 * 60;
    })();
    
    console.log('Invoice request payload:', {
      amount: data.amount,
      currency: data.currency || 'PHP',
      description: data.description,
      invoice_duration_seconds: calculatedDuration,
      invoice_duration_days: calculatedDuration / (24 * 60 * 60),
      payment_methods_count: data.paymentMethods.length,
      for_user_id: landlordAccount.xenditForUserId ? 'SET' : 'MISSING'
    });

    if (!invoiceResponse.ok) {
      // Try to get the response text first
      const responseText = await invoiceResponse.text();
      let errorMessage = invoiceResponse.statusText;
      let errorDetails: any = null;
      
      try {
        const errorData = JSON.parse(responseText);
        errorDetails = errorData;
        
        // Check for details field from Cloudflare Worker (contains Xendit error)
        if (errorData.details) {
          // Details might be a string (JSON) or already an object
          if (typeof errorData.details === 'string') {
            try {
              const xenditError = JSON.parse(errorData.details);
              errorMessage = xenditError.message || 
                            xenditError.error || 
                            (Array.isArray(xenditError.errors) ? xenditError.errors.map((e: any) => e.message || e).join(', ') : '') ||
                            errorData.details;
            } catch {
              errorMessage = errorData.details;
            }
          } else {
            errorMessage = errorData.details.message || errorData.details.error || JSON.stringify(errorData.details);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = responseText;
        }
      } catch {
        // If JSON parsing fails, use the raw text
        errorMessage = responseText || `HTTP ${invoiceResponse.status}: ${invoiceResponse.statusText}`;
      }
      
      console.error('❌ Xendit invoice creation failed:', {
        status: invoiceResponse.status,
        statusText: invoiceResponse.statusText,
        error: errorMessage,
        fullResponse: responseText,
        details: errorDetails
      });
      
      throw new Error(`Failed to create invoice: ${errorMessage}`);
    }

    const invoiceData = await invoiceResponse.json();

    // Save payment request to Firestore
    // Convert Date objects to Firestore Timestamps for compatibility
    const { Timestamp } = await import('firebase/firestore');

    // Prepare payment data - ensure landlordId is a string and matches auth.uid exactly
    const paymentData = {
      landlordId: String(authUid), // Explicitly convert to string
      propertyId: String(data.propertyId),
      tenantId: String(data.tenantId),
      amount: Number(data.amount),
      currency: String(data.currency || 'PHP'),
      description: String(data.description),
      dueDate: Timestamp.fromDate(data.dueDate),
      xenditInvoiceId: String(invoiceData.id),
      xenditInvoiceUrl: String(invoiceData.invoice_url),
      status: 'pending' as const,
      paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods.map(String) : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      receiptSent: false
    };

    console.log('✅ Saving payment to Firestore:', {
      collection: this.COLLECTION,
      landlordId: paymentData.landlordId,
      landlordIdType: typeof paymentData.landlordId,
      authUid: authUid,
      authUidType: typeof authUid,
      matches: paymentData.landlordId === authUid,
      strictEqual: paymentData.landlordId === String(authUid)
    });

    let paymentRef;
    try {
      console.log('🔍 [PAYMENT] Step 2: Preparing to write to Firestore...');
      console.log('🔍 [PAYMENT] Payment data:', {
        landlordId: paymentData.landlordId,
        landlordIdType: typeof paymentData.landlordId,
        authUid: authUid,
        authUidType: typeof authUid,
        matches: paymentData.landlordId === authUid,
        collection: this.COLLECTION
      });
      
      // Double-check auth before writing
      const authCheck = getAuth();
      const currentAuthUser = authCheck.currentUser;
      console.log('🔍 [PAYMENT] Auth check:', {
        hasAuth: !!authCheck,
        hasCurrentUser: !!currentAuthUser,
        currentUserUid: currentAuthUser?.uid,
        matches: currentAuthUser?.uid === authUid
      });
      
      if (!currentAuthUser || currentAuthUser.uid !== authUid) {
        throw new Error('Authentication check failed. Please refresh and try again.');
      }
      
      console.log('✅ [PAYMENT] Auth check passed, writing to Firestore...');
      paymentRef = await addDoc(collection(db, this.COLLECTION), paymentData);
      console.log('✅ [PAYMENT] Payment written successfully:', paymentRef.id);
    } catch (error: any) {
      console.error('❌ [PAYMENT] Firestore write error:', {
        code: error?.code,
        message: error?.message,
        collection: this.COLLECTION,
        landlordId: paymentData.landlordId,
        authUid: authUid,
        errorType: error?.constructor?.name,
        stack: error?.stack?.substring(0, 500)
      });
      
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied when saving payment. Please ensure you are logged in and your payment account is properly configured. Error code: permission-denied');
      }
      throw new Error(`Failed to save payment request: ${error?.message || 'Unknown error'}`);
    }
    
    console.log('Payment request created:', paymentRef.id);
    return { id: paymentRef.id, ...paymentData };
  }

  /**
   * Get a payment request by ID
   */
  static async getPaymentRequestById(paymentRequestId: string): Promise<PaymentRequest | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const { doc, getDoc } = await import('firebase/firestore');
    const paymentRef = doc(db, this.COLLECTION, paymentRequestId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return null;
    }

    const data = paymentSnap.data();
    return {
      id: paymentSnap.id,
      ...data,
      dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : (data.paidAt ? new Date(data.paidAt) : undefined)
    } as PaymentRequest;
  }

  /**
   * Get a payment request by Xendit invoice ID
   */
  static async getPaymentRequestByInvoiceId(xenditInvoiceId: string): Promise<PaymentRequest | null> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const paymentsQuery = query(
      collection(db, this.COLLECTION),
      where('xenditInvoiceId', '==', xenditInvoiceId)
    );

    const paymentsSnap = await getDocs(paymentsQuery);
    
    if (paymentsSnap.empty) {
      return null;
    }

    const data = paymentsSnap.docs[0].data();
    return {
      id: paymentsSnap.docs[0].id,
      ...data,
      dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : (data.paidAt ? new Date(data.paidAt) : undefined)
    } as PaymentRequest;
  }

  /**
   * Send payment receipt email
   */
  static async sendReceipt(paymentRequest: PaymentRequest): Promise<void> {
    try {
      // Skip if receipt already sent
      if (paymentRequest.receiptSent) {
        console.log(`Receipt already sent for payment ${paymentRequest.id}`);
        return;
      }

      // Fetch tenant, property, and unit details
      const tenant = await TenantService.getTenant(paymentRequest.landlordId, paymentRequest.tenantId);
      if (!tenant || !tenant.contact?.email) {
        console.warn(`Cannot send receipt: tenant not found or no email for payment ${paymentRequest.id}`);
        return;
      }

      const property = await PropertyService.getProperty(paymentRequest.landlordId, paymentRequest.propertyId);
      if (!property) {
        console.warn(`Cannot send receipt: property not found for payment ${paymentRequest.id}`);
        return;
      }

      // Get unit name if tenant has a unit
      let unitName: string | undefined;
      if (tenant.unitId && property) {
        try {
          const unit = await PropertyService.getUnit(paymentRequest.landlordId, paymentRequest.propertyId, tenant.unitId);
          unitName = unit?.name;
        } catch (error) {
          console.warn('Could not fetch unit for receipt:', error);
        }
      }

      const paidAt = paymentRequest.paidAt || new Date();
      const paidAtStr = paidAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Send receipt email
      await EmailJSService.sendPaymentReceipt({
        email: tenant.contact.email,
        tenantName: tenant.fullName,
        propertyName: property.name,
        unitName: unitName,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        invoiceId: paymentRequest.xenditInvoiceId || paymentRequest.id,
        paidAt: paidAtStr,
        landlordName: 'Property Manager'
      });

      // Mark receipt as sent in Firestore
      const db = getClientDb();
      if (db) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const paymentRef = doc(db, this.COLLECTION, paymentRequest.id);
        await updateDoc(paymentRef, {
          receiptSent: true,
          updatedAt: serverTimestamp()
        });
      }

      console.log(`✅ Receipt sent for payment ${paymentRequest.id} to ${tenant.contact.email}`);
    } catch (error) {
      console.error(`Error sending receipt for payment ${paymentRequest.id}:`, error);
      // Don't throw - receipt sending failure shouldn't block payment status update
    }
  }

  /**
   * Update payment status (called by webhook or polling)
   */
  static async updatePaymentStatus(
    xenditInvoiceId: string, 
    status: 'paid' | 'expired' | 'failed',
    paidAt?: Date
  ): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    // Find payment request by Xendit invoice ID
    const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
    const paymentsQuery = query(
      collection(db, this.COLLECTION),
      where('xenditInvoiceId', '==', xenditInvoiceId)
    );

    const paymentsSnap = await getDocs(paymentsQuery);
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${xenditInvoiceId}`);
      return;
    }

    // Update all matching payment requests
    const updatePromises = paymentsSnap.docs.map(async (doc) => {
      const paymentData = doc.data();
      const paymentRequest: PaymentRequest = {
        id: doc.id,
        ...paymentData,
        dueDate: paymentData.dueDate?.toDate ? paymentData.dueDate.toDate() : new Date(paymentData.dueDate),
        createdAt: paymentData.createdAt?.toDate ? paymentData.createdAt.toDate() : new Date(paymentData.createdAt),
        updatedAt: paymentData.updatedAt?.toDate ? paymentData.updatedAt.toDate() : new Date(paymentData.updatedAt),
        paidAt: paidAt || (paymentData.paidAt?.toDate ? paymentData.paidAt.toDate() : (paymentData.paidAt ? new Date(paymentData.paidAt) : undefined))
      } as PaymentRequest;

      // Update status - convert paidAt to Firestore Timestamp if provided
      // Normalize status to lowercase for consistency
      const { Timestamp } = await import('firebase/firestore');
      const normalizedStatus = String(status).toLowerCase().trim();
      const updateData: any = {
        status: normalizedStatus, // Ensure status is a string and lowercase
        updatedAt: serverTimestamp(),
      };
      
      if (paidAt) {
        updateData.paidAt = Timestamp.fromDate(paidAt);
        console.log(`[PAYMENT-UPDATE] Setting paidAt to:`, paidAt, 'as Timestamp:', updateData.paidAt);
      }
      
      console.log(`[PAYMENT-UPDATE] Updating payment ${doc.id} (invoice: ${xenditInvoiceId}) with status="${status}"`, {
        updateData,
        currentStatus: paymentData.status,
        newStatus: status
      });
      
      try {
        await updateDoc(doc.ref, updateData);
        console.log(`[PAYMENT-UPDATE] ✅ Successfully updated payment ${doc.id}`);
        
        // Double-check the update by reading back
        const { getDoc } = await import('firebase/firestore');
        const verifyDoc = await getDoc(doc.ref);
        if (verifyDoc.exists()) {
          const verifyData = verifyDoc.data();
          const verifyStatus = String(verifyData.status || '').toLowerCase().trim();
          console.log(`[PAYMENT-UPDATE] Verification readback: status="${verifyStatus}" (expected "${normalizedStatus}")`);
          if (verifyStatus !== normalizedStatus) {
            console.error(`[PAYMENT-UPDATE] ❌ Status mismatch! Expected "${normalizedStatus}" but got "${verifyStatus}"`);
          }
        }
      } catch (updateError: any) {
        console.error(`[PAYMENT-UPDATE] ❌ Error updating payment ${doc.id}:`, {
          error: updateError.message,
          code: updateError.code,
          updateData
        });
        throw updateError;
      }

      // Send receipt if payment is marked as paid and receipt hasn't been sent
      if (status === 'paid' && !paymentData.receiptSent) {
        paymentRequest.paidAt = paidAt || new Date();
        await this.sendReceipt(paymentRequest);
      }
    });

    await Promise.all(updatePromises);
  }

  /**
   * Get payment requests for a landlord
   */
  static async getPaymentRequests(landlordId: string): Promise<PaymentRequest[]> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      // Try with orderBy first (requires index)
      try {
        const paymentsQuery = query(
          collection(db, this.COLLECTION),
          where('landlordId', '==', landlordId),
          orderBy('createdAt', 'desc')
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        
        return paymentsSnap.docs.map(doc => {
          const data = doc.data();
          // Normalize status to lowercase and trim whitespace
          const normalizedStatus = String(data.status || 'pending').toLowerCase().trim() as 'pending' | 'paid' | 'expired' | 'failed';
          return {
            id: doc.id,
            ...data,
            status: normalizedStatus,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : new Date()),
            paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : (data.paidAt ? new Date(data.paidAt) : undefined)
          } as PaymentRequest;
        });
      } catch (orderByError) {
        // Fallback: fetch without orderBy (in case index doesn't exist)
        console.warn('OrderBy query failed, fetching without orderBy:', orderByError);
        const paymentsQuery = query(
          collection(db, this.COLLECTION),
          where('landlordId', '==', landlordId)
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        
        const payments = paymentsSnap.docs.map(doc => {
          const data = doc.data();
          // Normalize status to lowercase and trim whitespace
          const normalizedStatus = String(data.status || 'pending').toLowerCase().trim() as 'pending' | 'paid' | 'expired' | 'failed';
          return {
            id: doc.id,
            ...data,
            status: normalizedStatus,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : new Date()),
            paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : (data.paidAt ? new Date(data.paidAt) : undefined)
          } as PaymentRequest;
        });
        
        // Sort manually by createdAt descending
        return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw error;
    }
  }

  /**
   * Sync payment status from Xendit API
   * Checks Xendit invoice status and updates Firestore if changed
   */
  static async syncPaymentStatusFromXendit(
    xenditInvoiceId: string,
    workerUrl?: string
  ): Promise<{ updated: boolean; status: string }> {
    try {
      console.log(`[PAYMENT-SYNC] Fetching invoice status from Xendit for invoice: ${xenditInvoiceId}`);
      
      // Try Firebase Function first (works with Firebase Hosting static export)
      let response: Response;
      let useFirebaseFunction = true;
      const firebaseFunctionUrl = `https://us-central1-rentmatic-b24ff.cloudfunctions.net/syncXenditInvoice?invoiceId=${xenditInvoiceId}`;
      
      try {
        response = await fetch(firebaseFunctionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (firebaseError) {
        console.warn(`[PAYMENT-SYNC] Firebase Function failed, falling back to Cloudflare Worker:`, firebaseError);
        useFirebaseFunction = false;
        
        // Fallback to Cloudflare Worker if Firebase Function fails
        const fallbackUrl = workerUrl || 'https://rentmatic-xendit-api.rentmatic495.workers.dev';
        response = await fetch(`${fallbackUrl}/xendit/invoice/${xenditInvoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PAYMENT-SYNC] Sync error (${response.status}):`, errorText);
        
        // If Firebase Function says API key not configured, try Cloudflare Worker as fallback
        if (useFirebaseFunction && response.status === 500 && errorText.includes('Xendit API key not configured')) {
          console.log(`[PAYMENT-SYNC] Firebase Function not configured, trying Cloudflare Worker fallback...`);
          const fallbackUrl = workerUrl || 'https://rentmatic-xendit-api.rentmatic495.workers.dev';
          response = await fetch(`${fallbackUrl}/xendit/invoice/${xenditInvoiceId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            const fallbackErrorText = await response.text();
            console.error(`[PAYMENT-SYNC] Cloudflare Worker also failed (${response.status}):`, fallbackErrorText);
            throw new Error(`Failed to fetch invoice status: ${response.status} ${response.statusText}`);
          }
          useFirebaseFunction = false; // Switch to Cloudflare Worker response format
        } else {
          throw new Error(`Failed to fetch invoice status: ${response.status} ${response.statusText}`);
        }
      }

      const responseData = await response.json();
      console.log(`[PAYMENT-SYNC] Response data:`, responseData);
      
      // Handle Firebase Function response format (already updated Firestore)
      if (useFirebaseFunction && responseData.success) {
        const status = responseData.status || 'pending';
        const updated = responseData.updated || false;
        console.log(`[PAYMENT-SYNC] ✅ Payment status ${updated ? 'updated' : 'checked'} via Firebase Function: "${status}"`);
        return { updated, status };
      }
      
      // Handle Cloudflare Worker response format (need to update Firestore)
      const invoiceData = responseData;
      const xenditStatus = (invoiceData.status || '').toLowerCase();
      console.log(`[PAYMENT-SYNC] Xendit status (lowercase): "${xenditStatus}"`);
      
      // Map Xendit status to our status
      let ourStatus: 'paid' | 'expired' | 'failed' | 'pending' = 'pending';
      if (xenditStatus === 'paid' || xenditStatus === 'settled') {
        ourStatus = 'paid';
      } else if (xenditStatus === 'expired' || xenditStatus === 'voided' || xenditStatus === 'canceled') {
        ourStatus = 'expired';
      } else if (xenditStatus === 'failed') {
        ourStatus = 'failed';
      }

      // Always check current status in Firestore to see if update is needed
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const paymentsQuery = query(
        collection(db, this.COLLECTION),
        where('xenditInvoiceId', '==', xenditInvoiceId)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      
      if (paymentsSnap.empty) {
        console.warn(`[PAYMENT-SYNC] No payment found with invoice ID ${xenditInvoiceId}`);
        return { updated: false, status: ourStatus };
      }

      const currentPayment = paymentsSnap.docs[0].data();
      const currentStatus = String(currentPayment.status || '').toLowerCase().trim();
      const ourStatusLower = ourStatus.toLowerCase().trim();
      
      console.log(`[PAYMENT-SYNC] Invoice ${xenditInvoiceId}: Xendit status="${xenditStatus}", Firestore status="${currentStatus}", mapped status="${ourStatusLower}"`);
      
      // Update if status has changed (including updating from pending/expired to paid)
      // Use case-insensitive comparison with trim
      if (currentStatus !== ourStatusLower) {
        const paidAt = invoiceData.paid_at ? new Date(invoiceData.paid_at) : undefined;
        console.log(`[PAYMENT-SYNC] Updating payment ${paymentsSnap.docs[0].id} from "${currentStatus}" to "${ourStatus}"`);
        await this.updatePaymentStatus(xenditInvoiceId, ourStatus, paidAt);
        
        // Verify the update was successful by re-fetching
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for Firestore propagation
        const verifySnap = await getDocs(paymentsQuery);
        if (!verifySnap.empty) {
          const verifyData = verifySnap.docs[0].data();
          const verifyStatus = String(verifyData.status || '').toLowerCase().trim();
          console.log(`[PAYMENT-SYNC] Verification: Payment ${paymentsSnap.docs[0].id} status is now "${verifyStatus}" (expected "${ourStatusLower}")`);
          if (verifyStatus === ourStatusLower) {
            console.log(`[PAYMENT-SYNC] ✅ Successfully updated payment status from ${currentStatus} to ${ourStatus} for invoice ${xenditInvoiceId}`);
            return { updated: true, status: ourStatus };
          } else {
            console.warn(`[PAYMENT-SYNC] ⚠️ Status update may have failed. Expected "${ourStatusLower}" but got "${verifyStatus}"`);
            return { updated: false, status: verifyStatus };
          }
        }
        console.log(`[PAYMENT-SYNC] ✅ Successfully updated payment status from ${currentStatus} to ${ourStatus} for invoice ${xenditInvoiceId}`);
        return { updated: true, status: ourStatus };
      } else {
        console.log(`[PAYMENT-SYNC] Status already matches (${ourStatusLower}), no update needed`);
      }

      return { updated: false, status: ourStatus };
    } catch (error) {
      console.error('Error syncing payment status from Xendit:', error);
      throw error;
    }
  }

  /**
   * Sync all pending payment requests for a landlord
   * Also syncs expired payments that might have been paid
   */
  static async syncAllPaymentStatuses(
    landlordId: string,
    workerUrl: string = 'https://rentmatic-xendit-api.rentmatic495.workers.dev'
  ): Promise<{ synced: number; updated: number }> {
    try {
      const payments = await this.getPaymentRequests(landlordId);
      console.log(`[PAYMENT-SYNC] Found ${payments.length} total payments for landlord ${landlordId}`);
      
      // Sync ALL payments that have xenditInvoiceId (not just pending/expired)
      // This ensures we catch any payments that were paid but status wasn't updated
      const paymentsToSync = payments.filter(p => {
        const hasInvoiceId = !!p.xenditInvoiceId;
        if (!hasInvoiceId) {
          console.log(`[PAYMENT-SYNC] Skipping payment ${p.id} - no xenditInvoiceId`);
        }
        return hasInvoiceId;
      });

      console.log(`[PAYMENT-SYNC] Syncing ${paymentsToSync.length} payments with Xendit invoice IDs`);

      let updated = 0;
      let errors = 0;
      for (const payment of paymentsToSync) {
        try {
          console.log(`[PAYMENT-SYNC] Checking payment ${payment.id} (current status: ${payment.status}, invoice: ${payment.xenditInvoiceId})`);
          const result = await this.syncPaymentStatusFromXendit(payment.xenditInvoiceId!, workerUrl);
          if (result.updated) {
            updated++;
            console.log(`[PAYMENT-SYNC] ✅ Updated payment ${payment.id} from ${payment.status} to ${result.status}`);
          } else {
            console.log(`[PAYMENT-SYNC] ⏭️ Payment ${payment.id} status unchanged (${result.status})`);
          }
        } catch (error: any) {
          errors++;
          // Don't log full error stack for API key errors - it's expected if Worker isn't configured
          if (error?.message?.includes('Xendit API key not configured') || error?.message?.includes('500')) {
            console.warn(`[PAYMENT-SYNC] ⚠️ Cannot sync payment ${payment.id}: Cloudflare Worker not configured (Xendit API key missing)`);
          } else {
            console.error(`[PAYMENT-SYNC] ❌ Error syncing payment ${payment.id}:`, error);
          }
        }
      }
      
      if (errors > 0 && errors === paymentsToSync.length) {
        console.warn(`[PAYMENT-SYNC] ⚠️ All ${errors} payment sync attempts failed. This is likely because the Cloudflare Worker XENDIT_SECRET_KEY is not configured. Payments will still display based on their current Firestore status.`);
      }

      console.log(`[PAYMENT-SYNC] Complete: Synced ${paymentsToSync.length} payments, updated ${updated}`);
      return { synced: paymentsToSync.length, updated };
    } catch (error) {
      console.error('[PAYMENT-SYNC] Error syncing all payment statuses:', error);
      throw error;
    }
  }

  /**
   * Delete a payment request
   */
  static async deletePaymentRequest(paymentId: string, landlordId: string): Promise<void> {
    const db = getClientDb();
    if (!db) throw new Error('Firestore not initialized');

    try {
      const { doc, deleteDoc, getDoc } = await import('firebase/firestore');
      const paymentRef = doc(db, this.COLLECTION, paymentId);
      
      // Verify the payment belongs to the landlord
      const paymentSnap = await getDoc(paymentRef);
      if (!paymentSnap.exists()) {
        throw new Error('Payment request not found');
      }

      const paymentData = paymentSnap.data();
      if (paymentData.landlordId !== landlordId) {
        throw new Error('Unauthorized: Payment does not belong to this landlord');
      }

      // Only allow deletion of pending or expired payments (not paid ones)
      if (paymentData.status === 'paid') {
        throw new Error('Cannot delete paid payments');
      }

      await deleteDoc(paymentRef);
      console.log(`Payment request ${paymentId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting payment request:', error);
      throw error;
    }
  }
}
