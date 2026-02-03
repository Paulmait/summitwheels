import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import supabase from '../services/supabase';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase config
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('supabase_key') || ''
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Simple hash function
      const hashPassword = (password: string) => {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
          const char = password.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
      };

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ password_hash: hashPassword(newPassword) })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const saveSupabaseConfig = () => {
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    setMessage('Supabase configuration saved. Please refresh the page.');
  };

  return (
    <DashboardLayout title="Settings">
      {/* Profile Section */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Profile</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
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

      {/* Change Password Section */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Change Password</h3>
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
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Supabase Configuration */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Database Configuration</h3>
        </div>
        <div style={{ padding: '20px', maxWidth: '600px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Configure your Supabase database connection. Get these values from your Supabase
            project settings.
          </p>

          <div className="form-group">
            <label>Supabase URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>

          <div className="form-group">
            <label>Supabase Anon Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Your Supabase anon key"
            />
          </div>

          <button className="btn btn-primary" onClick={saveSupabaseConfig}>
            Save Configuration
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Data Management</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px' }}>Export All Data</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Download all analytics data as a JSON file for backup or analysis.
            </p>
            <button className="btn btn-secondary">Export Data</button>
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', color: 'var(--accent-danger)' }}>Danger Zone</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Permanently delete all analytics data. This action cannot be undone.
            </p>
            <button className="btn btn-danger">Delete All Data</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
