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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return { background: '#dcfce7', color: '#15803d' };
      case 'collected':
        return { background: '#e2e8f0', color: '#475569' };
      case 'preparing':
        return { background: '#fef3c7', color: '#b45309' };
      case 'accepted':
        return { background: '#e0f2fe', color: '#0369a1' };
      case 'cancelled':
        return { background: '#fee2e2', color: '#b91c1c' };
      default:
        return { background: '#f1f5f9', color: '#334155' };
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        {/* Header matching Image 5 */}
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
              fontSize: '1.75rem',
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
              padding: '10px 22px',
              color: 'white',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
            }}
          >
            <i className="fa-solid fa-plus"></i> New Order
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
            <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            className="card text-center py-5"
            style={{ padding: '60px 20px', borderRadius: 'var(--radius-lg)', background: 'white' }}
          >
            <div style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '16px' }}>
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px' }}>No Orders Yet</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              You haven&apos;t placed any canteen orders yet.
            </p>
            <div>
              <Link href="/menu" className="btn btn-accent btn-sm" style={{ padding: '10px 24px', color: 'white', fontWeight: 600 }}>
                Browse Food Menu
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => {
              const isPaid = order.payment_status === 'paid';
              const statusStyle = getStatusBadgeStyle(order.order_status);

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Top row: Order Number and Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
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
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          ...statusStyle,
                        }}
                      >
                        {order.order_status.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: isPaid ? '#dcfce7' : '#fef3c7',
                          color: isPaid ? '#15803d' : '#a16207',
                        }}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Items summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.95rem',
                        }}
                      >
                        <span style={{ color: 'var(--color-text)' }}>
                          {item.item_name_snapshot} &times; {item.quantity}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                          ₹{Number(item.line_total).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row: Date & Total on left, Details button on right */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: '6px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
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
                        }}
                      >
                        ₹{Number(order.total_amount).toFixed(2)}
                      </div>
                    </div>

                    <Link
                      href={`/order-details/${order.id}`}
                      className="btn btn-outline-dark btn-sm"
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 18px',
                        border: '1.5px solid var(--color-border)',
                        background: 'white',
                        color: 'var(--color-text)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      <i className="fa-regular fa-eye"></i> Details
                    </Link>
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
