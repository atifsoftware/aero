'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomePage() {
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'controller' | 'router' | 'model'>('controller');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aero_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '3rem' }}>
      {/* =========================================================================
          1. HERO SHOWCASE BANNER (AERO MVC FRAMEWORK)
          ========================================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 2rem 3.5rem',
          overflow: 'hidden',
          borderRadius: '26px',
          background:
            'radial-gradient(circle at 50% 20%, rgba(230, 81, 0, 0.12) 0%, rgba(230, 81, 0, 0.02) 65%, transparent 100%)',
          border: '1px solid var(--border-color)',
          marginTop: '1.5rem',
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            background: 'rgba(230, 81, 0, 0.15)',
            filter: 'blur(90px)',
            top: '-50px',
            left: '12%',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'rgba(14, 165, 233, 0.12)',
            filter: 'blur(80px)',
            bottom: '-40px',
            right: '12%',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
          {/* Framework Badge */}
          <div style={{ marginBottom: '1.4rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.4px',
                background: 'rgba(230, 81, 0, 0.12)',
                color: 'var(--adm-primary)',
                border: '1px solid rgba(230, 81, 0, 0.25)',
                boxShadow: '0 2px 10px rgba(230, 81, 0, 0.1)',
              }}
            >
              <i className="fas fa-rocket"></i>
              <span>আধুনিক Node.js Express 5 + Next.js 14 ফুল-স্ট্যাক MVC ফ্রেমওয়ার্ক</span>
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '1.5rem',
              color: 'var(--text-main)',
              fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
            }}
          >
            এন্টারপ্রাইজ ওয়েব অ্যাপ্লিকেশনের জন্য{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--adm-primary), #ff851b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Aero MVC ফ্রেমওয়ার্ক
            </span>
          </h1>

          {/* Subtext */}
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.12rem',
              lineHeight: 1.8,
              marginBottom: '2.5rem',
              maxWidth: '740px',
              margin: '0 auto 2.5rem',
              fontFamily: "'Hind Siliguri', sans-serif",
            }}
          >
            ক্লিন MVC আর্কিটেকচার, হাই-পারফরম্যান্স ডেটাবেজ ইঞ্জিন, স্বয়ংক্রিয় Swagger/OpenAPI 3.0
            ডকুমেন্টেশন, রোল-বেসড সিকিউরিটি (RBAC) এবং রিয়েল-টাইম অ্যাডমিন ড্যাশবোর্ড — সব একসাথে তৈরি।
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={user ? '/admin' : '/admin'}
              className="btn shadow-sm"
              style={{
                background: 'var(--adm-primary)',
                color: '#ffffff',
                padding: '12px 30px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(230, 81, 0, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>{user ? 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ' : 'লাইভ অ্যাডমিন প্যানেল দেখুন'}</span>
            </Link>

            <a
              href="http://localhost:3001/api/docs/"
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                padding: '12px 26px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-book-open text-primary"></i>
              <span>FastAPI / Swagger এপিআই ডক্স</span>
              <i className="fas fa-external-link-alt" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
            </a>

            <a
              href="#features"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '12px 22px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fas fa-layer-group"></i>
              <span>আর্কিটেকচার ও ফিচার</span>
            </a>
          </div>

          {/* Quick Technical Highlight Pills */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i>
              <span>Express 5 Non-blocking কোর</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-database" style={{ color: '#10b981' }}></i>
              <span>সুপারফাস্ট কুয়েরি ও কানেকশন পুলিং</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-shield-alt" style={{ color: '#0ea5e9' }}></i>
              <span>CSRF, Helmet ও RBAC সিকিউরিটি</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-code" style={{ color: 'var(--adm-primary)' }}></i>
              <span>অটোমেটেড OpenAPI 3.0 স্পেক্স</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INTERACTIVE ARCHITECTURE & CODE PREVIEW SHOWCASE
          ========================================================================= */}
      <section id="architecture" style={{ scrollMarginTop: '80px' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '22px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar with Live Status */}
          <div
            style={{
              background: 'var(--body-bg)',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }}></span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginLeft: '8px',
                  fontFamily: "'Inter', monospace",
                }}
              >
                Aero MVC Engine • Architecture Explorer
              </span>
            </div>

            {/* Code Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('controller')}
                style={{
                  background: activeTab === 'controller' ? 'var(--card-bg)' : 'transparent',
                  color: activeTab === 'controller' ? 'var(--adm-primary)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: activeTab === 'controller' ? 'var(--border-color)' : 'transparent',
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <i className="fas fa-file-code me-1"></i> UserController.js
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('router')}
                style={{
                  background: activeTab === 'router' ? 'var(--card-bg)' : 'transparent',
                  color: activeTab === 'router' ? 'var(--adm-primary)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: activeTab === 'router' ? 'var(--border-color)' : 'transparent',
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <i className="fas fa-route me-1"></i> routes/api.js
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('model')}
                style={{
                  background: activeTab === 'model' ? 'var(--card-bg)' : 'transparent',
                  color: activeTab === 'model' ? 'var(--adm-primary)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: activeTab === 'model' ? 'var(--border-color)' : 'transparent',
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <i className="fas fa-database me-1"></i> models/User.js
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              <span>Express API :3001 Active</span>
            </div>
          </div>

          {/* Code Viewer Area */}
          <div
            style={{
              padding: '20px 24px',
              background: '#090d16',
              color: '#f8fafc',
              fontFamily: "'Consolas', 'Fira Code', monospace",
              fontSize: '13px',
              lineHeight: 1.7,
              overflowX: 'auto',
            }}
          >
            {activeTab === 'controller' && (
              <pre style={{ margin: 0 }}>
                <code>{`// apps/backend/controllers/UserController.js
const User = require('../models/User');

class UserController {
  /**
   * Fetch all users with pagination and search
   */
  static async index(req, res) {
    const { search = '', page = 1, limit = 10 } = req.query;
    
    // Efficient non-blocking connection pool query
    const { users, total } = await User.paginate({ search, page, limit });

    return res.json({
      status: 'success',
      data: users,
      pagination: { total, page, limit }
    });
  }
}

module.exports = UserController;`}</code>
              </pre>
            )}

            {activeTab === 'router' && (
              <pre style={{ margin: 0 }}>
                <code>{`// apps/backend/routes/api.js
const express = require('express');
const router = express.Router();
const apiTokenAuth = require('../middlewares/apiTokenAuth');
const ApiUserController = require('../controllers/ApiUserController');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve user list with role assignments
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users', apiTokenAuth, ApiUserController.index);
router.post('/users', apiTokenAuth, ApiUserController.store);
router.put('/users/:id', apiTokenAuth, ApiUserController.update);
router.delete('/users/:id', apiTokenAuth, ApiUserController.destroy);

module.exports = router;`}</code>
              </pre>
            )}

            {activeTab === 'model' && (
              <pre style={{ margin: 0 }}>
                <code>{`// apps/backend/models/User.js
const DB = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async findByUsername(username) {
    const [user] = await DB.query(
      'SELECT * FROM tbl_users WHERE username = ? LIMIT 1',
      [username]
    );
    return user || null;
  }

  static async create({ full_name, username, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await DB.query(
      'INSERT INTO tbl_users (full_name, username, password, role) VALUES (?, ?, ?, ?)',
      [full_name, username, hashedPassword, role]
    );
    return result.insertId;
  }
}

module.exports = User;`}</code>
              </pre>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CORE AERO MVC FRAMEWORK FEATURES (৬টি সমৃদ্ধ আর্কিটেকচারাল কার্ড)
          ========================================================================= */}
      <section id="features" style={{ scrollMarginTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            style={{
              color: 'var(--adm-primary)',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            FRAMEWORK CORE CAPABILITIES
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: "'Hind Siliguri', sans-serif",
            }}
          >
            আধুনিক এন্টারপ্রাইজ সফটওয়্যার তৈরির পূর্ণাঙ্গ ইকোসিস্টেম
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              maxWidth: '680px',
              margin: '10px auto 0',
              lineHeight: 1.7,
            }}
          >
            Aero MVC-তে রয়েছে প্রতিটি আধুনিক ওয়েব ডেভেলপমেন্ট ফিচারের রেডিমেড আর্কিটেকচার, যা আপনার কোডিং সময় বাঁচায়।
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '22px',
          }}
        >
          {/* Feature 1 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
              <i className="fas fa-layer-group"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              ক্লিন MVC আর্কিটেকচার
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              Models, Views, Controllers এবং Middlewares-এর সুবিন্যস্ত গঠন। কোড থাকে পরিচ্ছন্ন, সহজে রি-ইউজেবল এবং বড়
              টিমের কাজের জন্য আদর্শ।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> লারাভেলের মতো পরিপাটি ফোল্ডার স্ট্রাকচার</li>
              <li><i className="fas fa-check text-success"></i> ডিপেন্ডেন্সি ইনজেকশন ও সার্ভিস লেয়ার</li>
              <li><i className="fas fa-check text-success"></i> সহজে টেস্টেবল ও মডুলার কোডবেস</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <i className="fas fa-database"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              হাই-স্পিড ডেটাবেজ ইঞ্জিন
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              বিল্ট-ইন ডেটাবেজ কানেকশন পুলিং, নিরাপদ প্যারামিটারাইজড কুয়েরি এবং এসকিউএল ইনজেকশন প্রতিরোধ ব্যবস্থা।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> ট্রানজ্যাকশন সাপোর্ট (Commit / Rollback)</li>
              <li><i className="fas fa-check text-success"></i> দ্রুততম কুয়েরি এক্সিকিউশন ও ইনডেক্সিং</li>
              <li><i className="fas fa-check text-success"></i> মাইগ্রেশন ও সীডার সিস্টেম</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(230, 81, 0, 0.12)', color: 'var(--adm-primary)' }}>
              <i className="fas fa-book-open"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              স্বয়ংক্রিয় Swagger ও OpenAPI 3.0
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              FastAPI-এর আদলে লাইভ ইন্টারেক্টিভ এপিআই ডকুমেন্টেশন কনসোল। ব্রাউজার থেকেই যেকোনো এপিআই সহজে টেস্ট করা যায়।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> লাইভ স্যান্ডবক্স টেস্ট কনসোল</li>
              <li><i className="fas fa-check text-success"></i> অটোমেটিক স্কিমা ও রেসপন্স ভ্যালিডেশন</li>
              <li><i className="fas fa-check text-success"></i> ক্লায়েন্ট মোবাইল অ্যাপের জন্য ইনস্ট্যান্ট স্পেক্স</li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              এন্টারপ্রাইজ সিকিউরিটি গার্ডস
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              Helmet সিকিউর হেডার, CSRF ফিল্টার, অ্যান্টি-ব্রুট ফোর্স রেট লিমিটিং (Throttle) এবং নিরাপদ Bcrypt পাসওয়ার্ড এনক্রিপশন।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> ব্রুট ফোর্স আক্রমণ প্রতিরোধে Throttle গার্ড</li>
              <li><i className="fas fa-check text-success"></i> XSS ও ক্লিকজ্যাকিং প্রোটেকশন</li>
              <li><i className="fas fa-check text-success"></i> বিয়ারার টোকেন ও সেশন সিকিউরিটি</li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <i className="fas fa-user-shield"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              রোল ও পারমিশন কন্ট্রোল (RBAC)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              সুপার অ্যাডমিন, ম্যানেজার এবং স্টাফ মেম্বারদের জন্য নিখুঁত পারমিশন কন্ট্রোল ও পলিসি মিডলওয়্যার।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> গ্র্যানুলার ইউজার পারমিশন চেকিং</li>
              <li><i className="fas fa-check text-success"></i> রাউট-লেভেল অথেনটিকেশন মিডলওয়্যার</li>
              <li><i className="fas fa-check text-success"></i> ইনস্ট্যান্ট ইউজার লক ও সাসপেনশন</li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="erp-module-card">
            <div className="module-icon-box" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <i className="fas fa-bug"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
              ইন্টেলিজেন্ট ডিবাগার ও এরর ট্রেসার
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              কোডে এরর হলে ফাইল নাম, লাইন নম্বর ও সংশ্লিষ্ট কোড স্নিপেট সরাসরি স্ক্রিনে প্রিভিউ করে দ্রুত বাগ ফিক্সিং নিশ্চিত করে।
            </p>
            <ul className="module-points">
              <li><i className="fas fa-check text-success"></i> রিয়েল-টাইম এরর কোড কনটেক্সট</li>
              <li><i className="fas fa-check text-success"></i> রাউট টাইপো অটো-সাজেশন</li>
              <li><i className="fas fa-check text-success"></i> প্রোডাকশনে নিরাপদ লকড এরর পেজ</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. WHY CHOOSE AERO MVC? (BENCHMARK & ADVANTAGES)
          ========================================================================= */}
      <section>
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              style={{
                color: 'var(--adm-primary)',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              FRAMEWORK COMPARISON
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.7rem, 3.2vw, 2.3rem)',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: "'Hind Siliguri', sans-serif",
              }}
            >
              কেন Aero MVC ফ্রেমওয়ার্ক অনন্য?
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(230, 81, 0, 0.12)',
                  color: 'var(--adm-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="fas fa-bolt"></i>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                বিক্ষিপ্ততা মুক্ত
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                সাধারণ এক্সপ্রেসে নিজে নিজে সব ফোল্ডার সাজাতে হয়। Aero MVC-তে প্রথম দিন থেকেই ক্লিন MVC ও মিডলওয়্যার
                আর্কিটেকচার প্রস্তুত থাকে।
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="fas fa-sliders-h"></i>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                অ্যাডমিন ও ফ্রন্টএন্ড রেডি
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                এতে রয়েছে আধুনিক ড্যাশবোর্ড, ইউজার ম্যানেজমেন্ট, রোল পারমিশন এবং সেটিংস প্যানেল — যা যেকোনো প্রজেক্ট দ্রুত
                ডেলিভারি করতে সাহায্য করে।
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(14, 165, 233, 0.12)',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="fas fa-file-alt"></i>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                জিরো-কনফিগ এপিআই ডকুমেন্টেশন
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                আলাদা পোস্টম্যান কালেকশন তৈরি করার প্রয়োজন নেই। Swagger UI স্বয়ংক্রিয়ভাবে সব এপিআই অ্যান্ডপয়েন্ট লাইভ
                ডকুমেন্ট করে।
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="fas fa-language"></i>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                দ্বিভাষিক সমর্থন (বাংলা ও ইংরেজি)
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                বাংলাদেশের ডেভেলপার ও ক্লায়েন্টদের জন্য সম্পূর্ণ বাংলা ও আন্তর্জাতিক মানসম্পন্ন ইংরেজি ইউজার ইন্টারফেস।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. THREE EASY STEPS TO GET STARTED
          ========================================================================= */}
      <section style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', fontWeight: 800, color: 'var(--text-main)' }}>
            মাত্র ৩টি ধাপে Aero MVC দিয়ে অ্যাপ্লিকেশন ডেভেলপমেন্ট শুরু করুন
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--adm-primary)',
                color: '#fff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                fontSize: '15px',
              }}
            >
              ১
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              ক্লোন ও ডিপেন্ডেন্সি ইনস্টল
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              গিট রিপোজিটরি ক্লোন করে <code style={{ color: 'var(--adm-primary)' }}>npm install</code> রান করুন।
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#fff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                fontSize: '15px',
              }}
            >
              ২
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              কন্ট্রোলার ও রুট কনফিগ
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              <code style={{ color: '#10b981' }}>controllers/</code> এবং <code style={{ color: '#10b981' }}>routes/</code> এ আপনার বিজনেস লজিক লিখুন।
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#0ea5e9',
                color: '#fff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                fontSize: '15px',
              }}
            >
              ৩
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              প্রোডাকশন বিল্ড ও ডিপ্লয়
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              এক কমান্ডে প্রোডাকশন বান্ডল তৈরি করে যেকোনো VPS বা ক্লাউড সার্ভারে নিরাপদে ডিপ্লয় করুন।
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BOTTOM CALL TO ACTION BANNER
          ========================================================================= */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '26px',
          padding: '3.8rem 2rem',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            background: 'rgba(230, 81, 0, 0.25)',
            filter: 'blur(75px)',
            top: '-40px',
            right: '15%',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 5, maxWidth: '680px', margin: '0 auto' }}>
          <h3 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.3rem)', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
            আপনার পরবর্তী অ্যাপ্লিকেশন তৈরি করুন Aero MVC দিয়ে
          </h3>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7, marginBottom: '2rem' }}>
            ক্লিন কোড, সর্বোচ্চ গতি এবং এন্টারপ্রাইজ সিকিউরিটি সহ তৈরি করুন স্কেলযোগ্য ওয়েব অ্যাপ্লিকেশন।
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/admin"
              className="btn"
              style={{
                background: 'var(--adm-primary)',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(230, 81, 0, 0.4)',
              }}
            >
              <i className="fas fa-door-open me-2"></i> অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <a
              href="http://localhost:3001/api/docs/"
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '12px 26px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <i className="fas fa-code me-2"></i> Swagger এপিআই কনসোল
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
