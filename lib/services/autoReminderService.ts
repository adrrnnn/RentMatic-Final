import { EmailJSService } from './emailJSService';
import { PaymentRequestService } from './paymentRequestService';
import { PropertyService } from '../firestore/properties/propertyService';
import { UnitService } from '../firestore/properties/unitService';
import { TenantService } from '../firestore/properties/tenantService';
import { Property, Unit, Tenant } from '@/types/firestore';

export class AutoReminderService {
  /**
   * Process reminders for all units in all properties for a user
   * Call this on dashboard load or via scheduled task
   */
  static async processAllReminders(userId: string): Promise<void> {
    try {
      // Get all properties for the user
      const properties = await PropertyService.getProperties(userId);
      
      // Process each property
      for (const property of properties) {
        try {
          // Get all units for this property
          const units = await UnitService.getUnits(userId, property.id);
          
          // Process each unit
          for (const unit of units) {
            try {
              await this.processUnitReminders(userId, property.id, unit.id);
            } catch (error) {
              console.error(`Error processing reminders for unit ${unit.id}:`, error);
              // Continue with next unit
            }
          }
        } catch (error) {
          console.error(`Error processing reminders for property ${property.id}:`, error);
          // Continue with next property
        }
      }
    } catch (error) {
      console.error('Error processing all reminders:', error);
    }
  }

  /**
   * Process reminders for a specific unit when billing settings are saved
   */
  static async processUnitReminders(userId: string, propertyId: string, unitId: string): Promise<void> {
    try {
      // Get the unit and property data
      const unit = await UnitService.getUnit(userId, propertyId, unitId);
      const property = await PropertyService.getProperty(userId, propertyId);
      
      if (!unit || !property) {
        return;
      }

      // Use unit-level settings if available, otherwise fallback to property-level defaults
      const billingSettings = unit.billingSettings || (property.billingDefaults ? {
        dueDay: property.billingDefaults.dueDay || 1,
        graceDays: property.billingDefaults.graceDays || 3,
        lateFeeType: property.billingDefaults.lateFeeType || 'flat' as const,
        lateFeeValue: property.billingDefaults.lateFeeValue || 0,
        reminderDaysBefore: property.billingDefaults.reminderDaysBefore || [],
        autoSendReminders: true, // Default to true if property-level settings exist
        currency: 'PHP' as const
      } : null);

      // If no billing settings at all, skip
      if (!billingSettings || !billingSettings.autoSendReminders) {
        return;
      }

      // Get tenant if unit is occupied
      let tenant: Tenant | null = null;
      if (unit.tenantId) {
        tenant = await TenantService.getTenant(userId, unit.tenantId);
      }

      if (!tenant || !tenant.contact?.email) {
        console.log(`No tenant email found for unit ${unitId}, skipping reminders`);
        return;
      }

      // Check if we should send any reminders today
      await this.checkAndSendReminders(property, unit, tenant, billingSettings);
      
    } catch (error) {
      console.error('Error processing unit reminders:', error);
    }
  }

  /**
   * Check if any reminders should be sent today for this unit
   */
  private static async checkAndSendReminders(
    property: Property,
    unit: Unit,
    tenant: Tenant,
    billingSettings: Unit['billingSettings']
  ): Promise<void> {
    if (!billingSettings?.reminderDaysBefore || billingSettings.reminderDaysBefore.length === 0) {
      return;
    }

    // Check if lease has expired
    if (this.isLeaseExpired(tenant)) {
      console.log(`Lease expired for tenant ${tenant.fullName} in unit ${unit.name}, stopping automatic reminders`);
      return;
    }

    const { dueDay, reminderDaysBefore } = billingSettings;
    const nextDueDate = this.calculateNextDueDate(dueDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we should send any reminders today
    for (const daysBefore of reminderDaysBefore) {
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      reminderDate.setHours(0, 0, 0, 0);

      // If today is the reminder date, send the reminder
      if (reminderDate.getTime() === today.getTime()) {
        await this.sendReminderEmail(property, unit, tenant, nextDueDate, daysBefore);
      }
    }
  }

  /**
   * Check if the tenant's lease has expired
   */
  private static isLeaseExpired(tenant: Tenant): boolean {
    if (!tenant.leaseEndDate) {
      return false; // No end date means indefinite lease
    }

    const leaseEndDate = new Date(tenant.leaseEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    leaseEndDate.setHours(0, 0, 0, 0);

    return today > leaseEndDate;
  }

  /**
   * Send a reminder email
   */
  private static async sendReminderEmail(
    property: Property,
    unit: Unit,
    tenant: Tenant,
    dueDate: Date,
    daysBefore: number
  ): Promise<void> {
    try {
      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create a payment link via Xendit (Cloudflare Worker) so the reminder includes a real link
      let paymentUrl: string | undefined = undefined;
      try {
        const landlordId = (property as any).manager || (property as any).ownerId || '';
        // Prefer explicit user scoping: assume landlordId is the authenticated user who owns the property.
        // If not on the property object, fallback to unit. The caller of processUnitReminders provides userId already.
        const resolvedLandlordId = landlordId || (tenant as any).landlordId || '';

        // Use configured property methods when available; fallback to common PH methods
        const configured = (property as any).paymentMethods as any[] | undefined;
        const methods = (configured && configured.length > 0)
          ? configured.filter(m => m?.enabled !== false).map(m => m.id)
          : ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'];

        const payment = await PaymentRequestService.createPaymentRequest({
          landlordId: resolvedLandlordId,
          propertyId: unit.propertyId,
          tenantId: tenant.id,
          amount: unit.rentAmount,
          currency: 'PHP',
          description: `Rent for ${unit.name} - ${property.name}`,
          dueDate,
          paymentMethods: methods
        });
        paymentUrl = payment.xenditInvoiceUrl;
      } catch (e) {
        console.warn('Automatic reminder: failed to create invoice, continuing without link', e);
      }

      const success = await EmailJSService.sendRentReminder({
        email: tenant.contact!.email!,
        tenantName: tenant.fullName,
        propertyName: property.name,
        unitName: unit.name,
        rentAmount: unit.rentAmount,
        dueDate: dueDateStr,
        landlordName: 'Property Manager',
        paymentUrl
      });

      if (success) {
        console.log(`📧 Automatic reminder sent:`, {
          tenant: tenant.fullName,
          email: tenant.contact!.email,
          property: property.name,
          unit: unit.name,
          amount: unit.rentAmount,
          dueDate: dueDateStr,
          daysBefore
        });
      }
    } catch (error) {
      console.error('Error sending automatic reminder:', error);
    }
  }

  /**
   * Calculate the next due date based on the due day of the month
   */
  private static calculateNextDueDate(dueDay: number): Date {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create the due date for this month
    const thisMonthDueDate = new Date(currentYear, currentMonth, dueDay);
    
    // If the due date has already passed this month, use next month
    if (thisMonthDueDate <= today) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      return new Date(nextYear, nextMonth, dueDay);
    }
    
    return thisMonthDueDate;
  }
}






