'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
        <p className="mt-3" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];
  const revenueChart = data?.revenue_chart || [
    { date: '15 Oct', revenue: 0 },
    { date: '17 Oct', revenue: 0 },
    { date: '19 Oct', revenue: 0 },
    { date: '21 Oct', revenue: 0 },
    { date: '22 Oct', revenue: 0 },
  ];
  const cuisineChart = data?.cuisine_chart?.length
    ? data.cuisine_chart
    : [
        { category: 'Indian', count: 10, color: '#d97706' },
        { category: 'Beverages', count: 3, color: '#0f766e' },
        { category: 'Chinese', count: 3, color: '#3b82f6' },
        { category: 'Desserts', count: 2, color: '#8b5cf6' },
        { category: 'Fast Food', count: 2, color: '#ec4899' },
        { category: 'Snacks', count: 2, color: '#14b8a6' },
      ];

  const cuisineColors = ['#d97706', '#0f766e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Calculate SVG line chart points
  const maxRevenue = Math.max(...revenueChart.map((r: any) => r.revenue), 100);
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const points = revenueChart.map((d: any, idx: number) => {
    const x = paddingX + (idx / Math.max(revenueChart.length - 1, 1)) * innerW;
    const y = chartHeight - paddingY - (d.revenue / maxRevenue) * innerH;
    return { x, y, revenue: d.revenue, date: d.date };
  });

  const pathD = points.length
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Calculate Donut segments
  const totalCuisineCount = cuisineChart.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;
  let accumulatedAngle = 0;
  const donutSegments = cuisineChart.map((item: any, idx: number) => {
    const angle = (item.count / totalCuisineCount) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      category: item.category,
      count: item.count,
      color: item.color || cuisineColors[idx % cuisineColors.length],
      startAngle,
      angle,
      percent: Math.round((item.count / totalCuisineCount) * 100),
    };
  });

  return (
    <div>
      {/* Welcome Banner */}
      {showWelcome && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 18px',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            fontSize: '0.92rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-regular fa-circle-check"></i>
            <span>Welcome back, Admin User</span>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#15803d',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Revenue Today */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #16a34a',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              REVENUE TODAY
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              ₹{Number(kpis.today_revenue || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', marginRight: '4px' }}></i>
              Paid orders collected today
            </div>
          </div>
        </div>

        {/* Orders Today */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid var(--color-accent)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(231, 111, 81, 0.12)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ORDERS TODAY
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              {kpis.total_orders_today || 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Placed since 12:00 AM
            </div>
          </div>
        </div>

        {/* In Kitchen Queue */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #3b82f6',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-fire-burner"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              IN KITCHEN QUEUE
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              {kpis.pending_orders_today || 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              0 new, 0 cooking
            </div>
          </div>
        </div>

        {/* Ready at Counter */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #8b5cf6',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-bell"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              READY AT COUNTER
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              {kpis.completed_orders_today || 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Awaiting student pickup
            </div>
          </div>
        </div>

        {/* Active Menu */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #ef4444',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-bowl-food"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACTIVE MENU
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              31
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Across 6 categories
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #0f766e',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(15, 118, 110, 0.12)',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACTIVE CUSTOMERS
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              2
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
              Registered college users
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* 7-Day Sales Trend */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-chart-line" style={{ color: 'var(--color-accent)' }}></i> 7-Day Sales Trend
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Daily Paid Revenue</span>
          </div>

          <div style={{ padding: '20px', height: '240px', position: 'relative' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartHeight - paddingY - pct * innerH;
                const val = (pct * maxRevenue).toFixed(0);
                return (
                  <g key={i}>
                    <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={paddingX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                      ₹{val}
                    </text>
                  </g>
                );
              })}

              {/* Area under curve */}
              {areaD && <path d={areaD} fill="rgba(217, 119, 6, 0.08)" />}

              {/* Line path */}
              {pathD && <path d={pathD} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Data points & X Labels */}
              {points.map((p: any, i: number) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                  <text x={p.x} y={chartHeight - 6} textAnchor="middle" fontSize="10" fill="#64748b">
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Sales by Cuisine */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--color-accent)' }}></i> Sales by Cuisine
            </h3>
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Donut */}
            <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {donutSegments.map((seg: any, i: number) => {
                const strokeDasharray = `${(seg.angle / 360) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`;
                const strokeDashoffset = -((seg.startAngle / 360) * 2 * Math.PI * 30);
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>

            {/* Donut Legend */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px 14px',
                marginTop: '16px',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              {donutSegments.map((seg: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }}></span>
                  <span>{seg.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--color-accent)' }}></i> Recent Orders
          </h3>
          <Link
            href="/admin/orders"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            View All Orders &rarr;
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>ORDER #</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>CUSTOMER</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>TIME</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>PAYMENT</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>ORDER STATUS</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ro: any) => (
                  <tr key={ro.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                      <Link href={`/admin/orders/${ro.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                        #{ro.order_number}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{ro.customer_name_snapshot}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ro.customer_phone_snapshot || 'rahul@college.edu'}</div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: '0.85rem', color: '#64748b' }}>
                      {timeAgo(ro.created_at)}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                      ₹{Number(ro.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: ro.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: ro.payment_status === 'paid' ? '#15803d' : '#b45309',
                        }}
                      >
                        {ro.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: ro.order_status === 'collected' ? '#e2e8f0' : ro.order_status === 'ready' ? '#dcfce7' : '#e0f2fe',
                          color: ro.order_status === 'collected' ? '#475569' : ro.order_status === 'ready' ? '#15803d' : '#0369a1',
                        }}
                      >
                        {ro.order_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <Link
                        href={`/admin/orders/${ro.id}`}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
