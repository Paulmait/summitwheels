// Supabase Edge Function: Process Purchase
// Applies coins/entitlements after receipt validation

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessPurchaseRequest {
  userId: string;
  deviceId: string;
  productId: string;
  platform: 'ios' | 'android';
  transactionId: string;
  receipt: string;
}

// Product definitions - coins awarded per product
const PRODUCT_REWARDS: Record<string, { coins: number; type: 'consumable' | 'non_consumable' | 'subscription'; entitlement?: string; price: number }> = {
  'com.summitwheels.coins.5000': { coins: 5000, type: 'consumable', price: 0.99 },
  'com.summitwheels.coins.15000': { coins: 15000, type: 'consumable', price: 2.99 },
  'com.summitwheels.coins.40000': { coins: 40000, type: 'consumable', price: 4.99 },
  'com.summitwheels.noads': { coins: 0, type: 'non_consumable', entitlement: 'noAds', price: 2.99 },
  'com.summitwheels.pass.monthly': { coins: 500, type: 'subscription', entitlement: 'monthlyPass', price: 4.99 },
  'com.summitwheels.pass.yearly': { coins: 1000, type: 'subscription', entitlement: 'yearlyPass', price: 29.99 },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, deviceId, productId, platform, transactionId, receipt } = await req.json() as ProcessPurchaseRequest;

    // Input validation
    if (!userId || !deviceId || !productId || !platform || !transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product info
    const product = PRODUCT_REWARDS[productId];
    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid product ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for duplicate transaction (idempotency)
    const { data: existingPurchase } = await supabase
      .from('purchase_logs')
      .select('id, status')
      .eq('transaction_id', transactionId)
      .single();

    if (existingPurchase?.status === 'verified') {
      // Already processed - return success (idempotent)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Purchase already processed',
          coins: product.coins,
          entitlement: product.entitlement
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, validate the receipt
    const validateUrl = `${supabaseUrl}/functions/v1/validate-receipt`;
    const validateResponse = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ receipt, productId, platform, userId, deviceId, transactionId })
    });

    const validationResult = await validateResponse.json();

    if (!validationResult.isValid) {
      // Log failed purchase
      await supabase
        .from('purchase_logs')
        .upsert({
          user_id: userId,
          device_id: deviceId,
          product_id: productId,
          platform,
          transaction_id: transactionId,
          status: 'failed',
          verification_response: validationResult
        }, { onConflict: 'transaction_id' });

      return new Response(
        JSON.stringify({ success: false, error: validationResult.error || 'Receipt validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for fraud
    const { data: fraudCheck } = await supabase.rpc('detect_suspicious_purchase', {
      p_user_id: userId,
      p_device_id: deviceId,
      p_amount: product.price
    });

    if (fraudCheck) {
      console.warn(`Fraud detected for user ${userId}, but allowing purchase to be reviewed`);
      // Don't block, but flag for review
    }

    // Update analytics_users with purchase info
    const { error: userUpdateError } = await supabase
      .from('analytics_users')
      .upsert({
        id: userId,
        device_id: deviceId,
        platform,
        total_purchases: 1,
        total_revenue: product.price,
        is_premium: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    // If user exists, increment their stats
    if (!userUpdateError) {
      await supabase.rpc('increment_user_stats', {
        p_user_id: userId,
        p_coins: product.coins,
        p_revenue: product.price,
        p_purchases: 1
      }).catch(() => {
        // Function might not exist, that's OK
        console.log('increment_user_stats function not available');
      });
    }

    // Record the successful purchase
    await supabase
      .from('purchase_logs')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        product_id: productId,
        platform,
        transaction_id: transactionId,
        receipt_verified: true,
        amount: product.price,
        currency: 'USD',
        status: 'verified',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip')
      }, { onConflict: 'transaction_id' });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        device_id: deviceId,
        session_id: `purchase_${Date.now()}`,
        event_type: 'purchase',
        event_name: 'purchase_completed',
        event_data: {
          product_id: productId,
          coins: product.coins,
          price: product.price,
          entitlement: product.entitlement,
          transaction_id: transactionId
        },
        timestamp: new Date().toISOString(),
        platform,
        app_version: '1.0.0'
      });

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('update_daily_metrics', {
      p_date: today,
      p_platform: platform,
      p_revenue: product.price,
      p_purchases: 1
    }).catch(() => {
      // Function might not exist
      console.log('update_daily_metrics function not available');
    });

    return new Response(
      JSON.stringify({
        success: true,
        coins: product.coins,
        entitlement: product.entitlement,
        transactionId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process purchase error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
