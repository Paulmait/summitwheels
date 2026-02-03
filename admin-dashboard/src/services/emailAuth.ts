/**
 * Email Authentication Service
 * Provides magic link, email confirmation, and password reset functionality
 */

import supabase from './supabase';

// Email templates configuration
const EMAIL_TEMPLATES = {
  MAGIC_LINK_SUBJECT: 'Sign in to Summit Wheels Admin',
  PASSWORD_RESET_SUBJECT: 'Reset your Summit Wheels Admin password',
  EMAIL_CONFIRM_SUBJECT: 'Confirm your Summit Wheels Admin email',
  PASSWORD_CHANGE_SUBJECT: 'Your password was changed',
  LOGIN_ALERT_SUBJECT: 'New login to your Summit Wheels Admin account'
};

// Token expiry times
const TOKEN_EXPIRY = {
  MAGIC_LINK: 15 * 60 * 1000, // 15 minutes
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  EMAIL_CONFIRM: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Generate a secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Send magic link for passwordless login
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return { success: true }; // Silently succeed to prevent enumeration
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is disabled' };
    }

    // Generate magic link token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.MAGIC_LINK);

    // Store token in database
    await supabase
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token_type: 'magic_link',
        token_hash: await hashToken(token),
        expires_at: expiresAt.toISOString()
      });

    // In production, send email via your email service
    // For now, log the link (replace with actual email sending)
    const magicLink = `${window.location.origin}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('Magic link generated:', magicLink);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'MAGIC_LINK_SENT',
        details: { email, userId: user.id },
        timestamp: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Magic link error:', error);
    return { success: false, error: 'Failed to send magic link' };
  }
}

/**
 * Verify magic link token
 */
export async function verifyMagicLink(token: string, email: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string
}> {
  try {
    const tokenHash = await hashToken(token);

    // Find valid token
    const { data: authToken, error } = await supabase
      .from('auth_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .eq('token_type', 'magic_link')
      .single();

    if (error || !authToken) {
      return { success: false, error: 'Invalid or expired link' };
    }

    // Check if expired
    if (new Date() > new Date(authToken.expires_at)) {
      return { success: false, error: 'Link has expired' };
    }

    // Check if already used
    if (authToken.used_at) {
      return { success: false, error: 'Link has already been used' };
    }

    // Verify email matches
    const { data: user } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', authToken.user_id)
      .single();

    if (user?.email !== email.toLowerCase().trim()) {
      return { success: false, error: 'Invalid link' };
    }

    // Mark token as used
    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authToken.id);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'MAGIC_LINK_VERIFIED',
        details: { email, userId: authToken.user_id },
        timestamp: new Date().toISOString()
      });

    return { success: true, userId: authToken.user_id };
  } catch (error: any) {
    console.error('Verify magic link error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      // Don't reveal if user exists
      return { success: true };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is disabled' };
    }

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET);

    // Invalidate existing reset tokens
    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('token_type', 'password_reset')
      .is('used_at', null);

    // Store new token
    await supabase
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token_type: 'password_reset',
        token_hash: await hashToken(token),
        expires_at: expiresAt.toISOString()
      });

    // Generate reset link
    const resetLink = `${window.location.origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('Password reset link generated:', resetLink);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'PASSWORD_RESET_REQUESTED',
        details: { email, userId: user.id },
        timestamp: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
}

/**
 * Verify password reset token and set new password
 */
export async function resetPassword(
  token: string,
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenHash = await hashToken(token);

    // Find valid token
    const { data: authToken, error } = await supabase
      .from('auth_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .eq('token_type', 'password_reset')
      .single();

    if (error || !authToken) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    // Check if expired
    if (new Date() > new Date(authToken.expires_at)) {
      return { success: false, error: 'Reset link has expired' };
    }

    // Check if already used
    if (authToken.used_at) {
      return { success: false, error: 'Reset link has already been used' };
    }

    // Verify email matches
    const { data: user } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('id', authToken.user_id)
      .single();

    if (user?.email !== email.toLowerCase().trim()) {
      return { success: false, error: 'Invalid reset link' };
    }

    // Validate new password
    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return { success: false, error: `Password must have: ${passwordErrors.join(', ')}` };
    }

    // Hash new password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate token
    await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        password_changed_at: new Date().toISOString(),
        session_token: null,
        session_expires_at: null
      })
      .eq('id', user.id);

    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authToken.id);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'PASSWORD_RESET_COMPLETED',
        details: { email, userId: user.id },
        timestamp: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Send email confirmation for new account
 */
export async function sendEmailConfirmation(userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_CONFIRM);

    // Store confirmation token
    await supabase
      .from('auth_tokens')
      .insert({
        user_id: userId,
        token_type: 'email_confirm',
        token_hash: await hashToken(token),
        expires_at: expiresAt.toISOString()
      });

    // Generate confirmation link
    const confirmLink = `${window.location.origin}/auth/confirm-email?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('Email confirmation link generated:', confirmLink);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'EMAIL_CONFIRMATION_SENT',
        details: { email, userId },
        timestamp: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Email confirmation error:', error);
    return { success: false, error: 'Failed to send confirmation email' };
  }
}

/**
 * Verify email confirmation token
 */
export async function verifyEmailConfirmation(token: string, email: string): Promise<{
  success: boolean;
  error?: string
}> {
  try {
    const tokenHash = await hashToken(token);

    const { data: authToken, error } = await supabase
      .from('auth_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .eq('token_type', 'email_confirm')
      .single();

    if (error || !authToken) {
      return { success: false, error: 'Invalid confirmation link' };
    }

    if (new Date() > new Date(authToken.expires_at)) {
      return { success: false, error: 'Confirmation link has expired' };
    }

    if (authToken.used_at) {
      return { success: false, error: 'Email already confirmed' };
    }

    // Mark email as confirmed
    await supabase
      .from('admin_users')
      .update({
        email_confirmed_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', authToken.user_id);

    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authToken.id);

    await supabase
      .from('audit_logs')
      .insert({
        action: 'EMAIL_CONFIRMED',
        details: { email, userId: authToken.user_id },
        timestamp: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Email confirmation error:', error);
    return { success: false, error: 'Confirmation failed' };
  }
}

/**
 * Send login notification email
 */
export async function sendLoginNotification(
  userId: string,
  email: string,
  metadata: { ip?: string; device?: string; location?: string }
): Promise<void> {
  try {
    // In production, send email notification
    console.log('Login notification:', { email, metadata });

    await supabase
      .from('audit_logs')
      .insert({
        action: 'LOGIN_NOTIFICATION_SENT',
        details: { email, userId, ...metadata },
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Login notification error:', error);
  }
}

/**
 * Check if password has been exposed in data breaches
 * Uses HaveIBeenPwned API (k-anonymity model)
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count?: number
}> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Send first 5 chars to HIBP API (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();

    // Check if our suffix is in the response
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(count) };
      }
    }

    return { breached: false };
  } catch (error) {
    console.error('Password breach check error:', error);
    // Fail open - don't block login if check fails
    return { breached: false };
  }
}

/**
 * Hash token for storage (using SHA-256)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 12) errors.push('at least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('one special character');
  return errors;
}
