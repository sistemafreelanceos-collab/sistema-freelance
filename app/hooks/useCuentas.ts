import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Cuenta } from "../../types";
import { toast } from "sonner";

type Movimiento = {
    monto: number;
    tipo: "ingreso" | "egreso";
    cuenta_id: string;
};

export function useCuentas() {
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarCuentasYSaldo();
    }, []);

    const cargarCuentasYSaldo = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: dataCuentas, error: errorCuentas } = await supabase
            .from("cuentas")
            .select("*")
            .eq("owner_id", session.user.id)
            .order("is_principal", { ascending: false });

        if (errorCuentas) {
            toast.error("Error cargando cuentas");
            setLoading(false);
            return;
        }

        const { data: dataMovimientos, error: errorMov } = await supabase
            .from("movimientos")
            .select("cuenta_id, tipo, monto")
            .eq("owner_id", session.user.id);

        if (errorMov) {
            toast.error("Error calculando saldos");
            console.error("Error calculando saldos", errorMov);
        }

        const cuentasConSaldo = (dataCuentas as Cuenta[]).map(cuenta => {
            const movimientosCuenta = (dataMovimientos as Movimiento[] || []).filter(m => m.cuenta_id === cuenta.id);
            const total = movimientosCuenta.reduce((acc, mov) => {
                return mov.tipo === "ingreso" ? acc + mov.monto : acc - mov.monto;
            }, 0);
            return { ...cuenta, saldo_calculado: total };
        });

        setCuentas(cuentasConSaldo);
        setLoading(false);
    };

    const guardarCuenta = async (form: any, isFirst: boolean) => {
        const { data: { session } } = await supabase.auth.getSession();

        const { error } = await supabase.from("cuentas").insert({
            owner_id: session?.user.id,
            nombre: form.nombre,
            banco: form.banco || null,
            tipo: form.tipo,
            numero: form.numero || null,
            moneda: form.moneda,
            is_principal: isFirst
        });

        if (error) {
            throw error;
        } else {
            await cargarCuentasYSaldo();
            toast.success("Cuenta creada exitosamente");
        }
    };

    const eliminarCuenta = async (id: string) => {
        if (!confirm("¿Borrar cuenta? Se perderá el historial de saldo asociado.")) return;

        const { error } = await supabase.from("cuentas").delete().eq("id", id);
        if (error) {
            toast.error("Error al eliminar cuenta");
        } else {
            await cargarCuentasYSaldo();
            toast.success("Cuenta eliminada");
        }
    };

    const hacerPrincipal = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("cuentas").update({ is_principal: false }).eq("owner_id", session?.user.id);
        await supabase.from("cuentas").update({ is_principal: true }).eq("id", id);
        await cargarCuentasYSaldo();
        toast.success("Cuenta marcada como principal");
    };

    return {
        cuentas,
        loading,
        cargarCuentasYSaldo,
        guardarCuenta,
        eliminarCuenta,
        hacerPrincipal
    };
}
