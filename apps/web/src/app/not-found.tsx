import Link from 'next/link';

export default function NotFound() {
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
        <div style={{ color: '#f43f5e', fontSize: '4.5rem', marginBottom: '1.25rem' }}>
          <i className="fas fa-exclamation-triangle"></i>
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
          404
        </h1>
        <h3
          style={{
            fontWeight: 700,
            fontFamily: "'Hind Siliguri', sans-serif",
            fontSize: '1.5rem',
            marginBottom: '0.75rem',
          }}
        >
          পেজটি খুঁজে পাওয়া যায়নি
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
          আপনি যে লিংকটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা আর উপলব্ধ নেই।
        </p>
        <Link
          href="/"
          className="btn-primary"
          style={{
            borderRadius: '30px',
            padding: '0.75rem 2.2rem',
            fontSize: '1rem',
          }}
        >
          <i className="fas fa-home me-2"></i> হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
