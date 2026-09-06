import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Swagger & OpenAPI 3.0 Explorer',
  description: 'Interactive, auto-generated OpenAPI 3.0 documentation and real-time API tester for Aero MVC REST APIs.',
};

export default function ApiDocsPage() {
  return (
    <div className="container" style={{ padding: '30px 24px 60px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-cyan">OpenAPI 3.0</span>
            <span className="badge badge-green">⚡ 90 Auto-Generated Operations</span>
            <span className="badge badge-purple">Swagger UI 5.x</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Auto-Generated API Explorer
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Synchronized directly from Express 4 MVC router stack with schema auto-reflection and Bearer auth.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="http://localhost:3001/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
            style={{ fontSize: '0.88rem', padding: '10px 16px' }}
          >
            📋 Raw OpenAPI Spec (JSON)
          </a>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: '0.88rem', padding: '10px 16px' }}
          >
            ↗️ Open Fullscreen Swagger
          </a>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        padding: '14px 20px',
        marginBottom: '20px',
        background: 'rgba(14, 165, 233, 0.08)',
        border: '1px solid rgba(14, 165, 233, 0.25)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        color: '#e2e8f0',
      }}>
        <div>
          💡 <strong>Tip:</strong> Click the green <strong>Authorize 🔓</strong> button inside Swagger and enter your Bearer token (from <code>POST /api/login</code> or <code>node cli.js</code>) to execute protected endpoints live.
        </div>
        <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>
          Get Token →
        </Link>
      </div>

      {/* Embedded Swagger Frame */}
      <div style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        background: '#0a0e17',
        height: '820px',
      }}>
        <iframe
          src="http://localhost:3001/api/docs"
          title="Aero Swagger UI"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}
