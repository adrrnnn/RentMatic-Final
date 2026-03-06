'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { X, DollarSign, Calendar, FileText, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OneTimeChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: {
    id: string;
    fullName: string;
    contact?: {
      email?: string;
    };
  };
  unit: {
    id: string;
    name: string;
    rentAmount: number;
  };
  onChargeAdded: (charge: OneTimeCharge) => void;
}

interface OneTimeCharge {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  description: string;
  dueDate: string;
  type: 'late_fee' | 'maintenance' | 'utility' | 'penalty' | 'other';
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
}

const chargeTypes = [
  { id: 'late_fee', name: 'Late Fee', icon: '⏰', color: 'text-red-600' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: 'text-blue-600' },
  { id: 'utility', name: 'Utility', icon: '⚡', color: 'text-green-600' },
  { id: 'penalty', name: 'Penalty', icon: '⚠️', color: 'text-orange-600' },
  { id: 'other', name: 'Other', icon: '📝', color: 'text-gray-600' },
];

export function OneTimeChargeModal({
  isOpen,
  onClose,
  tenant,
  unit,
  onChargeAdded
}: OneTimeChargeModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: '',
    type: 'late_fee' as OneTimeCharge['type']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const charge: OneTimeCharge = {
        id: `charge_${Date.now()}`,
        tenantId: tenant.id,
        unitId: unit.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        dueDate: formData.dueDate,
        type: formData.type,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Here you would save to Firebase
      // await ChargeService.createCharge(charge);
      
      onChargeAdded(charge);
      toast.success(`One-time charge of ₱${charge.amount.toLocaleString()} added for ${tenant.fullName}`);
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        dueDate: '',
        type: 'late_fee'
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating charge:', error);
      toast.error('Failed to create charge');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Plus className="w-4 h-4 text-purple-600" />
              </div>
              Add One-Time Charge
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Add a one-time charge for <span className="font-medium">{tenant.fullName}</span> in <span className="font-medium">{unit.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Charge Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Charge Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {chargeTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id as OneTimeCharge['type'] }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.type === type.id
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className={`text-sm font-medium ${type.color}`}>
                      {type.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₱)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe the charge (e.g., Late payment fee for December rent)"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Charge Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tenant:</span>
                <span className="font-medium">{tenant.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Unit:</span>
                <span className="font-medium">{unit.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium text-purple-600">
                  ₱{formData.amount ? parseFloat(formData.amount).toLocaleString() : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Due:</span>
                <span className="font-medium">
                  {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Charge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



