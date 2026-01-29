import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Movimiento, GastoFijo, Presupuesto, ConfigFinanzas, Cuenta } from "../../types";
import { toast } from "sonner";

export function useFinanzas() {
    const queryClient = useQueryClient();

    // 1. QUERY PRINCIPAL (Carga todo en paralelo y devuelve un objeto unificado)
    const { data, isLoading, error } = useQuery({
        queryKey: ['finanzas'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");
            const uid = session.user.id;

            const [movs, fijos, presus, conf, ctas, perfil] = await Promise.all([
                supabase.from("movimientos").select("*").eq("owner_id", uid).limit(2000),
                supabase.from("gastos_fijos").select("*").eq("owner_id", uid).eq("activo", true),
                supabase.from("presupuestos").select("*").eq("owner_id", uid),
                supabase.from("config_finanzas").select("*").eq("owner_id", uid).single(),
                supabase.from("cuentas").select("id, nombre").eq("owner_id", uid),
                supabase.from("profiles").select("meta_moneda").eq("id", uid).single()
            ]);

            // Procesar Movimientos
            let movimientosProcessed: Movimiento[] = [];
            if (movs.data && ctas.data) {
                const mapCuentas = new Map(ctas.data.map((c: any) => [c.id, c.nombre]));
                movimientosProcessed = movs.data.map((m: any) => ({
                    ...m,
                    cuenta_nombre: m.cuenta_id ? mapCuentas.get(m.cuenta_id) : '---'
                }));
                movimientosProcessed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            }

            // Procesar Config
            const baseConfig = conf.data || { owner_id: uid, porcentaje_ahorro: 10 };
            // Si no existe, lo creamos (side-effect en fetcher, aceptable aquí para init)
            if (!conf.data) await supabase.from("config_finanzas").insert(baseConfig);

            const configFull = {
                ...baseConfig,
                meta_moneda: perfil.data?.meta_moneda || "USD"
            };

            return {
                movimientos: movimientosProcessed,
                gastosFijos: (fijos.data || []) as GastoFijo[],
                presupuestos: (presus.data || []) as Presupuesto[],
                cuentas: (ctas.data || []) as Cuenta[],
                config: configFull as ConfigFinanzas & { meta_moneda?: string }
            };
        }
    });

    // 2. MUTACIONES
    const guardarMovimientoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: Partial<Movimiento>, id?: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (id) await supabase.from("movimientos").update(data).eq("id", id);
            else await supabase.from("movimientos").insert({ owner_id: session?.user.id, ...data });
        },
        onSuccess: (_, variables) => {
            toast.success(variables.id ? "Movimiento actualizado" : "Movimiento registrado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        },
        onError: (err) => toast.error("Error: " + err.message)
    });

    const guardarPresupuestoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: Partial<Presupuesto>, id?: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (id) await supabase.from("presupuestos").update(data).eq("id", id);
            else await supabase.from("presupuestos").insert({ owner_id: session?.user.id, ...data });
        },
        onSuccess: () => {
            toast.success("Presupuesto guardado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        }
    });

    const guardarGastoFijoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: any, id?: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const { fecha_inicio, ...datosGuardar } = data;
            if (id) {
                const { error } = await supabase.from("gastos_fijos").update(datosGuardar).eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("gastos_fijos").insert({ owner_id: session?.user.id, ...datosGuardar, activo: true });
                if (error) throw error;
            }
        },
        onSuccess: (_, vars) => {
            toast.success(vars.id ? "Gasto recurrente actualizado" : "Gasto recurrente creado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        },
        onError: (err) => toast.error("Error: " + err.message)
    });

    const eliminarMutation = useMutation({
        mutationFn: async ({ id, tipo }: { id: string, tipo: 'movimiento' | 'presupuesto' | 'gasto_fijo' }) => {
            let tabla = tipo === 'movimiento' ? 'movimientos' : tipo === 'presupuesto' ? 'presupuestos' : 'gastos_fijos';
            const { error } = await supabase.from(tabla).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Eliminado correctamente");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        },
        onError: (err) => toast.error("Error al eliminar: " + err.message)
    });

    const updateConfigMutation = useMutation({
        mutationFn: async ({ key, val }: { key: string, val: number }) => {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from("config_finanzas").update({ [key]: val }).eq("owner_id", session?.user.id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finanzas'] })
    });

    // 3. EXPORTS (Misma interfaz pública para no romper componentes)
    return {
        loading: isLoading,
        movimientos: data?.movimientos || [],
        gastosFijos: data?.gastosFijos || [],
        presupuestos: data?.presupuestos || [],
        cuentas: data?.cuentas || [],
        config: data?.config || { porcentaje_ahorro: 10, meta_moneda: "USD" },
        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['finanzas'] }), // Alias para compatibilidad
        guardarMovimiento: (d: Partial<Movimiento>, id?: string) => guardarMovimientoMutation.mutateAsync({ data: d, id }),
        guardarPresupuesto: (d: Partial<Presupuesto>, id?: string) => guardarPresupuestoMutation.mutateAsync({ data: d, id }),
        guardarGastoFijo: (d: any, id?: string) => guardarGastoFijoMutation.mutateAsync({ data: d, id }),
        eliminarItem: (id: string, tipo: 'movimiento' | 'presupuesto' | 'gasto_fijo') => eliminarMutation.mutateAsync({ id, tipo }),
        updateConfig: (key: string, val: number) => updateConfigMutation.mutateAsync({ key, val })
    };
}
