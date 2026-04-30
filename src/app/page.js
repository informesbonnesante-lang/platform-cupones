'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Lock, User } from 'lucide-react';

const USERS = [
  { username: 'admin',     password: 'Clinica2026cupon',     role: 'admin' },
  { username: 'recepcion', password: 'clinica2024', role: 'receptionist' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const found = USERS.find(
      (u) => u.username === username.trim() && u.password === password
    );

    if (found) {
      localStorage.setItem('medcupon_role', found.role);
      localStorage.setItem('medcupon_user', found.username);
      router.push(found.role === 'admin' ? '/admin' : '/receptionist');
    } else {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A4275 0%, #1890FF 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: '#E6F7FF', borderRadius: '50%', padding: '1.25rem' }}>
            <Stethoscope size={48} color="#0A4275" />
          </div>
        </div>
        <h1 style={{ marginBottom: '0.25rem', color: '#0A4275' }}>MedCupon</h1>
        <p style={{ color: '#6B7280', marginBottom: '2rem' }}>Plataforma de Validación de Vales Médicos</p>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#991B1B', padding: '0.75rem',
            borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label">Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text" className="input-field"
                placeholder="admin / recepcion"
                value={username} onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.75rem' }} required
              />
            </div>
          </div>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="password" className="input-field"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }} required
              />
            </div>
          </div>
          <button
            type="submit" className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', fontSize: '1rem' }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#9CA3AF', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
          <div>🏥 Recepción: <b>recepcion</b> / <b>recepcion123</b></div>
        </div>
      </div>
    </div>
  );
}
