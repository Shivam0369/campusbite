'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      if (user.role === 'customer') {
        fetchOrders();
      }
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await api.getMyOrders();
      if (res.success && res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined });
      if (res.success) {
        await refreshUser();
        setProfileMsg({ text: 'Profile details updated successfully.', type: 'success' });
      }
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Update failed.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      if (res.success) {
        setPasswordMsg({ text: 'Password updated successfully.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Password update failed.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  const totalSpent = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const collectedOrders = orders.filter((o) => o.order_status === 'collected').length;

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container">
        {/* Header matching media_1792610960869_17164da2.png */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            <i className="fa-solid fa-circle-user" style={{ color: 'var(--color-accent)' }}></i> My Profile
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Manage your account details and security settings.
          </p>
        </div>

        {/* 3 Top Stats Cards (if customer) */}
        {user.role === 'customer' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(231, 111, 81, 0.12)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.5px',
                  }}
                >
                  TOTAL ORDERS
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                  }}
                >
                  {orders.length}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(45, 106, 79, 0.12)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                <i className="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.5px',
                  }}
                >
                  TOTAL SPENT
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                  }}
                >
                  ₹{totalSpent.toFixed(2)}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.5px',
                  }}
                >
                  COLLECTED ORDERS
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                  }}
                >
                  {collectedOrders}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2 Forms Grid matching media_1792610960869_17164da2.png */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Form: Personal Details */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <i className="fa-solid fa-id-card" style={{ color: 'var(--color-accent)' }}></i> Personal Details
            </h3>

            {profileMsg && (
              <div className={`alert alert-${profileMsg.type}`} style={{ marginBottom: '16px' }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={user.username}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Username cannot be changed.
                </span>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={user.email}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Contact administrator to change registered email.
                </span>
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '18px' }}>
                Member since: {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              <button
                type="submit"
                className="btn btn-accent btn-block"
                disabled={savingProfile}
                style={{ borderRadius: 'var(--radius-sm)', padding: '12px' }}
              >
                {savingProfile ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i> Save Profile Details
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Form: Security & Password */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <i className="fa-solid fa-lock" style={{ color: 'var(--color-accent)' }}></i> Security &amp; Password
            </h3>

            {passwordMsg && (
              <div className={`alert alert-${passwordMsg.type}`} style={{ marginBottom: '16px' }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Minimum 6 characters.
                </span>
              </div>

              <div className="form-group">
                <label>
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={savingPassword}
                style={{
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginTop: '28px',
                }}
              >
                {savingPassword ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Updating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i> Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
