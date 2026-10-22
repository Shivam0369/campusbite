'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useCart } from '@/lib/cart-context';

const LIFECYCLE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: 'fa-receipt' },
  { key: 'accepted', label: 'Order Accepted', icon: 'fa-thumbs-up' },
  { key: 'preparing', label: 'Preparing Food', icon: 'fa-fire-burner' },
  { key: 'ready', label: 'Ready for Collection', icon: 'fa-bell' },
  { key: 'collected', label: 'Collected', icon: 'fa-check' },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);
  const { refreshCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await api.getOrder(orderId);
      if (res.success && res.data?.order) {
        setOrder(res.data.order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // 8-second polling loop
    const interval = setInterval(async () => {
      if (!orderId) return;
      try {
        const pollRes = await api.getOrderStatus(orderId);
        if (pollRes.success && pollRes.data) {
          setOrder((prev) => {
            if (!prev) return prev;
            if (
              prev.order_status !== pollRes.data.order_status ||
              prev.payment_status !== pollRes.data.payment_status
            ) {
              return {
                ...prev,
                order_status: pollRes.data.order_status,
                payment_status: pollRes.data.payment_status,
              };
            }
            return prev;
          });
        }
      } catch (e) {
        // Polling error ignored
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleReorder = async () => {
    if (!orderId) return;
    setReordering(true);
    try {
      const res = await api.reorder(orderId);
      if (res.success) {
        await refreshCart();
        router.push('/cart');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reorder items.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
        <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-error mb-4" style={{ maxWidth: '500px', margin: '0 auto 20px', padding: '14px', borderRadius: '8px' }}>
          {error || 'Order not found.'}
        </div>
        <Link href="/my-orders" className="btn btn-accent" style={{ color: 'white', padding: '10px 24px', textDecoration: 'none' }}>
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';
  const isCancelled = order.order_status === 'cancelled';
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === order.order_status);

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '24px 0 60px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Top Back Link matching Image 3 */}
        <div style={{ marginBottom: '18px' }}>
          <Link
            href="/my-orders"
            style={{
              borderRadius: '8px',
              border: '1.5px solid #2C2C2C',
              background: 'white',
              color: '#2C2C2C',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '8px 16px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            &larr; Back to My Orders
          </Link>
        </div>

        {/* Top Details Card matching Image 3 */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              ORDER DETAILS
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                margin: '0 0 6px 0',
              }}
            >
              #{order.order_number}
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              <i className="fa-regular fa-clock" style={{ marginRight: '6px' }}></i>
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background:
                    order.order_status === 'collected'
                      ? '#e2e8f0'
                      : order.order_status === 'ready'
                      ? '#dcfce7'
                      : order.order_status === 'preparing'
                      ? '#fef3c7'
                      : '#e0f2fe',
                  color:
                    order.order_status === 'collected'
                      ? '#475569'
                      : order.order_status === 'ready'
                      ? '#15803d'
                      : order.order_status === 'preparing'
                      ? '#b45309'
                      : '#0369a1',
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

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--color-text)',
              }}
            >
              ₹{Number(order.total_amount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 5-Step Order Progress Card matching Image 3 */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '28px',
              color: 'var(--color-text)',
            }}
          >
            <i className="fa-solid fa-bars-progress" style={{ color: 'var(--color-accent)' }}></i> Order Progress
          </h2>

          {isCancelled ? (
            <div className="alert alert-error" style={{ padding: '12px', borderRadius: '8px' }}>
              <i className="fa-solid fa-ban"></i> This order was cancelled.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Connecting line behind circles */}
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '10%',
                  right: '10%',
                  height: '4px',
                  background: '#f1f5f9',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '10%',
                  width: `${Math.min(100, Math.max(0, (currentStepIndex / (LIFECYCLE_STEPS.length - 1)) * 80))}%`,
                  height: '4px',
                  background: 'var(--color-accent)',
                  zIndex: 0,
                  transition: 'width 0.4s ease',
                }}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isPassed = currentStepIndex >= idx;

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: isPassed ? 'var(--color-accent)' : '#f1f5f9',
                          color: isPassed ? 'white' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          marginBottom: '10px',
                          boxShadow: isPassed ? '0 2px 6px rgba(231, 111, 81, 0.3)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <i className={`fa-solid ${step.icon}`}></i>
                      </div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isPassed ? 700 : 500,
                          color: isPassed ? 'var(--color-text)' : '#94a3b8',
                          lineHeight: 1.3,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Section matching Image 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Left Column: Items Ordered */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
                color: 'var(--color-text)',
              }}
            >
              <i className="fa-solid fa-basket-shopping" style={{ color: 'var(--color-accent)' }}></i> Items Ordered
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                      {item.item_name_snapshot}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      ₹{Number(item.unit_price).toFixed(2)} &times; {item.quantity}
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                    ₹{Number(item.line_total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Summary */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
                color: 'var(--color-text)',
              }}
            >
              <i className="fa-solid fa-receipt" style={{ color: 'var(--color-accent)' }}></i> Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                <span>GST / Taxes</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₹{Number(order.tax_amount).toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1.5px solid var(--color-border-light)',
                  marginTop: '6px',
                  paddingTop: '12px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--color-text)',
                }}
              >
                <span>Total Paid</span>
                <span style={{ color: 'var(--color-text)' }}>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {order.payment_method === 'cash' ? (
                      <>
                        <i className="fa-solid fa-money-bill-wave" style={{ color: '#16a34a' }}></i> Cash at Counter
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-mobile-screen" style={{ color: '#0284c7' }}></i> UPI Payment
                      </>
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Payment Status:</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      background: isPaid ? '#dcfce7' : '#fef3c7',
                      color: isPaid ? '#15803d' : '#a16207',
                    }}
                  >
                    {isPaid ? 'PAID' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={reordering}
                  onClick={handleReorder}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: reordering ? 'not-allowed' : 'pointer',
                  }}
                >
                  <i className="fa-solid fa-rotate-right"></i> {reordering ? 'Adding to Cart...' : 'Reorder All Items'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <Link
                    href="/menu"
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-utensils"></i> Browse More Food
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
