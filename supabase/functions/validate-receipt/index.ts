// Supabase Edge Function: Validate Receipt
// Validates Apple App Store and Google Play receipts server-side

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReceiptValidationRequest {
  receipt: string;
  productId: string;
  platform: 'ios' | 'android';
  userId: string;
  deviceId: string;
  transactionId?: string;
}

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      purchase_date_ms: string;
    }>;
  };
}

interface GoogleReceiptResponse {
  purchaseState: number;
  consumptionState?: number;
  orderId: string;
  purchaseTimeMillis: string;
}

// Apple App Store receipt validation
async function validateAppleReceipt(receipt: string, productId: string): Promise<{ valid: boolean; transactionId?: string; error?: string }> {
  // Apple verification URLs
  const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
  const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');

  if (!sharedSecret) {
    console.error('APPLE_SHARED_SECRET not configured');
    return { valid: false, error: 'Server configuration error' };
  }

  const payload = {
    'receipt-data': receipt,
    'password': sharedSecret,
    'exclude-old-transactions': true
  };

  try {
    // Try production first
    let response = await fetch(APPLE_PRODUCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data: AppleReceiptResponse = await response.json();

    // If status 21007, use sandbox
    if (data.status === 21007) {
      response = await fetch(APPLE_SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await response.json();
    }

    // Status 0 means valid
    if (data.status !== 0) {
      return { valid: false, error: `Apple validation failed with status ${data.status}` };
    }

    // Find the matching product in the receipt
    const purchase = data.receipt?.in_app?.find(p => p.product_id === productId);
    if (!purchase) {
      return { valid: false, error: 'Product not found in receipt' };
    }

    return { valid: true, transactionId: purchase.transaction_id };
  } catch (error) {
    console.error('Apple validation error:', error);
    return { valid: false, error: 'Network error validating receipt' };
  }
}

// Google Play receipt validation
async function validateGoogleReceipt(
  receipt: string,
  productId: string,
  packageName: string = 'com.summitwheels.game'
): Promise<{ valid: boolean; transactionId?: string; error?: string }> {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

  if (!serviceAccountKey) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
    return { valid: false, error: 'Server configuration error' };
  }

  try {
    // Parse the receipt (Google sends purchase token)
    const purchaseToken = receipt;

    // Get access token using service account
    const credentials = JSON.parse(serviceAccountKey);
    const token = await getGoogleAccessToken(credentials);

    // Validate with Google Play API
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.text();
      return { valid: false, error: `Google validation failed: ${error}` };
    }

    const data: GoogleReceiptResponse = await response.json();

    // purchaseState 0 = purchased, 1 = canceled, 2 = pending
    if (data.purchaseState !== 0) {
      return { valid: false, error: `Purchase state invalid: ${data.purchaseState}` };
    }

    return { valid: true, transactionId: data.orderId };
  } catch (error) {
    console.error('Google validation error:', error);
    return { valid: false, error: 'Network error validating receipt' };
  }
}

// Get Google OAuth access token from service account
async function getGoogleAccessToken(credentials: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  // Create JWT header and payload
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry
  };

  // Encode JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Sign with private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Convert PEM to binary
function pemToBinary(pem: string): ArrayBuffer {
  const lines = pem.split('\n');
  const base64 = lines.filter(line => !line.startsWith('-----')).join('');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { receipt, productId, platform, userId, deviceId, transactionId } = await req.json() as ReceiptValidationRequest;

    // Input validation
    if (!receipt || !productId || !platform || !userId || !deviceId) {
      return new Response(
        JSON.stringify({ isValid: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for duplicate transaction
    if (transactionId) {
      const { data: existing } = await supabase
        .from('purchase_logs')
        .select('id')
        .eq('transaction_id', transactionId)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ isValid: false, error: 'Transaction already processed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate receipt based on platform
    let validationResult;
    if (platform === 'ios') {
      validationResult = await validateAppleReceipt(receipt, productId);
    } else {
      validationResult = await validateGoogleReceipt(receipt, productId);
    }

    // Log the purchase attempt
    await supabase
      .from('purchase_logs')
      .insert({
        user_id: userId,
        device_id: deviceId,
        product_id: productId,
        platform,
        transaction_id: validationResult.transactionId || transactionId,
        receipt_data: receipt.substring(0, 500), // Truncate for storage
        receipt_verified: validationResult.valid,
        verification_response: validationResult,
        status: validationResult.valid ? 'verified' : 'failed',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip')
      });

    return new Response(
      JSON.stringify({
        isValid: validationResult.valid,
        transactionId: validationResult.transactionId,
        error: validationResult.error
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ isValid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
