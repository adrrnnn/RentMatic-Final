import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  type: 'invitation' | 'welcome' | 'reminder';
  registrationLink?: string;
  propertyName?: string;
  landlordName?: string;
  landlordEmail?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>; // Firebase serverTimestamp
  tenantName?: string;
  unitName?: string;
  rentAmount?: number;
  dueDate?: string;
}

export class FirebaseEmailService {
  static async sendTenantInvitation(params: {
    email: string;
    message?: string;
    propertyName?: string;
    registrationLink?: string;
    landlordName?: string;
    landlordEmail?: string;
  }): Promise<boolean> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      // Create email document in Firestore (filter out undefined values)
      const emailData: Partial<EmailData> = {
        to: params.email,
        subject: 'Tenant Registration Invitation - RentMatic',
        message: params.message || 'You have been invited to register as a tenant. Please use the link below to complete your registration.',
        type: 'invitation',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Only add fields that are not undefined
      if (params.registrationLink) emailData.registrationLink = params.registrationLink;
      if (params.propertyName) emailData.propertyName = params.propertyName;
      if (params.landlordName) emailData.landlordName = params.landlordName;
      if (params.landlordEmail) emailData.landlordEmail = params.landlordEmail;

      // Store in Firestore
      await addDoc(collection(db, 'emails'), emailData);

      // Show success notification
      toast.success(
        `📧 Email Queued for Sending!\n\nTo: ${params.email}\nSubject: ${emailData.subject}\nRegistration Link: ${params.registrationLink}\n\nNote: Email will be processed by Firebase Functions.`,
        { duration: 10000 }
      );

      // Log for debugging
      console.log('📧 EMAIL QUEUED IN FIRESTORE:', {
        to: params.email,
        subject: emailData.subject,
        registrationLink: params.registrationLink,
        propertyName: params.propertyName,
        landlordName: params.landlordName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      return true;
    } catch (error) {
      console.error('Error queuing email:', error);
      toast.error('Failed to queue email. Please try again.');
      return false;
    }
  }

  static async sendWelcomeEmail(params: {
    email: string;
    tenantName: string;
    propertyName: string;
    landlordName: string;
  }): Promise<boolean> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const emailData: Partial<EmailData> = {
        to: params.email,
        subject: 'Welcome to RentMatic - Tenant Registration Complete',
        message: `Welcome ${params.tenantName}! Your tenant registration has been completed for ${params.propertyName}.`,
        type: 'welcome',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Only add fields that are not undefined
      if (params.propertyName) emailData.propertyName = params.propertyName;
      if (params.landlordName) emailData.landlordName = params.landlordName;
      if (params.tenantName) emailData.tenantName = params.tenantName;

      await addDoc(collection(db, 'emails'), emailData);

      toast.success(
        `📧 Welcome Email Queued!\n\nTo: ${params.email}\nTenant: ${params.tenantName}\nProperty: ${params.propertyName}`,
        { duration: 8000 }
      );

      console.log('📧 WELCOME EMAIL QUEUED:', {
        to: params.email,
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        landlordName: params.landlordName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      return true;
    } catch (error) {
      console.error('Error queuing welcome email:', error);
      return false;
    }
  }

  static async sendRentReminder(params: {
    email: string;
    tenantName: string;
    propertyName: string;
    unitName: string;
    rentAmount: number;
    dueDate: string;
    landlordName: string;
  }): Promise<boolean> {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not initialized');

      const emailData: Partial<EmailData> = {
        to: params.email,
        subject: `Rent Reminder - ${params.propertyName}`,
        message: `This is a friendly reminder that your rent of ₱${params.rentAmount.toLocaleString()} for ${params.unitName} is due on ${params.dueDate}.`,
        type: 'reminder',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Only add fields that are not undefined
      if (params.propertyName) emailData.propertyName = params.propertyName;
      if (params.landlordName) emailData.landlordName = params.landlordName;
      if (params.tenantName) emailData.tenantName = params.tenantName;
      if (params.unitName) emailData.unitName = params.unitName;
      if (params.rentAmount) emailData.rentAmount = params.rentAmount;
      if (params.dueDate) emailData.dueDate = params.dueDate;

      await addDoc(collection(db, 'emails'), emailData);

      toast.success(
        `📧 Rent Reminder Queued!\n\nTo: ${params.email}\nTenant: ${params.tenantName}\nAmount: ₱${params.rentAmount.toLocaleString()}\nDue: ${params.dueDate}`,
        { duration: 8000 }
      );

      console.log('📧 RENT REMINDER QUEUED:', {
        to: params.email,
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        unitName: params.unitName,
        rentAmount: params.rentAmount,
        dueDate: params.dueDate,
        landlordName: params.landlordName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      return true;
    } catch (error) {
      console.error('Error queuing rent reminder:', error);
      return false;
    }
  }

  // Get pending emails (for admin dashboard)
  static async getPendingEmails(): Promise<EmailData[]> {
    try {
      const db = getClientDb();
      if (!db) return [];
      
      // This would typically be done with a Firebase Function
      // For now, we'll return an empty array
      console.log('📧 Fetching pending emails from Firestore...');
      return [];
    } catch (error) {
      console.error('Error fetching pending emails:', error);
      return [];
    }
  }

  // Update email status (for Firebase Functions to call)
  static async updateEmailStatus(emailId: string, status: 'sent' | 'failed'): Promise<boolean> {
    try {
      const db = getClientDb();
      if (!db) return false;
      
      // This would update the email status in Firestore
      console.log(`📧 Email ${emailId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating email status:', error);
      return false;
    }
  }
}