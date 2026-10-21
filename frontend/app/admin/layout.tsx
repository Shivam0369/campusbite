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
      <div className="admin-loading-screen">
        <i className="fa-solid fa-shield-halved fa-spin fa-2x"></i>
        <p className="mt-3">Verifying administrator credentials...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'fa-gauge-high' },
    { href: '/admin/orders', label: 'Orders', icon: 'fa-receipt' },
    { href: '/admin/menu-items', label: 'Menu Items', icon: 'fa-bowl-food' },
    { href: '/admin/categories', label: 'Categories', icon: 'fa-layer-group' },
    { href: '/admin/users', label: 'Users & Staff', icon: 'fa-users' },
    { href: '/admin/reports', label: 'Sales & Reports', icon: 'fa-chart-line' },
    { href: '/admin/ai-insights', label: 'AI Operations Insights', icon: 'fa-brain' },
    { href: '/admin/settings', label: 'Settings', icon: 'fa-gear' },
  ];

  return (
    <div className="admin-root-layout">
      {/* Left Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'admin-sidebar-mobile-open' : ''}`}>
        <div className="sidebar-brand-box">
          <span className="sidebar-brand-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </span>
          <div className="sidebar-brand-text">
            <span className="brand-name">CampusBite</span>
            <span className="brand-badge">ADMIN CONTROL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">CORE MANAGEMENT</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <i className={`fa-solid ${item.icon} nav-icon`}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="sidebar-section-title mt-4">OPERATIONS</div>
          <Link href="/staff" className="sidebar-nav-link" target="_blank">
            <i className="fa-solid fa-fire-burner nav-icon"></i>
            <span>Kitchen Display <i className="fa-solid fa-arrow-up-right-from-square external-icon"></i></span>
          </Link>
          <Link href="/menu" className="sidebar-nav-link" target="_blank">
            <i className="fa-solid fa-store nav-icon"></i>
            <span>Customer Kiosk <i className="fa-solid fa-arrow-up-right-from-square external-icon"></i></span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-version-badge">
            CampusBite v1.0.0
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Sticky Bar */}
        <header className="admin-topbar">
          <button
            className="admin-hamburger-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className="admin-topbar-title">
            Executive Control Panel
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-date-badge">
              <i className="fa-regular fa-calendar"></i> {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>

            <div className="admin-user-pill">
              <span className="avatar-dot">A</span>
              <span className="admin-name">{user.full_name}</span>
              <span className="admin-role-badge">ADMIN</span>
            </div>

            <button
              onClick={() => logout()}
              className="btn btn-outline-danger btn-sm"
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

