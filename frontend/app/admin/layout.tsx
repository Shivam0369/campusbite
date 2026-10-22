'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="admin-loading-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <i className="fa-solid fa-shield-halved fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
        <p className="mt-3" style={{ color: '#64748b', fontWeight: 600 }}>Verifying administrator credentials...</p>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Overview';
    if (pathname.startsWith('/admin/orders/')) return 'Order Details';
    if (pathname === '/admin/orders') return 'Order Management';
    if (pathname === '/admin/menu-items') return 'Manage Menu Items';
    if (pathname === '/admin/categories') return 'Manage Categories';
    if (pathname === '/admin/users') return 'User Management';
    if (pathname === '/admin/reports') return 'Reports & Analytics';
    if (pathname === '/admin/settings') return 'System Settings';
    if (pathname === '/admin/ai-insights') return 'AI Operations Insights';
    return 'Admin Control Panel';
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'fa-gauge-high' },
    { href: '/admin/orders', label: 'Orders', icon: 'fa-receipt' },
    { href: '/admin/menu-items', label: 'Menu Items', icon: 'fa-bowl-food' },
    { href: '/admin/categories', label: 'Categories', icon: 'fa-layer-group' },
    { href: '/admin/users', label: 'Users', icon: 'fa-users' },
    { href: '/admin/reports', label: 'Sales & Reports', icon: 'fa-chart-line' },
    { href: '/admin/ai-insights', label: 'AI Insights', icon: 'fa-brain' },
    { href: '/admin/settings', label: 'Settings', icon: 'fa-gear' },
  ];

  return (
    <div className="admin-root-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1400,
          }}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`admin-sidebar ${mobileSidebarOpen ? 'admin-sidebar-mobile-open' : ''}`}
        style={{
          width: '260px',
          background: '#0f172a',
          color: '#cbd5e1',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1500,
        }}
      >
        <Link
          href="/admin"
          style={{
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.1rem',
              boxShadow: '0 4px 10px rgba(249, 115, 22, 0.35)',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
              }}
            >
              CampusBite
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--color-accent)',
              }}
            >
              ADMIN PORTAL
            </div>
          </div>
        </Link>

        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#64748b',
              padding: '8px 12px 4px',
              fontWeight: 700,
            }}
          >
            MAIN MENU
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className={`fa-solid ${item.icon}`} style={{ width: '20px', textAlign: 'center', fontSize: '1rem' }}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#64748b',
              padding: '16px 12px 4px',
              fontWeight: 700,
            }}
          >
            OPERATIONS
          </div>
          <Link
            href="/staff"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '0.92rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <i className="fa-solid fa-kitchen-set" style={{ width: '20px', textAlign: 'center', fontSize: '1rem' }}></i>
            <span style={{ flex: 1 }}>Kitchen Display</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem', opacity: 0.6 }}></i>
          </Link>
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '0.92rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <i className="fa-solid fa-store" style={{ width: '20px', textAlign: 'center', fontSize: '1rem' }}></i>
            <span style={{ flex: 1 }}>Customer Site</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem', opacity: 0.6 }}></i>
          </Link>
        </nav>

        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.78rem',
            color: '#64748b',
            lineHeight: 1.4,
          }}
        >
          <div>CampusBite v1.0.0</div>
          <div>College Project Edition</div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Sticky Bar */}
        <header
          style={{
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="admin-hamburger-btn"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {getPageTitle()}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-regular fa-calendar"></i>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f1f5f9',
                padding: '4px 12px 4px 6px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                {user.full_name}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ADMIN
              </span>
            </div>

            <button
              onClick={() => logout()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: '24px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
