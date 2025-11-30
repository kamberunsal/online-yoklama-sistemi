import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import './App.css';
import api from './api';

// Import components
import Login from './components/Login';
import DersProgrami from './components/DersProgrami';
import YoklamaEkrani from './components/YoklamaEkrani';
import QROkutucu from './components/QROkutucu';
import AdminDashboard from './components/admin/AdminDashboard';
import DersYonetim from './components/admin/DersYonetim';
import DersDetay from './components/admin/DersDetay';
import KullaniciYonetim from './components/admin/KullaniciYonetim';

const getAuthData = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    return { token, user };
};

// Protected Route for any logged-in user
const PrivateRoutes = () => {
    const { token, user } = getAuthData();
    if (!token || !user) {
        return <Navigate to="/login" />;
    }
    // Set the authorization header for all subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return <Outlet />;
};

// Protected Route for Admins
const AdminRoutes = () => {
    const { token, user } = getAuthData();
    if (!token || !user || user.rol !== 'admin') {
        return <Navigate to="/login" />;
    }
    // Set the authorization header for all subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return <Outlet />;
};

function App() {
  useEffect(() => {
    const { token } = getAuthData();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Cache Bust: v1.1 */}
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* General User Pages */}
          <Route element={<PrivateRoutes />}>
            <Route path="/ders-programi" element={<DersProgrami />} />
            <Route path="/yoklama/:dersId" element={<YoklamaEkrani />} />
            <Route path="/qr-okut" element={<QROkutucu />} />
          </Route>

          {/* Admin Pages */}
          <Route element={<AdminRoutes />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/dersler" element={<DersYonetim />} />
            <Route path="/admin/dersler/:id" element={<DersDetay />} />
            <Route path="/admin/kullanicilar" element={<KullaniciYonetim />} />
          </Route>

          {/* Redirect root and unmatched routes */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

const RootRedirector = () => {
  const { user } = getAuthData();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (user.rol === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  return <Navigate to="/ders-programi" />;
};

export default App;