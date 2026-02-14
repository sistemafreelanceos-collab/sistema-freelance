import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // 🟢 Importante
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function useEstadisticas() {
    const { currentWorkspace } = useWorkspace();
    const queryClient = useQueryClient();
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

    // 1. QUERY PRINCIPAL (Caché + No Refresco)
    const { data, isLoading } = useQuery({
        queryKey: ['estadisticas', currentWorkspace?.id, anioFiltro],
        enabled: !!currentWorkspace?.id,
        refetchOnWindowFocus: false, // 🟢 Evita que se recargue al cambiar de ventana
        staleTime: 1000 * 60 * 5,    // 🟢 Mantiene los datos frescos por 5 minutos
        queryFn: async () => {
            if (!currentWorkspace) throw new Error("No workspace");
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user.id;

            // A. Cargar Meta
            const { data: profile } = await supabase.from("profiles").select("meta_mensual").eq("id", uid).single();
            const meta = profile?.meta_mensual || 0;

            // B. Cargar Movimientos (CON CLIENTES)
            const startYear = `${anioFiltro}-01-01`;
            const endYear = `${anioFiltro}-12-31`;

            // 🟢 CORRECCIÓN: Traemos la relación con clientes para saber el nombre
            const { data: movs } = await supabase.from("movimientos")
                .select("*, clientes(nombre, empresa)")
                .eq("workspace_id", currentWorkspace.id)
                .gte("fecha", startYear)
                .lte("fecha", endYear);

            // Estructuras iniciales
            const meses = Array(12).fill(0).map((_, i) => ({
                mes: new Date(0, i).toLocaleString('es-ES', { month: 'short' }),
                ingresos: 0, gastos: 0, utilidad: 0, horas: 0
            }));

            let totalIngresos = 0;
            let totalGastos = 0;
            const catGastos: Record<string, number> = {};
            const ingresosPorCliente: Record<string, number> = {};

            // Procesar Movimientos
            (movs || []).forEach((m: any) => {
                const d = new Date(m.fecha);
                // Ajuste de zona horaria simple para evitar desfase de mes
                const mesIndex = d.getUTCMonth();
                const monto = Number(m.monto);

                if (m.tipo === 'ingreso') {
                    if (meses[mesIndex]) meses[mesIndex].ingresos += monto;
                    totalIngresos += monto;

                    // Lógica Riesgo Clientes (Solidez del Negocio)
                    // 🟢 AHORA SÍ USAMOS EL NOMBRE REAL
                    const nombreCliente = m.clientes?.nombre || m.clientes?.empresa || "Otros / Varios";
                    ingresosPorCliente[nombreCliente] = (ingresosPorCliente[nombreCliente] || 0) + monto;

                } else {
                    if (meses[mesIndex]) meses[mesIndex].gastos += monto;
                    totalGastos += monto;
                    const cat = m.categoria || "Varios";
                    catGastos[cat] = (catGastos[cat] || 0) + monto;
                }
            });

            // C. Datos Complementarios (Proyectos y Sesiones)
            // Intentamos cargar sesiones para valor hora (si falla no rompemos)
            let sesiones: any[] = [];
            const { data: s } = await supabase.from("sesiones_focus")
                .select("duracion_minutos, proyecto_id, created_at")
                .eq("workspace_id", currentWorkspace.id)
                .gte("created_at", startYear).lte("created_at", endYear)
                .maybeSingle(); // O .select() normal, usamos catch implícito de supabase si no existe tabla

            // Nota: Si la tabla sesiones_focus no existe o está vacía, esto simplemente devuelve null/vacío
            // Para asegurar array:
            const { data: sesionesData } = await supabase.from("sesiones_focus")
                .select("duracion_minutos, proyecto_id, created_at")
                .eq("workspace_id", currentWorkspace.id)
                .gte("created_at", startYear).lte("created_at", endYear);

            if (sesionesData) sesiones = sesionesData;

            // Procesar Horas
            sesiones.forEach((s: any) => {
                const d = new Date(s.created_at);
                const mesIndex = d.getMonth();
                if (meses[mesIndex]) meses[mesIndex].horas += (s.duracion_minutos / 60);
            });

            // Calcular Utilidad Mensual
            meses.forEach(m => m.utilidad = m.ingresos - m.gastos);

            // Preparar KPIs
            const kpisCalc = {
                ingresos: totalIngresos,
                gastos: totalGastos,
                utilidad: totalIngresos - totalGastos,
                margen: totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0
            };

            // Preparar Gráfica Categorías
            const listaCat = Object.entries(catGastos)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);

            // Preparar Riesgo Clientes
            const dataRiesgo = Object.entries(ingresosPorCliente)
                .map(([name, value]) => ({
                    name,
                    value,
                    porcentaje: totalIngresos > 0 ? (value / totalIngresos) * 100 : 0
                }))
                .sort((a, b) => b.value - a.value);

            const dominante = dataRiesgo.length > 0 && dataRiesgo[0].porcentaje > 50 ? dataRiesgo[0] : null;

            // Preparar Valor Hora (Simplificado)
            const { data: proyectos } = await supabase.from("proyectos")
                .select("id, cliente_id, clientes(nombre)")
                .eq("workspace_id", currentWorkspace.id);

            const horasPorProyecto: Record<string, number> = {};
            sesiones.forEach((s: any) => { if (s.proyecto_id) horasPorProyecto[s.proyecto_id] = (horasPorProyecto[s.proyecto_id] || 0) + (s.duracion_minutos / 60); });

            const ingresosPorProyecto: Record<string, number> = {};
            (movs || []).forEach((m: any) => { if (m.proyecto_id && m.tipo === 'ingreso') ingresosPorProyecto[m.proyecto_id] = (ingresosPorProyecto[m.proyecto_id] || 0) + m.monto; });

            const tablaValorHora = proyectos?.map((p: any) => {
                const horas = horasPorProyecto[p.id] || 0;
                const ingresos = ingresosPorProyecto[p.id] || 0;
                return {
                    nombre: p.clientes ? p.clientes.nombre : "Proyecto Sin Cliente",
                    horas: horas,
                    ingresos: ingresos,
                    tasa: horas > 0 ? ingresos / horas : 0
                };
            }).filter(p => p.horas > 0 || p.ingresos > 0).sort((a, b) => b.tasa - a.tasa) || [];

            const totalHorasProy = tablaValorHora.reduce((acc, curr) => acc + curr.horas, 0);
            const totalIngresosProy = tablaValorHora.reduce((acc, curr) => acc + curr.ingresos, 0);
            const valHoraProm = totalHorasProy > 0 ? totalIngresosProy / totalHorasProy : 0;

            // Preparar Tasa Cierre
            const { data: clientes } = await supabase.from("clientes").select("estado").eq("workspace_id", currentWorkspace.id);
            const totalLeads = clientes?.length || 0;
            const clientesActivos = clientes?.filter((c: any) => c.estado === 'activo').length || 0;
            const cierreCalc = {
                total: totalLeads,
                convertidos: clientesActivos,
                tasa: totalLeads > 0 ? (clientesActivos / totalLeads) * 100 : 0
            };

            // Ingresos Mes Actual (Para el velocímetro)
            const hoy = new Date();
            const mesActualIndex = hoy.getMonth();
            const ingresosEsteMes = meses[mesActualIndex].ingresos;
            const progreso = meta > 0 ? Math.min((ingresosEsteMes / meta) * 100, 100) : 0;

            return {
                dataMensual: meses,
                dataCategorias: listaCat,
                kpis: kpisCalc,
                metaMensual: meta,
                ingresosMesActual: ingresosEsteMes,
                progresoMeta: progreso,
                riesgoClientes: dataRiesgo,
                clienteDominante: dominante,
                valorHoraReal: tablaValorHora,
                valorHoraPromedio: valHoraProm,
                tasaCierre: cierreCalc
            };
        }
    });

    // Mutation para guardar meta
    const guardarMetaMutation = useMutation({
        mutationFn: async (val: number) => {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from("profiles").update({ meta_mensual: val }).eq("id", session?.user.id);
        },
        onSuccess: () => {
            toast.success("Meta actualizada");
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
        }
    });

    const guardarMeta = async (val: number) => {
        if (!isNaN(val) && val >= 0) {
            await guardarMetaMutation.mutateAsync(val);
            return true;
        }
        return false;
    };

    // Valores por defecto para evitar errores de renderizado mientras carga
    const def = {
        dataMensual: [], dataCategorias: [], kpis: { ingresos: 0, gastos: 0, utilidad: 0, margen: 0 },
        metaMensual: 0, ingresosMesActual: 0, progresoMeta: 0, riesgoClientes: [],
        clienteDominante: null, valorHoraReal: [], valorHoraPromedio: 0,
        tasaCierre: { tasa: 0, total: 0, convertidos: 0 }
    };

    const result = data || def;

    return {
        loading: isLoading,
        anioFiltro, setAnioFiltro,
        ...result, // Esparce todas las propiedades calculadas (dataMensual, kpis, etc.)
        guardarMeta
    };
}
