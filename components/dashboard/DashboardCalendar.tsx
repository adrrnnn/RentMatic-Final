import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  DollarSign,
  Building2,
  Users,
  AlertCircle
} from 'lucide-react';
import { Unit, Property } from '@/types/firestore';

interface DashboardCalendarProps {
  properties: Property[];
  units: Unit[];
}

interface CalendarEvent {
  id: string;
  type: 'due' | 'reminder';
  unit: Unit;
  property: Property;
  date: Date;
  title: string;
  description: string;
  daysBefore?: number;
}

export function DashboardCalendar({ properties, units }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Generate events for all units
    const allEvents: CalendarEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    units.forEach(unit => {
      if (!unit.billingSettings) return;

      const property = properties.find(p => p.id === unit.propertyId);
      if (!property) return;

      const { dueDay, reminderDaysBefore, autoSendReminders } = unit.billingSettings;

      // Calculate due date for current month
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dueDay);
      
      // Add due date event
      allEvents.push({
        id: `due-${unit.id}-${dueDate.getTime()}`,
        type: 'due',
        unit,
        property,
        date: dueDate,
        title: `Rent Due - ${unit.name}`,
        description: `₱${unit.rentAmount?.toLocaleString() || '0'} due for ${unit.name} in ${property.name}`
      });

      // Add reminder events if auto-send is enabled
      if (autoSendReminders && reminderDaysBefore && reminderDaysBefore.length > 0) {
        reminderDaysBefore.forEach(daysBefore => {
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - daysBefore);
          
          if (reminderDate >= today) {
            allEvents.push({
              id: `reminder-${unit.id}-${reminderDate.getTime()}`,
              type: 'reminder',
              unit,
              property,
              date: reminderDate,
              title: `Rent Reminder - ${unit.name}`,
              description: `Rent due in ${daysBefore} days for ${unit.name}`,
              daysBefore
            });
          }
        });
      }
    });

    // Sort events by date
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    setEvents(allEvents);
  }, [properties, units, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Payment Calendar</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-20"></div>
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);
          
          return (
            <div
              key={i + 1}
              className={`h-20 p-1 border border-gray-100 ${
                isCurrentDay ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {i + 1}
                </span>
                {dayEvents.length > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${
                      event.type === 'due' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Events</h4>
        <div className="space-y-2">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                event.type === 'due' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {event.description}
                </p>
              </div>
              <span className="text-gray-600">
                {event.date.toLocaleDateString()}
              </span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-gray-500 text-sm">No upcoming events this month</p>
          )}
        </div>
      </div>
    </div>
  );
}

