-- Email Authentication Update Migration
-- Adds support for magic links, password reset, and email confirmation

-- ============================================
-- 1. ADD AUTH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('magic_link', 'password_reset', 'email_confirm', 'api_key')),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_type ON auth_tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

-- Enable RLS
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow all for auth_tokens" ON auth_tokens;
CREATE POLICY "Allow all for auth_tokens" ON auth_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. ADD EMAIL CONFIRMATION TO ADMIN_USERS
-- ============================================
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ;

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS email_confirm_token VARCHAR(255);

-- ============================================
-- 3. ADD LOGIN DEVICES TABLE (for notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS login_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  ip_address VARCHAR(45),
  location VARCHAR(255),
  browser VARCHAR(255),
  os VARCHAR(255),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_login_devices_user ON login_devices(user_id);

ALTER TABLE login_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for login_devices" ON login_devices;
CREATE POLICY "Allow all for login_devices" ON login_devices
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. ADD PASSWORD HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for password_history" ON password_history;
CREATE POLICY "Allow all for password_history" ON password_history
  FOR ALL USING (true) WITH CHECK (true);

-- Function to check password history
CREATE OR REPLACE FUNCTION check_password_history(
  p_user_id UUID,
  p_password_hash VARCHAR,
  p_history_count INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT password_hash
    FROM password_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_history_count
  ) AS recent_passwords
  WHERE password_hash = p_password_hash;

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to save password history
CREATE OR REPLACE FUNCTION save_password_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    INSERT INTO password_history (user_id, password_hash)
    VALUES (NEW.id, OLD.password_hash);

    -- Keep only last 10 passwords
    DELETE FROM password_history
    WHERE user_id = NEW.id
    AND id NOT IN (
      SELECT id FROM password_history
      WHERE user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 10
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_save_password_history ON admin_users;
CREATE TRIGGER trigger_save_password_history
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION save_password_history();

-- ============================================
-- 5. CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VERIFICATION
-- ============================================
SELECT 'Email auth tables created successfully!' as status;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('auth_tokens', 'login_devices', 'password_history');
