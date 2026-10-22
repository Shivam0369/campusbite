'use client';

import React, { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Confirmation Modal state
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(roleFilter !== 'all' ? roleFilter : undefined);
      if (res.success) setUsers(res.data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmUser) return;
    setToggleLoading(true);
    try {
      const res = await api.toggleUserActive(confirmUser.id);
      if (res.success) {
        setConfirmUser(null);
        await fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await api.createAdminUser(createForm);
      if (res.success) {
        setShowCreateModal(false);
        setCreateForm({
          full_name: '',
          username: '',
          email: '',
          phone: '',
          password: '',
          role: 'staff',
        });
        await fetchUsers();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(term);
      const matchUser = u.username?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      if (!matchName && !matchUser && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fa-solid fa-users" style={{ color: 'var(--color-accent)' }}></i> User Management
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Manage registered college students, kitchen staff, and administrators.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-plus"></i> Add User / Staff
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.8fr) minmax(200px, 1.2fr) auto',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />

          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Roles (Students, Staff, Admins)</option>
            <option value="customer">Students / Customers</option>
            <option value="staff">Kitchen Staff</option>
            <option value="admin">Administrators</option>
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              style={{
                background: '#1B4332',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 20px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-filter"></i> Filter
            </button>
            <button
              type="button"
              onClick={() => { setSearch(''); setRoleFilter('all'); }}
              title="Reset Filters"
              style={{
                background: 'white',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '9px 12px',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>User</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Username</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Contact</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Role</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Orders</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Joined</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
                    <p className="mt-2" style={{ margin: '8px 0 0' }}>Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                    No users found matching filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isActive = u.is_active === 1;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Avatar & Name */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#0f172a',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '12px 18px', color: '#475569', fontWeight: 500 }}>
                        {u.username}
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '12px 18px', color: '#64748b', fontSize: '0.85rem' }}>
                        {u.phone || '—'}
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: u.role === 'customer' ? '#e0f2fe' : '#f1f5f9',
                            color: u.role === 'customer' ? '#0369a1' : '#1e293b',
                          }}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Orders */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {u.role === 'customer' ? (
                          <div>
                            <strong style={{ color: '#1e293b' }}>5</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>₹1,144.50</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            background: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        {isCurrent ? (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>(You)</span>
                        ) : (
                          <button
                            onClick={() => setConfirmUser(u)}
                            style={{
                              padding: '4px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              background: '#ffffff',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <i className="fa-solid fa-ban" style={{ fontSize: '0.75rem' }}></i> Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '12px' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
              Confirm Account Deactivation
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to deactivate account <strong>{confirmUser.full_name}</strong> ({confirmUser.username})? The user will immediately be barred from signing in.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setConfirmUser(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle}
                disabled={toggleLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: toggleLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {toggleLoading ? 'Processing...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b', fontFamily: 'var(--font-display)' }}>
                Add User / Staff
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'none', fontSize: '1.5rem', lineHeight: 1, color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px' }}>
              {createError && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {createError}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="staff">Kitchen Staff</option>
                    <option value="customer">Student / Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: createLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
