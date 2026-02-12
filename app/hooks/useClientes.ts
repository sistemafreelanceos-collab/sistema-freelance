import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Cliente, Cuenta, PackServicio, Proyecto } from "../../types";
import { toast } from "sonner";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { useLogger } from './useLogger';

export function useClientes() {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const { currentWorkspace } = useWorkspace();
    const { logEvent } = useLogger();

    // 1. QUERY PRINCIPAL
    const { data, isLoading } = useQuery({
        queryKey: ['clientes', currentWorkspace?.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");
            const uid = session.user.id;

            if (!currentWorkspace) return { clientes: [], cuentas: [], packs: [], myProfile: null, userId: uid };

            const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", uid).single(),
                supabase.from("clientes").select("*, pagos_cliente(id, monto, fecha_pago, referencia, proyecto_id)").order("created_at", { ascending: false }).eq("workspace_id", currentWorkspace.id),
                supabase.from("proyectos")
                    .select("*, clientes(nombre), pagos_cliente(id, monto, fecha_pago, referencia)")
                    .eq("workspace_id", currentWorkspace.id)
                    .neq("estado", "archivado"), // Traemos todo menos lo archivado
                supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", uid),
                supabase.from("plantillas_proyectos").select("*").eq("owner_id", uid)
            ]);

            const clientesRaw = resClientes.data || [];
            const proyectosRaw = resProyectos.data || [];

            const clientesConProyectos = clientesRaw.map((c: any) => ({
                ...c,
                proyectos: proyectosRaw.filter((p: any) => p.cliente_id === c.id) || []
            }));

            return {
                clientes: clientesConProyectos as Cliente[],
                todosLosProyectos: proyectosRaw as any[], // 🟢 Nuevo: Lista plana para el Kanban
                cuentas: (resCuentas.data || []) as Cuenta[],
                packs: (resPacks.data || []) as PackServicio[],
                myProfile: resProfile.data,
                userId: uid
            };
        }
    });

    const clientes = data?.clientes || [];
    const todosLosProyectos = data?.todosLosProyectos || [];

    const clientesFiltrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clientes;
        return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
    }, [clientes, query]);

    // 2. MUTACIONES
    const crearClienteMutation = useMutation({
        mutationFn: async (nuevoCliente: Cliente) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { data, error } = await supabase.from("clientes").insert({
                ...nuevoCliente,
                workspace_id: currentWorkspace.id
            }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Cliente creado");
            logEvent('cliente', `Nuevo cliente: ${variables.nombre}`, '🤝');
        }
    });

    const crearProyectoMutation = useMutation({
        mutationFn: async (nuevoProyecto: Proyecto) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");
            const { data, error } = await supabase.from("proyectos").insert({
                ...nuevoProyecto,
                workspace_id: currentWorkspace.id
            }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Proyecto creado");
            logEvent('cliente', `Nuevo proyecto: ${variables.nombre}`, '🚀');
        }
    });

    // 🟢 NUEVO: Cambiar estado (Drag & Drop)
    const cambiarEstadoProyectoMutation = useMutation({
        mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: string }) => {
            const { error } = await supabase.from("proyectos").update({ estado: nuevoEstado }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            // toast.success("Estado actualizado"); // Opcional: para no llenar de notificaciones
        }
    });

    const eliminarClienteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("clientes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => { toast.success("Cliente eliminado"); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }
    });

    const eliminarProyectoMutation = useMutation({
        mutationFn: async ({ proyectoId }: { proyectoId: string }) => {
            const { error } = await supabase.from("proyectos").delete().eq("id", proyectoId);
            if (error) throw error;
        },
        onSuccess: () => { toast.success("Proyecto eliminado"); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }
    });

    // Wrappers
    const eliminarCliente = (id: string) => eliminarClienteMutation.mutate(id);
    const eliminarProyecto = (proyectoId: string, clienteId: string) => eliminarProyectoMutation.mutate({ proyectoId });
    const cambiarEstadoProyecto = (id: string, nuevoEstado: string) => cambiarEstadoProyectoMutation.mutate({ id, nuevoEstado });

    return {
        loading: isLoading,
        clientesFiltrados,
        todosLosProyectos, // 🟢 Exportamos la lista plana
        cuentas: data?.cuentas || [],
        packs: data?.packs || [],
        myProfile: data?.myProfile,
        userId: data?.userId || "",
        query,
        setQuery,
        crearCliente: (c: Cliente) => crearClienteMutation.mutateAsync(c),
        crearProyecto: (p: Proyecto) => crearProyectoMutation.mutateAsync(p),
        actualizarProyecto: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
        registrarPago: async () => { }, // Simplificado
        eliminarCliente,
        eliminarProyecto,
        cambiarEstadoProyecto, // 🟢 Exportamos la función
        actualizarClienteLocal: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })
    };
}
