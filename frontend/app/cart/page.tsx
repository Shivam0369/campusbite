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
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '24px 0 60px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 20px' }}>
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
            style={{
              borderRadius: '8px',
              border: '1.5px solid #2C2C2C',
              background: 'white',
              color: '#2C2C2C',
              fontWeight: 600,
              padding: '8px 18px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
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
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '16px' }}>
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
              Your cart is empty
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
              Browse our menu and add some delicious items!
            </p>
            <Link
              href="/menu"
              className="btn btn-accent"
              style={{
                borderRadius: '8px',
                padding: '12px 28px',
                fontWeight: 700,
                color: 'white',
                display: 'inline-block',
                textDecoration: 'none',
              }}
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {items.map((item) => {
                const imgUrl = item.image_path ? `/${item.image_path}` : '/assets/images/food/default-food.svg';
                return (
                  <div
                    key={item.menu_item_id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Left: Thumbnail & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '200px' }}>
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          minWidth: '74px',
                          maxWidth: '74px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={item.name}
                          style={{
                            width: '74px',
                            height: '74px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          ₹{Number(item.price).toFixed(2)} each
                        </div>
                      </div>
                    </div>

                    {/* Right: Stepper, Line Total, Remove button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {/* Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1.5px solid #cbd5e1',
                            background: 'white',
                            color: '#1a1a1a',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            minWidth: '24px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#1a1a1a',
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={loading || item.quantity >= 20}
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1.5px solid #cbd5e1',
                            background: 'white',
                            color: '#1a1a1a',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Total */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: '#1a1a1a',
                          minWidth: '85px',
                          textAlign: 'right',
                        }}
                      >
                        ₹{Number(item.line_total).toFixed(2)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menu_item_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '1.15rem',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          lineHeight: 1,
                        }}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px 28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#1a1a1a' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>₹{Number(cart?.subtotal || 0).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Tax ({cart?.tax_percent || 5}%)</span>
                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>₹{Number(cart?.tax_amount || 0).toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1.5px solid #e2e8f0',
                  marginTop: '12px',
                  paddingTop: '14px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#1a1a1a',
                }}
              >
                <span>Total</span>
                <span style={{ color: '#1a1a1a' }}>
                  ₹{Number(cart?.total || 0).toFixed(2)}
                </span>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  paddingTop: '8px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.92rem',
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
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
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
