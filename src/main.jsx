// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import App from './pages/App';

function Root() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: '#e2e2ee', fontSize: 24 }}>
      🌿
    </div>
  );
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/*" element={user ? <App user={user} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
