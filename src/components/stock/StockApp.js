"use client";

import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from './supabaseStockClient';

// Components
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ConsumptionForm from './ConsumptionForm';
import EntryForm from './EntryForm';
import InventoryTable from './InventoryTable';
import HistoryTable from './HistoryTable';
import Backups from './Backups';
import NewItemForm from './NewItemForm';
import HeroManager from './HeroManager';
import Login from './Login';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('OPERADOR'); // Default to lowest role
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth & Role Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else {
        setUserRole('OPERADOR');
        setInventory([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      // First try user_metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role);
        return;
      }

      // If not in metadata, try a profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data) setUserRole(data.role);
    } catch (err) {
      console.error('Error fetching role:', err);
    }
  };

  // Data Fetching
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, cons, ent] = await Promise.all([
        supabase.from('item_catalogo').select('*, nombre:nombre_item').order('nombre_item'),
        supabase.from('consumptions').select('*').order('timestamp', { ascending: false }),
        supabase.from('entries').select('*').order('timestamp', { ascending: false })
      ]);

      if (inv.data) setInventory(inv.data);
      if (cons.data) setConsumptions(cons.data);
      if (ent.data) setEntries(ent.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleConsumption = async (data) => {
    const { items, ...header } = data;
    const userId = session.user.id;
    const userName = session.user.email.split('@')[0].toUpperCase();

    const newConsumptions = items.map(itemRow => {
      const inventoryItem = inventory.find(i => i.id === itemRow.itemId);
      return {
        item_id: itemRow.itemId,
        paciente_nombre: header.pacienteNombre.toUpperCase(),
        paciente_ci: header.pacienteCi,
        cantidad: parseInt(itemRow.cantidad),
        departamento: header.departamento.toUpperCase(),
        categoria_pago: header.categoriaPago.toUpperCase(),
        staff: userName,
        timestamp: new Date().toISOString(),
        item_name: inventoryItem?.nombre || 'DESCONOCIDO',
        usuario_registro: userId
      };
    });

    // Update Supabase
    const { error: consError } = await supabase.from('consumptions').insert(newConsumptions);
    
    if (!consError) {
      // Update inventory stock (Ideally this should be a transaction or RPC)
      for (const item of items) {
        const currentItem = inventory.find(i => i.id === item.itemId);
        await supabase
          .from('item_catalogo')
          .update({ current_stock: currentItem.current_stock - parseInt(item.cantidad) })
          .eq('id', item.itemId);
      }
      fetchData();
      setActiveTab('history');
    }
  };

  const handleEntry = async (data) => {
    const { items, ...header } = data;
    const userId = session.user.id;

    const newEntries = items.map(itemRow => {
      const inventoryItem = inventory.find(i => i.id === itemRow.itemId);
      return {
        item_id: itemRow.itemId,
        cantidad_ingresada: parseInt(itemRow.cantidadIngresada),
        proveedor: header.proveedor.toUpperCase(),
        nro_factura: header.nroFactura.toUpperCase(),
        fecha_vencimiento: itemRow.vencimiento,
        timestamp: new Date().toISOString(),
        item_name: inventoryItem?.nombre || 'DESCONOCIDO',
        usuario_registro: userId
      };
    });

    const { error: entError } = await supabase.from('entries').insert(newEntries);

    if (!entError) {
      for (const item of items) {
        const currentItem = inventory.find(i => i.id === item.itemId);
        await supabase
          .from('item_catalogo')
          .update({ 
            current_stock: currentItem.current_stock + parseInt(item.cantidadIngresada)
          })
          .eq('id', item.itemId);
      }
      fetchData();
      setActiveTab('history');
    }
  };

  const handleAddItem = async (newItem) => {
    const { nombre, area, vencimiento, ...rest } = newItem;
    const { error } = await supabase.from('item_catalogo').insert([{
      nombre_item: nombre,
      ...rest,
      usuario_registro: session.user.id
    }]);

    if (!error) {
      fetchData();
      setActiveTab('inventory');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (userRole !== 'ADMIN') return;
    const { error } = await supabase.from('item_catalogo').delete().eq('id', itemId);
    if (!error) fetchData();
  };

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Cargando datos...</div>;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} consumptions={consumptions} entries={entries} />;
      case 'inventory':
        return <InventoryTable 
          inventory={inventory} 
          userRole={userRole} 
          onDelete={handleDeleteItem} 
        />;
      case 'consume':
        return <ConsumptionForm inventory={inventory} onSubmit={handleConsumption} />;
      case 'entry':
        if (userRole === 'OPERADOR') return <Dashboard inventory={inventory} />;
        return <EntryForm inventory={inventory} onSubmit={handleEntry} />;
      case 'new-item':
        if (userRole !== 'ADMIN') return <Dashboard inventory={inventory} />;
        return <NewItemForm onAddItem={handleAddItem} />;
      case 'web-manager':
        if (userRole !== 'ADMIN') return <Dashboard inventory={inventory} />;
        return <HeroManager />;
      case 'history':
        return <HistoryTable consumptions={consumptions} entries={entries} />;
      case 'backups':
        return <Backups 
          inventory={inventory} 
          consumptions={consumptions} 
          entries={entries} 
        />;
      default:
        return <Dashboard inventory={inventory} />;
    }
  };

  if (!session) {
    return <Login onLogin={(user) => setSession({ user })} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: 'var(--primary-dark)', margin: 0 }}>InvenMed+</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
               SISTEMA DE GESTIÓN | <span className="badge badge-info">{userRole}</span>
            </p>
          </div>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{session.user.email}</p>
               <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{new Date().toLocaleDateString()}</p>
             </div>
             <button 
               onClick={handleLogout}
               className="btn" 
               style={{ padding: '0.5rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)' }}
             >
               <LogOut size={18} />
             </button>
          </div>
        </header>

        <div className="animate-fade">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
