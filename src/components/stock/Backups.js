"use client";

import React from 'react';
import { Database, FileText, FileSpreadsheet, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Backups = ({ inventory, consumptions, entries }) => {
  const [lastBackup, setLastBackup] = React.useState(localStorage.getItem('last_backup') || 'Nunca');

  const exportSQL = () => {
    let sql = `-- Backup Plataforma de Stock - ${new Date().toLocaleString()}\n`;
    sql += `DELETE FROM item_catalogo;\n`;
    inventory.forEach(item => {
      sql += `INSERT INTO item_catalogo (nombre_item, categoria, stock_inicial, current_stock, unidad) VALUES ('${item.nombre}', '${item.categoria}', ${item.stock_inicial}, ${item.current_stock}, '${item.unidad}');\n`;
    });
    
    sql += `\nDELETE FROM consumptions;\n`;
    consumptions.forEach(c => {
      sql += `INSERT INTO consumptions (item_id, paciente_nombre, paciente_ci, cantidad, departamento, categoria_pago, staff, timestamp, item_name) VALUES ('${c.item_id}', '${c.paciente_nombre}', '${c.paciente_ci}', ${c.cantidad}, '${c.departamento}', '${c.categoria_pago}', '${c.staff}', '${c.timestamp}', '${c.item_name}');\n`;
    });

    sql += `\nDELETE FROM entries;\n`;
    entries.forEach(e => {
      sql += `INSERT INTO entries (item_id, cantidad_ingresada, proveedor, nro_factura, fecha_vencimiento, timestamp, item_name) VALUES ('${e.item_id}', ${e.cantidad_ingresada}, '${e.proveedor}', '${e.nro_factura}', '${e.fecha_vencimiento}', '${e.timestamp}', '${e.item_name}');\n`;
    });

    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    link.href = url;
    link.download = `backup_cloud_stock_${now.toISOString().split('T')[0]}.sql`;
    link.click();
    
    const dateStr = now.toLocaleString();
    setLastBackup(dateStr);
    localStorage.setItem('last_backup', dateStr);
  };

  const exportExcel = () => {
    // Format data for administrative clarity
    const dataForExcel = inventory.map(item => ({
      'Producto': item.nombre,
      'Categoría': item.categoria,
      'Depósito': item.area || 'GENERAL',
      'Stock Inicial': item.stock_inicial,
      'Saldo Actual': item.current_stock,
      'Unidad': item.unidad,
      'Consumo Acumulado': item.stock_inicial - item.current_stock,
      'Vencimiento': item.vencimiento
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario_Maestro");
    XLSX.writeFile(wb, `Reporte_BonneSante_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(16, 163, 150); // Institutional primary
    doc.text("BONNE SANTÉ - REPORTE DE INVENTARIO", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableColumn = ["Producto", "Depósito", "S. Inicial", "Saldo (Actual)", "Consumo"];
    const tableRows = inventory.map(item => [
      item.nombre, 
      item.area || 'GRAL', 
      item.stock_inicial, 
      item.current_stock,
      item.stock_inicial - item.current_stock
    ]);
    
    doc.autoTable(tableColumn, tableRows, { 
      startY: 35,
      headStyles: { fillColor: [3, 111, 114] }, // primary-dark
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    doc.save(`Reporte_Manual_Stock_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="glass-card" style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem' }}>Gestión de Datos y Reportes</h2>
          <p className="text-muted">Directorio de Exportación: <code style={{ color: 'var(--primary)', fontWeight: 600 }}>Downloads / Plataforma de Stock</code></p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid var(--primary-light)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600 }}>ÚLTIMO BACKUP</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{lastBackup}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Database size={24} color="var(--primary)" /> Backup Estructural (Cloud)
            </h3>
            <p style={{ fontSize: '0.95rem', margin: '1.25rem 0', color: 'var(--text-muted)' }}>
              Genera un archivo .sql con la estructura compatible para migraciones de Supabase.
            </p>
            <button className="btn btn-primary" onClick={exportSQL} style={{ width: '100%' }}>
              <Download size={18} /> Exportar SQL Maestro
            </button>
          </div>

          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--secondary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileSpreadsheet size={24} color="var(--secondary)" /> Reportes Administrativos
            </h3>
            <p style={{ fontSize: '0.95rem', margin: '1.25rem 0', color: 'var(--text-muted)' }}>
              Reportes con detalle de Consumo Acumulado (Stock Inicial vs Saldo).
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={exportExcel} style={{ flex: 1 }}>EXCEL PROFESIONAL</button>
              <button className="btn btn-secondary" onClick={exportPDF} style={{ flex: 1 }}>PDF AUDITORÍA</button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(254, 243, 199, 0.1) 100%)', borderColor: 'var(--accent)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)' }}>
            <ShieldCheck size={24} /> Instrucciones de Auditoría
          </h3>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><b>Cálculo de Consumo:</b></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Los reportes calculan automáticamente: <br/> 
                <code>Consumo = Stock Inicial - Saldo Actual</code>
              </p>
            </div>
            
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><b>Verificación Física:</b></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Utilice el PDF de Auditoría para realizar el conteo ciego mensual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backups;
