import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Load stored user session if available
    const storedUser = localStorage.getItem('nodeflow_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('nodeflow_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('nodeflow_user');
    localStorage.removeItem('nodeflow_token');
    setUser(null);
  };

  // Hide global navbar on the full-screen Admin Dashboard layout
  const isAdminDashboard = location.pathname.startsWith('/admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdminDashboard && <Navbar user={user} onLogout={handleLogout} />}

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<WelcomePage user={user} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer on public pages matching app/views/layouts/footer.ejs */}
      {!isAdminDashboard && (
        <footer style={{
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-bengali)'
        }}>
          <div className="container">
            © {new Date().getFullYear()} NodeFlow Framework — সর্বস্বত্ব সংরক্ষিত। চালিত হচ্ছে React SPA ও Node.js Express দ্বারা।
          </div>
        </footer>
      )}
    </div>
  );
}
