'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, XCircle, Clock, Activity, Hash, User, Calendar, Stethoscope } from 'lucide-react';
import { getCoupons, updateCoupon } from '../../lib/api';

export default function ReceptionistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [coupons, setCoupons]         = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [message, setMessage]         = useState(null);
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    getCoupons().then(setCoupons);
  }, []);

  const isExpired = (d) => d && new Date(d) < new Date();

  const handleSearch = (e) => {
    e.preventDefault();
    setMessage(null);
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSelectedCoupon(null); return; }

    const found = coupons.find(
      (c) =>
        (c.ui_number || '').toLowerCase() === q ||
        c.code.toLowerCase() === q ||
        c.patient_ci.toLowerCase() === q ||
        (c.patient_name || '').toLowerCase().includes(q) ||
        (c.telefono || '').toLowerCase() === q
    );

    setSelectedCoupon(found || null);
    if (!found)
      setMessage({ type: 'error', text: 'No se encontró ningún vale con ese N° de Servicio, Código, CI, Nombre o Teléfono.' });
  };

  const handleValidate = async () => {
    if (!selectedCoupon || isLoading) return;
    setIsLoading(true);

    const newUsed      = (selectedCoupon.used_sessions || 0) + 1;
    const isNowFinished = newUsed >= selectedCoupon.total_sessions;
    const now          = new Date().toISOString();

    const updates = {
      used_sessions: newUsed,
      used_at: now,   // siempre registrar el momento de uso
      ...(isNowFinished ? {} : {}),
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
    } else {
      setMessage({ type: 'error', text: 'Error al registrar la sesión. Intente de nuevo.' });
    }
  };

  const c   = selectedCoupon;
  const fin = c && (c.used_at !== null || c.used_sessions >= c.total_sessions);
  const exp = c && isExpired(c.expiry_date);
  const inUse = c && !fin && c.used_sessions > 0;

  const statusColor = !c ? '#9CA3AF' : fin ? '#9CA3AF' : exp ? '#EF4444' : inUse ? '#F59E0B' : '#10B981';
  const statusLabel = !c ? '' : fin ? 'Utilizado' : exp ? 'Vencido' : inUse ? 'En Uso' : 'Válido';

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
            placeholder="N° Servicio (ej: 20260429-001), Código, CI o Teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 2rem', fontSize: '1rem' }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Mensaje */}
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

      {/* Detalle del cupón */}
      {c && (
        <div className="card" style={{ borderTop: `4px solid ${statusColor}` }}>
          {/* Header */}
          <div className="flex-between mb-4">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Hash size={16} color="#1890FF" />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: '#0A4275' }}>
                  {c.ui_number || c.code}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1F2937' }}>Detalles del Vale</h3>
            </div>
            <span className="badge" style={{
              fontSize: '1rem', padding: '0.5rem 1.25rem',
              backgroundColor:
                fin ? '#E5E7EB' : exp ? '#FEE2E2' : inUse ? '#FEF3C7' : '#D1FAE5',
              color:
                fin ? '#374151' : exp ? '#991B1B' : inUse ? '#92400E' : '#065F46',
            }}>
              {fin ? <><CheckCircle size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'text-bottom' }} />Utilizado</>
               : exp ? <><XCircle size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'text-bottom' }} />Vencido</>
               : inUse ? <><Activity size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'text-bottom' }} />En Uso</>
               : <><CheckCircle size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'text-bottom' }} />Válido</>}
            </span>
          </div>

          {/* Sesiones */}
          <div style={{ display: 'flex', gap: '0', background: '#F0F2F5', borderRadius: '0.5rem', marginBottom: '1.5rem', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            {[
              { label: 'Total', val: c.total_sessions,  color: '#1F2937' },
              { label: 'Usadas', val: c.used_sessions,   color: '#1890FF' },
              { label: 'Restantes', val: c.total_sessions - c.used_sessions, color: '#10B981' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center', padding: '1.25rem',
                borderRight: i < 2 ? '1px solid #E5E7EB' : 'none',
                background: '#fff'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>{s.label}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Información */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <InfoRow icon={<User size={15} />}     label="Paciente"        value={c.patient_name || '—'} />
            <InfoRow icon={null}                    label="CI"              value={c.patient_ci} />
            <InfoRow icon={null}                    label="Teléfono"        value={c.telefono} />
            <InfoRow icon={<Stethoscope size={15}/>} label="Categoría"      value={c.service_category} />
            <InfoRow icon={null}                    label="Servicio"        value={c.service_detail} bold />
            <InfoRow icon={null}                    label="Forma de Pago"   value={`${c.payment_option} — ${c.payment_status}${c.payment_status === 'Parcial' ? ` ($${c.monto_pagado})` : ''}`} />
            <InfoRow icon={<Calendar size={15} />} label="Fecha de Carga"  value={new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />
            <InfoRow icon={null}                    label="Responsable"     value={c.created_by} />
            <InfoRow icon={null}                    label="Vencimiento"
              value={new Date(c.expiry_date).toLocaleDateString('es-ES')}
              valueColor={exp ? '#EF4444' : 'inherit'} />
            {c.used_at && (
              <InfoRow icon={<Clock size={15} />} label="Última sesión" value={new Date(c.used_at).toLocaleString('es-ES')} />
            )}
          </div>

          {/* Botón validar */}
          {!fin && !exp ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>
                {c.total_sessions - c.used_sessions} sesión(es) disponible(s)
              </span>
              <button onClick={handleValidate} className="btn-primary"
                disabled={isLoading}
                style={{ fontSize: '1rem', padding: '0.9rem 2.5rem', background: '#10B981', borderColor: '#10B981' }}>
                <Activity size={18} />
                {isLoading ? 'Registrando...' : 'Usar 1 Sesión'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontWeight: 500 }}>
              <XCircle size={16} />
              {fin ? 'Este vale ya fue completamente utilizado.' : 'Este vale está vencido y no puede usarse.'}
            </div>
          )}
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
      <div style={{ fontWeight: bold ? 700 : 500, color: valueColor || '#1F2937', fontSize: '0.95rem' }}>
        {value}
      </div>
    </div>
  );
}
