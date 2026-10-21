'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const handleCheckoutClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '30px 0 60px' }}>
      <div className="container">
        {/* Header matching media_1792610926770_051abe6a.png */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
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
            <i className="fa-solid fa-cart-shopping" style={{ color: 'var(--color-accent)' }}></i> Your Cart
          </h1>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/menu"
              className="btn btn-outline-dark btn-sm"
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)',
                background: 'white',
                color: 'var(--color-text)',
                fontWeight: 600,
                padding: '8px 16px',
                textDecoration: 'none',
              }}
            >
              &larr; Continue Shopping
            </Link>

            {!isEmpty && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowClearConfirm(true)}
              >
                <i className="fa-solid fa-trash-can"></i> Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showClearConfirm && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-icon-circle danger">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="modal-title">Clear Shopping Cart?</h3>
              <p className="modal-desc">
                Are you sure you want to remove all items from your cart? This cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    await clearCart();
                    setShowClearConfirm(false);
                  }}
                >
                  Yes, Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {isEmpty ? (
          /* Empty state matching media_1792610926770_051abe6a.png */
          <div
            className="text-center"
            style={{
              padding: '70px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '4.5rem', color: '#cbd5e1', marginBottom: '20px' }}>
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Your cart is empty
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
              Browse our menu and add some delicious items!
            </p>
            <Link
              href="/menu"
              className="btn btn-accent btn-lg"
              style={{
                borderRadius: 'var(--radius-sm)',
                padding: '16px 36px',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white',
              }}
            >
              <i className="fa-solid fa-utensils"></i> Browse Menu
            </Link>
          </div>
        ) : (
          <div className="cart-layout-grid">
            {/* Cart Items List */}
            <div className="cart-items-column">
              {items.map((item) => {
                const imgUrl = item.image_path ? `/${item.image_path}` : '/assets/images/food/default-food.svg';
                return (
                  <div key={item.menu_item_id} className="cart-item-card">
                    {/* Thumbnail */}
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className="cart-item-thumbnail"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                      }}
                    />

                    {/* Info */}
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <div className="cart-item-unit-price">
                        ₹{Number(item.price).toFixed(2)} each
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="cart-item-stepper">
                      <button
                        className="stepper-btn minus"
                        disabled={loading}
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        title="Decrease quantity"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <span className="stepper-qty">{item.quantity}</span>
                      <button
                        className="stepper-btn plus"
                        disabled={loading || item.quantity >= 20}
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        title="Increase quantity"
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="cart-item-line-total">
                      ₹{Number(item.line_total).toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.menu_item_id)}
                      title="Remove item"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary Card */}
            <div className="cart-summary-column">
              <div className="cart-summary-card">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Items Subtotal</span>
                  <span>₹{Number(cart?.subtotal || 0).toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Tax (GST {cart?.tax_percent || 5}%)</span>
                  <span>₹{Number(cart?.tax_amount || 0).toFixed(2)}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Total Payable</span>
                  <span className="total-amount">₹{Number(cart?.total || 0).toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-accent btn-block btn-lg mt-4"
                  onClick={handleCheckoutClick}
                >
                  Proceed to Checkout <i className="fa-solid fa-arrow-right"></i>
                </button>

                <div className="counter-pickup-notice mt-3">
                  <i className="fa-solid fa-store"></i> Counter pickup only at college dining hall.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
