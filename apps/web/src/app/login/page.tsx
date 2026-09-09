'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
    setDemoNotice(true);
    setTimeout(() => setDemoNotice(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && (data.status === 'success' || data.success)) {
        setSuccess('লগইন সফল হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');
        if (data.token) {
          localStorage.setItem('aero_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('aero_user', JSON.stringify(data.user));
        }
        setTimeout(() => {
          router.push('/admin');
        }, 700);
      } else {
        setError(data.message || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (err) {
      setError('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। সার্ভার সচল আছে কিনা তা নিশ্চিত করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Dynamic Ambient Background Glows */}
      <div className="auth-ambient-glow-1" />
      <div className="auth-ambient-glow-2" />

      <div className="auth-card-container animate-fade-in">
        <div className="auth-glass-card">
          {/* Header & Logo */}
          <div className="auth-header">
            <div className="auth-logo-badge">
              <i className="fas fa-shield-halved"></i>
            </div>
            
            <div style={{ marginBottom: '0.4rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(255, 109, 0, 0.12)',
                  color: 'var(--adm-primary)',
                  border: '1px solid rgba(255, 109, 0, 0.25)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                <i className="fas fa-lock" style={{ fontSize: '10px' }}></i>
                নিরাপদ অ্যাডমিন পোর্টাল
              </span>
            </div>

            <h1 className="auth-title">
              অ্যাডমিন <span style={{ color: 'var(--adm-primary)' }}>লগইন</span>
            </h1>
            <p className="auth-subtitle">
              Aero MVC কন্ট্রোল প্যানেলে প্রবেশ করতে আপনার তথ্য প্রদান করুন
            </p>
          </div>

          {/* Error notification alert */}
          {error && (
            <div
              style={{
                borderRadius: '12px',
                fontSize: '0.9rem',
                borderLeft: '4px solid #f43f5e',
                background: 'rgba(244, 63, 94, 0.12)',
                color: '#f43f5e',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              <i className="fas fa-circle-exclamation" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              <div style={{ flex: 1, lineHeight: 1.4 }}>{error}</div>
            </div>
          )}

          {/* Success notification alert */}
          {success && (
            <div
              style={{
                borderRadius: '12px',
                fontSize: '0.9rem',
                borderLeft: '4px solid #10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              <i className="fas fa-circle-check" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              <div style={{ flex: 1, lineHeight: 1.4 }}>{success}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="username">
                <span>ইউজারনেম অথবা ইমেইল</span>
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-user auth-input-icon"></i>
                <input
                  id="username"
                  type="text"
                  name="username"
                  required
                  placeholder="admin বা admin@aeromvc.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="auth-input-field"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="password">
                <span>পাসওয়ার্ড</span>
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-field"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-pwd"
                  title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  aria-label="পাসওয়ার্ড দৃশ্যমানতা পরিবর্তন করুন"
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="auth-options-row">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>আমাকে মনে রাখুন</span>
              </label>
              <button
                type="button"
                onClick={() => alert('পাসওয়ার্ড রিকভারির জন্য অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।')}
                className="auth-forgot-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>লগইন করুন</span>
                  <i className="fas fa-arrow-right" style={{ fontSize: '0.9rem' }}></i>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="auth-demo-box">
            <div className="auth-demo-header">
              <span className="auth-demo-title">
                <i className="fas fa-key" style={{ color: 'var(--adm-primary)' }}></i>
                ডিফল্ট ডেমো ক্রেডেনশিয়াল
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="auth-demo-autofill-btn"
                title="১-ক্লিকে ফিল করুন"
              >
                <i className="fas fa-bolt"></i>
                {demoNotice ? 'পূরণ হয়েছে!' : 'অটো-ফিল করুন'}
              </button>
            </div>
            <div className="auth-demo-credentials">
              <span>
                ইউজার: <strong style={{ color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>admin</strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>
                পাসওয়ার্ড: <strong style={{ color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>admin123</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="auth-security-badges">
          <div className="auth-security-item">
            <i className="fas fa-shield-halved" style={{ color: '#10b981' }}></i>
            <span>২৫৬-বিট এসএসএল সুরক্ষিত</span>
          </div>
          <span>•</span>
          <div className="auth-security-item">
            <i className="fas fa-fingerprint" style={{ color: '#38bdf8' }}></i>
            <span>সিকিউর সেশন গার্ড</span>
          </div>
          <span>•</span>
          <div className="auth-security-item">
            <i className="fas fa-user-shield" style={{ color: 'var(--adm-primary)' }}></i>
            <span>RBAC প্রোটেক্টেড</span>
          </div>
        </div>

        {/* Back to Home Link */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="auth-back-link">
            <i className="fas fa-arrow-left"></i>
            <span>মূল পাতায় ফিরে যান</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
