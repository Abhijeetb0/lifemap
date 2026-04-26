// src/pages/Login.jsx
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a2e10 100%)',
      color: '#e2e2ee', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, marginBottom: 4 }}>
        Life<span style={{ opacity: .35, fontWeight: 400 }}>Map</span>
      </h1>
      <p style={{ color: '#606070', fontSize: 14, marginBottom: 40 }}>
        Your personal life OS
      </p>
      <button
        onClick={login}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', color: '#111', border: 'none',
          padding: '12px 24px', borderRadius: 10, fontSize: 15,
          fontWeight: 500, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,.3)',
        }}
      >
        <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" />
        Continue with Google
      </button>
    </div>
  );
}
