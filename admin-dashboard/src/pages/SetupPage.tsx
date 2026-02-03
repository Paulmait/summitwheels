import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdminUser } from '../services/supabase';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        await createAdminUser(email, password, name);
        navigate('/login');
      } catch (err: any) {
        setError(err.message || 'Failed to create admin account');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-box">
        <div className="login-logo">
          <h1>Summit Wheels</h1>
          <p>Admin Setup</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="setup-step">
              <h3>
                <span className="step-number">1</span>
                Your Name
              </h3>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="setup-step">
              <h3>
                <span className="step-number">2</span>
                Email Address
              </h3>
              <div className="form-group">
                <label htmlFor="email">Admin Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@summitwheels.app"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="setup-step">
              <h3>
                <span className="step-number">3</span>
                Set Password
              </h3>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
                style={{ flex: 1 }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Creating...' : step === 3 ? 'Create Account' : 'Continue'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Step {step} of 3
        </div>
      </div>
    </div>
  );
}
