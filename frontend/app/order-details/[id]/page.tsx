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
      <div className="container py-5 text-center">
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-error">{error || 'Order not found.'}</div>
        <Link href="/my-orders" className="btn btn-accent mt-3">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';
  const isCancelled = order.order_status === 'cancelled';
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === order.order_status);

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Back Link matching media_1792610950843_da66e02a.png */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/my-orders"
            className="btn btn-outline-dark btn-sm"
            style={{
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'white',
              color: 'var(--color-text)',
              fontWeight: 600,
              padding: '6px 14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            &larr; Back to My Orders
          </Link>
        </div>

        {/* Top Details Card */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
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
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.6px',
              }}
            >
              ORDER DETAILS
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                margin: '4px 0 2px',
              }}
            >
              #{order.order_number}
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
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

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--color-text)',
              }}
            >
              ₹{Number(order.total_amount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 5-Step Progress Card matching media_1792610950843_da66e02a.png */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
              color: 'var(--color-text)',
            }}
          >
            <i className="fa-solid fa-bars-progress" style={{ color: 'var(--color-accent)' }}></i> Order Progress
          </h2>

          {isCancelled ? (
            <div className="alert alert-error">
              <i className="fa-solid fa-ban"></i> This order was cancelled.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: isPassed ? 'var(--color-accent)' : '#f1f5f9',
                        color: isPassed ? 'white' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        marginBottom: '10px',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(231, 111, 81, 0.2)' : 'none',
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
          )}
        </div>

        {/* 2 Column Details matching media_1792610950843_da66e02a.png */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left: Items Ordered */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
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
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                      {item.item_name_snapshot}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      ₹{Number(item.unit_price).toFixed(2)} &times; {item.quantity}
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                    ₹{Number(item.line_total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
                color: 'var(--color-text)',
              }}
            >
              <i className="fa-solid fa-file-invoice" style={{ color: 'var(--color-accent)' }}></i> Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>GST / Taxes</span>
                <span style={{ fontWeight: 600 }}>₹{Number(order.tax_amount).toFixed(2)}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border-light)', margin: '8px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>Total Paid</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>
                  ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border-light)', margin: '8px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Method:</span>
                <span style={{ fontWeight: 600 }}>
                  <i className="fa-solid fa-money-bill-wave" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                  {order.payment_method === 'cash' ? 'Cash at Counter' : order.payment_method.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Status:</span>
                <span
                  style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: isPaid ? 'rgba(45, 106, 79, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                    color: isPaid ? '#15803d' : '#a16207',
                    fontSize: '0.75rem',
                  }}
                >
                  {isPaid ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn-accent btn-block"
                disabled={reordering}
                onClick={handleReorder}
                style={{ borderRadius: 'var(--radius-sm)', padding: '12px', fontWeight: 600 }}
              >
                {reordering ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Reordering...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i> Reorder All Items
                  </>
                )}
              </button>

              <Link
                href="/menu"
                className="btn btn-outline-dark btn-block"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  padding: '10px',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                <i className="fa-solid fa-utensils" style={{ marginRight: '6px' }}></i> Browse More Food
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
