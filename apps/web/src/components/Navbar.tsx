'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('site-theme') as 'light' | 'dark') || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const stored = localStorage.getItem('aero_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('site-theme', next);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('aero_token');
      localStorage.removeItem('aero_user');
      setUser(null);
      window.location.href = '/login';
    } catch (e) {}
  };

  return (
    <nav
      style={{
        backgroundColor: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.85rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand Logo & Name */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#0f172a',
              border: '1.5px solid var(--adm-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(230, 81, 0, 0.25)',
            }}
          >
            <img
              src="/img/aero_logo.jpg"
              alt="Aero MVC Framework"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.25rem',
                color: 'var(--text-main)',
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.1,
                letterSpacing: '-0.3px',
              }}
            >
              Aero <span style={{ color: 'var(--adm-primary)' }}>MVC</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Express 5 Enterprise Framework
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <Link
            href="/"
            style={{
              color: 'var(--text-main)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
              transition: 'color 0.15s',
            }}
          >
            হোম
          </Link>
          <Link
            href="#features"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'color 0.15s',
            }}
          >
            কোর ফিচারসমূহ
          </Link>
          <Link
            href="#architecture"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'color 0.15s',
            }}
          >
            আর্কিটেকচার
          </Link>
          <a
            href="http://localhost:3001/api/docs/"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>FastAPI / Swagger ডক্স</span>
            <i className="fas fa-external-link-alt" style={{ fontSize: '10px' }}></i>
          </a>
        </div>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              transition: 'all 0.2s',
            }}
            title={theme === 'dark' ? 'লাইট মোডে সুইচ করুন' : 'ডার্ক মোডে সুইচ করুন'}
          >
            <i className={theme === 'dark' ? 'fas fa-sun text-warning' : 'fas fa-moon'}></i>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/admin"
                className="btn shadow-sm"
                style={{
                  background: 'var(--adm-primary)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                }}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>ড্যাশবোর্ড</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '7px 14px',
                  fontSize: '13px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                লগআউট
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/login"
                style={{
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '8px 16px',
                }}
              >
                লগইন
              </Link>
              <Link
                href="/admin"
                className="btn shadow-sm"
                style={{
                  background: 'var(--adm-primary)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '8px 22px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(230, 81, 0, 0.35)',
                }}
              >
                <i className="fas fa-seedling"></i>
                <span>অ্যাডমিন প্রবেশ</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

