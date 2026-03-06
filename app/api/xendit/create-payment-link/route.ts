import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getClientDb } from '@/lib/firebase';
import { LandlordAccountService } from '@/lib/services/landlordAccountService';

// Initialize Firebase if not already initialized
if (!getApps().length) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  initializeApp(firebaseConfig);
}

const XENDIT_API_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_BASE_URL = 'https://api.xendit.co';
const WORKER_URL = process.env.XENDIT_WORKER_URL || 'https://xenditsecretkey.rentmatic495.workers.dev';

interface CreatePaymentLinkRequest {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  propertyName: string;
  unitName: string;
  dueDate?: string;
  landlordSubscriptionTier?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body: CreatePaymentLinkRequest = await request.json();
    const { 
      amount, 
      description, 
      customerEmail, 
      customerName,
      propertyName,
      unitName,
      dueDate 
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Customer email and name are required.' },
        { status: 400 }
      );
    }

    // Get user ID from auth token (you'll need to verify the token)
    // For now, we'll try to get it from the request
    // In production, you should verify the Firebase auth token
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please log in.' },
        { status: 401 }
      );
    }

    // Get landlord account to get Xendit for_user_id
    const landlordAccount = await LandlordAccountService.getLandlordAccount(userId);
    if (!landlordAccount) {
      return NextResponse.json(
        { error: 'Landlord account not found. Please complete payment setup first.' },
        { status: 400 }
      );
    }
    
    if (!landlordAccount.xenditForUserId) {
      return NextResponse.json(
        { error: 'Payment account not configured. Please set up your payment account in the Payments tab.' },
        { status: 400 }
      );
    }

    // Calculate invoice duration from due date (in seconds for Xendit API)
    const invoiceDuration = dueDate 
      ? (() => {
          const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const days = Math.max(7, daysUntilDue); // Minimum 7 days for sandbox testing
          return days * 24 * 60 * 60; // Convert days to seconds
        })()
      : 7 * 24 * 60 * 60; // Default 7 days in seconds

    // Create Xendit invoice via Cloudflare Worker
    const invoiceResponse = await fetch(`${WORKER_URL}/xendit/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `rent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: 'PHP',
        description: `${description} - ${unitName} at ${propertyName}`,
        invoice_duration: invoiceDuration,
        for_user_id: landlordAccount.xenditForUserId,
        payment_methods: ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'],
        should_send_email: true,
        customer: {
          given_names: customerName,
          email: customerEmail
        }
      })
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      let errorMessage = 'Failed to create payment link';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error('Xendit invoice creation failed:', {
        status: invoiceResponse.status,
        error: errorMessage
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: invoiceResponse.status }
      );
    }

    const invoiceData = await invoiceResponse.json();
    
    return NextResponse.json({
      paymentUrl: invoiceData.invoice_url,
      invoiceId: invoiceData.id,
      status: invoiceData.status,
      expiryDate: invoiceData.expiry_date
    });

  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

