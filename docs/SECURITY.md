# Summit Wheels Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in Summit Wheels to protect user data, prevent fraud, and ensure compliance with privacy regulations. Last updated: February 2026.

## Authentication Security

### Admin Dashboard

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password Hashing | bcrypt (12 rounds) | Implemented |
| Password Expiry | 6 months (180 days) | Implemented |
| Account Lockout | 5 failed attempts, 30 min lockout | Implemented |
| Session Management | Token-based, 8-hour expiry | Implemented |
| Session Validation | Server-side validation | Implemented |
| Audit Logging | All security events logged | Implemented |
| Rate Limiting | In-memory rate limiting | Implemented |
| **Two-Factor Auth (2FA)** | TOTP-based with backup codes | Implemented |

### Two-Factor Authentication (2FA)

Summit Wheels supports TOTP-based two-factor authentication for admin accounts.

**Features:**
- Time-based One-Time Passwords (TOTP)
- Compatible with Google Authenticator, Authy, 1Password, etc.
- QR code for easy setup
- 10 single-use backup codes
- Code replay protection (30-second window)
- Secure enable/disable flow

**Setup:**
1. Go to Settings > Two-Factor Authentication
2. Click "Set Up 2FA"
3. Scan QR code with authenticator app
4. Enter 6-digit code to verify
5. Save backup codes in a secure location

### Password Policy

- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)
- Cannot reuse the current password
- Must be changed every 6 months

### Login Credentials

Default admin account (change password immediately):
- Email: admin@summitwheels.app
- Password: admin123

## Server-Side Security

### Supabase Edge Functions (Deployed)

| Function | Purpose | Status |
|----------|---------|--------|
| validate-receipt | Apple/Google receipt validation | Deployed |
| process-purchase | Secure coin application | Deployed |
| detect-fraud | Real-time fraud detection | Deployed |

**Endpoints:**
- `https://lxgrdhyzgxmfdtbvrhel.supabase.co/functions/v1/validate-receipt`
- `https://lxgrdhyzgxmfdtbvrhel.supabase.co/functions/v1/process-purchase`
- `https://lxgrdhyzgxmfdtbvrhel.supabase.co/functions/v1/detect-fraud`

### Database Security (Supabase)

| Table | Purpose | RLS Policy |
|-------|---------|-----------|
| analytics_events | Event tracking | Insert: all, Select: all, Update: denied |
| analytics_users | User profiles | All operations |
| admin_users | Dashboard admins | All operations |
| audit_logs | Security events | Insert: all, Select: all |
| fraud_flags | Fraud detection | All operations |
| purchase_logs | Transaction audit | All operations |
| rate_limits | API protection | All operations |
| reports | Generated reports | All operations |
| daily_metrics | Aggregated stats | All operations |

### Encryption & Hashing

- **Data in Transit:** TLS 1.2+ (Supabase default)
- **Passwords:** bcrypt with 12 rounds
- **2FA Secrets:** Base32 encoded, stored securely
- **Game Data Checksums:** SHA-256
- **Backup Codes:** Hashed before storage
- **API Keys:** Environment variables (never in code)

## Fraud Prevention

### Client-Side Security

1. **Coin Balance Integrity**
   - SHA-256 checksums on all coin data
   - Version tracking for rollback attack detection
   - Balance reconciliation on every operation

2. **Anti-Cheat Measures**
   - Maximum coins per gameplay session: 5,000
   - Rate limiting on coin additions
   - Valid reward amount validation
   - Suspicious activity reporting

3. **Device Fingerprinting**
   - Unique device ID generation
   - Device-user mapping for fraud detection

### Server-Side Fraud Detection

The `detect-fraud` Edge Function analyzes:

| Check | Description | Severity |
|-------|-------------|----------|
| Velocity (purchases) | > 5 purchases/hour | High |
| Velocity (amount) | > $500/hour | High |
| Session velocity | > 10 sessions/hour | Medium |
| Multi-user device | > 3 users on device | Medium |
| Invalid amounts | Non-standard values | High |
| Geographic velocity | > 2 countries/hour | High |

**Fraud Score Thresholds:**
- 0-49: Allow (normal)
- 50-79: Review (flagged)
- 80+: Block (critical)

## Compliance

### GDPR Compliance

- [x] User consent collection before data processing
- [x] Data export functionality (JSON format)
- [x] Right to erasure (data deletion)
- [x] Purpose limitation (analytics only)
- [x] Data minimization
- [x] Audit trail for data access

### CCPA Compliance

- [x] Notice at collection
- [x] Right to know (data export)
- [x] Right to delete
- [x] Non-discrimination

### Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Analytics events | 2 years |
| User profiles | Until deletion request |
| Audit logs | 7 years |
| Purchase logs | 7 years (legal) |

## Audit Events

### Logged Security Events

- LOGIN_SUCCESS / LOGIN_FAILED
- LOGOUT
- PASSWORD_CHANGED / PASSWORD_FORCE_RESET
- ADMIN_CREATED
- 2FA_ENABLED / 2FA_DISABLED
- 2FA_SUCCESS / 2FA_FAILED
- 2FA_BACKUP_CODE_USED
- 2FA_BACKUP_CODES_REGENERATED
- FRAUD_DETECTED
- tamper_detected
- high_score / velocity_coins
- fallback_validation

## Security Checklist for Production

### Before Launch

- [ ] Change default admin password
- [ ] Enable 2FA for all admin accounts
- [ ] Set APPLE_SHARED_SECRET env var
- [ ] Set GOOGLE_SERVICE_ACCOUNT_KEY env var
- [ ] Review and tighten RLS policies
- [ ] Enable database backups
- [ ] Set up monitoring/alerting (Sentry)
- [ ] Configure proper CORS origins

### Regular Maintenance

- [ ] Review fraud flags weekly
- [ ] Rotate API keys quarterly
- [ ] Audit admin access monthly
- [ ] Review security logs weekly
- [ ] Test backup restoration quarterly
- [ ] Update dependencies monthly
- [ ] Penetration testing annually

## Environment Variables Required

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For Edge Functions (set in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APPLE_SHARED_SECRET=your-apple-shared-secret
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Incident Response

### Security Incident Steps

1. **Identify** - Detect and confirm the incident
2. **Contain** - Disable affected accounts/features
3. **Eradicate** - Remove threat, patch vulnerabilities
4. **Recover** - Restore services, monitor for recurrence
5. **Learn** - Document lessons, update procedures

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-03 | Initial security implementation |
| 1.1 | 2026-02-03 | Added 2FA support, deployed Edge Functions |

---

*This document should be reviewed and updated regularly as security measures evolve.*
