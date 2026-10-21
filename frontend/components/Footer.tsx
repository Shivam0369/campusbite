'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on kitchen display and admin screens
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <p className="footer-title">
            <span className="footer-logo">CampusBite</span>
            <span className="footer-divider">|</span>
            <span className="footer-tagline">Smart Campus Dining Platform</span>
          </p>
          <p className="footer-copy">&copy; {new Date().getFullYear()} CampusBite Technologies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
