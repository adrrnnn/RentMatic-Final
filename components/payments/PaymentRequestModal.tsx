'use client';

import { useState } from 'react';
import { X, CreditCard, User, Mail, DollarSign, Calendar, Building2, Send } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'react-hot-toast';

interface Tenant {
  id: string;
  fullName: string;
  contact: {
    email: string;
    phone: string;
  };
  unitId?: string | null;
}

interface Unit {
  id: string;
  name: string;
  rentAmount: number;
  billingSettings?: {
    dueDay: number;
    graceDays: number;
  };
}

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  tenants: Tenant[];
  units: Unit[];
}

export default function PaymentRequestModal({
  isOpen,
  onClose,
  propertyName,
  tenants,
  units
}: PaymentRequestModalProps) {
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenant || !amount || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const tenant = tenants.find(t => t.id === selectedTenant);
      const unit = units.find(u => u.id === tenant?.unitId);
      
      if (!tenant || !unit) {
        toast.error('Selected tenant or unit not found');
        return;
      }

      // Create payment request via API
      const response = await fetch('/api/xendit/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description,
          customerEmail: tenant.contact.email,
          customerName: tenant.fullName,
          propertyName: propertyName,
          dueDate: dueDate || undefined,
          unitName: unit.name,
          landlordSubscriptionTier: 'free' // TODO: Get from user profile
        }),
      });

      const data = await response.json();

      if (data.paymentUrl) {
        // Copy payment link to clipboard
        await navigator.clipboard.writeText(data.paymentUrl);
        toast.success('Payment request sent successfully! Tenant will receive a secure payment link.');
        
        // Reset form
        setSelectedTenant('');
        setAmount('');
        setDescription('');
        setDueDate('');
        onClose();
      } else {
        console.error('No payment URL in response:', data);
        toast.error(`Failed to create payment link: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error('Failed to create payment link');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Payment Request</h2>
              <p className="text-sm text-gray-600">Create a secure payment link for your tenant</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="p-2 hover:bg-gray-50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Property Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{propertyName}</p>
                <p className="text-sm text-blue-700">Property</p>
              </div>
            </div>
          </div>

          {/* Select Tenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Select Tenant *
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Choose a tenant...</option>
              {tenants.map((tenant) => {
                const unit = units.find(u => u.id === tenant.unitId);
                return (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.fullName} - {unit?.name || 'Unknown Unit'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Amount (₱) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              min="1"
              step="0.01"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly rent for January 2025"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="w-4 h-4 mr-2" />
                  Create Payment Request
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



