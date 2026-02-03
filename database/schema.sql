-- Summit Wheels Analytics Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================
-- 1. ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  platform VARCHAR(20) NOT NULL,
  app_version VARCHAR(20) NOT NULL,
  os_version VARCHAR(50),
  device_model VARCHAR(100),
  locale VARCHAR(20),
  timezone VARCHAR(100),
  screen_name VARCHAR(100),
  location JSONB,
  network_type VARCHAR(50),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_platform ON analytics_events(platform);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);

-- ============================================
-- 2. ANALYTICS USERS TABLE (Aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_users (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  total_playtime INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  total_coins_spent INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  platform VARCHAR(20) NOT NULL,
  app_version VARCHAR(20),
  country VARCHAR(100),
  city VARCHAR(100),
  device_model VARCHAR(100),
  os_version VARCHAR(50),
  is_premium BOOLEAN DEFAULT FALSE,
  has_subscription BOOLEAN DEFAULT FALSE,
  acquisition_source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_platform ON analytics_users(platform);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON analytics_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON analytics_users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_country ON analytics_users(country);

-- ============================================
-- 3. ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer', 'analyst')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);

-- ============================================
-- 4. REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'custom', 'investor')),
  data JSONB NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  share_token VARCHAR(255) UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON reports(share_token);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

-- ============================================
-- 5. DAILY METRICS TABLE (Pre-aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform VARCHAR(20),
  dau INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_distance BIGINT DEFAULT 0,
  coins_earned BIGINT DEFAULT 0,
  coins_spent BIGINT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  ad_views INTEGER DEFAULT 0,
  ad_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_platform ON daily_metrics(platform);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. SECURITY POLICIES
-- ============================================

-- Analytics Events: Allow inserts from anyone (app), select for authenticated
DROP POLICY IF EXISTS "Allow insert for all" ON analytics_events;
CREATE POLICY "Allow insert for all" ON analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for service role" ON analytics_events;
CREATE POLICY "Allow select for service role" ON analytics_events
  FOR SELECT USING (true);

-- Analytics Users: Allow all operations (managed by app)
DROP POLICY IF EXISTS "Allow all for analytics_users" ON analytics_users;
CREATE POLICY "Allow all for analytics_users" ON analytics_users
  FOR ALL USING (true) WITH CHECK (true);

-- Admin Users: Allow all operations (dashboard manages this)
DROP POLICY IF EXISTS "Allow all for admin_users" ON admin_users;
CREATE POLICY "Allow all for admin_users" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Reports: Allow all operations
DROP POLICY IF EXISTS "Allow all for reports" ON reports;
CREATE POLICY "Allow all for reports" ON reports
  FOR ALL USING (true) WITH CHECK (true);

-- Daily Metrics: Allow all operations
DROP POLICY IF EXISTS "Allow all for daily_metrics" ON daily_metrics;
CREATE POLICY "Allow all for daily_metrics" ON daily_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. FUNCTIONS FOR AGGREGATION
-- ============================================

-- Function to update user stats after events
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO analytics_users (id, device_id, platform, first_seen, last_seen, total_sessions)
  VALUES (NEW.user_id, NEW.device_id, NEW.platform, NEW.timestamp, NEW.timestamp,
          CASE WHEN NEW.event_type = 'session_start' THEN 1 ELSE 0 END)
  ON CONFLICT (id) DO UPDATE SET
    last_seen = NEW.timestamp,
    total_sessions = analytics_users.total_sessions +
      CASE WHEN NEW.event_type = 'session_start' THEN 1 ELSE 0 END,
    total_coins_earned = analytics_users.total_coins_earned +
      COALESCE((NEW.event_data->>'amount')::INTEGER, 0) *
      CASE WHEN NEW.event_type = 'coins_earned' THEN 1 ELSE 0 END,
    total_coins_spent = analytics_users.total_coins_spent +
      COALESCE((NEW.event_data->>'amount')::INTEGER, 0) *
      CASE WHEN NEW.event_type = 'coins_spent' THEN 1 ELSE 0 END,
    total_revenue = analytics_users.total_revenue +
      COALESCE((NEW.event_data->>'revenue')::DECIMAL, 0),
    total_purchases = analytics_users.total_purchases +
      CASE WHEN NEW.event_type = 'purchase' THEN 1 ELSE 0 END,
    is_premium = analytics_users.is_premium OR NEW.event_type = 'purchase',
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_stats ON analytics_events;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('analytics_events', 'analytics_users', 'admin_users', 'reports', 'daily_metrics');

-- Show table counts
SELECT 'Schema created successfully!' as status;
