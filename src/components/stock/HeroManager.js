"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseStockClient';
import { Layout, Save, Image as ImageIcon, Type, RefreshCw } from 'lucide-react';

const HeroManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPageSettings();
  }, []);

  const fetchPageSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('page_settings').select('*');
    if (data) {
      setPages(data);
      if (data.length > 0) setSelectedPage(data[0]);
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('page_settings')
      .update({
        herotitle: selectedPage.herotitle,
        herosubtitle: selectedPage.herosubtitle,
        hero_image_url: selectedPage.hero_image_url
      })
      .eq('page_name', selectedPage.page_name);

    if (!error) {
      alert('Configuración de Hero actualizada con éxito');
      fetchPageSettings();
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Cargando configuración web...</div>;

  return (
    <div className="glass-card" style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Layout size={24} color="var(--primary)" /> Gestión de Contenidos Web
          </h2>
          <p className="text-muted">Editor de Secciones Hero vinculadas a Supabase</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchPageSettings}>
          <RefreshCw size={18} /> Sincronizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Seleccionar Página</h3>
          {pages.map(page => (
            <div 
              key={page.page_name}
              onClick={() => setSelectedPage(page)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: selectedPage?.page_name === page.page_name ? 'rgba(16, 163, 150, 0.1)' : 'white',
                border: `1px solid ${selectedPage?.page_name === page.page_name ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <p style={{ fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>{page.page_name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Última edición técnica vía API</p>
            </div>
          ))}
        </div>

        {selectedPage && (
          <form onSubmit={handleUpdate} className="glass-card" style={{ padding: '2rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Type size={16} /> Título Principal (Hero Title)
                </label>
                <input 
                  type="text" 
                  className="input-field"
                  value={selectedPage.herotitle}
                  onChange={(e) => setSelectedPage({...selectedPage, herotitle: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Type size={16} /> Subtítulo (Hero Subtitle)
                </label>
                <textarea 
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={selectedPage.herosubtitle}
                  onChange={(e) => setSelectedPage({...selectedPage, herosubtitle: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <ImageIcon size={16} /> URL de Imagen de Fondo
                </label>
                <input 
                  type="text" 
                  className="input-field"
                  value={selectedPage.hero_image_url}
                  onChange={(e) => setSelectedPage({...selectedPage, hero_image_url: e.target.value})}
                />
              </div>

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Previsualización de Estilo</p>
                <div style={{ 
                  height: '100px', 
                  borderRadius: '8px', 
                  backgroundImage: `url(${selectedPage.hero_image_url})`,
                  backgroundSize: 'cover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}></div>
                  <div style={{ position: 'relative', textAlign: 'center', color: 'white', padding: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{selectedPage.herotitle}</p>
                    <p style={{ fontSize: '0.5rem', margin: 0 }}>{selectedPage.herosubtitle}</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={20} /> {saving ? 'Guardando cambios...' : 'Guardar y Publicar en Web'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HeroManager;
