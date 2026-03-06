'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Clock, Bell, Save, X, CheckCircle, AlertCircle, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Unit } from '@/types/firestore';

interface UnitBillingSettingsProps {
  unit: Unit;
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: number;
  } | null;
  onSave: (billingSettings: Unit['billingSettings']) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UnitBillingSettings({ unit, tenant, onSave, onCancel, loading = false }: UnitBillingSettingsProps) {
  // Auto-populate from lease information if available
  const getInitialSettings = () => {
    if (unit.billingSettings) {
      return unit.billingSettings;
    }
    
    // Auto-populate from lease information
    const defaultSettings = {
      dueDay: 1,
      graceDays: 3,
      lateFeeType: 'flat' as const,
      lateFeeValue: 500,
      reminderDaysBefore: [3, 1],
      autoSendReminders: true,
      currency: 'PHP' as const
    };

    // If tenant has lease information, use it to set better defaults
    if (tenant?.leaseStartDate) {
      const leaseStart = new Date(tenant.leaseStartDate);
      defaultSettings.dueDay = leaseStart.getDate();
      
      if (tenant.securityDeposit) {
        defaultSettings.lateFeeValue = Math.round(tenant.securityDeposit * 0.1);
      }
    }

    return defaultSettings;
  };

  const [settings, setSettings] = useState<Unit['billingSettings']>(getInitialSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'due-date', title: 'Due Date', icon: Calendar },
    { id: 'late-fee', title: 'Late Fee', icon: DollarSign },
    { id: 'reminders', title: 'Reminders', icon: Bell },
    { id: 'summary', title: 'Summary', icon: CheckCircle }
  ];

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
      setSettings(prev => prev ? { 
        ...prev, 
        reminderDaysBefore: [...currentDays, day].sort((a, b) => b - a) 
      } : undefined);
    }
  };

  const removeReminderDay = (dayToRemove: number) => {
    const currentDays = settings?.reminderDaysBefore || [];
    setSettings(prev => prev ? { 
      ...prev, 
      reminderDaysBefore: currentDays.filter(day => day !== dayToRemove) 
    } : undefined);
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const getNextDueDate = () => {
    const today = new Date();
    const dueDay = settings?.dueDay || 1;
    const nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (nextDue <= today) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    return nextDue;
  };

  const getNextReminderDate = () => {
    const nextDue = getNextDueDate();
    const reminderDays = settings?.reminderDaysBefore?.[0] || 3;
    const reminderDate = new Date(nextDue);
    reminderDate.setDate(reminderDate.getDate() - reminderDays);
    return reminderDate;
  };

  const isLeaseExpired = () => {
    if (!tenant?.leaseEndDate) {
      return false; // No end date means indefinite lease
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
    
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0; // Expiring within 30 days
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Settings</h1>
        <p className="text-lg text-gray-600">Configure rent collection for {unit.name}</p>
      </motion.div>

      {/* Lease Information */}
      {tenant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200"
        >
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
        </motion.div>
      )}

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Due Date */}
          {activeStep === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Due Date Configuration</h2>
                <p className="text-gray-600">Set when rent is due each month</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Due Day of Month
                  </label>
                  <div className="relative">
                    <select
                      value={settings?.dueDay || 1}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, dueDay: parseInt(e.target.value) } : undefined)}
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

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Grace Period (Days)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settings?.graceDays || 3}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, graceDays: parseInt(e.target.value) } : undefined)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
                    />
                    <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Days after due date before late fee applies</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Late Fee */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Late Fee Configuration</h2>
                <p className="text-gray-600">Set up late payment penalties</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Late Fee Type
                  </label>
                  <div className="relative">
                    <select
                      value={settings?.lateFeeType || 'flat'}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, lateFeeType: e.target.value as 'flat' | 'percent' } : undefined)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="flat">Fixed Amount (₱)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                    <DollarSign className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Late Fee Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={settings?.lateFeeType === 'percent' ? '0.1' : '1'}
                      value={settings?.lateFeeValue || 500}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, lateFeeValue: parseFloat(e.target.value) } : undefined)}
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
            </motion.div>
          )}

          {/* Step 3: Reminders */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminder Settings</h2>
                <p className="text-gray-600">Configure automatic payment reminders</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Reminder Schedule (Days Before Due Date)
                  </label>
                  
                  {/* Quick Add Buttons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {[1, 3, 7, 14].map(day => (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addReminderDay(day)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          settings?.reminderDaysBefore?.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day} day{day !== 1 ? 's' : ''} before
                      </motion.button>
                    ))}
                  </div>

                  {/* Current Reminder Days */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {settings?.reminderDaysBefore?.map((day, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
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
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Auto-send Toggle */}
                <div className="bg-gray-50 rounded-2xl p-6">
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
                          onChange={(e) => setSettings(prev => prev ? { ...prev, autoSendReminders: e.target.checked } : undefined)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Summary */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Billing Summary</h2>
                <p className="text-gray-600">Review your billing configuration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Due Date</div>
                  <div className="text-2xl font-bold text-gray-900">{settings?.dueDay} of each month</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Grace Period</div>
                  <div className="text-2xl font-bold text-gray-900">{settings?.graceDays} days</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Late Fee</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {settings?.lateFeeType === 'flat' ? '₱' : ''}
                    {settings?.lateFeeValue}
                    {settings?.lateFeeType === 'percent' ? '%' : ''}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Reminders</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {settings?.reminderDaysBefore?.join(', ')} days before
                  </div>
                </div>
              </div>

              {/* Next Due Date Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Upcoming Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Next Due Date</div>
                    <div className="text-xl font-bold text-gray-900">
                      {getNextDueDate().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.ceil((getNextDueDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Next Reminder</div>
                    <div className="text-xl font-bold text-gray-900">
                      {isLeaseExpired() ? 'N/A (Lease Expired)' : getNextReminderDate().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isLeaseExpired() 
                        ? 'Automatic reminders disabled' 
                        : `${Math.ceil((getNextReminderDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now`
                      }
                    </div>
                  </div>
                </div>
                
                {/* Lease Status in Summary */}
                {tenant?.leaseEndDate && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <div className="text-sm font-medium text-blue-600 mb-2">Lease Status</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {isLeaseExpired() ? 'Expired' : isLeaseExpiringSoon() ? 'Expiring Soon' : 'Active'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Ends: {new Date(tenant.leaseEndDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isLeaseExpired() 
                          ? 'bg-red-100 text-red-800' 
                          : isLeaseExpiringSoon() 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isLeaseExpired() ? 'EXPIRED' : isLeaseExpiringSoon() ? 'EXPIRING' : 'ACTIVE'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between mt-8"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={activeStep === 0}
          className="px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isSaving}
            className="px-6 py-3"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          {activeStep === steps.length - 1 ? (
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
          ) : (
            <Button
              onClick={nextStep}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Clock, Bell, Save, X, CheckCircle, AlertCircle, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Unit } from '@/types/firestore';

interface UnitBillingSettingsProps {
  unit: Unit;
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseTerms?: string;
    securityDeposit?: number;
  } | null;
  onSave: (billingSettings: Unit['billingSettings']) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UnitBillingSettings({ unit, tenant, onSave, onCancel, loading = false }: UnitBillingSettingsProps) {
  // Auto-populate from lease information if available
  const getInitialSettings = () => {
    if (unit.billingSettings) {
      return unit.billingSettings;
    }
    
    // Auto-populate from lease information
    const defaultSettings = {
      dueDay: 1,
      graceDays: 3,
      lateFeeType: 'flat' as const,
      lateFeeValue: 500,
      reminderDaysBefore: [3, 1],
      autoSendReminders: true,
      currency: 'PHP' as const
    };

    // If tenant has lease information, use it to set better defaults
    if (tenant?.leaseStartDate) {
      const leaseStart = new Date(tenant.leaseStartDate);
      defaultSettings.dueDay = leaseStart.getDate();
      
      if (tenant.securityDeposit) {
        defaultSettings.lateFeeValue = Math.round(tenant.securityDeposit * 0.1);
      }
    }

    return defaultSettings;
  };

  const [settings, setSettings] = useState<Unit['billingSettings']>(getInitialSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'due-date', title: 'Due Date', icon: Calendar },
    { id: 'late-fee', title: 'Late Fee', icon: DollarSign },
    { id: 'reminders', title: 'Reminders', icon: Bell },
    { id: 'summary', title: 'Summary', icon: CheckCircle }
  ];

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
      setSettings(prev => prev ? { 
        ...prev, 
        reminderDaysBefore: [...currentDays, day].sort((a, b) => b - a) 
      } : undefined);
    }
  };

  const removeReminderDay = (dayToRemove: number) => {
    const currentDays = settings?.reminderDaysBefore || [];
    setSettings(prev => prev ? { 
      ...prev, 
      reminderDaysBefore: currentDays.filter(day => day !== dayToRemove) 
    } : undefined);
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const getNextDueDate = () => {
    const today = new Date();
    const dueDay = settings?.dueDay || 1;
    const nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (nextDue <= today) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    return nextDue;
  };

  const getNextReminderDate = () => {
    const nextDue = getNextDueDate();
    const reminderDays = settings?.reminderDaysBefore?.[0] || 3;
    const reminderDate = new Date(nextDue);
    reminderDate.setDate(reminderDate.getDate() - reminderDays);
    return reminderDate;
  };

  const isLeaseExpired = () => {
    if (!tenant?.leaseEndDate) {
      return false; // No end date means indefinite lease
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
    
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0; // Expiring within 30 days
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Settings</h1>
        <p className="text-lg text-gray-600">Configure rent collection for {unit.name}</p>
      </motion.div>

      {/* Lease Information */}
      {tenant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200"
        >
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
        </motion.div>
      )}

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Due Date */}
          {activeStep === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Due Date Configuration</h2>
                <p className="text-gray-600">Set when rent is due each month</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Due Day of Month
                  </label>
                  <div className="relative">
                    <select
                      value={settings?.dueDay || 1}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, dueDay: parseInt(e.target.value) } : undefined)}
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

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Grace Period (Days)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settings?.graceDays || 3}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, graceDays: parseInt(e.target.value) } : undefined)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
                    />
                    <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Days after due date before late fee applies</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Late Fee */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Late Fee Configuration</h2>
                <p className="text-gray-600">Set up late payment penalties</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Late Fee Type
                  </label>
                  <div className="relative">
                    <select
                      value={settings?.lateFeeType || 'flat'}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, lateFeeType: e.target.value as 'flat' | 'percent' } : undefined)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-medium transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="flat">Fixed Amount (₱)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                    <DollarSign className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Late Fee Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={settings?.lateFeeType === 'percent' ? '0.1' : '1'}
                      value={settings?.lateFeeValue || 500}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, lateFeeValue: parseFloat(e.target.value) } : undefined)}
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
            </motion.div>
          )}

          {/* Step 3: Reminders */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminder Settings</h2>
                <p className="text-gray-600">Configure automatic payment reminders</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Reminder Schedule (Days Before Due Date)
                  </label>
                  
                  {/* Quick Add Buttons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {[1, 3, 7, 14].map(day => (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addReminderDay(day)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          settings?.reminderDaysBefore?.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day} day{day !== 1 ? 's' : ''} before
                      </motion.button>
                    ))}
                  </div>

                  {/* Current Reminder Days */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {settings?.reminderDaysBefore?.map((day, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
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
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Auto-send Toggle */}
                <div className="bg-gray-50 rounded-2xl p-6">
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
                          onChange={(e) => setSettings(prev => prev ? { ...prev, autoSendReminders: e.target.checked } : undefined)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Summary */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Billing Summary</h2>
                <p className="text-gray-600">Review your billing configuration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Due Date</div>
                  <div className="text-2xl font-bold text-gray-900">{settings?.dueDay} of each month</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Grace Period</div>
                  <div className="text-2xl font-bold text-gray-900">{settings?.graceDays} days</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Late Fee</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {settings?.lateFeeType === 'flat' ? '₱' : ''}
                    {settings?.lateFeeValue}
                    {settings?.lateFeeType === 'percent' ? '%' : ''}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Reminders</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {settings?.reminderDaysBefore?.join(', ')} days before
                  </div>
                </div>
              </div>

              {/* Next Due Date Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Upcoming Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Next Due Date</div>
                    <div className="text-xl font-bold text-gray-900">
                      {getNextDueDate().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.ceil((getNextDueDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Next Reminder</div>
                    <div className="text-xl font-bold text-gray-900">
                      {isLeaseExpired() ? 'N/A (Lease Expired)' : getNextReminderDate().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isLeaseExpired() 
                        ? 'Automatic reminders disabled' 
                        : `${Math.ceil((getNextReminderDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now`
                      }
                    </div>
                  </div>
                </div>
                
                {/* Lease Status in Summary */}
                {tenant?.leaseEndDate && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <div className="text-sm font-medium text-blue-600 mb-2">Lease Status</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {isLeaseExpired() ? 'Expired' : isLeaseExpiringSoon() ? 'Expiring Soon' : 'Active'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Ends: {new Date(tenant.leaseEndDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isLeaseExpired() 
                          ? 'bg-red-100 text-red-800' 
                          : isLeaseExpiringSoon() 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isLeaseExpired() ? 'EXPIRED' : isLeaseExpiringSoon() ? 'EXPIRING' : 'ACTIVE'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between mt-8"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={activeStep === 0}
          className="px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isSaving}
            className="px-6 py-3"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          {activeStep === steps.length - 1 ? (
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
          ) : (
            <Button
              onClick={nextStep}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}