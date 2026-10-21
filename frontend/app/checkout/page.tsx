'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h2>Your cart is empty</h2>
        <p className="mt-2">Please add some items to your tray before proceeding to checkout.</p>
        <Link href="/menu" className="btn btn-accent mt-3">
          Return to Menu
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your full name for the order receipt.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.checkout({
        customer_name: customerName.trim(),
        customer_phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        payment_method: paymentMethod,
      });

      if (res.success && res.data) {
        await refreshCart();
        router.push(`/order-success?id=${res.data.order_id}&number=${res.data.order_number}`);
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-container container py-4">
      <h1 className="page-title mb-4">
        <i className="fa-solid fa-cash-register"></i> Express Checkout
      </h1>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fa-solid fa-circle-exclamation alert-icon"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="checkout-layout-grid">
        {/* Left Column: Form Details & Payment */}
        <div className="checkout-form-column">
          {/* Customer Details Box */}
          <div className="checkout-section-card">
            <h3 className="section-card-title">
              <i className="fa-solid fa-user"></i> Pickup Details
            </h3>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="customer_name">
                Customer Name <span className="text-danger">*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="phone">
                Phone Number (optional for SMS/token alerts)
              </label>
              <input
                id="phone"
                type="tel"
                className="form-control"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Special Kitchen Notes (optional)
              </label>
              <textarea
                id="notes"
                className="form-control"
                rows={2}
                placeholder="e.g. Less spicy, extra green chutney, no ice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="checkout-section-card mt-4">
            <h3 className="section-card-title">
              <i className="fa-solid fa-credit-card"></i> Payment Method
            </h3>

            <div className="payment-options-grid">
              <label
                className={`payment-option-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <div className="payment-option-content">
                  <div className="payment-icon cash-icon">
                    <i className="fa-solid fa-money-bill-wave"></i>
                  </div>
                  <div className="payment-text">
                    <span className="payment-title">Cash at Counter</span>
                    <span className="payment-desc">Pay cash when collecting your food tray</span>
                  </div>
                </div>
              </label>

              <label
                className={`payment-option-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div className="payment-option-content">
                  <div className="payment-icon upi-icon">
                    <i className="fa-solid fa-qrcode"></i>
                  </div>
                  <div className="payment-text">
                    <span className="payment-title">UPI Demonstration</span>
                    <span className="payment-desc">Instant campus payment verification</span>
                  </div>
                </div>
              </label>
            </div>

            {paymentMethod === 'upi' && (
              <div className="upi-demo-box mt-3">
                <i className="fa-solid fa-info-circle"></i> Demonstration UPI Mode: Token will simulate immediate verified payment with VPA: <strong>campusbite@upi</strong>.
              </div>
            )}
          </div>

          {/* Counter Pickup Disclaimer Box */}
          <div className="counter-disclaimer-box mt-4">
            <div className="disclaimer-header">
              <i className="fa-solid fa-bell-concierge"></i> Self-Service Counter Collection
            </div>
            <p className="disclaimer-text">
              Orders are prepared fresh at the canteen kitchen. When your order status turns <strong>Ready for Collection</strong>, show your order token number at the physical collection window.
            </p>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card">
            <h3 className="summary-title">Summary Review</h3>

            <div className="summary-items-list">
              {items.map((i) => (
                <div key={i.menu_item_id} className="checkout-item-line">
                  <span className="item-qty-name">
                    <strong>{i.quantity}×</strong> {i.name}
                  </span>
                  <span className="item-price">
                    ₹{Number(i.line_total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider my-3"></div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{Number(cart?.subtotal || 0).toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>GST ({cart?.tax_percent || 5}%)</span>
              <span>₹{Number(cart?.tax_amount || 0).toFixed(2)}</span>
            </div>

            <div className="summary-divider my-3"></div>

            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span className="total-amount">₹{Number(cart?.total || 0).toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="btn btn-accent btn-block btn-lg mt-4"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Placing Order...
                </>
              ) : (
                <>
                  Place Order — ₹{Number(cart?.total || 0).toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

