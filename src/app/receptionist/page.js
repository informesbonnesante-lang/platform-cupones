'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, XCircle, Clock, Activity, Hash, User, Calendar, Stethoscope, ChevronRight, Package } from 'lucide-react';
import { getCoupons, updateCoupon } from '../../lib/api';

export default function ReceptionistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [coupons, setCoupons]         = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [message, setMessage]         = useState(null);
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    getCoupons().then(setCoupons);
  }, []);

  const isExpired = (d) => d && new Date(d) < new Date();

  // Derived state: cupones del paciente actual
  const patientCoupons = patientInfo 
    ? coupons.filter(c => c.patient_ci === patientInfo.ci)
    : [];

  const activeCouponsCount = patientCoupons.filter(c => c.used_sessions < c.total_sessions && !isExpired(c.expiry_date)).length;

  // Helper para mostrar el ui_number real ocultando el sufijo interno (ej: 20260504-001-1 -> 20260504-001)
  const displayUINumber = (ui_number) => {
    if (!ui_number) return '';
    const str = String(ui_number);
    const parts = str.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}`;
    }
    return str;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setMessage(null);
    setSelectedCoupon(null);
    setPatientInfo(null);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    // Buscar coincidencia para identificar al paciente (ignorando el sufijo del ui_number)
    const match = coupons.find(
      (c) =>
        displayUINumber(c.ui_number).toLowerCase() === q ||
        String(c.code || '').toLowerCase() === q ||
        String(c.patient_ci || '').toLowerCase() === q ||
        String(c.patient_name || '').toLowerCase().includes(q) ||
        String(c.telefono || '').toLowerCase() === q
    );

    if (match) {
      setPatientInfo({
        name: match.patient_name || 'Paciente sin nombre',
        ci: match.patient_ci || 'Sin CI',
        telefono: match.telefono || 'Sin Teléfono'
      });
    } else {
      setMessage({ type: 'error', text: 'No se encontró ningún paciente o vale con esa información.' });
    }
  };

  const handleValidate = async () => {
    if (!selectedCoupon || isLoading) return;
    setIsLoading(true);

    const newUsed      = (selectedCoupon.used_sessions || 0) + 1;
    const isNowFinished = newUsed >= selectedCoupon.total_sessions;
    const now          = new Date().toISOString();

    const updates = {
      used_sessions: newUsed,
      used_at: now,
    };

    const updated = await updateCoupon(selectedCoupon.id, updates);
    setIsLoading(false);

    if (updated) {
      setSelectedCoupon(updated);
      setCoupons(coupons.map((c) => (c.id === updated.id ? updated : c)));
      setMessage({
        type: 'success',
        text: `✅ Sesión registrada correctamente. (${updated.used_sessions}/${updated.total_sessions} sesiones usadas)`,
      });
      // El mensaje de éxito se borrará si se selecciona otro cupón o se hace nueva búsqueda
    } else {
      setMessage({ type: 'error', text: 'Error al registrar la sesión. Intente de nuevo.' });
    }
  };

  const c = selectedCoupon;
  let fin, exp, inUse, statusColor, statusLabel;
  if (c) {
    fin = c.used_sessions >= c.total_sessions;
    exp = isExpired(c.expiry_date);
    inUse = !fin && c.used_sessions > 0;
    statusColor = fin ? '#9CA3AF' : exp ? '#EF4444' : inUse ? '#F59E0B' : '#10B981';
    statusLabel = fin ? 'Utilizado' : exp ? 'Vencido' : inUse ? 'En Uso' : 'Válido';
  }

  // Agrupar estadísticas de paquetes
  const packageStats = {};
  patientCoupons.forEach(c => {
    if (c.package_group_id) {
      if (!packageStats[c.package_group_id]) {
        packageStats[c.package_group_id] = { name: c.package_name || 'Paquete', total: 0, used: 0 };
      }
      packageStats[c.package_group_id].total += (c.total_sessions || 1);
      packageStats[c.package_group_id].used += (c.used_sessions || 0);
    }
  });
  const packagesArray = Object.values(packageStats);

  return (
    <div>
      {/* Búsqueda */}
      <div className="card mb-6">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0A4275' }}>
          <Search size={22} /> Validación de Vales / Paquetes
        </h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text" className="input-field"
            style={{ flex: 1, fontSize: '1.1rem', padding: '0.9rem' }}
            placeholder="Buscar por N° Servicio, Código, CI, Nombre o Teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 2rem', fontSize: '1rem' }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Mensaje global */}
      {message && (
        <div style={{
          padding: '1rem 1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500,
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: message.type === 'success' ? '#065F46' : '#991B1B',
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Resultado del Paciente y Listado de Cupones */}
      {patientInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Banner Resumen */}
          <div style={{
            background: 'linear-gradient(to right, #E6F7FF, #FFFFFF)',
            borderLeft: '4px solid #1890FF',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0A4275', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={24} color="#1890FF" />
                {patientInfo.name || 'Paciente sin nombre'}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                <span>CI: <strong>{patientInfo.ci}</strong></span>
                <span>Tel: <strong>{patientInfo.telefono}</strong></span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Cupones Disponibles
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: activeCouponsCount > 0 ? '#10B981' : '#EF4444', lineHeight: 1 }}>
                {activeCouponsCount}
              </div>
            </div>
          </div>

          {/* Estadísticas de Paquetes */}
          {packagesArray.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {packagesArray.map((pkg, idx) => (
                <div key={idx} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={16} /> {pkg.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#047857' }}>
                    Total: {pkg.total} sesiones &nbsp;|&nbsp; Usadas: {pkg.used} &nbsp;|&nbsp; Disponibles: {pkg.total - pkg.used}
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginTop: '0.5rem', background: '#D1FAE5', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#059669', height: '100%', width: `${(pkg.used / pkg.total) * 100}%`, transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Columna Izquierda: Listado de Cupones */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Historial de Cupones ({patientCoupons.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {patientCoupons.map(coupon => {
                  const isFin = coupon.used_sessions >= coupon.total_sessions;
                  const isExp = isExpired(coupon.expiry_date);
                  const isInUse = !isFin && coupon.used_sessions > 0;
                  const isSelected = selectedCoupon && selectedCoupon.id === coupon.id;
                  
                  let badgeColor, badgeText, badgeBg;
                  if (isFin) {
                    badgeColor = '#6B7280'; badgeBg = '#F3F4F6'; badgeText = 'Utilizado';
                  } else if (isExp) {
                    badgeColor = '#991B1B'; badgeBg = '#FEE2E2'; badgeText = 'Vencido';
                  } else if (isInUse) {
                    badgeColor = '#92400E'; badgeBg = '#FEF3C7'; badgeText = 'En Uso';
                  } else {
                    badgeColor = '#065F46'; badgeBg = '#D1FAE5'; badgeText = 'Válido';
                  }

                  return (
                    <div 
                      key={coupon.id} 
                      onClick={() => { setSelectedCoupon(coupon); setMessage(null); }}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${isSelected ? '#1890FF' : '#E5E7EB'}`,
                        backgroundColor: isSelected ? '#F0F9FF' : isFin ? '#F9FAFB' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                        opacity: isFin || isExp ? 0.7 : 1,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: badgeBg, color: badgeColor, fontWeight: 600 }}>
                            {badgeText}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#6B7280', fontFamily: 'monospace' }}>{displayUINumber(coupon.ui_number) || coupon.code}</span>
                        </div>
                        <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.95rem' }}>
                          {coupon.package_name && <span style={{ color: '#10B981', marginRight: '0.4rem', fontSize: '0.85rem' }}>📦 {coupon.package_name}</span>}
                          {coupon.service_category} - {coupon.service_detail}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                          Sesiones: {coupon.used_sessions}/{coupon.total_sessions}
                        </div>
                      </div>
                      <ChevronRight size={20} color={isSelected ? '#1890FF' : '#D1D5DB'} />
                    </div>
                  );
                })}
                {patientCoupons.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', background: '#F9FAFB', borderRadius: '0.5rem' }}>
                    No hay cupones registrados.
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Detalle del Cupón Seleccionado */}
            <div>
              {c ? (
                <div className="card" style={{ borderTop: `4px solid ${statusColor}`, position: 'sticky', top: '2rem' }}>
                  {/* Header */}
                  <div className="flex-between mb-4">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Hash size={16} color="#1890FF" />
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: '#0A4275' }}>
                          {displayUINumber(c.ui_number) || c.code}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1F2937' }}>Detalles del Vale</h3>
                      {c.package_name && (
                        <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Package size={14} /> Pertenece a: {c.package_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sesiones */}
                  <div style={{ display: 'flex', gap: '0', background: '#F0F2F5', borderRadius: '0.5rem', marginBottom: '1.5rem', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                    {[
                      { label: 'Total', val: c.total_sessions,  color: '#1F2937' },
                      { label: 'Usadas', val: c.used_sessions,   color: '#1890FF' },
                      { label: 'Restantes', val: c.total_sessions - c.used_sessions, color: '#10B981' },
                    ].map((s, i) => (
                      <div key={s.label} style={{
                        flex: 1, textAlign: 'center', padding: '1rem',
                        borderRight: i < 2 ? '1px solid #E5E7EB' : 'none',
                        background: '#fff'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Información */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <InfoRow icon={<Stethoscope size={14}/>} label="Categoría"      value={c.service_category} />
                    <InfoRow icon={null}                    label="Servicio"        value={c.service_detail} bold />
                    <InfoRow icon={null}                    label="Forma de Pago"   value={`${c.payment_option || ''}`} />
                    <InfoRow icon={null}                    label="Estado de Pago"  value={`${c.payment_status || ''}${c.payment_status === 'Parcial' ? ` ($${c.monto_pagado})` : ''}`} />
                    <InfoRow icon={<Calendar size={14} />} label="Fecha de Carga"  
                      value={c.created_at && !isNaN(new Date(c.created_at).getTime()) ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'} />
                    <InfoRow icon={null}                    label="Responsable"     value={c.created_by} />
                    <InfoRow icon={null}                    label="Vencimiento"
                      value={c.expiry_date && !isNaN(new Date(c.expiry_date).getTime()) ? new Date(c.expiry_date).toLocaleDateString('es-ES') : '—'}
                      valueColor={exp ? '#EF4444' : 'inherit'} />
                    {c.used_at && !isNaN(new Date(c.used_at).getTime()) && (
                      <InfoRow icon={<Clock size={14} />} label="Última sesión" value={new Date(c.used_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} />
                    )}
                  </div>

                  {/* Botón validar */}
                  {!fin && !exp ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button onClick={handleValidate} className="btn-primary"
                        disabled={isLoading}
                        style={{ width: '100%', fontSize: '1rem', padding: '1rem', background: '#10B981', borderColor: '#10B981', display: 'flex', justifyContent: 'center' }}>
                        <Activity size={18} />
                        {isLoading ? 'Registrando...' : 'Valida (Usar 1 Sesión)'}
                      </button>
                      <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                        {c.total_sessions - c.used_sessions} sesión(es) disponible(s) para este vale.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px dashed #D1D5DB', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem', textAlign: 'center' }}>
                      <XCircle size={18} color={fin ? '#6B7280' : '#EF4444'} />
                      {fin ? 'Este vale ya fue completamente utilizado.' : 'Este vale está vencido y no puede usarse.'}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#9CA3AF', padding: '2rem', textAlign: 'center' }}>
                  <Activity size={48} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: '#64748B' }}>Seleccione un cupón</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Haga clic en un cupón de la lista para ver sus detalles y registrar una sesión.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, bold, valueColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: bold ? 700 : 500, color: valueColor || '#1F2937', fontSize: '0.9rem' }}>
        {value}
      </div>
    </div>
  );
}
