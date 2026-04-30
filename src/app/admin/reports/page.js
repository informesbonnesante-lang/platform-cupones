'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileDown, FileSpreadsheet, Search, Filter, X,
  Hash, User, Calendar, Clock, RefreshCw,
} from 'lucide-react';
import { getCoupons } from '../../../lib/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt    = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';
const fmtDT  = (d) => d ? new Date(d).toLocaleString('es-ES')    : '—';

function getStatus(c) {
  const fin = c.used_at !== null || c.used_sessions >= c.total_sessions;
  const exp = c.expiry_date && new Date(c.expiry_date) < new Date();
  if (fin)  return 'Utilizado';
  if (exp)  return 'Vencido';
  if (c.used_sessions > 0) return 'En Uso';
  return 'Válido';
}

const BADGE_STYLES = {
  'Válido':    { background: '#D1FAE5', color: '#065F46' },
  'En Uso':    { background: '#FEF3C7', color: '#92400E' },
  'Utilizado': { background: '#E5E7EB', color: '#374151' },
  'Vencido':   { background: '#FEE2E2', color: '#991B1B' },
};

// ─── CSV / Excel export ───────────────────────────────────────────────────────
function buildCSV(rows) {
  const headers = [
    'N° Servicio', 'Código', 'Paciente', 'CI', 'Teléfono',
    'Categoría', 'Servicio', 'Estado', 'Sesiones Usadas', 'Sesiones Total',
    'Pago', 'Monto', 'Método Pago', 'Responsable',
    'Fecha Carga', 'Fecha Uso', 'Vencimiento',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((c) =>
      [
        c.ui_number || c.code,
        c.code,
        c.patient_name,
        c.patient_ci,
        c.telefono,
        c.service_category,
        c.service_detail,
        getStatus(c),
        c.used_sessions,
        c.total_sessions,
        c.payment_status,
        c.monto_pagado ?? '',
        c.payment_option,
        c.created_by,
        fmt(c.created_at),
        fmt(c.used_at),
        fmt(c.expiry_date),
      ].map(escape).join(',')
    ),
  ];
  return lines.join('\r\n');
}

function download(content, filename, mime) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── component ───────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);

  // filtros
  const [fPatient,    setFPatient]   = useState('');
  const [fCreatedBy,  setFCreatedBy] = useState('');
  const [fStatus,     setFStatus]    = useState('');
  const [fCreatedFrom,setFCreatedFrom]= useState('');
  const [fCreatedTo,  setFCreatedTo] = useState('');
  const [fUsedFrom,   setFUsedFrom]  = useState('');
  const [fUsedTo,     setFUsedTo]    = useState('');

  useEffect(() => {
    getCoupons().then((d) => { setCoupons(d); setLoading(false); });
  }, []);

  const refresh = () => {
    setLoading(true);
    getCoupons().then((d) => { setCoupons(d); setLoading(false); });
  };

  const clearFilters = () => {
    setFPatient(''); setFCreatedBy(''); setFStatus('');
    setFCreatedFrom(''); setFCreatedTo('');
    setFUsedFrom(''); setFUsedTo('');
  };

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (fPatient && !(
        (c.patient_name || '').toLowerCase().includes(fPatient.toLowerCase()) ||
        (c.patient_ci   || '').toLowerCase().includes(fPatient.toLowerCase())
      )) return false;

      if (fCreatedBy && !(c.created_by || '').toLowerCase().includes(fCreatedBy.toLowerCase()))
        return false;

      if (fStatus && getStatus(c) !== fStatus) return false;

      const created = c.created_at ? new Date(c.created_at) : null;
      if (fCreatedFrom && created && created < new Date(fCreatedFrom)) return false;
      if (fCreatedTo   && created && created > new Date(fCreatedTo + 'T23:59:59')) return false;

      const used = c.used_at ? new Date(c.used_at) : null;
      if (fUsedFrom && (!used || used < new Date(fUsedFrom))) return false;
      if (fUsedTo   && (!used || used > new Date(fUsedTo + 'T23:59:59'))) return false;

      return true;
    });
  }, [coupons, fPatient, fCreatedBy, fStatus, fCreatedFrom, fCreatedTo, fUsedFrom, fUsedTo]);

  const exportCSV = () => {
    const ts = new Date().toISOString().slice(0, 10);
    download(buildCSV(filtered), `reporte_cupones_${ts}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportExcel = () => {
    // CSV con extensión .xls — Excel lo abre automáticamente
    const ts = new Date().toISOString().slice(0, 10);
    download(buildCSV(filtered), `reporte_cupones_${ts}.xls`, 'application/vnd.ms-excel');
  };

  const hasFilter = fPatient || fCreatedBy || fStatus || fCreatedFrom || fCreatedTo || fUsedFrom || fUsedTo;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ margin: 0 }}>Reporte de Cupones</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
            {loading ? 'Cargando...' : `${filtered.length} de ${coupons.length} registros`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={refresh}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#F3F4F6', border: '1px solid #E5E7EB',
              color: '#374151', fontWeight: 500, cursor: 'pointer',
              padding: '0.55rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem',
            }}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
          <button
            onClick={exportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              color: '#1D4ED8', fontWeight: 600, cursor: 'pointer',
              padding: '0.55rem 1.1rem', borderRadius: '0.5rem', fontSize: '0.9rem',
            }}
          >
            <FileDown size={16} /> Exportar CSV
          </button>
          <button
            onClick={exportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              color: '#15803D', fontWeight: 600, cursor: 'pointer',
              padding: '0.55rem 1.1rem', borderRadius: '0.5rem', fontSize: '0.9rem',
            }}
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6" style={{ borderTop: '3px solid #1890FF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={16} color="#1890FF" />
          <span style={{ fontWeight: 600, color: '#0A4275' }}>Filtros</span>
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem',
                color: '#EF4444', cursor: 'pointer', padding: '0.2rem 0.6rem', fontSize: '0.8rem',
              }}
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Paciente */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <User size={12} /> Paciente / CI
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="text" className="input-field" value={fPatient}
                onChange={(e) => setFPatient(e.target.value)}
                placeholder="Nombre o CI..."
                style={{ paddingLeft: '2.2rem' }} />
            </div>
          </div>

          {/* Responsable */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <User size={12} /> Responsable
            </label>
            <input type="text" className="input-field" value={fCreatedBy}
              onChange={(e) => setFCreatedBy(e.target.value)}
              placeholder="Usuario que cargó..." />
          </div>

          {/* Estado */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Estado</label>
            <select className="input-field" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">Todos</option>
              <option>Válido</option>
              <option>En Uso</option>
              <option>Utilizado</option>
              <option>Vencido</option>
            </select>
          </div>

          {/* Fecha carga desde */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> Carga — Desde
            </label>
            <input type="date" className="input-field" value={fCreatedFrom}
              onChange={(e) => setFCreatedFrom(e.target.value)} />
          </div>

          {/* Fecha carga hasta */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> Carga — Hasta
            </label>
            <input type="date" className="input-field" value={fCreatedTo}
              onChange={(e) => setFCreatedTo(e.target.value)} />
          </div>

          {/* Fecha uso desde */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Uso — Desde
            </label>
            <input type="date" className="input-field" value={fUsedFrom}
              onChange={(e) => setFUsedFrom(e.target.value)} />
          </div>

          {/* Fecha uso hasta */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Uso — Hasta
            </label>
            <input type="date" className="input-field" value={fUsedTo}
              onChange={(e) => setFUsedTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>N° Servicio</th>
                <th>Paciente</th>
                <th>Servicio</th>
                <th style={{ textAlign: 'center' }}>Sesiones</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Responsable</th>
                <th>Fecha Carga</th>
                <th>Fecha Uso</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                    Cargando datos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                    No hay registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const status = getStatus(c);
                  const badgeStyle = BADGE_STYLES[status] || {};
                  const isExp = c.expiry_date && new Date(c.expiry_date) < new Date() && status !== 'Utilizado';
                  return (
                    <tr key={c.id} style={{ background: isExp ? '#FFF5F5' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Hash size={12} color="#1890FF" />
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A4275', fontSize: '0.85rem' }}>
                            {c.ui_number || c.code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.patient_name || '—'}</div>
                        <div style={{ fontSize: '0.73rem', color: '#6B7280' }}>CI: {c.patient_ci}</div>
                        <div style={{ fontSize: '0.73rem', color: '#6B7280' }}>Tel: {c.telefono}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                          {c.service_category}
                        </div>
                        <div style={{ fontSize: '0.88rem' }}>{c.service_detail}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1890FF' }}>
                        {c.used_sessions}/{c.total_sessions}
                      </td>
                      <td>
                        <span className="badge" style={{ ...badgeStyle, fontSize: '0.78rem' }}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                          {c.payment_status}{c.payment_status === 'Parcial' ? ` ($${c.monto_pagado})` : ''}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#6B7280' }}>{c.payment_option}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{c.created_by || '—'}</td>
                      <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>{fmt(c.created_at)}</td>
                      <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap', color: c.used_at ? '#059669' : '#9CA3AF' }}>
                        {c.used_at ? fmtDT(c.used_at) : '—'}
                      </td>
                      <td style={{
                        fontSize: '0.83rem', whiteSpace: 'nowrap',
                        color: isExp ? '#EF4444' : 'inherit',
                        fontWeight: isExp ? 600 : 'normal',
                      }}>
                        {fmt(c.expiry_date)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#F8FAFC', fontSize: '0.85rem', color: '#6B7280',
          }}>
            <span>Mostrando <b style={{ color: '#0A4275' }}>{filtered.length}</b> registros</span>
            <span>Total en base de datos: <b>{coupons.length}</b></span>
          </div>
        )}
      </div>
    </div>
  );
}
