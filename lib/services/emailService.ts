import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailParams {
  to_email: string;
  to_name?: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  registration_link?: string;
  property_name?: string;
}

export class EmailService {
  static async sendTenantInvitation(params: {
    email: string;
    message?: string;
    propertyName?: string;
    registrationLink?: string;
    landlordName?: string;
    landlordEmail?: string;
  }): Promise<boolean> {
    try {
      const templateParams = {
        to_email: params.email,
        to_name: 'Tenant',
        from_name: params.landlordName || 'Property Manager',
        from_email: params.landlordEmail || 'noreply@rentmatic.com',
        subject: 'Tenant Registration Invitation - RentMatic',
        message: params.message || 'You have been invited to register as a tenant. Please use the link below to complete your registration.',
        registration_link: params.registrationLink || `${window.location.origin}/tenant-portal`,
        property_name: params.propertyName || 'Property'
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
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
      const templateParams = {
        to_email: params.email,
        to_name: params.tenantName,
        from_name: params.landlordName,
        from_email: 'noreply@rentmatic.com',
        subject: 'Welcome to RentMatic - Tenant Registration Complete',
        message: `Welcome ${params.tenantName}! Your tenant registration has been completed for ${params.propertyName}.`,
        property_name: params.propertyName
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Welcome email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
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
      const templateParams = {
        to_email: params.email,
        to_name: params.tenantName,
        from_name: params.landlordName,
        from_email: 'noreply@rentmatic.com',
        subject: `Rent Reminder - ${params.propertyName}`,
        message: `This is a friendly reminder that your rent of ₱${params.rentAmount.toLocaleString()} for ${params.unitName} is due on ${params.dueDate}.`,
        property_name: params.propertyName,
        unit_name: params.unitName,
        rent_amount: params.rentAmount,
        due_date: params.dueDate
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Rent reminder sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending rent reminder:', error);
      return false;
    }
  }
}

// Fallback email service for development/testing
export class MockEmailService {
  static async sendTenantInvitation(params: {
    email: string;
    message?: string;
    propertyName?: string;
    registrationLink?: string;
    landlordName?: string;
    landlordEmail?: string;
  }): Promise<boolean> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 Mock Email Sent:', {
      to: params.email,
      subject: 'Tenant Registration Invitation - RentMatic',
      message: params.message,
      registrationLink: params.registrationLink,
      propertyName: params.propertyName
    });
    
    return true;
  }

  static async sendWelcomeEmail(params: {
    email: string;
    tenantName: string;
    propertyName: string;
    landlordName: string;
  }): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 Mock Welcome Email Sent:', {
      to: params.email,
      tenantName: params.tenantName,
      propertyName: params.propertyName,
      landlordName: params.landlordName
    });
    
    return true;
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 Mock Rent Reminder Sent:', {
      to: params.email,
      tenantName: params.tenantName,
      propertyName: params.propertyName,
      unitName: params.unitName,
      rentAmount: params.rentAmount,
      dueDate: params.dueDate,
      landlordName: params.landlordName
    });
    
    return true;
  }
}

// Import EmailJS service
import { EmailJSService } from './emailJSService';

// Export the appropriate service based on environment
export const emailService = process.env.NODE_ENV === 'production' && 
  EMAILJS_SERVICE_ID !== 'your_service_id' ? EmailService : EmailJSService;
