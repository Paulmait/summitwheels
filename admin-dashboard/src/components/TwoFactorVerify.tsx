import React, { useState } from 'react';
import { verifyTOTPCode, verifyBackupCode } from '../services/twoFactorAuth';

interface TwoFactorVerifyProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerify({ userId, onSuccess, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let success: boolean;

      if (useBackupCode) {
        success = await verifyBackupCode(userId, code);
      } else {
        if (code.length !== 6) {
          setError('Please enter a 6-digit code');
          setLoading(false);
          return;
        }
        success = await verifyTOTPCode(userId, code);
      }

      if (success) {
        onSuccess();
      } else {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="two-factor-verify">
      <div className="login-logo">
        <h1>Two-Factor Authentication</h1>
        <p>{useBackupCode ? 'Enter a backup code' : 'Enter the code from your authenticator app'}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>{useBackupCode ? 'Backup Code' : 'Authentication Code'}</label>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            if (useBackupCode) {
              setCode(e.target.value.toUpperCase());
            } else {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
          style={useBackupCode ? {} : { textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
          maxLength={useBackupCode ? 9 : 6}
          autoFocus
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleVerify}
        disabled={loading || !code.trim()}
        style={{ width: '100%', marginBottom: '12px' }}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode('');
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {useBackupCode ? 'Use authenticator app' : 'Use backup code'}
        </button>
      </div>

      <div className="security-notice" style={{ marginTop: '24px' }}>
        <p>
          {useBackupCode
            ? 'Backup codes are single-use. After using one, it will be removed from your account.'
            : 'Open your authenticator app to get your current code.'}
        </p>
      </div>
    </div>
  );
}
