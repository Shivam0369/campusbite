'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="text-center py-5">
        <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p className="mt-3">Loading dashboard analytics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];
  const revenueChart = data?.revenue_chart || [];
  const cuisineChart = data?.cuisine_chart || [];

  return (
    <div className="admin-dashboard-container">
      {/* 6 Executive KPIs Grid */}
      <div className="admin-kpi-grid">
        <div className="kpi-card emerald-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TODAY PAID REVENUE</span>
            <h2 className="kpi-value">₹{Number(kpis.today_revenue || 0).toFixed(2)}</h2>
            <span className="kpi-subtext">All-time: ₹{Number(kpis.total_revenue || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="kpi-card blue-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS TODAY</span>
            <h2 className="kpi-value">{kpis.total_orders_today || 0}</h2>
            <span className="kpi-subtext">Class recess & lunch</span>
          </div>
        </div>

        <div className="kpi-card teal-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">COMPLETED ORDERS</span>
            <h2 className="kpi-value">{kpis.completed_orders_today || 0}</h2>
            <span className="kpi-subtext">Collected at counter</span>
          </div>
        </div>

        <div className="kpi-card amber-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-fire-burner"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">ACTIVE IN KITCHEN</span>
            <h2 className="kpi-value">{kpis.pending_orders_today || 0}</h2>
            <span className="kpi-subtext">Placed, cooking or ready</span>
          </div>
        </div>

        <div className="kpi-card coral-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">AVERAGE ORDER VALUE</span>
            <h2 className="kpi-value">₹{Number(kpis.avg_order_value || 0).toFixed(2)}</h2>
            <span className="kpi-subtext">AOV per transaction</span>
          </div>
        </div>

        <div className="kpi-card purple-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-percent"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">COMPLETION RATE</span>
            <h2 className="kpi-value">{kpis.completion_rate_percent || 0}%</h2>
            <span className="kpi-subtext">Fulfillment performance</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="admin-charts-grid mt-4">
        {/* 7-Day Revenue Trend Card */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">
              <i className="fa-solid fa-chart-line"></i> 7-Day Revenue Trend
            </h3>
            <span className="chart-subtitle">Daily paid canteen receipts</span>
          </div>
          <div className="chart-bars-container mt-4">
            {revenueChart.map((d: any, idx: number) => {
              const maxRev = Math.max(...revenueChart.map((r: any) => r.revenue), 100);
              const heightPct = Math.max(8, (d.revenue / maxRev) * 100);

              return (
                <div key={idx} className="chart-bar-col">
                  <div className="bar-wrapper">
                    <span className="bar-tooltip">₹{d.revenue.toFixed(0)}</span>
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="bar-label">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cuisine Popularity Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">
              <i className="fa-solid fa-doughnut-chart"></i> Cuisine Category Popularity
            </h3>
            <span className="chart-subtitle">Portions ordered by cuisine</span>
          </div>
          <div className="cuisine-breakdown-list mt-3">
            {cuisineChart.length === 0 ? (
              <p className="text-muted">No dishes ordered yet.</p>
            ) : (
              cuisineChart.map((c: any, idx: number) => {
                const totalDishes = cuisineChart.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;
                const pct = Math.round((c.count / totalDishes) * 100);

                return (
                  <div key={idx} className="cuisine-progress-row mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="cuisine-name font-weight-bold">{c.category}</span>
                      <span className="cuisine-count">{c.count} items ({pct}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="admin-table-card mt-4">
        <div className="table-card-header">
          <h3 className="table-card-title">
            <i className="fa-solid fa-clock-rotate-left"></i> Recent Orders Live Stream
          </h3>
          <Link href="/admin/orders" className="btn btn-outline-secondary btn-sm">
            View All Orders <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                  <tr key={ord.id}>
                    <td>
                      <span className="order-token-badge font-weight-bold">
                        #{ord.order_number}
                      </span>
                    </td>
                    <td>{ord.customer_name_snapshot}</td>
                    <td>
                      {ord.items?.map((i: any) => `${i.quantity}× ${i.item_name_snapshot}`).join(', ')}
                    </td>
                    <td className="font-weight-bold">₹{Number(ord.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge-pill badge-${ord.payment_status}`}>
                        {ord.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-pill badge-${ord.order_status}`}>
                        {ord.order_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

