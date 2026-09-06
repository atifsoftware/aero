'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        setSuccess('লগইন সফল হয়েছে। আপনাকে প্রবেশ করানো হচ্ছে...');
        if (data.token) {
          localStorage.setItem('aero_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('aero_user', JSON.stringify(data.user));
        }
        setTimeout(() => {
          router.push('/admin');
        }, 600);
      } else {
        setError(data.message || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (err) {
      setError('সার্ভারের সাথে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container animate-fade-in"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '3.5rem',
        marginBottom: '5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(30, 41, 59, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
              fontSize: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            <i className="fas fa-lock"></i>
          </div>
          <h3
            style={{
              fontWeight: 700,
              color: 'white',
              fontFamily: "'Hind Siliguri', sans-serif",
              fontSize: '1.6rem',
              marginBottom: '0.4rem',
            }}
          >
            অ্যাডমিন লগইন
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.92rem',
              fontFamily: "'Hind Siliguri', sans-serif",
            }}
          >
            আপনার ক্রেডেনশিয়াল ব্যবহার করে সিস্টেমে প্রবেশ করুন
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontFamily: "'Hind Siliguri', sans-serif",
              borderLeft: '4px solid #f43f5e',
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div
            style={{
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontFamily: "'Hind Siliguri', sans-serif",
              borderLeft: '4px solid #10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              style={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.9rem',
                fontFamily: "'Hind Siliguri', sans-serif",
              }}
            >
              ইউজারনেম
            </label>
            <input
              type="text"
              name="username"
              required
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control-premium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              style={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.9rem',
                fontFamily: "'Hind Siliguri', sans-serif",
              }}
            >
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control-premium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              marginTop: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i> অপেক্ষা করুন...
              </>
            ) : (
              'লগইন করুন'
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            fontFamily: "'Hind Siliguri', sans-serif",
          }}
        >
          ডিফল্ট ডেমো ক্রেডেনশিয়াল: <br />
          <strong style={{ color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>admin</strong> /{' '}
          <strong style={{ color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>admin123</strong>
        </div>
      </div>
    </div>
  );
}
