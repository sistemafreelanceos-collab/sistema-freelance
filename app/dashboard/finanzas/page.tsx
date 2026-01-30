"use client";

import { useState } from "react";
import { useFinanzas } from "../../hooks/useFinanzas";
import { Movimiento, GastoFijo, Presupuesto } from "../../../types";
import { WalletIcon, PresentationChartLineIcon, ChartBarIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import SkeletonDashboard from "../components/SkeletonDashboard";

// Componentes
import TableroTab from "./components/TableroTab";
import PresupuestosTab from "./components/PresupuestosTab";
import GastosFijosTab from "./components/GastosFijosTab";
import { ModalMovimiento, ModalPresupuesto, ModalGastoFijo, ModalConfirmacion, ModalDetalleGasto } from "./components/ModalesFinanzas";
import { Button } from "@/app/components/ui/Button";

import { useOnboarding } from "@/app/providers/OnboardingProvider";
import { useEffect } from "react";

export default function FinanzasPage() {
  const { startModuleTour } = useOnboarding();

  useEffect(() => {
    startModuleTour('finanzas');
  }, []);

  const [activeTab, setActiveTab] = useState<'tablero' | 'presupuestos' | 'fijos'>('tablero');

  const {
    loading,
    movimientos,
    gastosFijos,
    presupuestos,
    cuentas,
    config,
    cargarDatos,
    guardarMovimiento,
    guardarPresupuesto,
    guardarGastoFijo,
    eliminarItem,
    updateConfig
  } = useFinanzas();

  // Estados para modales
  const [modales, setModales] = useState({
    mov: false,
    presu: false,
    fijo: false,
    detalle: false,
    delete: false
  });

  // Estados para edición/selección
  const [movimientoEditar, setMovimientoEditar] = useState<Movimiento | null>(null);
  const [presupuestoEditar, setPresupuestoEditar] = useState<Presupuesto | null>(null);
  const [gastoFijoEditar, setGastoFijoEditar] = useState<GastoFijo | null>(null);
  const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoFijo | null>(null);

  // Handlers
  const handleSaveMovimiento = async (data: any) => {
    await guardarMovimiento(data, movimientoEditar?.id);
    setModales({ ...modales, mov: false });
    setMovimientoEditar(null);
  };

  const handleSavePresupuesto = async (data: any) => {
    await guardarPresupuesto(data, presupuestoEditar?.id);
    setModales({ ...modales, presu: false });
    setPresupuestoEditar(null);
  };

  const handleSaveGastoFijo = async (data: any) => {
    await guardarGastoFijo(data, gastoFijoEditar?.id);
    setModales({ ...modales, fijo: false });
    setGastoFijoEditar(null);
  };

  const handleSolicitarEliminacion = (id: string, tipo: 'movimiento' | 'presupuesto' | 'gasto_fijo') => {
    // Aquí podríamos guardar el ID/Tipo en un estado temporal para el modal de confirmación
    // Por simplicidad, usaremos confirmación directa o adaptaremos el modal existente
    // Pero el código de abajo usa handleConfirmarEliminacion, así que necesitamos estado para eso.
    setPendingDelete({ id, tipo });
    setModales({ ...modales, delete: true });
  };

  const [pendingDelete, setPendingDelete] = useState<{ id: string, tipo: 'movimiento' | 'presupuesto' | 'gasto_fijo' } | null>(null);

  const handleConfirmarEliminacion = async () => {
    if (pendingDelete) {
      await eliminarItem(pendingDelete.id, pendingDelete.tipo);
      setModales({ ...modales, delete: false });
      setPendingDelete(null);
    }
  };

  // ... (rest of code)

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-6">
      <div id="tour-finance-overview" className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
        <div><h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2"><WalletIcon className="w-8 h-8 text-indigo-500" /> CFO Virtual</h1><p className="text-gray-400 text-sm">Control total de flujo de caja.</p></div>
        <div id="tour-finance-tabs" className="flex bg-[#161B22] rounded-xl p-1 border border-white/10 overflow-x-auto w-full lg:w-auto">
          {[
            { id: "tablero", label: "Tablero", icon: PresentationChartLineIcon },
            { id: "presupuestos", label: "Semáforo", icon: ChartBarIcon },
            { id: "fijos", label: "Recurrentes", icon: CreditCardIcon },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'tablero' | 'presupuestos' | 'fijos')}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              className={`whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'text-gray-400'}`}
            >
              <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === 'tablero' && (
        <TableroTab
          movimientos={movimientos}
          gastosFijos={gastosFijos}
          config={config}
          presupuestos={presupuestos}
          saldoActual={movimientos.reduce((acc, m) => acc + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0)}
          onUpdateConfig={updateConfig}
          onOpenModal={() => { setMovimientoEditar(null); setModales({ ...modales, mov: true }); }}
          onEdit={(m) => { setMovimientoEditar(m); setModales({ ...modales, mov: true }); }}
          onDelete={(id) => handleSolicitarEliminacion(id, 'movimiento')}
        />
      )}

      {activeTab === 'presupuestos' && (
        <PresupuestosTab
          movimientos={movimientos}
          presupuestos={presupuestos}
          onOpenModal={() => { setPresupuestoEditar(null); setModales({ ...modales, presu: true }); }}
          onEdit={(p) => { setPresupuestoEditar(p); setModales({ ...modales, presu: true }); }}
          onDelete={(id) => handleSolicitarEliminacion(id, 'presupuesto')}
        />
      )}

      {activeTab === 'fijos' && (
        <GastosFijosTab
          gastosFijos={gastosFijos}
          cuentas={cuentas}
          movimientos={movimientos}
          onOpenModal={() => { setGastoFijoEditar(null); setModales({ ...modales, fijo: true }); }}
          onRecargar={cargarDatos}
          onEdit={(g) => { setGastoFijoEditar(g); setModales({ ...modales, fijo: true }); }}
          onDelete={(id) => handleSolicitarEliminacion(id, 'gasto_fijo')}
          onSelect={(g) => { setGastoSeleccionado(g); setModales({ ...modales, detalle: true }); }}
        />
      )}

      <ModalMovimiento isOpen={modales.mov} onClose={() => { setModales({ ...modales, mov: false }); setMovimientoEditar(null); }} onSave={handleSaveMovimiento} cuentas={cuentas} movimientoEditar={movimientoEditar} />
      <ModalPresupuesto isOpen={modales.presu} onClose={() => { setModales({ ...modales, presu: false }); setPresupuestoEditar(null); }} onSave={handleSavePresupuesto} presupuestoEditar={presupuestoEditar} />
      <ModalGastoFijo isOpen={modales.fijo} onClose={() => { setModales({ ...modales, fijo: false }); setGastoFijoEditar(null); }} onSave={handleSaveGastoFijo} gastoEditar={gastoFijoEditar} />

      <ModalDetalleGasto
        isOpen={modales.detalle}
        onClose={() => setModales({ ...modales, detalle: false })}
        gasto={gastoSeleccionado}
        movimientos={movimientos}
      />

      <ModalConfirmacion
        isOpen={modales.delete}
        onClose={() => setModales({ ...modales, delete: false })}
        onConfirm={handleConfirmarEliminacion}
        titulo="¿Eliminar Registro?"
        mensaje="Esta acción es irreversible."
      />
    </div>
  );
}