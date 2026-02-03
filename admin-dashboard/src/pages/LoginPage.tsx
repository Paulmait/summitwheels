import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TwoFactorVerify from '../components/TwoFactorVerify';
import { is2FAEnabled } from '../services/twoFactorAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
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

    setLoading(true);

    try {
      await forcePasswordChange(email, password, newPassword);
      setShowPasswordExpiredModal(false);
      // Re-login with new password
      await login(email, newPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
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
        </form>

        <div className="security-notice">
          <p>This is a secure area. All login attempts are monitored and logged.</p>
        </div>
      </div>
    </div>
  );
}
