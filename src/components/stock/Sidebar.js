"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  MinusCircle, 
  PlusCircle, 
  Package, 
  History, 
  Settings,
  Database
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'consume', label: 'Registrar Consumo', icon: <MinusCircle size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR'] },
    { id: 'entry', label: 'Ingreso MercaderÃ­a', icon: <PlusCircle size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'new-item', label: 'Nuevo Ãtem', icon: <PlusCircle size={20} />, roles: ['ADMIN'] },
    { id: 'inventory', label: 'Stock e Inventario', icon: <Package size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'history', label: 'Trazabilidad', icon: <History size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'web-manager', label: 'GestiÃ³n Web', icon: <LayoutDashboard size={20} />, roles: ['ADMIN'] },
    { id: 'backups', label: 'Backups y Reportes', icon: <Database size={20} />, roles: ['ADMIN'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div style={{ padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', letterSpacing: '2px' }}>STOCK PRO</h2>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
        v1.0.0 Alpha
      </div>
    </aside>
  );
};

export default Sidebar;

