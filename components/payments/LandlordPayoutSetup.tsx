'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Banknote, CheckCircle, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { RealPaymentService, LandlordPayoutMethod } from '@/lib/services/realPaymentService';

interface LandlordPayoutSetupProps {
  userId: string;
  onPayoutMethodAdded: (method: LandlordPayoutMethod) => void;
  onCancel: () => void;
}

export function LandlordPayoutSetup({ 
  userId, 
  onPayoutMethodAdded, 
  onCancel 
}: LandlordPayoutSetupProps) {
  const [payoutType, setPayoutType] = useState<'bank_account' | 'ewallet' | 'cash'>('bank_account');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Bank account form
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // E-wallet form
  const [ewalletCode, setEwalletCode] = useState('');
  const [ewalletNumber, setEwalletNumber] = useState('');

  const banks = [
    { code: 'BCA', name: 'Bank Central Asia' },
    { code: 'BNI', name: 'Bank Negara Indonesia' },
    { code: 'BRI', name: 'Bank Rakyat Indonesia' },
    { code: 'MANDIRI', name: 'Bank Mandiri' },
    { code: 'PERMATA', name: 'Bank Permata' }
  ];

  const ewallets = [
    { code: 'GCASH', name: 'GCash' },
    { code: 'PAYMAYA', name: 'PayMaya' },
    { code: 'GRABPAY', name: 'GrabPay' },
    { code: 'SHOPEEPAY', name: 'ShopeePay' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let payoutMethod: Omit<LandlordPayoutMethod, 'id' | 'createdAt' | 'updatedAt' | 'isVerified'>;

      if (payoutType === 'bank_account') {
        if (!bankCode || !accountNumber || !accountName) {
          setError('Please fill in all bank account details');
          return;
        }
        payoutMethod = {
          type: 'bank_account',
          bankCode,
          accountNumber,
          accountName,
          isDefault: true
        };
      } else if (payoutType === 'ewallet') {
        if (!ewalletCode || !ewalletNumber) {
          setError('Please fill in all e-wallet details');
          return;
        }
        payoutMethod = {
          type: 'ewallet',
          ewalletCode,
          ewalletNumber,
          isDefault: true
        };
      } else {
        // Cash payment - no additional details needed
        payoutMethod = {
          type: 'cash',
          isDefault: true
        };
      }

      const newPayoutMethod = await RealPaymentService.addPayoutMethod(userId, payoutMethod);
      setSuccess(true);
      onPayoutMethodAdded(newPayoutMethod);
    } catch (error) {
      console.error('Error adding payout method:', error);
      setError('Failed to add payout method. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payout Method Added!</h3>
        <p className="text-gray-600 mb-6">
          Your payout method has been configured. When tenants pay rent, the money will be automatically transferred to your account.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>How it works:</strong> When tenants pay rent, Xendit holds the money and automatically transfers it to your chosen payout method within 1-2 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Banknote className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Payout Method</h2>
        <p className="text-gray-600">
          Choose how you want to receive rent payments from your tenants
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Payout Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose Payout Method</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bank Account */}
            <label className="relative cursor-pointer group">
              <input
                type="radio"
                name="payoutType"
                value="bank_account"
                checked={payoutType === 'bank_account'}
                onChange={(e) => setPayoutType(e.target.value as any)}
                className="sr-only"
              />
              <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                payoutType === 'bank_account'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Bank Account</div>
                    <div className="text-sm text-gray-500">Direct bank transfer</div>
                  </div>
                </div>
              </div>
            </label>

            {/* E-Wallet */}
            <label className="relative cursor-pointer group">
              <input
                type="radio"
                name="payoutType"
                value="ewallet"
                checked={payoutType === 'ewallet'}
                onChange={(e) => setPayoutType(e.target.value as any)}
                className="sr-only"
              />
              <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                payoutType === 'ewallet'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">E-Wallet</div>
                    <div className="text-sm text-gray-500">GCash, PayMaya, etc.</div>
                  </div>
                </div>
              </div>
            </label>

            {/* Cash */}
            <label className="relative cursor-pointer group">
              <input
                type="radio"
                name="payoutType"
                value="cash"
                checked={payoutType === 'cash'}
                onChange={(e) => setPayoutType(e.target.value as any)}
                className="sr-only"
              />
              <div className={`p-6 border-2 rounded-xl transition-all duration-200 group-hover:shadow-lg ${
                payoutType === 'cash'
                  ? 'border-yellow-500 bg-yellow-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Cash</div>
                    <div className="text-sm text-gray-500">Manual collection</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Bank Account Form */}
        {payoutType === 'bank_account' && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account holder name"
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* E-Wallet Form */}
        {payoutType === 'ewallet' && (
          <Card>
            <CardHeader>
              <CardTitle>E-Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Wallet Provider
                </label>
                <select
                  value={ewalletCode}
                  onChange={(e) => setEwalletCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select E-Wallet</option>
                  {ewallets.map((ewallet) => (
                    <option key={ewallet.code} value={ewallet.code}>
                      {ewallet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Wallet Number
                </label>
                <input
                  type="text"
                  value={ewalletNumber}
                  onChange={(e) => setEwalletNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter e-wallet number"
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Payment Info */}
        {payoutType === 'cash' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Cash Payment</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You'll collect rent payments manually from tenants. No automatic payout setup needed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              'Save Payout Method'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}












