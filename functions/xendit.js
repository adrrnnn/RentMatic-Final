// Xendit API Configuration
const XENDIT_API_KEY = functions.config().xendit?.secret_key;
const XENDIT_BASE_URL = 'https://api.xendit.co';

// Create Xendit sub-account
exports.createXenditSubAccount = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const { email, given_name, family_name, type } = req.body;

      const response = await fetch(`${XENDIT_BASE_URL}/v2/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          given_name,
          family_name,
          type,
          public_profile: {
            business_name: `${given_name} ${family_name}`.trim()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Xendit API error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to create sub-account',
          details: errorData
        });
      }

      const result = await response.json();
      
      return res.json({
        id: result.id,
        email: result.email,
        status: result.status,
        public_profile: result.public_profile
      });

    } catch (error) {
      console.error('Error creating Xendit sub-account:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Create Xendit invoice
exports.createXenditInvoice = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const { 
        external_id, 
        amount, 
        currency, 
        description, 
        invoice_duration,
        for_user_id,
        payment_methods,
        should_send_email 
      } = req.body;

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
          success_redirect_url: `${functions.config().app?.base_url}/payments/success`,
          failure_redirect_url: `${functions.config().app?.base_url}/payments/failure`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Xendit API error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to create invoice',
          details: errorData
        });
      }

      const result = await response.json();
      
      return res.json({
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
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Xendit webhook handler
exports.xenditWebhook = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const token = req.headers['x-callback-token'];
      const expectedToken = functions.config().xendit?.webhook_token;
      
      if (token !== expectedToken) {
        console.error('Invalid webhook token');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { event, data } = req.body;
      console.log('Xendit webhook received:', { event, invoiceId: data?.id });

      const db = admin.firestore();

      switch (event) {
        case 'invoice.paid':
          await handleInvoicePaid(db, data);
          break;
        
        case 'invoice.expired':
          await handleInvoiceExpired(db, data);
          break;
        
        case 'invoice.failed':
          await handleInvoiceFailed(db, data);
          break;
        
        default:
          console.log('Unhandled webhook event:', event);
      }

      return res.json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Helper functions for webhook processing
async function handleInvoicePaid(db, data) {
  try {
    const { id: invoiceId, paid_at } = data;
    const paidAt = paid_at ? new Date(paid_at) : new Date();
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'paid',
        paidAt: paidAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as paid`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoiceExpired(db, data) {
  try {
    const { id: invoiceId } = data;
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as expired`);
  } catch (error) {
    console.error('Error handling invoice expired:', error);
  }
}

async function handleInvoiceFailed(db, data) {
  try {
    const { id: invoiceId } = data;
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as failed`);
  } catch (error) {
    console.error('Error handling invoice failed:', error);
  }
}

// Sync invoice status from Xendit
exports.syncXenditInvoice = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const invoiceId = req.query.invoiceId;
      if (!invoiceId) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }

      console.log(`[FIREBASE-FUNCTION] Fetching invoice status from Xendit for invoice: ${invoiceId}`);

      // Fetch invoice status directly from Xendit API
      const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FIREBASE-FUNCTION] Xendit API error (${response.status}):`, errorText);
        return res.status(response.status).json({
          error: 'Failed to fetch invoice status',
          details: errorText
        });
      }

      const invoiceData = await response.json();
      console.log(`[FIREBASE-FUNCTION] Xendit invoice data:`, invoiceData);
      
      const xenditStatus = (invoiceData.status || '').toLowerCase();
      console.log(`[FIREBASE-FUNCTION] Xendit status: "${xenditStatus}"`);

      // Map Xendit status to our status
      let ourStatus = 'pending';
      if (xenditStatus === 'paid' || xenditStatus === 'settled') {
        ourStatus = 'paid';
      } else if (xenditStatus === 'expired' || xenditStatus === 'voided' || xenditStatus === 'canceled') {
        ourStatus = 'expired';
      } else if (xenditStatus === 'failed') {
        ourStatus = 'failed';
      }

      // Update Firestore if status changed
      const db = admin.firestore();
      const paymentsQuery = db.collection('working_payments')
        .where('xenditInvoiceId', '==', invoiceId);
      
      const paymentsSnap = await paymentsQuery.get();
      
      if (paymentsSnap.empty) {
        console.warn(`[FIREBASE-FUNCTION] No payment found with invoice ID ${invoiceId}`);
        return res.json({
          success: true,
          invoiceId,
          status: ourStatus,
          updated: false,
          message: 'No payment found'
        });
      }

      const currentPayment = paymentsSnap.docs[0].data();
      const currentStatus = String(currentPayment.status || '').toLowerCase().trim();
      const ourStatusLower = ourStatus.toLowerCase().trim();
      
      console.log(`[FIREBASE-FUNCTION] Invoice ${invoiceId}: Xendit status="${xenditStatus}", Firestore status="${currentStatus}", mapped status="${ourStatusLower}"`);
      
      let updated = false;
      if (currentStatus !== ourStatusLower) {
        const paidAt = invoiceData.paid_at ? new Date(invoiceData.paid_at) : undefined;
        const batch = db.batch();
        
        paymentsSnap.docs.forEach(doc => {
          const updateData = {
            status: ourStatusLower,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (paidAt && ourStatus === 'paid') {
            updateData.paidAt = admin.firestore.Timestamp.fromDate(paidAt);
          }
          
          batch.update(doc.ref, updateData);
        });
        
        await batch.commit();
        updated = true;
        console.log(`[FIREBASE-FUNCTION] ✅ Successfully updated payment status to "${ourStatus}"`);
      } else {
        console.log(`[FIREBASE-FUNCTION] Status already matches (${ourStatusLower}), no update needed`);
      }
      
      return res.json({
        success: true,
        invoiceId,
        status: ourStatus,
        updated,
        paidAt: invoiceData.paid_at || null
      });

    } catch (error) {
      console.error('[FIREBASE-FUNCTION] Error syncing invoice:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  });
});











const XENDIT_BASE_URL = 'https://api.xendit.co';

// Create Xendit sub-account
exports.createXenditSubAccount = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const { email, given_name, family_name, type } = req.body;

      const response = await fetch(`${XENDIT_BASE_URL}/v2/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          given_name,
          family_name,
          type,
          public_profile: {
            business_name: `${given_name} ${family_name}`.trim()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Xendit API error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to create sub-account',
          details: errorData
        });
      }

      const result = await response.json();
      
      return res.json({
        id: result.id,
        email: result.email,
        status: result.status,
        public_profile: result.public_profile
      });

    } catch (error) {
      console.error('Error creating Xendit sub-account:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Create Xendit invoice
exports.createXenditInvoice = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const { 
        external_id, 
        amount, 
        currency, 
        description, 
        invoice_duration,
        for_user_id,
        payment_methods,
        should_send_email 
      } = req.body;

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
          success_redirect_url: `${functions.config().app?.base_url}/payments/success`,
          failure_redirect_url: `${functions.config().app?.base_url}/payments/failure`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Xendit API error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to create invoice',
          details: errorData
        });
      }

      const result = await response.json();
      
      return res.json({
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
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Xendit webhook handler
exports.xenditWebhook = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const token = req.headers['x-callback-token'];
      const expectedToken = functions.config().xendit?.webhook_token;
      
      if (token !== expectedToken) {
        console.error('Invalid webhook token');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { event, data } = req.body;
      console.log('Xendit webhook received:', { event, invoiceId: data?.id });

      const db = admin.firestore();

      switch (event) {
        case 'invoice.paid':
          await handleInvoicePaid(db, data);
          break;
        
        case 'invoice.expired':
          await handleInvoiceExpired(db, data);
          break;
        
        case 'invoice.failed':
          await handleInvoiceFailed(db, data);
          break;
        
        default:
          console.log('Unhandled webhook event:', event);
      }

      return res.json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Helper functions for webhook processing
async function handleInvoicePaid(db, data) {
  try {
    const { id: invoiceId, paid_at } = data;
    const paidAt = paid_at ? new Date(paid_at) : new Date();
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'paid',
        paidAt: paidAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as paid`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoiceExpired(db, data) {
  try {
    const { id: invoiceId } = data;
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as expired`);
  } catch (error) {
    console.error('Error handling invoice expired:', error);
  }
}

async function handleInvoiceFailed(db, data) {
  try {
    const { id: invoiceId } = data;
    
    const paymentsQuery = db.collection('working_payments')
      .where('xenditInvoiceId', '==', invoiceId);
    
    const paymentsSnap = await paymentsQuery.get();
    
    if (paymentsSnap.empty) {
      console.warn(`No payment request found for invoice ${invoiceId}`);
      return;
    }

    const batch = db.batch();
    paymentsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Invoice ${invoiceId} marked as failed`);
  } catch (error) {
    console.error('Error handling invoice failed:', error);
  }
}

// Sync invoice status from Xendit (for automatic payment sync)
exports.syncXenditInvoice = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      if (!XENDIT_API_KEY) {
        return res.status(500).json({ error: 'Xendit API key not configured' });
      }

      const invoiceId = req.query.invoiceId;
      if (!invoiceId) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }

      console.log(`[FIREBASE-FUNCTION] Syncing invoice: ${invoiceId}`);

      // Fetch invoice status from Xendit
      const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: 'Failed to fetch invoice status',
          details: errorText
        });
      }

      const invoiceData = await response.json();
      const xenditStatus = (invoiceData.status || '').toLowerCase();

      // Map Xendit status
      let ourStatus = 'pending';
      if (xenditStatus === 'paid' || xenditStatus === 'settled') {
        ourStatus = 'paid';
      } else if (xenditStatus === 'expired' || xenditStatus === 'voided' || xenditStatus === 'canceled') {
        ourStatus = 'expired';
      } else if (xenditStatus === 'failed') {
        ourStatus = 'failed';
      }

      // Update Firestore
      const db = admin.firestore();
      const paymentsQuery = db.collection('working_payments')
        .where('xenditInvoiceId', '==', invoiceId);
      
      const paymentsSnap = await paymentsQuery.get();
      
      if (paymentsSnap.empty) {
        return res.json({
          success: true,
          invoiceId,
          status: ourStatus,
          updated: false
        });
      }

      const currentPayment = paymentsSnap.docs[0].data();
      const currentStatus = String(currentPayment.status || '').toLowerCase().trim();
      const ourStatusLower = ourStatus.toLowerCase().trim();
      
      let updated = false;
      if (currentStatus !== ourStatusLower) {
        const paidAt = invoiceData.paid_at ? new Date(invoiceData.paid_at) : undefined;
        const batch = db.batch();
        
        paymentsSnap.docs.forEach(doc => {
          const updateData = {
            status: ourStatusLower,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (paidAt && ourStatus === 'paid') {
            updateData.paidAt = admin.firestore.Timestamp.fromDate(paidAt);
          }
          
          batch.update(doc.ref, updateData);
        });
        
        await batch.commit();
        updated = true;
      }
      
      return res.json({
        success: true,
        invoiceId,
        status: ourStatus,
        updated
      });

    } catch (error) {
      console.error('[FIREBASE-FUNCTION] Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  });
});










