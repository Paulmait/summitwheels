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

  // Log successful login
  await logAuditEvent('LOGIN_SUCCESS', { email, userId: data.id });

  return {
    ...data,
    sessionToken,
    sessionExpiry: sessionExpiry.toISOString(),
    passwordExpired,
    daysUntilPasswordExpiry: passwordExpired ? 0 : Math.ceil(
      (new Date(data.password_changed_at).getTime() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
    )
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

// Audit logging
async function logAuditEvent(action: string, details: Record<string, unknown>) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        action,
        details,
        ip_address: null, // Would be set by edge function in production
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString()
      });
  } catch (e) {
    // Don't fail main operation if audit logging fails
    console.error('Audit log failed:', e);
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
