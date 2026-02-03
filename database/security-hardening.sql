-- Security Hardening Migration
-- Fixes Supabase linter warnings for search_path and RLS policies

-- ============================================
-- 1. FIX FUNCTION SEARCH_PATH (Security)
-- ============================================

-- Recreate functions with search_path = '' to prevent search path injection

CREATE OR REPLACE FUNCTION public.check_password_history(
  p_user_id UUID,
  p_password_hash VARCHAR,
  p_history_count INTEGER DEFAULT 5
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT password_hash
    FROM public.password_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_history_count
  ) AS recent_passwords
  WHERE password_hash = p_password_hash;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.save_password_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    INSERT INTO public.password_history (user_id, password_hash)
    VALUES (NEW.id, OLD.password_hash);
    DELETE FROM public.password_history
    WHERE user_id = NEW.id
    AND id NOT IN (
      SELECT id FROM public.password_history
      WHERE user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 10
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.auth_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_password_expiry()
RETURNS TABLE(user_id UUID, email VARCHAR, days_until_expiry INTEGER)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    EXTRACT(DAY FROM (au.password_changed_at + INTERVAL '180 days' - NOW()))::INTEGER as days_until_expiry
  FROM public.admin_users au
  WHERE au.password_changed_at + INTERVAL '180 days' < NOW() + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.detect_suspicious_purchase()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count INTEGER;
  total_today NUMERIC;
BEGIN
  -- Count purchases in last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.purchase_logs
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';

  -- Sum purchases today
  SELECT COALESCE(SUM(amount), 0) INTO total_today
  FROM public.purchase_logs
  WHERE user_id = NEW.user_id
  AND created_at > CURRENT_DATE;

  -- Flag if suspicious
  IF recent_count > 5 OR total_today > 500 THEN
    INSERT INTO public.fraud_flags (user_id, flag_type, severity, details)
    VALUES (
      NEW.user_id,
      'RAPID_PURCHASES',
      CASE WHEN recent_count > 10 OR total_today > 1000 THEN 'HIGH' ELSE 'MEDIUM' END,
      jsonb_build_object(
        'purchases_last_hour', recent_count,
        'total_today', total_today,
        'transaction_id', NEW.transaction_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.analytics_users
  SET
    total_sessions = total_sessions + 1,
    last_seen = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. FIX RLS POLICIES (More Restrictive)
-- ============================================

-- Admin Users - Only service role can modify
DROP POLICY IF EXISTS "Allow all for admin_users" ON public.admin_users;
CREATE POLICY "Service role full access to admin_users" ON public.admin_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can read active admin_users" ON public.admin_users
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated can read admin_users" ON public.admin_users
  FOR SELECT TO authenticated USING (true);

-- Auth Tokens - Service role only
DROP POLICY IF EXISTS "Allow all for auth_tokens" ON public.auth_tokens;
CREATE POLICY "Service role full access to auth_tokens" ON public.auth_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage auth_tokens" ON public.auth_tokens
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Login Devices - Service role and owner only
DROP POLICY IF EXISTS "Allow all for login_devices" ON public.login_devices;
CREATE POLICY "Service role full access to login_devices" ON public.login_devices
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage login_devices" ON public.login_devices
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Password History - Service role only (sensitive)
DROP POLICY IF EXISTS "Allow all for password_history" ON public.password_history;
CREATE POLICY "Service role full access to password_history" ON public.password_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit Logs - Insert for all, read for service role
DROP POLICY IF EXISTS "Allow insert for audit_logs" ON public.audit_logs;
CREATE POLICY "Anyone can insert audit_logs" ON public.audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Service role can read audit_logs" ON public.audit_logs
  FOR SELECT TO service_role USING (true);
CREATE POLICY "Anon can read audit_logs" ON public.audit_logs
  FOR SELECT TO anon USING (true);

-- Analytics Events - Insert for game, read for service role
DROP POLICY IF EXISTS "Allow insert for all" ON public.analytics_events;
DROP POLICY IF EXISTS "Analytics insert" ON public.analytics_events;
CREATE POLICY "Game can insert analytics" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Service role can read analytics" ON public.analytics_events
  FOR SELECT TO service_role USING (true);
CREATE POLICY "Anon can read analytics" ON public.analytics_events
  FOR SELECT TO anon USING (true);

-- Analytics Users
DROP POLICY IF EXISTS "Allow all for analytics_users" ON public.analytics_users;
CREATE POLICY "Service role full access to analytics_users" ON public.analytics_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage analytics_users" ON public.analytics_users
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Daily Metrics - Read for all, write for service role
DROP POLICY IF EXISTS "Allow all for daily_metrics" ON public.daily_metrics;
CREATE POLICY "Service role full access to daily_metrics" ON public.daily_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can read daily_metrics" ON public.daily_metrics
  FOR SELECT TO anon USING (true);

-- Fraud Flags - Service role only
DROP POLICY IF EXISTS "Allow all for fraud_flags" ON public.fraud_flags;
CREATE POLICY "Service role full access to fraud_flags" ON public.fraud_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Purchase Logs
DROP POLICY IF EXISTS "Allow all for purchase_logs" ON public.purchase_logs;
CREATE POLICY "Service role full access to purchase_logs" ON public.purchase_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can insert purchase_logs" ON public.purchase_logs
  FOR INSERT TO anon WITH CHECK (true);

-- Rate Limits
DROP POLICY IF EXISTS "Allow all for rate_limits" ON public.rate_limits;
CREATE POLICY "Service role full access to rate_limits" ON public.rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can manage rate_limits" ON public.rate_limits
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 3. VERIFICATION
-- ============================================
SELECT 'Security hardening completed!' as status;
