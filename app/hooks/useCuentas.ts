import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { Cuenta } from '../../types';
import { toast } from 'sonner';

export function useCuentas() {
    const { currentWorkspace } = useWorkspace();
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Solo cargamos si hay workspace
        if (currentWorkspace?.id) {
            cargarCuentasYSaldo();
        } else {
            setLoading(false);
            setCuentas([]); // Limpiar si no hay workspace
        }
    }, [currentWorkspace?.id]); // Escuchamos cambios en el ID

    const cargarCuentasYSaldo = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !currentWorkspace?.id) return;

            const uid = session.user.id;
            const wsId = currentWorkspace.id;

            // 1. Traer las Cuentas (Bancos) - Estas siguen siendo del usuario (globales)
            const { data: dataCuentas, error } = await supabase
                .from("cuentas")
                .select("*")
                .eq("owner_id", uid)
                .order("is_principal", { ascending: false });

            if (error) throw error;

            // 2. Traer Movimientos (SOLO de esta empresa)
            const { data: dataMovimientos } = await supabase
                .from("movimientos")
                .select("cuenta_id, tipo, monto")
                .eq("workspace_id", wsId); // <--- FILTRO CRÍTICO

            // 3. Calcular Saldo Virtual
            // (Cuánto dinero de esta empresa hay en esa cuenta)
            const cuentasCalculadas = (dataCuentas || []).map((cuenta: any) => {
                const movsCuenta = (dataMovimientos || []).filter((m: any) => m.cuenta_id === cuenta.id);

                const saldo = movsCuenta.reduce((acc: number, mov: any) => {
                    const monto = Number(mov.monto) || 0;
                    return mov.tipo === "ingreso" ? acc + monto : acc - monto;
                }, 0);

                return { ...cuenta, saldo_calculado: saldo };
            });

            setCuentas(cuentasCalculadas);

        } catch (error) {
            console.error(error);
            toast.error("Error cargando cuentas");
        } finally {
            setLoading(false);
        }
    };

    // Funciones básicas (Guardar/Eliminar)
    const guardarCuenta = async (nombre: string, tipo: string, moneda: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase.from("cuentas").insert({
            nombre, tipo, moneda, owner_id: session.user.id
            // No añadimos workspace_id a la cuenta en sí, porque es un recurso compartido
        });

        if (!error) {
            toast.success("Cuenta creada");
            cargarCuentasYSaldo();
        } else {
            toast.error("Error al crear cuenta");
        }
    };

    const eliminarCuenta = async (id: string) => {
        const { error } = await supabase.from("cuentas").delete().eq("id", id);
        if (!error) {
            toast.success("Cuenta eliminada");
            cargarCuentasYSaldo();
        } else {
            toast.error("Error al eliminar cuenta");
        }
    };

    const hacerPrincipal = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Quitar principal a todas (del usuario)
        await supabase.from("cuentas").update({ is_principal: false }).eq("owner_id", session.user.id);

        // 2. Asignar nueva principal
        const { error } = await supabase.from("cuentas").update({ is_principal: true }).eq("id", id);

        if (!error) {
            toast.success("Cuenta principal actualizada");
            cargarCuentasYSaldo();
        } else {
            toast.error("Error al actualizar");
        }
    };

    return {
        cuentas,
        loading,
        cargarCuentasYSaldo,
        guardarCuenta,
        eliminarCuenta
    };
}
