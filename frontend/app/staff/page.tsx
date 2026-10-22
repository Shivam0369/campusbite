'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, KitchenOrderCard } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function KitchenDisplayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [allOrders, setAllOrders] = useState<KitchenOrderCard[]>([]);
  const [filter, setFilter] = useState<'active' | 'placed' | 'preparing' | 'ready' | 'collected_today'>('active');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const prevOrderCountRef = useRef<number>(0);

  // Web Audio API Synthesized Chime (Invariant #7)
  const playDing = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn('Audio synthesis not allowed before user interaction:', e);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'staff' && user.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch all orders to compute the 5 KPI counts accurately
      const res = await api.getKitchenFeed('all');
      if (res.success && res.orders) {
        if (prevOrderCountRef.current > 0 && res.orders.length > prevOrderCountRef.current) {
          playDing();
        }
        prevOrderCountRef.current = res.orders.length;
        setAllOrders(res.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
      setCountdown(5);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 5-second polling with countdown matching screenshot
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders(true);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTransition = async (orderId: number, newStatus: string, markPaid = false) => {
    setActionLoadingId(orderId);
    try {
      const res = await api.kitchenTransition({
        order_id: orderId,
        new_status: newStatus,
        mark_paid: markPaid,
      });
      if (res.success) {
        await fetchOrders(true);
      }
    } catch (err: any) {
      alert(err.message || 'Transition failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute 5 KPI counts
  const counts = {
    active: allOrders.filter((o) =>
      ['placed', 'accepted', 'preparing', 'ready'].includes(o.order_status)
    ).length,
    placed: allOrders.filter((o) => o.order_status === 'placed').length,
    preparing: allOrders.filter((o) =>
      ['accepted', 'preparing'].includes(o.order_status)
    ).length,
    ready: allOrders.filter((o) => o.order_status === 'ready').length,
    collected_today: allOrders.filter((o) => o.order_status === 'collected').length,
  };

  // Filter orders for display
  const displayedOrders = allOrders.filter((o) => {
    if (filter === 'active') {
      return ['placed', 'accepted', 'preparing', 'ready'].includes(o.order_status);
    }
    if (filter === 'placed') {
      return o.order_status === 'placed';
    }
    if (filter === 'preparing') {
      return ['accepted', 'preparing'].includes(o.order_status);
    }
    if (filter === 'ready') {
      return o.order_status === 'ready';
    }
    if (filter === 'collected_today') {
      return o.order_status === 'collected';
    }
    return true;
  });

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container">
        {/* Header matching media_1792611094223_13f65d86.png */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
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
              <i className="fa-solid fa-fire-burner" style={{ color: 'var(--color-accent)' }}></i>{' '}
              Kitchen &amp; Counter Live Display
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Live order queue. Self-service counter collection management.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  display: 'inline-block',
                }}
              ></span>{' '}
              Auto-refresh: {countdown}s
            </span>

            <button
              className={`btn btn-sm ${soundEnabled ? 'btn-outline-dark' : 'btn-outline-danger'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                background: 'white',
                border: '1.5px solid var(--color-border)',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <i
                className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}
                style={{ marginRight: '6px' }}
              ></i>
              {soundEnabled ? 'Sound ON' : 'Muted'}
            </button>

            <button
              className="btn btn-accent btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '8px 18px',
                color: 'white',
                fontWeight: 600,
              }}
              onClick={() => fetchOrders(true)}
            >
              <i className="fa-solid fa-rotate" style={{ marginRight: '6px' }}></i> Refresh Now
            </button>
          </div>
        </div>

        {/* 5 KPI Filter Cards matching media_1792611094223_13f65d86.png */}
        <div className="kds-kpi-grid">
          <div
            className={`kds-kpi-card ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <div className="kds-kpi-title">ACTIVE ORDERS</div>
            <div className="kds-kpi-value">{counts.active}</div>
          </div>

          <div
            className={`kds-kpi-card ${filter === 'placed' ? 'active' : ''}`}
            onClick={() => setFilter('placed')}
          >
            <div className="kds-kpi-title">NEW (PLACED)</div>
            <div className="kds-kpi-value">{counts.placed}</div>
          </div>

          <div
            className={`kds-kpi-card ${filter === 'preparing' ? 'active' : ''}`}
            onClick={() => setFilter('preparing')}
          >
            <div className="kds-kpi-title">PREPARING</div>
            <div className="kds-kpi-value">{counts.preparing}</div>
          </div>

          <div
            className={`kds-kpi-card ${filter === 'ready' ? 'active' : ''}`}
            onClick={() => setFilter('ready')}
          >
            <div className="kds-kpi-title">READY FOR COLLECTION</div>
            <div className="kds-kpi-value">{counts.ready}</div>
          </div>

          <div
            className={`kds-kpi-card ${filter === 'collected_today' ? 'active' : ''}`}
            onClick={() => setFilter('collected_today')}
          >
            <div className="kds-kpi-title">COLLECTED TODAY</div>
            <div className="kds-kpi-value">{counts.collected_today}</div>
          </div>
        </div>

        {/* Orders Card Grid */}
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
            <p className="mt-3">Loading kitchen feed...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div
            className="card text-center py-5"
            style={{ padding: '50px 20px', borderRadius: 'var(--radius-lg)' }}
          >
            <div style={{ fontSize: '3rem', color: 'var(--color-accent)', marginBottom: '16px' }}>
              <i className="fa-solid fa-kitchen-set"></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Kitchen Queue is Clear</h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              No pending orders in this view. Enjoy the break!
            </p>
          </div>
        ) : (
          <div className="kds-cards-grid">
            {displayedOrders.map((card) => {
              const isUrgent = card.is_urgent;
              const isPlaced = card.order_status === 'placed';
              const isAccepted = card.order_status === 'accepted';
              const isPreparing = card.order_status === 'preparing';
              const isReady = card.order_status === 'ready';
              const isCollected = card.order_status === 'collected';
              const isPaid = card.payment_status === 'paid';

              return (
                <div
                  key={card.id}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {/* Card Header matching media_1792611094223_13f65d86.png */}
                  <div
                    style={{
                      padding: '16px 18px 12px',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: 'var(--color-text)',
                          }}
                        >
                          #{card.order_number}
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-text-secondary)',
                            marginTop: '2px',
                          }}
                        >
                          <i className="fa-solid fa-user" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                          {card.customer_name_snapshot} {card.customer_phone_snapshot && `• ${card.customer_phone_snapshot}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--color-border)',
                            color: isUrgent ? '#dc2626' : 'var(--color-text-secondary)',
                            fontWeight: 600,
                            background: isUrgent ? '#fee2e2' : '#f8fafc',
                          }}
                        >
                          <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                          {card.elapsed_minutes}m ago
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            background: isPaid ? 'rgba(45, 106, 79, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                            color: isPaid ? '#15803d' : '#a16207',
                            border: `1px solid ${isPaid ? '#15803d' : '#a16207'}`,
                          }}
                        >
                          {isPaid ? '✓ PAID' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Lines */}
                  <div style={{ padding: '16px 18px', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {card.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.92rem',
                            gap: '8px',
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--color-text)', minWidth: '24px' }}>
                            {item.quantity}×
                          </span>
                          <span style={{ color: 'var(--color-text)' }}>{item.item_name_snapshot}</span>
                        </div>
                      ))}
                    </div>

                    {/* Customer Notes */}
                    {card.notes && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fef08a',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          color: '#854d0e',
                          marginTop: '14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <i className="fa-solid fa-comment-dots" style={{ marginTop: '2px' }}></i>
                        <div>
                          <strong>Note:</strong> {card.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer matching media_1792611094223_13f65d86.png */}
                  <div
                    style={{
                      padding: '12px 18px',
                      borderTop: '1px solid var(--color-border-light)',
                      background: '#fcfcfc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        fontSize: '0.88rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        Total: {card.total_formatted}
                      </span>
                      <Link
                        href={`/order-details/${card.id}`}
                        style={{
                          color: 'var(--color-accent)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Details &gt;
                      </Link>
                    </div>

                    {/* Transition Actions */}
                    <div>
                      {isPlaced && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={actionLoadingId === card.id}
                            onClick={() => handleTransition(card.id, 'cancelled')}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoadingId === card.id}
                            onClick={() => handleTransition(card.id, 'accepted')}
                          >
                            <i className="fa-solid fa-check"></i> Accept
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <button
                          className="btn btn-accent btn-sm btn-block"
                          disabled={actionLoadingId === card.id}
                          onClick={() => handleTransition(card.id, 'preparing')}
                        >
                          <i className="fa-solid fa-fire-burner"></i> Start Prep
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          className="btn btn-success btn-sm btn-block"
                          disabled={actionLoadingId === card.id}
                          onClick={() => handleTransition(card.id, 'ready')}
                        >
                          <i className="fa-solid fa-bell"></i> Mark Ready
                        </button>
                      )}

                      {isReady && (
                        <button
                          className="btn btn-teal btn-sm btn-block"
                          disabled={actionLoadingId === card.id}
                          onClick={() => handleTransition(card.id, 'collected', true)}
                        >
                          <i className="fa-solid fa-hand-holding"></i> Hand Over &amp; Collect
                        </button>
                      )}

                      {isCollected && (
                        <Link
                          href={`/order-details/${card.id}`}
                          className="btn btn-outline-dark btn-sm btn-block"
                          style={{
                            border: '1.5px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            fontWeight: 600,
                            textAlign: 'center',
                          }}
                        >
                          <i className="fa-solid fa-eye"></i> View Order
                        </Link>
                      )}
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
