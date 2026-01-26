"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  WalletIcon, 
  PresentationChartLineIcon, 
  ChartBarIcon, 
  CreditCardIcon
} from "@heroicons/react/24/outline";
import { Movimiento, GastoFijo, Presupuesto, ConfigFinanzas } from "./types";

// Importamos tus componentes
import TableroTab from "./components/TableroTab";
import PresupuestosTab from "./components/PresupuestosTab";
import GastosFijosTab from "./components/GastosFijosTab";
import { ModalMovimiento, ModalPresupuesto, ModalGastoFijo } from "./components/ModalesFinanzas";

export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState("tablero");
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE DATOS ---
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [config, setConfig] = useState<ConfigFinanzas>({ porcentaje_ahorro: 10 });

  // --- ESTADOS DE MODALES ---
  const [modales, setModales] = useState({ mov: false, fijo: false, presu: false });

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // Cargamos TODO
    const [movs, fijos, presus, conf, ctas] = await Promise.all([
      supabase.from("movimientos").select("*").eq("owner_id", uid).limit(2000), 
      supabase.from("gastos_fijos").select("*").eq("owner_id", uid).eq("activo", true),
      supabase.from("presupuestos").select("*").eq("owner_id", uid),
      supabase.from("config_finanzas").select("*").eq("owner_id", uid).single(),
      supabase.from("cuentas").select("id, nombre").eq("owner_id", uid)
    ]);

    // Procesamos Movimientos
    if (movs.data && ctas.data) {
        const mapCuentas = new Map(ctas.data.map((c: any) => [c.id, c.nombre]));
        
        let listaOrdenada = movs.data.map((m: any) => ({
            ...m,
            cuenta_nombre: m.cuenta_id ? mapCuentas.get(m.cuenta_id) : '---'
        }));

        // Ordenamiento: Fecha > Hora
        listaOrdenada.sort((a: any, b: any) => {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();
            if (fechaA !== fechaB) return fechaB - fechaA;
            const horaA = new Date(a.created_at || 0).getTime();
            const horaB = new Date(b.created_at || 0).getTime();
            return horaB - horaA;
        });

        setMovimientos(listaOrdenada as any);
    }

    if (fijos.data) setGastosFijos(fijos.data as any);
    if (presus.data) setPresupuestos(presus.data as any);
    if (ctas.data) setCuentas(ctas.data as any);
    
    if (conf.data) {
        setConfig(conf.data as any);
    } else {
        await supabase.from("config_finanzas").insert({ owner_id: uid, porcentaje_ahorro: 10 });
    }

    setLoading(false);
  };

  // --- GUARDAR ---
  const handleSave = async (tabla: string, data: any, modalKey: keyof typeof modales) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from(tabla).insert({ 
          owner_id: session?.user.id, 
          ...data 
      });

      if (error) {
          alert("Error: " + error.message);
      } else {
          await cargarDatos(); 
          setModales({ ...modales, [modalKey]: false }); 
      }
  };

  const handleUpdateConfig = async (key: string, val: number) => {
      setConfig({ ...config, [key]: val }); 
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("config_finanzas").update({ [key]: val }).eq("owner_id", session?.user.id);
  };

  const saldoTotalActual = movimientos.reduce((acc, m) => acc + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);

  if (loading) return <div className="p-10 text-gray-400 animate-pulse">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                <WalletIcon className="w-8 h-8 text-indigo-500" /> 
                CFO Virtual
            </h1>
            <p className="text-gray-400 text-sm">Control total de flujo de caja.</p>
        </div>
        
        {/* TABS */}
        <div className="flex bg-[#161B22] rounded-xl p-1 border border-white/10 overflow-x-auto w-full lg:w-auto">
            {[
                { id: "tablero", label: "Tablero", icon: PresentationChartLineIcon },
                { id: "presupuestos", label: "Semáforo", icon: ChartBarIcon },
                { id: "fijos", label: "Recurrentes", icon: CreditCardIcon },
            ].map((tab) => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* VISTAS */}
      {activeTab === 'tablero' && (
        <TableroTab 
            movimientos={movimientos} 
            gastosFijos={gastosFijos} 
            config={config} 
            saldoActual={saldoTotalActual}
            onUpdateConfig={handleUpdateConfig}
            onOpenModal={() => setModales({ ...modales, mov: true })}
        />
      )}

      {activeTab === 'presupuestos' && (
        <PresupuestosTab 
            movimientos={movimientos} 
            presupuestos={presupuestos} 
            onOpenModal={() => setModales({ ...modales, presu: true })} 
        />
      )}
      
      {activeTab === 'fijos' && (
         <GastosFijosTab 
            gastosFijos={gastosFijos} 
            // movimientos={movimientos}  <--- ¡LÍNEA ELIMINADA!
            cuentas={cuentas} 
            onOpenModal={() => setModales({...modales, fijo: true})} 
            onRecargar={cargarDatos}
         />
      )}

      {/* --- MODALES --- */}
      
      <ModalMovimiento 
        isOpen={modales.mov} 
        onClose={() => setModales({ ...modales, mov: false })} 
        onSave={(d: any) => handleSave("movimientos", d, "mov")} 
        cuentas={cuentas} 
      />

      <ModalPresupuesto 
        isOpen={modales.presu} 
        onClose={() => setModales({ ...modales, presu: false })} 
        onSave={(d: any) => handleSave("presupuestos", d, "presu")} 
      />

      <ModalGastoFijo 
        isOpen={modales.fijo} 
        onClose={() => setModales({ ...modales, fijo: false })} 
        onSave={(d: any) => handleSave("gastos_fijos", d, "fijo")} 
      />

    </div>
  );
}