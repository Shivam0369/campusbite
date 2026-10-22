'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Order } from '@/lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, methodFilter, dateFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'all') params.order_status = statusFilter;
      if (paymentFilter !== 'all') params.payment_status = paymentFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getAdminOrders(params);
      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotalCount(res.data.total_count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setMethodFilter('all');
    setDateFilter('all');
    setPage(1);
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fa-solid fa-receipt" style={{ color: 'var(--color-accent)' }}></i> Order Management
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Filter, inspect, track, and update all campus canteen orders.
          </p>
        </div>

        <Link
          href="/staff"
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: '1.5px solid #2C2C2C',
            background: 'white',
            color: '#2C2C2C',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          <i className="fa-solid fa-kitchen-set"></i> Open Kitchen Live Screen <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem' }}></i>
        </Link>
      </div>

      {/* Filters Card */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1.4fr) repeat(4, minmax(130px, 1fr)) auto',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search Order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Order Statuses</option>
            <option value="placed">Placed (New)</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="form-control"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="form-control"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash at Counter</option>
            <option value="upi">UPI Payment</option>
          </select>

          <select
            className="form-control"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                background: '#1B4332',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 18px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-filter"></i> Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              style={{
                background: 'white',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '9px 12px',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
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
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: '#64748b',
          }}
        >
          <div>
            <strong style={{ color: '#1e293b' }}>{totalCount}</strong> orders found
          </div>
          <div>Page {page} of {Math.max(1, Math.ceil(totalCount / 15))}</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Order #</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Customer</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date & Time</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Items</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Payment</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Order Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
                    <p className="mt-2" style={{ margin: '8px 0 0' }}>Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                    <i className="fa-solid fa-receipt fa-2x" style={{ color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const itemsCount = ord.items?.length || 1;
                  const isPaid = ord.payment_status === 'paid';
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        <Link href={`/admin/orders/${ord.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                          #{ord.order_number}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.customer_name_snapshot}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {ord.customer_phone_snapshot || 'rahul@college.edu'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: '0.85rem', color: '#64748b' }}>
                        <div>{new Date(ord.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.88rem', color: '#475569' }}>
                        {itemsCount} item{itemsCount > 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                        ₹{Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: isPaid ? '#dcfce7' : '#fef3c7',
                              color: isPaid ? '#15803d' : '#a16207',
                            }}
                          >
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                            {ord.payment_method}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: ord.order_status === 'collected' ? '#e2e8f0' : ord.order_status === 'ready' ? '#dcfce7' : '#e0f2fe',
                            color: ord.order_status === 'collected' ? '#475569' : ord.order_status === 'ready' ? '#15803d' : '#0369a1',
                          }}
                        >
                          {ord.order_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="fa-solid fa-sliders" style={{ fontSize: '0.75rem' }}></i> Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
