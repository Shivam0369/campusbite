'use client';

import React, { useState, useEffect } from 'react';
import { api, Order } from '@/lib/api';

export default function AdminReportsPage() {
  const [datePreset, setDatePreset] = useState('7days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [datePreset]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReports({ date_preset: datePreset });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/admin/reports/export-csv?date_preset=${datePreset}`;
  };

  const summary = data?.summary || {};
  const orders = data?.orders || [];

  return (
    <div className="admin-reports-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-chart-line"></i> Sales Analytics & Reports
          </h1>
          <p className="admin-subheading">Financial breakdowns, revenue aggregation, and 1-click accounting CSV export</p>
        </div>

        <button className="btn btn-accent" onClick={handleExportCSV}>
          <i className="fa-solid fa-file-csv"></i> Download Sales CSV
        </button>
      </div>

      {/* Date Preset Filter Bar */}
      <div className="admin-toolbar-card mt-3">
        <div className="date-filter-buttons">
          {[
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: 'this_month', label: 'This Month' },
            { key: '30days', label: 'Last 30 Days' },
          ].map((p) => (
            <button
              key={p.key}
              className={`date-pill ${datePreset === p.key ? 'active' : ''}`}
              onClick={() => setDatePreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="admin-kpi-grid mt-4">
        <div className="kpi-card emerald-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL PAID REVENUE</span>
            <h2 className="kpi-value">₹{Number(summary.total_revenue || 0).toFixed(2)}</h2>
            <span className="kpi-subtext">Over selected timeframe</span>
          </div>
        </div>

        <div className="kpi-card blue-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS</span>
            <h2 className="kpi-value">{summary.total_orders || 0}</h2>
            <span className="kpi-subtext">{summary.paid_orders || 0} reconciled as paid</span>
          </div>
        </div>

        <div className="kpi-card coral-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">AVERAGE ORDER VALUE</span>
            <h2 className="kpi-value">₹{Number(summary.average_order_value || 0).toFixed(2)}</h2>
            <span className="kpi-subtext">Per paid transaction</span>
          </div>
        </div>

        <div className="kpi-card teal-accent">
          <div className="kpi-icon-box">
            <i className="fa-solid fa-percent"></i>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">COMPLETION RATE</span>
            <h2 className="kpi-value">{summary.completion_rate_percent || 0}%</h2>
            <span className="kpi-subtext">{summary.completed_orders || 0} collected orders</span>
          </div>
        </div>
      </div>

      {/* Filtered Orders Table */}
      <div className="admin-table-card mt-4">
        <div className="table-card-header">
          <h3 className="table-card-title">
            <i className="fa-solid fa-file-invoice-dollar"></i> Transaction Accounting Log
          </h3>
          <span className="text-muted small">
            {summary.start_date && new Date(summary.start_date).toLocaleDateString()} — {summary.end_date && new Date(summary.end_date).toLocaleDateString()}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Aggregating report data...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No transactions found for this date preset.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>GST Tax</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord: Order) => (
                  <tr key={ord.id}>
                    <td><strong>#{ord.order_number}</strong></td>
                    <td>{ord.customer_name_snapshot}</td>
                    <td>₹{Number(ord.subtotal).toFixed(2)}</td>
                    <td>₹{Number(ord.tax_amount).toFixed(2)}</td>
                    <td className="font-weight-bold">₹{Number(ord.total_amount).toFixed(2)}</td>
                    <td>{ord.payment_method.toUpperCase()}</td>
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
                    <td className="text-muted small">
                      {new Date(ord.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

