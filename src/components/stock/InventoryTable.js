"use client";

import React, { useState } from 'react';
import { Search, Filter, Trash2, AlertTriangle, Edit, X, Save, Tag, Boxes, MapPin, Hash } from 'lucide-react';
import { supabase } from './supabaseStockClient';

const InventoryTable = ({ inventory, userRole, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('Todas');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    categoria: '',
    stock_minimo: 0,
    area: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['MEDICAMENTOS', 'ESTÉTICA', 'INSUMOS', 'DESCARTABLES', 'ACTIVOS'];
  const areas = ['FARMACIA', 'ESTÉTICA', 'ENFERMERÍA', 'RECEPCIÓN', 'LABORATORIO', 'Depósito Central'];

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'Todas' || item.area === filterArea;
    return matchesSearch && matchesArea;
  });

  const getExpirationStatus = (date) => {
    if (!date || date === 'N/A') return { label: 'Sin Fecha', color: 'var(--text-muted)', class: '' };
    const today = new Date();
    const expiry = new Date(date);
    const months = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
    
    if (months <= 0) return { label: 'VENCIDO', color: 'var(--danger)', class: 'badge-danger' };
    if (months <= 3) return { label: 'Crítico (<3m)', color: 'white', background: 'var(--danger)', class: 'badge-danger' };
    if (months <= 6) return { label: 'Alerta (<6m)', color: 'black', background: 'var(--accent)', class: 'badge-warning' };
    return { label: date, color: 'var(--primary)', class: 'badge-info' };
  };

  const allAreas = ['Todas', ...new Set(inventory.map(item => item.area || 'GENERAL'))];

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditForm({
      nombre: item.nombre,
      categoria: item.categoria,
      stock_minimo: item.stock_minimo ?? 0,
      area: item.area || 'Depósito Central'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          nombre: editForm.nombre.toUpperCase(),
          categoria: editForm.categoria,
          stock_minimo: parseInt(editForm.stock_minimo) || 0,
          area: editForm.area
        })
        .eq('id', selectedItem.id);

      if (error) {
        alert('Error al actualizar el producto: ' + error.message);
      } else {
        setIsEditModalOpen(false);
        if (onUpdate) {
          onUpdate();
        }
        alert('Producto actualizado con éxito.');
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (itemId) => {
    if (window.confirm("¿Está seguro de que desea eliminar este ítem? Esto borrará su stock permanentemente.")) {
      onDelete(itemId);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Inventario Maestro de Insumos</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Visualización de saldos y trazabilidad de caducidad</p>
        </div>
        {userRole === 'ADMIN' && (
          <div className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
            PERMISO DE EDICIÓN ACTIVO
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '40px' }} 
            placeholder="Filtrar por nombre, principio activo o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Filter size={18} className="text-muted" /> Filtrar por Depósito:
          </label>
          <select 
            className="input-field" 
            style={{ width: '220px' }}
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            {allAreas.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del Ítem</th>
              <th>Depósito</th>
              <th>Categoría</th>
              <th>Vencimiento</th>
              <th style={{ textAlign: 'center' }}>Stock Inicial</th>
              <th style={{ textAlign: 'center' }}>Saldo (Actual)</th>
              <th>Estado</th>
              {userRole === 'ADMIN' && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const expStatus = getExpirationStatus(item.vencimiento);
              return (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>
                  {item.nombre}
                </td>
                <td>
                  {(() => {
                    const areaName = item.area || 'Depósito Central';
                    const name = areaName.trim().toUpperCase();
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
                  })()}
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  <span className="badge badge-info" style={{ background: 'rgba(16, 163, 150, 0.1)', color: 'var(--primary-dark)' }}>
                    {item.categoria}
                  </span>
                </td>
                <td>
                  <span className={`badge ${expStatus.class}`} style={{ background: expStatus.background }}>
                    {expStatus.label}
                  </span>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {item.stock_inicial}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.unidad === 'CAJA' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {Math.floor(item.current_stock / (item.cant_por_caja || 1))} Cajas <span style={{ fontWeight: 400 }}>y</span> {item.current_stock % (item.cant_por_caja || 1)} Unds
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        (Total: {item.current_stock} Unds)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.current_stock}</span> <small className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>{item.unidad}</small>
                    </div>
                  )}
                </td>
                <td>
                  {(() => {
                    const minStock = item.stock_minimo ?? 0;
                    if (item.current_stock === 0) {
                      return (
                        <span className="badge" style={{ background: '#e2e8f0', color: '#64748b', textTransform: 'none' }}>
                          AGOTADO
                        </span>
                      );
                    } else if (item.current_stock <= minStock) {
                      return (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content', textTransform: 'none' }}>
                          <AlertTriangle size={12} /> CRÍTICO
                        </span>
                      );
                    } else {
                      return (
                        <span className="badge badge-success" style={{ textTransform: 'none' }}>
                          NORMAL
                        </span>
                      );
                    }
                  })()}
                </td>
                {userRole === 'ADMIN' && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="btn" 
                        style={{ padding: '0.4rem', color: 'var(--primary)' }} 
                        title="Editar Producto"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(item.id)}
                        className="btn" 
                        style={{ padding: '0.4rem', color: 'var(--danger)' }} 
                        title="Eliminar Producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No se encontraron ítems con los filtros aplicados.
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal" style={{ position: 'relative', width: '95%', maxWidth: '500px', padding: '2.5rem', animation: 'fadeIn 0.3s ease-out' }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Cerrar"
            >
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                background: 'rgba(16, 163, 150, 0.1)', 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--primary)'
              }}>
                <Edit size={24} />
              </div>
              <h3 style={{ color: 'var(--primary-dark)', fontSize: '1.5rem', margin: 0 }}>Modificar Producto</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Actualice las propiedades del ítem seleccionado</p>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <Tag size={14} color="var(--primary)" /> Nombre del Ítem
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <Boxes size={14} color="var(--primary)" /> Categoría
                  </label>
                  <select 
                    className="input-field"
                    value={editForm.categoria}
                    onChange={(e) => setEditForm(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <Hash size={14} color="var(--primary)" /> Stock Mínimo
                  </label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={editForm.stock_minimo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stock_minimo: parseInt(e.target.value) || 0 }))}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <MapPin size={14} color="var(--primary)" /> Depósito / Área
                </label>
                <select 
                  className="input-field"
                  value={editForm.area}
                  onChange={(e) => setEditForm(prev => ({ ...prev, area: e.target.value }))}
                >
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.75rem' }} 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.75rem', gap: '0.5rem' }}
                  disabled={isSaving}
                >
                  <Save size={18} />
                  {isSaving ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
