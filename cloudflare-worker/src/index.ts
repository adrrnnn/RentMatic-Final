/**
 * Cloudflare Worker for RentMatic Xendit API Integration
 * Replaces Firebase Cloud Functions (requires Blaze plan)
 */

interface Env {
  XENDIT_SECRET_KEY: string;
  XENDIT_WEBHOOK_TOKEN?: string; // Optional for webhook verification
  APP_BASE_URL?: string; // For redirect URLs
}

const XENDIT_BASE_URL = 'https://api.xendit.co';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function handleCORS(request: Request): Promise<Response | null> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

function createAuthHeader(apiKey: string): string {
  // Basic auth: Base64(apiKey:)
  const encoded = btoa(`${apiKey}:`);
  return `Basic ${encoded}`;
}

/**
 * Create Xendit sub-account (XenPlatform)
 * POST /xendit/sub-account
 */
async function handleCreateSubAccount(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.XENDIT_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Xendit API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { email, given_name, family_name, type = 'INDIVIDUAL' } = body;

    if (!email || !given_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, given_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${XENDIT_BASE_URL}/v2/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(env.XENDIT_SECRET_KEY),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        given_name,
        family_name: family_name || '',
        type,
        public_profile: {
          business_name: `${given_name} ${family_name || ''}`.trim() || given_name
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xendit API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create sub-account', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        id: result.id,
        email: result.email,
        status: result.status,
        public_profile: result.public_profile
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Xendit sub-account:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Create Xendit invoice
 * POST /xendit/invoice
 */
async function handleCreateInvoice(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.XENDIT_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Xendit API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      external_id,
      amount,
      currency = 'PHP',
      description,
      invoice_duration,
      for_user_id,
      payment_methods = [],
      should_send_email = false
    } = body;

    if (!external_id || !amount || !for_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: external_id, amount, for_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = env.APP_BASE_URL || 'https://rentmatic-b24ff.web.app';
    
    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(env.XENDIT_SECRET_KEY),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id,
        amount,
        currency,
        description,
        invoice_duration: invoice_duration || (7 * 24 * 60 * 60), // default 7 days in seconds
        for_user_id,
        payment_methods: payment_methods.length > 0 ? payment_methods : undefined,
        should_send_email,
        success_redirect_url: `${baseUrl}/payments/success?id={invoice_id}`,
        failure_redirect_url: `${baseUrl}/payments/failure?id={invoice_id}`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xendit API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        id: result.id,
        external_id: result.external_id,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        invoice_url: result.invoice_url,
        expiry_date: result.expiry_date,
        created: result.created
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Xendit invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get Xendit invoice status
 * GET /xendit/invoice/:invoiceId
 */
async function handleGetInvoice(request: Request, env: Env, invoiceId: string): Promise<Response> {
  try {
    if (!env.XENDIT_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Xendit API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(env.XENDIT_SECRET_KEY),
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xendit API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get invoice', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        id: result.id,
        external_id: result.external_id,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        invoice_url: result.invoice_url,
        expiry_date: result.expiry_date,
        created: result.created,
        paid_at: result.paid_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting Xendit invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle Xendit webhook
 * POST /xendit/webhook
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // Optional: Verify webhook token if configured
    if (env.XENDIT_WEBHOOK_TOKEN) {
      const token = request.headers.get('x-callback-token');
      if (token !== env.XENDIT_WEBHOOK_TOKEN) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const webhookData = await request.json();
    const { event, data } = webhookData;

    console.log('Xendit webhook received:', { event, invoiceId: data?.id });

    // Return success - actual Firestore update should be handled by client-side webhook listener
    // or a separate worker that has Firestore Admin SDK access
    // For now, we'll just acknowledge receipt
    
    return new Response(
      JSON.stringify({ received: true, event, invoiceId: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Main Worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = await handleCORS(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;

    // Route to appropriate handler
    if (path === '/xendit/sub-account' || path.endsWith('/xendit/sub-account')) {
      if (request.method === 'POST') {
        return handleCreateSubAccount(request, env);
      }
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Handle GET invoice (e.g., /xendit/invoice/inv_123456)
    const invoiceMatch = path.match(/^\/xendit\/invoice\/(.+)$/);
    if (invoiceMatch) {
      if (request.method === 'GET') {
        return handleGetInvoice(request, env, invoiceMatch[1]);
      }
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    if (path === '/xendit/invoice' || path.endsWith('/xendit/invoice')) {
      if (request.method === 'POST') {
        return handleCreateInvoice(request, env);
      }
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    if (path === '/xendit/webhook' || path.endsWith('/xendit/webhook')) {
      if (request.method === 'POST') {
        return handleWebhook(request, env);
      }
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Health check endpoint
    if (path === '/' || path === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'rentmatic-xendit-api' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};










