# Claude Security Hardening Template for Mobile/Web Apps

**Purpose:** Copy and paste this template when starting a new app project to ensure comprehensive security implementation from day one. Use with Claude Code to systematically implement each section.

---

## Instructions for Claude

When given this template, implement each section in order. Check off completed items and provide status updates. Prioritize P0 (Critical) items first.

```
IMPORTANT: Implement all security features listed below for this app.
- Read this entire template before starting
- Implement items in priority order (P0 → P1 → P2)
- Check off items as completed
- Report any blockers or questions
- DO NOT skip any P0 or P1 items
```

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Password Security](#2-password-security)
3. [Two-Factor Authentication](#3-two-factor-authentication)
4. [Session Management](#4-session-management)
5. [Data Protection](#5-data-protection)
6. [API Security](#6-api-security)
7. [Database Security](#7-database-security)
8. [Input Validation](#8-input-validation)
9. [Fraud Prevention](#9-fraud-prevention)
10. [In-App Purchase Security](#10-in-app-purchase-security)
11. [Logging & Monitoring](#11-logging--monitoring)
12. [Privacy & Compliance](#12-privacy--compliance)
13. [Infrastructure Security](#13-infrastructure-security)
14. [Mobile App Security](#14-mobile-app-security)
15. [Admin Dashboard Security](#15-admin-dashboard-security)
16. [Testing & Verification](#16-testing--verification)

---

## 1. Authentication & Authorization

### P0 - Critical
- [ ] **Email verification** on signup (confirm email before account activation)
- [ ] **Magic link login** option (passwordless authentication)
- [ ] **Password reset** via secure email link (expires in 1 hour)
- [ ] **Account lockout** after 5 failed login attempts (30 min lockout)
- [ ] **Role-based access control (RBAC)** for different user types
- [ ] **JWT tokens** with short expiry (access: 15 min, refresh: 7 days)

### P1 - High
- [ ] **OAuth/Social login** (Google, Apple, Facebook)
- [ ] **Email change verification** (confirm both old and new email)
- [ ] **Account deactivation** with grace period
- [ ] **Login notifications** via email for new devices
- [ ] **Device management** - view/revoke active sessions

### P2 - Medium
- [ ] **Biometric authentication** (Face ID, fingerprint)
- [ ] **Remember me** with secure long-term token
- [ ] **Login history** visible to user
- [ ] **Security questions** for account recovery

### Implementation Notes:
```javascript
// Use Supabase Auth for built-in features:
// - Email verification
// - Magic links
// - Password reset
// - OAuth providers

// Enable in Supabase Dashboard:
// Authentication > Settings > Enable email confirmations
// Authentication > Settings > Enable magic link
// Authentication > Providers > Enable OAuth providers
```

---

## 2. Password Security

### P0 - Critical
- [ ] **Bcrypt hashing** with minimum 12 rounds
- [ ] **Password strength requirements:**
  - Minimum 12 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*(),.?":{}|<>)
- [ ] **Password expiry** every 6 months (180 days)
- [ ] **Prevent password reuse** (last 5 passwords)
- [ ] **Check against breached password databases** (HaveIBeenPwned API)

### P1 - High
- [ ] **Password strength meter** in UI
- [ ] **Show password toggle** in forms
- [ ] **Password change** requires current password verification
- [ ] **Force password change** on first login (if admin-created)
- [ ] **Notify user** via email when password changed

### Implementation:
```javascript
// Password hashing with bcrypt
const bcrypt = require('bcryptjs');
const BCRYPT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Password strength validation
function validatePassword(password) {
  const errors = [];
  if (password.length < 12) errors.push('At least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
  return errors;
}
```

---

## 3. Two-Factor Authentication (2FA)

### P0 - Critical
- [ ] **TOTP-based 2FA** (Google Authenticator, Authy compatible)
- [ ] **QR code generation** for easy setup
- [ ] **Backup codes** (10 single-use codes)
- [ ] **2FA enforcement** for admin accounts
- [ ] **Code replay prevention** (30-second window)

### P1 - High
- [ ] **SMS 2FA** as fallback option
- [ ] **Email 2FA** as fallback option
- [ ] **2FA recovery** process with identity verification
- [ ] **Remember device** option (skip 2FA for 30 days)
- [ ] **2FA audit log** (enable/disable events)

### Implementation:
```javascript
// Using otpauth library for TOTP
import * as OTPAuth from 'otpauth';

// Generate TOTP secret
const totp = new OTPAuth.TOTP({
  issuer: 'YourAppName',
  label: userEmail,
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  secret: new OTPAuth.Secret({ size: 20 })
});

// Verify code
const delta = totp.validate({ token: userCode, window: 1 });
const isValid = delta !== null;
```

---

## 4. Session Management

### P0 - Critical
- [ ] **Secure session tokens** (cryptographically random, 256-bit)
- [ ] **Session expiry** (8 hours for web, 30 days for mobile)
- [ ] **Session invalidation** on logout
- [ ] **Session invalidation** on password change
- [ ] **Server-side session validation** on each request
- [ ] **Prevent session fixation** (regenerate on auth state change)

### P1 - High
- [ ] **Concurrent session limits** (max 5 devices)
- [ ] **Session activity tracking** (last active timestamp)
- [ ] **Idle timeout** (30 minutes of inactivity)
- [ ] **Force logout** from all devices option
- [ ] **Session metadata** (device, IP, location)

### Implementation:
```javascript
// Generate secure session token
function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Session validation middleware
async function validateSession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);

  if (!session || new Date() > new Date(session.expires_at)) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = session.user;
  next();
}
```

---

## 5. Data Protection

### P0 - Critical
- [ ] **TLS 1.3** for all data in transit
- [ ] **Encryption at rest** for sensitive data (AES-256)
- [ ] **No sensitive data in logs** (mask PII)
- [ ] **Secure key management** (environment variables, not in code)
- [ ] **Data classification** (public, internal, confidential, restricted)

### P1 - High
- [ ] **Field-level encryption** for highly sensitive data
- [ ] **Key rotation** policy (quarterly)
- [ ] **Secure backup** with encryption
- [ ] **Data retention policy** (auto-delete after period)
- [ ] **PII anonymization** for analytics

### P2 - Medium
- [ ] **Data masking** in non-production environments
- [ ] **Tokenization** for payment data
- [ ] **Secure file upload** (virus scanning, type validation)

### Implementation:
```javascript
// Never log sensitive data
function sanitizeForLogging(obj) {
  const sensitive = ['password', 'token', 'secret', 'credit_card', 'ssn'];
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}
```

---

## 6. API Security

### P0 - Critical
- [ ] **Rate limiting** (100 requests/minute per IP)
- [ ] **API authentication** (JWT or API keys)
- [ ] **CORS configuration** (whitelist allowed origins)
- [ ] **Input validation** on all endpoints
- [ ] **Request size limits** (1MB default)

### P1 - High
- [ ] **API versioning** (v1, v2, etc.)
- [ ] **Request signing** for sensitive operations
- [ ] **IP allowlist** for admin APIs
- [ ] **API key rotation** support
- [ ] **Throttling** for expensive operations

### P2 - Medium
- [ ] **GraphQL depth limiting** (if applicable)
- [ ] **Query complexity analysis**
- [ ] **Response compression**

### Implementation:
```javascript
// Rate limiting configuration
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per window
  message: 'Too many requests, please try again later'
};

// CORS configuration
const corsOptions = {
  origin: ['https://yourapp.com', 'https://admin.yourapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

---

## 7. Database Security

### P0 - Critical
- [ ] **Row Level Security (RLS)** enabled on all tables
- [ ] **Parameterized queries** (prevent SQL injection)
- [ ] **Least privilege principle** (minimal permissions)
- [ ] **Separate service role** from anon role
- [ ] **Database connection encryption** (SSL required)

### P1 - High
- [ ] **Audit tables** for sensitive data changes
- [ ] **Soft delete** instead of hard delete
- [ ] **Database backups** (daily, encrypted)
- [ ] **Point-in-time recovery** enabled
- [ ] **Query logging** for debugging

### P2 - Medium
- [ ] **Read replicas** for analytics queries
- [ ] **Connection pooling**
- [ ] **Query performance monitoring**

### Implementation (Supabase RLS):
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Only service role can insert
CREATE POLICY "Service role insert" ON users
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Prevent updates to sensitive fields
CREATE POLICY "Prevent email change" ON users
  FOR UPDATE USING (
    auth.uid() = id AND
    email = (SELECT email FROM users WHERE id = auth.uid())
  );
```

---

## 8. Input Validation

### P0 - Critical
- [ ] **Server-side validation** for all inputs (never trust client)
- [ ] **SQL injection prevention** (parameterized queries)
- [ ] **XSS prevention** (escape output, CSP headers)
- [ ] **CSRF protection** (tokens for state-changing operations)
- [ ] **File upload validation** (type, size, content scanning)

### P1 - High
- [ ] **Email validation** (format and domain)
- [ ] **Phone number validation** (E.164 format)
- [ ] **URL validation** (allowlist domains)
- [ ] **JSON schema validation** for API payloads
- [ ] **Sanitize HTML** if accepting rich text

### Implementation:
```javascript
// Input validation schema (using Zod)
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional()
});

// Validate and sanitize
function validateInput(schema, data) {
  return schema.safeParse(data);
}
```

---

## 9. Fraud Prevention

### P0 - Critical
- [ ] **Velocity checks** (unusual activity patterns)
- [ ] **Device fingerprinting** (identify repeat offenders)
- [ ] **IP reputation checking** (block known bad IPs)
- [ ] **Transaction amount limits** (per hour/day)
- [ ] **Fraud scoring system** (block at threshold)

### P1 - High
- [ ] **Geographic velocity** (impossible travel detection)
- [ ] **Multiple accounts detection** (same device/IP)
- [ ] **Behavioral analysis** (mouse movements, typing patterns)
- [ ] **Manual review queue** for suspicious activity
- [ ] **Automatic account suspension** for critical fraud

### Implementation:
```javascript
// Fraud detection thresholds
const FRAUD_THRESHOLDS = {
  MAX_PURCHASES_PER_HOUR: 5,
  MAX_AMOUNT_PER_HOUR: 500,
  MAX_FAILED_LOGINS: 5,
  MAX_DEVICES_PER_USER: 5,
  SUSPICIOUS_SCORE: 50,
  CRITICAL_SCORE: 80
};

// Check for suspicious activity
async function checkFraud(userId, action, amount) {
  let score = 0;

  // Check velocity
  const recentPurchases = await getRecentPurchases(userId, '1 hour');
  if (recentPurchases.count >= FRAUD_THRESHOLDS.MAX_PURCHASES_PER_HOUR) {
    score += 30;
  }

  // Check amount
  if (recentPurchases.total + amount > FRAUD_THRESHOLDS.MAX_AMOUNT_PER_HOUR) {
    score += 25;
  }

  // Return result
  return {
    score,
    action: score >= FRAUD_THRESHOLDS.CRITICAL_SCORE ? 'block' :
            score >= FRAUD_THRESHOLDS.SUSPICIOUS_SCORE ? 'review' : 'allow'
  };
}
```

---

## 10. In-App Purchase Security

### P0 - Critical
- [ ] **Server-side receipt validation** (Apple/Google)
- [ ] **Duplicate purchase prevention** (idempotency)
- [ ] **Purchase logging** (audit trail)
- [ ] **Refund handling** (revoke entitlements)
- [ ] **Secure coin/currency storage** (checksums)

### P1 - High
- [ ] **Subscription status sync** (webhook handling)
- [ ] **Grace period handling** for failed payments
- [ ] **Price verification** (prevent manipulation)
- [ ] **Currency mismatch detection**
- [ ] **Family sharing detection** (iOS)

### Implementation (Edge Function):
```typescript
// Server-side receipt validation
async function validateReceipt(receipt, platform, productId) {
  if (platform === 'ios') {
    // Apple App Store validation
    const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': process.env.APPLE_SHARED_SECRET
      })
    });
    return response.json();
  } else {
    // Google Play validation
    const auth = await getGoogleAuth();
    const response = await fetch(
      `https://androidpublisher.googleapis.com/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${receipt}`,
      { headers: { Authorization: `Bearer ${auth.token}` }}
    );
    return response.json();
  }
}
```

---

## 11. Logging & Monitoring

### P0 - Critical
- [ ] **Security event logging** (login, logout, password changes)
- [ ] **Error logging** (with stack traces in dev only)
- [ ] **Audit trail** for sensitive operations
- [ ] **Log retention policy** (90 days minimum)
- [ ] **No sensitive data in logs**

### P1 - High
- [ ] **Real-time alerting** (Slack, email, PagerDuty)
- [ ] **Anomaly detection** (unusual patterns)
- [ ] **Log aggregation** (centralized logging)
- [ ] **Performance monitoring** (APM)
- [ ] **Uptime monitoring**

### P2 - Medium
- [ ] **User activity tracking** (for support)
- [ ] **API usage analytics**
- [ ] **Error rate monitoring**

### Security Events to Log:
```javascript
const SECURITY_EVENTS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  '2FA_ENABLED',
  '2FA_DISABLED',
  '2FA_FAILED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'PERMISSION_DENIED',
  'SUSPICIOUS_ACTIVITY',
  'FRAUD_DETECTED',
  'DATA_EXPORT',
  'DATA_DELETED',
  'ADMIN_ACTION'
];
```

---

## 12. Privacy & Compliance

### P0 - Critical (GDPR/CCPA)
- [ ] **Privacy policy** link in app
- [ ] **Terms of service** acceptance
- [ ] **Cookie consent** banner (web)
- [ ] **Data export** (user can download their data)
- [ ] **Data deletion** (right to be forgotten)
- [ ] **Consent management** (opt-in/opt-out)

### P1 - High
- [ ] **Data processing agreement** (DPA) with vendors
- [ ] **Privacy by design** (minimal data collection)
- [ ] **Data inventory** (know what you collect)
- [ ] **Breach notification** process
- [ ] **Children's privacy** (COPPA if applicable)

### P2 - Medium
- [ ] **Data portability** (machine-readable export)
- [ ] **Consent history** tracking
- [ ] **Automated decision disclosure**

### Implementation:
```javascript
// GDPR consent modal fields
const CONSENT_OPTIONS = [
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Help us improve the app',
    required: false,
    default: false
  },
  {
    id: 'personalization',
    label: 'Personalization',
    description: 'Personalized recommendations',
    required: false,
    default: false
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Promotional communications',
    required: false,
    default: false
  }
];

// Data export function
async function exportUserData(userId) {
  const data = {
    profile: await getProfile(userId),
    purchases: await getPurchases(userId),
    activity: await getActivityLog(userId),
    preferences: await getPreferences(userId),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

// Data deletion function
async function deleteUserData(userId) {
  await deleteProfile(userId);
  await deletePurchases(userId);
  await deleteActivity(userId);
  await deletePreferences(userId);
  await logAuditEvent('DATA_DELETED', { userId });
}
```

---

## 13. Infrastructure Security

### P0 - Critical
- [ ] **HTTPS everywhere** (no HTTP)
- [ ] **Security headers** (CSP, HSTS, X-Frame-Options)
- [ ] **Environment variables** for secrets (not in code)
- [ ] **Dependency scanning** (npm audit, Snyk)
- [ ] **Regular updates** (OS, runtime, dependencies)

### P1 - High
- [ ] **WAF (Web Application Firewall)**
- [ ] **DDoS protection**
- [ ] **CDN** for static assets
- [ ] **Staging environment** (separate from production)
- [ ] **Infrastructure as Code** (reproducible)

### P2 - Medium
- [ ] **Container security** (if using Docker)
- [ ] **Network segmentation**
- [ ] **VPN for admin access**

### Security Headers:
```javascript
// Required security headers
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

---

## 14. Mobile App Security

### P0 - Critical
- [ ] **Certificate pinning** (prevent MITM)
- [ ] **Secure storage** (Keychain/Keystore)
- [ ] **Code obfuscation** (ProGuard/R8)
- [ ] **Root/jailbreak detection**
- [ ] **Tamper detection** (integrity checks)

### P1 - High
- [ ] **Biometric authentication** integration
- [ ] **App Transport Security** (iOS)
- [ ] **Network security config** (Android)
- [ ] **Debug detection** (prevent debugging in prod)
- [ ] **Screenshot prevention** for sensitive screens

### P2 - Medium
- [ ] **Runtime application self-protection (RASP)**
- [ ] **Binary protection**
- [ ] **Emulator detection**

### Implementation (React Native):
```javascript
// Secure storage
import * as SecureStore from 'expo-secure-store';

async function saveSecurely(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function getSecurely(key) {
  return await SecureStore.getItemAsync(key);
}

// Root/jailbreak detection
import JailMonkey from 'jail-monkey';

function checkDeviceSecurity() {
  return {
    isJailbroken: JailMonkey.isJailBroken(),
    canMockLocation: JailMonkey.canMockLocation(),
    isDebuggedMode: JailMonkey.isDebuggedMode()
  };
}
```

---

## 15. Admin Dashboard Security

### P0 - Critical
- [ ] **Separate admin authentication** (not shared with users)
- [ ] **2FA required** for all admin accounts
- [ ] **IP allowlist** for admin access
- [ ] **Admin action audit log**
- [ ] **Principle of least privilege** (role-based)

### P1 - High
- [ ] **Session timeout** (30 minutes inactivity)
- [ ] **Concurrent session prevention** (single session)
- [ ] **Admin account approval** process
- [ ] **Regular access review** (quarterly)
- [ ] **Emergency access procedure**

### P2 - Medium
- [ ] **Admin activity dashboard**
- [ ] **Bulk action confirmation**
- [ ] **Change request workflow**

---

## 16. Testing & Verification

### P0 - Critical
- [ ] **Security testing checklist** (manual)
- [ ] **Automated security scans** (SAST/DAST)
- [ ] **Dependency vulnerability scanning**
- [ ] **Penetration testing** (annually)
- [ ] **Code review** for security-sensitive code

### P1 - High
- [ ] **Unit tests** for auth functions
- [ ] **Integration tests** for auth flow
- [ ] **Load testing** (prevent DoS)
- [ ] **Chaos engineering** (resilience testing)

### Testing Checklist:
```markdown
## Manual Security Test Checklist

### Authentication
- [ ] Can't login with wrong password
- [ ] Account locks after 5 failed attempts
- [ ] Password reset email expires after 1 hour
- [ ] 2FA code required when enabled
- [ ] Session expires after timeout

### Authorization
- [ ] Can't access other users' data
- [ ] Can't access admin functions as regular user
- [ ] API returns 403 for unauthorized requests

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] File upload restrictions work
- [ ] Size limits enforced

### Session Management
- [ ] Session invalidated on logout
- [ ] Session invalidated on password change
- [ ] Can't reuse old session tokens
```

---

## Quick Start Commands

```bash
# Install security dependencies
npm install bcryptjs otpauth qrcode @types/bcryptjs @types/qrcode

# Install validation
npm install zod

# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Environment Variables Template

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Apple IAP
APPLE_SHARED_SECRET=your-apple-shared-secret

# Google IAP
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Email (if custom)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Security
JWT_SECRET=your-256-bit-secret
ENCRYPTION_KEY=your-256-bit-key
```

---

## Completion Checklist Summary

### P0 - Critical (Must Have Before Launch)
- [ ] Password hashing (bcrypt 12 rounds)
- [ ] Email verification
- [ ] Password reset via email
- [ ] Account lockout
- [ ] 2FA for admin accounts
- [ ] Session management
- [ ] Rate limiting
- [ ] Input validation
- [ ] Server-side receipt validation
- [ ] Audit logging
- [ ] HTTPS everywhere
- [ ] RLS on all tables
- [ ] Privacy policy
- [ ] Data export/delete

### P1 - High (Should Have Within 2 Weeks)
- [ ] 2FA for all users (optional)
- [ ] Magic link login
- [ ] Fraud detection
- [ ] Security headers
- [ ] Dependency scanning
- [ ] Login notifications
- [ ] IP allowlist for admin
- [ ] Breach password checking

### P2 - Medium (Nice to Have)
- [ ] Biometric authentication
- [ ] Device management
- [ ] Advanced fraud detection
- [ ] Behavioral analysis
- [ ] Runtime protection

---

## Support & Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [React Native Security](https://reactnative.dev/docs/security)
- [Apple App Store Security](https://developer.apple.com/documentation/security)
- [Google Play Security](https://developer.android.com/privacy-and-security)

---

*Template Version: 1.0 | Last Updated: February 2026*
*Use this template with Claude Code to systematically implement security features.*
