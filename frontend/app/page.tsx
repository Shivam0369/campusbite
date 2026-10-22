'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'staff') {
        router.replace('/staff');
      } else if (user.role === 'admin') {
        router.replace('/admin');
      }
    }
  }, [user, loading, router]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero">
        <div className="container">
          <h1>
            Fresh Food, <span className="highlight-text">Zero Wait</span>
          </h1>
          <p>
            Seamless on-campus digital dining. Explore curated culinary menus, personalize orders, track live kitchen preparation, and collect instantly at the express counter.
          </p>

          <div className="hero-actions">
            <Link href="/menu" className="btn btn-accent">
              <i className="fa-solid fa-utensils"></i> Get Started
            </Link>
            {user ? (
              <Link href="/my-orders" className="btn btn-outline-light">
                <i className="fa-solid fa-receipt"></i> My Orders
              </Link>
            ) : (
              <Link href="/login" className="btn btn-outline-light">
                <i className="fa-solid fa-right-to-bracket"></i> Login
              </Link>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">30+</div>
              <div className="stat-label">Menu Items</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">6</div>
              <div className="stat-label">Cuisines</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">5min</div>
              <div className="stat-label">Avg. Wait</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '60px 0 20px' }}>
        <div className="container">
          <h2 className="landing-section-title">How It Works</h2>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon-wrapper">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <h3>Sign Up</h3>
              <p>
                Create your free account with your college email and you&apos;re ready to go.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrapper">
                <i className="fa-solid fa-bowl-food"></i>
              </div>
              <h3>Browse &amp; Order</h3>
              <p>
                Explore cuisines — Indian, Chinese, Fast Food &amp; more. Filter by veg or non-veg.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrapper">
                <i className="fa-solid fa-wallet"></i>
              </div>
              <h3>Pay Your Way</h3>
              <p>
                Pay via cash at counter, UPI, or online payment — whatever works for you.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrapper">
                <i className="fa-solid fa-bell-concierge"></i>
              </div>
              <h3>Collect &amp; Enjoy</h3>
              <p>
                Get notified when your food is ready. Walk to the counter, collect, and enjoy!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Our Cuisines Section */}
      <section style={{ padding: '20px 0 40px' }}>
        <div className="container">
          <h2 className="landing-section-title">Explore Our Cuisines</h2>

          <div className="cuisines-grid">
            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-bowl-food"></i>
              </div>
              <h3 className="cuisine-name">Indian</h3>
              <p className="cuisine-desc">Traditional Indian thalis, curries, parathas and rice dishes</p>
            </Link>

            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-fire-burner"></i>
              </div>
              <h3 className="cuisine-name">Chinese</h3>
              <p className="cuisine-desc">Indo-Chinese noodles, fried rice, momos and Manchurian</p>
            </Link>

            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-burger"></i>
              </div>
              <h3 className="cuisine-name">Fast Food</h3>
              <p className="cuisine-desc">Burgers, pizza, sandwiches and fries</p>
            </Link>

            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-cookie-bite"></i>
              </div>
              <h3 className="cuisine-name">Snacks</h3>
              <p className="cuisine-desc">Quick bites, chaats and light snacks</p>
            </Link>

            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-mug-hot"></i>
              </div>
              <h3 className="cuisine-name">Beverages</h3>
              <p className="cuisine-desc">Cold coffee, shakes, juices and hot beverages</p>
            </Link>

            <Link href="/menu" className="cuisine-card">
              <div className="cuisine-icon-badge">
                <i className="fa-solid fa-ice-cream"></i>
              </div>
              <h3 className="cuisine-name">Desserts</h3>
              <p className="cuisine-desc">Sweet treats, ice cream and traditional Indian desserts</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Ready to skip the queue CTA Banner */}
      <section className="cta-banner">
        <div className="container">
          <h2>Ready to skip the queue?</h2>
          <p>Join CampusBite today and start ordering your favourite campus meals in seconds.</p>
          <Link href="/register" className="btn-cta">
            <i className="fa-solid fa-rocket"></i> Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
