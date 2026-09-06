import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Zap, Shield, Bug, ArrowRight, Gauge, Lock } from 'lucide-react';

export default function WelcomePage({ user }) {
  return (
    <div className="container" style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
      {/* Hero Showcase Banner */}
      <div 
        className="card-glass"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4.5rem 2rem',
          textAlign: 'center',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Ambient Glow Circles */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'rgba(14, 165, 233, 0.15)',
          filter: 'blur(80px)',
          top: '-50px',
          left: '10%',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'rgba(16, 185, 129, 0.15)',
          filter: 'blur(80px)',
          bottom: '-50px',
          right: '10%',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '1px',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            background: 'rgba(14, 165, 233, 0.1)',
            color: '#0ea5e9',
            fontFamily: 'var(--font-sans)'
          }}>
            <Rocket size={14} />
            NodeFlow Framework v1.0.0 (React Powered)
          </span>

          {/* Heading */}
          <h1 style={{
            fontSize: '3.25rem',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-bengali)'
          }}>
            স্বাগতম{' '}
            <span style={{
              background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              NodeFlow
            </span>{' '}
            ফ্রেমওয়ার্ক এ
          </h1>

          {/* Subtitle */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            fontFamily: 'var(--font-bengali)'
          }}>
            একটি শক্তিশালী, মডার্ন এবং অতি দ্রুতগতির Node.js এক্সপ্রেস MVC ফ্রেমওয়ার্ক। এটি আপনার এন্টারপ্রাইজ ওয়েব অ্যাপ্লিকেশন এবং ডেটাবেজ ডেভেলপমেন্টকে করবে নিরাপদ, সহজ এবং অত্যন্ত প্রফেশনাল।
          </p>

          {/* Call to Action Button */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link 
                to="/admin/dashboard" 
                className="btn-brand" 
                style={{ padding: '0.8rem 2rem', borderRadius: '30px', fontSize: '1rem' }}
              >
                <Gauge size={18} />
                <span>অ্যাডমিন ড্যাশবোর্ড</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="btn-brand" 
                style={{ padding: '0.8rem 2rem', borderRadius: '30px', fontSize: '1rem' }}
              >
                <Lock size={18} />
                <span>লগইন করুন</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Key Features Grid (3 Columns matching welcome.ejs) */}
      <div className="features-grid">
        {/* Feature 1: Fast Execution */}
        <div className="feature-card">
          <div className="feature-icon-box" style={{ color: '#0ea5e9' }}>
            <Zap size={36} />
          </div>
          <h4 className="feature-title">অত্যন্ত দ্রুত পারফরম্যান্স</h4>
          <p className="feature-desc">
            Node.js-এর নন-ব্লকিং অ্যাসিনক্রোনাস আর্কিটেকচার এবং আমাদের ডেটাবেজ কানেকশন পুলিং সিস্টেম নিশ্চিত করে এক মুহূর্তেই হাই-স্পিড কুয়েরি প্রসেসিং।
          </p>
        </div>

        {/* Feature 2: High Security */}
        <div className="feature-card">
          <div className="feature-icon-box" style={{ color: '#10b981' }}>
            <Shield size={36} />
          </div>
          <h4 className="feature-title">নিরাপদ আর্কিটেকচার</h4>
          <p className="feature-desc">
            অন্তর্নির্মিত CSRF প্রোটেকশন ফিল্টার, SQL ইনজেকশন ডিফেন্স, হেলমেট সিকিউর হেডার এবং অ্যান্টি-ব্রুট ফোর্স রেট লিমিটিং প্রোটোকল দ্বারা সম্পূর্ণ সুরক্ষিত।
          </p>
        </div>

        {/* Feature 3: Smart Debugger */}
        <div className="feature-card">
          <div className="feature-icon-box" style={{ color: '#f59e0b' }}>
            <Bug size={36} />
          </div>
          <h4 className="feature-title">ইন্টেলিজেন্ট ডিবাগার</h4>
          <p className="feature-desc">
            আমাদের উন্নত ইন্টেলিজেন্ট এরর হ্যান্ডলার রিয়েল-টাইম কোড কনটেক্সট প্রিভিউ এবং Levenshtein দূরত্ব ব্যবহার করে টাইপো সাজেশন দিয়ে ডিবাগিং সময়কে কমিয়ে আনে।
          </p>
        </div>
      </div>

      {/* Unified Port Tech Banner */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.3)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 10px #10b981'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            <strong>একই পোর্ট প্রযুক্তি:</strong> এক্সপ্রেস ব্যাকএন্ড এবং রিঅ্যাক্ট ফ্রন্টএন্ড উভয়ই পোর্ট <strong>:3001</strong>-এ সচল।
          </span>
        </div>
        <a 
          href="/api/status" 
          target="_blank" 
          rel="noreferrer" 
          style={{ fontSize: '0.85rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>/api/status পরীক্ষা করুন</span>
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
