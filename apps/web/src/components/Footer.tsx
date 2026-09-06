import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '40px 0',
      marginTop: '80px',
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>NodeFlow Enterprise Platform</p>
          <p style={{ marginTop: '4px' }}>
            Express 4 MVC Core Engine &bull; Next.js 14 SSR Web &bull; React Native Expo Mobile
          </p>
        </div>
        <div>
          <p>© {new Date().getFullYear()} NodeFlow Framework. MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
