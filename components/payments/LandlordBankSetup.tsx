'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { WorkingXenditService } from '@/lib/services/workingXenditService';
import { Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LandlordBankSetupProps {
  userId: string;
  onBankDetailsAdded: (details: { bankCode: string; accountNumber: string; accountHolderName: string }) => void;
  onCancel: () => void;
}

export function LandlordBankSetup({ 
  userId, 
  onBankDetailsAdded, 
  onCancel 
}: LandlordBankSetupProps) {
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const banks = [
    { code: 'BCA', name: 'Bank Central Asia' },
    { code: 'BNI', name: 'Bank Negara Indonesia' },
    { code: 'BRI', name: 'Bank Rakyat Indonesia' },
    { code: 'MANDIRI', name: 'Bank Mandiri' },
    { code: 'PERMATA', name: 'Bank Permata' },
    { code: 'BDO', name: 'BDO Unibank' },
    { code: 'BPI', name: 'BPI' },
    { code: 'METROBANK', name: 'Metrobank' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankCode || !accountNumber || !accountName) {
      setError('Please fill in all bank details');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const bankDetails = await WorkingXenditService.addLandlordBankDetails(userId, {
        bankCode,
        accountNumber,
        accountName
      });
      
      setSuccess(true);
      onBankDetailsAdded(bankDetails);
      toast.success('Bank details saved successfully!');
    } catch (error) {
      console.error('Error adding bank details:', error);
      setError('Failed to save bank details. Please try again.');
      toast.error('Failed to save bank details');
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank Details Saved!</h3>
        <p className="text-gray-600 mb-6">
          Your bank details have been configured. When tenants pay rent, the money will be automatically transferred to your account.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>How it works:</strong> When tenants pay rent, the money goes to your Xendit account, then automatically gets transferred to your bank account.
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Bank Details</h2>
        <p className="text-gray-600">
          Enter your bank account details where you want to receive rent payments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
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
                Saving...
              </>
            ) : (
              'Save Bank Details'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
