import { NextRequest, NextResponse } from 'next/server';

const XENDIT_API_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_BASE_URL = 'https://api.xendit.co';

interface CreateInvoiceRequest {
  external_id: string;
  amount: number;
  currency: string;
  description: string;
  invoice_duration: number;
  for_user_id: string;
  payment_methods: string[];
  should_send_email: boolean;
}

export async function POST(request: NextRequest) {
  try {
    if (!XENDIT_API_KEY) {
      return NextResponse.json(
        { error: 'Xendit API key not configured' },
        { status: 500 }
      );
    }

    const body: CreateInvoiceRequest = await request.json();
    const { 
      external_id, 
      amount, 
      currency, 
      description, 
      invoice_duration,
      for_user_id,
      payment_methods,
      should_send_email 
    } = body;

    // Create invoice via Xendit API
    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id,
        amount,
        currency,
        description,
        invoice_duration,
        for_user_id,
        payment_methods,
        should_send_email,
        success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payments/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payments/failure`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xendit API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create invoice', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      id: result.id,
      external_id: result.external_id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      invoice_url: result.invoice_url,
      expiry_date: result.expiry_date,
      created: result.created
    });

  } catch (error) {
    console.error('Error creating Xendit invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










