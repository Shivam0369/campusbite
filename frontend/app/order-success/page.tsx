'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const orderNumber = searchParams.get('number') || (orderId ? `CB${orderId.padStart(6, '0')}` : 'CB000000');

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '40px 20px 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Popping Checkmark */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#059669',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.1)',
            }}
          >
            <i className="fa-solid fa-check"></i>
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
              marginBottom: '8px',
            }}
          >
            Order Received!
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              maxWidth: '460px',
              margin: '0 auto 24px',
              lineHeight: 1.5,
            }}
          >
            Your order has been sent to the kitchen display and preparation will begin shortly.
          </p>

          {/* Big Digital Pickup Token */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed var(--color-accent)',
              borderRadius: '12px',
              padding: '20px 24px',
              margin: '24px 0',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                letterSpacing: '1px',
                color: 'var(--color-text-secondary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              YOUR COUNTER PICKUP TOKEN
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '0.5px',
              }}
            >
              #{orderNumber}
            </div>
          </div>

          {/* Counter Collection Instructions */}
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              textAlign: 'left',
              margin: '20px 0 28px',
            }}
          >
            <div style={{ fontSize: '1.3rem', color: '#d97706', marginTop: '2px' }}>
              <i className="fa-solid fa-bell-concierge"></i>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.45 }}>
              <strong>Self-Service Counter Collection:</strong> Please keep this token handy. When the status tracker shows <em>Ready for Collection</em>, present your order number at the canteen counter.
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {orderId && (
              <Link
                href={`/order-details/${orderId}`}
                style={{
                  borderRadius: '8px',
                  background: 'var(--color-accent)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-clock-rotate-left"></i> Track Live Status
              </Link>
            )}
            <Link
              href="/menu"
              style={{
                borderRadius: '8px',
                border: '1.5px solid #2C2C2C',
                background: 'white',
                color: '#2C2C2C',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-bowl-food"></i> Order More Dishes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container text-center py-5">Loading order confirmation...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
