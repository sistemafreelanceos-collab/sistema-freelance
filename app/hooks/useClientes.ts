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

    const { data, isLoading } = useQuery({
        queryKey: ['clientes', currentWorkspace?.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user.id;
            if (!currentWorkspace) return { clientes: [], cuentas: [], packs: [], myProfile: null, userId: uid };

            const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", uid).single(),
                supabase.from("clientes").select("*, pagos_cliente(id, monto, fecha_pago, referencia, proyecto_id)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }),
                supabase.from("proyectos").select("*, movimientos(monto), pagos_cliente(id, monto, fecha_pago, referencia)").eq("workspace_id", currentWorkspace.id).neq("estado", "finalizado"),
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
                cuentas: (resCuentas.data || []) as Cuenta[],
                packs: (resPacks.data || []) as PackServicio[],
                myProfile: resProfile.data,
                userId: uid
            };
        }
    });

    const clientes = data?.clientes || [];
    const clientesFiltrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clientes;
        return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
    }, [clientes, query]);

    const crearClienteMutation = useMutation({
        mutationFn: async (nuevoCliente: Cliente) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");

            // 🛡️ SANITIZACIÓN: Excluir campos que no son de la DB
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, owner_id, created_at, pagos_cliente, proyectos, ...payload } = nuevoCliente;

            const { data, error } = await supabase.from("clientes").insert({
                ...payload,
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

            // 🛡️ SANITIZACIÓN: Excluir campos relacionales o calculados
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, gastos, pagos_cliente, owner_id, ...payload } = nuevoProyecto as any; // Cast to any to catch optional extra props

            const { data, error } = await supabase.from("proyectos").insert({
                ...payload,
                workspace_id: currentWorkspace.id
            }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Proyecto creado");
        }
    });

    const eliminarClienteMutation = useMutation({
        mutationFn: async (id: string) => { await supabase.from("clientes").delete().eq("id", id); },
        onSuccess: () => { toast.success("Eliminado"); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }
    });

    const eliminarProyectoMutation = useMutation({
        mutationFn: async ({ proyectoId }: { proyectoId: string }) => { await supabase.from("proyectos").delete().eq("id", proyectoId); },
        onSuccess: () => { toast.success("Eliminado"); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }
    });

    // Wrappers para mantener compatibilidad
    const eliminarCliente = (id: string) => eliminarClienteMutation.mutate(id);
    const eliminarProyecto = (proyectoId: string, clienteId: string) => eliminarProyectoMutation.mutate({ proyectoId });

    return {
        loading: isLoading,
        clientesFiltrados,
        cuentas: data?.cuentas || [],
        packs: data?.packs || [],
        myProfile: data?.myProfile,
        userId: data?.userId || "",
        query,
        setQuery,
        crearCliente: (c: Cliente) => crearClienteMutation.mutateAsync(c),
        crearProyecto: (p: Proyecto) => crearProyectoMutation.mutateAsync(p),
        actualizarProyecto: async (proyecto: Proyecto) => {
            // Lógica básica de actualización e invalidación
            if (!proyecto.id) return;
            const { id, gastos, pagos_cliente, ...payload } = proyecto as any;
            await supabase.from("proyectos").update(payload).eq("id", id);
            toast.success("Proyecto actualizado");
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
        registrarPago: async (pago: any, clienteActualizado: Cliente) => {
            // Lógica para registrar pago y actualizar cliente
            if (!clienteActualizado.id) return;
            // Aquí idealmente iría la lógica real de inserción de pago
            await supabase.from("pagos_cliente").insert({
                ...pago,
                cliente_id: clienteActualizado.id
            });
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Pago registrado");
        },
        eliminarCliente,
        eliminarProyecto,
        actualizarClienteLocal: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })
    };
}
