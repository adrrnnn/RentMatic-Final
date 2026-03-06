'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { XenditService, PaymentMethod } from '@/lib/services/xenditService';
import { CreditCard, Wallet, Building, Store, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentRequestProps {
  amount: number;
  description: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  tenantEmail: string;
  landlordUserId: string;
  unitName: string;
  propertyName: string;
  availableMethods: PaymentMethod[];
  onPaymentCreated: (paymentId: string) => void;
}

export function PaymentRequest({ 
  amount, 
  description, 
  tenantId, 
  propertyId, 
  unitId, 
  tenantName,
  tenantEmail,
  landlordUserId,
  unitName,
  propertyName,
  availableMethods,
  onPaymentCreated 
}: PaymentRequestProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🚀 [PAYMENT-REQUEST] Starting payment creation...', {
        landlordUserId,
        propertyId,
        tenantId,
        amount,
        selectedMethod
      });
      
      // Use PaymentRequestService instead of old XenditService
      if (!propertyId || !tenantId) {
        throw new Error('Property ID and Tenant ID are required');
      }

      // Get property to fetch payment methods
      console.log('🔍 [PAYMENT-REQUEST] Fetching property...', { landlordUserId, propertyId });
      let property;
      try {
        property = await PropertyService.getProperty(landlordUserId, propertyId);
        console.log('✅ [PAYMENT-REQUEST] Property fetched:', property ? 'Found' : 'Not found');
      } catch (propError: any) {
        console.error('❌ [PAYMENT-REQUEST] Error fetching property:', {
          code: propError?.code,
          message: propError?.message,
          error: propError
        });
        throw propError;
      }
      
      const paymentMethods = (property?.paymentMethods && property.paymentMethods.length > 0)
        ? property.paymentMethods.filter((m: any) => m?.enabled !== false).map((m: any) => m.id)
        : [selectedMethod];
      
      console.log('🔍 [PAYMENT-REQUEST] Payment methods:', paymentMethods);

      // Create payment request using PaymentRequestService
      console.log('🔍 [PAYMENT-REQUEST] Calling PaymentRequestService.createPaymentRequest...');
      const paymentRequest = await PaymentRequestService.createPaymentRequest({
        landlordId: landlordUserId,
        propertyId,
        tenantId,
        amount,
        currency: 'PHP',
        description,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        paymentMethods
      });

      onPaymentCreated(paymentRequest.id);
    } catch (err: any) {
      console.error('Payment creation error:', {
        error: err,
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        landlordId: landlordUserId,
        propertyId,
        tenantId
      });
      
      // Extract more detailed error message
      let errorMessage = 'Failed to create payment. Please try again.';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please ensure you are logged in and have set up your payment account in the Payments tab.';
      } else if (err?.code) {
        errorMessage = `Error (${err.code}): ${err.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'ewallet': return <Wallet className="w-5 h-5" />;
      case 'bank': return <Building className="w-5 h-5" />;
      case 'card': return <CreditCard className="w-5 h-5" />;
      case 'retail': return <Store className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'ewallet': return 'border-blue-200 text-blue-600';
      case 'bank': return 'border-green-200 text-green-600';
      case 'card': return 'border-purple-200 text-purple-600';
      case 'retail': return 'border-orange-200 text-orange-600';
      default: return 'border-gray-200 text-gray-600';
    }
  };

  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod);
  const fees = selectedMethodData?.fees ? 
    (selectedMethodData.fees.percentage ? amount * (selectedMethodData.fees.percentage / 100) : 0) + 
    (selectedMethodData.fees.fixed || 0) : 0;
  const totalAmount = amount + fees;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">₱{amount.toLocaleString()}</span>
          </div>
          {fees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee</span>
              <span className="font-medium">₱{fees.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg">₱{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getMethodColor(method.type)}`}>
                  {getMethodIcon(method.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{method.icon}</span>
                    <h4 className="font-medium">{method.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {method.fees && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fee: {method.fees.percentage ? `${method.fees.percentage}%` : ''}
                      {method.fees.percentage && method.fees.fixed ? ' + ' : ''}
                      {method.fees.fixed ? `₱${method.fees.fixed}` : ''}
                    </p>
                  )}
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Payment Button */}
      <div className="flex justify-end">
        <Button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
        >
          {isProcessing ? 'Processing...' : `Pay ₱${totalAmount.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
}
