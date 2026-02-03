import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { getAuditLogs } from '../services/supabase';
import TwoFactorSetup from '../components/TwoFactorSetup';

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
  user_agent?: string;
}

export default function SettingsPage() {
  const { user, passwordExpiryInfo, updatePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getAuditLogs(20);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!checkPasswordStrength(newPassword)) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setMessage('Password updated successfully. Please log in with your new password.');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Redirect to login after short delay
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('FAILED')) return 'var(--accent-danger)';
    if (action.includes('SUCCESS') || action.includes('CREATED')) return 'var(--accent-secondary)';
    if (action.includes('LOGOUT')) return 'var(--text-secondary)';
    return 'var(--text-primary)';
  };

  return (
    <DashboardLayout title="Settings">
      {/* Profile Section */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Profile</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Name</p>
              <p style={{ fontSize: '18px' }}>{user?.name}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '18px' }}>{user?.email}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Role</p>
              <p style={{ fontSize: '18px', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Expiry Warning */}
      {passwordExpiryInfo && (passwordExpiryInfo.isExpired || passwordExpiryInfo.isExpiringSoon) && (
        <div
          className="chart-container"
          style={{
            marginBottom: '24px',
            background: passwordExpiryInfo.isExpired
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${passwordExpiryInfo.isExpired ? 'var(--accent-danger)' : '#F59E0B'}`
          }}
        >
          <div style={{ padding: '20px' }}>
            <h4 style={{
              color: passwordExpiryInfo.isExpired ? 'var(--accent-danger)' : '#F59E0B',
              marginBottom: '8px'
            }}>
              {passwordExpiryInfo.isExpired
                ? 'Password Expired!'
                : `Password Expiring Soon (${passwordExpiryInfo.daysRemaining} days)`}
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              {passwordExpiryInfo.isExpired
                ? 'Your password has expired. Please change it immediately.'
                : 'Your password will expire soon. Please change it to maintain access.'}
            </p>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Change Password</h3>
          {passwordExpiryInfo && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Last changed: {formatDate(passwordExpiryInfo.changedAt)}
              {' | '}
              Expires: {formatDate(passwordExpiryInfo.expiresAt)}
            </span>
          )}
        </div>
        <div style={{ padding: '20px', maxWidth: '400px' }}>
          {message && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              {message}
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                placeholder="Minimum 12 characters"
                required
                autoComplete="new-password"
              />
            </div>

            {newPassword && passwordStrength.length > 0 && (
              <div className="password-requirements" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-danger)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <p style={{ marginBottom: '8px', fontWeight: 500 }}>Password must have:</p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {passwordStrength.map((req, i) => (
                    <li key={i} style={{ color: 'var(--accent-danger)' }}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {newPassword && passwordStrength.length === 0 && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                Password meets all requirements
              </div>
            )}

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '16px' }}>
            For security, passwords must be changed every 6 months.
            You will be logged out after changing your password.
          </p>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      {user && (
        <div className="chart-container" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Two-Factor Authentication</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <TwoFactorSetup
              userId={user.id}
              email={user.email}
              onComplete={() => {
                // Refresh to update 2FA status
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Security Audit Log */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Security Audit Log</h3>
          <button
            className="btn btn-secondary"
            onClick={loadAuditLogs}
            disabled={loadingLogs}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {loadingLogs ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No audit logs available</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-secondary)' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-secondary)' }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-secondary)' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          color: getActionColor(log.action),
                          fontWeight: 500
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {String(log.details?.email || log.details?.userId || '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Security Info */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Security Information</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <h4 style={{ marginBottom: '8px' }}>Password Policy</h4>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0 }}>
                <li>Minimum 12 characters</li>
                <li>At least one uppercase and lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
                <li>Must be changed every 6 months</li>
                <li>Cannot reuse the same password</li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: '8px' }}>Account Security</h4>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0 }}>
                <li>Account locks after 5 failed login attempts</li>
                <li>Lockout duration: 30 minutes</li>
                <li>Sessions expire after 8 hours of inactivity</li>
                <li>All login attempts are logged</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
