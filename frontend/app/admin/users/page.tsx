'use client';

import React, { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
        alert(res.message);
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

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-users"></i> Users & Staff Management
          </h1>
          <p className="admin-subheading">Manage student logins, staff credentials, and security deactivations</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowCreateModal(true)}>
          <i className="fa-solid fa-user-plus"></i> Add User / Staff
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="admin-toolbar-card mt-3">
        <div className="role-filter-pills">
          {['all', 'customer', 'staff', 'admin'].map((r) => (
            <button
              key={r}
              className={`role-pill ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All Roles' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-card mt-4">
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Loading users...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Security Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = u.is_active === 1;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-name-cell">
                          <span className="user-avatar-initial">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{u.full_name}</strong>
                            {u.phone && <div className="text-muted small">{u.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td><code>{u.username}</code></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge-pill badge-role-${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-pill ${isActive ? 'badge-active' : 'badge-suspended'}`}>
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => setConfirmUser(u)}
                        >
                          <i className={`fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'}`}></i>{' '}
                          {isActive ? 'Deactivate' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className={`modal-icon-circle ${confirmUser.is_active === 1 ? 'danger' : 'success'}`}>
              <i className={`fa-solid ${confirmUser.is_active === 1 ? 'fa-user-slash' : 'fa-user-check'}`}></i>
            </div>
            <h3 className="modal-title">
              {confirmUser.is_active === 1 ? 'Deactivate User Account?' : 'Reactivate User Account?'}
            </h3>

            {confirmUser.is_active === 1 ? (
              <div className="alert alert-danger mt-3">
                <i className="fa-solid fa-triangle-exclamation"></i> <strong>Security Invariant:</strong> Suspending <strong>{confirmUser.full_name} ({confirmUser.username})</strong> will immediately terminate their active session on their next interaction.
              </div>
            ) : (
              <p className="modal-desc mt-2">
                This will restore login privileges for <strong>{confirmUser.full_name}</strong>.
              </p>
            )}

            <div className="modal-actions mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                className={`btn ${confirmUser.is_active === 1 ? 'btn-danger' : 'btn-success'}`}
                disabled={toggleLoading}
                onClick={handleConfirmToggle}
              >
                {toggleLoading ? 'Processing...' : confirmUser.is_active === 1 ? 'Confirm Deactivation' : 'Confirm Restoration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create New User / Staff</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {createError && <div className="alert alert-danger mt-2">{createError}</div>}

            <form onSubmit={handleCreateSubmit} className="mt-3">
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Suresh Kumar"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="sureshk"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group form-col">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="customer">Student / Customer</option>
                    <option value="staff">Kitchen Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="suresh@campusbite.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group form-col">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={createLoading}>
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

