'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login({ identifier: identifier.trim(), password });
    } catch (err: any) {
      setError(err.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--color-primary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              margin: '0 auto 16px',
              fontSize: '1.25rem',
            }}
          >
            <i className="fa-solid fa-utensils"></i>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your CampusBite account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">
              Username or Email <span className="required">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              className="form-control"
              placeholder="Enter username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-toggle">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '8px',
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Signing In...
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '8px' }}></i> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--color-accent)' }}>
            Create one
          </Link>
        </div>

        {/* Demo Accounts Pill Box */}
        <div
          style={{
            background: '#f5f0e8',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '24px',
            fontSize: '0.85rem',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: '10px',
              color: '#2c2c2c',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-circle-info"></i> Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', rowGap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#6b6b6b' }}>Customer:</span>
            <span
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
              title="Click to fill"
              onClick={() => fillDemo('rahul', 'Demo@123')}
            >
              rahul / Demo@123
            </span>

            <span style={{ fontWeight: 600, color: '#6b6b6b' }}>Staff:</span>
            <span
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
              title="Click to fill"
              onClick={() => fillDemo('staff', 'Staff@123')}
            >
              staff / Staff@123
            </span>

            <span style={{ fontWeight: 600, color: '#6b6b6b' }}>Admin:</span>
            <span
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
              title="Click to fill"
              onClick={() => fillDemo('admin', 'Admin@123')}
            >
              admin / Admin@123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
