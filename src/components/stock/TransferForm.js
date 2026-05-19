"use client";

import React, { useState } from 'react';
import { Plus, Trash2, ArrowRightLeft, User, MapPin } from 'lucide-react';

const TransferForm = ({ inventory, onSubmit }) => {
  const [header, setHeader] = useState({
    responsable: '',
  });

  const [items, setItems] = useState([
    { itemId: '', toArea: '', cantidad: 1 }
  ]);

  const areas = ['FARMACIA', 'ESTÉTICA', 'ENFERMERÍA', 'RECEPCIÓN', 'LABORATORIO', 'DEPÓSITO CENTRAL'];

  const addRow = () => {
    setItems([...items, { itemId: '', toArea: '', cantidad: 1 }]);
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
    if (!header.responsable || items.some(i => !i.itemId || !i.toArea || i.cantidad <= 0)) {
      alert('Favor completar el responsable y todos los ítems con cantidades y destinos válidos.');
      return;
    }

    // Comprobar que no se transfiera al mismo depósito de origen
    const invalidTransfers = items.filter(item => {
      const invItem = inventory.find(inv => inv.id === item.itemId);
      return invItem && invItem.area === item.toArea;
    });

    if (invalidTransfers.length > 0) {
      alert('No puedes transferir un ítem al mismo depósito en el que ya se encuentra.');
      return;
    }

    // Check stock limits
    const exceedingStock = items.filter(item => {
      const invItem = inventory.find(inv => inv.id === item.itemId);
      return invItem && parseInt(item.cantidad) > invItem.current_stock;
    });

    if (exceedingStock.length > 0) {
      alert('La cantidad a transferir no puede ser mayor al stock actual disponible.');
      return;
    }

    onSubmit({ ...header, items });
    
    // Reset
    setItems([{ itemId: '', toArea: '', cantidad: 1 }]);
    setHeader({ responsable: '' });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          background: 'rgba(16, 163, 150, 0.1)', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 1rem',
          color: 'var(--primary)'
        }}>
          <ArrowRightLeft size={32} />
        </div>
        <h2 style={{ color: 'var(--primary-dark)', margin: 0 }}>Transferencia entre Depósitos</h2>
        <p style={{ color: 'var(--text-muted)' }}>Mover stock de un depósito a otro</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(20, 184, 166, 0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <User size={16} color="var(--primary)" /> Responsable de la Transferencia
          </label>
          <input 
            type="text" className="input-field" placeholder="Nombre completo"
            value={header.responsable} onChange={(e) => setHeader({...header, responsable: e.target.value})}
            required
          />
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--background)' }}>
              <tr>
                <th style={{ width: '45%' }}>Ítem / Origen</th>
                <th style={{ width: '25%' }}>Depósito Destino</th>
                <th style={{ width: '20%' }}>Cantidad</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const selectedItem = inventory.find(inv => inv.id === item.itemId);
                return (
                <tr key={index}>
                  <td>
                    <select 
                      className="input-field" value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      required
                    >
                      <option value="">Seleccione ítem...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nombre} ({inv.area || 'SD'}) - Disp: {inv.current_stock}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      className="input-field" value={item.toArea}
                      onChange={(e) => updateItem(index, 'toArea', e.target.value)}
                      required
                    >
                      <option value="">Destino...</option>
                      {areas.filter(a => a !== selectedItem?.area).map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" className="input-field" min="1"
                      value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                      required
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
              )})}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={addRow} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Plus size={18} /> Añadir Fila
          </button>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', gap: '0.75rem' }}>
            <ArrowRightLeft size={18} /> Procesar Transferencia
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferForm;
