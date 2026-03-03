import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useWorkspace } from "../providers/WorkspaceProvider";

export interface PagoVencidoAlert {
    id: string;
    proveedor: string;
    proyecto: string;
    monto: number;
    moneda: string;
    fecha_pago: string;
    tipo: "hoy" | "vencido";
    diasVencido?: number;
}

const STORAGE_KEY = "proveedor_payment_alert_dismissed";

export function useProveedorPaymentAlerts() {
    const { currentWorkspace } = useWorkspace();
    const [showModal, setShowModal] = useState(false);

    const { data: pagosUrgentes = [] } = useQuery<PagoVencidoAlert[]>({
        queryKey: ["proveedor-payment-alerts", currentWorkspace?.id],
        enabled: !!currentWorkspace?.id,
        staleTime: 1000 * 60 * 5, // refresca cada 5 min
        queryFn: async () => {
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

            // Buscar proyectos de proveedor con fecha_pago <= hoy y que NO estén completamente pagados
            const { data, error } = await supabase
                .from("proyectos_proveedor")
                .select("id, nombre, monto, moneda, fecha_pago, estado, proveedor_id, proveedores(nombre), pagos_proveedor(monto, estado)")
                .eq("workspace_id", currentWorkspace!.id)
                .neq("estado", "completado")
                .not("fecha_pago", "is", null)
                .lte("fecha_pago", hoyStr);

            if (error || !data) return [];

            const alertas: PagoVencidoAlert[] = [];

            for (const proy of data as any[]) {
                const pagado = (proy.pagos_proveedor || [])
                    .filter((p: any) => p.estado === "pagado")
                    .reduce((s: number, p: any) => s + p.monto, 0);

                // Solo alertar si aún hay saldo pendiente
                if (pagado >= proy.monto) continue;

                const fechaPago = new Date(proy.fecha_pago + "T12:00:00");
                const diffMs = hoy.setHours(0, 0, 0, 0) - fechaPago.setHours(0, 0, 0, 0);
                const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                alertas.push({
                    id: proy.id,
                    proveedor: proy.proveedores?.nombre || "Proveedor",
                    proyecto: proy.nombre,
                    monto: proy.monto - pagado,
                    moneda: proy.moneda || "USD",
                    fecha_pago: proy.fecha_pago,
                    tipo: diffDias === 0 ? "hoy" : "vencido",
                    diasVencido: diffDias > 0 ? diffDias : undefined,
                });
            }

            return alertas;
        },
    });

    // Mostrar modal al cargar si hay alertas y no se descartó hoy
    useEffect(() => {
        if (pagosUrgentes.length === 0) return;
        const dismissed = localStorage.getItem(STORAGE_KEY);
        const today = new Date().toDateString();
        if (dismissed !== today) {
            setShowModal(true);
        }
    }, [pagosUrgentes.length]);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
        setShowModal(false);
    };

    return { showModal, pagosUrgentes, dismiss };
}
