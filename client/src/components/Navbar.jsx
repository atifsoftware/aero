import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, Code } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="global-navbar">
      <div className="container nav-container">
        {/* Brand / Logo */}
        <Link to="/" className="logo-group">
          <div className="logo-icon">N</div>
          <span className="logo-text">NodeFlow</span>
        </Link>

        {/* Nav Links */}
        <div className="nav-links">
          <a 
            href="/api/docs" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-outline"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Code size={15} />
            <span>API Docs</span>
          </a>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/admin/dashboard" className="btn-outline">
                <LayoutDashboard size={16} />
                <span>ড্যাশবোর্ড</span>
              </Link>

              <span style={{
                background: 'rgba(14, 165, 233, 0.1)',
                color: '#0ea5e9',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'var(--font-bengali)'
              }}>
                {user.name || 'Admin'}
              </span>

              <button 
                onClick={onLogout} 
                className="btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOut size={14} />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-brand">
              <LogIn size={16} />
              <span>লগইন</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
