'use client';

import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Unit } from '@/types/firestore';

interface BillingCalendarProps {
  unit: Unit;
}

export function BillingCalendar({ unit }: BillingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!unit.billingSettings) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800 font-medium">
            No billing settings configured for this unit
          </p>
        </div>
      </div>
    );
  }

  const { dueDay, reminderDaysBefore, autoSendReminders } = unit.billingSettings;

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Calculate due date for this month
  const dueDate = new Date(year, month, dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate reminder dates
  const reminderDates = reminderDaysBefore?.map(days => {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - days);
    return reminderDate;
  }) || [];

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.getTime() === today.getTime();
    const isDueDate = day === dueDay;
    const isReminderDate = reminderDates.some(reminderDate => 
      reminderDate.getDate() === day && 
      reminderDate.getMonth() === month && 
      reminderDate.getFullYear() === year
    );
    const isPast = date < today;
    
    calendarDays.push({
      day,
      date,
      isToday,
      isDueDate,
      isReminderDate,
      isPast
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Unit Billing Calendar</h3>
            <p className="text-sm text-gray-600">Due dates and reminders for this unit only</p>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="p-2"></div>;
          }

          const { day, isToday, isDueDate, isReminderDate, isPast } = dayData;

          return (
            <div
              key={`day-${day}-${index}`}
              className={`
                p-2 text-center text-sm rounded-lg relative
                ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                ${isDueDate && !isToday ? 'bg-red-100 text-red-700 font-bold' : ''}
                ${isReminderDate && !isToday && !isDueDate ? 'bg-yellow-100 text-yellow-700 font-medium' : ''}
                ${!isToday && !isDueDate && !isReminderDate ? 'hover:bg-gray-100' : ''}
                ${isPast && !isToday && !isDueDate && !isReminderDate ? 'text-gray-400' : ''}
              `}
            >
              {day}
              
              {/* Icons for special days */}
              {isDueDate && (
                <div className="absolute -top-1 -right-1">
                  <DollarSign className="w-3 h-3 text-red-600" />
                </div>
              )}
              
              {isReminderDate && !isDueDate && (
                <div className="absolute -top-1 -right-1">
                  <Bell className="w-3 h-3 text-yellow-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
          <span className="text-gray-700">Due Date ({dueDay})</span>
        </div>
        
        {autoSendReminders && reminderDaysBefore && reminderDaysBefore.length > 0 && (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
            <span className="text-gray-700">Reminder Days ({reminderDaysBefore.join(', ')} days before)</span>
          </div>
        )}
        
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-700">Today</span>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Next Due Date: {dueDate.toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">
              {Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days from now
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Auto-Reminders: {autoSendReminders ? 'Enabled' : 'Disabled'}
            </p>
            {autoSendReminders && reminderDaysBefore && reminderDaysBefore.length > 0 && (
              <p className="text-xs text-gray-600">
                {reminderDaysBefore.length} reminder{reminderDaysBefore.length !== 1 ? 's' : ''} configured
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Unit } from '@/types/firestore';

interface BillingCalendarProps {
  unit: Unit;
}

export function BillingCalendar({ unit }: BillingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!unit.billingSettings) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800 font-medium">
            No billing settings configured for this unit
          </p>
        </div>
      </div>
    );
  }

  const { dueDay, reminderDaysBefore, autoSendReminders } = unit.billingSettings;

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Calculate due date for this month
  const dueDate = new Date(year, month, dueDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate reminder dates
  const reminderDates = reminderDaysBefore?.map(days => {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - days);
    return reminderDate;
  }) || [];

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.getTime() === today.getTime();
    const isDueDate = day === dueDay;
    const isReminderDate = reminderDates.some(reminderDate => 
      reminderDate.getDate() === day && 
      reminderDate.getMonth() === month && 
      reminderDate.getFullYear() === year
    );
    const isPast = date < today;
    
    calendarDays.push({
      day,
      date,
      isToday,
      isDueDate,
      isReminderDate,
      isPast
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Unit Billing Calendar</h3>
            <p className="text-sm text-gray-600">Due dates and reminders for this unit only</p>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="p-2"></div>;
          }

          const { day, isToday, isDueDate, isReminderDate, isPast } = dayData;

          return (
            <div
              key={`day-${day}-${index}`}
              className={`
                p-2 text-center text-sm rounded-lg relative
                ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                ${isDueDate && !isToday ? 'bg-red-100 text-red-700 font-bold' : ''}
                ${isReminderDate && !isToday && !isDueDate ? 'bg-yellow-100 text-yellow-700 font-medium' : ''}
                ${!isToday && !isDueDate && !isReminderDate ? 'hover:bg-gray-100' : ''}
                ${isPast && !isToday && !isDueDate && !isReminderDate ? 'text-gray-400' : ''}
              `}
            >
              {day}
              
              {/* Icons for special days */}
              {isDueDate && (
                <div className="absolute -top-1 -right-1">
                  <DollarSign className="w-3 h-3 text-red-600" />
                </div>
              )}
              
              {isReminderDate && !isDueDate && (
                <div className="absolute -top-1 -right-1">
                  <Bell className="w-3 h-3 text-yellow-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
          <span className="text-gray-700">Due Date ({dueDay})</span>
        </div>
        
        {autoSendReminders && reminderDaysBefore && reminderDaysBefore.length > 0 && (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
            <span className="text-gray-700">Reminder Days ({reminderDaysBefore.join(', ')} days before)</span>
          </div>
        )}
        
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-700">Today</span>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Next Due Date: {dueDate.toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">
              {Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days from now
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Auto-Reminders: {autoSendReminders ? 'Enabled' : 'Disabled'}
            </p>
            {autoSendReminders && reminderDaysBefore && reminderDaysBefore.length > 0 && (
              <p className="text-xs text-gray-600">
                {reminderDaysBefore.length} reminder{reminderDaysBefore.length !== 1 ? 's' : ''} configured
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
