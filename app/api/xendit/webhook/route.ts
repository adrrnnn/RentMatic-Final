import { NextRequest, NextResponse } from 'next/server';
import { PaymentRequestService } from '@/lib/services/paymentRequestService';

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook token
    const token = request.headers.get('x-callback-token');
    if (token !== XENDIT_WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, data } = body;

    console.log('Xendit webhook received:', { event, invoiceId: data?.id });

    switch (event) {
      case 'invoice.paid':
        await handleInvoicePaid(data);
        break;
      
      case 'invoice.expired':
        await handleInvoiceExpired(data);
        break;
      
      case 'invoice.failed':
        await handleInvoiceFailed(data);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInvoicePaid(data: any) {
  try {
    const { id: invoiceId, paid_at } = data;
    const paidAt = paid_at ? new Date(paid_at) : new Date();
    
    await PaymentRequestService.updatePaymentStatus(invoiceId, 'paid', paidAt);
    
    console.log(`Invoice ${invoiceId} marked as paid`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoiceExpired(data: any) {
  try {
    const { id: invoiceId } = data;
    
    await PaymentRequestService.updatePaymentStatus(invoiceId, 'expired');
    
    console.log(`Invoice ${invoiceId} marked as expired`);
  } catch (error) {
    console.error('Error handling invoice expired:', error);
  }
}

async function handleInvoiceFailed(data: any) {
  try {
    const { id: invoiceId } = data;
    
    await PaymentRequestService.updatePaymentStatus(invoiceId, 'failed');
    
    console.log(`Invoice ${invoiceId} marked as failed`);
  } catch (error) {
    console.error('Error handling invoice failed:', error);
  }
}










