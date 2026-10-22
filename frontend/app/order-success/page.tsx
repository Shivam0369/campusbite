'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const orderNumber = searchParams.get('number') || (orderId ? `CB${orderId.padStart(6, '0')}` : 'CB000000');

  return (
    <div className="order-success-page container py-5 text-center">
      <div className="success-card">
        {/* Popping Checkmark */}
        <div className="success-icon-circle">
          <i className="fa-solid fa-check"></i>
        </div>

        <h1 className="success-title">Order Received!</h1>
        <p className="success-subtitle">
          Your order has been sent to the kitchen display and preparation will begin shortly.
        </p>

        {/* Big Digital Pickup Token */}
        <div className="token-display-box">
          <span className="token-label">YOUR COUNTER PICKUP TOKEN</span>
          <span className="token-number">#{orderNumber}</span>
        </div>

        {/* Counter Collection Instructions */}
        <div className="counter-pickup-banner">
          <div className="pickup-banner-icon">
            <i className="fa-solid fa-bell-concierge"></i>
          </div>
          <div className="pickup-banner-text">
            <strong>Self-Service Counter Collection:</strong> Please keep this token handy. When the status tracker shows <em>Ready for Collection</em>, present your order number at the canteen counter.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions mt-4">
          {orderId && (
            <Link href={`/order-details/${orderId}`} className="btn btn-accent btn-lg mr-2">
              <i className="fa-solid fa-clock-rotate-left"></i> Track Live Status
            </Link>
          )}
          <Link href="/menu" className="btn btn-outline-secondary btn-lg">
            <i className="fa-solid fa-bowl-food"></i> Order More Dishes
          </Link>
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

