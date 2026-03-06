'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { CreditCard, CheckCircle } from 'lucide-react';
import { XenditService } from '@/lib/services/xenditService';

interface LandlordAccountSetupProps {
  userId: string;
  userEmail: string;
  onAccountCreated: (accountId: string, selectedMethods: string[]) => void;
  onCancel: () => void;
}

export function LandlordAccountSetup({ 
  userId, 
  userEmail, 
  onAccountCreated, 
  onCancel 
}: LandlordAccountSetupProps) {
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPaymentMethods.length === 0) {
      setError('Please select at least one payment method');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Create real Xendit sub-account
      const businessName = `RentMatic Property Manager - ${userEmail.split('@')[0]}`;
      const subAccount = await XenditService.createSubAccount(
        userId,
        userEmail,
        businessName
      );
      
      setSuccess(true);
      onAccountCreated(subAccount.id, selectedPaymentMethods);
    } catch (error) {
      console.error('Error setting up payment methods:', error);
      setError('Failed to setup payment account. Please check your internet connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Methods Setup Complete!</h3>
        <p className="text-gray-600 mb-6">
          Your tenants can now pay their rent using the selected payment methods.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Selected Payment Methods:</strong> {selectedPaymentMethods.map(method => {
              const methodNames = {
                'gcash': 'GCash',
                'paymaya': 'PayMaya', 
                'grabpay': 'GrabPay',
                'bank': 'Bank Transfer',
                'card': 'Credit/Debit Cards',
                'cash': 'Cash Payment'
              };
              return methodNames[method as keyof typeof methodNames];
            }).join(', ')}
          </p>
          <p className="text-sm text-green-800 mt-1">
            Your tenants will see these payment options when they need to pay rent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Payment Methods</h2>
        <p className="text-gray-600">
          Choose which payment methods your tenants can use to pay rent
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Payment Method Selection */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Methods</h3>
            <p className="text-sm text-gray-600 mb-6">
              Select which payment methods your tenants can use to pay rent. You can choose multiple options.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* GCash */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('gcash')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'gcash']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'gcash'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('gcash')
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <img 
                        src="https://logo.dev/gcash.com?size=48&theme=light" 
                        alt="GCash" 
                        className="w-12 h-12 object-contain" 
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">GCash</div>
                      <div className="text-sm text-gray-500">Mobile wallet</div>
                    </div>
                    {selectedPaymentMethods.includes('gcash') && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* PayMaya */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('paymaya')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'paymaya']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'paymaya'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('paymaya')
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <img 
                        src="https://logo.dev/maya.ph?size=48&theme=light" 
                        alt="PayMaya" 
                        className="w-12 h-12 object-contain" 
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">PayMaya</div>
                      <div className="text-sm text-gray-500">Digital wallet</div>
                    </div>
                    {selectedPaymentMethods.includes('paymaya') && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* GrabPay */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('grabpay')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'grabpay']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'grabpay'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('grabpay')
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <img 
                        src="https://logo.dev/grab.com?size=48&theme=light" 
                        alt="GrabPay" 
                        className="w-12 h-12 object-contain" 
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">GrabPay</div>
                      <div className="text-sm text-gray-500">Super app wallet</div>
                    </div>
                    {selectedPaymentMethods.includes('grabpay') && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Bank Transfer */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('bank')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'bank']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'bank'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('bank')
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-2xl">🏦</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">Bank Transfer</div>
                      <div className="text-sm text-gray-500">Direct bank deposit</div>
                    </div>
                    {selectedPaymentMethods.includes('bank') && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Credit/Debit Cards */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('card')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'card']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'card'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('card')
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-2xl">💳</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">Credit/Debit Cards</div>
                      <div className="text-sm text-gray-500">Visa, Mastercard, etc.</div>
                    </div>
                    {selectedPaymentMethods.includes('card') && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Cash Payment */}
              <label className="relative cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPaymentMethods.includes('cash')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentMethods([...selectedPaymentMethods, 'cash']);
                    } else {
                      setSelectedPaymentMethods(selectedPaymentMethods.filter(method => method !== 'cash'));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                  selectedPaymentMethods.includes('cash')
                    ? 'border-yellow-500 bg-yellow-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-2xl">💵</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">Cash Payment</div>
                      <div className="text-sm text-gray-500">Manual collection</div>
                    </div>
                    {selectedPaymentMethods.includes('cash') && (
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-6 py-3"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || selectedPaymentMethods.length === 0}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              'Save Payment Methods'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}