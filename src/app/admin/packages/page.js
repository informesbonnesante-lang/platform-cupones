'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, Package } from 'lucide-react';
import { getPackages, savePackage, deletePackage } from '../../../lib/api';

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    const data = await getPackages();
    setPackages(data);
    setIsLoading(false);
  };

  const handleAddNew = () => {
    setEditingPkg({
      name: '',
      items: [
        { category: '', detail: '', sessions: 1 }
      ]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editingPkg.items];
    newItems[index][field] = value;
    setEditingPkg({ ...editingPkg, items: newItems });
  };

  const handleAddItem = () => {
    setEditingPkg({
      ...editingPkg,
      items: [...editingPkg.items, { category: '', detail: '', sessions: 1 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...editingPkg.items];
    newItems.splice(index, 1);
    setEditingPkg({ ...editingPkg, items: newItems });
  };

  const handleSave = async () => {
    if (!editingPkg.name.trim()) return alert("Debe ingresar un nombre para el paquete.");
    if (editingPkg.items.length === 0) return alert("Debe agregar al menos un servicio.");
    
    // Validar items
    for (let i = 0; i < editingPkg.items.length; i++) {
      const item = editingPkg.items[i];
      if (!item.category || !item.detail || item.sessions < 1) {
        return alert(`Por favor complete todos los datos del servicio #${i + 1}`);
      }
    }

    const saved = await savePackage(editingPkg);
    if (saved) {
      setEditingPkg(null);
      loadPackages();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Está seguro de eliminar este paquete maestro?")) {
      const ok = await deletePackage(id);
      if (ok) loadPackages();
    }
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={24} color="#0A4275" />
          Paquetes Maestros
        </h1>
        {!editingPkg && (
          <button className="btn-primary" onClick={handleAddNew}>
            <PlusCircle size={18} /> Nuevo Paquete
          </button>
        )}
      </div>

      {editingPkg ? (
        <div className="card mb-6" style={{ borderTop: '4px solid #10B981' }}>
          <h2 className="mb-4">{editingPkg.id ? 'Editar Paquete' : 'Crear Nuevo Paquete'}</h2>
          
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label">Nombre del Paquete (Ej: Wedding Package, Lifting Total)</label>
            <input 
              type="text" className="input-field" 
              value={editingPkg.name} 
              onChange={(e) => setEditingPkg({...editingPkg, name: e.target.value})}
              placeholder="Nombre del paquete..."
              style={{ fontSize: '1.2rem', padding: '0.75rem' }}
            />
          </div>

          <h3 style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Servicios Incluidos</h3>
          
          {editingPkg.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ fontSize: '0.8rem' }}>Categoría</label>
                <input 
                  type="text" className="input-field" 
                  value={item.category} 
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                  placeholder="Ej: Kinesiología, Dermatología..."
                />
              </div>
              <div style={{ flex: 2 }}>
                <label className="input-label" style={{ fontSize: '0.8rem' }}>Detalle del Servicio</label>
                <input 
                  type="text" className="input-field" 
                  value={item.detail} 
                  onChange={(e) => handleItemChange(index, 'detail', e.target.value)}
                  placeholder="Ej: Ultherapy, Masajes..."
                />
              </div>
              <div style={{ width: '100px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem' }}>Sesiones</label>
                <input 
                  type="number" min="1" className="input-field" 
                  value={item.sessions} 
                  onChange={(e) => handleItemChange(index, 'sessions', parseInt(e.target.value) || 1)}
                />
              </div>
              <button 
                onClick={() => handleRemoveItem(index)}
                style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '0.375rem', padding: '0.75rem', cursor: 'pointer' }}
                title="Eliminar servicio"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button 
            onClick={handleAddItem}
            style={{ background: '#E0E7FF', color: '#4F46E5', border: '1px dashed #A5B4FC', borderRadius: '0.375rem', padding: '0.75rem', cursor: 'pointer', width: '100%', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Añadir otro servicio al paquete
          </button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
            <button 
              className="btn-primary" 
              style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' }}
              onClick={() => setEditingPkg(null)}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} style={{ background: '#10B981', borderColor: '#10B981' }}>
              <Save size={18} /> Guardar Paquete
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', gridColumn: '1 / -1' }}>Cargando paquetes...</div>
          ) : packages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '0.5rem', color: '#6B7280', gridColumn: '1 / -1' }}>
              No hay paquetes registrados. Haga clic en "Nuevo Paquete" para crear uno.
            </div>
          ) : (
            packages.map(pkg => (
              <div key={pkg.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between mb-4">
                  <h3 style={{ margin: 0, color: '#0A4275' }}>{pkg.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditingPkg(pkg)}
                      style={{ background: '#E6F7FF', color: '#1890FF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg.id)}
                      style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                
                <div style={{ flex: 1, background: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Contiene {pkg.items?.length || 0} servicios:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#374151', fontSize: '0.9rem' }}>
                    {pkg.items?.map((it, idx) => (
                      <li key={idx} style={{ marginBottom: '0.3rem' }}>
                        <strong>{it.detail}</strong> ({it.sessions} sesion/es) <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>- {it.category}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
