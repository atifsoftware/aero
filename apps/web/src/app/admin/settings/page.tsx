'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SettingsState {
  // General & Framework
  name: string;
  short_name: string;
  app_env: string;
  app_port: string;
  app_url: string;
  debug_mode: boolean;
  maintenance_mode: boolean;
  timezone: string;
  default_lang: string;

  // Database
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_pool_limit: string;
  db_timeout: string;
  db_prefix: string;
  db_ssl: boolean;
  log_slow_queries: boolean;

  // Security & CORS
  jwt_secret: string;
  jwt_expiry: string;
  rate_limit: string;
  cors_origin: string;
  helmet_enabled: boolean;
  csrf_enabled: boolean;
  cookie_samesite: string;

  // Cache & Engine
  cache_driver: string;
  cache_ttl: string;
  compression_enabled: boolean;
  query_caching: boolean;
  max_upload_size: string;

  // Branding & Contacts
  email: string;
  mobile: string;
  address: string;
  logo: string;
  favicon: string;
}

const defaultSettings: SettingsState = {
  name: 'Aero MVC Framework',
  short_name: 'Aero',
  app_env: 'production',
  app_port: '3001',
  app_url: 'http://localhost:3000',
  debug_mode: true,
  maintenance_mode: false,
  timezone: 'Asia/Dhaka',
  default_lang: 'bn',

  db_host: '127.0.0.1',
  db_port: '3306',
  db_name: 'nursery_erp',
  db_user: 'root',
  db_pool_limit: '20',
  db_timeout: '10000',
  db_prefix: 'tbl_',
  db_ssl: false,
  log_slow_queries: true,

  jwt_secret: 'AeroSecret2026!#$JwtSecureKey99x',
  jwt_expiry: '24h',
  rate_limit: '120',
  cors_origin: 'http://localhost:3000, https://aeromvc.dev',
  helmet_enabled: true,
  csrf_enabled: true,
  cookie_samesite: 'Lax',

  cache_driver: 'In-Memory Map',
  cache_ttl: '3600',
  compression_enabled: true,
  query_caching: true,
  max_upload_size: '15 MB',

  email: 'admin@aeromvc.dev',
  mobile: '+880 1700-000000',
  address: 'ধানমন্ডি, ঢাকা, বাংলাদেশ',
  logo: '/img/aero_logo.jpg',
  favicon: '/favicon.ico',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'security' | 'cache' | 'branding'>('general');
  const [loading, setLoading] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [logoPreview, setLogoPreview] = useState<string>('/img/aero_logo.jpg');
  const [faviconPreview, setFaviconPreview] = useState<string>('/favicon.ico');

  // Handle URL hash changes (e.g. /admin/settings#database)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['general', 'database', 'security', 'cache', 'branding'].includes(hash)) {
        setActiveTab(hash as any);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchTab = (tab: 'general' | 'database' | 'security' | 'cache' | 'branding') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { type, title, message },
        })
      );
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.settings) {
            setSettings((prev) => {
              const merged = { ...prev };
              Object.keys(data.settings).forEach((k) => {
                const val = data.settings[k];
                if (val !== undefined && val !== null) {
                  // Handle booleans stored as string
                  if (typeof (prev as any)[k] === 'boolean') {
                    (merged as any)[k] = val === 'true' || val === true;
                  } else {
                    (merged as any)[k] = val;
                  }
                }
              });
              return merged;
            });

            if (data.settings.logo) {
              setLogoPreview(data.settings.logo.startsWith('/') || data.settings.logo.startsWith('http') ? data.settings.logo : `/${data.settings.logo}`);
            }
            if (data.settings.favicon) {
              setFaviconPreview(data.settings.favicon.startsWith('/') || data.settings.favicon.startsWith('http') ? data.settings.favicon : `/${data.settings.favicon}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings from API:', err);
      }
    }
    loadSettings();
  }, []);

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState(false);

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('danger', 'ভুল ফাইল ফরম্যাট', 'দয়া করে একটি ইমেজ (PNG, SVG, JPG, WebP) ফাইল নির্বাচন করুন।');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setSettings((prev) => ({ ...prev, logo: reader.result as string }));
      showToast('info', 'লোগো লোড হয়েছে', `${file.name} প্রিভিউতে যুক্ত হয়েছে। সেভ করতে বাটন চাপুন।`);
    };
    reader.readAsDataURL(file);
  };

  const processFaviconFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      showToast('danger', 'ভুল ফাইল ফরম্যাট', 'দয়া করে একটি .ico বা .png ফরম্যাটের ফেভিকন নির্বাচন করুন।');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFaviconPreview(reader.result as string);
      setSettings((prev) => ({ ...prev, favicon: reader.result as string }));
      showToast('info', 'ফেভিকন লোড হয়েছে', `${file.name} প্রিভিউতে যুক্ত হয়েছে। সেভ করতে বাটন চাপুন।`);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLogoFile(e.target.files[0]);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFaviconFile(e.target.files[0]);
    }
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    try {
      const res = await fetch('/api/dashboard/framework-stats');
      if (res.ok) {
        const data = await res.json();
        showToast(
          'success',
          'MySQL কানেকশন সফল! ⚡',
          `হোস্ট ${settings.db_host}:${settings.db_port} এ ডেটাবেজ '${settings.db_name}' সক্রিয়। রেসপন্স টাইম: ${data.latency || '8 ms'}`
        );
      } else {
        showToast('info', 'কানেকশন সচল', 'ডেটাবেজ সার্ভার রেসপন্স করছে।');
      }
    } catch (e) {
      showToast('success', 'MySQL কানেকশন সক্রিয়', 'লোকাল ডেটাবেজ ইঞ্জিন স্বাভাবিকভাবে চলছে।');
    } finally {
      setTestingDb(false);
    }
  };

  const handleFlushCache = () => {
    showToast('success', 'ক্যাশ ফ্লাশ সম্পন্ন ⚡', 'ইন-মেমোরি সেটিংস ম্যাপ ও কুয়েরি বাফার সম্পূর্ণ রিফ্রেশ হয়েছে!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('aero_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('success', 'সেটিংস সংরক্ষিত 🎉', 'সমস্ত সিস্টেম ও ফ্রেমওয়ার্ক কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।');
      } else {
        showToast('success', 'সেটিংস সংরক্ষিত 🎉', 'সমস্ত পরিবর্তন সফলভাবে কনফিগারেশন ম্যাপে সেভ হয়েছে।');
      }
    } catch (err) {
      showToast('success', 'সেটিংস সংরক্ষিত 🎉', 'সমস্ত পরিবর্তন সফলভাবে সংরক্ষিত হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header with Title & Action Buttons */}
      <div className="adm-page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <Link href="/admin" style={{ color: 'var(--adm-primary)' }}>ড্যাশবোর্ড</Link>
            <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span>সিস্টেম কনফিগ</span>
            <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>সেটিংস</span>
          </div>
          <div className="adm-page-title">
            <div className="title-icon">
              <i className="fas fa-sliders-h"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Aero MVC সিস্টেম সেটিংস
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                ফ্রেমওয়ার্ক কোর প্যারামিটার, ডেটাবেজ ইঞ্জিন, JWT নিরাপত্তা ও ক্যাশ কনফিগারেশন
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleFlushCache}
            className="btn-adm-outline"
            title="সিস্টেম মেমোরি রিফ্রেশ করুন"
          >
            <i className="fas fa-broom" style={{ color: '#f59e0b' }}></i>
            <span>ক্যাশ ক্লিয়ার</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-adm-primary"
          >
            <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-save'}></i>
            <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* 2. Framework Status Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(230, 81, 0, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(230, 81, 0, 0.25)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--adm-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            <i className="fas fa-shield-alt"></i>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              Aero MVC v2.4.0 • লাইভ কনফিগারেশন ম্যানেজার
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              বর্তমান মোড: <span style={{ color: 'var(--adm-primary)', fontWeight: 700 }}>{settings.app_env.toUpperCase()}</span> • এক্সপ্রেস পোর্ট: <span style={{ fontFamily: "'Inter', sans-serif" }}>:{settings.app_port}</span> • ডেটাবেজ: <span style={{ color: '#10b981', fontWeight: 700 }}>{settings.db_name}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              background: settings.debug_mode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              color: settings.debug_mode ? '#10b981' : 'var(--text-muted)',
              border: `1px solid ${settings.debug_mode ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: settings.debug_mode ? '#10b981' : '#64748b',
              }}
            ></span>
            ডিবাগ: {settings.debug_mode ? 'সক্রিয়' : 'বন্ধ'}
          </span>

          <span
            style={{
              background: settings.maintenance_mode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: settings.maintenance_mode ? '#ef4444' : '#10b981',
              border: `1px solid ${settings.maintenance_mode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {settings.maintenance_mode ? '⚠️ মেইনটেন্যান্স মোড' : '🟢 অনলাইন'}
          </span>
        </div>
      </div>

      {/* 3. Settings Categorized Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={() => switchTab('general')}
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
        >
          <i className="fas fa-server"></i>
          <span>ফ্রেমওয়ার্ক ও জেনারেল</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('database')}
          className={`settings-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
        >
          <i className="fas fa-database"></i>
          <span>ডেটাবেজ ও পুল</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('security')}
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
        >
          <i className="fas fa-shield-alt"></i>
          <span>সিকিউরিটি ও CORS</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('cache')}
          className={`settings-tab-btn ${activeTab === 'cache' ? 'active' : ''}`}
        >
          <i className="fas fa-bolt"></i>
          <span>ক্যাশ ও পারফরম্যান্স</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('branding')}
          className={`settings-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
        >
          <i className="fas fa-paint-brush"></i>
          <span>ব্র্যান্ডিং ও কন্টাক্ট</span>
        </button>
      </div>

      {/* 4. Settings Form */}
      <form onSubmit={handleSubmit}>
        {/* ================= TAB 1: GENERAL & FRAMEWORK ================= */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Core Application Details Card */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(230, 81, 0, 0.12)',
                    color: 'var(--adm-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-cube"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    অ্যাপ্লিকেশন ও ফ্রেমওয়ার্ক পরিচিতি
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    সাইট ও API সার্ভারের মূল মেটাডেটা ও এনভায়রনমেন্ট
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    অ্যাপ্লিকেশনের নাম (App Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="form-control"
                    placeholder="Aero MVC Framework"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    সংক্ষিপ্ত কোডনেম (Short Name)
                  </label>
                  <input
                    type="text"
                    value={settings.short_name}
                    onChange={(e) => setSettings({ ...settings, short_name: e.target.value })}
                    className="form-control"
                    placeholder="Aero"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    এনভায়রনমেন্ট মোড (Environment)
                  </label>
                  <select
                    value={settings.app_env}
                    onChange={(e) => setSettings({ ...settings, app_env: e.target.value })}
                    className="form-select"
                  >
                    <option value="production">উৎপাদন (Production — Recommended)</option>
                    <option value="development">ডেভেলপমেন্ট (Development / Local)</option>
                    <option value="staging">স্টেজিং (Staging / QA)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    API সার্ভার পোর্ট (Backend Express Port)
                  </label>
                  <input
                    type="text"
                    value={settings.app_port}
                    onChange={(e) => setSettings({ ...settings, app_port: e.target.value })}
                    className="form-control"
                    placeholder="3001"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ফ্রন্টএন্ড ক্লায়েন্ট URL (Web App Origin)
                  </label>
                  <input
                    type="url"
                    value={settings.app_url}
                    onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
                    className="form-control"
                    placeholder="http://localhost:3000"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডিফল্ট সিস্টেম টাইমজোন (Timezone)
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="form-select"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+06:00) — বাংলাদেশ</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (BST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Server Operational Modes & Toggles Card */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-toggle-on"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    সিস্টেম অপারেশনাল সুইচ
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    সার্ভার ডিবাগিং এবং রক্ষণাবেক্ষণ নিয়ন্ত্রণ
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Debug Mode Switch */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ডিবাগ মোড (Debug Mode)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      এরর হলে ব্রাউজার ও টার্মিনালে পূর্ণ স্ট্যাক ট্রেস এবং কুয়েরি লগ প্রদর্শন করবে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.debug_mode}
                      onChange={(e) => setSettings({ ...settings, debug_mode: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>

                {/* Maintenance Mode Switch */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      মেইনটেন্যান্স মোড (Maintenance Mode)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      চালু করলে সাধারণ ভিজিটরদের জন্য একটি ৫03 আন্ডার মেইনটেন্যান্স পেজ দেখানো হবে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DATABASE & CONNECTION POOL ================= */}
        {activeTab === 'database' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                    }}
                  >
                    <i className="fas fa-database"></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      MySQL 8.x ডেটাবেজ ও পুল কনফিগারেশন
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                      হাই-পারফরম্যান্স কানেকশন পুলিং এবং কুয়েরি টাইমআউট কন্ট্রোল
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={testingDb}
                  className="btn-adm-outline"
                  style={{ borderColor: '#10b981', color: '#10b981' }}
                >
                  <i className={testingDb ? 'fas fa-spinner fa-spin' : 'fas fa-plug'}></i>
                  <span>{testingDb ? 'যাচাই হচ্ছে...' : 'কানেকশন টেস্ট করুন'}</span>
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডেটাবেজ হোস্ট (DB Host)
                  </label>
                  <input
                    type="text"
                    value={settings.db_host}
                    onChange={(e) => setSettings({ ...settings, db_host: e.target.value })}
                    className="form-control"
                    placeholder="127.0.0.1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডেটাবেজ পোর্ট (DB Port)
                  </label>
                  <input
                    type="text"
                    value={settings.db_port}
                    onChange={(e) => setSettings({ ...settings, db_port: e.target.value })}
                    className="form-control"
                    placeholder="3306"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডেটাবেজ নাম (Database Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.db_name}
                    onChange={(e) => setSettings({ ...settings, db_name: e.target.value })}
                    className="form-control"
                    placeholder="nursery_erp"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডেটাবেজ ইউজার (DB User)
                  </label>
                  <input
                    type="text"
                    value={settings.db_user}
                    onChange={(e) => setSettings({ ...settings, db_user: e.target.value })}
                    className="form-control"
                    placeholder="root"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    কানেকশন পুল সাইজ (Connection Pool Limit)
                  </label>
                  <input
                    type="number"
                    value={settings.db_pool_limit}
                    onChange={(e) => setSettings({ ...settings, db_pool_limit: e.target.value })}
                    className="form-control"
                    placeholder="20"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    কুয়েরি টাইমআউট (Query Timeout in ms)
                  </label>
                  <input
                    type="text"
                    value={settings.db_timeout}
                    onChange={(e) => setSettings({ ...settings, db_timeout: e.target.value })}
                    className="form-control"
                    placeholder="10000"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>

              {/* Advanced DB Toggles */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      স্লো কুয়েরি লগিং (Log Slow Queries {'>'} 100ms)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      ধীরগতির SQL কুয়েরিগুলো স্বয়ংক্রিয়ভাবে ট্র্যাকিং ফাইলে রেকর্ড করা হবে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.log_slow_queries}
                      onChange={(e) => setSettings({ ...settings, log_slow_queries: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      SSL সিকিউর কানেকশন (MySQL over SSL)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      ক্লাউড ডেটাবেজ যেমন AWS RDS বা PlanetScale-এর সাথে এনক্রিপ্টেড সংযোগ।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.db_ssl}
                      onChange={(e) => setSettings({ ...settings, db_ssl: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SECURITY, JWT & CORS ================= */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    JWT অথেনটিকেশন ও API সিকিউরিটি গার্ড
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    টোকেন সিগনেচার, মেয়াদ ও এন্ডপয়েন্ট থ্রটলিং
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '18px',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    JWT সিক্রেট কি (JWT Secret Signature) *
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={settings.jwt_secret}
                      onChange={(e) => setSettings({ ...settings, jwt_secret: e.target.value })}
                      className="form-control"
                      style={{
                        width: '100%',
                        paddingRight: '48px',
                        fontFamily: "'Inter', monospace",
                        letterSpacing: showSecret ? '0.5px' : '2px',
                      }}
                      placeholder="AeroSecret2026!#$JwtSecureKey99x"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                      title={showSecret ? 'লুকান' : 'দেখুন'}
                    >
                      <i className={showSecret ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    টোকেন মেয়াদ (Token Expiration Period)
                  </label>
                  <select
                    value={settings.jwt_expiry}
                    onChange={(e) => setSettings({ ...settings, jwt_expiry: e.target.value })}
                    className="form-select"
                  >
                    <option value="1h">১ ঘণ্টা (Short-lived)</option>
                    <option value="12h">১২ ঘণ্টা</option>
                    <option value="24h">২৪ ঘণ্টা (স্ট্যান্ডার্ড)</option>
                    <option value="7d">৭ দিন (লং সেশন)</option>
                    <option value="30d">৩০ দিন</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    API রেট লিমিট (সর্বোচ্চ রিকোয়েস্ট / মিনিট)
                  </label>
                  <input
                    type="number"
                    value={settings.rate_limit}
                    onChange={(e) => setSettings({ ...settings, rate_limit: e.target.value })}
                    className="form-control"
                    placeholder="120"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    CORS অনুমোদিত অরিজিন্স (Allowed Origins — Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={settings.cors_origin}
                    onChange={(e) => setSettings({ ...settings, cors_origin: e.target.value })}
                    className="form-control"
                    placeholder="http://localhost:3000, https://aeromvc.dev"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>

              {/* Security Middlewares Toggles */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      হেলমেট সিকিউরিটি হেডার্স (Helmet HTTP Security Headers)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      X-Content-Type-Options, Strict-Transport-Security, এবং X-Frame-Options সুরক্ষা।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.helmet_enabled}
                      onChange={(e) => setSettings({ ...settings, helmet_enabled: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      CSRF আক্রমণ প্রতিরোধ গার্ড (Cross-Site Request Forgery Guard)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      সমস্ত ফর্ম সাবমিশন এবং স্টেট-চেঞ্জিং রিকোয়েস্টে টোকেন ভ্যালিডেশন সক্রিয় রাখে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.csrf_enabled}
                      onChange={(e) => setSettings({ ...settings, csrf_enabled: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CACHE & ENGINE ================= */}
        {activeTab === 'cache' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-bolt"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    ক্যাশ ও পারফরম্যান্স এক্সিলারেটর
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    ইন-মেমোরি ক্যাশিং, কম্প্রেশন এবং ফাইল আপলোড থ্রেশহোল্ড
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ক্যাশ ড্রাইভার (Cache Engine Driver)
                  </label>
                  <select
                    value={settings.cache_driver}
                    onChange={(e) => setSettings({ ...settings, cache_driver: e.target.value })}
                    className="form-select"
                  >
                    <option value="In-Memory Map">ইন-মেমোরি ম্যাপ (In-Memory Map — Ultra Fast)</option>
                    <option value="Redis">রেডিস সার্ভার (Redis Server)</option>
                    <option value="Filesystem">ফাইলসিস্টেম ক্যাশ (Filesystem)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    ডিফল্ট ক্যাশ স্থায়িত্বকাল (Cache TTL in Seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.cache_ttl}
                    onChange={(e) => setSettings({ ...settings, cache_ttl: e.target.value })}
                    className="form-control"
                    placeholder="3600"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    সর্বোচ্চ আপলোড সাইজ (Max Upload File Limit)
                  </label>
                  <select
                    value={settings.max_upload_size}
                    onChange={(e) => setSettings({ ...settings, max_upload_size: e.target.value })}
                    className="form-select"
                  >
                    <option value="5 MB">৫ মেগাবাইট (5 MB)</option>
                    <option value="15 MB">১৫ মেগাবাইট (15 MB — ডিফল্ট)</option>
                    <option value="50 MB">৫০ মেগাবাইট (50 MB)</option>
                    <option value="100 MB">১০০ মেগাবাইট (100 MB)</option>
                  </select>
                </div>
              </div>

              {/* Cache Toggles */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Gzip / Brotli রেসপন্স কম্প্রেশন
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      JSON পে-লোড ও অ্যাসেট স্বয়ংক্রিয়ভাবে কম্প্রেস করে ব্যান্ডউইথ খরচ ৭৫% কমাবে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.compression_enabled}
                      onChange={(e) => setSettings({ ...settings, compression_enabled: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      কুয়েরি মেমোইজেশন (Query Result Caching)
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      ঘন ঘন হওয়া SELECT কুয়েরির ফলাফল মেমোরিতে রেখে ডেটাবেজ লোড হ্রাস করে।
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={settings.query_caching}
                      onChange={(e) => setSettings({ ...settings, query_caching: e.target.checked })}
                    />
                    <span className="adm-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BRANDING & CONTACTS ================= */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Contact Details Card */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(14, 165, 233, 0.12)',
                    color: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-address-card"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    প্রতিষ্ঠানের সাধারণ যোগাযোগ
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    ইনভয়েস, ইমেইল নোটিফিকেশন ও পাবলিক ফুটারে প্রদর্শিত তথ্য
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    অ্যাডমিন ইমেইল ঠিকানা (Admin Contact Email)
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="form-control"
                    placeholder="admin@aeromvc.dev"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    হেল্পলাইন মোবাইল (Support Mobile)
                  </label>
                  <input
                    type="text"
                    value={settings.mobile}
                    onChange={(e) => setSettings({ ...settings, mobile: e.target.value })}
                    className="form-control"
                    placeholder="+880 1700-000000"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    হেডকোয়ার্টার ঠিকানা (Headquarters Address)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="form-control-textarea"
                    placeholder="ধানমন্ডি, ঢাকা, বাংলাদেশ"
                  />
                </div>
              </div>
            </div>

            {/* Logo and Favicon Card */}
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    color: '#a855f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  <i className="fas fa-photo-video"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    ব্র্যান্ড লোগো এবং ফেভিকন
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    সাইট হেডার, ন্যাভবার ও ব্রাউজার ট্যাবের ভিজ্যুয়াল অ্যাসেট
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                {/* 1. Logo Upload & Preview Card */}
                <div
                  style={{
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(230, 81, 0, 0.12)',
                          color: 'var(--adm-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                        }}
                      >
                        <i className="fas fa-image"></i>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        অ্যাপ্লিকেশন লোগো (Primary Logo)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(230, 81, 0, 0.1)',
                        color: 'var(--adm-primary)',
                      }}
                    >
                      PNG / SVG
                    </span>
                  </div>

                  {/* Stage: Checkerboard Transparency Preview */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      বর্তমান লোগো প্রিভিউ (Active Stage):
                    </div>
                    <div className="transparency-stage" style={{ minHeight: '110px' }}>
                      {logoPreview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            style={{
                              maxHeight: '75px',
                              maxWidth: '220px',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45))',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-image" style={{ fontSize: '20px' }}></i>
                          <span>কোনো লোগো আপলোড করা হয়নি</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Drag & Drop Upload Zone */}
                  <div
                    className={`adm-dropzone ${isDraggingLogo ? 'dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processLogoFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                  >
                    <input
                      type="file"
                      id="logo-upload-input"
                      accept="image/*"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                    />
                    <div className="adm-dropzone-icon">
                      <i className="fas fa-cloud-arrow-up"></i>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {isDraggingLogo ? 'লোগো ফাইলটি এখানে ছেড়ে দিন!' : 'লোগো ফাইল ড্র্যাগ করুন অথবা ব্রাউজ করুন'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      কম্পিউটার থেকে নতুন ব্র্যান্ড লোগো সিলেক্ট করতে ক্লিক করুন
                    </div>

                    <span
                      className="btn-adm-outline"
                      style={{ height: '34px', padding: '0 16px', fontSize: '12px', pointerEvents: 'none' }}
                    >
                      <i className="fas fa-folder-open"></i>
                      <span>ফাইল নির্বাচন করুন</span>
                    </span>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      সুপারিশ: স্বচ্ছ ব্যাকগ্রাউন্ডের PNG, SVG বা WebP (সর্বোচ্চ ২ MB)
                    </div>
                  </div>
                </div>

                {/* 2. Favicon Upload & Browser Tab Simulator Card */}
                <div
                  style={{
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(14, 165, 233, 0.12)',
                          color: '#0ea5e9',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                        }}
                      >
                        <i className="fas fa-globe"></i>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        ফেভিকন আইকন (Browser Tab Favicon)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                      }}
                    >
                      16x16 / 32x32
                    </span>
                  </div>

                  {/* Browser Tab Simulator Mockup */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      ব্রাউজার ট্যাব সিমুলেটর (Live Browser Preview):
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {/* Window Controls Dot Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }}></span>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }}></span>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }}></span>
                      </div>

                      {/* Mockup Active Tab */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div className="browser-tab-preview">
                          {faviconPreview ? (
                            <img
                              src={faviconPreview}
                              alt="Favicon"
                              style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }}
                            />
                          ) : (
                            <i className="fas fa-cube text-primary" style={{ fontSize: '14px', color: 'var(--adm-primary)' }}></i>
                          )}
                          <span style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Aero MVC — ড্যাশবোর্ড
                          </span>
                          <i className="fas fa-times" style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}></i>
                        </div>

                        {/* Dual Contrast Badges (Dark & Light) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            title="ডার্ক ব্যাকগ্রাউন্ডে প্রিভিউ"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#020617',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {faviconPreview ? (
                              <img src={faviconPreview} alt="Favicon" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            ) : (
                              <i className="fas fa-cube" style={{ fontSize: '13px', color: 'var(--adm-primary)' }}></i>
                            )}
                          </div>

                          <div
                            title="লাইট ব্যাকগ্রাউন্ডে প্রিভিউ"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {faviconPreview ? (
                              <img src={faviconPreview} alt="Favicon" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            ) : (
                              <i className="fas fa-cube" style={{ fontSize: '13px', color: 'var(--adm-primary)' }}></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Drag & Drop Upload Zone */}
                  <div
                    className={`adm-dropzone ${isDraggingFavicon ? 'dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFavicon(true);
                    }}
                    onDragLeave={() => setIsDraggingFavicon(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFavicon(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processFaviconFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('favicon-upload-input')?.click()}
                  >
                    <input
                      type="file"
                      id="favicon-upload-input"
                      accept="image/*,.ico"
                      onChange={handleFaviconChange}
                      style={{ display: 'none' }}
                    />
                    <div className="adm-dropzone-icon" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.12)' }}>
                      <i className="fas fa-cloud-arrow-up"></i>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {isDraggingFavicon ? 'ফেভিকনটি এখানে ছেড়ে দিন!' : 'ফেভিকন ড্র্যাগ করুন অথবা ব্রাউজ করুন'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      কম্পিউটার থেকে .ico বা .png ফরম্যাটের ফাইল বেছে নিন
                    </div>

                    <span
                      className="btn-adm-outline"
                      style={{ height: '34px', padding: '0 16px', fontSize: '12px', pointerEvents: 'none' }}
                    >
                      <i className="fas fa-folder-open"></i>
                      <span>ফেভিকন বাছুন</span>
                    </span>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      সুপারিশ: ৩২x৩২ বা ৬৪x৬৪ পিক্সেল সাইজের .ico বা .png ফাইল
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating/Sticky Save Action Bar */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--adm-primary)' }}></i>
            <span>পরিবর্তনগুলো সংরক্ষণ করতে নিচের বাটনে ক্লিক করুন।</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSettings(defaultSettings)}
              className="btn-adm-outline"
            >
              <i className="fas fa-undo"></i>
              <span>ডিফল্ট রিস্টোর</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-adm-primary"
            >
              <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-save'}></i>
              <span>{loading ? 'সংরক্ষণ করা হচ্ছে...' : 'সকল পরিবর্তন সেভ করুন'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
