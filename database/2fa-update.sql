-- 2FA Security Update Migration
-- Adds Two-Factor Authentication support for admin users

-- Add 2FA columns to admin_users
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ;

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS last_totp_used_at TIMESTAMPTZ;

-- Index for 2FA queries
CREATE INDEX IF NOT EXISTS idx_admin_totp_enabled ON admin_users(totp_enabled) WHERE totp_enabled = true;

-- Add 2FA audit events
COMMENT ON COLUMN admin_users.totp_secret IS 'Encrypted TOTP secret for 2FA';
COMMENT ON COLUMN admin_users.totp_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN admin_users.backup_codes IS 'One-time backup codes for 2FA recovery';

SELECT '2FA columns added successfully!' as status;
