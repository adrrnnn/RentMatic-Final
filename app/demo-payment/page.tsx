'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle, Clock, Building2, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'react-hot-toast';

function DemoPaymentContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const amount = searchParams.get('amount');
  const description = searchParams.get('description');
  const tenant = searchParams.get('tenant');

  const handlePayment = async (method: string) => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPaymentSuccess(true);
    toast.success('Payment processed successfully!');
    setIsProcessing(false);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment of ₱{amount} has been processed successfully.
          </p>
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
              You will receive a confirmation email shortly. Thank you for your payment!
            </p>
          </div>
          <Button
            onClick={() => window.close()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">RentMatic Payment</h1>
              <p className="text-blue-100">Secure payment processing</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6 space-y-6">
          {/* Payment Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Demo Mode
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tenant:</span>
                <span className="font-medium">{tenant}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">{description}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-gray-900">Amount:</span>
                <span className="text-green-600">₱{amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GCash */}
              <button
                onClick={() => handlePayment('gcash')}
                disabled={isProcessing}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">GC</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">GCash</p>
                    <p className="text-sm text-gray-500">Mobile wallet</p>
                  </div>
                </div>
              </button>

              {/* PayMaya */}
              <button
                onClick={() => handlePayment('paymaya')}
                disabled={isProcessing}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">PM</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">PayMaya</p>
                    <p className="text-sm text-gray-500">Mobile wallet</p>
                  </div>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                onClick={() => handlePayment('bank')}
                disabled={isProcessing}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Online banking</p>
                  </div>
                </div>
              </button>

              {/* Credit Card */}
              <button
                onClick={() => handlePayment('card')}
                disabled={isProcessing}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-800 font-medium">Processing your payment...</p>
              <p className="text-sm text-blue-600 mt-2">Please wait while we process your transaction</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                <p className="text-xs text-gray-600 mt-1">
                  This is a demo payment page. In production, this would be secured by Xendit&apos;s payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment page...</p>
        </div>
      </div>
    }>
      <DemoPaymentContent />
    </Suspense>
  );
}



