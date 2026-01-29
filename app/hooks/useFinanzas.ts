import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Movimiento, GastoFijo, Presupuesto, ConfigFinanzas, Cuenta } from "../../types";
import { toast } from "sonner";

export function useFinanzas() {
    const [loading, setLoading] = useState(true);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [config, setConfig] = useState<ConfigFinanzas>({ porcentaje_ahorro: 10 });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;

            const [movs, fijos, presus, conf, ctas] = await Promise.all([
                supabase.from("movimientos").select("*").eq("owner_id", uid).limit(2000),
                supabase.from("gastos_fijos").select("*").eq("owner_id", uid).eq("activo", true),
                supabase.from("presupuestos").select("*").eq("owner_id", uid),
                supabase.from("config_finanzas").select("*").eq("owner_id", uid).single(),
                supabase.from("cuentas").select("id, nombre").eq("owner_id", uid)
            ]);

            if (movs.data && ctas.data) {
                const mapCuentas = new Map(ctas.data.map((c: any) => [c.id, c.nombre]));
                let lista = movs.data.map((m: any) => ({ ...m, cuenta_nombre: m.cuenta_id ? mapCuentas.get(m.cuenta_id) : '---' }));
                lista.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                setMovimientos(lista as any);
            }
            if (fijos.data) setGastosFijos(fijos.data as any);
            if (presus.data) setPresupuestos(presus.data as any);
            if (ctas.data) setCuentas(ctas.data as any);
            if (conf.data) setConfig(conf.data as any);
            else await supabase.from("config_finanzas").insert({ owner_id: uid, porcentaje_ahorro: 10 });

        } catch (error) {
            toast.error("Error cargando datos financieros");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const guardarMovimiento = async (data: Partial<Movimiento>, id?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (id) await supabase.from("movimientos").update(data).eq("id", id);
        else await supabase.from("movimientos").insert({ owner_id: session?.user.id, ...data });

        toast.success(id ? "Movimiento actualizado" : "Movimiento registrado");
        await cargarDatos();
    };

    const guardarPresupuesto = async (data: Partial<Presupuesto>, id?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (id) await supabase.from("presupuestos").update(data).eq("id", id);
        else await supabase.from("presupuestos").insert({ owner_id: session?.user.id, ...data });

        toast.success("Presupuesto guardado");
        await cargarDatos();
    };

    const guardarGastoFijo = async (data: any, id?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const { fecha_inicio, ...datosGuardar } = data; // Sanitizamos

        if (id) {
            const { error } = await supabase.from("gastos_fijos").update(datosGuardar).eq("id", id);
            if (error) toast.error("Error al actualizar: " + error.message);
            else toast.success("Gasto recurrente actualizado");
        } else {
            const { error } = await supabase.from("gastos_fijos").insert({ owner_id: session?.user.id, ...datosGuardar, activo: true });
            if (error) toast.error("Error al crear: " + error.message);
            else toast.success("Gasto recurrente creado");
        }
        await cargarDatos();
    };

    const eliminarItem = async (id: string, tipo: 'movimiento' | 'presupuesto' | 'gasto_fijo') => {
        let tabla = tipo === 'movimiento' ? 'movimientos' : tipo === 'presupuesto' ? 'presupuestos' : 'gastos_fijos';
        const { error } = await supabase.from(tabla).delete().eq("id", id);
        if (error) toast.error("Error al eliminar: " + error.message);
        else {
            toast.success("Eliminado correctamente");
            await cargarDatos();
        }
    };

    const updateConfig = async (key: string, val: number) => {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("config_finanzas").update({ [key]: val }).eq("owner_id", session?.user.id);
        setConfig({ ...config, [key]: val });
    };

    return {
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
    };
}
