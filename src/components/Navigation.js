'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Activity, LogOut, ShieldCheck, ClipboardList, BarChart2, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navigation({ title }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [role, setRole]     = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('medcupon_role') || '');
    setUserName(localStorage.getItem('medcupon_user') || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('medcupon_role');
    localStorage.removeItem('medcupon_user');
    router.push('/');
  };

  return (
    <nav style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #E5E7EB',
      padding: '0.85rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Activity color="#1890FF" size={26} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0A4275', lineHeight: 1.1 }}>MedCupon</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{title}</div>
        </div>
      </div>

      {/* Links de navegación (solo admin ve ambos) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {role === 'admin' && (
          <>
            <button
              onClick={() => router.push('/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                backgroundColor: pathname === '/admin' ? '#E6F7FF' : 'transparent',
                color: pathname === '/admin' ? '#0A4275' : '#6B7280',
              }}
            >
              <ShieldCheck size={16} /> Administración
            </button>
            <button
              onClick={() => router.push('/admin/packages')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                backgroundColor: pathname === '/admin/packages' ? '#E6F7FF' : 'transparent',
                color: pathname === '/admin/packages' ? '#0A4275' : '#6B7280',
              }}
            >
              <ClipboardList size={16} /> Paquetes
            </button>
            <button
              onClick={() => router.push('/receptionist')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                backgroundColor: pathname === '/receptionist' ? '#E6F7FF' : 'transparent',
                color: pathname === '/receptionist' ? '#0A4275' : '#6B7280',
              }}
            >
              <ClipboardList size={16} /> Validación
            </button>
            <button
              onClick={() => router.push('/admin/reports')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
                backgroundColor: pathname === '/admin/reports' ? '#E6F7FF' : 'transparent',
                color: pathname === '/admin/reports' ? '#0A4275' : '#6B7280',
              }}
            >
              <BarChart2 size={16} /> Reportes
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/inventory')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.375rem',
            border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
            backgroundColor: pathname === '/inventory' ? '#E6F7FF' : 'transparent',
            color: pathname === '/inventory' ? '#0A4275' : '#6B7280',
          }}
        >
          <Package size={16} /> Stock Control
        </button>

        {/* Usuario + Logout */}
        <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #E5E7EB', paddingLeft: '1rem' }}>
          <span style={{ fontWeight: 500, color: '#374151', fontSize: '0.9rem' }}>
            {userName || 'Usuario'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'none', border: '1px solid #E5E7EB',
              color: '#EF4444', fontWeight: 500, cursor: 'pointer',
              padding: '0.4rem 0.9rem', borderRadius: '0.375rem',
              fontSize: '0.85rem', transition: 'all 0.2s'
            }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
