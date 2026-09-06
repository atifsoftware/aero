'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          background: 'rgba(30, 41, 59, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '3.5rem 2.5rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: '4.5rem', marginBottom: '1.25rem' }}>
          <i className="fas fa-bug"></i>
        </div>
        <h1
          style={{
            fontWeight: 800,
            fontSize: '3rem',
            fontFamily: "'Inter', sans-serif",
            margin: '0 0 0.75rem 0',
            background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          500
        </h1>
        <h3
          style={{
            fontWeight: 700,
            fontFamily: "'Hind Siliguri', sans-serif",
            fontSize: '1.5rem',
            marginBottom: '0.75rem',
          }}
        >
          অভ্যন্তরীণ সার্ভার ত্রুটি
        </h3>
        <p
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'Hind Siliguri', sans-serif",
            fontSize: '0.98rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          দুঃখিত, আমাদের সার্ভারে কোনো সমস্যা দেখা দিয়েছে। আমরা এটি সমাধান করার চেষ্টা করছি।
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            className="btn-secondary"
            style={{ borderRadius: '30px', padding: '0.75rem 1.8rem' }}
          >
            <i className="fas fa-redo-alt me-2"></i> পুনরায় চেষ্টা করুন
          </button>
          <Link
            href="/"
            className="btn-primary"
            style={{ borderRadius: '30px', padding: '0.75rem 1.8rem' }}
          >
            <i className="fas fa-home me-2"></i> হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
