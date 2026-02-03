/**
 * Supabase Configuration
 *
 * To set up Supabase:
 * 1. Go to https://supabase.com and create a free account
 * 2. Create a new project
 * 3. Go to Settings > API to get your URL and anon key
 * 4. Replace the placeholder values below
 * 5. Run the database schema SQL in the Supabase SQL Editor
 */

// Supabase project URL (replace with your project URL)
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';

// Supabase anonymous key (safe to expose in client)
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Service role key (NEVER expose in client - admin dashboard only)
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

/**
 * Database Schema SQL
 *
 * Run this in Supabase SQL Editor to create the required tables:
 *
 * ```sql
 * -- Analytics Events Table
 * CREATE TABLE analytics_events (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id VARCHAR(255) NOT NULL,
 *   device_id VARCHAR(255) NOT NULL,
 *   session_id VARCHAR(255) NOT NULL,
 *   event_type VARCHAR(50) NOT NULL,
 *   event_name VARCHAR(100) NOT NULL,
 *   event_data JSONB DEFAULT '{}',
 *   timestamp TIMESTAMPTZ NOT NULL,
 *   platform VARCHAR(20) NOT NULL,
 *   app_version VARCHAR(20) NOT NULL,
 *   os_version VARCHAR(50),
 *   device_model VARCHAR(100),
 *   locale VARCHAR(20),
 *   timezone VARCHAR(100),
 *   screen_name VARCHAR(100),
 *   location JSONB,
 *   network_type VARCHAR(50),
 *   ip_address VARCHAR(45),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Create indexes for common queries
 * CREATE INDEX idx_events_user_id ON analytics_events(user_id);
 * CREATE INDEX idx_events_timestamp ON analytics_events(timestamp);
 * CREATE INDEX idx_events_event_type ON analytics_events(event_type);
 * CREATE INDEX idx_events_platform ON analytics_events(platform);
 *
 * -- Analytics Users Table (aggregated user data)
 * CREATE TABLE analytics_users (
 *   id VARCHAR(255) PRIMARY KEY,
 *   device_id VARCHAR(255) NOT NULL,
 *   first_seen TIMESTAMPTZ NOT NULL,
 *   last_seen TIMESTAMPTZ NOT NULL,
 *   total_sessions INTEGER DEFAULT 0,
 *   total_playtime INTEGER DEFAULT 0,
 *   total_coins_earned INTEGER DEFAULT 0,
 *   total_coins_spent INTEGER DEFAULT 0,
 *   total_purchases INTEGER DEFAULT 0,
 *   total_revenue DECIMAL(10,2) DEFAULT 0,
 *   platform VARCHAR(20) NOT NULL,
 *   app_version VARCHAR(20),
 *   country VARCHAR(100),
 *   city VARCHAR(100),
 *   device_model VARCHAR(100),
 *   os_version VARCHAR(50),
 *   is_premium BOOLEAN DEFAULT FALSE,
 *   has_subscription BOOLEAN DEFAULT FALSE,
 *   acquisition_source VARCHAR(100),
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_users_platform ON analytics_users(platform);
 * CREATE INDEX idx_users_last_seen ON analytics_users(last_seen);
 * CREATE INDEX idx_users_is_premium ON analytics_users(is_premium);
 *
 * -- Admin Users Table
 * CREATE TABLE admin_users (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   password_hash VARCHAR(255) NOT NULL,
 *   name VARCHAR(255) NOT NULL,
 *   role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer', 'analyst')),
 *   is_active BOOLEAN DEFAULT TRUE,
 *   last_login TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Reports Table
 * CREATE TABLE reports (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title VARCHAR(255) NOT NULL,
 *   type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'custom', 'investor')),
 *   data JSONB NOT NULL,
 *   created_by UUID REFERENCES admin_users(id),
 *   share_token VARCHAR(255) UNIQUE,
 *   is_public BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ
 * );
 *
 * CREATE INDEX idx_reports_type ON reports(type);
 * CREATE INDEX idx_reports_share_token ON reports(share_token);
 *
 * -- Daily Metrics Table (pre-aggregated for dashboard performance)
 * CREATE TABLE daily_metrics (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   date DATE NOT NULL,
 *   platform VARCHAR(20),
 *   dau INTEGER DEFAULT 0,
 *   new_users INTEGER DEFAULT 0,
 *   sessions INTEGER DEFAULT 0,
 *   avg_session_duration INTEGER DEFAULT 0,
 *   games_played INTEGER DEFAULT 0,
 *   total_distance INTEGER DEFAULT 0,
 *   coins_earned INTEGER DEFAULT 0,
 *   coins_spent INTEGER DEFAULT 0,
 *   revenue DECIMAL(10,2) DEFAULT 0,
 *   purchases INTEGER DEFAULT 0,
 *   ad_views INTEGER DEFAULT 0,
 *   ad_revenue DECIMAL(10,2) DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(date, platform)
 * );
 *
 * CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
 *
 * -- Enable Row Level Security
 * ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
 *
 * -- Policies for analytics_events (allow insert from app)
 * CREATE POLICY "Allow insert for all" ON analytics_events FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Allow select for authenticated" ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');
 *
 * -- Policies for admin access (service key bypasses RLS)
 * CREATE POLICY "Admin full access" ON admin_users FOR ALL USING (auth.role() = 'service_role');
 * CREATE POLICY "Admin read reports" ON reports FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
 * ```
 */
