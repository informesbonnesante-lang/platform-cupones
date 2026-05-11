"use client";

import React, { useState } from 'react';
import { Calendar, User, ShoppingBag, FileText } from 'lucide-react';

const HistoryTable = ({ consumptions, entries }) => {
  const [view, setView] = useState('consumos'); // 'consumos' or 'entradas'

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Trazabilidad y AuditorÃ­a</h2>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <button 
            className={`btn ${view === 'consumos' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 0, padding: '0.5rem 1rem' }}
            onClick={() => setView('consumos')}
          >
            Consumos (Salidas)
          </button>
          <button 
            className={`btn ${view === 'entradas' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 0, padding: '0.5rem 1rem' }}
            onClick={() => setView('entradas')}
          >
            Ingresos (Entradas)
          </button>
        </div>
      </div>

      {view === 'consumos' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Ãtem</th>
                <th>Paciente</th>
                <th>Cant.</th>
                <th>Depto.</th>
                <th>Pago</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {consumptions.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(c.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.itemName}</td>
                  <td>{c.pacienteNombre} <br/><small className="text-muted">{c.pacienteCi}</small></td>
                  <td>{c.cantidad}</td>
                  <td>{c.departamento}</td>
                  <td>
                    <span className={`badge ${c.categoriaPago === 'Abonado por el paciente' ? 'badge-warning' : 'badge-success'}`}>
                      {c.categoriaPago === 'Abonado' ? 'Abonado' : c.categoriaPago}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                      <User size={12} /> {c.staff}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Ãtem</th>
                <th>Cant.</th>
                <th>Proveedor</th>
                <th>Factura</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 500 }}>{e.itemName}</td>
                  <td>+{e.cantidadIngresada}</td>
                  <td>{e.proveedor}</td>
                  <td>{e.nroFactura || 'N/A'}</td>
                  <td>{e.fechaVencimiento ? (
                    <span className="badge badge-info">{e.fechaVencimiento}</span>
                  ) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;

