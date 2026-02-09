/**
 * Cloudflare Worker — Purchase Webhook Handler
 *
 * Handles:
 * 1. Payment webhook verification (Lemon Squeezy)
 * 2. Serial key generation based on product config
 * 3. Email delivery via Resend API
 *
 * Environment variables (set in Cloudflare dashboard):
 * - LEMON_SQUEEZY_WEBHOOK_SECRET
 * - RESEND_API_KEY
 * - SERIAL_KEY_SALT
 * - SITE_URL
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/webhook/purchase' && request.method === 'POST') {
      return handlePurchaseWebhook(request, env);
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Verify webhook signature from Lemon Squeezy
 */
async function verifyWebhookSignature(request, secret) {
  const signature = request.headers.get('x-signature');
  if (!signature) return false;

  const body = await request.clone().text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

/**
 * Generate a serial key based on product configuration.
 *
 * Format: PREFIX-[RANDOM]-[RANDOM]-[CHECKSUM]
 * Checksum segment is derived from hashing other segments with a salt.
 */
async function generateSerialKey(config, salt) {
  const { prefix, segments, charset } = config;
  const segmentLength = 4; // Characters per segment

  // Generate random segments
  const randomSegments = [];
  for (let i = 0; i < segments - 1; i++) {
    let segment = '';
    const randomValues = new Uint32Array(segmentLength);
    crypto.getRandomValues(randomValues);
    for (let j = 0; j < segmentLength; j++) {
      segment += charset[randomValues[j] % charset.length];
    }
    randomSegments.push(segment);
  }

  // Generate checksum segment
  const dataToHash = prefix + randomSegments.join('') + salt;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataToHash));
  const hashArray = new Uint8Array(hashBuffer);

  let checksumSegment = '';
  for (let i = 0; i < segmentLength; i++) {
    checksumSegment += charset[hashArray[i] % charset.length];
  }

  return `${prefix}-${randomSegments.join('-')}-${checksumSegment}`;
}

/**
 * Send purchase confirmation email via Resend API
 */
async function sendPurchaseEmail(env, { email, name, productName, price, currency, downloadUrl, serialKey }) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  const serialKeySection = serialKey
    ? `
        <tr>
          <td style="padding: 24px 32px; background-color: #FEF3C7; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #92400E;">Your Serial Key</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #1C1917; letter-spacing: 0.05em;">${serialKey}</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #92400E;">Save this key — you'll need it to activate the product.</p>
          </td>
        </tr>
      `
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAF9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E7E5E4; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1C1917; letter-spacing: -0.02em;">SHLEMUT</h1>
            </td>
          </tr>

          <!-- Thank you -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <div style="width: 48px; height: 48px; margin: 0 auto 16px; background-color: #D1FAE5; border-radius: 50%; line-height: 48px; font-size: 24px;">✓</div>
              <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1C1917;">Thank you for your purchase!</h2>
              <p style="margin: 0; font-size: 14px; color: #78716C;">Hi ${name || 'there'}, here's your order confirmation.</p>
            </td>
          </tr>

          <!-- Order details -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #E7E5E4;">
                    <p style="margin: 0; font-size: 14px; color: #78716C;">Product</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1C1917;">${productName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #78716C;">Amount paid</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #1C1917;">${currencySymbol}${price}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${serialKeySection}

          <!-- Download button -->
          <tr>
            <td style="padding: 8px 32px 32px; text-align: center;">
              <a href="${downloadUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1C1917; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                Download Your Files
              </a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #78716C;">This link expires in 30 days.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #E7E5E4; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #A8A29E;">
                Questions? Reply to this email or visit our
                <a href="${env.SITE_URL || 'https://your-username.github.io/SHLEMUT'}/faq/" style="color: #D97706; text-decoration: none;">FAQ</a>.
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #D6D3D1;">
                &copy; ${new Date().getFullYear()} SHLEMUT. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SHLEMUT <noreply@shlemut.com>',
      to: [email],
      subject: `Your ${productName} purchase — SHLEMUT`,
      html,
    }),
  });

  return response.ok;
}

/**
 * Main webhook handler
 */
async function handlePurchaseWebhook(request, env) {
  // Verify signature
  const isValid = await verifyWebhookSignature(request, env.LEMON_SQUEEZY_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await request.json();
    const eventName = payload.meta?.event_name;

    // Only process successful orders
    if (eventName !== 'order_created') {
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const order = payload.data?.attributes;
    const customerEmail = order?.user_email;
    const customerName = order?.user_name;
    const productName = order?.first_order_item?.product_name;
    const price = order?.total;
    const currency = order?.currency?.toUpperCase() || 'USD';

    // Check if product requires serial key (based on custom data)
    const customData = payload.meta?.custom_data || {};
    const serialKeyConfig = customData.serial_key_config;
    let serialKey = null;

    if (serialKeyConfig) {
      serialKey = await generateSerialKey(serialKeyConfig, env.SERIAL_KEY_SALT);

      // Log the serial key (in production, store in KV or database)
      console.log(
        JSON.stringify({
          type: 'serial_key_generated',
          key: serialKey,
          email: customerEmail,
          product: productName,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    // Generate download URL (placeholder — replace with actual signed URL logic)
    const downloadUrl = customData.file_url || `${env.SITE_URL || ''}/download`;

    // Send email
    const emailSent = await sendPurchaseEmail(env, {
      email: customerEmail,
      name: customerName,
      productName,
      price,
      currency,
      downloadUrl,
      serialKey,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        serial_key_generated: !!serialKey,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
