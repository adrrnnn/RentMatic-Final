'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Settings, DollarSign, Bell, Clock, Save, X, CheckCircle, AlertCircle, Plus, Minus, ArrowLeft, ArrowRight, Send, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/Button';
import { Unit } from '@/types/firestore';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { EmailJSService } from '@/lib/services/emailJSService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { toast } from 'react-hot-toast';

interface BillingSettingsTabsProps {
  unit: Unit;
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: number;
    fullName?: string;
    contact?: {
      email?: string;
    };
  } | null;
  onSave: (billingSettings: Unit['billingSettings']) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  propertyId?: string;
  userId?: string;
}

export function BillingSettingsTabs({ unit, tenant, onSave, onCancel, loading = false, propertyId, userId }: BillingSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('automatic');
  const [settings, setSettings] = useState<Unit['billingSettings']>(unit.billingSettings || {
    dueDay: 1,
    graceDays: 3,
    lateFeeType: 'flat' as const,
    lateFeeValue: 500,
    reminderDaysBefore: [3, 1],
    autoSendReminders: true,
    currency: 'PHP' as const
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const addReminderDay = (day: number) => {
    const currentDays = settings?.reminderDaysBefore || [];
    if (!currentDays.includes(day)) {
      setSettings(settings ? ({ 
        ...settings, 
        reminderDaysBefore: [...currentDays, day].sort((a, b) => b - a) 
      }) : undefined);
    }
  };

  const removeReminderDay = (dayToRemove: number) => {
    const currentDays = settings?.reminderDaysBefore || [];
    setSettings(settings ? ({ 
      ...settings, 
      reminderDaysBefore: currentDays.filter(day => day !== dayToRemove) 
    }) : undefined);
  };

  const isLeaseExpired = () => {
    if (!tenant?.leaseEndDate) {
      return false;
    }
    const leaseEndDate = new Date(tenant.leaseEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    leaseEndDate.setHours(0, 0, 0, 0);
    return today > leaseEndDate;
  };

  const isLeaseExpiringSoon = () => {
    if (!tenant?.leaseEndDate) {
      return false;
    }
    const leaseEndDate = new Date(tenant.leaseEndDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Settings</h1>
            <p className="text-lg text-gray-600">Configure rent collection for {unit.name}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('automatic')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center ${
              activeTab === 'automatic'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Automatic Billing
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Manual Billing
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        {activeTab === 'automatic' ? (
          <AutomaticBillingTab
            unit={unit}
            tenant={tenant}
            settings={settings}
            setSettings={setSettings}
            isLeaseExpired={isLeaseExpired}
            isLeaseExpiringSoon={isLeaseExpiringSoon}
            addReminderDay={addReminderDay}
            removeReminderDay={removeReminderDay}
          />
        ) : (
          <ManualBillingTab
            unit={unit}
            tenant={tenant}
            propertyId={propertyId}
            userId={userId}
          />
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between mt-8"
      >
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
          className="px-6 py-3"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Settings'
          )}
        </Button>
      </motion.div>
    </div>
  );
}

// Automatic Billing Tab Component
function AutomaticBillingTab({ 
  unit, 
  tenant, 
  settings, 
  setSettings, 
  isLeaseExpired, 
  isLeaseExpiringSoon, 
  addReminderDay, 
  removeReminderDay 
}: {
  unit: Unit;
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: number;
    fullName?: string;
    contact?: {
      email?: string;
    };
  } | null;
  settings: Unit['billingSettings'];
  setSettings: (settings: Unit['billingSettings']) => void;
  isLeaseExpired: () => boolean;
  isLeaseExpiringSoon: () => boolean;
  addReminderDay: (day: number) => void;
  removeReminderDay: (day: number) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Lease Information */}
      {tenant && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-900">Lease Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tenant.leaseStartDate && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Lease Start</div>
                <div className="text-lg font-bold text-gray-900">{new Date(tenant.leaseStartDate).toLocaleDateString()}</div>
              </div>
            )}
            {tenant.leaseEndDate && (
              <div className={`bg-white rounded-xl p-4 shadow-sm ${isLeaseExpired() ? 'border-2 border-red-200' : isLeaseExpiringSoon() ? 'border-2 border-yellow-200' : ''}`}>
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Lease End</div>
                <div className="text-lg font-bold text-gray-900">{new Date(tenant.leaseEndDate).toLocaleDateString()}</div>
                {isLeaseExpired() && (
                  <div className="text-xs text-red-600 font-medium mt-1">⚠️ EXPIRED</div>
                )}
                {isLeaseExpiringSoon() && !isLeaseExpired() && (
                  <div className="text-xs text-yellow-600 font-medium mt-1">⚠️ Expires Soon</div>
                )}
              </div>
            )}
            {tenant.securityDeposit && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Security Deposit</div>
                <div className="text-lg font-bold text-gray-900">₱{tenant.securityDeposit.toLocaleString()}</div>
              </div>
            )}
            {tenant.leaseTerms && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Lease Terms</div>
                <div className="text-lg font-bold text-gray-900">{tenant.leaseTerms}</div>
              </div>
            )}
          </div>
          
          {/* Lease Status Messages */}
          {isLeaseExpired() ? (
            <div className="mt-4 flex items-center bg-red-100 rounded-xl p-3 border border-red-200">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">Lease Expired - Automatic Reminders Disabled</p>
                <p className="text-xs text-red-700">Billing reminders will not be sent automatically. Please renew the lease or update tenant information.</p>
              </div>
            </div>
          ) : isLeaseExpiringSoon() ? (
            <div className="mt-4 flex items-center bg-yellow-100 rounded-xl p-3 border border-yellow-200">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-yellow-800">Lease Expiring Soon</p>
                <p className="text-xs text-yellow-700">Automatic reminders will stop when the lease expires. Consider renewing the lease.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center bg-blue-100 rounded-xl p-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">💡</span>
              </div>
              <p className="text-sm font-medium text-blue-800">
                Billing settings have been auto-populated based on lease information
              </p>
            </div>
          )}
        </div>
      )}

      {/* Due Date Settings */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          Due Date Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Due Day of Month
            </label>
            <div className="relative">
              <select
                value={settings?.dueDay || 1}
                onChange={(e) => {
                  const newDueDay = parseInt(e.target.value);
                  setSettings({ ...settings!, dueDay: newDueDay });
                }}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Rent is due on this day each month</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Grace Period (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="30"
                value={settings?.graceDays || 3}
                onChange={(e) => setSettings(settings ? { ...settings, graceDays: parseInt(e.target.value) } : undefined)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
              />
              <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Days after due date before late fee applies</p>
          </div>
        </div>
      </div>

      {/* Late Fee Settings */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center mr-3">
            <DollarSign className="w-4 h-4 text-red-600" />
          </div>
          Late Fee Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Late Fee Type
            </label>
            <div className="relative">
              <select
                value={settings?.lateFeeType || 'flat'}
                onChange={(e) => setSettings(settings ? { ...settings, lateFeeType: e.target.value as 'flat' | 'percent' } : undefined)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
              >
                <option value="flat">Fixed Amount (₱)</option>
                <option value="percent">Percentage (%)</option>
              </select>
              <DollarSign className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Late Fee Value
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={settings?.lateFeeType === 'percent' ? '0.1' : '1'}
                value={settings?.lateFeeValue || 500}
                onChange={(e) => setSettings(settings ? { ...settings, lateFeeValue: parseFloat(e.target.value) } : undefined)}
                className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">
                {settings?.lateFeeType === 'percent' ? '%' : '₱'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {settings?.lateFeeType === 'percent' 
                ? 'Percentage of rent amount' 
                : 'Fixed amount in pesos'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          Reminder Settings
        </h4>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Reminder Schedule (Days Before Due Date)
            </label>
            
            {/* Quick Add Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[1, 3, 7, 14].map(day => (
                <button
                  key={day}
                  onClick={() => addReminderDay(day)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    settings?.reminderDaysBefore?.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day} day{day !== 1 ? 's' : ''} before
                </button>
              ))}
            </div>

            {/* Current Reminder Days */}
            <div className="flex flex-wrap gap-3 mb-6">
              {settings?.reminderDaysBefore?.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span>{day} day{day !== 1 ? 's' : ''} before</span>
                  <button
                    type="button"
                    onClick={() => removeReminderDay(day)}
                    className="ml-3 text-blue-100 hover:text-white transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-send Toggle */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <label htmlFor="autoReminders" className="text-lg font-bold text-gray-900">
                    Auto-send reminders
                  </label>
                  <p className="text-sm text-gray-600">Automatically send reminders based on schedule</p>
                </div>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="autoReminders"
                    checked={settings?.autoSendReminders || false}
                    onChange={(e) => setSettings(settings ? { ...settings, autoSendReminders: e.target.checked } : undefined)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Billing Tab Component
function ManualBillingTab({ unit, tenant, propertyId, userId }: {
  unit: Unit;
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: number;
    fullName?: string;
    contact?: {
      email?: string;
    };
  } | null;
  propertyId?: string;
  userId?: string;
}) {
  const [isSending, setIsSending] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Load property name
  useEffect(() => {
    if (propertyId && userId) {
      PropertyService.getProperty(userId, propertyId)
        .then(prop => {
          if (prop) setPropertyName(prop.name);
        })
        .catch(() => {});
    }
  }, [propertyId, userId]);

  const handleSendPaymentRequest = async () => {
    if (!userId || !propertyId || !unit.tenantId || !tenant?.contact?.email) {
      toast.error('Missing required information. Please ensure unit has a tenant with email.');
      return;
    }

    const amount = customAmount ? parseFloat(customAmount) : (unit.rentAmount || 0);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const description = customDescription.trim() || `Rent for ${unit.name} - ${propertyName || 'Property'}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Default: 7 days from now

    setIsSending(true);

    try {
      // Get property payment methods
      const property = await PropertyService.getProperty(userId, propertyId);
      const paymentMethods = (property?.paymentMethods && property.paymentMethods.length > 0)
        ? property.paymentMethods.filter((m: any) => m?.enabled !== false).map((m: any) => m.id)
        : ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'];

      // Create payment request (Xendit invoice)
      const paymentRequest = await PaymentRequestService.createPaymentRequest({
        landlordId: userId,
        propertyId,
        tenantId: unit.tenantId,
        amount,
        currency: 'PHP',
        description,
        dueDate,
        paymentMethods
      });

      // Send email with payment link
      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Store the payment link
      setGeneratedPaymentLink(paymentRequest.xenditInvoiceUrl);

      // Send email with payment link
      try {
        await EmailJSService.sendRentReminder({
          email: tenant.contact.email,
          tenantName: tenant.fullName || 'Tenant',
          propertyName: propertyName || 'Property',
          unitName: unit.name,
          rentAmount: amount,
          dueDate: dueDateStr,
          landlordName: 'Property Manager',
          paymentUrl: paymentRequest.xenditInvoiceUrl
        });
        toast.success(`✅ Email sent to ${tenant.contact.email}`, { duration: 3000 });
      } catch (emailError) {
        console.error('Email error:', emailError);
        toast.error('Payment link created but email failed. Please copy and send manually.');
      }
      
      // Reset form
      setCustomAmount('');
      setCustomDescription('');
    } catch (error: any) {
      console.error('Error sending payment request:', error);
      toast.error(`Failed to send payment request: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const hasTenant = tenant && tenant.contact?.email;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manual Billing</h2>
        <p className="text-gray-600">Send payment requests manually when needed</p>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-bold text-orange-900">Manual Payment Management</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Current Unit Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Unit Name</div>
                <div className="font-semibold text-gray-900">{unit.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Rent Amount</div>
                <div className="font-semibold text-gray-900">₱{unit.rentAmount?.toLocaleString() || '0'}/month</div>
              </div>
              {tenant && (
                <>
                  <div>
                    <div className="text-sm text-gray-600">Tenant</div>
                    <div className="font-semibold text-gray-900">{tenant.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold text-gray-900">{tenant.contact?.email || 'Not provided'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!hasTenant ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">No Tenant Assigned</p>
                  <p className="text-xs text-yellow-700">This unit needs a tenant with an email address to send payment requests.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Send Payment Request</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PHP)
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={unit.rentAmount ? `Default: ₱${unit.rentAmount.toLocaleString()}` : 'Enter amount'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {!customAmount && unit.rentAmount && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use default rent: ₱{unit.rentAmount.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={`Default: Rent for ${unit.name} - ${propertyName || 'Property'}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <Button
                  onClick={handleSendPaymentRequest}
                  disabled={isSending || !userId || !propertyId}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating payment link & sending email...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Payment Request to {tenant.fullName}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  This will create a payment link via Xendit and email it to {tenant.contact?.email}
                </p>

                {/* Generated Payment Link Display */}
                {generatedPaymentLink && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h5 className="font-semibold text-green-900">Payment Link Generated</h5>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedPaymentLink}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPaymentLink);
                            setLinkCopied(true);
                            toast.success('Link copied to clipboard!');
                            setTimeout(() => setLinkCopied(false), 2000);
                          }}
                          variant="outline"
                          className="px-4 py-2 border-green-300 text-green-700 hover:bg-green-100"
                        >
                          {linkCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-green-700">
                      ✅ Email sent to {tenant.contact?.email}. You can also copy the link above to send manually.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-orange-100 rounded-xl p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">ℹ️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800">Manual Billing Mode</p>
                <p className="text-xs text-orange-700">You&apos;ll need to manually send payment requests and reminders. No automatic billing will occur.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












