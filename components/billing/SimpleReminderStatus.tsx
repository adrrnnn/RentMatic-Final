'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
// Helper function to calculate reminder status
const calculateReminderStatus = (unit: Unit) => {
  if (!unit.billingSettings) {
    return {
      nextDueDate: new Date(),
      daysUntilDue: 0,
      nextReminderDate: null,
      daysUntilNextReminder: null
    };
  }

  const nextDueDate = calculateNextDueDate(unit.billingSettings.dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find the next reminder date
  let nextReminderDate: Date | null = null;
  let daysUntilNextReminder: number | null = null;
  
  if (unit.billingSettings.reminderDaysBefore && unit.billingSettings.reminderDaysBefore.length > 0) {
    const sortedReminderDays = [...unit.billingSettings.reminderDaysBefore].sort((a, b) => b - a);
    
    for (const daysBefore of sortedReminderDays) {
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      
      if (reminderDate >= today) {
        nextReminderDate = reminderDate;
        daysUntilNextReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        break;
      }
    }
  }

  return {
    nextDueDate,
    daysUntilDue,
    nextReminderDate,
    daysUntilNextReminder
  };
};

const calculateNextDueDate = (dueDay: number): Date => {
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
};
import { Unit } from '@/types/firestore';

interface SimpleReminderStatusProps {
  unit: Unit;
}

export function SimpleReminderStatus({ unit }: SimpleReminderStatusProps) {
  const [reminderStatus, setReminderStatus] = useState<{
    nextDueDate: Date;
    daysUntilDue: number;
    nextReminderDate: Date | null;
    daysUntilNextReminder: number | null;
  } | null>(null);

  useEffect(() => {
    if (unit.billingSettings) {
      const status = calculateReminderStatus(unit);
      setReminderStatus(status);
    }
  }, [unit]);

  if (!unit.billingSettings?.autoSendReminders) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800 font-medium">
            Auto-reminders are disabled for this unit
          </p>
        </div>
      </div>
    );
  }

  if (!reminderStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-600 mr-2" />
          <p className="text-gray-600">Loading reminder status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-bold text-blue-900">Automatic Reminders</h3>
        <div className="ml-auto">
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Next Due Date</span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {reminderStatus.nextDueDate.toLocaleDateString()}
          </p>
          <p className="text-sm text-blue-600">
            {reminderStatus.daysUntilDue} days from now
          </p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Bell className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Next Reminder</span>
          </div>
          {reminderStatus.nextReminderDate ? (
            <>
              <p className="text-xl font-bold text-green-900">
                {reminderStatus.nextReminderDate.toLocaleDateString()}
              </p>
              <p className="text-sm text-green-600">
                {reminderStatus.daysUntilNextReminder} days from now
              </p>
            </>
          ) : (
            <p className="text-sm text-green-600">No upcoming reminders</p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Reminder Schedule:</strong> {unit.billingSettings?.reminderDaysBefore?.join(', ')} days before due date
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Emails will be sent automatically based on your billing settings
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
// Helper function to calculate reminder status
const calculateReminderStatus = (unit: Unit) => {
  if (!unit.billingSettings) {
    return {
      nextDueDate: new Date(),
      daysUntilDue: 0,
      nextReminderDate: null,
      daysUntilNextReminder: null
    };
  }

  const nextDueDate = calculateNextDueDate(unit.billingSettings.dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find the next reminder date
  let nextReminderDate: Date | null = null;
  let daysUntilNextReminder: number | null = null;
  
  if (unit.billingSettings.reminderDaysBefore && unit.billingSettings.reminderDaysBefore.length > 0) {
    const sortedReminderDays = [...unit.billingSettings.reminderDaysBefore].sort((a, b) => b - a);
    
    for (const daysBefore of sortedReminderDays) {
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      
      if (reminderDate >= today) {
        nextReminderDate = reminderDate;
        daysUntilNextReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        break;
      }
    }
  }

  return {
    nextDueDate,
    daysUntilDue,
    nextReminderDate,
    daysUntilNextReminder
  };
};

const calculateNextDueDate = (dueDay: number): Date => {
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
};
import { Unit } from '@/types/firestore';

interface SimpleReminderStatusProps {
  unit: Unit;
}

export function SimpleReminderStatus({ unit }: SimpleReminderStatusProps) {
  const [reminderStatus, setReminderStatus] = useState<{
    nextDueDate: Date;
    daysUntilDue: number;
    nextReminderDate: Date | null;
    daysUntilNextReminder: number | null;
  } | null>(null);

  useEffect(() => {
    if (unit.billingSettings) {
      const status = calculateReminderStatus(unit);
      setReminderStatus(status);
    }
  }, [unit]);

  if (!unit.billingSettings?.autoSendReminders) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800 font-medium">
            Auto-reminders are disabled for this unit
          </p>
        </div>
      </div>
    );
  }

  if (!reminderStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-600 mr-2" />
          <p className="text-gray-600">Loading reminder status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-bold text-blue-900">Automatic Reminders</h3>
        <div className="ml-auto">
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Next Due Date</span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {reminderStatus.nextDueDate.toLocaleDateString()}
          </p>
          <p className="text-sm text-blue-600">
            {reminderStatus.daysUntilDue} days from now
          </p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Bell className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Next Reminder</span>
          </div>
          {reminderStatus.nextReminderDate ? (
            <>
              <p className="text-xl font-bold text-green-900">
                {reminderStatus.nextReminderDate.toLocaleDateString()}
              </p>
              <p className="text-sm text-green-600">
                {reminderStatus.daysUntilNextReminder} days from now
              </p>
            </>
          ) : (
            <p className="text-sm text-green-600">No upcoming reminders</p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Reminder Schedule:</strong> {unit.billingSettings?.reminderDaysBefore?.join(', ')} days before due date
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Emails will be sent automatically based on your billing settings
        </p>
      </div>
    </div>
  );
}
