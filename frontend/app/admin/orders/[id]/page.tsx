'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [markPaid, setMarkPaid] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.getOrderDetails(orderId);
      if (res.success && res.data) {
        setOrder(res.data.order);
        setNewStatus(res.data.order.order_status);
        setMarkPaid(res.data.order.payment_status === 'paid');
      }
    } catch (e: any) {
      console.error(e);
      setMsg({ text: e.message || 'Failed to load order.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await api.overrideOrderStatus(order.id, {
        new_status: newStatus,
        payment_status: markPaid ? 'paid' : order.payment_status,
        notes: adminNotes.trim() || undefined,
      });
      if (res.success) {
        setMsg({ text: res.message || 'Order status updated successfully!', type: 'success' });
        await fetchOrder();
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to update order status.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
        <p className="mt-3" style={{ color: '#64748b', fontWeight: 600 }}>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Order Not Found</h2>
        <Link href="/admin/orders" className="btn btn-primary mt-3">Back to Orders</Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';

  return (
    <div>
      {/* Top action row */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link
          href="/admin/orders"
          style={{
            padding: '7px 16px',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1.5px solid #2C2C2C',
            background: 'white',
            color: '#2C2C2C',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Orders List
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: order.order_status === 'collected' ? '#e2e8f0' : order.order_status === 'ready' ? '#dcfce7' : '#e0f2fe',
              color: order.order_status === 'collected' ? '#475569' : order.order_status === 'ready' ? '#15803d' : '#0369a1',
            }}
          >
            {order.order_status.toUpperCase()}
          </span>

          <span
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: isPaid ? '#dcfce7' : '#fef3c7',
              color: isPaid ? '#15803d' : '#a16207',
            }}
          >
            {isPaid ? 'PAID' : 'PENDING'}
          </span>
        </div>
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
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Header Card */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
              ORDER CONTROL
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                margin: '4px 0 8px',
              }}
            >
              #{order.order_number}
            </h1>
            <div style={{ fontSize: '0.92rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-user"></i>
              <strong style={{ color: '#1e293b' }}>{order.customer_name_snapshot}</strong>
              <span>&bull;</span>
              <span>{order.customer_phone_snapshot || 'rahul@college.edu'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Amount</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
              ₹{Number(order.total_amount).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Payment: <strong style={{ color: '#1e293b' }}>{order.payment_method.toUpperCase()}</strong> ({isPaid ? 'Paid' : 'Pending'})
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
        }}
      >
        {/* Left Column: Items Ordered & Audit Trail */}
        <div>
          {/* Order Items Table Card */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                <i className="fa-solid fa-utensils"></i> Items Ordered
              </h3>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Item</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#1e293b' }}>
                      {it.item_name_snapshot}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>
                      {it.quantity}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#64748b' }}>
                      ₹{Number(it.unit_price).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                      ₹{Number(it.line_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '10px 18px 4px', textAlign: 'right', color: '#64748b' }}>Subtotal:</td>
                  <td style={{ padding: '10px 18px 4px', textAlign: 'right', fontWeight: 600 }}>₹{Number(order.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ padding: '4px 18px', textAlign: 'right', color: '#64748b' }}>Tax:</td>
                  <td style={{ padding: '4px 18px', textAlign: 'right', fontWeight: 600 }}>₹{Number(order.tax_amount).toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={3} style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Grand Total:</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Status Audit History Card */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-timeline"></i> Status Audit History
            </h3>

            {!order.status_history || order.status_history.length === 0 ? (
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>No transitions recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {order.status_history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      paddingLeft: '14px',
                      borderLeft: '3px solid var(--color-accent)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <strong style={{ color: '#1e293b' }}>
                        {h.old_status ? h.old_status.toUpperCase() : 'NONE'} &rarr; {h.new_status.toUpperCase()}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {new Date(h.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      By: {h.changed_by_name || 'System / Staff'}
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>
                        &ldquo;{h.notes}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status Override & Timestamps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Admin Status Override Card */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-sliders"></i> Admin Status Override
            </h3>

            <form onSubmit={handleStatusUpdate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Current Status
                </label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: order.order_status === 'collected' ? '#e2e8f0' : order.order_status === 'ready' ? '#dcfce7' : '#e0f2fe',
                    color: order.order_status === 'collected' ? '#475569' : order.order_status === 'ready' ? '#15803d' : '#0369a1',
                    display: 'inline-block',
                  }}
                >
                  {order.order_status.toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="new_status" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Transition To:
                </label>
                <select
                  id="new_status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  required
                >
                  <option value="placed">Placed</option>
                  <option value="accepted">Accepted</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready for Collection</option>
                  <option value="collected">Collected (Complete)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {!isPaid && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={markPaid}
                      onChange={(e) => setMarkPaid(e.target.checked)}
                    />
                    Mark Payment as Paid
                  </label>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="admin_notes" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Admin Notes
                </label>
                <textarea
                  id="admin_notes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified by Admin"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-accent)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Updating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i> Update Order Status
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Timestamps Card */}
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-regular fa-clock"></i> Timestamps
            </h4>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Placed:</span>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                  {new Date(order.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {order.collected_at && (
                <div>
                  <span style={{ color: '#64748b' }}>Collected:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {new Date(order.collected_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b' }}>Last Updated:</span>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                  {new Date(order.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

