'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.success && res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setMsg({ text: 'Settings saved successfully!', type: 'success' });
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Saving settings failed.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-gear"></i> Canteen Configuration
          </h1>
          <p className="admin-subheading">Tax rate calculations, order token format, and payment identifiers</p>
        </div>
      </div>

      <div className="settings-card-wrapper mt-4">
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-settings-form">
            {msg && (
              <div className={`alert alert-${msg.type} mb-4`}>
                {msg.text}
              </div>
            )}

            <div className="settings-section">
              <h3 className="settings-section-title">
                <i className="fa-solid fa-calculator"></i> Billing & Currency
              </h3>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">GST Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={settings.tax_percent || '5'}
                    onChange={(e) => handleChange('tax_percent', e.target.value)}
                    required
                  />
                  <small className="form-text text-muted">Applied to all orders server-side at checkout.</small>
                </div>

                <div className="form-group form-col">
                  <label className="form-label">Currency Symbol</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.currency_symbol || '₹'}
                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">Order Token Prefix</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.order_prefix || 'CB'}
                    onChange={(e) => handleChange('order_prefix', e.target.value)}
                    required
                  />
                  <small className="form-text text-muted">Prefix for generated tokens (e.g. CB2610210001).</small>
                </div>

                <div className="form-group form-col">
                  <label className="form-label">Demonstration UPI VPA</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.upi_id || 'campusbite@upi'}
                    onChange={(e) => handleChange('upi_id', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="settings-actions mt-4">
              <button type="submit" className="btn btn-accent btn-lg" disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

