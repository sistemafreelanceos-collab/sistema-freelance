import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { toast } from 'sonner';
import { Movimiento, GastoFijo, Presupuesto, Cuenta, ConfigFinanzas } from '../../types';
import { useLogger } from './useLogger';

export function useFinanzas() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspace();
    const { logEvent } = useLogger();

    // 1. QUERY PRINCIPAL
    const { data, isLoading, error } = useQuery({
        queryKey: ['finanzas', currentWorkspace?.id],
        enabled: !!currentWorkspace?.id,
        queryFn: async () => {
            if (!currentWorkspace?.id) throw new Error("No workspace selected");

            const wsId = currentWorkspace.id;
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user.id;

            const [movs, fijos, presus, conf, ctas, perfil] = await Promise.all([
                // 🟢 CAMBIO AQUÍ: Ordenamos por 'created_at' para ver lo último que registraste primero
                supabase.from("movimientos")
                    .select("*")
                    .eq("workspace_id", wsId)
                    .order('created_at', { ascending: false }) // Antes era 'fecha'
                    .limit(2000),

                supabase.from("gastos_fijos").select("*").eq("workspace_id", wsId).eq("activo", true),
                supabase.from("presupuestos").select("*").eq("workspace_id", wsId),
                supabase.from("config_finanzas").select("*").eq("owner_id", uid).maybeSingle(),
                supabase.from("cuentas").select("*").eq("owner_id", uid),
                supabase.from("profiles").select("meta_moneda").eq("id", uid).single()
            ]);

            let movimientosProcessed: Movimiento[] = [];
            let cuentasConSaldo: any[] = [];
            if (movs.data && ctas.data) {
                const mapCuentas = new Map(ctas.data.map((c: any) => [c.id, c.nombre]));
                movimientosProcessed = movs.data.map((m: any) => ({
                    ...m,
                    cuenta_nombre: m.cuenta_id ? mapCuentas.get(m.cuenta_id) : '---'
                }));

                cuentasConSaldo = ctas.data.map((cuenta: any) => {
                    const movsCuenta = movimientosProcessed.filter(m => m.cuenta_id === cuenta.id);
                    const saldo = movsCuenta.reduce((acc, mov) => {
                        const monto = Number(mov.monto) || 0;
                        return mov.tipo === "ingreso" ? acc + monto : acc - monto;
                    }, 0);
                    return { ...cuenta, saldo_calculado: saldo };
                });
            } else {
                cuentasConSaldo = ctas.data || [];
            }

            return {
                movimientos: movimientosProcessed,
                gastosFijos: (fijos.data || []) as GastoFijo[],
                presupuestos: (presus.data || []) as Presupuesto[],
                cuentas: cuentasConSaldo as Cuenta[],
                config: { ...conf.data, meta_moneda: perfil.data?.meta_moneda || "USD" }
            };
        }
    });

    // --- MUTATIONS (Ya corregidas en el paso anterior) ---

    const guardarMovimientoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: any, id?: string }) => {
            if (!currentWorkspace?.id) throw new Error("No workspace");

            // Solo enviamos workspace_id
            const payload = { ...data, workspace_id: currentWorkspace.id };

            if (id) {
                const { error } = await supabase.from("movimientos").update(payload).eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("movimientos").insert(payload);
                if (error) throw error;
            }
        },
        onSuccess: (_, vars) => {
            toast.success(vars.id ? "Movimiento actualizado" : "Movimiento registrado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
            queryClient.invalidateQueries({ queryKey: ['cuentas'] });

            const monto = parseFloat(vars.data.monto).toLocaleString();
            const emoji = vars.data.tipo === 'ingreso' ? '💰' : '💸';
            const accion = vars.id ? "Actualizó" : "Registró";

            logEvent(
                'finanzas',
                `${accion} ${vars.data.tipo}: $${monto} (${vars.data.categoria || 'General'})`,
                emoji
            );
        }
    });

    const guardarPresupuestoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: any, id?: string }) => {
            if (!currentWorkspace?.id) throw new Error("No workspace");
            const payload = { ...data, workspace_id: currentWorkspace.id };

            if (id) await supabase.from("presupuestos").update(payload).eq("id", id);
            else await supabase.from("presupuestos").insert(payload);
        },
        onSuccess: () => {
            toast.success("Presupuesto guardado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        }
    });

    const guardarGastoFijoMutation = useMutation({
        mutationFn: async ({ data, id }: { data: any, id?: string }) => {
            if (!currentWorkspace?.id) throw new Error("No workspace");

            const { fecha_inicio, ...resto } = data;
            const payload = { ...resto, workspace_id: currentWorkspace.id };

            if (payload.cuenta_id === "") payload.cuenta_id = null;

            if (id) await supabase.from("gastos_fijos").update(payload).eq("id", id);
            else await supabase.from("gastos_fijos").insert({ ...payload, activo: true });
        },
        onSuccess: () => {
            toast.success("Gasto fijo guardado");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        }
    });

    const eliminarMutation = useMutation({
        mutationFn: async ({ id, tipo }: { id: string, tipo: string }) => {
            let tabla = tipo === 'movimiento' ? 'movimientos' : tipo === 'presupuesto' ? 'presupuestos' : 'gastos_fijos';
            const { error } = await supabase.from(tabla).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Eliminado correctamente");
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
            queryClient.invalidateQueries({ queryKey: ['cuentas'] });
        }
    });

    const updateConfigMutation = useMutation({
        mutationFn: async ({ key, val }: { key: string, val: number }) => {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from("config_finanzas").update({ [key]: val }).eq("owner_id", session?.user.id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finanzas'] })
    });

    return {
        loading: isLoading,
        error,
        movimientos: data?.movimientos || [],
        gastosFijos: data?.gastosFijos || [],
        presupuestos: data?.presupuestos || [],
        cuentas: data?.cuentas || [],
        config: data?.config || { porcentaje_ahorro: 10, meta_moneda: "USD" },

        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['finanzas'] }),
        guardarMovimiento: (d: any, id?: string) => guardarMovimientoMutation.mutateAsync({ data: d, id }),
        guardarPresupuesto: (d: any, id?: string) => guardarPresupuestoMutation.mutateAsync({ data: d, id }),
        guardarGastoFijo: (d: any, id?: string) => guardarGastoFijoMutation.mutateAsync({ data: d, id }),
        eliminarItem: (id: string, tipo: any) => eliminarMutation.mutateAsync({ id, tipo }),
        updateConfig: (key: string, val: number) => updateConfigMutation.mutateAsync({ key, val })
    };
}
