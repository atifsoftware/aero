import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && (data.status === 'success' || data.success || data.token)) {
        // Save user & token
        const userData = data.user || { name: username, username, role: 'admin' };
        if (data.token) {
          localStorage.setItem('nodeflow_token', data.token);
        }
        localStorage.setItem('nodeflow_user', JSON.stringify(userData));
        onLoginSuccess(userData);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (err) {
      // If API login is in demo mode, mock fallback for local dev
      if (username === 'admin' && password === 'admin123') {
        const demoUser = { name: 'System Administrator', username: 'admin', role: 'admin' };
        localStorage.setItem('nodeflow_user', JSON.stringify(demoUser));
        onLoginSuccess(demoUser);
        navigate('/admin/dashboard');
      } else {
        setError('সার্ভারে সংযোগ করা সম্ভব হচ্ছে না। অনুগ্রহ করে ব্যাকএন্ড চেক করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem', marginBottom: '5rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '1.25rem',
            fontSize: '0.9rem' 
          }}
        >
          <ArrowLeft size={16} />
          <span>হোমে ফিরে যান</span>
        </Link>

        <div 
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '1rem',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.35)'
              }}
            >
              <Lock size={22} />
            </div>
            <h3 style={{ fontWeight: 700, color: 'white', fontFamily: 'var(--font-bengali)', fontSize: '1.5rem', marginBottom: '0.35rem' }}>
              অ্যাডমিন লগইন
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-bengali)' }}>
              আপনার ক্রেডেনশিয়াল ব্যবহার করে সিস্টেমে প্রবেশ করুন
            </p>
          </div>

          {/* Flash / Error notification */}
          {error && (
            <div 
              style={{
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-bengali)',
                borderLeft: '4px solid #f43f5e',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-bengali)' }}>
                ইউজারনেম
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                placeholder="admin"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  color: 'white',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-bengali)' }}>
                পাসওয়ার্ড
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  color: 'white',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '10px',
                fontWeight: 700,
                color: 'white',
                fontFamily: 'var(--font-bengali)',
                marginTop: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.35)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <span>লগইন করুন</span>
              )}
            </button>
          </form>

          {/* Demo Hint */}
          <div 
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-bengali)',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            ডিফল্ট ডেমো ক্রেডেনশিয়াল: <br />
            <strong style={{ color: '#fff' }}>admin</strong> / <strong style={{ color: '#fff' }}>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
