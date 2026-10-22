'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    canteen_name: 'CampusBite',
    order_prefix: 'CB',
    currency_symbol: '₹',
    tax_percent: '5',
    cancellation_cutoff: 'accepted',
    canteen_upi: 'campusbite@upi',
    show_upi_qr: '1',
  });
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
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
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
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: '0 0 6px',
            color: 'var(--color-text)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <i className="fa-solid fa-gear" style={{ color: 'var(--color-accent)' }}></i> System Settings
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
          Configure canteen parameters, tax rates, currency, and payment options.
        </p>
      </div>

      {msg && (
        <div
          style={{
            background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msg.type === 'success' ? '#15803d' : '#b91c1c',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
          <p className="mt-3" style={{ color: '#64748b' }}>Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Card 1: General & Branding */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-sliders" style={{ color: '#64748b' }}></i> General & Branding
            </h3>

            {/* Canteen Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                Canteen / System Name
              </label>
              <input
                type="text"
                required
                value={settings.canteen_name || 'CampusBite'}
                onChange={(e) => handleChange('canteen_name', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Shown on navigation bar and page headers.
              </span>
            </div>

            {/* Row: Order Number Prefix & Currency Symbol */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                  Order Number Prefix
                </label>
                <input
                  type="text"
                  required
                  value={settings.order_prefix || 'CB'}
                  onChange={(e) => handleChange('order_prefix', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  e.g. &apos;CB&apos; produces #CB2610110001
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  value={settings.currency_symbol || '₹'}
                  onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* GST / Tax Percentage */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                GST / Tax Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.tax_percent || '5'}
                onChange={(e) => handleChange('tax_percent', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Default canteen GST percentage applied at checkout.
              </span>
            </div>
          </div>

          {/* Card 2: Order Workflow Rules */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-code-branch" style={{ color: '#64748b' }}></i> Order Workflow Rules
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                Customer Can Cancel Until:
              </label>
              <select
                value={settings.cancellation_cutoff || 'accepted'}
                onChange={(e) => handleChange('cancellation_cutoff', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="accepted">Kitchen Accepts Order (Recommended)</option>
                <option value="preparing">Until Food Preparation Starts</option>
                <option value="never">Never Allow Cancellation</option>
              </select>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Once kitchen enters this status or later, customer cannot cancel.
              </span>
            </div>
          </div>

          {/* Card 3: UPI & Payment Options */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-qrcode" style={{ color: '#64748b' }}></i> UPI & Payment Options
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                Canteen UPI ID / VPA
              </label>
              <input
                type="text"
                value={settings.canteen_upi || 'campusbite@upi'}
                onChange={(e) => handleChange('canteen_upi', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Used for generating UPI QR codes and payment demonstration.
              </span>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '3px' }}
                  checked={settings.show_upi_qr === '1'}
                  onChange={(e) => handleChange('show_upi_qr', e.target.checked ? '1' : '0')}
                />
                <div>
                  <span>Show Demonstration UPI QR Code on Checkout</span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 400, display: 'block', marginTop: '2px' }}>
                    Displays dynamic UPI payment details and QR code for college project demonstration.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 26px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-accent)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
