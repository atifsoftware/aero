import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Code, 
  LogOut, 
  Server, 
  Key, 
  History, 
  List, 
  Home, 
  RefreshCw,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/framework-stats');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setStats(data.stats);
          setLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar matching app/views/layouts/admin_header.ejs */}
      <aside className="adm-sidebar">
        {/* Brand */}
        <div className="adm-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              N
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>
              NodeFlow
            </div>
          </Link>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {(user?.name || 'Admin').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              Online
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="adm-nav">
          <button 
            className={`adm-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>হোম / ড্যাশবোর্ড</span>
          </button>

          <button 
            className={`adm-nav-item ${activeMenu === 'users' ? 'active' : ''}`}
            onClick={() => setActiveMenu('users')}
          >
            <Users size={18} />
            <span>ইউজার ব্যবস্থাপনা</span>
          </button>

          <button 
            className={`adm-nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={18} />
            <span>সেটিংস</span>
          </button>

          <a 
            href="/api/docs" 
            target="_blank" 
            rel="noreferrer" 
            className="adm-nav-item"
          >
            <Code size={18} />
            <span>Swagger এপিআই</span>
          </a>

          <Link to="/" className="adm-nav-item" style={{ marginTop: 'auto' }}>
            <Home size={18} />
            <span>ওয়েবসাইট হোম</span>
          </Link>

          <button 
            onClick={handleLogout} 
            className="adm-nav-item" 
            style={{ color: '#f43f5e' }}
          >
            <LogOut size={18} />
            <span>লগআউট</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="adm-main">
        {/* Header */}
        <header className="adm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white', margin: 0, fontFamily: 'var(--font-bengali)' }}>
              ড্যাশবোর্ড ওভারভিউ
            </h2>
            <span style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle size={12} />
              React + Express একই পোর্টে সচল
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={fetchStats} 
              disabled={loading}
              className="btn-outline" 
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </header>

        {/* Content Body matching app/views/admin/dashboard.ejs */}
        <main className="adm-content">
          {/* Row 1: 3 Widgets */}
          <div className="stat-grid">
            {/* Widget 1: Users */}
            <div className="stat-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h5 style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-bengali)', fontWeight: 600, fontSize: '1rem' }}>
                  মোট ব্যবহারকারী
                </h5>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} />
                </div>
              </div>
              <h2 style={{ color: 'white', fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: '2rem', margin: 0 }}>
                {stats?.usersCount ?? 1}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '5px 0 0 0', fontFamily: 'var(--font-bengali)' }}>
                সিস্টেমে নিবন্ধিত মোট অ্যাকাউন্টস
              </p>
            </div>

            {/* Widget 2: Tokens */}
            <div className="stat-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h5 style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-bengali)', fontWeight: 600, fontSize: '1rem' }}>
                  সক্রিয় এপিআই টোকেন
                </h5>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Key size={20} />
                </div>
              </div>
              <h2 style={{ color: 'white', fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: '2rem', margin: 0 }}>
                {stats?.tokensCount ?? 0}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '5px 0 0 0', fontFamily: 'var(--font-bengali)' }}>
                ব্যক্তিগত অ্যাক্সেস টোকেন সংখ্যা
              </p>
            </div>

            {/* Widget 3: Logs */}
            <div className="stat-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h5 style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-bengali)', fontWeight: 600, fontSize: '1rem' }}>
                  মোট সিস্টেম লগস
                </h5>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <History size={20} />
                </div>
              </div>
              <h2 style={{ color: 'white', fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: '2rem', margin: 0 }}>
                {stats?.logsCount ?? 0}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '5px 0 0 0', fontFamily: 'var(--font-bengali)' }}>
                মোট সংরক্ষিত ইউজার অ্যাক্টিভিটি
              </p>
            </div>
          </div>

          {/* Row 2: Diagnostics and Recent Logs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {/* Server stats */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h4 style={{
                color: '#0ea5e9',
                fontWeight: 700,
                fontSize: '1.2rem',
                fontFamily: 'var(--font-bengali)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Server size={18} />
                <span>সার্ভার এনভায়রনমেন্ট ডায়াগনস্টিক</span>
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', fontSize: '0.92rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600, width: '45%' }}>অপারেটিং সিস্টেম</td>
                    <td style={{ padding: '0.65rem 0', color: 'white' }}>{stats?.osType || 'Windows_NT'} ({stats?.osRelease || '10.0'})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600 }}>সিপিইউ মডেল</td>
                    <td style={{ padding: '0.65rem 0', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }} title={stats?.cpuModel}>
                      {stats?.cpuModel || '13th Gen Intel Core'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600 }}>সিপিইউ কোর সংখ্যা</td>
                    <td style={{ padding: '0.65rem 0', color: 'white' }}>{stats?.cpuCores || 16} Cores</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600 }}>সার্ভার মেমরি ব্যবহার</td>
                    <td style={{ padding: '0.65rem 0', color: 'white' }}>{stats?.memoryUsage || '4.5 GB Free / 15.7 GB Total'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600 }}>সার্ভার আপটাইম</td>
                    <td style={{ padding: '0.65rem 0', color: 'white' }}>{stats?.uptime || '2.4 Hours'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.65rem 0', color: '#94a3b8', fontWeight: 600 }}>Node.js ভার্সন</td>
                    <td style={{ padding: '0.65rem 0', color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {stats?.nodeVersion || 'v24.18.0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recent logs */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h4 style={{
                color: '#10b981',
                fontWeight: 700,
                fontSize: '1.2rem',
                fontFamily: 'var(--font-bengali)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <List size={18} />
                <span>সাম্প্রতিক অ্যাক্টিভিটি লগস</span>
              </h4>

              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 0', fontFamily: 'var(--font-bengali)' }}>
                  কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি।
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {logs.map((log, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: 'white', fontSize: '0.9rem', fontFamily: 'var(--font-bengali)' }}>
                          {log.user_name || 'System User'}
                        </strong>
                        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                        </small>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.85rem', fontFamily: 'var(--font-bengali)' }}>
                        {log.action} — {log.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
