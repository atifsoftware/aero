import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        marginTop: '6rem',
        padding: '4rem 0 2rem',
        backgroundColor: 'var(--card-bg)',
        borderTop: '1px solid var(--border-color)',
        fontFamily: "'Hind Siliguri', sans-serif",
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  border: '1.5px solid var(--adm-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src="/img/aero_logo.jpg"
                  alt="Aero MVC Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: "'Inter', sans-serif" }}>
                Aero <span style={{ color: 'var(--adm-primary)' }}>MVC</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              একটি শক্তিশালী, মডার্ন এবং অতি দ্রুতগতির Node.js এক্সপ্রেস 5 ফুল-স্ট্যাক MVC ফ্রেমওয়ার্ক।
              ক্লিন আর্কিটেকচার, দ্রুততম ডেটাবেজ ইঞ্জিন এবং এন্টারপ্রাইজ সিকিউরিটি প্রোটোকল দ্বারা নির্মিত।
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '1.2rem' }}>
              <span
                style={{
                  background: 'rgba(230, 81, 0, 0.1)',
                  color: 'var(--adm-primary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                v1.0.0 Stable
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                ● Express 5 Engine
              </span>
            </div>
          </div>

          {/* Framework Core Modules */}
          <div>
            <h5 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.2rem', fontSize: '1.05rem' }}>
              কোর আর্কিটেকচার
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-layer-group me-2 text-primary" style={{ fontSize: '11px' }}></i> MVC প্যাটার্ন ও কন্ট্রোলার
                </Link>
              </li>
              <li>
                <Link href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-database me-2 text-warning" style={{ fontSize: '11px' }}></i> হাই-স্পিড ডেটাবেজ পুলিং
                </Link>
              </li>
              <li>
                <Link href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-shield-alt me-2 text-success" style={{ fontSize: '11px' }}></i> RBAC ও টোকেন অথেনটিকেশন
                </Link>
              </li>
              <li>
                <Link href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-bug me-2 text-info" style={{ fontSize: '11px' }}></i> ইন্টেলিজেন্ট এরর ট্রেসার
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & System */}
          <div>
            <h5 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.2rem', fontSize: '1.05rem' }}>
              অ্যাডমিন ও ডেভেলপার টুলস
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-tachometer-alt me-2 text-warning" style={{ fontSize: '11px' }}></i> লাইভ অ্যাডমিন ড্যাশবোর্ড
                </Link>
              </li>
              <li>
                <Link href="/admin/users" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-users-cog me-2 text-info" style={{ fontSize: '11px' }}></i> ইউজার ও রোল ম্যানেজমেন্ট
                </Link>
              </li>
              <li>
                <Link href="/admin/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-sliders-h me-2 text-primary" style={{ fontSize: '11px' }}></i> সিস্টেম কনফিগারেশন
                </Link>
              </li>
              <li>
                <a href="http://localhost:3001/api/docs/" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-book-open me-2 text-success" style={{ fontSize: '11px' }}></i> FastAPI / Swagger এপিআই ডক্স
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Resources & Community */}
          <div>
            <h5 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.2rem', fontSize: '1.05rem' }}>
              রিসোর্স ও ডকুমেন্টেশন
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div>
                <i className="fas fa-terminal me-2 text-primary"></i> CLI Scaffolder & Code Generator
              </div>
              <div>
                <i className="fas fa-code-branch me-2 text-success"></i> Modular REST API & Web Routes
              </div>
              <div>
                <i className="fas fa-lock me-2 text-danger"></i> CSRF, Helmet & Rate Limiting Guards
              </div>
              <div>
                <i className="fas fa-file-code me-2 text-warning"></i> EJS & Next.js Hybrid Support
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} <strong>Aero MVC Framework</strong>. All rights reserved.
          </div>
          <div>
            Developed with <strong>Node.js Express 5</strong>, <strong>Next.js 14</strong>, and <strong>MySQL Database Engine</strong>.
          </div>
        </div>
      </div>
    </footer>
  );
}
