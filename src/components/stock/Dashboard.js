"use client";

import React from 'react';
import { Package, AlertTriangle, TrendingUp, Users } from 'lucide-react';

const Dashboard = ({ inventory, consumptions, entries }) => {
  const lowStockItems = inventory.filter(item => item.stock < 20);
  const totalItems = inventory.reduce((acc, current) => acc + current.stock, 0);
  const recentConsumptions = consumptions.slice(0, 5);

  const getExpirationStyle = (date) => {
    if (!date) return null;
    const today = new Date();
    const expiry = new Date(date);
    const months = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
    if (months <= 3) return { background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', label: 'Crítico (<3m)' };
    if (months <= 6) return { background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', label: 'Alerta (<6m)' };
    return null;
  };

  const expiringItems = inventory
    .filter(item => getExpirationStyle(item.vencimiento))
    .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0369a1' }}>
            <Package size={24} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Existencias Totales</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{totalItems}</h3>
          </div>
        </div>
        
        <div className="glass-card stat-card" style={{ borderBottom: lowStockItems.length > 0 ? '3px solid var(--danger)' : 'none' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#b91c1c' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Bajo Stock</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{lowStockItems.length}</h3>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderBottom: expiringItems.length > 0 ? '3px solid var(--accent)' : 'none' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', color: '#854d0e' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Próximos Vencimientos</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{expiringItems.length}</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pacientes Atendidos</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{new Set(consumptions.map(c => c.pacienteCi)).size}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Control de Caducidad (Semáforo)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {expiringItems.length > 0 ? expiringItems.map(item => {
              const semaforo = getExpirationStyle(item.vencimiento);
              return (
              <div key={item.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '1rem', background: semaforo.background, borderRadius: '12px',
                border: `1px solid ${semaforo.color}33`
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: semaforo.color }}>{item.nombre}</p>
                  <small style={{ color: semaforo.color }}>Lote vence el: {item.vencimiento}</small>
                </div>
                <span className="badge" style={{ background: semaforo.color, color: 'white' }}>{semaforo.label}</span>
              </div>
              );
            }) : <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No hay ítems próximos a vencer.</p>}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Últimos Movimientos de Lote</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Muestra 5 registros</span>
          </div>
          <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border)', background: 'transparent' }}>
            <table>
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th>Paciente / Prov.</th>
                  <th>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {recentConsumptions.length > 0 ? recentConsumptions.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.itemName}</td>
                    <td>{c.pacienteNombre}</td>
                    <td style={{ fontWeight: 700 }}>{c.cantidad}</td>
                  </tr>
                )) : <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin movimientos recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
