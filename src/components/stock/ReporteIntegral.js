"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseStockClient';
import { Download, Search, RefreshCw, FileText } from 'lucide-react';

export default function ReporteIntegral() {
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('Todos');
  const [deposito, setDeposito] = useState('TODOS');
  const [desdeFecha, setDesdeFecha] = useState('');
  const [hastaFecha, setHastaFecha] = useState('');
  const [listaDepositos, setListaDepositos] = useState([]);

  const fetchMovimientosHistorial = async () => {
    setLoading(true);
    let depMap = {};
    let tempDepsList = ['DEPÓSITO CENTRAL', 'ESTÉTICA', 'FARMACIA', 'ENFERMERÍA', 'RECEPCIÓN', 'LABORATORIO'];

    try {
      // 1. 창고 테이블(depositos) 안전 로드
      const { data: depsData, error: dError } = await supabase.from('depositos').select('id, nombre');
      if (dError) {
        console.warn("depositos fetch warning:", dError.message);
      } else if (depsData && depsData.length > 0) {
        const list = [];
        depsData.forEach(d => { 
          depMap[d.id] = d.nombre;
          list.push(d.nombre);
        });
        tempDepsList = list;
      }
    } catch (e) {
      console.error("depositos fetch error:", e);
    }
    setListaDepositos(tempDepsList);

    // 1.5. Build item -> area/warehouse mapping
    let itemToAreaMap = {};
    try {
      const { data: itemsData, error: iError } = await supabase.from('inventory_items').select('id, area, deposito_id');
      if (iError) {
        console.warn("inventory_items fetch warning:", iError.message);
      } else if (itemsData) {
        itemsData.forEach(item => {
          itemToAreaMap[item.id] = depMap[item.deposito_id] || item.area || 'Depósito Central';
        });
      }
    } catch (e) {
      console.error("inventory_items mapping error:", e);
    }

    let entries = [];
    try {
      // 2. entries(입고) 테이블 순수 호출
      const { data, error: eError } = await supabase
        .from('entries')
        .select('id, item_id, item_name, cantidad_ingresada, proveedor, nro_factura, timestamp, usuario_registro');
      
      if (eError) {
        console.warn("entries fetch warning:", eError.message);
        const { data: fallbackData } = await supabase.from('entries').select('*');
        if (fallbackData) entries = fallbackData;
      } else if (data) {
        entries = data;
      }
    } catch (e) {
      console.error("entries fetch error:", e);
    }

    let consumptions = [];
    try {
      // 3. consumptions(소비) 테이블 순수 호출
      const { data, error: cError } = await supabase
        .from('consumptions')
        .select('id, item_id, item_name, cantidad, paciente_nombre, paciente_ci, departamento, categoria_pago, staff, timestamp, usuario_registro');
      
      if (cError) {
        console.warn("consumptions fetch warning:", cError.message);
        const { data: fallbackData } = await supabase.from('consumptions').select('*');
        if (fallbackData) consumptions = fallbackData;
      } else if (data) {
        consumptions = data;
      }
    } catch (e) {
      console.error("consumptions fetch error:", e);
    }

    // 데이터 가공 및 정규화
    const normalizedEntries = entries.map(e => {
      const date = e.timestamp || e.created_at || new Date().toISOString();
      const cant = e.cantidad_ingresada !== undefined ? e.cantidad_ingresada : (e.cantidad || 0);
      const area = e.deposito_id ? (depMap[e.deposito_id] || 'Depósito Central') : (itemToAreaMap[e.item_id] || 'Depósito Central');
      const det = e.observaciones || `Proveedor: ${e.proveedor || 'N/A'}, Factura: ${e.nro_factura || 'N/A'}`;
      return {
        id: e.id,
        fecha_hora: date,
        tipo: 'Ingreso',
        item: e.item_name || 'Insumo sin nombre',
        cantidad: cant,
        deposito: area,
        responsable: e.usuario_registro ? 'ADMIN' : (e.responsable || 'admin'),
        detalles: det
      };
    });

    const normalizedConsumptions = consumptions.map(c => {
      const date = c.timestamp || c.created_at || new Date().toISOString();
      const cant = c.cantidad || 0;
      const area = c.deposito_id ? (depMap[c.deposito_id] || 'Depósito Central') : (itemToAreaMap[c.item_id] || c.departamento || 'Depósito Central');
      const det = c.observaciones || `Paciente: ${c.paciente_nombre || 'N/A'} (CI: ${c.paciente_ci || 'N/A'}) - ${c.categoria_pago || 'N/A'}`;
      return {
        id: c.id,
        fecha_hora: date,
        tipo: 'Consumo',
        item: c.item_name || 'Insumo sin nombre',
        cantidad: cant,
        deposito: area,
        responsable: c.staff || c.responsable || 'OPERADOR',
        detalles: det
      };
    });

    // 최신 등록 날짜순 통합 정렬
    const totalCombined = [...normalizedEntries, ...normalizedConsumptions]
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

    setMovimientos(totalCombined);
    setFilteredMovimientos(totalCombined);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovimientosHistorial();
  }, []);

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
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Historial unificado de entradas y salidas de stock sin errores de API.</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Download size={16} /> Exportar Excel (CSV)
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 border border-gray-100" style={{ background: 'rgba(255,255,255,0.4)' }}>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Ítem, responsable..." value={buscar} onChange={(e) => setBuscar(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-sm" style={{ height: '38px' }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Movimiento</label>
          <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-sm" style={{ height: '38px' }}>
            <option value="Todos">Todos</option>
            <option value="Ingreso">Entradas (Ingresos)</option>
            <option value="Consumo">Salidas (Consumos)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Depósito</label>
          <select value={deposito} onChange={(e) => setDeposito(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-sm" style={{ height: '38px' }}>
            <option value="TODOS">TODOS</option>
            {listaDepositos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Desde Fecha</label>
          <input type="date" value={desdeFecha} onChange={(e) => setDesdeFecha(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-1.5 text-sm" style={{ height: '38px' }} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Hasta Fecha</label>
          <input type="date" value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-1.5 text-sm" style={{ height: '38px' }} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <button onClick={handleLimpiarFiltros} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
          Limpiar Filtros
        </button>
        <button onClick={handleFiltrarMovi} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
          Buscar
        </button>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4">Fecha / Hora</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Ítem</th>
              <th className="p-4" style={{ textAlign: 'center' }}>Cantidad</th>
              <th className="p-4">Depósito</th>
              <th className="p-4">Responsable</th>
              <th className="p-4">Observaciones / Detalles</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  <RefreshCw className="animate-spin inline mr-2" size={16} style={{ display: 'inline', animation: 'fadeIn 1s infinite' }} /> 안전하게 데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredMovimientos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  기록된 입출고 움직임 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredMovimientos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs">{new Date(m.fecha_hora).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`badge ${
                      m.tipo === 'Ingreso' ? 'badge-success' : 'badge-danger'
                    }`} style={{ textTransform: 'none' }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{m.item}</td>
                  <td className="p-4 font-bold" style={{ textAlign: 'center' }}>{m.cantidad}</td>
                  <td className="p-4">{renderDepositoBadge(m.deposito)}</td>
                  <td className="p-4 text-gray-500">{m.responsable}</td>
                  <td className="p-4 text-xs italic text-gray-400">{m.detalles}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
