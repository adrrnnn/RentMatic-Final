'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Calendar, Clock, AlertTriangle, Bell, DollarSign } from 'lucide-react';

interface BillingSettingsConfigProps {
  propertyId: string;
  onSave: (settings: BillingSettings) => void;
  initialSettings?: BillingSettings;
}

export interface BillingSettings {
  dueDay: number; // 1-31
  graceDays: number;
  lateFeeType: 'flat' | 'percent';
  lateFeeValue: number;
  reminderDaysBefore: number[]; // e.g., [3,1]
  autoSendReminders: boolean;
  currency: 'PHP';
}

export function BillingSettingsConfig({ propertyId, onSave, initialSettings }: BillingSettingsConfigProps) {
  const [settings, setSettings] = useState<BillingSettings>(initialSettings || {
    dueDay: 1,
    graceDays: 3,
    lateFeeType: 'flat',
    lateFeeValue: 500,
    reminderDaysBefore: [3, 1],
    autoSendReminders: true,
    currency: 'PHP'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(settings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<BillingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Settings</h3>
        <p className="text-sm text-gray-600">
          Configure how rent payments are processed and when tenants are notified.
        </p>
      </div>

      {/* Due Date Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Due Date Settings</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent Due Day
            </label>
            <select
              value={settings.dueDay}
              onChange={(e) => updateSettings({ dueDay: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} of each month
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grace Period (Days)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={settings.graceDays}
              onChange={(e) => updateSettings({ graceDays: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Days after due date before late fees apply
            </p>
          </div>
        </div>
      </div>

      {/* Late Fee Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Late Fee Settings</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Fee Type
            </label>
            <select
              value={settings.lateFeeType}
              onChange={(e) => updateSettings({ lateFeeType: e.target.value as 'flat' | 'percent' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="flat">Fixed Amount</option>
              <option value="percent">Percentage of Rent</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Fee Amount
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step={settings.lateFeeType === 'percent' ? '0.1' : '1'}
                value={settings.lateFeeValue}
                onChange={(e) => updateSettings({ lateFeeValue: parseFloat(e.target.value) })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">
                {settings.lateFeeType === 'percent' ? '%' : '₱'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Reminder Settings</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoReminders"
              checked={settings.autoSendReminders}
              onChange={(e) => updateSettings({ autoSendReminders: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoReminders" className="text-sm font-medium text-gray-700">
              Automatically send payment reminders
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send reminders (days before due date)
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 7, 14].map(day => (
                <button
                  key={day}
                  onClick={() => {
                    const current = settings.reminderDaysBefore;
                    const updated = current.includes(day)
                      ? current.filter(d => d !== day)
                      : [...current, day].sort((a, b) => a - b);
                    updateSettings({ reminderDaysBefore: updated });
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.reminderDaysBefore.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day} day{day !== 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {settings.reminderDaysBefore.length > 0 
                ? settings.reminderDaysBefore.map(d => `${d} day${d !== 1 ? 's' : ''}`).join(', ')
                : 'No reminders'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => setSettings(initialSettings || {
            dueDay: 1,
            graceDays: 3,
            lateFeeType: 'flat',
            lateFeeValue: 500,
            reminderDaysBefore: [3, 1],
            autoSendReminders: true,
            currency: 'PHP'
          })}
          className="px-6 py-2"
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

















