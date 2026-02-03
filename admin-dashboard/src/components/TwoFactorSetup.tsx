import React, { useState, useEffect } from 'react';
import {
  generateTOTPSecret,
  verifyAndEnable2FA,
  disable2FA,
  is2FAEnabled,
  regenerateBackupCodes
} from '../services/twoFactorAuth';

interface TwoFactorSetupProps {
  userId: string;
  email: string;
  onComplete?: () => void;
}

export default function TwoFactorSetup({ userId, email, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'backup' | 'enabled'>('check');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    check2FAStatus();
  }, [userId]);

  const check2FAStatus = async () => {
    try {
      const enabled = await is2FAEnabled(userId);
      setIs2FAActive(enabled);
      setStep(enabled ? 'enabled' : 'setup');
    } catch (err) {
      setStep('setup');
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await generateTOTPSecret(userId, email);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await verifyAndEnable2FA(userId, verificationCode);
      if (success) {
        setStep('backup');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError('');

    try {
      await disable2FA(userId);
      setIs2FAActive(false);
      setStep('setup');
      setShowDisableConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setLoading(true);
    setError('');

    try {
      const codes = await regenerateBackupCodes(userId);
      setBackupCodes(codes);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  // 2FA is enabled view
  if (step === 'enabled') {
    return (
      <div className="two-factor-setup">
        <div className="status-badge success">
          <span className="icon">&#10003;</span>
          Two-Factor Authentication Enabled
        </div>

        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
          Your account is protected with 2FA. You'll need to enter a code from your authenticator app each time you log in.
        </p>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRegenerateBackupCodes}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Regenerate Backup Codes'}
          </button>

          <button
            className="btn btn-danger"
            onClick={() => setShowDisableConfirm(true)}
          >
            Disable 2FA
          </button>
        </div>

        {backupCodes.length > 0 && (
          <div className="backup-codes" style={{ marginTop: '20px' }}>
            <h4>New Backup Codes</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Save these codes in a secure place. Each code can only be used once.
            </p>
            <div className="codes-grid">
              {backupCodes.map((code, i) => (
                <code key={i}>{code}</code>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={copyBackupCodes} style={{ marginTop: '12px' }}>
              Copy Codes
            </button>
          </div>
        )}

        {showDisableConfirm && (
          <div className="confirm-dialog" style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-danger)',
            borderRadius: '8px'
          }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Are you sure?</strong> Disabling 2FA will make your account less secure.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-danger" onClick={handleDisable} disabled={loading}>
                {loading ? 'Disabling...' : 'Yes, Disable 2FA'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDisableConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      </div>
    );
  }

  // Setup view
  if (step === 'setup') {
    return (
      <div className="two-factor-setup">
        <h4 style={{ marginBottom: '16px' }}>Enable Two-Factor Authentication</h4>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
        </p>

        <div className="benefits" style={{
          background: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h5 style={{ marginBottom: '8px' }}>Benefits of 2FA:</h5>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0 }}>
            <li>Protects against password theft</li>
            <li>Prevents unauthorized access</li>
            <li>Required for sensitive operations</li>
          </ul>
        </div>

        <button className="btn btn-primary" onClick={handleSetup} disabled={loading}>
          {loading ? 'Setting up...' : 'Set Up 2FA'}
        </button>

        {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      </div>
    );
  }

  // Verify view (QR code)
  if (step === 'verify') {
    return (
      <div className="two-factor-setup">
        <h4 style={{ marginBottom: '16px' }}>Scan QR Code</h4>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Open your authenticator app and scan this QR code to add Summit Wheels Admin.
        </p>

        {qrCode && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src={qrCode}
              alt="2FA QR Code"
              style={{ maxWidth: '200px', borderRadius: '8px', background: 'white', padding: '8px' }}
            />
          </div>
        )}

        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Can't scan? Enter this code manually:
          </p>
          <code style={{ wordBreak: 'break-all', fontSize: '14px' }}>{secret}</code>
        </div>

        <div className="form-group">
          <label>Enter the 6-digit code from your app</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
          <button className="btn btn-secondary" onClick={() => setStep('setup')}>
            Cancel
          </button>
        </div>

        {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      </div>
    );
  }

  // Backup codes view
  if (step === 'backup') {
    return (
      <div className="two-factor-setup">
        <div className="status-badge success" style={{ marginBottom: '20px' }}>
          <span className="icon">&#10003;</span>
          2FA Enabled Successfully!
        </div>

        <h4 style={{ marginBottom: '16px' }}>Save Your Backup Codes</h4>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          <strong>Important:</strong> Save these backup codes in a secure place. If you lose access to your authenticator app, you can use these codes to log in. Each code can only be used once.
        </p>

        <div className="backup-codes" style={{
          background: 'var(--bg-tertiary)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div className="codes-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {backupCodes.map((code, i) => (
              <code key={i} style={{
                background: 'var(--bg-secondary)',
                padding: '8px',
                borderRadius: '4px',
                textAlign: 'center',
                fontFamily: 'monospace'
              }}>{code}</code>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button className="btn btn-secondary" onClick={copyBackupCodes}>
            Copy Codes
          </button>
          <button className="btn btn-secondary" onClick={() => {
            const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summit-wheels-backup-codes.txt';
            a.click();
          }}>
            Download Codes
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setStep('enabled');
            setIs2FAActive(true);
            onComplete?.();
          }}
        >
          I've Saved My Codes
        </button>
      </div>
    );
  }

  return null;
}
