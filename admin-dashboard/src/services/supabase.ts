import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Security constants
const BCRYPT_ROUNDS = 12;
const PASSWORD_EXPIRY_DAYS = 180; // 6 months
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const SESSION_TIMEOUT_HOURS = 8;

// Rate limiting storage (in production, use Redis)
const loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();

// Check if account is locked
function isAccountLocked(email: string): boolean {
  const attempts = loginAttempts.get(email);
  if (!attempts?.lockedUntil) return false;
  if (new Date() > attempts.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }
  return true;
}

// Record login attempt
function recordLoginAttempt(email: string, success: boolean): void {
  const now = new Date();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };

  if (success) {
    loginAttempts.delete(email);
    return;
  }

  attempts.count++;
  attempts.lastAttempt = now;

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
  }

  loginAttempts.set(email, attempts);
}

// Check if password is expired (6 months)
function isPasswordExpired(passwordChangedAt: string | null): boolean {
  if (!passwordChangedAt) return true;
  const changedDate = new Date(passwordChangedAt);
  const expiryDate = new Date(changedDate.getTime() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > expiryDate;
}

// Generate session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Admin authentication with security features
export async function signIn(email: string, password: string) {
  // Check if account is locked
  if (isAccountLocked(email)) {
    const attempts = loginAttempts.get(email);
    const remainingMinutes = Math.ceil((attempts!.lockedUntil!.getTime() - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${remainingMinutes} minutes.`);
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    recordLoginAttempt(email, false);
    // Log failed attempt for audit
    await logAuditEvent('LOGIN_FAILED', { email, reason: 'user_not_found' });
    throw new Error('Invalid credentials');
  }

  if (!data.is_active) {
    recordLoginAttempt(email, false);
    await logAuditEvent('LOGIN_FAILED', { email, reason: 'account_disabled' });
    throw new Error('Account is disabled. Contact administrator.');
  }

  // Verify password with bcrypt
  const isValidPassword = await bcrypt.compare(password, data.password_hash);

  if (!isValidPassword) {
    recordLoginAttempt(email, false);
    await logAuditEvent('LOGIN_FAILED', { email, reason: 'invalid_password' });
    throw new Error('Invalid credentials');
  }

  // Success - clear login attempts
  recordLoginAttempt(email, true);

  // Check password expiry
  const passwordExpired = isPasswordExpired(data.password_changed_at);

  // Generate session
  const sessionToken = generateSessionToken();
  const sessionExpiry = new Date(Date.now() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);

  // Update last login and session
  await supabase
    .from('admin_users')
    .update({
      last_login: new Date().toISOString(),
      session_token: sessionToken,
      session_expires_at: sessionExpiry.toISOString()
    })
    .eq('id', data.id);

  // Track login device and check if it's new
  const deviceTracking = await trackLoginDevice(data.id);

  // Log successful login with full details
  await logAuditEvent('LOGIN_SUCCESS', {
    email,
    userId: data.id,
    isNewDevice: deviceTracking.isNewDevice
  });

  // If new device, log security alert
  if (deviceTracking.isNewDevice) {
    await logAuditEvent('NEW_DEVICE_LOGIN', {
      email,
      userId: data.id,
      message: 'Login from a new device detected'
    });
  }

  return {
    ...data,
    sessionToken,
    sessionExpiry: sessionExpiry.toISOString(),
    passwordExpired,
    daysUntilPasswordExpiry: passwordExpired ? 0 : Math.ceil(
      (new Date(data.password_changed_at).getTime() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
    ),
    isNewDevice: deviceTracking.isNewDevice
  };
}

export async function signOut(userId?: string) {
  if (userId) {
    await supabase
      .from('admin_users')
      .update({ session_token: null, session_expires_at: null })
      .eq('id', userId);
    await logAuditEvent('LOGOUT', { userId });
  }
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_session');
}

export async function validateSession(userId: string, sessionToken: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('session_token, session_expires_at, is_active')
    .eq('id', userId)
    .single();

  if (error || !data || !data.is_active) return false;
  if (data.session_token !== sessionToken) return false;
  if (new Date() > new Date(data.session_expires_at)) return false;

  return true;
}

export async function createAdminUser(email: string, password: string, name: string, createdBy?: string) {
  // Validate password strength
  validatePasswordStrength(password);

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name.trim(),
      role: 'admin',
      is_active: true,
      password_changed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      throw new Error('Email already exists');
    }
    throw error;
  }

  await logAuditEvent('ADMIN_CREATED', {
    newUserId: data.id,
    email: data.email,
    createdBy
  });

  return data;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  // Get current user
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('password_hash, email')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    await logAuditEvent('PASSWORD_CHANGE_FAILED', { userId, reason: 'invalid_current_password' });
    throw new Error('Current password is incorrect');
  }

  // Validate new password strength
  validatePasswordStrength(newPassword);

  // Ensure new password is different
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  // Hash and update
  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await supabase
    .from('admin_users')
    .update({
      password_hash: newHash,
      password_changed_at: new Date().toISOString(),
      // Invalidate existing sessions on password change
      session_token: null,
      session_expires_at: null
    })
    .eq('id', userId);

  await logAuditEvent('PASSWORD_CHANGED', { userId, email: user.email });

  return true;
}

export async function forcePasswordReset(userId: string, newPassword: string, adminId: string) {
  validatePasswordStrength(newPassword);

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await supabase
    .from('admin_users')
    .update({
      password_hash: newHash,
      password_changed_at: new Date().toISOString(),
      session_token: null,
      session_expires_at: null
    })
    .eq('id', userId);

  await logAuditEvent('PASSWORD_FORCE_RESET', { userId, resetBy: adminId });

  return true;
}

export async function checkAdminExists() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error checking admin:', error);
    return false;
  }

  return data && data.length > 0;
}

// Password strength validation
function validatePasswordStrength(password: string): void {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('one special character');
  }

  if (errors.length > 0) {
    throw new Error(`Password must contain ${errors.join(', ')}`);
  }
}

// Get client IP address (cached for session)
let cachedClientInfo: { ip: string; location?: string; } | null = null;

async function getClientInfo(): Promise<{ ip: string; location?: string; }> {
  if (cachedClientInfo) return cachedClientInfo;

  try {
    // Use ipapi.co for IP and location info (free tier: 1000 req/day)
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      cachedClientInfo = {
        ip: data.ip,
        location: `${data.city}, ${data.region}, ${data.country_name}`
      };
      return cachedClientInfo;
    }
  } catch (e) {
    // Fallback if IP service fails
  }

  return { ip: 'unknown' };
}

// Parse user agent for device info
function parseUserAgent(): { browser: string; os: string; device: string } {
  if (typeof navigator === 'undefined') {
    return { browser: 'unknown', os: 'unknown', device: 'unknown' };
  }

  const ua = navigator.userAgent;

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect device type
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
}

// Audit logging with full security details
async function logAuditEvent(action: string, details: Record<string, unknown>) {
  try {
    const clientInfo = await getClientInfo();
    const deviceInfo = parseUserAgent();

    await supabase
      .from('audit_logs')
      .insert({
        action,
        details: {
          ...details,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device: deviceInfo.device,
          location: clientInfo.location
        },
        ip_address: clientInfo.ip,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString()
      });
  } catch (e) {
    // Don't fail main operation if audit logging fails
    console.error('Audit log failed:', e);
  }
}

// Track login device for security alerts
async function trackLoginDevice(userId: string) {
  try {
    const clientInfo = await getClientInfo();
    const deviceInfo = parseUserAgent();
    const deviceId = btoa(`${deviceInfo.browser}-${deviceInfo.os}-${clientInfo.ip}`).slice(0, 32);

    // Check if this is a new device
    const { data: existingDevice } = await supabase
      .from('login_devices')
      .select('id, is_trusted')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    const isNewDevice = !existingDevice;

    // Upsert device record
    await supabase
      .from('login_devices')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        device_name: `${deviceInfo.browser} on ${deviceInfo.os}`,
        device_type: deviceInfo.device.toLowerCase(),
        ip_address: clientInfo.ip,
        location: clientInfo.location,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        last_used_at: new Date().toISOString(),
        is_trusted: existingDevice?.is_trusted || false
      }, {
        onConflict: 'user_id,device_id'
      });

    return { isNewDevice, deviceInfo, clientInfo };
  } catch (e) {
    console.error('Device tracking failed:', e);
    return { isNewDevice: false, deviceInfo: null, clientInfo: null };
  }
}

// Get audit logs for admin
export async function getAuditLogs(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

// Get login history for a user
export async function getLoginHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('details->>userId', userId)
    .in('action', ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'NEW_DEVICE_LOGIN', 'LOGOUT'])
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get user's devices
export async function getUserDevices(userId: string) {
  const { data, error } = await supabase
    .from('login_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Remove a trusted device
export async function removeDevice(userId: string, deviceId: string) {
  const { error } = await supabase
    .from('login_devices')
    .delete()
    .eq('user_id', userId)
    .eq('device_id', deviceId);

  if (error) throw error;

  await logAuditEvent('DEVICE_REMOVED', { userId, deviceId });
  return true;
}

// Mark device as trusted
export async function trustDevice(userId: string, deviceId: string, trusted: boolean) {
  const { error } = await supabase
    .from('login_devices')
    .update({ is_trusted: trusted })
    .eq('user_id', userId)
    .eq('device_id', deviceId);

  if (error) throw error;

  await logAuditEvent(trusted ? 'DEVICE_TRUSTED' : 'DEVICE_UNTRUSTED', { userId, deviceId });
  return true;
}

// Get security summary for dashboard
export async function getSecuritySummary(userId: string) {
  const [loginHistory, devices, passwordInfo] = await Promise.all([
    getLoginHistory(userId, 10),
    getUserDevices(userId),
    getPasswordExpiryInfo(userId)
  ]);

  const failedLogins = loginHistory?.filter(l => l.action === 'LOGIN_FAILED').length || 0;
  const newDeviceLogins = loginHistory?.filter(l => l.action === 'NEW_DEVICE_LOGIN').length || 0;
  const trustedDevices = devices?.filter(d => d.is_trusted).length || 0;

  return {
    recentLogins: loginHistory,
    devices,
    passwordInfo,
    stats: {
      totalDevices: devices?.length || 0,
      trustedDevices,
      failedLoginAttempts: failedLogins,
      newDeviceLogins
    }
  };
}

// Get password expiry info
export async function getPasswordExpiryInfo(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('password_changed_at')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const changedAt = new Date(data.password_changed_at);
  const expiresAt = new Date(changedAt.getTime() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return {
    changedAt: data.password_changed_at,
    expiresAt: expiresAt.toISOString(),
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
    isExpiringSoon: daysRemaining <= 30 && daysRemaining > 0
  };
}

export default supabase;
