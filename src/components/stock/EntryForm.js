"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Truck, FileCheck, Calendar } from 'lucide-react';

const EntryForm = ({ inventory, onSubmit }) => {
  const [header, setHeader] = useState({
    proveedor: '',
    nroFactura: ''
  });

  const [items, setItems] = useState([
    { itemId: '', cantidadIngresada: 1, vencimiento: '' }
  ]);

  const addRow = () => {
    setItems([...items, { itemId: '', cantidadIngresada: 1, vencimiento: '' }]);
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
    if (!header.proveedor || items.some(i => !i.itemId || i.cantidadIngresada <= 0 || !i.vencimiento)) {
      alert('Favor completar todos los datos: Proveedor, Ítems y sus correspondientes Fechas de Vencimiento (Obligatario)');
      return;
    }
    onSubmit({ ...header, items });
    
    // Reset
    setItems([{ itemId: '', cantidadIngresada: 1, vencimiento: '' }]);
    setHeader({
      proveedor: '',
      nroFactura: ''
    });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-dark)' }}>Ingreso de Mercadería (Carga Masiva con Vencimiento)</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(20, 184, 166, 0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Truck size={16} /> Proveedor
            </label>
            <input 
              type="text" className="input-field" placeholder="Nombre Comercial / Razón Social"
              value={header.proveedor} onChange={(e) => setHeader({...header, proveedor: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <FileCheck size={16} /> Nro. Factura
            </label>
            <input 
              type="text" className="input-field" placeholder="001-002-XXXX"
              value={header.nroFactura} onChange={(e) => setHeader({...header, nroFactura: e.target.value})}
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--background)' }}>
              <tr>
                <th style={{ width: '40%' }}>Ítem / Producto</th>
                <th style={{ width: '15%' }}>Cantidad</th>
                <th style={{ width: '30%' }}>Vencimiento (Oblig.)</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Acción</th>
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
                      <option value="">Seleccione...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="number" className="input-field" min="1"
                        style={{ width: '80px' }}
                        value={item.cantidadIngresada} onChange={(e) => updateItem(index, 'cantidadIngresada', e.target.value)}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {inventory.find(i => i.id === item.itemId)?.unidad === 'CAJA' ? 'Cajas' : 'Unds'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <input 
                      type="date" className="input-field" required
                      value={item.vencimiento} onChange={(e) => updateItem(index, 'vencimiento', e.target.value)}
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
            <Plus size={18} /> Añadir Fila
          </button>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', background: 'var(--primary-light)' }}>
            Registrar Lote con Vencimientos
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
