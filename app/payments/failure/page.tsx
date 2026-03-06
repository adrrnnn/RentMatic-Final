'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import Link from 'next/link';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<{
    invoiceId: string | null;
    amount: string | null;
    description: string | null;
  } | null>(null);

  useEffect(() => {
    // Get payment details from URL parameters
    const invoiceId = searchParams.get('invoice_id');
    const amount = searchParams.get('amount');
    const description = searchParams.get('description');
    
    if (invoiceId || amount) {
      setPaymentDetails({
        invoiceId,
        amount,
        description
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed. This could be due to insufficient funds, 
          incorrect payment details, or network issues.
        </p>

        {paymentDetails && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="space-y-2 text-left">
              {paymentDetails.invoiceId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice ID:</span>
                  <span className="font-medium">{paymentDetails.invoiceId}</span>
                </div>
              )}
              {paymentDetails.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₱{paymentDetails.amount}</span>
                </div>
              )}
              {paymentDetails.description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium">{paymentDetails.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-red-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">
            Please try again or contact support if the problem persists. Your payment has not been charged.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to RentMatic
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}


