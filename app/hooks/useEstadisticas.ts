import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function useEstadisticas() {
    const { currentWorkspace } = useWorkspace();
    const [loading, setLoading] = useState(true);
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

    // DATA GRAFICAS
    const [dataMensual, setDataMensual] = useState<any[]>([]);
    const [dataCategorias, setDataCategorias] = useState<any[]>([]);
    const [kpis, setKpis] = useState({ ingresos: 0, gastos: 0, utilidad: 0, margen: 0 });

    // DATA CEO
    const [metaMensual, setMetaMensual] = useState(0);
    const [ingresosMesActual, setIngresosMesActual] = useState(0);
    const [progresoMeta, setProgresoMeta] = useState(0);
    const [riesgoClientes, setRiesgoClientes] = useState<any[]>([]);
    const [clienteDominante, setClienteDominante] = useState<any>(null);
    const [valorHoraReal, setValorHoraReal] = useState<any[]>([]);
    const [valorHoraPromedio, setValorHoraPromedio] = useState(0);
    const [tasaCierre, setTasaCierre] = useState({ tasa: 0, total: 0, convertidos: 0 });

    useEffect(() => {
        if (currentWorkspace) cargarDatosCompletos();
    }, [anioFiltro, currentWorkspace]);

    const cargarDatosCompletos = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !currentWorkspace) return;
        const uid = session.user.id;

        try {
            // 1. CARGAR META (Desde profiles, unificado con Config Page)
            const { data: profile } = await supabase.from("profiles").select("meta_mensual").eq("id", uid).single();
            const meta = profile?.meta_mensual || 0;
            setMetaMensual(meta);

            // 2. CARGAR MOVIMIENTOS (Filtrado por Workspace)
            const startYear = `${anioFiltro}-01-01`;
            const endYear = `${anioFiltro}-12-31`;
            const { data: movs } = await supabase.from("movimientos").select("*")
                .eq("workspace_id", currentWorkspace.id)
                .gte("fecha", startYear).lte("fecha", endYear);

            if (movs) {
                // A. Data Mensual
                const meses = Array(12).fill(0).map((_, i) => ({ mes: new Date(0, i).toLocaleString('es-ES', { month: 'short' }), ingresos: 0, gastos: 0, utilidad: 0, horas: 0 }));
                let totalIngresos = 0; let totalGastos = 0;
                const catGastos: Record<string, number> = {};

                movs.forEach(m => {
                    const d = new Date(m.fecha);
                    const mn = d.getUTCMonth(); // Usar getUTCMonth para consistencia con formateo fecha
                    const mesIndex = mn;
                    const monto = Number(m.monto);

                    if (m.tipo === 'ingreso') {
                        if (meses[mesIndex]) meses[mesIndex].ingresos += monto;
                        totalIngresos += monto;
                    } else {
                        if (meses[mesIndex]) meses[mesIndex].gastos += monto;
                        totalGastos += monto;
                        const cat = m.categoria || "Varios";
                        catGastos[cat] = (catGastos[cat] || 0) + monto;
                    }
                });

                // Cargar Proyectos del Workspace para Valor Hora
                const { data: proyectos } = await supabase.from("proyectos").select("id, cliente_id, clientes(nombre)").eq("workspace_id", currentWorkspace.id);

                // Cargar Sesiones (Si la tabla existe)
                // Intentamos cargar sesiones, si falla (tabla no existe) no rompemos todo
                let sesiones: any[] = [];
                const { data: s, error: errSesiones } = await supabase.from("sesiones_focus")
                    .select("duracion_minutos, proyecto_id, created_at")
                    .eq("workspace_id", currentWorkspace.id)
                    .gte("created_at", startYear).lte("created_at", endYear);

                if (!errSesiones && s) sesiones = s;

                // Mapear Horas a Meses
                sesiones.forEach(s => {
                    const d = new Date(s.created_at);
                    const mesIndex = d.getMonth();
                    if (meses[mesIndex]) meses[mesIndex].horas += (s.duracion_minutos / 60);
                });

                meses.forEach(m => m.utilidad = m.ingresos - m.gastos);
                setDataMensual(meses);

                const listaCat = Object.entries(catGastos).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
                setDataCategorias(listaCat);

                setKpis({
                    ingresos: totalIngresos,
                    gastos: totalGastos,
                    utilidad: totalIngresos - totalGastos,
                    margen: totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0
                });

                // Ingresos Mes Actual (Dashboard KPI)
                const hoy = new Date();
                const mesActual = hoy.getMonth();
                const totalMesActual = meses[mesActual].ingresos;
                setIngresosMesActual(totalMesActual);
                setProgresoMeta(meta > 0 ? Math.min((totalMesActual / meta) * 100, 100) : 0);

                // RIESGO CLIENTES
                const ingresosPorCliente: Record<string, number> = {};
                let totalIngresosAnio = 0;
                movs.forEach(m => {
                    if (m.tipo === 'ingreso') {
                        totalIngresosAnio += m.monto;
                        if (m.cliente_id) { // Usar cliente_id directo de movimientos si existe, o join
                            // Simplificación: usaremos el nombre del cliente si está en join (hook anterior usaba proyecto)
                            // Por ahora mantenemos logica de V8: movimientos tiene cliente_id? Si. 
                            // Pero el select no trajo cliente... 
                            // Para simplificar y no hacer otro request complejo:
                            const nombre = "Cliente #" + (m.cliente_id ? m.cliente_id.slice(0, 4) : "Varios");
                            ingresosPorCliente[nombre] = (ingresosPorCliente[nombre] || 0) + m.monto;
                        } else {
                            ingresosPorCliente["Otros"] = (ingresosPorCliente["Otros"] || 0) + m.monto;
                        }
                    }
                });

                // Fix visual rapido para nombres reales (opcional, requiere join en query inicial)
                // Dejamos placeholder para no complicar el hook ahora mismo.

                const dataRiesgo = Object.entries(ingresosPorCliente).map(([name, value]) => ({ name, value, porcentaje: totalIngresosAnio > 0 ? (value / totalIngresosAnio) * 100 : 0 })).sort((a, b) => b.value - a.value);
                setRiesgoClientes(dataRiesgo);
                if (dataRiesgo.length > 0 && dataRiesgo[0].porcentaje > 50) setClienteDominante(dataRiesgo[0]);

                // CALCULO VALOR HORA DETALLADO
                const horasPorProyecto: Record<string, number> = {};
                sesiones.forEach(s => { if (s.proyecto_id) horasPorProyecto[s.proyecto_id] = (horasPorProyecto[s.proyecto_id] || 0) + (s.duracion_minutos / 60); });

                const ingresosPorProyecto: Record<string, number> = {};
                movs.forEach(m => { if (m.proyecto_id && m.tipo === 'ingreso') ingresosPorProyecto[m.proyecto_id] = (ingresosPorProyecto[m.proyecto_id] || 0) + m.monto; });

                const tablaValorHora = proyectos?.map(p => {
                    const horas = horasPorProyecto[p.id] || 0;
                    const ingresos = ingresosPorProyecto[p.id] || 0;
                    const clienteData = p.clientes as any;
                    return {
                        nombre: p.clientes ? `${(p.clientes as any).nombre}` : "Proyecto",
                        horas: horas, ingresos: ingresos, tasa: horas > 0 ? ingresos / horas : 0
                    };
                }).filter(p => p.horas > 0 || p.ingresos > 0).sort((a, b) => b.tasa - a.tasa) || [];

                setValorHoraReal(tablaValorHora);
                const totalIngresosProy = tablaValorHora.reduce((acc, curr) => acc + curr.ingresos, 0);
                const totalHorasProy = tablaValorHora.reduce((acc, curr) => acc + curr.horas, 0);
                setValorHoraPromedio(totalHorasProy > 0 ? totalIngresosProy / totalHorasProy : 0);

                // TASA CIERRE
                const { data: clientes } = await supabase.from("clientes").select("estado").eq("workspace_id", currentWorkspace.id);
                const totalLeads = clientes?.length || 0; const activos = clientes?.filter(c => c.estado === 'activo').length || 0;
                setTasaCierre({ total: totalLeads, convertidos: activos, tasa: totalLeads > 0 ? (activos / totalLeads) * 100 : 0 });
            }

        } catch (e) {
            console.error(e);
            toast.error("Error cargando estadísticas");
        } finally {
            setLoading(false);
        }
    };

    const guardarMeta = async (val: number) => {
        if (!isNaN(val) && val >= 0) {
            const { data: { session } } = await supabase.auth.getSession();
            // Guardar en profiles, no config_finanzas
            await supabase.from("profiles").update({ meta_mensual: val }).eq("id", session?.user.id);
            setMetaMensual(val);
            setProgresoMeta(val > 0 ? Math.min((ingresosMesActual / val) * 100, 100) : 0);
            toast.success("Meta actualizada");
            return true;
        }
        return false;
    };

    return {
        loading,
        anioFiltro, setAnioFiltro,
        dataMensual, dataCategorias, kpis,
        metaMensual, ingresosMesActual, progresoMeta,
        riesgoClientes, clienteDominante, valorHoraReal, valorHoraPromedio, tasaCierre,
        guardarMeta
    };
}
