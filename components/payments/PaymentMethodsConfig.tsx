'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { XenditService, PaymentMethod } from '@/lib/services/xenditService';
import { PaymentMethodIcon } from '@/components/payments/PaymentMethodIcon';
import { Check } from 'lucide-react';

interface PaymentMethodsConfigProps {
  propertyId: string;
  onSave: (methods: PaymentMethod[]) => void;
  onClose?: () => void;
  initialMethods?: PaymentMethod[];
}

export function PaymentMethodsConfig({ propertyId, onSave, onClose, initialMethods = [] }: PaymentMethodsConfigProps) {
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>(initialMethods);
  const [isLoading, setIsLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const methods = await XenditService.getAvailablePaymentMethods();
        setAvailableMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }
    })();
  }, []);

  const handleMethodToggle = (method: PaymentMethod) => {
    setSelectedMethods(prev => {
      const isSelected = prev.some(m => m.id === method.id);
      if (isSelected) {
        return prev.filter(m => m.id !== method.id);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedMethods);
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'ewallet': return 'bg-blue-50 border-blue-200';
      case 'bank': return 'bg-green-50 border-green-200';
      case 'card': return 'bg-purple-50 border-purple-200';
      case 'retail': return 'bg-orange-50 border-orange-200';
      case 'cash': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Payment Methods</h3>
        <p className="text-sm text-gray-600">
          Select which payment methods tenants can use to pay rent and other fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableMethods.map((method) => {
          const isSelected = selectedMethods.some(m => m.id === method.id);
          
          return (
            <div
              key={method.id}
              onClick={() => handleMethodToggle(method)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : `${getMethodColor(method.type)} hover:border-gray-300`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <PaymentMethodIcon 
                    icon={method.icon} 
                    size="md" 
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    {method.fees && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          Fees: {method.fees.percentage ? `${method.fees.percentage}%` : ''}
                          {method.fees.percentage && method.fees.fixed ? ' + ' : ''}
                          {method.fees.fixed ? `₱${method.fees.fixed}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => setSelectedMethods([])}
          className="px-6 py-2"
        >
          Clear All
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || selectedMethods.length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : `Save ${selectedMethods.length} Methods`}
        </Button>
      </div>
    </div>
  );
}
