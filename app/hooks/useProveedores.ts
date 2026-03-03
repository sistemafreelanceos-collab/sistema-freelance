import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Proveedor, PagoProveedor, ProyectoProveedor } from "../../types/proveedores";
import { toast } from "sonner";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function useProveedores() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspace();
    const [query, setQuery] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["proveedores", currentWorkspace?.id],
        queryFn: async () => {
            if (!currentWorkspace) return { proveedores: [], cuentas: [] };

            const [resProveedores, resCuentas] = await Promise.all([
                supabase
                    .from("proveedores")
                    .select(`
            *,
            pagos_proveedor(*),
            proyectos_proveedor(*, pagos_proveedor(*))
          `)
                    .eq("workspace_id", currentWorkspace.id)
                    .eq("activo", true)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("cuentas")
                    .select("*")
                    .order("is_principal", { ascending: false }),
            ]);

            return {
                proveedores: (resProveedores.data || []) as Proveedor[],
                cuentas: resCuentas.data || [],
            };
        },
        enabled: !!currentWorkspace,
    });

    const proveedoresFiltrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = data?.proveedores || [];
        if (!q) return list;
        return list.filter(
            (p) =>
                p.nombre.toLowerCase().includes(q) ||
                p.empresa?.toLowerCase().includes(q) ||
                p.especialidad?.toLowerCase().includes(q)
        );
    }, [data?.proveedores, query]);

    // ── MUTACIONES ──

    const crearProveedorMutation = useMutation({
        mutationFn: async (proveedor: Partial<Proveedor>) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { data, error } = await supabase
                .from("proveedores")
                .insert({ ...proveedor, workspace_id: currentWorkspace.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proveedor creado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const actualizarProveedorMutation = useMutation({
        mutationFn: async ({ id, ...rest }: Partial<Proveedor> & { id: string }) => {
            const { error } = await supabase.from("proveedores").update(rest).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proveedor actualizado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const eliminarProveedorMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("proveedores")
                .update({ activo: false })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proveedor eliminado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const crearProyectoMutation = useMutation({
        mutationFn: async ({ proveedorId, data }: { proveedorId: string; data: Partial<ProyectoProveedor> }) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { error } = await supabase
                .from("proyectos_proveedor")
                .insert({ ...data, proveedor_id: proveedorId, workspace_id: currentWorkspace.id });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proyecto creado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const registrarPagoMutation = useMutation({
        mutationFn: async (pago: Partial<PagoProveedor> & { cuenta_id: string; proyecto_proveedor_id?: string }) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");

            // 1. Insertar el pago en pagos_proveedor
            const { error: errorPago } = await supabase
                .from("pagos_proveedor")
                .insert({ ...pago, workspace_id: currentWorkspace.id, estado: "pagado" });
            if (errorPago) throw errorPago;

            // 2. Siempre registrar como egreso en movimientos (el toggle fue eliminado)
            const proveedor = data?.proveedores.find((p) => p.id === pago.proveedor_id);
            const { error: errorMov } = await supabase.from("movimientos").insert({
                workspace_id: currentWorkspace.id,
                cuenta_id: pago.cuenta_id,
                tipo: "gasto",
                monto: Number(pago.monto),
                moneda: pago.moneda || "USD",
                fecha: pago.fecha_pago,
                categoria: "Proveedor",
                descripcion: `${pago.descripcion || "Pago"} - ${proveedor?.nombre || "Proveedor"}`,
            });
            if (errorMov) {
                console.error("❌ Error al registrar movimiento en finanzas:", errorMov);
                throw errorMov;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            // Usar la misma key que useFinanzas: ['finanzas', workspaceId]
            queryClient.invalidateQueries({ queryKey: ["finanzas", currentWorkspace?.id] });
            queryClient.invalidateQueries({ queryKey: ["movimientos"] });
            toast.success("Pago registrado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const editarProyectoMutation = useMutation({
        mutationFn: async ({ id, ...rest }: Partial<ProyectoProveedor> & { id: string }) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { error } = await supabase
                .from("proyectos_proveedor")
                .update(rest)
                .eq("id", id)
                .eq("workspace_id", currentWorkspace.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proyecto actualizado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    const eliminarProyectoMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { error } = await supabase
                .from("proyectos_proveedor")
                .delete()
                .eq("id", id)
                .eq("workspace_id", currentWorkspace.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proveedores"] });
            toast.success("Proyecto eliminado");
        },
        onError: (e: any) => toast.error(e.message),
    });

    return {
        loading: isLoading,
        proveedoresFiltrados,
        cuentas: data?.cuentas || [],
        query,
        setQuery,
        crearProveedor: (p: Partial<Proveedor>) => crearProveedorMutation.mutateAsync(p),
        actualizarProveedor: (p: Partial<Proveedor> & { id: string }) =>
            actualizarProveedorMutation.mutateAsync(p),
        eliminarProveedor: (id: string) => eliminarProveedorMutation.mutate(id),
        crearProyectoProveedor: (proveedorId: string, data: Partial<ProyectoProveedor>) =>
            crearProyectoMutation.mutateAsync({ proveedorId, data }),
        editarProyectoProveedor: (data: Partial<ProyectoProveedor> & { id: string }) =>
            editarProyectoMutation.mutateAsync(data),
        eliminarProyectoProveedor: (id: string) => eliminarProyectoMutation.mutateAsync(id),
        registrarPago: (p: Partial<PagoProveedor> & { cuenta_id: string; proyecto_proveedor_id?: string }) =>
            registrarPagoMutation.mutateAsync(p),
    };
}
