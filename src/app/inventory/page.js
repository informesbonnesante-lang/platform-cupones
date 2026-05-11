import Navigation from '../../components/Navigation';
import dynamic from 'next/dynamic';

const StockApp = dynamic(() => import('../../components/stock/StockApp'), { ssr: false });

export const metadata = {
  title: 'Control de Inventario - MedCupon',
  description: 'Gestión de inventario de medicamentos e insumos',
};

export default function InventoryPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
      <Navigation title="Control de Inventario" />
      <div className="inventory-app-wrapper" style={{ height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        <StockApp />
      </div>
    </div>
  );
}
