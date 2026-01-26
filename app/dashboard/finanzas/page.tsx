"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  CreditCardIcon, 
  CalendarDaysIcon,
  CalculatorIcon
} from "@heroicons/react/24/solid";

// Importar Componentes
import TableroTab from "./components/TableroTab";
import RentabilidadTab from "./components/RentabilidadTab";
import PresupuestosTab from "./components/PresupuestosTab"; // (Si no usas este, puedes comentarlo)
import GastosFijosTab from "./components/GastosFijosTab";
import { ModalesFinanzas } from "./components/ModalesFinanzas";

// Importar Tipos
import { Movimiento, GastoFijo, Presupuesto } from "./types";

export default function FinanzasPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tablero' | 'rentabilidad' | 'presupuestos' | 'fijos'>('tablero');
  
  // Datos
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  
  // Estado para Modales
  const [modales, setModales] = useState({
      ingreso: false,
      gasto: false,
      fijo: false,
      presupuesto: false
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // 1. Cargar Movimientos
    const { data: movs } = await supabase
        .from("movimientos")
        .select("*")
        .eq("owner_id", uid)
        .order('fecha', { ascending: false });

    // 2. Cargar Gastos Fijos
    const { data: fijos } = await supabase
        .from("gastos_fijos")
        .select("*")
        .eq("owner_id", uid)
        .eq("activo", true);

    // 3. Cargar Cuentas
    const { data: accs } = await supabase
        .from("cuentas")
        .select("*")
        .eq("owner_id", uid);

    // 4. Cargar Presupuestos (opcional si usas ese módulo)
    const { data: pres } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("owner_id", uid);

    setMovimientos(movs || []);
    setGastosFijos(fijos || []);
    setCuentas(accs || []);
    setPresupuestos(pres || []);
    setLoading(false);
  };

  // Botón genérico para menú
  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === id 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="hidden md:inline">{label}</span>
      </button>
  );

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando tus finanzas...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Centro Financiero 💰</h1>
            <p className="text-gray-400 text-sm">Gestiona tu flujo de caja inteligente.</p>
          </div>
          <div className="flex gap-2">
              <button 
                onClick={() => setModales({...modales, gasto: true})}
                className="bg-red-500/10 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition"
              >
                  - Gasto
              </button>
              <button 
                onClick={() => setModales({...modales, ingreso: true})}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition"
              >
                  + Ingreso
              </button>
          </div>
      </div>

      {/* Navegación Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/10">
          <TabButton id="tablero" label="Tablero" icon={BanknotesIcon} />
          <TabButton id="rentabilidad" label="Rentabilidad" icon={ArrowTrendingUpIcon} />
          <TabButton id="fijos" label="Gastos Fijos" icon={CalendarDaysIcon} />
          <TabButton id="presupuestos" label="Presupuestos" icon={CalculatorIcon} />
      </div>

      {/* Contenido Dinámico */}
      <div className="min-h-[400px]">
          {activeTab === 'tablero' && (
              <TableroTab 
                movimientos={movimientos} 
                cuentas={cuentas} 
                onRecargar={cargarDatos} 
              />
          )}

          {activeTab === 'rentabilidad' && (
              <RentabilidadTab 
                movimientos={movimientos} 
              />
          )}

          {activeTab === 'fijos' && (
             <GastosFijosTab 
                gastosFijos={gastosFijos} 
                cuentas={cuentas} 
                onOpenModal={() => setModales({...modales, fijo: true})} 
                onRecargar={cargarDatos}
             />
          )}

          {activeTab === 'presupuestos' && (
              <PresupuestosTab
                  presupuestos={presupuestos}
                  movimientos={movimientos}
                  onOpenModal={() => setModales({...modales, presupuesto: true})}
              />
          )}
      </div>

      {/* Modales Globales */}
      <ModalesFinanzas 
          isOpen={modales}
          onClose={(tipo) => setModales({...modales, [tipo]: false})}
          onRecargar={cargarDatos}
          cuentas={cuentas}
      />

    </div>
  );
}