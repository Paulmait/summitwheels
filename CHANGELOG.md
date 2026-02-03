# Changelog

All notable changes to Summit Wheels are documented in this file.

## [1.1.0] - 2026-02-03

### Security Enhancements

#### Two-Factor Authentication (2FA)
- Added TOTP-based two-factor authentication for admin accounts
- QR code generation for easy authenticator app setup
- 10 single-use backup codes for account recovery
- Code replay protection (30-second window)
- Secure enable/disable flow with verification

#### Password Security
- Implemented bcrypt password hashing (12 rounds)
- Added 6-month password expiry policy
- Strong password requirements (12+ chars, mixed case, numbers, symbols)
- Password change verification (requires current password)

#### Account Protection
- Account lockout after 5 failed login attempts
- 30-minute lockout duration
- Session tokens with 8-hour expiry
- Server-side session validation
- Rate limiting on login attempts

#### Server-Side Security (Edge Functions)
- **validate-receipt**: Apple App Store & Google Play receipt validation
- **process-purchase**: Server-side coin application with fraud checks
- **detect-fraud**: Real-time fraud detection with scoring system

#### Fraud Detection
- Purchase velocity monitoring
- Geographic velocity detection
- Multi-user device detection
- Invalid coin amount detection
- Automatic fraud flagging and scoring

#### Audit & Compliance
- Comprehensive audit logging for all security events
- GDPR-compliant data handling
- Immutable analytics event storage
- Purchase transaction audit trail

### Database Updates

#### New Tables
- `audit_logs` - Security event logging
- `fraud_flags` - Fraud detection flags
- `purchase_logs` - Transaction audit trail
- `rate_limits` - API rate limiting

#### Schema Updates
- Added 2FA columns to `admin_users` (totp_secret, totp_enabled, backup_codes)
- Added password_changed_at for expiry tracking
- Added session management columns

### Admin Dashboard

#### New Features
- 2FA setup wizard in Settings
- Password expiry warnings
- Security audit log viewer
- Backup code management

#### UI Improvements
- Password strength indicator
- Login flow with 2FA verification
- Security status badges

### Documentation
- Created comprehensive SECURITY.md
- Updated all security documentation
- Added production deployment checklist

---

## [1.0.0] - 2026-02-03

### Initial Release

#### Game Features
- Core gameplay with physics engine
- Vehicle selection and upgrades
- Stage/level progression
- Achievement system
- Daily rewards
- Coin economy

#### In-App Purchases
- Coin packs (5K, 15K, 40K)
- Remove Ads (non-consumable)
- Monthly Pass subscription
- Yearly Pass subscription

#### Analytics System
- Comprehensive event tracking
- Session management
- User profiling
- GDPR-compliant consent system

#### Admin Dashboard
- Secure admin login
- Dashboard with charts
- User analytics
- Revenue tracking
- Investor report generation
- PDF export capability

#### Backend (Supabase)
- PostgreSQL database
- Row Level Security (RLS)
- Real-time capabilities
- Edge Functions support

---

## Upcoming Features

- [ ] Push notifications
- [ ] Leaderboards
- [ ] Social sharing
- [ ] Cloud save sync
- [ ] Additional vehicles and stages
