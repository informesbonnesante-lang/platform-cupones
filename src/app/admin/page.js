'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, DollarSign, Hash } from 'lucide-react';
import { getCoupons, saveCoupon, generateUINumber, updatePatientInfoByCI } from '../../lib/api';

const INITIAL_FORM = {
  ui_number_manual: '',
  patient_name: '',
  patient_ci: '',
  telefono: '',
  service_category: '',
  service_detail: '',
  expiry_date: '',
  payment_option: 'Efectivo',
  payment_status: 'Total',
  monto_pagado: '',
  total_sessions: 1,
  quantity: 1,
};

export default function AdminPage() {
  const [coupons, setCoupons]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [formData, setFormData]     = useState(INITIAL_FORM);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadedPatientInfo, setLoadedPatientInfo] = useState(null);

  // Extraer pacientes únicos mapeados por CI para búsqueda ultra rápida
  const uniquePatientsMap = useMemo(() => {
    const map = new Map();
    coupons.forEach(c => {
      if (c.patient_ci && !map.has(c.patient_ci)) {
        map.set(c.patient_ci, {
          name: c.patient_name,
          ci: c.patient_ci,
          telefono: c.telefono
        });
      }
    });
    return map;
  }, [coupons]);

  useEffect(() => {
    getCoupons().then((data) => {
      setCoupons(data);
      setIsLoading(false);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'patient_ci') {
      const match = uniquePatientsMap.get(value.trim());
      if (match) {
        setFormData(prev => ({ ...prev, patient_ci: value, patient_name: match.name, telefono: match.telefono }));
        setLoadedPatientInfo(match);
      } else {
        setFormData(prev => ({ ...prev, patient_ci: value }));
        if (loadedPatientInfo) setLoadedPatientInfo(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateCode = () =>
    'VALE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // --- CHECK: Conflicto de CI ---
    if (loadedPatientInfo && formData.patient_name.trim() !== loadedPatientInfo.name) {
      const confirmUpdate = window.confirm(
        `Atención: El número de CI ${formData.patient_ci} ya está registrado a nombre de "${loadedPatientInfo.name}".\n\n¿Desea actualizar todos los registros previos para que queden a nombre de "${formData.patient_name.trim()}"?`
      );
      
      if (confirmUpdate) {
        // Actualizamos DB
        await updatePatientInfoByCI(formData.patient_ci, formData.patient_name.trim(), formData.telefono.trim());
        // Actualizamos el estado local
        setCoupons(prev => prev.map(c => 
          c.patient_ci === formData.patient_ci 
            ? { ...c, patient_name: formData.patient_name.trim(), telefono: formData.telefono.trim() } 
            : c
        ));
        setLoadedPatientInfo({ ...loadedPatientInfo, name: formData.patient_name.trim(), telefono: formData.telefono.trim() });
      } else {
        setIsSaving(false);
        return;
      }
    }
    // --- FIN CHECK ---

    const qty        = parseInt(formData.quantity) || 1;
    const createdBy  = localStorage.getItem('medcupon_user') || 'Administrador';
    const results    = [];

    for (let i = 0; i < qty; i++) {
      // Si el usuario ingresó un número manual y es un solo cupón, usarlo; si no, auto-generar
      const uiNumber =
        formData.ui_number_manual.trim() !== '' && qty === 1
          ? formData.ui_number_manual.trim()
          : await generateUINumber();
      const coupon   = {
        ui_number:        uiNumber,
        code:             generateCode(),
        patient_name:     formData.patient_name,
        patient_ci:       formData.patient_ci,
        telefono:         formData.telefono,
        service_category: formData.service_category,
        service_detail:   formData.service_detail,
        expiry_date:      formData.expiry_date,
        payment_option:   formData.payment_option,
        payment_status:   formData.payment_status,
        monto_pagado:
          formData.payment_status === 'Parcial'
            ? parseFloat(formData.monto_pagado)
            : null,
        total_sessions: parseInt(formData.total_sessions) || 1,
        used_sessions:  0,
        created_by:     createdBy,
        used_at:        null,
      };
      const saved = await saveCoupon(coupon);
      if (saved) results.push(saved);
    }

    setCoupons([...results, ...coupons]);
    setShowForm(false);
    setFormData(INITIAL_FORM);
    setIsSaving(false);
  };

  const isExpired = (d) => d && new Date(d) < new Date();

  const filtered = coupons.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (c.ui_number || '').toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.patient_ci.toLowerCase().includes(q) ||
      (c.patient_name || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q);

    const fin = c.used_sessions >= c.total_sessions;
    const exp = isExpired(c.expiry_date);

    let matchStatus = true;
    if (statusFilter === 'valid')   matchStatus = !fin && !exp && c.used_sessions === 0;
    if (statusFilter === 'in_use')  matchStatus = !fin && !exp && c.used_sessions > 0;
    if (statusFilter === 'used')    matchStatus = fin;
    if (statusFilter === 'expired') matchStatus = !fin && exp;

    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <h1 style={{ margin: 0 }}>Gestión de Cupones</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} />
          {showForm ? 'Ocultar' : 'Nuevo Cupón'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-2 mb-6">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#E6F7FF', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={28} color="#0A4275" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Pagados al 100%</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A4275' }}>
              {coupons.filter((c) => c.payment_status === 'Total').length}
            </div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={28} color="#92400E" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Pago Parcial</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#92400E' }}>
              {coupons.filter((c) => c.payment_status === 'Parcial').length}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6" style={{ borderTop: '4px solid #1890FF' }}>
          <h2 className="mb-4">Nuevo Cupón</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={13} color="#1890FF" />
                  N° de Servicio (UI)
                  <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.78rem' }}>
                    — Dejar vacío para auto-generar
                  </span>
                </label>
                <input type="text" className="input-field" name="ui_number_manual"
                  value={formData.ui_number_manual} onChange={handleChange}
                  placeholder="Ej: 20260430-001  (opcional)" />
              </div>
              <div className="input-group">
                <label className="input-label">CI del Paciente</label>
                <input required type="text" className="input-field" name="patient_ci"
                  value={formData.patient_ci} onChange={handleChange}
                  placeholder="Ej: 4567890" />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Nombre del Paciente
                  {loadedPatientInfo && <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✅ Datos cargados</span>}
                </label>
                <input required type="text" className="input-field" name="patient_name"
                  value={formData.patient_name} onChange={handleChange}
                  placeholder="Ej: María García" 
                  style={loadedPatientInfo ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' } : {}}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Teléfono / WhatsApp
                  {loadedPatientInfo && <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✅ Datos cargados</span>}
                </label>
                <input required type="text" className="input-field" name="telefono"
                  value={formData.telefono} onChange={handleChange}
                  placeholder="Ej: 0981234567" 
                  style={loadedPatientInfo ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' } : {}}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Categoría del Servicio</label>
                <input required type="text" className="input-field" name="service_category"
                  value={formData.service_category} onChange={handleChange}
                  placeholder="Ej: Kinesiología" />
              </div>
              <div className="input-group">
                <label className="input-label">Detalle del Servicio</label>
                <input required type="text" className="input-field" name="service_detail"
                  value={formData.service_detail} onChange={handleChange}
                  placeholder="Ej: Masajes Terapéuticos" />
              </div>
              <div className="input-group">
                <label className="input-label">Fecha de Vencimiento</label>
                <input required type="date" className="input-field" name="expiry_date"
                  value={formData.expiry_date} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Sesiones Totales</label>
                <input required type="number" min="1" className="input-field" name="total_sessions"
                  value={formData.total_sessions} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Opción de Pago</label>
                <select className="input-field" name="payment_option"
                  value={formData.payment_option} onChange={handleChange}>
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Transferencia</option>
                  <option>Seguro Médico</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Estado de Pago</label>
                <select className="input-field" name="payment_status"
                  value={formData.payment_status} onChange={handleChange}>
                  <option>Total</option>
                  <option>Parcial</option>
                </select>
              </div>
              {formData.payment_status === 'Parcial' && (
                <div className="input-group">
                  <label className="input-label">Monto Pagado</label>
                  <input required type="number" min="0" step="0.01" className="input-field"
                    name="monto_pagado" value={formData.monto_pagado} onChange={handleChange}
                    placeholder="Ej: 50000" />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Cantidad a Generar</label>
                <input required type="number" min="1" max="50" className="input-field"
                  name="quantity" value={formData.quantity} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cupón(es)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros y Tabla */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input type="text" className="input-field"
              placeholder="Buscar por N° Servicio, CI, Nombre o Teléfono..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }} />
          </div>
          <select className="input-field" style={{ width: '200px' }}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="valid">Válidos (Sin Uso)</option>
            <option value="in_use">En Uso</option>
            <option value="used">Utilizados</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>

        <div className="table-container">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>N° Servicio</th>
                <th>Paciente</th>
                <th>Servicio</th>
                <th>Sesiones</th>
                <th>Estado</th>
                <th>Vencimiento</th>
                <th>Pago</th>
                <th>Carga</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>No hay cupones.</td></tr>
              ) : (
                filtered.map((c) => {
                  const exp = isExpired(c.expiry_date);
                  const fin = c.used_sessions >= c.total_sessions;
                  const inUse = !fin && c.used_sessions > 0;
                  return (
                    <tr key={c.id} style={{ background: exp && !fin ? '#FEE2E2' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Hash size={13} color="#1890FF" />
                          <span style={{ fontWeight: 700, color: '#0A4275', fontFamily: 'monospace' }}>
                            {c.ui_number || c.code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.patient_name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>CI: {c.patient_ci}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tel: {c.telefono}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>{c.service_category}</div>
                        <div>{c.service_detail}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1890FF' }}>
                        {c.used_sessions}/{c.total_sessions}
                      </td>
                      <td>
                        {fin
                          ? <span className="badge" style={{ background: '#E5E7EB', color: '#374151' }}>Utilizado</span>
                          : exp
                          ? <span className="badge badge-danger">Vencido</span>
                          : inUse
                          ? <span className="badge badge-warning">En Uso</span>
                          : <span className="badge badge-success">Válido</span>}
                      </td>
                      <td style={{ color: exp && !fin ? '#EF4444' : 'inherit', fontWeight: exp && !fin ? 600 : 'normal' }}>
                        {new Date(c.expiry_date).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {c.payment_status}{c.payment_status === 'Parcial' ? ` ($${c.monto_pagado})` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.payment_option}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleDateString('es-ES')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.created_by}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
