import { getClientDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface LandlordAccount {
  id: string;
  userId: string;
  email: string;
  name: string;
  xenditSubAccountId?: string;
  xenditForUserId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDetails {
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
}

export class LandlordAccountService {
  private static readonly COLLECTION = 'landlord_accounts';

  /**
   * Create or get landlord account
   */
  static async createOrGetLandlordAccount(userId: string, userEmail: string, userName: string): Promise<LandlordAccount> {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

    try {
      // Check if account already exists
      const accountRef = doc(db, this.COLLECTION, userId);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        return { id: accountSnap.id, ...accountSnap.data() } as LandlordAccount;
      }

      // Create new account
      const accountData: Omit<LandlordAccount, 'id'> = {
        userId,
        email: userEmail,
        name: userName,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating landlord account:', { userId, email: userEmail, collection: this.COLLECTION });
      await setDoc(accountRef, accountData);
      console.log('Landlord account created successfully');
      
      return { id: userId, ...accountData };
    } catch (error: any) {
      console.error('Error in createOrGetLandlordAccount:', {
        code: error?.code,
        message: error?.message,
        userId,
        email: userEmail,
        collection: this.COLLECTION
      });
      throw error;
    }
  }

  /**
   * Create Xendit sub-account for landlord via Cloudflare Worker
   */
  static async createXenditSubAccount(landlordAccount: LandlordAccount): Promise<string> {
    try {
      console.log('Creating Xendit sub-account for:', landlordAccount.email);
      
      // Call Cloudflare Worker to create sub-account
      const workerUrl = 'https://xenditsecretkey.rentmatic495.workers.dev';
      const response = await fetch(`${workerUrl}/xendit/sub-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: landlordAccount.email,
          given_name: landlordAccount.name.split(' ')[0] || landlordAccount.name,
          family_name: landlordAccount.name.split(' ').slice(1).join(' ') || '',
          type: 'INDIVIDUAL'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Failed to create sub-account: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      // Update landlord account with Xendit details
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const accountRef = doc(db, this.COLLECTION, landlordAccount.id);
      await setDoc(accountRef, {
        xenditSubAccountId: result.id,
        xenditForUserId: result.id, // Same as sub-account ID for individual accounts
        status: 'active',
        updatedAt: new Date()
      }, { merge: true });

      console.log('Xendit sub-account created:', result.id);
      return result.id;
    } catch (error) {
      console.error('Error creating Xendit sub-account:', error);
      throw error;
    }
  }

  /**
   * Save bank details for landlord
   */
  static async saveBankDetails(userId: string, bankDetails: BankDetails): Promise<void> {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

    const bankRef = doc(db, 'users', userId, 'bank_details', 'primary');
    await setDoc(bankRef, {
      ...bankDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get landlord account
   */
  static async getLandlordAccount(userId: string): Promise<LandlordAccount | null> {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

    try {
      const accountRef = doc(db, this.COLLECTION, userId);
      const accountSnap = await getDoc(accountRef);

      if (!accountSnap.exists()) {
        return null;
      }

      return { id: accountSnap.id, ...accountSnap.data() } as LandlordAccount;
    } catch (error: any) {
      console.error('Error in getLandlordAccount:', {
        code: error?.code,
        message: error?.message,
        userId,
        collection: this.COLLECTION
      });
      throw error;
    }
  }

  /**
   * Get bank details
   */
  static async getBankDetails(userId: string): Promise<BankDetails | null> {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

    const bankRef = doc(db, 'users', userId, 'bank_details', 'primary');
    const bankSnap = await getDoc(bankRef);

    if (!bankSnap.exists()) {
      return null;
    }

    return bankSnap.data() as BankDetails;
  }
}










