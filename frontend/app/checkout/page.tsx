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
      <div className="checkout-container text-center py-5">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Please add some items to your tray before proceeding to checkout.
        </p>
        <Link href="/menu" className="btn btn-accent" style={{ color: 'white', padding: '10px 24px' }}>
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

  const totalAmount = Number(cart?.total || 0).toFixed(2);

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '20px 0 60px' }}>
      <div className="checkout-container">
        {/* Title */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--color-text)',
            marginBottom: '24px',
          }}
        >
          <i className="fa-solid fa-lock" style={{ color: 'var(--color-accent)' }}></i> Checkout
        </h1>

        {error && (
          <div className="alert alert-danger mb-4" style={{ padding: '12px 16px', borderRadius: '8px' }}>
            <i className="fa-solid fa-circle-exclamation alert-icon"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Order Summary */}
          <div className="checkout-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              <i className="fa-solid fa-receipt" style={{ color: 'var(--color-accent)' }}></i> Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              {items.map((item) => {
                const imgUrl = item.image_path ? `/${item.image_path}` : '/assets/images/food/default-food.svg';
                return (
                  <div
                    key={item.menu_item_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          background: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          ₹{Number(item.price).toFixed(2)} &times; {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                      ₹{Number(item.line_total).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₹{Number(cart?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                <span>Tax (5%)</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>₹{Number(cart?.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', marginTop: '8px', paddingTop: '10px', fontSize: '1.15rem', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-accent)' }}>₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Your Details */}
          <div className="checkout-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              <i className="fa-solid fa-user" style={{ color: 'var(--color-accent)' }}></i> Your Details
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Phone Number <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Order Notes <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Less spicy, no onion, extra chutney..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--color-border)', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="checkout-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              <i className="fa-solid fa-credit-card" style={{ color: 'var(--color-accent)' }}></i> Payment Method
            </h3>

            <div className="payment-methods">
              <label
                className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <div style={{ fontSize: '1.25rem', color: '#16a34a' }}>
                  <i className="fa-solid fa-money-bill-wave"></i>
                </div>
                <div className="payment-option-info">
                  <h4>Cash at Counter</h4>
                  <p>Pay when you collect your order from the counter.</p>
                </div>
              </label>

              <label
                className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div style={{ fontSize: '1.25rem', color: '#0284c7' }}>
                  <i className="fa-solid fa-mobile-screen"></i>
                </div>
                <div className="payment-option-info">
                  <h4>UPI Payment</h4>
                  <p>Pay via UPI (Demo mode — for college demonstration only)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Collection Notice Callout */}
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '1.25rem', color: '#d97706', marginTop: '2px' }}>
              <i className="fa-solid fa-bell-concierge"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.92rem', marginBottom: '2px' }}>
                Collect at Canteen Counter
              </div>
              <div style={{ color: '#b45309', fontSize: '0.85rem', lineHeight: 1.4 }}>
                Your order will be prepared fresh. You&apos;ll receive an order number &mdash; collect your food when the status shows &ldquo;Ready for Collection&rdquo;.
              </div>
            </div>
          </div>

          {/* Place Order CTA Button */}
          <button
            type="submit"
            className="btn btn-accent btn-block"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '8px',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Placing Order...
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-dot"></i> Place Order &mdash; ₹{totalAmount}
              </>
            )}
          </button>

          {/* Back to Cart Link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link
              href="/cart"
              style={{
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              &larr; Back to Cart
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
