import Link from 'next/link';

// Server-Side Data Fetching (SSR) for Instant SEO & Crawlability
async function getBackendStatus() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/status', {
      cache: 'no-store', // Always fresh SSR
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // If backend isn't up during static build, return safe fallback
  }
  return { status: 'standby', message: 'Express Core Ready on port :3001' };
}

export default async function HomePage() {
  const backendStatus = await getBackendStatus();

  const architecture = [
    {
      title: 'Express.js 4 MVC Backend',
      desc: 'Supercharged Node.js core with custom Fluent QueryBuilder, raw SQL speed, Redis hybrid caching, persistent MySQL queue, and Google Gemini AI.',
      port: ':3001',
      badge: 'backend',
    },
    {
      title: 'Next.js 14 Web & Admin',
      desc: 'App Router, React Server Components (RSC), SSR, and search engine optimization (SEO) metadata tags ensuring zero indexability issues.',
      port: ':3000',
      badge: 'web',
    },
    {
      title: 'React Native (Expo) Mobile',
      desc: 'Cross-platform iOS and Android mobile app sharing unified TypeScript contracts and REST endpoints.',
      port: ':8081',
      badge: 'mobile',
    },
    {
      title: '@nodeflow/shared Package',
      desc: 'Single source of truth for API endpoints, constants, user roles, and data contract interfaces.',
      port: 'Shared',
      badge: 'package',
    },
  ];

  const features = [
    { icon: '⚡', title: 'Fluent Query Builder', text: 'Laravel-like database operations with raw SQL performance and slow-query auditing.' },
    { icon: '🚀', title: 'Redis Hybrid Cache', text: 'Ultra-fast memory caching with zero-downtime file storage fallback.' },
    { icon: '🤖', title: 'Google Gemini AI', text: 'Automated executive financial summaries, query intelligence, and assistant responses.' },
    { icon: '📦', title: 'Persistent Job Queue', text: 'MySQL-backed background queue with automated retry backoff and failed jobs tracking.' },
    { icon: '🛡️', title: 'Declarative Validation', text: 'Clean middleware validating request fields and returning standard HTTP 422 errors.' },
    { icon: '🔍', title: '100% SEO Ready', text: 'Server-Side Rendering (SSR) delivers fully pre-rendered HTML to search engines immediately.' },
  ];

  return (
    <div className="container" style={{ padding: '60px 24px 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '70px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="badge badge-cyan">
            🚀 Full-Stack Multi-Platform Monorepo
          </span>
          <span className="badge badge-green">
            ● {backendStatus.status === 'success' ? 'Backend Live (:3001)' : 'Ready (:3001)'}
          </span>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          NodeFlow Enterprise Platform
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '750px',
          margin: '0 auto 36px',
        }}>
          A unified, high-performance architecture combining <strong>Express.js 4 MVC</strong>, <strong>Next.js 14 App Router (SSR)</strong> for perfect SEO, and <strong>React Native (Expo)</strong> for mobile.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn-primary">
            Launch Admin ERP Dashboard →
          </Link>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            View Swagger API Docs
          </a>
        </div>
      </section>

      {/* Multi-Platform Architecture Grid */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Multi-Platform Stack Architecture
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {architecture.map((item, idx) => (
            <article key={idx} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-purple">{item.badge}</span>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{item.port}</code>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Supercharged Core Features */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Supercharged Engine Capabilities
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {features.map((feat, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {feat.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
