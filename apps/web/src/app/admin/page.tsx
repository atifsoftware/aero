'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [chartPeriod, setChartPeriod] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalRequests: '১২৮,৪৫০',
    activeSessions: '২৪',
    avgLatency: '১৮ ms',
    dbPoolActive: '৮ / ২০',
    memoryUsage: '২৪০ MB',
    totalEndpoints: '২৪',
    errorRate: '০.০২%',
    uptimeDays: '৯৯.৯৮%',
  };

  const systemAlerts = [
    { title: 'API Rate Limit', message: 'আইপি 192.168.1.105 থেকে স্বাভাবিকের চেয়ে বেশি রিকোয়েস্ট এসেছে (Throttle Active)', type: 'warning' },
    { title: 'Database Pool', message: 'কানেকশন পুল সুস্থভাবে কাজ করছে (৮টি কানেকশন সক্রিয়, ১২টি আইডল)', type: 'info' },
    { title: 'Automated Backup', message: 'আজকের ডেটাবেজ স্ন্যাপশট সফলভাবে ক্লাউডে ব্যাকআপ সম্পন্ন হয়েছে', type: 'success' },
  ];

  const recentApiLogs = [
    { method: 'GET', endpoint: '/api/users', status: '200 OK', latency: '12 ms', client: '127.0.0.1 (Web Admin)', time: '১ মিনিট আগে' },
    { method: 'POST', endpoint: '/api/auth/login', status: '200 OK', latency: '28 ms', client: '192.168.1.42 (Mobile)', time: '৩ মিনিট আগে' },
    { method: 'GET', endpoint: '/api/settings', status: '200 OK', latency: '6 ms', client: '127.0.0.1 (Frontend)', time: '৫ মিনিট আগে' },
    { method: 'POST', endpoint: '/api/users', status: '201 Created', latency: '34 ms', client: '127.0.0.1 (Web Admin)', time: '৮ মিনিট আগে' },
    { method: 'GET', endpoint: '/api/status', status: '200 OK', latency: '4 ms', client: 'UptimeBot Monitor', time: '১০ মিনিট আগে' },
    { method: 'GET', endpoint: '/api/vouchers', status: '401 Unauthorized', latency: '8 ms', client: 'Unknown IP', time: '১২ মিনিট আগে' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ===== 1. DASHBOARD GREETING HEADER ===== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Aero MVC সিস্টেম ড্যাশবোর্ড 🚀
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Node.js Express 5 • MySQL 8 Database • রিয়েল-টাইম পারফরম্যান্স ও ট্রাফিক মনিটরিং
          </p>
        </div>

        {/* Real-time Clock and Calendar Badge */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--adm-primary)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {timeStr || '09:00 PM'}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--card-shadow)',
              marginTop: '4px',
            }}
          >
            <i className="fas fa-calendar-alt text-primary" style={{ color: 'var(--adm-primary)' }}></i>
            <span>{dateStr || 'Today'}</span>
          </div>
        </div>
      </div>

      {/* ===== 2. SYSTEM HEALTH ALERT BANNER ===== */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          ></span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
            সমস্ত কোর সার্ভিস স্বাভাবিক:
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Express API Server (:3001) সক্রিয় • MySQL Pool স্বাভাবিক • Latency: ১৮ms • Uptime: ৯৯.৯৮%
          </span>
        </div>

        <a
          href="http://localhost:3001/api/docs/"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--adm-primary)',
            background: 'var(--card-bg)',
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>FastAPI Docs দেখুন</span>
          <i className="fas fa-external-link-alt" style={{ fontSize: '10px' }}></i>
        </a>
      </div>

      {/* ===== 3. SIX QUICK DEVELOPER & ADMIN SHORTCUT CARDS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '16px',
        }}
      >
        {/* 1. API Explorer */}
        <a
          href="http://localhost:3001/api/docs/"
          target="_blank"
          rel="noreferrer"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#3b82f6',
              '--card-hover-border': '#3b82f6',
              '--card-glow': 'rgba(59, 130, 246, 0.3)',
            } as React.CSSProperties
          }
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
            >
              <i className="fas fa-book-open"></i>
            </div>
            <span className="quick-action-badge">
              <i className="fas fa-external-link-alt" style={{ fontSize: '9px' }}></i> Docs
            </span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>API এক্সপ্লোরার</span>
              <i className="fas fa-arrow-right quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">Swagger লাইভ কনসোল</div>
          </div>
        </a>

        {/* 2. User & RBAC */}
        <Link
          href="/admin/users"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#06b6d4',
              '--card-hover-border': '#06b6d4',
              '--card-glow': 'rgba(6, 182, 212, 0.3)',
            } as React.CSSProperties
          }
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }}
            >
              <i className="fas fa-users-cog"></i>
            </div>
            <span className="quick-action-badge">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#06b6d4',
                  display: 'inline-block',
                }}
              ></span>
              RBAC
            </span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>ইউজার ও রোল</span>
              <i className="fas fa-chevron-right quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">RBAC এক্সেস কন্ট্রোল</div>
          </div>
        </Link>

        {/* 3. Connection Pool */}
        <a
          href="#db-pool"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#10b981',
              '--card-hover-border': '#10b981',
              '--card-glow': 'rgba(16, 185, 129, 0.3)',
            } as React.CSSProperties
          }
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <i className="fas fa-database"></i>
            </div>
            <span className="quick-action-badge">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                  display: 'inline-block',
                }}
              ></span>
              Active
            </span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>কানেকশন পুল</span>
              <i className="fas fa-chevron-right quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">MySQL ইঞ্জিন স্ট্যাটাস</div>
          </div>
        </a>

        {/* 4. Cache Flush */}
        <a
          href="#flush-cache"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#f59e0b',
              '--card-hover-border': '#f59e0b',
              '--card-glow': 'rgba(245, 158, 11, 0.3)',
            } as React.CSSProperties
          }
          onClick={(e) => {
            e.preventDefault();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('show-toast', {
                  detail: {
                    type: 'success',
                    title: 'ক্যাশ ফ্লাশ সম্পন্ন ⚡',
                    message: 'সিস্টেম ক্যাশ, কুয়েরি বাফার ও রাউট মেমোরি সফলভাবে রিসেট হয়েছে!',
                  },
                })
              );
            }
          }}
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <i className="fas fa-broom"></i>
            </div>
            <span className="quick-action-badge">1-Click</span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>ক্যাশ ফ্লাশ</span>
              <i className="fas fa-bolt quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">সিস্টেম মেমরি রিফ্রেশ</div>
          </div>
        </a>

        {/* 5. Error Tracker */}
        <a
          href="#error-logs"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#ef4444',
              '--card-hover-border': '#ef4444',
              '--card-glow': 'rgba(239, 68, 68, 0.3)',
            } as React.CSSProperties
          }
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
            >
              <i className="fas fa-bug"></i>
            </div>
            <span className="quick-action-badge" style={{ color: '#10b981' }}>
              0 Crit
            </span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>এরর ট্র্যাকার</span>
              <i className="fas fa-chevron-right quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">স্ট্যাক ট্রেস ও লগস</div>
          </div>
        </a>

        {/* 6. System Config */}
        <Link
          href="/admin/settings"
          className="quick-action-card"
          style={
            {
              '--card-top-bar': '#8b5cf6',
              '--card-hover-border': '#8b5cf6',
              '--card-glow': 'rgba(139, 92, 246, 0.3)',
            } as React.CSSProperties
          }
        >
          <div className="quick-action-top">
            <div
              className="quick-action-icon-box"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
            >
              <i className="fas fa-sliders-h"></i>
            </div>
            <span className="quick-action-badge">:3001</span>
          </div>
          <div className="quick-action-meta">
            <div className="quick-action-title">
              <span>সিস্টেম কনফিগ</span>
              <i className="fas fa-chevron-right quick-action-arrow"></i>
            </div>
            <div className="quick-action-subtitle">এনভায়রনমেন্ট ও পোর্ট</div>
          </div>
        </Link>
      </div>

      {/* ===== 4. FOUR LIVE METRIC KPI CARDS WITH PROGRESS BARS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1: Total API Requests */}
        <div className="live-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                TOTAL REQUESTS (আজকের রিকোয়েস্ট)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {stats.totalRequests}
              </div>
            </div>
            <div className="icon-circle bg-primary-soft">
              <i className="fas fa-network-wired text-primary"></i>
            </div>
          </div>
          <div className="stat-progress-bar">
            <div className="fill bg-primary" style={{ width: '88%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>↑ ১২.৮% গতকালের চেয়ে বেশি</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>৯৯.৮% 2xx Success</span>
          </div>
        </div>

        {/* Metric 2: Active Sessions */}
        <div className="live-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACTIVE SESSIONS (সক্রিয় ব্যবহারকারী)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0ea5e9', marginTop: '4px' }}>
                {stats.activeSessions} জন
              </div>
            </div>
            <div className="icon-circle bg-info-soft">
              <i className="fas fa-user-check text-info"></i>
            </div>
          </div>
          <div className="stat-progress-bar">
            <div className="fill bg-info" style={{ width: '65%', backgroundColor: '#0ea5e9' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>JWT / Bearer টোকেন সক্রিয়</span>
            <span style={{ color: '#0ea5e9', fontWeight: 700 }}>রিয়েল-টাইম</span>
          </div>
        </div>

        {/* Metric 3: Avg API Latency */}
        <div className="live-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AVG LATENCY (গড় রেসপন্স টাইম)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {stats.avgLatency}
              </div>
            </div>
            <div className="icon-circle bg-success-soft">
              <i className="fas fa-bolt text-success"></i>
            </div>
          </div>
          <div className="stat-progress-bar">
            <div className="fill bg-success" style={{ width: '18%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>নন-ব্লকিং ইভেন্ট লুপ</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>আল্ট্রাফাস্ট</span>
          </div>
        </div>

        {/* Metric 4: DB Connection Pool */}
        <div className="live-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                DATABASE POOL (কানেকশন পুল)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {stats.dbPoolActive}
              </div>
            </div>
            <div className="icon-circle bg-warning-soft">
              <i className="fas fa-database text-warning"></i>
            </div>
          </div>
          <div className="stat-progress-bar">
            <div className="fill bg-warning" style={{ width: '40%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>MySQL 8 InnoDB পুল</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>স্বাভাবিক</span>
          </div>
        </div>
      </div>

      {/* ===== 5. MAIN ANALYTICS GRID ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Left Column: API Traffic & Request Analysis Chart */}
        <div
          id="api-traffic"
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '24px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                এপিআই রিকোয়েস্ট অ্যানালিটিক্স
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                দৈনিক ট্রাফিক ও রিকোয়েস্ট ভলিউম গ্রাফ
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                background: 'var(--body-bg)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                style={{
                  background: chartPeriod === 'month' ? 'var(--adm-primary)' : 'transparent',
                  color: chartPeriod === 'month' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setChartPeriod('month')}
              >
                মাসিক
              </button>
              <button
                type="button"
                style={{
                  background: chartPeriod === 'week' ? 'var(--adm-primary)' : 'transparent',
                  color: chartPeriod === 'week' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setChartPeriod('week')}
              >
                সাপ্তাহিক
              </button>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
            {[45, 62, 58, 80, 72, 95, 88, 110, 102, 128, 115, 142].map((val, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${(val / 150) * 100}%`,
                    background: idx === 11 ? 'var(--adm-primary)' : 'rgba(230, 81, 0, 0.25)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.3s ease',
                  }}
                  title={`${val}k requests`}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '14px',
              marginTop: '10px',
              fontSize: '12.5px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>সর্বোচ্চ লোড: </span>
              <strong>১৪২k রিকোয়েস্ট/দিন</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>গড় সাকসেস রেট: </span>
              <strong style={{ color: '#10b981' }}>৯৯.৯৪%</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Server & Framework Engine Resources */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#ffffff',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                ENGINE RESOURCES
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ● Optimal
              </span>
            </div>

            <div style={{ fontSize: '30px', fontWeight: 800, fontFamily: "'Inter', sans-serif", color: '#ffffff' }}>
              Aero MVC 1.0.0
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
              Node.js v20+ • Express 5.0 • Fast Non-blocking Runtime
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>CPU লোড</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>১৮%</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>RAM ব্যবহার</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9', marginTop: '2px' }}>২৪০ MB</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>ইভেন্ট লুপ লেগ</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>১.২ ms</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>অ্যাক্টিভ রাউটস</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>২৪টি এন্ডপয়েন্ট</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <a
              href="http://localhost:3001/api/docs/"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                background: 'var(--adm-primary)',
                color: '#fff',
                padding: '9px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(230, 81, 0, 0.35)',
              }}
            >
              Swagger কনসোল
            </a>
            <Link
              href="/admin/settings"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '9px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              সেটিংস
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 6. RECENT API CALLS & AUDIT LOG TABLE ===== */}
      <div
        id="endpoints"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              সাম্প্রতিক এপিআই কল ও ট্রাফিক লগ
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              রিয়েল-টাইম মেথড, স্ট্যাটাস ও রেসপন্স টাইম মনিটরিং
            </div>
          </div>

          <a
            href="http://localhost:3001/api/docs/"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--adm-primary)',
              textDecoration: 'none',
            }}
          >
            সম্পূর্ণ এপিআই ডক্স দেখুন <i className="fas fa-arrow-right ms-1"></i>
          </a>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--body-bg)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>মেথড</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>এন্ডপয়েন্ট রুট</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>স্ট্যাটাস কোড</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>রেসপন্স লেটেন্সি</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>ক্লায়েন্ট হোস্ট</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {recentApiLogs.map((log, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '11px',
                        background:
                          log.method === 'GET'
                            ? 'rgba(14, 165, 233, 0.15)'
                            : log.method === 'POST'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                        color:
                          log.method === 'GET'
                            ? '#0ea5e9'
                            : log.method === 'POST'
                            ? '#10b981'
                            : '#f43f5e',
                      }}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: "'Consolas', monospace" }}>
                    {log.endpoint}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: log.status.includes('200') || log.status.includes('201')
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                        color: log.status.includes('200') || log.status.includes('201') ? '#10b981' : '#ef4444',
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>
                    {log.latency}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {log.client}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {log.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
