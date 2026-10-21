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
  const [search, setSearch] = useState('');

  // Status Override Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter]);

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

  const openOverrideModal = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.order_status);
    setNewPaymentStatus(ord.payment_status);
    setOverrideNotes('');
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setOverrideLoading(true);
    try {
      const res = await api.overrideOrderStatus(selectedOrder.id, {
        new_status: newStatus,
        payment_status: newPaymentStatus,
        notes: overrideNotes.trim() || undefined,
      });
      if (res.success) {
        alert(res.message);
        setSelectedOrder(null);
        await fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Status override failed.');
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="admin-orders-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-receipt"></i> Orders Management
          </h1>
          <p className="admin-subheading">Monitor live campus tokens, filter receipts, and override stages</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-toolbar-card mt-3">
        <form onSubmit={handleSearchSubmit} className="toolbar-search-form">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search token # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </form>

        <div className="toolbar-filters-row">
          <div className="filter-item">
            <label>Order Status:</label>
            <select
              className="form-control form-control-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready for Collection</option>
              <option value="collected">Collected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Payment Status:</label>
            <select
              className="form-control form-control-sm"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-card mt-4">
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-solid fa-box-open fa-2x"></i>
            <p className="mt-2">No orders found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Items Snapshot</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order Stage</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <span className="order-token-badge font-weight-bold">
                        #{ord.order_number}
                      </span>
                    </td>
                    <td>
                      <strong>{ord.customer_name_snapshot}</strong>
                      {ord.customer_phone_snapshot && (
                        <div className="text-muted small">{ord.customer_phone_snapshot}</div>
                      )}
                    </td>
                    <td>
                      {ord.items?.map((i) => (
                        <div key={i.id} className="small">
                          {i.quantity}× {i.item_name_snapshot}
                        </div>
                      ))}
                    </td>
                    <td className="font-weight-bold">₹{Number(ord.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge-pill badge-${ord.payment_status}`}>
                        {ord.payment_status.toUpperCase()} ({ord.payment_method.toUpperCase()})
                      </span>
                    </td>
                    <td>
                      <span className={`badge-pill badge-${ord.order_status}`}>
                        {ord.order_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(ord.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <div className="btn-group">
                        <Link
                          href={`/order-details/${ord.id}`}
                          className="btn btn-outline-secondary btn-xs mr-1"
                          title="View customer tracker"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                        <button
                          className="btn btn-outline-primary btn-xs"
                          onClick={() => openOverrideModal(ord)}
                          title="Admin Status Override"
                        >
                          <i className="fa-solid fa-sliders"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="table-pagination-footer">
          <span className="total-records-text">Total Orders: {totalCount}</span>
          <div className="pagination-controls">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="current-page-badge">Page {page}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={orders.length < 15}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Override Status Modal */}
      {selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Admin Status Override</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="modal-desc">
              Overriding token <strong>#{selectedOrder.order_number}</strong> for {selectedOrder.customer_name_snapshot}.
            </p>

            <form onSubmit={handleOverrideSubmit} className="mt-3">
              <div className="form-group mb-3">
                <label className="form-label">Order Lifecycle Status</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="placed">PLACED</option>
                  <option value="accepted">ACCEPTED</option>
                  <option value="preparing">PREPARING</option>
                  <option value="ready">READY FOR COLLECTION</option>
                  <option value="collected">COLLECTED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Payment Status</label>
                <select
                  className="form-control"
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                >
                  <option value="pending">PENDING</option>
                  <option value="paid">PAID</option>
                  <option value="failed">FAILED</option>
                  <option value="refunded">REFUNDED</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Admin Reason / Audit Note</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Counter handover confirmed manually"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={overrideLoading}
                >
                  {overrideLoading ? 'Saving...' : 'Apply Status Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

