"use client";

import React, { useState } from 'react';
import { Plus, Trash2, User, CreditCard, Building2 } from 'lucide-react';

const ConsumptionForm = ({ inventory, onSubmit }) => {
  const [header, setHeader] = useState({
    pacienteNombre: '',
    pacienteCi: '',
    departamento: 'ENFERMERÃA',
    categoriaPago: 'INCLUIDO EN EL SERVICIO'
  });

  const [items, setItems] = useState([
    { itemId: '', cantidad: 1 }
  ]);

  const addRow = () => {
    setItems([...items, { itemId: '', cantidad: 1 }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!header.pacienteNombre || !header.pacienteCi || items.some(i => !i.itemId || i.cantidad <= 0)) {
      alert('Favor completar todos los datos del paciente e Ã­tems con cantidades vÃ¡lidas');
      return;
    }
    onSubmit({ ...header, items });
    
    // Reset
    setItems([{ itemId: '', cantidad: 1 }]);
    setHeader({
      pacienteNombre: '',
      pacienteCi: '',
      departamento: 'ENFERMERÃA',
      categoriaPago: 'INCLUIDO EN EL SERVICIO'
    });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Registro de Consumo ClÃ­nico (MultilÃ­nea)</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(20, 184, 166, 0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <User size={16} /> Paciente
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <input 
                type="text" className="input-field" placeholder="Nombre completo"
                value={header.pacienteNombre} onChange={(e) => setHeader({...header, pacienteNombre: e.target.value})}
              />
              <input 
                type="text" className="input-field" placeholder="CI / UI"
                value={header.pacienteCi} onChange={(e) => setHeader({...header, pacienteCi: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Building2 size={16} /> Destino
            </label>
            <select 
              className="input-field" value={header.departamento} 
              onChange={(e) => setHeader({...header, departamento: e.target.value})}
            >
              <option value="ENFERMERÃA">ENFERMERÃA</option>
              <option value="ADMINISTRACIÃ“N">ADMINISTRACIÃ“N</option>
              <option value="RECEPCIÃ“N">RECEPCIÃ“N</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <CreditCard size={16} /> CategorizaciÃ³n de Pago
            </label>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" name="pago" checked={header.categoriaPago === 'Abonado por el paciente'}
                  onChange={() => setHeader({...header, categoriaPago: 'Abonado por el paciente'})}
                /> Abonado por paciente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" name="pago" checked={header.categoriaPago === 'Incluido en el servicio'}
                  onChange={() => setHeader({...header, categoriaPago: 'Incluido en el servicio'})}
                /> Incluido en Servicio
              </label>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--background)' }}>
              <tr>
                <th style={{ width: '60%' }}>Ãtem / Producto</th>
                <th style={{ width: '25%' }}>Cantidad</th>
                <th style={{ width: '15%', textAlign: 'center' }}>AcciÃ³n</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select 
                      className="input-field" value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                    >
                      <option value="">Seleccione un producto...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nombre} (Stock: {inv.stock} {inv.unidad})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" className="input-field" min="1"
                      value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" onClick={() => removeRow(index)}
                      className="btn" style={{ padding: '0.5rem', color: 'var(--danger)', background: 'transparent' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={addRow} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Plus size={18} /> AÃ±adir Fila
          </button>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
            Confirmar y Guardar Lote
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsumptionForm;

