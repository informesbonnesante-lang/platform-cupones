import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Download, Search, RefreshCw, Filter, ArrowDownRight, ArrowUpRight, ArrowRightLeft,
  AlertTriangle, TrendingUp, TrendingDown, ClipboardList 
} from 'lucide-react';

interface Movimiento {
  id: string;
  fecha_hora: string;
  tipo: 'Ingreso' | 'Consumo' | 'Transferencia';
  item: string;
  cantidad: number;
  deposito: string;
  responsable: string;
  detalles: string;
}

export default function ReporteMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Applied Filter States (Driving the actual memoized filters)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterDeposito, setFilterDeposito] = useState('TODOS');
  const [desdeFecha, setDesdeFecha] = useState('');
  const [hastaFecha, setHastaFecha] = useState('');

  // 2. Input States (Bound to form elements before user clicks "Buscar")
  const [buscarInput, setBuscarInput] = useState('');
  const [tipoInput, setTipoInput] = useState('Todos');
  const [depositoInput, setDepositoInput] = useState('TODOS');
  const [desdeInput, setDesdeInput] = useState('');
  const [hastaInput, setHastaInput] = useState('');

  // Deduplicated list of warehouses
  const [listaDepositos, setListaDepositos] = useState<string[]>([]);

  // Safe fetch function utilizing independent queries and flexible mapping (no RLS Joins)
  const fetchAllMovimientos = async () => {
    setLoading(true);
    try {
      // 1. Load warehouse masters safely
      const { data: depsData } = await supabase.from('depositos').select('id, nombre');
      const depMap: Record<string, string> = {};
      if (depsData) {
        depsData.forEach(d => { depMap[String(d.id)] = d.nombre; });
      }

      // 2. Fetch independent tables using select('*') to prevent PostgreSQL column mismatches
      const [entriesRes, consumptionsRes, transferRes] = await Promise.all([
        supabase.from('entries').select('*'),
        supabase.from('consumptions').select('*'),
        supabase.from('transferencias').select('*')
      ]);

      const entries = entriesRes.data || [];
      const consumptions = consumptionsRes.data || [];
      const transferencias = transferRes.data || [];

      // 3. Robust client-side normalization with flexible key fallbacks
      const normalizedEntries: Movimiento[] = entries.map(e => ({
        id: `ent_${e.id}`,
        fecha_hora: e.timestamp || e.created_at || new Date().toISOString(),
        tipo: 'Ingreso',
        item: e.item_name || 'Sin nombre',
        cantidad: e.cantidad_ingresada || e.cantidad || 0,
        deposito: depMap[String(e.deposito_id)] || e.deposito || 'Depósito Central',
        responsable: e.usuario_registro || e.responsable || 'admin',
        detalles: e.observaciones || `Prov: ${e.proveedor || 'S/N'} | Fact: ${e.nro_factura || 'S/N'}`
      }));

      const normalizedConsumptions: Movimiento[] = consumptions.map(c => ({
        id: `cons_${c.id}`,
        fecha_hora: c.timestamp || c.created_at || new Date().toISOString(),
        tipo: 'Consumo',
        item: c.item_name || 'Sin nombre',
        cantidad: c.cantidad || 0,
        deposito: depMap[String(c.deposito_id)] || c.departamento || 'Depósito Central',
        responsable: c.staff || c.responsable || 'admin',
        detalles: c.observaciones || `Paciente: ${c.paciente_nombre || 'N/A'} (${c.paciente_ci || 'N/A'})`
      }));

      const normalizedTransfers: Movimiento[] = transferencias.map(t => ({
        id: `trans_${t.id}`,
        fecha_hora: t.timestamp || t.created_at || new Date().toISOString(),
        tipo: 'Transferencia',
        item: t.item_name || 'Sin nombre',
        cantidad: t.cantidad || 0,
        deposito: t.from_area && t.to_area ? `${t.from_area} -> ${t.to_area}` : (t.to_area || 'Depósito Central'),
        responsable: t.responsable || 'admin',
        detalles: `Origen: ${t.from_area || 'SD'} | Destino: ${t.to_area || 'SD'}`
      }));

      // Merge and sort chronologically
      const total = [...normalizedEntries, ...normalizedConsumptions, ...normalizedTransfers]
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

      setMovimientos(total);

      // Deduplicate warehouses list dynamically
      const uniqueDeps = Array.from(new Set(total.map(m => m.deposito))).filter(Boolean) as string[];
      setListaDepositos(uniqueDeps);

    } catch (error) {
      console.error("Critical error inside fetchAllMovimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mount loading
  useEffect(() => {
    fetchAllMovimientos();
  }, []);

  const normalize = (str: string) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Real-time memory filter calculation triggered by changes in applied filters or data
  useEffect(() => {
    let result = [...movimientos];

    // Search query match
    if (searchTerm.trim() !== '') {
      const q = normalize(searchTerm);
      result = result.filter(m => 
        normalize(m.item).includes(q) || 
        normalize(m.responsable).includes(q) || 
        normalize(m.detalles).includes(q)
      );
    }

    // Movement type filter
    if (filterType !== 'Todos') {
      result = result.filter(m => m.tipo === filterType);
    }

    // Warehouse filter
    if (filterDeposito !== 'TODOS') {
      const depQ = normalize(filterDeposito);
      result = result.filter(m => normalize(m.deposito).includes(depQ));
    }

    // Date From filter
    if (desdeFecha.trim() !== '') {
      const itemDateStr = (m: Movimiento) => m.fecha_hora ? m.fecha_hora.split('T')[0] : '';
      result = result.filter(m => itemDateStr(m) >= desdeFecha);
    }

    // Date To filter
    if (hastaFecha.trim() !== '') {
      const itemDateStr = (m: Movimiento) => m.fecha_hora ? m.fecha_hora.split('T')[0] : '';
      result = result.filter(m => itemDateStr(m) <= hastaFecha);
    }

    setFilteredMovimientos(result);
  }, [searchTerm, filterType, filterDeposito, desdeFecha, hastaFecha, movimientos]);

  // Click Search triggers actual state updates and dynamic reload
  const handleSearch = () => {
    setSearchTerm(buscarInput);
    setFilterType(tipoInput);
    setFilterDeposito(depositoInput);
    setDesdeFecha(desdeInput);
    setHastaFecha(hastaInput);
    fetchAllMovimientos();
  };

  // Click Clear Filters resets everything to initial states
  const handleClearFilters = () => {
    setBuscarInput('');
    setTipoInput('Todos');
    setDepositoInput('TODOS');
    setDesdeInput('');
    setHastaInput('');

    setSearchTerm('');
    setFilterType('Todos');
    setFilterDeposito('TODOS');
    setDesdeFecha('');
    setHastaFecha('');

    fetchAllMovimientos();
  };

  // KPI Calculations
  const totalIngresos = useMemo(() => {
    return filteredMovimientos.filter(m => m.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [filteredMovimientos]);

  const totalConsumos = useMemo(() => {
    return filteredMovimientos.filter(m => m.tipo === 'Consumo').reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [filteredMovimientos]);

  const exportToCSV = () => {
    const headers = ['FECHA / HORA', 'TIPO', 'ÍTEM', 'CANTIDAD', 'DEPÓSITO', 'RESPONSABLE', 'OBSERVACIONES / DETALLES'];
    const rows = filteredMovimientos.map(m => [
      new Date(m.fecha_hora).toLocaleString(),
      m.tipo,
      m.item,
      m.cantidad,
      m.deposito,
      m.responsable,
      m.detalles
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
            <ClipboardList className="text-teal-600" size={28} /> Reporte Integral de Movimientos
          </h1>
          <p className="text-sm text-gray-500">Historial unificado de ingresos, consumos y transferencias entre depósitos.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={fetchAllMovimientos} 
            disabled={loading}
            className="p-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
          </button>
          <button 
            onClick={exportToCSV} 
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm w-full md:w-auto"
          >
            <Download size={16} /> Exportar Excel (CSV)
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Ingresos Totales (Filtrado)</p>
            <h3 className="text-xl font-bold text-slate-800">{loading ? '...' : `${totalIngresos} unidades`}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Salidas / Consumos (Filtrado)</p>
            <h3 className="text-xl font-bold text-slate-800">{loading ? '...' : `${totalConsumos} unidades`}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total de Registros</p>
            <h3 className="text-xl font-bold text-slate-800">{loading ? '...' : `${filteredMovimientos.length} ítems`}</h3>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Ítem, responsable..." 
                value={buscarInput} 
                onChange={(e) => setBuscarInput(e.target.value)} 
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tipo de Movimiento</label>
            <select 
              value={tipoInput} 
              onChange={(e) => setTipoInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Todos">Todos</option>
              <option value="Ingreso">Entradas (Ingresos)</option>
              <option value="Consumo">Salidas (Consumos)</option>
              <option value="Transferencia">Transferencias</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Depósito</label>
            <select 
              value={depositoInput} 
              onChange={(e) => setDepositoInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="TODOS">TODOS</option>
              {listaDepositos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Desde Fecha</label>
            <input 
              type="date" 
              value={desdeInput} 
              onChange={(e) => setDesdeInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Hasta Fecha</label>
            <input 
              type="date" 
              value={hastaInput} 
              onChange={(e) => setHastaInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
            />
          </div>
        </div>

        {/* BUTTON ACTION BAR */}
        <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
          <button 
            onClick={handleClearFilters}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition"
          >
            Limpiar Filtros
          </button>
          <button 
            id="Buscar"
            onClick={handleSearch}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
          >
            <Filter size={15} /> Buscar
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-gray-400 font-bold text-xs uppercase border-b border-slate-200">
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Ítem</th>
                <th className="p-4">Cantidad</th>
                <th className="p-4">Depósito</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Observaciones / Detalles</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin inline mr-2" size={18} /> Cargando registros en tiempo real...
                  </td>
                </tr>
              ) : filteredMovimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    No se encontraron registros. Prueba limpiando los filtros o agregando un nuevo movimiento.
                  </td>
                </tr>
              ) : (
                filteredMovimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-400">
                      {new Date(m.fecha_hora).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {m.tipo === 'Ingreso' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                          <ArrowDownRight size={13} /> Ingreso
                        </span>
                      )}
                      {m.tipo === 'Consumo' && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold border border-rose-100">
                          <ArrowUpRight size={13} /> Consumo
                        </span>
                      )}
                      {m.tipo === 'Transferencia' && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                          <ArrowRightLeft size={13} /> Transferencia
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{m.item}</td>
                    <td className="p-4 font-bold text-slate-800">
                      {m.tipo === 'Ingreso' ? '+' : m.tipo === 'Consumo' ? '-' : ''}{m.cantidad}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {m.deposito}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 font-medium">{m.responsable}</td>
                    <td className="p-4 text-xs italic text-gray-400">{m.detalles}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
