'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<{
    invoiceId: string | null;
    amount: string | null;
    description: string | null;
  } | null>(null);
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    // Get payment details from URL parameters
    const invoiceId = searchParams.get('invoice_id') || searchParams.get('id');
    const amount = searchParams.get('amount');
    const description = searchParams.get('description');
    
    if (invoiceId || amount) {
      setPaymentDetails({
        invoiceId,
        amount,
        description
      });
    }

    // Sync payment status immediately when landing on success page
    if (invoiceId) {
      console.log('[PAYMENT-SUCCESS] Invoice ID from URL:', invoiceId);
      syncPaymentStatus(invoiceId);
    }
  }, [searchParams]);

  const syncPaymentStatus = async (invoiceId: string, retryCount: number = 0) => {
    try {
      console.log(`[PAYMENT-SUCCESS] Syncing payment status for invoice: ${invoiceId} (attempt ${retryCount + 1})`);
      const result = await PaymentRequestService.syncPaymentStatusFromXendit(invoiceId);
      console.log('[PAYMENT-SUCCESS] Sync result:', result);
      
      if (result.updated) {
        console.log('[PAYMENT-SUCCESS] ✅ Payment status updated to:', result.status);
        setStatusUpdated(true);
        // Wait a moment then redirect to finance page to see updated status
        setTimeout(() => {
          window.location.href = '/finance?synced=true';
        }, 2000);
      } else {
        console.log('[PAYMENT-SUCCESS] Status already up to date:', result.status);
        // Even if not updated, check if it's already paid
        if (result.status === 'paid') {
          setStatusUpdated(true);
          setTimeout(() => {
            window.location.href = '/finance?synced=true';
          }, 2000);
        } else if (retryCount < 2) {
          // Retry after 3 seconds if status is still not paid
          console.log(`[PAYMENT-SUCCESS] Retrying sync in 3 seconds... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            syncPaymentStatus(invoiceId, retryCount + 1);
          }, 3000);
        } else {
          console.warn('[PAYMENT-SUCCESS] ⚠️ Payment sync failed after 3 attempts. Status may update automatically.');
          // Still redirect but show a message
          setTimeout(() => {
            window.location.href = '/finance?sync_failed=true';
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('[PAYMENT-SUCCESS] Error syncing payment status:', error);
      
      // If it's a Cloudflare Worker error, retry a few times
      if ((error?.message?.includes('Xendit API key not configured') || error?.message?.includes('500')) && retryCount < 2) {
        console.log(`[PAYMENT-SUCCESS] Retrying sync in 5 seconds... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          syncPaymentStatus(invoiceId, retryCount + 1);
        }, 5000);
      } else {
        // After retries, redirect anyway - user can manually sync
        console.warn('[PAYMENT-SUCCESS] ⚠️ Payment sync unavailable. Please use the "Sync Payments" button on the finance page.');
        setTimeout(() => {
          window.location.href = '/finance?sync_failed=true';
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Thank you for your payment!
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

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            You will receive a confirmation email shortly. Keep this page for your records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/finance">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Financial Summary
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        {statusUpdated && (
          <div className="mt-4 text-sm text-green-600">
            ✅ Payment status updated! Redirecting to financial summary...
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}



