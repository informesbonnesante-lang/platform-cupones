"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Calendar, ArrowDownRight, ArrowUpRight, ArrowRightLeft,
  AlertTriangle, Clock, TrendingUp, TrendingDown, ClipboardList, Download
} from 'lucide-react';

const HistoryTable = ({ inventory = [], consumptions = [], entries = [], transferencias = [], depositos = [] }) => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [filterDeposito, setFilterDeposito] = useState('TODOS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Unificar y ordenar datos
  const combinedData = useMemo(() => {
    const unified = [];
    
    // 1. 소비 데이터 (Consumptions)
    consumptions.forEach(c => {
      const invItem = inventory.find(i => String(i.id) === String(c.item_id));
      unified.push({
        id: `cons_${c.id}`,
        type: 'Consumo',
        timestamp: c.timestamp,
        itemName: c.item_name || invItem?.nombre || 'Desconocido',
        cantidad: c.cantidad,
        deposito: c.departamento || invItem?.area || 'Desconocido',
        responsable: c.staff || 'N/A',
        detalles: c.observaciones || `Paciente: ${c.paciente_nombre} (${c.paciente_ci})`,
        fechaObjeto: new Date(c.timestamp)
      });
    });

    // 2. 입고 데이터 (Entries)
    entries.forEach(e => {
      const invItem = inventory.find(i => String(i.id) === String(e.item_id));
      unified.push({
        id: `ent_${e.id}`,
        type: 'Ingreso',
        timestamp: e.timestamp,
        itemName: e.item_name || invItem?.nombre || 'Desconocido',
        cantidad: e.cantidad_ingresada,
        deposito: invItem?.area || 'Desconocido',
        responsable: e.usuario_registro || 'N/A',
        detalles: e.observaciones || `Prov: ${e.proveedor} | Fact: ${e.nro_factura || 'S/N'}`,
        fechaObjeto: new Date(e.timestamp)
      });
    });

    // 3. 이동 데이터 (Transferencias)
    transferencias.forEach(t => {
      unified.push({
        id: `trans_${t.id}`,
        type: 'Transferencia',
        timestamp: t.timestamp,
        itemName: t.item_name || 'Desconocido',
        cantidad: t.cantidad,
        deposito: t.from_area && t.to_area ? `${t.from_area} -> ${t.to_area}` : (t.to_area || 'Desconocido'),
        responsable: t.responsable || 'N/A',
        detalles: `Origen: ${t.from_area || 'SD'} | Destino: ${t.to_area || 'SD'}`,
        fechaObjeto: new Date(t.timestamp)
      });
    });

    return unified.sort((a, b) => b.fechaObjeto - a.fechaObjeto);
  }, [consumptions, entries, transferencias, inventory]);

  const normalize = (str) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Filtrado de la tabla unificada
  const filteredData = useMemo(() => {
    return combinedData.filter(d => {
      const term = normalize(searchTerm);
      const matchesSearch = !term || 
                            normalize(d.itemName).includes(term) ||
                            normalize(d.responsable).includes(term) ||
                            normalize(d.detalles).includes(term);
      
      const matchesType = filterType === 'TODOS' || d.type === filterType;
      const matchesDeposito = filterDeposito === 'TODOS' || normalize(d.deposito).includes(normalize(filterDeposito));
      
      // Normalize dates to YYYY-MM-DD for 100% robust string lexicographical comparison
      const itemDateStr = d.timestamp ? d.timestamp.split('T')[0] : '';
      const matchesDateFrom = !dateFrom || itemDateStr >= dateFrom;
      const matchesDateTo = !dateTo || itemDateStr <= dateTo;

      return matchesSearch && matchesType && matchesDeposito && matchesDateFrom && matchesDateTo;
    });
  }, [combinedData, searchTerm, filterType, filterDeposito, dateFrom, dateTo]);

  // Cálculos para Dashboard KPIs de la tabla filtrada
  const ingresosMes = useMemo(() => {
    return filteredData.filter(m => m.type === 'Ingreso').reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [filteredData]);

  const salidasMes = useMemo(() => {
    return filteredData.filter(m => m.type === 'Consumo').reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [filteredData]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(i => i.current_stock < (i.stock_minimo || 5)).length;
  }, [inventory]);

  const expiringCount = useMemo(() => {
    return inventory.filter(i => {
      if (!i.vencimiento || i.vencimiento === 'N/A') return false;
      const expDate = new Date(i.vencimiento);
      const diffDays = (expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;
  }, [inventory]);

  // Deduplicación del menú de depósitos
  const depositosList = useMemo(() => {
    const uniqueDepositos = [];
    const seenNormalized = new Set();
    
    const rawList = [
      ...depositos,
      ...inventory.map(i => i.area).filter(Boolean),
      ...consumptions.map(c => c.departamento).filter(Boolean),
      ...transferencias.map(t => t.from_area).filter(Boolean),
      ...transferencias.map(t => t.to_area).filter(Boolean)
    ];
    
    rawList.forEach(dep => {
      const norm = normalize(dep);
      if (norm && !seenNormalized.has(norm)) {
        seenNormalized.add(norm);
        uniqueDepositos.push(dep);
      }
    });

    return ['TODOS', ...uniqueDepositos];
  }, [depositos, inventory, consumptions, transferencias]);

  // Exportar Excel (CSV)
  const exportToCSV = () => {
    const headers = ['FECHA / HORA', 'TIPO', 'ÍTEM', 'CANTIDAD', 'DEPÓSITO', 'RESPONSABLE', 'OBSERVACIONES / DETALLES'];
    const rows = filteredData.map(m => [
      m.fechaObjeto.toLocaleString(),
      m.type,
      m.itemName,
      m.cantidad,
      m.deposito,
      m.responsable,
      m.detalles
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Movimientos_BonneSante_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER / TITULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={28} /> Reporte Integral de Movimientos
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>Historial completo de ingresos, salidas y alertas de inventario.</p>
        </div>
        <button 
          onClick={exportToCSV}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--primary)', 
            color: 'white', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '8px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
        >
          <Download size={16} /> Exportar Excel (CSV)
        </button>
      </div>

      {/* DASHBOARD KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ingresos (Filtrado)</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{ingresosMes} unds.</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '50%', color: '#f43f5e' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Salidas / Consumos</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{salidasMes} unds.</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Movimientos</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{filteredData.length} ítems</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Stock Crítico / Venc.</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{lowStockCount} / {expiringCount}</h3>
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
              <option value="Ingreso">Entradas (Ingresos)</option>
              <option value="Consumo">Salidas (Consumos)</option>
              <option value="Transferencia">Transferencias</option>
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
                    {row.type === 'Ingreso' && (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowDownRight size={14} /> Ingreso
                      </span>
                    )}
                    {row.type === 'Consumo' && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowUpRight size={14} /> Consumo
                      </span>
                    )}
                    {row.type === 'Transferencia' && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <ArrowRightLeft size={14} /> Transferencia
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {row.itemName}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {row.type === 'Ingreso' ? '+' : row.type === 'Consumo' ? '-' : ''}{row.cantidad}
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
