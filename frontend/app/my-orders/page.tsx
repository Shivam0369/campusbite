'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const res = await api.cancelOrder(orderId);
      if (res.success) {
        alert(res.message);
        await fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Header matching media_1792610935479_4ab07fba.png */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
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
            <i className="fa-solid fa-receipt" style={{ color: 'var(--color-accent)' }}></i> My Orders
          </h1>

          <Link
            href="/menu"
            className="btn btn-accent btn-sm"
            style={{
              borderRadius: 'var(--radius-sm)',
              padding: '8px 18px',
              color: 'white',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-plus"></i> New Order
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
            <p className="mt-3">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            className="card text-center py-5"
            style={{ padding: '60px 20px', borderRadius: 'var(--radius-lg)' }}
          >
            <div style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '16px' }}>
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px' }}>No Orders Yet</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              You haven&apos;t placed any canteen orders yet.
            </p>
            <div>
              <Link href="/menu" className="btn btn-accent btn-sm" style={{ padding: '10px 24px', color: 'white' }}>
                Browse Food Menu
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const isPaid = order.payment_status === 'paid';
              const canCancel = order.order_status === 'placed';

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--color-text)',
                      }}
                    >
                      #{order.order_number}
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background:
                            order.order_status === 'collected'
                              ? '#e2e8f0'
                              : order.order_status === 'ready'
                              ? '#dcfce7'
                              : '#dbeafe',
                          color:
                            order.order_status === 'collected'
                              ? '#475569'
                              : order.order_status === 'ready'
                              ? '#15803d'
                              : '#1d4ed8',
                        }}
                      >
                        {order.order_status.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: isPaid ? 'rgba(45, 106, 79, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                          color: isPaid ? '#15803d' : '#a16207',
                        }}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body - Line items */}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.92rem',
                          }}
                        >
                          <span style={{ color: 'var(--color-text)' }}>
                            {item.item_name_snapshot} &times; {item.quantity}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                            ₹{Number(item.line_total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      padding: '14px 20px',
                      borderTop: '1px solid var(--color-border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fcfcfc',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: 'var(--color-text)',
                          marginTop: '2px',
                        }}
                      >
                        ₹{Number(order.total_amount).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {canCancel && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      <Link
                        href={`/order-details/${order.id}`}
                        className="btn btn-outline-dark btn-sm"
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--color-border)',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          padding: '6px 16px',
                        }}
                      >
                        <i className="fa-regular fa-eye"></i> Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
