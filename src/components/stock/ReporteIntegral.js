import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseStockClient';
import { Download, Search, RefreshCw, Calendar, FileText } from 'lucide-react';

export default function ReporteIntegral() {
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state variables (initial values empty)
  const [buscar, setBuscar] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('Todos');
  const [deposito, setDeposito] = useState('TODOS');
  const [desdeFecha, setDesdeFecha] = useState('');
  const [hastaFecha, setHastaFecha] = useState('');
  const [listaDepositos, setListaDepositos] = useState([]);

  const fetchMovimientosHistorial = async () => {
    setLoading(true);
    try {
      // 1. Build warehouse dictionary mapping ID -> Name
      const { data: depsData } = await supabase.from('depositos').select('id, nombre');
      const depMap = {};
      if (depsData) {
        depsData.forEach(d => { depMap[d.id] = d.nombre; });
      }

      // 1.5. Build item -> area/warehouse mapping
      const { data: itemsData } = await supabase.from('inventory_items').select('id, area, deposito_id');
      const itemToAreaMap = {};
      if (itemsData) {
        itemsData.forEach(item => {
          itemToAreaMap[item.id] = depMap[item.deposito_id] || item.area || 'Depósito Central';
        });
      }

      // 2. Fetch real entries historical data (using actual column names)
      const { data: entries, error: eError } = await supabase
        .from('entries')
        .select('id, item_id, item_name, cantidad_ingresada, proveedor, nro_factura, timestamp, usuario_registro');

      // 3. Fetch real consumptions historical data (using actual column names)
      const { data: consumptions, error: cError } = await supabase
        .from('consumptions')
        .select('id, item_id, item_name, cantidad, paciente_nombre, paciente_ci, departamento, categoria_pago, staff, timestamp, usuario_registro');

      if (eError) console.error("Entries load error:", eError.message);
      if (cError) console.error("Consumptions load error:", cError.message);

      // 4. Normalize and combine data
      const normalizedEntries = (entries || []).map(e => ({
        id: e.id,
        fecha_hora: e.timestamp,
        tipo: 'Ingreso',
        item: e.item_name || 'Sin nombre',
        cantidad: e.cantidad_ingresada || 0,
        deposito: itemToAreaMap[e.item_id] || 'Depósito Central',
        responsable: e.usuario_registro ? 'ADMIN' : 'admin',
        detalles: `Proveedor: ${e.proveedor || 'N/A'}, Factura: ${e.nro_factura || 'N/A'}`
      }));

      const normalizedConsumptions = (consumptions || []).map(c => ({
        id: c.id,
        fecha_hora: c.timestamp,
        tipo: 'Consumo',
        item: c.item_name || 'Sin nombre',
        cantidad: c.cantidad || 0,
        deposito: itemToAreaMap[c.item_id] || c.departamento || 'Depósito Central',
        responsable: c.staff || 'OPERADOR',
        detalles: `Paciente: ${c.paciente_nombre || 'N/A'} (CI: ${c.paciente_ci || 'N/A'}) - ${c.categoria_pago || 'N/A'}`
      }));

      // Sort by newest date
      const totalCombined = [...normalizedEntries, ...normalizedConsumptions]
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

      setMovimientos(totalCombined);
      setFilteredMovimientos(totalCombined);

      // Extract unique warehouse list for select dropdown
      const uDeps = Array.from(new Set(totalCombined.map(m => m.deposito))).filter(Boolean);
      setListaDepositos(uDeps);

      console.log("🔵 Unified Report Loaded:", totalCombined.length, "items");

    } catch (err) {
      console.error("Critical error in report unifier:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientosHistorial();
  }, []);

  // Complex filtering triggered by search button or state changes
  const handleFiltrarMovi = () => {
    let result = [...movimientos];

    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      result = result.filter(m => 
        m.item.toLowerCase().includes(q) || 
        m.responsable.toLowerCase().includes(q) || 
        m.detalles.toLowerCase().includes(q)
      );
    }

    if (tipoMovimiento !== 'Todos') {
      result = result.filter(m => m.tipo === tipoMovimiento);
    }

    if (deposito !== 'TODOS') {
      result = result.filter(m => m.deposito === deposito);
    }

    if (desdeFecha.trim() !== '') {
      result = result.filter(m => new Date(m.fecha_hora) >= new Date(desdeFecha));
    }
    if (hastaFecha.trim() !== '') {
      const hasta = new Date(hastaFecha);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter(m => new Date(m.fecha_hora) <= hasta);
    }

    setFilteredMovimientos(result);
  };

  const handleLimpiarFiltros = () => {
    setBuscar('');
    setTipoMovimiento('Todos');
    setDeposito('TODOS');
    setDesdeFecha('');
    setHastaFecha('');
    setFilteredMovimientos(movimientos);
  };

  const exportToCSV = () => {
    const headers = ['FECHA / HORA', 'TIPO', 'ÍTEM', 'CANTIDAD', 'DEPÓSITO', 'RESPONSABLE', 'OBSERVACIONES / DETALLES'];
    const rows = filteredMovimientos.map(m => [
      new Date(m.fecha_hora).toLocaleString(),
      m.tipo,
      m.item,
      m.cantidad,
      m.deposito,
      m.responsable,
      m.detalles
    ]);

    const escapeCSV = (val) => {
      const stringVal = String(val ?? '');
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];

    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Movimientos_Completo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to determine warehouse badge class or custom style
  const renderDepositoBadge = (areaName) => {
    const name = (areaName || 'Depósito Central').trim().toUpperCase();
    if (name.includes('CENTRAL')) {
      return <span className="badge badge-info" style={{ textTransform: 'none' }}>Depósito Central</span>;
    }
    if (name.includes('ENFERMERÍA') || name.includes('ENFERMERIA')) {
      return <span className="badge badge-success" style={{ textTransform: 'none' }}>Enfermería</span>;
    }
    if (name.includes('ESTÉTICA') || name.includes('ESTETICA')) {
      return <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', textTransform: 'none' }}>Estética</span>;
    }
    if (name.includes('FARMACIA')) {
      return <span className="badge badge-warning" style={{ textTransform: 'none' }}>Farmacia</span>;
    }
    if (name.includes('RECEPCIÓN') || name.includes('RECEPCION')) {
      return <span className="badge" style={{ background: '#f1f5f9', color: '#475569', textTransform: 'none' }}>Recepción</span>;
    }
    if (name.includes('LABORATORIO')) {
      return <span className="badge badge-info" style={{ textTransform: 'none' }}>Laboratorio</span>;
    }
    return <span className="badge" style={{ background: '#f1f5f9', color: '#475569', textTransform: 'none' }}>{areaName}</span>;
  };

  return (
    <div className="glass-card animate-fade" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="var(--primary)" /> Reporte Integral de Movimientos
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Historial unificado de entradas y salidas de stock.</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Download size={16} /> Exportar Excel (CSV)
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.4)', boxShadow: 'none', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Ítem, responsable..." 
                value={buscar} 
                onChange={(e) => setBuscar(e.target.value)} 
                className="input-field" 
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Tipo de Movimiento</label>
            <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)} className="input-field">
              <option value="Todos">Todos</option>
              <option value="Ingreso">Entradas (Ingresos)</option>
              <option value="Consumo">Salidas (Consumos)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Depósito</label>
            <select value={deposito} onChange={(e) => setDeposito(e.target.value)} className="input-field">
              <option value="TODOS">TODOS</option>
              {listaDepositos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Desde Fecha</label>
            <input type="date" value={desdeFecha} onChange={(e) => setDesdeFecha(e.target.value)} className="input-field" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Hasta Fecha</label>
            <input type="date" value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button onClick={handleLimpiarFiltros} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
          Limpiar Filtros
        </button>
        <button onClick={handleFiltrarMovi} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
          Buscar
        </button>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Tipo</th>
              <th>Ítem</th>
              <th style={{ textAlign: 'center' }}>Cantidad</th>
              <th>Depósito</th>
              <th>Responsable</th>
              <th>Observaciones / Detalles</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={16} style={{ marginRight: '8px', verticalAlign: 'middle', animation: 'fadeIn 1s infinite' }} /> Unificando movimientos del inventario...
                </td>
              </tr>
            ) : filteredMovimientos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No se encontraron registros de movimiento.
                </td>
              </tr>
            ) : (
              filteredMovimientos.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {new Date(m.fecha_hora).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${m.tipo === 'Ingreso' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'none' }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.item}</td>
                  <td style={{ fontWeight: 700, textAlign: 'center' }}>{m.cantidad}</td>
                  <td>{renderDepositoBadge(m.deposito)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.responsable}</td>
                  <td style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{m.detalles}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
