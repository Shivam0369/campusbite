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
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '20px 0 60px' }}>
      <div className="cart-container">
        {/* Header matching Image 3 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
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

          <Link
            href="/menu"
            className="btn btn-outline-dark btn-sm"
            style={{
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'white',
              color: 'var(--color-text)',
              fontWeight: 600,
              padding: '8px 18px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            &larr; Continue Shopping
          </Link>
        </div>

        {/* Clear Cart Confirmation Modal */}
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
          <div className="empty-state">
            <i className="fa-solid fa-cart-shopping"></i>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h3>
            <p>Browse our menu and add some delicious items!</p>
            <Link
              href="/menu"
              className="btn btn-accent btn-lg"
              style={{
                borderRadius: 'var(--radius-sm)',
                padding: '14px 32px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="cart-items-list">
              {items.map((item) => {
                const imgUrl = item.image_path ? `/${item.image_path}` : '/assets/images/food/default-food.svg';
                return (
                  <div key={item.menu_item_id} className="cart-item">
                    {/* Item Image Thumbnail */}
                    <div
                      className="cart-item-image"
                      style={{
                        background: '#d97706',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                        }}
                      />
                    </div>

                    {/* Item Info */}
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">
                        ₹{Number(item.price).toFixed(2)} each
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="cart-item-qty">
                      <button
                        className="qty-btn"
                        disabled={loading}
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        disabled={loading || item.quantity >= 20}
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="cart-item-total">
                      ₹{Number(item.line_total).toFixed(2)}
                    </div>

                    {/* Remove Item */}
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.menu_item_id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary Card */}
            <div className="cart-summary">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
                Order Summary
              </h3>

              <div className="cart-summary-row">
                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{Number(cart?.subtotal || 0).toFixed(2)}</span>
              </div>

              <div className="cart-summary-row">
                <span style={{ color: 'var(--color-text-secondary)' }}>Tax ({cart?.tax_percent || 5}%)</span>
                <span style={{ fontWeight: 600 }}>₹{Number(cart?.tax_amount || 0).toFixed(2)}</span>
              </div>

              <div className="cart-summary-row total">
                <span>Total</span>
                <span style={{ color: 'var(--color-text)', fontSize: '1.3rem', fontWeight: 800 }}>
                  ₹{Number(cart?.total || 0).toFixed(2)}
                </span>
              </div>

              {/* Actions Footer */}
              <div
                className="cart-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  paddingTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  <i className="fa-solid fa-trash-can"></i> Clear Cart
                </button>

                <button
                  type="button"
                  className="btn btn-accent"
                  style={{
                    padding: '12px 32px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                  }}
                  onClick={handleCheckoutClick}
                >
                  <i className="fa-solid fa-lock"></i> Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
