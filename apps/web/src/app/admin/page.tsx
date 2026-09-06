'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'ai'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/framework-stats');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setStats(data.stats);
          }
        }
      } catch (err) {
        // Fallback demo stats
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.data?.response) {
        setAiResponse(data.data.response);
      } else {
        setAiResponse(data.message || 'AI query executed.');
      }
    } catch (err: any) {
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const kpis = [
    { label: 'Total Users', value: stats?.usersCount ?? '1', change: 'Active in MySQL', isPositive: true },
    { label: 'Activity Logs', value: stats?.logsCount ?? '28', change: 'System Audited', isPositive: true },
    { label: 'Personal Tokens', value: stats?.tokensCount ?? '3', change: 'Active Auth Tokens', isPositive: true },
    { label: 'Server Memory', value: stats?.memoryUsage?.split('/')[0] ?? 'Online', change: 'Healthy', isPositive: true },
  ];

  const recentVouchers = [
    { id: 'VCH-1092', title: 'Office Electricity Bill', amount: '৳ 4,500', type: 'Expense', account: 'Cash In Hand' },
    { id: 'VCH-1091', title: 'Customer Sales Collection', amount: '৳ 32,000', type: 'Income', account: 'City Bank' },
    { id: 'VCH-1090', title: 'Packaging Materials', amount: '৳ 6,800', type: 'Expense', account: 'Cash In Hand' },
    { id: 'VCH-1089', title: 'Staff Daily Allowance', amount: '৳ 1,200', type: 'Expense', account: 'Cash Drawer' },
  ];

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Dashboard Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px' }}>
            NodeFlow ERP Admin Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time multi-store operations, voucher accounting, and Gemini AI insights.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-green" style={{ padding: '8px 16px' }}>● Express 4 Core</span>
          <span className="badge badge-cyan" style={{ padding: '8px 16px' }}>⚡ Fluent DB Engine</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 18px', fontSize: '0.9rem' }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={activeTab === 'vouchers' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 18px', fontSize: '0.9rem' }}
        >
          🧾 Vouchers
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 18px', fontSize: '0.9rem' }}
        >
          🤖 Gemini AI
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{kpi.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>{kpi.value}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              {kpi.change}
            </span>
          </div>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              System Diagnostics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Node.js Version</span>
                <span>{stats?.nodeVersion || process.version || 'v20.x'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Backend Engine</span>
                <span style={{ color: 'var(--accent-cyan)' }}>Express 4 MVC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Web Framework</span>
                <span style={{ color: 'var(--accent-emerald)' }}>Next.js 14 App Router (SSR)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cache Engine</span>
                <span>Redis Hybrid Driver</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              Quick ERP Operations
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Link href="/admin" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
                ➕ New Expense
              </Link>
              <Link href="/admin" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
                💵 Record Income
              </Link>
              <Link href="/admin" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
                👥 Customers
              </Link>
              <Link href="/admin" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
                📊 Daily Sheet
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Recent Accounting Vouchers
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Voucher No</th>
                  <th style={{ padding: '12px' }}>Description</th>
                  <th style={{ padding: '12px' }}>Account</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>{v.id}</td>
                    <td style={{ padding: '12px' }}>{v.title}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{v.account}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={v.type === 'Income' ? 'badge badge-green' : 'badge badge-purple'}>
                        {v.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{v.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: AI Assistant */}
      {activeTab === 'ai' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            🤖 Google Gemini AI Assistant
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Ask business questions, query expenses, or summarize financial health.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="e.g. আজকের মোট খরচ কত এবং কোন খাতে বেশি খরচ হয়েছে?"
              className="input-field"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            />
            <button
              onClick={handleAskAi}
              disabled={aiLoading}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>

          {aiResponse && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>AI Response:</p>
              <p>{aiResponse}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
