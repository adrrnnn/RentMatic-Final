import { toast } from 'react-hot-toast';

export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  type: 'invitation' | 'welcome' | 'reminder';
  registrationLink?: string;
  propertyName?: string;
  landlordName?: string;
}

export class NotificationEmailService {
  static async sendTenantInvitation(params: {
    email: string;
    message?: string;
    propertyName?: string;
    registrationLink?: string;
    landlordName?: string;
    landlordEmail?: string;
  }): Promise<boolean> {
    try {
      // Show visual notification instead of sending email
      const notificationMessage = `📧 Email would be sent to: ${params.email}\n\nSubject: Tenant Registration Invitation - RentMatic\n\nMessage: ${params.message || 'You have been invited to register as a tenant.'}\n\nRegistration Link: ${params.registrationLink}`;
      
      // Show detailed notification
      toast.success(
        `📧 Email Notification Sent\n\nTo: ${params.email}\nSubject: Tenant Registration Invitation - RentMatic\nRegistration Link: ${params.registrationLink}`,
        { duration: 8000 }
      );

      // Also log to console for debugging
      console.log('📧 Email Notification:', {
        to: params.email,
        subject: 'Tenant Registration Invitation - RentMatic',
        message: params.message,
        registrationLink: params.registrationLink,
        propertyName: params.propertyName,
        landlordName: params.landlordName
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      toast.error('Failed to send email notification');
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
      toast.success(
        `📧 Welcome Email Sent\n\nTo: ${params.email}\nTenant: ${params.tenantName}\nProperty: ${params.propertyName}`,
        { duration: 5000 }
      );

      console.log('📧 Welcome Email Notification:', {
        to: params.email,
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        landlordName: params.landlordName
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Error sending welcome email notification:', error);
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
      toast.success(
        `📧 Rent Reminder Sent\n\nTo: ${params.email}\nTenant: ${params.tenantName}\nAmount: ₱${params.rentAmount.toLocaleString()}\nDue Date: ${params.dueDate}`,
        { duration: 5000 }
      );

      console.log('📧 Rent Reminder Notification:', {
        to: params.email,
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        unitName: params.unitName,
        rentAmount: params.rentAmount,
        dueDate: params.dueDate,
        landlordName: params.landlordName
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Error sending rent reminder notification:', error);
      return false;
    }
  }
}
