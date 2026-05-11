"use client";

import React, { useState } from 'react';
import { supabase } from './supabaseStockClient';
import { Lock, Mail, ChevronRight, Activity } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Fetch user role from metadata or a separate profiles table if needed
      // For now, assuming roles are in user_metadata or we set them up
      onLogin(data.user);
    } catch (err) {
      setError('Credenciales inválidas. Por favor, verifique su correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #036f72 0%, #10a396 100%)',
      padding: '2rem'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem', 
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.8rem',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '0.6rem', 
              borderRadius: '12px' 
            }}>
              <Activity size={28} />
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: 'var(--primary-dark)',
              letterSpacing: '-0.5px',
              margin: 0
            }}>
              Bonne Santé
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Plataforma de Gestión de Stock
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="email" 
                className="input-field" 
                placeholder="usuario@bonnesante.com"
                style={{ paddingLeft: '2.8rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                style={{ paddingLeft: '2.8rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '0.8rem', 
              background: '#fee2e2', 
              color: '#b91c1c', 
              borderRadius: '8px', 
              fontSize: '0.85rem',
              textAlign: 'center',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              marginTop: '1rem', 
              width: '100%', 
              padding: '1rem',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ¿Problemas para acceder? Contacte a Soporte IT
        </div>
      </div>
    </div>
  );
};

export default Login;
