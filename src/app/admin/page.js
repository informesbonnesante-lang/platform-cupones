'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, DollarSign, Hash, Package } from 'lucide-react';
import { getCoupons, saveCoupon, generateUINumber, updatePatientInfoByCI, getPackages, saveCouponsBatch } from '../../lib/api';

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
  const [packages, setPackages]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [formData, setFormData]     = useState(INITIAL_FORM);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadedPatientInfo, setLoadedPatientInfo] = useState(null);

  const [emissionType, setEmissionType] = useState('individual'); // 'individual' or 'package'
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  // Estado para paquete personalizado manual
  const [customPackageName, setCustomPackageName] = useState('');
  const [customItems, setCustomItems] = useState([{ category: '', detail: '', sessions: 1 }]);

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
    Promise.all([getCoupons(), getPackages()]).then(([couponsData, pkgsData]) => {
      setCoupons(couponsData);
      setPackages(pkgsData);
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
        await updatePatientInfoByCI(formData.patient_ci, formData.patient_name.trim(), formData.telefono.trim());
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

    const createdBy = localStorage.getItem('medcupon_user') || 'Administrador';
    let results = [];

    if (emissionType === 'package') {
      let pkgItems = [];
      let pkgName = '';

      if (selectedPackageId === 'custom') {
        if (!customPackageName.trim()) {
          alert("Por favor, ingrese un nombre para el paquete personalizado.");
          setIsSaving(false); return;
        }
        for (let i = 0; i < customItems.length; i++) {
          if (!customItems[i].category || !customItems[i].detail || customItems[i].sessions < 1) {
            alert(`Por favor, complete todos los campos del servicio #${i+1} en el paquete personalizado.`);
            setIsSaving(false); return;
          }
        }
        pkgItems = customItems;
        pkgName = customPackageName;
      } else {
        const pkg = packages.find(p => p.id === selectedPackageId);
        if (!pkg) {
          alert("Debe seleccionar un paquete.");
          setIsSaving(false); return;
        }
        pkgItems = pkg.items;
        pkgName = pkg.name;
      }

      const packageGroupId = crypto.randomUUID();
      const baseUiNumber = formData.ui_number_manual.trim() !== '' ? formData.ui_number_manual.trim() : await generateUINumber();
      
      const newCoupons = pkgItems.map((item, index) => ({
        ui_number: `${baseUiNumber}-${index + 1}`, // Sufijo interno para base de datos
        code: generateCode(),
        patient_name: formData.patient_name,
        patient_ci: formData.patient_ci,
        telefono: formData.telefono,
        service_category: item.category,
        service_detail: item.detail,
        expiry_date: formData.expiry_date,
        payment_option: formData.payment_option,
        payment_status: formData.payment_status,
        monto_pagado: formData.payment_status === 'Parcial' ? parseFloat(formData.monto_pagado) : null,
        total_sessions: parseInt(item.sessions) || 1,
        used_sessions: 0,
        created_by: createdBy,
        used_at: null,
        package_group_id: packageGroupId,
        package_name: pkgName
      }));

      const savedBatch = await saveCouponsBatch(newCoupons);
      if (savedBatch) results = savedBatch;

    } else {
      // Emisión individual
      const qty = parseInt(formData.quantity) || 1;
      for (let i = 0; i < qty; i++) {
        const uiNumber = formData.ui_number_manual.trim() !== '' && qty === 1
            ? formData.ui_number_manual.trim()
            : await generateUINumber();
        
        const coupon = {
          ui_number: uiNumber,
          code: generateCode(),
          patient_name: formData.patient_name,
          patient_ci: formData.patient_ci,
          telefono: formData.telefono,
          service_category: formData.service_category,
          service_detail: formData.service_detail,
          expiry_date: formData.expiry_date,
          payment_option: formData.payment_option,
          payment_status: formData.payment_status,
          monto_pagado: formData.payment_status === 'Parcial' ? parseFloat(formData.monto_pagado) : null,
          total_sessions: parseInt(formData.total_sessions) || 1,
          used_sessions: 0,
          created_by: createdBy,
          used_at: null,
          package_group_id: null,
          package_name: null
        };
        const saved = await saveCoupon(coupon);
        if (saved) results.push(saved);
      }
    }

    setCoupons([...results, ...coupons]);
    setShowForm(false);
    setFormData(INITIAL_FORM);
    setIsSaving(false);
  };

  const isExpired = (d) => d && new Date(d) < new Date();

  // Helper para mostrar el ui_number real ocultando el sufijo
  const displayUINumber = (ui_number) => {
    if (!ui_number) return '';
    // Si tiene un formato base-index (ej: 20260504-001-1), extraemos solo la base
    const parts = ui_number.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}`;
    }
    return ui_number;
  };

  const filtered = coupons.filter((c) => {
    const q = search.toLowerCase();
    const displayUI = displayUINumber(c.ui_number).toLowerCase();
    
    const matchSearch =
      !q ||
      displayUI.includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.patient_ci.toLowerCase().includes(q) ||
      (c.patient_name || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q) ||
      (c.package_name || '').toLowerCase().includes(q);

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
          {showForm ? 'Ocultar' : 'Nuevo Cupón/Paquete'}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Emitir Servicio</h2>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '0.5rem', padding: '0.25rem' }}>
              <button 
                type="button"
                onClick={() => setEmissionType('individual')}
                style={{ 
                  padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: emissionType === 'individual' ? '#fff' : 'transparent',
                  color: emissionType === 'individual' ? '#1890FF' : '#6B7280',
                  boxShadow: emissionType === 'individual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Servicio Individual
              </button>
              <button 
                type="button"
                onClick={() => setEmissionType('package')}
                style={{ 
                  padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: emissionType === 'package' ? '#fff' : 'transparent',
                  color: emissionType === 'package' ? '#1890FF' : '#6B7280',
                  boxShadow: emissionType === 'package' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Package size={16} /> Paquete
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={13} color="#1890FF" />
                  N° de Servicio Compartido (UI)
                  <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.78rem' }}>
                    — Dejar vacío para auto-generar
                  </span>
                </label>
                <input type="text" className="input-field" name="ui_number_manual"
                  value={formData.ui_number_manual} onChange={handleChange}
                  placeholder="Ej: 20260430-001  (opcional)" />
              </div>

              {/* Patient details */}
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

              {emissionType === 'package' ? (
                <>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Seleccionar Paquete Maestro</label>
                    <select required className="input-field" value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)}>
                      <option value="">-- Elija un paquete --</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.items?.length || 0} servicios)</option>
                      ))}
                      <option value="custom" style={{ fontWeight: 'bold', color: '#1890FF' }}>➕ Crear Paquete Personalizado (Manual)</option>
                    </select>
                  </div>

                  {selectedPackageId === 'custom' && (
                    <div style={{ gridColumn: '1 / -1', background: '#F0F9FF', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #BAE6FD' }}>
                      <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Nombre del Paquete Personalizado</label>
                        <input required type="text" className="input-field" 
                          value={customPackageName} onChange={(e) => setCustomPackageName(e.target.value)}
                          placeholder="Ej: Promo Verano, Combo Especial..." />
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369A1' }}>Añadir Servicios al Paquete:</h4>
                      {customItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input required type="text" className="input-field" placeholder="Categoría" style={{ flex: 1 }}
                            value={item.category} onChange={(e) => {
                              const newArr = [...customItems]; newArr[idx].category = e.target.value; setCustomItems(newArr);
                            }} />
                          <input required type="text" className="input-field" placeholder="Detalle del Servicio" style={{ flex: 2 }}
                            value={item.detail} onChange={(e) => {
                              const newArr = [...customItems]; newArr[idx].detail = e.target.value; setCustomItems(newArr);
                            }} />
                          <input required type="number" min="1" className="input-field" placeholder="Sesiones" style={{ width: '80px' }}
                            value={item.sessions} onChange={(e) => {
                              const newArr = [...customItems]; newArr[idx].sessions = parseInt(e.target.value)||1; setCustomItems(newArr);
                            }} />
                          {customItems.length > 1 && (
                            <button type="button" onClick={() => {
                              const newArr = [...customItems]; newArr.splice(idx, 1); setCustomItems(newArr);
                            }} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '0.375rem', padding: '0 0.5rem', cursor: 'pointer' }}>X</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setCustomItems([...customItems, { category: '', detail: '', sessions: 1 }])}
                        style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0284C7', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        + Añadir otro servicio a este paquete
                      </button>
                    </div>
                  )}

                  {selectedPackageId && selectedPackageId !== 'custom' && (
                    <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Servicios que se generarán automáticamente:</h4>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6B7280', fontSize: '0.9rem' }}>
                        {packages.find(p => p.id === selectedPackageId)?.items?.map((it, idx) => (
                          <li key={idx}><strong>{it.detail}</strong> ({it.sessions} sesion/es) - {it.category}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                    <label className="input-label">Sesiones Totales</label>
                    <input required type="number" min="1" className="input-field" name="total_sessions"
                      value={formData.total_sessions} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Cantidad a Generar (Copias del mismo)</label>
                    <input required type="number" min="1" max="50" className="input-field"
                      name="quantity" value={formData.quantity} onChange={handleChange} />
                  </div>
                </>
              )}

              {/* Shared payment/date logic */}
              <div className="input-group">
                <label className="input-label">Fecha de Vencimiento (General)</label>
                <input required type="date" className="input-field" name="expiry_date"
                  value={formData.expiry_date} onChange={handleChange} />
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
              
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={isSaving || (emissionType === 'package' && !selectedPackageId)}>
                {isSaving ? 'Generando...' : emissionType === 'package' ? 'Generar Paquete Completo' : 'Guardar Cupón'}
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
              placeholder="Buscar por N° Servicio, CI, Nombre, Paquete o Teléfono..."
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
                <th>Servicio / Paquete</th>
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
                            {displayUINumber(c.ui_number) || c.code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.patient_name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>CI: {c.patient_ci}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tel: {c.telefono}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.72rem', color: c.package_name ? '#10B981' : '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                          {c.package_name ? `📦 ${c.package_name}` : c.service_category}
                        </div>
                        <div style={{ fontWeight: c.package_name ? 500 : 'normal' }}>{c.service_detail}</div>
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
