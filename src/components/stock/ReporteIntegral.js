"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseStockClient';
import { Download, Search, RefreshCw, FileText } from 'lucide-react';

export default function ReporteIntegral() {
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [buscar, setBuscar] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('Todos');
  const [deposito, setDeposito] = useState('TODOS');
  const [listaDepositos, setListaDepositos] = useState([]);

  const fetchTodoHistorial = async () => {
    setLoading(true);
    let depMap = {};
    let tempDepsList = ['DEPÓSITO CENTRAL', 'ESTÉTICA', 'FARMACIA', 'ENFERMERÍA', 'RECEPCIÓN', 'LABORATORIO'];

    try {
      // 1. 창고 마스터 로드
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

    // 2. Entries (입고) 호출
    let entries = [];
    try {
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

    // 3. Consumptions (소비) 호출
    let consumptions = [];
    try {
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

    // 4. Transferencias (이동) 호출 - 스키마 컬럼 실시간 정합성 보장
    let transferencias = [];
    try {
      const { data, error: tError } = await supabase
        .from('transferencias')
        .select('id, item_name, from_area, to_area, cantidad, responsable, timestamp');
      
      if (tError) {
        console.warn("transferencias fetch warning:", tError.message);
        const { data: fallbackData } = await supabase.from('transferencias').select('*');
        if (fallbackData) transferencias = fallbackData;
      } else if (data) {
        transferencias = data;
      }
    } catch (e) {
      console.error("transferencias fetch error:", e);
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

    const normalizedTransfers = transferencias.map(t => {
      const date = t.timestamp || t.created_at || new Date().toISOString();
      const cant = t.cantidad || 0;
      const fromAreaName = t.from_area || 'Origen';
      const toAreaName = t.to_area || 'Destino';
      return {
        id: t.id,
        fecha_hora: date,
        tipo: 'Transferencia',
        item: t.item_name || 'Insumo',
        cantidad: cant,
        deposito: `${fromAreaName} ➔ ${toAreaName}`,
        responsable: t.responsable || 'admin',
        detalles: t.observaciones || 'Transferencia entre depósitos'
      };
    });

    // 최신 등록 날짜순 통합 정렬 완료
    const totalCombined = [...normalizedEntries, ...normalizedConsumptions, ...normalizedTransfers]
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

    setMovimientos(totalCombined);
    setFilteredMovimientos(totalCombined);
    setCurrentPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodoHistorial();
  }, []);

  const handleFiltrarMovi = () => {
    let result = [...movimientos];

    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      result = result.filter(m => 
        m.item.toLowerCase().includes(q) || 
        m.responsable.toLowerCase().includes(q)
      );
    }

    if (tipoMovimiento !== 'Todos') {
      result = result.filter(m => m.tipo === tipoMovimiento);
    }

    if (deposito !== 'TODOS') {
      result = result.filter(m => m.deposito.toLowerCase().includes(deposito.toLowerCase()));
    }

    setFilteredMovimientos(result);
    setCurrentPage(1);
  };

  const handleLimpiarFiltros = () => {
    setBuscar('');
    setTipoMovimiento('Todos');
    setDeposito('TODOS');
    setFilteredMovimientos(movimientos);
    setCurrentPage(1);
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
    if (name.includes('➔') || name.includes('->')) {
      return <span className="badge" style={{ background: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1', textTransform: 'none', fontWeight: 600 }}>{areaName}</span>;
    }
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

  const renderTipoBadge = (tipo) => {
    if (tipo === 'Ingreso') {
      return <span className="badge badge-success" style={{ textTransform: 'none' }}>Ingreso</span>;
    }
    if (tipo === 'Consumo') {
      return <span className="badge badge-danger" style={{ textTransform: 'none' }}>Consumo</span>;
    }
    return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', textTransform: 'none', fontWeight: 600 }}>Transferencia</span>;
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovimientos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage);

  return (
    <div className="glass-card animate-fade" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="var(--primary)" /> Reporte Integral de Movimientos
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Historial unificado de entradas, salidas y transferencias de stock sin errores de API.</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Download size={16} /> Exportar Excel (CSV)
        </button>
      </div>

      {/* 🛠️ 칼정렬 정돈된 flex-wrap 필터 바 */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex flex-wrap items-center gap-4" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label className="block text-xs font-bold text-gray-600 mb-1">Buscar</label>
          <input 
            type="text" 
            placeholder="Ítem, responsable..." 
            value={buscar} 
            onChange={(e) => setBuscar(e.target.value)} 
            className="input-field"
            style={{ height: '38px' }}
          />
        </div>
        <div style={{ width: '176px' }}>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Movimiento</label>
          <select 
            value={tipoMovimiento} 
            onChange={(e) => setTipoMovimiento(e.target.value)} 
            className="input-field"
            style={{ height: '38px' }}
          >
            <option value="Todos">Todos</option>
            <option value="Ingreso">Entradas (Ingresos)</option>
            <option value="Consumo">Salidas (Consumos)</option>
            <option value="Transferencia">Transferencias</option>
          </select>
        </div>
        <div style={{ width: '176px' }}>
          <label className="block text-xs font-bold text-gray-600 mb-1">Depósito</label>
          <select 
            value={deposito} 
            onChange={(e) => setDeposito(e.target.value)} 
            className="input-field"
            style={{ height: '38px' }}
          >
            <option value="TODOS">TODOS</option>
            {listaDepositos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', items: 'end', gap: '8px', alignSelf: 'flex-end' }}>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary" style={{ padding: '0.5rem 1.2rem', height: '38px', fontSize: '0.85rem' }}>
            Limpiar
          </button>
          <button onClick={handleFiltrarMovi} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', height: '38px', fontSize: '0.85rem' }}>
            Buscar
          </button>
        </div>
      </div>

      {/* 🛠️ 높이 고정 스크롤 컨테이너 테이블 박스 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden" style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div className="overflow-y-auto max-h-[calc(100vh-360px)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Fecha / Hora</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Tipo</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Ítem</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Cantidad</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Depósito / Ruta</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Responsable</th>
                <th className="p-4" style={{ padding: '1.25rem 1rem' }}>Observaciones / Detalles</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <RefreshCw className="animate-spin inline mr-2" size={16} style={{ display: 'inline', animation: 'fadeIn 1s infinite' }} /> Cargando historial unificado...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No se encontraron registros de movimientos.
                  </td>
                </tr>
              ) : (
                currentItems.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-xs" style={{ padding: '1.25rem 1rem' }}>{new Date(m.fecha_hora).toLocaleString()}</td>
                    <td className="p-4" style={{ padding: '1.25rem 1rem' }}>{renderTipoBadge(m.tipo)}</td>
                    <td className="p-4 font-semibold text-slate-700" style={{ padding: '1.25rem 1rem' }}>{m.item}</td>
                    <td className="p-4 font-bold" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>{m.cantidad}</td>
                    <td className="p-4" style={{ padding: '1.25rem 1rem' }}>{renderDepositoBadge(m.deposito)}</td>
                    <td className="p-4 text-gray-500" style={{ padding: '1.25rem 1rem' }}>{m.responsable}</td>
                    <td className="p-4 text-xs italic text-gray-400" style={{ padding: '1.25rem 1rem' }}>{m.detalles}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🛠️ 화면 바닥에 무조건 안전 노출되는 페이지네이션 제어 바 */}
        <div className="flex justify-between items-center p-4 bg-slate-50 border-t border-gray-100 text-sm w-full" style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <span className="text-gray-500 font-medium">
            Mostrando {filteredMovimientos.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredMovimientos.length)} de {filteredMovimientos.length} items
          </span>
          <div className="flex gap-1.5" style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: '32px' }}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={page} 
                onClick={() => setCurrentPage(page)} 
                className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '0.4rem 0.6rem', 
                  fontSize: '0.75rem', 
                  minWidth: '32px', 
                  height: '32px',
                  background: currentPage === page ? 'var(--primary)' : 'white',
                  color: currentPage === page ? 'white' : 'var(--text-main)',
                  borderColor: currentPage === page ? 'var(--primary)' : 'var(--border)'
                }}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages || totalPages === 0} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: '32px' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
