/**
 * Two-Factor Authentication Service
 * Provides TOTP-based 2FA for admin accounts
 */

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import supabase from './supabase';

const ISSUER = 'Summit Wheels Admin';
const BACKUP_CODE_COUNT = 10;

/**
 * Generate a new TOTP secret for a user
 */
export async function generateTOTPSecret(userId: string, email: string): Promise<{
  secret: string;
  uri: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Create a new TOTP object
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 })
  });

  const secret = totp.secret.base32;
  const uri = totp.toString();

  // Generate QR code
  const qrCode = await QRCode.toDataURL(uri);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store secret temporarily (not enabled until verified)
  await supabase
    .from('admin_users')
    .update({
      totp_secret: secret,
      backup_codes: backupCodes.map(code => hashBackupCode(code))
    })
    .eq('id', userId);

  return {
    secret,
    uri,
    qrCode,
    backupCodes
  };
}

/**
 * Verify a TOTP code and enable 2FA
 */
export async function verifyAndEnable2FA(userId: string, code: string): Promise<boolean> {
  // Get user's TOTP secret
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('totp_secret')
    .eq('id', userId)
    .single();

  if (error || !user?.totp_secret) {
    throw new Error('2FA setup not initiated');
  }

  // Verify the code
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totp_secret)
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    return false;
  }

  // Enable 2FA
  await supabase
    .from('admin_users')
    .update({
      totp_enabled: true,
      totp_verified_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Log the event
  await supabase
    .from('audit_logs')
    .insert({
      action: '2FA_ENABLED',
      details: { userId },
      timestamp: new Date().toISOString()
    });

  return true;
}

/**
 * Verify a TOTP code during login
 */
export async function verifyTOTPCode(userId: string, code: string): Promise<boolean> {
  // Get user's TOTP secret
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('totp_secret, totp_enabled, last_totp_used_at')
    .eq('id', userId)
    .single();

  if (error || !user?.totp_secret || !user.totp_enabled) {
    throw new Error('2FA not enabled for this user');
  }

  // Check for code reuse (prevent replay attacks)
  if (user.last_totp_used_at) {
    const lastUsed = new Date(user.last_totp_used_at);
    const now = new Date();
    // If used within the last 30 seconds, reject
    if (now.getTime() - lastUsed.getTime() < 30000) {
      throw new Error('Code already used. Please wait for a new code.');
    }
  }

  // Verify the code
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totp_secret)
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    // Log failed attempt
    await supabase
      .from('audit_logs')
      .insert({
        action: '2FA_FAILED',
        details: { userId },
        timestamp: new Date().toISOString()
      });
    return false;
  }

  // Update last used time
  await supabase
    .from('admin_users')
    .update({ last_totp_used_at: new Date().toISOString() })
    .eq('id', userId);

  // Log success
  await supabase
    .from('audit_logs')
    .insert({
      action: '2FA_SUCCESS',
      details: { userId },
      timestamp: new Date().toISOString()
    });

  return true;
}

/**
 * Verify a backup code during login
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('backup_codes')
    .eq('id', userId)
    .single();

  if (error || !user?.backup_codes) {
    return false;
  }

  const hashedCode = hashBackupCode(code.toUpperCase().replace(/\s/g, ''));
  const codeIndex = user.backup_codes.indexOf(hashedCode);

  if (codeIndex === -1) {
    return false;
  }

  // Remove used backup code
  const remainingCodes = [...user.backup_codes];
  remainingCodes.splice(codeIndex, 1);

  await supabase
    .from('admin_users')
    .update({ backup_codes: remainingCodes })
    .eq('id', userId);

  // Log the event
  await supabase
    .from('audit_logs')
    .insert({
      action: '2FA_BACKUP_CODE_USED',
      details: { userId, remainingCodes: remainingCodes.length },
      timestamp: new Date().toISOString()
    });

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  await supabase
    .from('admin_users')
    .update({
      totp_secret: null,
      totp_enabled: false,
      totp_verified_at: null,
      backup_codes: null,
      last_totp_used_at: null
    })
    .eq('id', userId);

  await supabase
    .from('audit_logs')
    .insert({
      action: '2FA_DISABLED',
      details: { userId },
      timestamp: new Date().toISOString()
    });
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('totp_enabled')
    .eq('id', userId)
    .single();

  return !error && data?.totp_enabled === true;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = generateBackupCodes();

  await supabase
    .from('admin_users')
    .update({
      backup_codes: backupCodes.map(code => hashBackupCode(code))
    })
    .eq('id', userId);

  await supabase
    .from('audit_logs')
    .insert({
      action: '2FA_BACKUP_CODES_REGENERATED',
      details: { userId },
      timestamp: new Date().toISOString()
    });

  return backupCodes;
}

/**
 * Generate random backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Simple hash for backup codes (in production, use bcrypt)
 */
function hashBackupCode(code: string): string {
  let hash = 0;
  const str = `backup_${code}_salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `bc_${Math.abs(hash).toString(16)}`;
}
