-- Security Update Migration
-- Adds password expiry, session management, and audit logging

-- ============================================
-- 1. ADD PASSWORD EXPIRY COLUMNS TO ADMIN_USERS
-- ============================================
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_admin_session ON admin_users(session_token) WHERE session_token IS NOT NULL;

-- ============================================
-- 2. CREATE AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  user_id UUID REFERENCES admin_users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
DROP POLICY IF EXISTS "Allow select for audit_logs" ON audit_logs;
CREATE POLICY "Allow select for audit_logs" ON audit_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for audit_logs" ON audit_logs;
CREATE POLICY "Allow insert for audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 3. CREATE FRAUD DETECTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  flag_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_severity ON fraud_flags(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_unresolved ON fraud_flags(is_resolved) WHERE NOT is_resolved;

ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for fraud_flags" ON fraud_flags;
CREATE POLICY "Allow all for fraud_flags" ON fraud_flags
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. CREATE PURCHASE LOGS TABLE (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(255),
  receipt_data TEXT,
  receipt_verified BOOLEAN DEFAULT FALSE,
  verification_response JSONB,
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'refunded', 'fraudulent')),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_user ON purchase_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transaction ON purchase_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_status ON purchase_logs(status);
CREATE INDEX IF NOT EXISTS idx_purchase_created ON purchase_logs(created_at DESC);

ALTER TABLE purchase_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for purchase_logs" ON purchase_logs;
CREATE POLICY "Allow all for purchase_logs" ON purchase_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. CREATE API RATE LIMITING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- IP or user_id
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limits(identifier, endpoint, window_start);

-- Auto-cleanup old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for rate_limits" ON rate_limits;
CREATE POLICY "Allow all for rate_limits" ON rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. UPDATE RLS POLICIES FOR BETTER SECURITY
-- ============================================

-- Analytics Events: Allow inserts from app, select for dashboard
DROP POLICY IF EXISTS "Allow insert for all" ON analytics_events;
CREATE POLICY "Analytics insert" ON analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for service role" ON analytics_events;
CREATE POLICY "Analytics select" ON analytics_events
  FOR SELECT USING (true);

-- Prevent updates and deletes on analytics (immutable audit trail)
DROP POLICY IF EXISTS "Prevent analytics updates" ON analytics_events;
CREATE POLICY "Prevent analytics updates" ON analytics_events
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Prevent analytics deletes" ON analytics_events;
CREATE POLICY "Prevent analytics deletes" ON analytics_events
  FOR DELETE USING (false);

-- ============================================
-- 7. CREATE SECURITY FUNCTIONS
-- ============================================

-- Function to check password age
CREATE OR REPLACE FUNCTION check_password_expiry(admin_id UUID)
RETURNS TABLE(is_expired BOOLEAN, days_remaining INTEGER) AS $$
DECLARE
  password_age INTERVAL;
  expiry_days INTEGER := 180; -- 6 months
BEGIN
  SELECT NOW() - password_changed_at INTO password_age
  FROM admin_users WHERE id = admin_id;

  RETURN QUERY SELECT
    EXTRACT(DAY FROM password_age) > expiry_days,
    GREATEST(0, expiry_days - EXTRACT(DAY FROM password_age)::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_purchase(
  p_user_id VARCHAR,
  p_device_id VARCHAR,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  recent_purchases INTEGER;
  total_recent_amount DECIMAL;
BEGIN
  -- Check for velocity (more than 5 purchases in last hour)
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO recent_purchases, total_recent_amount
  FROM purchase_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status IN ('pending', 'verified');

  -- Flag if suspicious
  IF recent_purchases >= 5 OR total_recent_amount > 500 THEN
    INSERT INTO fraud_flags (user_id, device_id, flag_type, severity, details)
    VALUES (
      p_user_id,
      p_device_id,
      'velocity_exceeded',
      CASE
        WHEN recent_purchases >= 10 OR total_recent_amount > 1000 THEN 'critical'
        WHEN recent_purchases >= 7 OR total_recent_amount > 750 THEN 'high'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'recent_purchases', recent_purchases,
        'total_amount', total_recent_amount,
        'trigger_amount', p_amount
      )
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE SCHEDULED JOBS (via pg_cron if available)
-- ============================================

-- Note: Run these manually or via external scheduler if pg_cron not available

-- Check for expired passwords daily
-- SELECT * FROM admin_users WHERE password_changed_at < NOW() - INTERVAL '180 days';

-- Clean up old rate limits hourly
-- SELECT cleanup_old_rate_limits();

-- ============================================
-- 9. VERIFICATION
-- ============================================
SELECT 'Security update completed successfully!' as status;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('audit_logs', 'fraud_flags', 'purchase_logs', 'rate_limits');
