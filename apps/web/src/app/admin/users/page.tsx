'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserItem {
  id?: number;
  user_id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  username?: string;
  mobile?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | string;
  status?: number | string;
  is_active?: number | string;
  created_at?: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([
    {
      user_id: 1,
      full_name: 'Administrator',
      username: 'admin',
      email: 'admin@aeromvc.dev',
      mobile: '01711000000',
      role: 'admin',
      is_active: 1,
      created_at: '2026-04-03 10:30',
    },
    {
      user_id: 2,
      full_name: 'হাজেরা নার্সারি ম্যানেজার',
      username: 'manager',
      email: 'manager@aeromvc.dev',
      mobile: '01811223344',
      role: 'manager',
      is_active: 1,
      created_at: '2026-06-17 14:15',
    },
    {
      user_id: 3,
      full_name: 'বিক্রয় ও স্টক অপারেটর',
      username: 'staff_user',
      email: 'staff@aeromvc.dev',
      mobile: '01911998877',
      role: 'staff',
      is_active: 0,
      created_at: '2026-08-01 09:45',
    },
  ]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    role: 'staff',
    password: '',
    status: '1',
  });

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { type, title, message },
        })
      );
    }
  };

  // Fetch users from Backend API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aero_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          setUsers(data.data);
        }
      }
    } catch (err) {
      console.log('Using default users data (offline/fallback mode)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const name = (u.full_name || u.name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const mobile = (u.mobile || u.phone || '').toLowerCase();
    const matchesSearch =
      !q || name.includes(q) || username.includes(q) || email.includes(q) || mobile.includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate metrics
  const totalCount = users.length;
  const activeCount = users.filter(
    (u) => u.is_active === 1 || u.is_active === '1' || u.status === 1 || u.status === '1'
  ).length;
  const inactiveCount = totalCount - activeCount;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      mobile: '',
      role: 'staff',
      password: '',
      status: '1',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (userItem: UserItem) => {
    setIsEditMode(true);
    setCurrentId(userItem.user_id || userItem.id || null);
    setFormData({
      name: userItem.full_name || userItem.name || '',
      username: userItem.username || '',
      email: userItem.email || '',
      mobile: userItem.mobile || userItem.phone || '',
      role: userItem.role || 'staff',
      password: '',
      status: String(userItem.is_active ?? userItem.status ?? '1'),
    });
    setModalOpen(true);
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (id === 1) {
      showToast('warning', 'অননুমোদিত', 'সুপার অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়!');
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" অ্যাকাউন্টটি ডিলিট করতে চান?`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aero_token') : null;
      if (token) {
        await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (e) {
      console.log('Fallback to local delete');
    }

    setUsers((prev) => prev.filter((u) => (u.user_id || u.id) !== id));
    showToast('danger', 'সফল', `"${name}" সফলভাবে ডিলিট করা হয়েছে।`);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      showToast('warning', 'সতর্কতা', 'অনুগ্রহ করে পুরো নাম ও ইউজারনেম পূরণ করুন');
      return;
    }

    if (!isEditMode && !formData.password) {
      showToast('warning', 'সতর্কতা', 'নতুন ব্যবহারকারীর জন্য পাসওয়ার্ড আবশ্যক');
      return;
    }

    setIsSubmitting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('aero_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      is_active: parseInt(formData.status),
      password: formData.password ? formData.password : undefined,
    };

    try {
      if (isEditMode && currentId) {
        if (token) {
          await fetch(`/api/users/${currentId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });
        }

        setUsers((prev) =>
          prev.map((u) => {
            if ((u.user_id || u.id) === currentId) {
              return {
                ...u,
                full_name: formData.name,
                username: formData.username,
                email: formData.email,
                mobile: formData.mobile,
                role: formData.role,
                is_active: parseInt(formData.status),
                status: parseInt(formData.status),
              };
            }
            return u;
          })
        );
        showToast('success', 'সফল!', 'ব্যবহারকারীর তথ্য সফলভাবে আপডেট হয়েছে।');
      } else {
        if (token) {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            await fetchUsers();
          }
        }

        const newUser: UserItem = {
          user_id: Date.now(),
          full_name: formData.name,
          username: formData.username,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          is_active: parseInt(formData.status),
          status: parseInt(formData.status),
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        setUsers((prev) => [newUser, ...prev]);
        showToast('success', 'সফল!', 'নতুন ব্যবহারকারী সফলভাবে তৈরি হয়েছে।');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast('danger', 'ত্রুটি', err.message || 'সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ===== 1. EXACT NURSERY ERP PAGE HEADER ===== */}
      <div className="adm-page-header" style={{ marginBottom: 0 }}>
        <div className="adm-page-title">
          <div className="title-icon bg-primary-soft text-primary">
            <i className="fas fa-users-cog"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              ব্যবহারকারী ব্যবস্থাপনা
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              User Management & Access Control
            </div>
          </div>
        </div>

        <div className="adm-page-actions">
          <button
            type="button"
            className="btn shadow-sm"
            style={{
              background: 'var(--adm-primary)',
              color: '#ffffff',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(230, 81, 0, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onClick={handleOpenCreate}
          >
            <i className="fas fa-user-plus"></i>
            <span>নতুন ব্যবহারকারী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* ===== 2. KPI SUMMARY METRIC TILES ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Users */}
        <div className="live-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                TOTAL USERS (মোট ইউজার)
              </span>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {totalCount}
              </div>
            </div>
            <div
              className="icon-circle"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <i className="fas fa-users"></i>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="live-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                ACTIVE USERS (সক্রিয়)
              </span>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#10b981',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {activeCount}
              </div>
            </div>
            <div
              className="icon-circle"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <i className="fas fa-user-check"></i>
            </div>
          </div>
        </div>

        {/* Suspended Users */}
        <div className="live-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                SUSPENDED (স্থগিত / নিষ্ক্রিয়)
              </span>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#ef4444',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {inactiveCount}
              </div>
            </div>
            <div
              className="icon-circle"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <i className="fas fa-user-slash"></i>
            </div>
          </div>
        </div>

        {/* System Admins */}
        <div className="live-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                SYSTEM ADMINS (এডমিন)
              </span>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#0ea5e9',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {adminCount}
              </div>
            </div>
            <div
              className="icon-circle"
              style={{
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                color: '#0ea5e9',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <i className="fas fa-user-shield"></i>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 3. SEARCH & ROLE FILTER BAR ===== */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--card-bg)',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <i
            className="fas fa-search"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          ></i>
          <input
            type="text"
            className="form-control"
            placeholder="নাম, ইউজারনেম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="ALL">সকল রোল (All Roles)</option>
            <option value="admin">Administrator (এডমিন)</option>
            <option value="manager">Manager (ম্যানেজার)</option>
            <option value="staff">Staff Member (স্টাফ)</option>
          </select>
        </div>

        {(search || roleFilter !== 'ALL') && (
          <button
            type="button"
            className="btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => {
              setSearch('');
              setRoleFilter('ALL');
            }}
          >
            <i className="fas fa-redo-alt"></i>
            <span>রিসেট</span>
          </button>
        )}
      </div>

      {/* ===== 4. EXACT NURSERY ERP USERS TABLE CARD ===== */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--body-bg)',
                  borderBottom: '1px solid var(--border-color)',
                  textTransform: 'uppercase',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>ইউজার আইডি</th>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>নাম ও ইউজারনেম</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>ব্যবহারকারী রোল</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>মোবাইল ও ইমেইল</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>স্ট্যাটাস</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>তৈরির তারিখ</th>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fas fa-spinner fa-spin me-2"></i> লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fas fa-users-slash fs-2 mb-2 d-block" style={{ opacity: 0.4 }}></i>
                    কোনো ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const id = u.user_id || u.id || 0;
                  const name = u.full_name || u.name || 'User';
                  const initial = name.charAt(0).toUpperCase();
                  const isActive = u.is_active === 1 || u.is_active === '1' || u.status === 1 || u.status === '1';

                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* User ID */}
                      <td
                        style={{
                          padding: '14px 20px',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '13px',
                        }}
                      >
                        #{id}
                      </td>

                      {/* User Info with Avatar Circle */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(230, 81, 0, 0.15), rgba(230, 81, 0, 0.05))',
                              color: 'var(--adm-primary)',
                              border: '1.5px solid rgba(230, 81, 0, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '16px',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>
                              {name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {u.role === 'admin' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: 'rgba(14, 165, 233, 0.1)',
                              color: '#0ea5e9',
                              border: '1px solid rgba(14, 165, 233, 0.2)',
                            }}
                          >
                            <i className="fas fa-user-shield" style={{ fontSize: '11px' }}></i> Administrator
                          </span>
                        ) : u.role === 'manager' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.2)',
                            }}
                          >
                            <i className="fas fa-user-tie" style={{ fontSize: '11px' }}></i> Manager
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: 'rgba(148, 163, 184, 0.1)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <i className="fas fa-user" style={{ fontSize: '11px' }}></i> Staff Member
                          </span>
                        )}
                      </td>

                      {/* Mobile / Email */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {u.mobile || u.phone ? (
                            <span>
                              <i className="fas fa-phone-alt me-1 text-muted" style={{ fontSize: '10px' }}></i>
                              {u.mobile || u.phone}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {u.email || ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {isActive ? (
                          <span
                            className="bg-success-soft"
                            style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              fontSize: '12px',
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
                                backgroundColor: '#10b981',
                              }}
                            ></span>
                            সক্রিয় (Active)
                          </span>
                        ) : (
                          <span
                            className="bg-danger-soft"
                            style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              fontSize: '12px',
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
                                backgroundColor: '#ef4444',
                              }}
                            ></span>
                            স্থগিত (Suspended)
                          </span>
                        )}
                      </td>

                      {/* Creation Date */}
                      <td
                        style={{
                          padding: '14px 16px',
                          color: 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {u.created_at ? u.created_at.substring(0, 16) : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            style={{
                              background: 'rgba(14, 165, 233, 0.08)',
                              border: '1px solid rgba(14, 165, 233, 0.3)',
                              color: '#0ea5e9',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => handleOpenEdit(u)}
                            title="সংশোধন করুন"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          {id !== 1 && (
                            <button
                              type="button"
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '12.5px',
                                transition: 'all 0.15s ease',
                              }}
                              onClick={() => handleDeleteUser(id, name)}
                              title="ডিলিট করুন"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== 5. USER MODAL (EXACT NURSERY ERP USER MODAL) ===== */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              width: '100%',
              maxWidth: '540px',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h5 style={{ margin: 0, fontWeight: 800, fontSize: '17px', color: 'var(--text-main)' }}>
                {isEditMode ? `ব্যবহারকারী তথ্য সংশোধন: ${formData.name}` : 'নতুন ব্যবহারকারী যোগ করুন'}
              </h5>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUser}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    পুরো নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="যেমন: মো: রফিকুল ইসলাম"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      ইউজারনেম (Username) *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. rofik_staff"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      মোবাইল নম্বর (Mobile)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="যেমন: 01711223344"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    ইমেইল ঠিকানা (Email Address)
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@aeromvc.dev"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      ব্যবহারকারী রোল (Role) *
                    </label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="staff">Staff Member (স্টাফ)</option>
                      <option value="manager">Manager (ম্যানেজার)</option>
                      <option value="admin">Administrator (এডমিন)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      স্ট্যাটাস (Status) *
                    </label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="1">সক্রিয় (Active)</option>
                      <option value="0">স্থগিত (Suspended)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    {isEditMode
                      ? 'পাসওয়ার্ড (Password - অপরিবর্তিত রাখতে ফাঁকা রাখুন)'
                      : 'পাসওয়ার্ড (Password) *'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required={!isEditMode}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditMode ? '••••••••' : 'সর্বনিম্ন ৬ অক্ষরের পাসওয়ার্ড'}
                  />
                  {isEditMode && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <i className="fas fa-info-circle me-1"></i> পাসওয়ার্ড অপরিবর্তিত রাখতে চাইলে ঘরটি খালি রাখুন।
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px 20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  style={{
                    background: 'var(--body-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '9999px',
                    padding: '9px 22px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                  }}
                  onClick={() => setModalOpen(false)}
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--adm-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '9px 26px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(230, 81, 0, 0.35)',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <span>
                      <i className="fas fa-spinner fa-spin me-2"></i>সংরক্ষণ হচ্ছে...
                    </span>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
