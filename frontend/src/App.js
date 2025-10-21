import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login';
import Register from './components/Register';
import DersProgrami from './components/DersProgrami';
import YoklamaEkrani from './components/YoklamaEkrani';
import QROkutucu from './components/QROkutucu';
import AdminDashboard from './components/admin/AdminDashboard';
import DersYonetim from './components/admin/DersYonetim';
import DersDetay from './components/admin/DersDetay';
import KullaniciYonetim from './components/admin/KullaniciYonetim';

// Simple Protected Route for Admins
const AdminRoutes = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.rol === 'admin' ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* General User Pages */}
          <Route path="/ders-programi" element={<DersProgrami />} />
          <Route path="/yoklama/:dersId" element={<YoklamaEkrani />} />
          <Route path="/qr-okut" element={<QROkutucu />} />

          {/* Admin Pages */}
          <Route element={<AdminRoutes />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/dersler" element={<DersYonetim />} />
            <Route path="/admin/dersler/:id" element={<DersDetay />} />
            <Route path="/admin/kullanicilar" element={<KullaniciYonetim />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;