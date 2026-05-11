"use client";

import React, { useState } from 'react';
import { Search, Filter, Trash2, AlertTriangle, Edit } from 'lucide-react';

const InventoryTable = ({ inventory, userRole, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('Todas');

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'Todas' || item.area === filterArea;
    return matchesSearch && matchesArea;
  });

  const getExpirationStatus = (date) => {
    if (!date || date === 'N/A') return { label: 'Sin Fecha', color: 'var(--text-muted)', class: '' };
    const today = new Date();
    const expiry = new Date(date);
    const months = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
    
    if (months <= 0) return { label: 'VENCIDO', color: 'var(--danger)', class: 'badge-danger' };
    if (months <= 3) return { label: 'Crítico (<3m)', color: 'white', background: 'var(--danger)', class: 'badge-danger' };
    if (months <= 6) return { label: 'Alerta (<6m)', color: 'black', background: 'var(--accent)', class: 'badge-warning' };
    return { label: date, color: 'var(--primary)', class: 'badge-info' };
  };

  const areas = ['Todas', ...new Set(inventory.map(item => item.area || 'GENERAL'))];

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Inventario Maestro de Insumos</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Visualización de saldos y trazabilidad de caducidad</p>
        </div>
        {userRole === 'ADMIN' && (
          <div className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
            PERMISO DE EDICIÓN ACTIVO
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '40px' }} 
            placeholder="Filtrar por nombre, principio activo o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={18} className="text-muted" />
          <select 
            className="input-field" 
            style={{ width: '220px' }}
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            {areas.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del Ítem</th>
              <th>Categoría</th>
              <th>Vencimiento</th>
              <th style={{ textAlign: 'center' }}>Stock Inicial</th>
              <th style={{ textAlign: 'center' }}>Saldo (Actual)</th>
              <th>Estado</th>
              {userRole === 'ADMIN' && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const expStatus = getExpirationStatus(item.vencimiento);
              const isStockLow = item.current_stock < 20;
              const consumed = item.stock_inicial - item.current_stock;
              return (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item.nombre}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.area || 'DEPÓSITO CENTRAL'}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  <span className="badge badge-info" style={{ background: 'rgba(16, 163, 150, 0.1)', color: 'var(--primary-dark)' }}>
                    {item.categoria}
                  </span>
                </td>
                <td>
                  <span className={`badge ${expStatus.class}`} style={{ background: expStatus.background }}>
                    {expStatus.label}
                  </span>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {item.stock_inicial}
                </td>
                <td style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>
                  {item.current_stock} <small className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>{item.unidad}</small>
                </td>
                <td>
                  {isStockLow || expStatus.label.includes('VENCIDO') || expStatus.label.includes('<3m') ? (
                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      <AlertTriangle size={12} /> Crítico
                    </span>
                  ) : item.current_stock < 50 || expStatus.label.includes('<6m') ? (
                    <span className="badge badge-warning">Atención</span>
                  ) : (
                    <span className="badge badge-success">Seguro</span>
                  )}
                </td>
                {userRole === 'ADMIN' && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn" style={{ padding: '0.4rem', color: 'var(--primary)' }} title="Editar Stock Inicial">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="btn" 
                        style={{ padding: '0.4rem', color: 'var(--danger)' }} 
                        title="Eliminar del Catálogo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No se encontraron ítems con los filtros aplicados.
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
