"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseStockClient';
import { PackagePlus, Tag, Boxes, Save, MapPin, Hash, AlertTriangle } from 'lucide-react';

const NewItemForm = ({ onAddItem, depositos = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'INSUMOS',
    unidad: 'UNIDAD',
    area: '',
    stock_inicial: 0,
    cant_por_caja: 1,
    stock_minimo: 5
  });

  const categories = ['MEDICAMENTOS', 'ESTÉTICA', 'INSUMOS', 'DESCARTABLES', 'ACTIVOS'];
  const units = ['UNIDAD', 'CAJA', 'FRASCO', 'AMPOLLA', 'ML', 'G', 'BLISTER', 'PAQUETE'];
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  useEffect(() => {
    if (depositos.length > 0) {
      setAreas(depositos);
      const central = depositos.find(a => a.toUpperCase().includes('CENTRAL'));
      setFormData(prev => ({ ...prev, area: central || depositos[0] }));
      setLoadingAreas(false);
      return;
    }

    const fetchDepositos = async () => {
      try {
        const { data, error } = await supabase.from('depositos').select('nombre').order('nombre');
        if (data && !error && data.length > 0) {
          const fetchedAreas = data.map(d => d.nombre);
          setAreas(fetchedAreas);
          
          // Establecer "Depósito Central" como valor por defecto
          const central = fetchedAreas.find(a => a.includes('Central') || a.includes('CENTRAL') || a.includes('central'));
          if (central) {
            setFormData(prev => ({ ...prev, area: central }));
          }
        } else {
          // Fallback en caso de que la tabla esté vacía o haya error
          const fallbackAreas = ['DEPÓSITO CENTRAL', 'ESTÉTICA', 'FARMACIA'];
          setAreas(fallbackAreas);
          setFormData(prev => ({ ...prev, area: 'DEPÓSITO CENTRAL' }));
        }
      } catch (err) {
        console.error('Error fetching depositos:', err);
        const fallbackAreas = ['DEPÓSITO CENTRAL', 'ESTÉTICA', 'FARMACIA'];
        setAreas(fallbackAreas);
        setFormData(prev => ({ ...prev, area: 'DEPÓSITO CENTRAL' }));
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchDepositos();
  }, [depositos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateLog = (item) => {
    const timestamp = new Date().toLocaleString();
    const logContent = `
==============================================
NUEVO ÍTEM REGISTRADO EN CATÁLOGO
==============================================
Fecha/Hora: ${timestamp}
ID: ${item.id}
Nombre: ${item.nombre}
Categoría: ${item.categoria}
Unidad: ${item.unidad}
Área Asignada: ${item.area}
Stock Inicial: ${item.stock_inicial}
Stock Actual: ${item.current_stock}
==============================================
    `;

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `log_nuevo_item_${item.nombre.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.txt`;
    
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('Por favor, ingrese el nombre del ítem.');
      return;
    }

    setIsSubmitting(true);

    const initialStock = parseInt(formData.stock_inicial) || 0;
    const cantPorCaja = formData.unidad === 'CAJA' ? (parseInt(formData.cant_por_caja) || 1) : 1;

    const newItem = {
      nombre: formData.nombre.toUpperCase(),
      categoria: formData.categoria,
      unidad: formData.unidad,
      cant_por_caja: cantPorCaja,
      area: formData.area,
      stock_minimo: parseInt(formData.stock_minimo) || 5,
      stock_inicial: initialStock, // Guardaremos las cajas que digite como info
      current_stock: initialStock * cantPorCaja, // El stock real es convertido a unidades
      vencimiento: formData.vencimiento || 'N/A'
    };

    const result = await onAddItem(newItem);
    
    if (result && result.success) {
      generateLog({ ...newItem, id: Date.now().toString() });
      
      // Reset form
      setFormData({
        nombre: '',
        categoria: 'INSUMOS',
        unidad: 'UNIDAD',
        area: '',
        stock_inicial: 0,
        cant_por_caja: 1,
        stock_minimo: 5,
        vencimiento: ''
      });

      alert('Ítem añadido al catálogo y log generado con Stock Inicial.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem' }}>
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
          <PackagePlus size={32} />
        </div>
        <h2 style={{ color: 'var(--primary-dark)', fontSize: '1.8rem' }}>Añadir Nuevo Ítem al Catálogo</h2>
        <p style={{ color: 'var(--text-muted)' }}>Defina las propiedades base del nuevo producto</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <Tag size={16} color="var(--primary)" /> Nombre del Ítem
          </label>
          <input 
            type="text" 
            name="nombre"
            className="input-field" 
            placeholder="Ej: GASAS ESTÉRILES 10X10"
            value={formData.nombre}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <Boxes size={16} color="var(--primary)" /> Categoría
            </label>
            <select 
              name="categoria"
              className="input-field"
              value={formData.categoria}
              onChange={handleChange}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <PackagePlus size={16} color="var(--primary)" /> Unidad
            </label>
            <select 
              name="unidad"
              className="input-field"
              value={formData.unidad}
              onChange={handleChange}
            >
              {units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <Hash size={16} color="var(--primary)" /> Stock Inicial ({formData.unidad === 'CAJA' ? 'En Cajas' : 'En Unidades'})
            </label>
            <input 
              type="number" 
              name="stock_inicial"
              className="input-field"
              value={formData.stock_inicial}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <AlertTriangle size={16} color="var(--warning, #f59e0b)" /> Stock Mínimo
            </label>
            <input 
              type="number" 
              name="stock_minimo"
              className="input-field"
              value={formData.stock_minimo}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <MapPin size={16} color="var(--primary)" /> Depósito
            </label>
            <select 
              name="area"
              className="input-field"
              value={formData.area}
              onChange={handleChange}
              required
              disabled={loadingAreas}
            >
              <option value="" disabled>{loadingAreas ? 'Cargando...' : 'Seleccione Depósito'}</option>
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: formData.unidad === 'CAJA' ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              Vencimiento (Opcional)
            </label>
            <input 
              type="date" 
              name="vencimiento"
              className="input-field"
              value={formData.vencimiento}
              onChange={handleChange}
            />
          </div>
          {formData.unidad === 'CAJA' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <Boxes size={16} color="var(--primary)" /> Unidades por Caja
              </label>
              <input 
                type="number" 
                name="cant_por_caja"
                className="input-field"
                value={formData.cant_por_caja}
                onChange={handleChange}
                min="1"
                required
                placeholder="Ej: 50"
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                Stock interno guardado: {formData.stock_inicial * (formData.cant_por_caja || 1)} unidades.
              </small>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', gap: '0.75rem' }} disabled={isSubmitting}>
            <Save size={20} /> {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar Ítem'}
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            * Al confirmar, se establecerá el stock inicial y se generará un registro de auditoría local.
          </p>
        </div>
      </form>
    </div>
  );
};

export default NewItemForm;
