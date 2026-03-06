# RentMatic Xendit API Worker

Cloudflare Worker that handles Xendit API integration for RentMatic, replacing Firebase Cloud Functions (which require Blaze plan).

## Setup

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Set Xendit Secret Key**:
   ```bash
   wrangler secret put XENDIT_SECRET_KEY
   ```
   Then paste your Xendit secret key (e.g., `xnd_development_...`)

4. **Optional: Set Webhook Token** (for webhook verification):
   ```bash
   wrangler secret put XENDIT_WEBHOOK_TOKEN
   ```

5. **Optional: Set App Base URL** (for redirect URLs):
   ```bash
   wrangler secret put APP_BASE_URL
   ```
   Or use: `https://rentmatic-b24ff.web.app`

6. **Deploy**:
   ```bash
   npm run deploy
   ```

After deployment, you'll get a URL like: `https://rentmatic-xendit-api.your-subdomain.workers.dev`

## Endpoints

- `POST /xendit/sub-account` - Create Xendit sub-account (XenPlatform)
- `POST /xendit/invoice` - Create Xendit invoice
- `POST /xendit/webhook` - Handle Xendit webhooks
- `GET /health` - Health check

## Environment Variables

- `XENDIT_SECRET_KEY` (required) - Your Xendit API secret key
- `XENDIT_WEBHOOK_TOKEN` (optional) - Token for webhook verification
- `APP_BASE_URL` (optional) - Base URL for redirect URLs (defaults to Firebase hosting URL)

## Usage

After deployment, update the client services to use the Worker URL:

1. `lib/services/landlordAccountService.ts` - Point to Worker URL
2. `lib/services/paymentRequestService.ts` - Point to Worker URL










