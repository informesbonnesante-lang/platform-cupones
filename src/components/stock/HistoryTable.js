"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Calendar, ArrowDownRight, ArrowUpRight, 
  AlertTriangle, Clock, TrendingUp, TrendingDown, ClipboardList 
} from 'lucide-react';

const HistoryTable = ({ inventory = [], consumptions = [], entries = [] }) => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [filterDeposito, setFilterDeposito] = useState('TODOS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Unificar y ordenar datos
  const combinedData = useMemo(() => {
    const unified = [];
    
    consumptions.forEach(c => {
      const invItem = inventory.find(i => i.id === c.item_id);
      unified.push({
        id: `cons_${c.id}`,
        type: 'SALIDA',
        timestamp: c.timestamp,
        itemName: c.item_name || invItem?.nombre || 'Desconocido',
        cantidad: c.cantidad,
        deposito: invItem?.area || 'Desconocido',
        responsable: c.staff || 'N/A',
        detalles: `Paciente: ${c.paciente_nombre} (${c.paciente_ci})`,
        fechaObjeto: new Date(c.timestamp)
      });
    });

    entries.forEach(e => {
      const invItem = inventory.find(i => i.id === e.item_id);
      unified.push({
        id: `ent_${e.id}`,
        type: 'ENTRADA',
        timestamp: e.timestamp,
        itemName: e.item_name || invItem?.nombre || 'Desconocido',
        cantidad: e.cantidad_ingresada,
        deposito: invItem?.area || 'Desconocido',
        responsable: e.usuario_registro || 'N/A',
        detalles: `Prov: ${e.proveedor} | Fact: ${e.nro_factura || 'S/N'}`,
        fechaObjeto: new Date(e.timestamp)
      });
    });

    return unified.sort((a, b) => b.fechaObjeto - a.fechaObjeto);
  }, [consumptions, entries, inventory]);

  // Cálculos para Dashboard KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let monthEntries = 0;
  let monthConsumptions = 0;

  combinedData.forEach(d => {
    if (d.fechaObjeto.getMonth() === currentMonth && d.fechaObjeto.getFullYear() === currentYear) {
      if (d.type === 'ENTRADA') monthEntries += d.cantidad;
      if (d.type === 'SALIDA') monthConsumptions += d.cantidad;
    }
  });

  const lowStockCount = inventory.filter(i => i.current_stock < (i.stock_minimo || 5)).length;
  const expiringCount = inventory.filter(i => {
    if (!i.vencimiento || i.vencimiento === 'N/A') return false;
    const expDate = new Date(i.vencimiento);
    const diffDays = (expDate - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  // Filtrado de la tabla unificada
  const filteredData = combinedData.filter(d => {
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || 
                          (d.itemName && d.itemName.toLowerCase().includes(term)) ||
                          (d.responsable && d.responsable.toLowerCase().includes(term)) ||
                          (d.detalles && d.detalles.toLowerCase().includes(term));
    
    const matchesType = filterType === 'TODOS' || d.type === filterType;
    const matchesDeposito = filterDeposito === 'TODOS' || d.deposito === filterDeposito;
    
    const matchesDateFrom = !dateFrom || d.fechaObjeto >= new Date(dateFrom);
    const matchesDateTo = !dateTo || d.fechaObjeto <= new Date(new Date(dateTo).setHours(23,59,59,999));

    return matchesSearch && matchesType && matchesDeposito && matchesDateFrom && matchesDateTo;
  });

  const depositosList = ['TODOS', ...new Set(inventory.map(i => i.area).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER / TITULO */}
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClipboardList size={28} /> Reporte Integral de Movimientos
        </h2>
        <p className="text-muted">Historial completo de ingresos, salidas y alertas de inventario.</p>
      </div>

      {/* DASHBOARD KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ingresos (Este Mes)</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{monthEntries} unds.</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '50%', color: '#f43f5e' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Salidas (Este Mes)</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{monthConsumptions} unds.</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bajo Stock Crítico</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{lowStockCount} ítems</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '50%', color: '#6366f1' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vencimiento Próximo</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{expiringCount} ítems</h3>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Buscar</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem' }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.75rem', outline: 'none', fontSize: '0.95rem' }} 
                placeholder="Ítem, paciente, responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Tipo de Movimiento</label>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="ENTRADA">Entradas (Ingresos)</option>
              <option value="SALIDA">Salidas (Consumos)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Depósito</label>
            <select className="input-field" value={filterDeposito} onChange={(e) => setFilterDeposito(e.target.value)}>
              {depositosList.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Desde Fecha</label>
            <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Hasta Fecha</label>
            <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TABLA UNIFICADA */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
              <tr>
                <th style={{ padding: '1.2rem 1rem' }}>Fecha / Hora</th>
                <th>Tipo</th>
                <th>Ítem</th>
                <th>Cantidad</th>
                <th>Depósito</th>
                <th>Responsable</th>
                <th>Observaciones / Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {row.fechaObjeto.toLocaleString()}
                  </td>
                  <td>
                    {row.type === 'ENTRADA' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowDownRight size={14} /> Entrada
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowUpRight size={14} /> Salida
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {row.itemName}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {row.type === 'ENTRADA' ? '+' : '-'}{row.cantidad}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <span className="badge badge-info" style={{ background: 'rgba(16, 163, 150, 0.1)', color: 'var(--primary-dark)' }}>
                      {row.deposito}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {row.responsable}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {row.detalles}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryTable;
