// Supabase Edge Function: Detect Fraud
// Analyzes user behavior for fraudulent patterns

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FraudCheckRequest {
  userId: string;
  deviceId: string;
  action: 'coin_add' | 'purchase' | 'session_start' | 'high_score';
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
}

// Fraud detection thresholds
const THRESHOLDS = {
  MAX_PURCHASES_PER_HOUR: 5,
  MAX_PURCHASES_PER_DAY: 20,
  MAX_COINS_PER_HOUR: 100000,
  MAX_SESSIONS_PER_HOUR: 10,
  SUSPICIOUS_SCORE_THRESHOLD: 50,
  CRITICAL_SCORE_THRESHOLD: 80
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, deviceId, action, amount, metadata } = await req.json() as FraudCheckRequest;

    // Input validation
    if (!userId || !deviceId || !action) {
      return new Response(
        JSON.stringify({ isSuspicious: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const indicators: FraudIndicator[] = [];
    let totalScore = 0;

    // ========================================
    // 1. VELOCITY CHECKS
    // ========================================

    // Check purchase velocity (last hour)
    if (action === 'purchase') {
      const { data: recentPurchases } = await supabase
        .from('purchase_logs')
        .select('id, amount, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .eq('status', 'verified');

      const purchaseCount = recentPurchases?.length || 0;
      const totalAmount = recentPurchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      if (purchaseCount >= THRESHOLDS.MAX_PURCHASES_PER_HOUR) {
        indicators.push({
          type: 'velocity_purchases',
          severity: purchaseCount >= 10 ? 'critical' : 'high',
          description: `${purchaseCount} purchases in last hour`,
          score: purchaseCount >= 10 ? 40 : 25
        });
      }

      if (totalAmount > 500) {
        indicators.push({
          type: 'velocity_amount',
          severity: totalAmount > 1000 ? 'critical' : 'high',
          description: `$${totalAmount.toFixed(2)} spent in last hour`,
          score: totalAmount > 1000 ? 35 : 20
        });
      }
    }

    // Check session velocity
    if (action === 'session_start') {
      const { data: recentSessions } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'session_start')
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const sessionCount = recentSessions?.length || 0;
      if (sessionCount >= THRESHOLDS.MAX_SESSIONS_PER_HOUR) {
        indicators.push({
          type: 'velocity_sessions',
          severity: 'medium',
          description: `${sessionCount} sessions in last hour`,
          score: 15
        });
      }
    }

    // ========================================
    // 2. DEVICE PATTERN CHECKS
    // ========================================

    // Check if multiple users on same device
    const { data: deviceUsers } = await supabase
      .from('analytics_users')
      .select('id')
      .eq('device_id', deviceId);

    if (deviceUsers && deviceUsers.length > 3) {
      indicators.push({
        type: 'multiple_users_device',
        severity: deviceUsers.length > 5 ? 'high' : 'medium',
        description: `${deviceUsers.length} users on same device`,
        score: deviceUsers.length > 5 ? 20 : 10
      });
    }

    // ========================================
    // 3. COIN MANIPULATION CHECKS
    // ========================================

    if (action === 'coin_add' && amount) {
      // Check for suspicious coin amounts
      if (amount > THRESHOLDS.MAX_COINS_PER_HOUR) {
        indicators.push({
          type: 'excessive_coins',
          severity: 'critical',
          description: `Attempted to add ${amount} coins`,
          score: 50
        });
      }

      // Check if amount doesn't match any valid reward
      const validRewards = [100, 250, 500, 1000, 2500, 5000, 15000, 40000];
      if (!validRewards.includes(amount)) {
        indicators.push({
          type: 'invalid_coin_amount',
          severity: 'high',
          description: `Non-standard coin amount: ${amount}`,
          score: 30
        });
      }
    }

    // ========================================
    // 4. HIGH SCORE MANIPULATION
    // ========================================

    if (action === 'high_score' && amount) {
      // Get user's average performance
      const { data: userStats } = await supabase
        .from('analytics_users')
        .select('total_playtime, total_coins_earned')
        .eq('id', userId)
        .single();

      if (userStats) {
        const avgCoinsPerSession = userStats.total_coins_earned / Math.max(1, userStats.total_playtime / 60);

        // If score is 10x their average, flag it
        if (amount > avgCoinsPerSession * 10 && userStats.total_playtime > 3600) {
          indicators.push({
            type: 'suspicious_high_score',
            severity: 'medium',
            description: `Score ${amount} is 10x above average`,
            score: 15
          });
        }
      }
    }

    // ========================================
    // 5. GEOGRAPHIC VELOCITY (if available)
    // ========================================

    if (metadata?.country) {
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('location')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(5);

      if (recentEvents) {
        const countries = new Set(recentEvents.map(e => e.location?.country).filter(Boolean));
        if (countries.size > 2) {
          indicators.push({
            type: 'geographic_velocity',
            severity: 'high',
            description: `Activity from ${countries.size} countries in 1 hour`,
            score: 25
          });
        }
      }
    }

    // ========================================
    // CALCULATE TOTAL SCORE
    // ========================================

    totalScore = indicators.reduce((sum, ind) => sum + ind.score, 0);

    const isSuspicious = totalScore >= THRESHOLDS.SUSPICIOUS_SCORE_THRESHOLD;
    const isCritical = totalScore >= THRESHOLDS.CRITICAL_SCORE_THRESHOLD;

    // Log fraud flag if suspicious
    if (isSuspicious) {
      await supabase
        .from('fraud_flags')
        .insert({
          user_id: userId,
          device_id: deviceId,
          flag_type: action,
          severity: isCritical ? 'critical' : totalScore >= 65 ? 'high' : 'medium',
          details: {
            indicators,
            totalScore,
            action,
            amount,
            metadata
          }
        });

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert({
          action: 'FRAUD_DETECTED',
          details: {
            userId,
            deviceId,
            action,
            score: totalScore,
            indicators: indicators.map(i => i.type)
          }
        });
    }

    return new Response(
      JSON.stringify({
        isSuspicious,
        isCritical,
        score: totalScore,
        indicators,
        action: isCritical ? 'block' : isSuspicious ? 'review' : 'allow'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fraud detection error:', error);
    return new Response(
      JSON.stringify({ isSuspicious: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
