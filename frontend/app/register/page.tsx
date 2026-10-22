'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.full_name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(formData);
      if (res.success) {
        await refreshUser();
        router.push('/menu');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
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
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h2>Create Account</h2>
          <p>Register as a student for fast counter pickup</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="form-control"
              placeholder="e.g. Priya Patel"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="form-control"
                placeholder="priyap"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Mobile (10 digits)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              College Email <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="priya@college.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">
                Confirm <span className="required">*</span>
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                className="form-control"
                placeholder="••••••"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '12px',
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Creating Account...
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-plus" style={{ marginRight: '8px' }}></i> Create Free Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-accent)' }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
