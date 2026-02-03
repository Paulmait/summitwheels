import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TwoFactorVerify from '../components/TwoFactorVerify';
import { is2FAEnabled } from '../services/twoFactorAuth';
import { sendMagicLink, sendPasswordResetEmail, checkPasswordBreach } from '../services/emailAuth';

type LoginMode = 'password' | 'magic_link' | 'forgot_password';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [showPasswordExpiredModal, setShowPasswordExpiredModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);
  const { login, user, checkSetup, forcePasswordChange, complete2FALogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !showPasswordExpiredModal && !show2FAModal) {
      navigate('/');
    }
    checkSetup().then(exists => {
      if (!exists) {
        navigate('/setup');
      }
    });
  }, [user, navigate, checkSetup, showPasswordExpiredModal, show2FAModal]);

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    const issues: string[] = [];
    if (pwd.length < 12) issues.push('At least 12 characters');
    if (!/[A-Z]/.test(pwd)) issues.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) issues.push('One lowercase letter');
    if (!/[0-9]/.test(pwd)) issues.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) issues.push('One special character');
    setPasswordStrength(issues);
    return issues.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setSuccess('');
    setLoading(true);

    try {
      // Check if password has been breached
      const breachCheck = await checkPasswordBreach(password);
      if (breachCheck.breached) {
        setWarning(`This password has been found in ${breachCheck.count?.toLocaleString()} data breaches. Consider changing it after login.`);
      }

      const result = await login(email, password);

      // Check if password is expired
      if (result.passwordExpired) {
        setShowPasswordExpiredModal(true);
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled
      if (result.requires2FA && result.userId) {
        setPending2FAUserId(result.userId);
        setShow2FAModal(true);
        setLoading(false);
        return;
      }

      // Check if password is expiring soon (within 30 days)
      if (result.daysUntilPasswordExpiry && result.daysUntilPasswordExpiry <= 30) {
        setWarning(`Your password will expire in ${result.daysUntilPasswordExpiry} days. Please change it soon.`);
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await sendMagicLink(email);
      if (result.success) {
        setSuccess('Magic link sent! Check your email to sign in. The link expires in 15 minutes.');
      } else {
        setError(result.error || 'Failed to send magic link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox. The link expires in 1 hour.');
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    try {
      if (pending2FAUserId) {
        await complete2FALogin(pending2FAUserId);
      }
      setShow2FAModal(false);
      setPending2FAUserId(null);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to complete login');
    }
  };

  const handle2FACancel = () => {
    setShow2FAModal(false);
    setPending2FAUserId(null);
    setPassword('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!checkPasswordStrength(newPassword)) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword === password) {
      setError('New password must be different from current password');
      return;
    }

    // Check if new password is breached
    const breachCheck = await checkPasswordBreach(newPassword);
    if (breachCheck.breached) {
      setError(`This password has been found in ${breachCheck.count?.toLocaleString()} data breaches. Please choose a different password.`);
      return;
    }

    setLoading(true);

    try {
      await forcePasswordChange(email, password, newPassword);
      setShowPasswordExpiredModal(false);
      await login(email, newPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setError('');
    setSuccess('');
    setWarning('');
  };

  // 2FA verification modal
  if (show2FAModal && pending2FAUserId) {
    return (
      <div className="login-container">
        <div className="login-box">
          <TwoFactorVerify
            userId={pending2FAUserId}
            onSuccess={handle2FASuccess}
            onCancel={handle2FACancel}
          />
        </div>
      </div>
    );
  }

  // Password expired modal
  if (showPasswordExpiredModal) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-logo">
            <h1>Password Expired</h1>
            <p>Your password has expired. Please create a new one.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                placeholder="Enter new password"
                required
              />
            </div>

            {newPassword && passwordStrength.length > 0 && (
              <div className="password-requirements">
                <p>Password must have:</p>
                <ul>
                  {passwordStrength.map((req, i) => (
                    <li key={i} className="requirement-missing">{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {newPassword && passwordStrength.length === 0 && (
              <div className="password-requirements success">
                <p>Password meets all requirements</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowPasswordExpiredModal(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{ marginTop: '10px' }}
            >
              Cancel
            </button>
          </form>

          <div className="security-notice">
            <p>For your security, passwords must be changed every 6 months.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <h1>Summit Wheels</h1>
          <p>Admin Dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {warning && <div className="warning-message">{warning}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Login Mode Tabs */}
        <div className="login-tabs" style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => switchMode('password')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: loginMode === 'password' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: loginMode === 'password' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: loginMode === 'password' ? 600 : 400
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode('magic_link')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: loginMode === 'magic_link' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: loginMode === 'magic_link' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: loginMode === 'magic_link' ? 600 : 400
            }}
          >
            Magic Link
          </button>
        </div>

        {/* Password Login Form */}
        {loginMode === 'password' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('forgot_password')}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Magic Link Form */}
        {loginMode === 'magic_link' && (
          <form onSubmit={handleMagicLinkSubmit}>
            <div className="form-group">
              <label htmlFor="magic-email">Email</label>
              <input
                type="email"
                id="magic-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
              We'll send you a secure link to sign in without a password.
            </p>
          </form>
        )}

        {/* Forgot Password Form */}
        {loginMode === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div className="login-logo" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px' }}>Reset Password</h2>
              <p>Enter your email to receive a password reset link.</p>
            </div>

            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('password')}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back to sign in
            </button>
          </form>
        )}

        <div className="security-notice">
          <p>This is a secure area. All login attempts are monitored and logged.</p>
          <p style={{ marginTop: '8px', fontSize: '11px' }}>
            Passwords are checked against known data breaches for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}
