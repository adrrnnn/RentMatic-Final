'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { EmailJSService } from '@/lib/services/emailJSService';
import { XenditService, PaymentMethod } from '@/lib/services/xenditService';
import { LandlordAccountService } from '@/lib/services/landlordAccountService';
import { CreditCard, Wallet, Building, Store, AlertCircle, CheckCircle, Send, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TenantPaymentRequestProps {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  unitId: string;
  unitName: string;
  propertyName?: string;
  amount: number;
  description: string;
  dueDate: string;
  availableMethods: PaymentMethod[];
  landlordUserId: string; // For xenPlatform integration
  onPaymentCreated: (paymentId: string, paymentUrl: string) => void;
}

export function TenantPaymentRequest({ 
  tenantId,
  tenantName,
  tenantEmail,
  propertyId,
  unitId,
  unitName,
  propertyName,
  amount,
  description,
  dueDate,
  availableMethods,
  landlordUserId,
  onPaymentCreated
}: TenantPaymentRequestProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Check if landlord has xenPlatform sub-account
      let landlordSubAccountId: string | undefined;
      let platformFeePercentage: number | undefined;

      if (landlordUserId) {
        try {
          const landlordAccount = await LandlordAccountService.getLandlordAccount(landlordUserId);
          if (landlordAccount && landlordAccount.status === 'ACTIVE') {
            landlordSubAccountId = landlordAccount.xenditSubAccountId;
            platformFeePercentage = landlordAccount.platformFeePercentage;
          }
        } catch (err) {
          console.warn('Could not get landlord account, using regular payment:', err);
        }
      }

      // Use PaymentRequestService instead of old XenditService
      if (!propertyId || !tenantId) {
        throw new Error('Property ID and Tenant ID are required');
      }

      // Get property to fetch payment methods
      const property = await PropertyService.getProperty(landlordUserId, propertyId);
      const paymentMethods = (property?.paymentMethods && property.paymentMethods.length > 0)
        ? property.paymentMethods.filter((m: any) => m?.enabled !== false).map((m: any) => m.id)
        : ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'];

      // Create payment request using PaymentRequestService
      const paymentRequest = await PaymentRequestService.createPaymentRequest({
        landlordId: landlordUserId,
        propertyId,
        tenantId,
        amount,
        currency: 'PHP',
        description,
        dueDate: new Date(dueDate),
        paymentMethods
      });

      // Send email with payment link
      const dueDateStr = new Date(dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await EmailJSService.sendRentReminder({
        email: tenantEmail,
        tenantName,
        propertyName: propertyName || 'Property',
        unitName,
        rentAmount: amount,
        dueDate: dueDateStr,
        landlordName: 'Property Manager',
        paymentUrl: paymentRequest.xenditInvoiceUrl
      });

      toast.success('Payment request created and email sent successfully!');
      onPaymentCreated(paymentRequest.id, paymentRequest.xenditInvoiceUrl || '');
    } catch (err) {
      setError('Failed to create payment. Please try again.');
      console.error('Payment creation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    // This would integrate with your email service (EmailJS, etc.)
    // For now, we'll show a success message
    alert(`Payment request email sent to ${tenantEmail}`);
    setShowEmailForm(false);
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Request</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tenant</p>
            <p className="font-medium text-gray-900">{tenantName}</p>
            <p className="text-sm text-gray-600">{unitName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-2xl font-bold text-gray-900">₱{amount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{description}</p>
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

      {/* Fee Breakdown */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Rent Amount</span>
              <span className="font-medium">₱{amount.toLocaleString()}</span>
            </div>
            {fees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium">₱{fees.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg">₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className="flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
        >
          {isProcessing ? 'Processing...' : `Create Payment Link`}
        </Button>
        
        <Button
          onClick={() => setShowEmailForm(true)}
          variant="outline"
          className="px-6 py-3 border-green-300 text-green-600 hover:bg-green-50"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Payment Request Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Email
                </label>
                <input
                  type="email"
                  value={tenantEmail}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  placeholder="Add a personal message to the tenant..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowEmailForm(false)}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

