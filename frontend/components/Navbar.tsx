'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const cartCount = cart?.cart_count || 0;
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <nav className="navbar">
      <div className="container">
        {/* Brand Logo */}
        <Link href={isStaff ? '/staff' : isAdmin ? '/admin' : '/'} className="navbar-brand">
          <span className="brand-icon">
            <i className="fa-solid fa-utensils"></i>
          </span>
          <span>CampusBite</span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        {/* Nav Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Menu link is ONLY for customers, admins, and unauthenticated guests — NOT for kitchen staff */}
          {!isStaff && (
            <Link
              href="/menu"
              className={pathname === '/menu' ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fa-solid fa-bowl-food"></i> Menu
            </Link>
          )}

          {/* Customer specific links */}
          {user && isCustomer && (
            <>
              <Link
                href="/cart"
                className={`nav-cart ${pathname === '/cart' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-cart-shopping"></i> Cart
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
              <Link
                href="/my-orders"
                className={pathname === '/my-orders' ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-receipt"></i> My Orders
              </Link>
            </>
          )}

          {/* Kitchen Display link for staff & admin */}
          {user && (isStaff || isAdmin) && (
            <Link
              href="/staff"
              className={`btn btn-accent btn-sm ${pathname === '/staff' ? 'active' : ''}`}
              style={{ color: '#fff', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fa-solid fa-fire-burner"></i> Kitchen Display
            </Link>
          )}

          {/* Admin Portal link */}
          {user && isAdmin && (
            <Link
              href="/admin"
              className={`btn btn-accent btn-sm ${pathname.startsWith('/admin') ? 'active' : ''}`}
              style={{ color: '#fff', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fa-solid fa-gauge-high"></i> Admin Portal
            </Link>
          )}

          {/* Profile Tab - explicitly available for staff, customer & admin */}
          {user ? (
            <>
              <Link
                href="/profile"
                className={pathname === '/profile' ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-user"></i> Profile
              </Link>

              <Link
                href="/profile"
                className="nav-user"
                style={{
                  textDecoration: 'none',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span
                  className="user-avatar"
                  style={{
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{user.full_name}</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="btn-link"
                title="Log Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={pathname === '/login' ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-arrow-right-to-bracket"></i> Login
              </Link>
              <Link
                href="/register"
                className="btn btn-accent btn-sm"
                style={{ color: '#fff', borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-user-plus"></i> Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
