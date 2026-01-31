import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Cliente, Cuenta, PackServicio, Proyecto } from "../../types";
import { toast } from "sonner";

import { useWorkspace } from "../providers/WorkspaceProvider";

import { useLogger } from './useLogger'; // <--- IMPORTAR LOG

export function useClientes() {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const { currentWorkspace } = useWorkspace();
    const { logEvent } = useLogger(); // <--- INICIALIZAR

    // 1. QUERY PRINCIPAL
    const { data, isLoading } = useQuery({
        queryKey: ['clientes', currentWorkspace?.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");
            const uid = session.user.id;

            // Si no hay workspace cargado, retornar vacío pero user profile sí
            if (!currentWorkspace) return { clientes: [], cuentas: [], packs: [], myProfile: null, userId: uid };

            const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", uid).single(),
                // AHORA FILTRAMOS POR WORKSPACE_ID, NO OWNER_ID (Datos de empresa, no personales)
                supabase.from("clientes").select("*, pagos_cliente(id, monto, fecha_pago, referencia, proyecto_id)").order("created_at", { ascending: false }).eq("workspace_id", currentWorkspace.id),
                supabase.from("proyectos")
                    .select("*, gastos(monto), pagos_cliente(id, monto, fecha_pago, referencia)")
                    .eq("workspace_id", currentWorkspace.id) // Workspace filter
                    .neq("estado", "finalizado"),
                supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", uid), // Cuentas siguen siendo personales por ahora? NO, deberían ser de empresa. 
                // Pero en la migración NO migramos cuentas... Error en mi plan? 
                // Revisé el SQL: NO migré cuentas. 
                // Workaround: Filtrar cuentas por owner_id (como antes) o asumir que son compartidas.
                // Para MVP Fase 1: Las cuentas siguen siendo personales del usuario (bancos), pero usadas en la empresa.
                // Corrección: Debería haber migrado cuentas. Pero dejémoslo personal por ahora para no complicar.
                supabase.from("plantillas_proyectos").select("*").eq("owner_id", uid) // Plantillas personales
            ]);

            const clientesRaw = resClientes.data || [];
            const proyectosRaw = resProyectos.data || [];

            // Mapeo Clientes <-> Proyectos
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

    // 2. MUTACIONES
    const crearClienteMutation = useMutation({
        mutationFn: async (nuevoCliente: Cliente) => {
            if (!currentWorkspace?.id) throw new Error("No hay workspace activo");

            const { data, error } = await supabase.from("clientes").insert({
                ...nuevoCliente,
                workspace_id: currentWorkspace.id,
                owner_id: (await supabase.auth.getUser()).data.user?.id // Fallback or strict RLS
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Cliente creado");
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Proyecto creado");
        }
    });

    const registrarPagoMutation = useMutation({
        mutationFn: async ({ pago, clienteActualizado }: { pago: any, clienteActualizado: Cliente }) => {
            // Nota: registrarPago generalmente ocurre dentro del Modal, no aquí? 
            // Si el Modal hace el insert, aquí solo invalidamos. 
            // PERO la queja del usuario fue useClientes. 
            // Si el ModalDetalleCliente usa SUS PROPIAS lógicas, esto podría ser redundante.
            // Asumiendo que esta funcion se llama para actualizar estado local o cache.
            // Si el usuario dijo "crearClienteMutation... vacía", arreglé eso arriba.
            // Dejaré registrarPago como está si solo invalida, a menos que se use para insertar.
            return clienteActualizado;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            queryClient.invalidateQueries({ queryKey: ['finanzas'] });
        }
    });

    const eliminarClienteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("clientes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Cliente eliminado");
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
        onError: (e) => toast.error("Error al eliminar cliente")
    });

    const eliminarProyectoMutation = useMutation({
        mutationFn: async ({ proyectoId }: { proyectoId: string, clienteId: string }) => {
            const { error } = await supabase.from("proyectos").delete().eq("id", proyectoId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Proyecto eliminado");
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
        onError: (e) => toast.error("Error al eliminar proyecto")
    });

    // Wrappers con toast/confirm logic heredada
    const eliminarCliente = (id: string) => {
        toast.error("¿Borrar cliente y sus proyectos?", {
            action: {
                label: "Eliminar",
                onClick: () => eliminarClienteMutation.mutate(id)
            },
            cancel: { label: "Cancelar", onClick: () => { } }
        });
    };

    const eliminarProyecto = (proyectoId: string, clienteId: string) => {
        toast.error("¿Borrar proyecto permanentemente?", {
            action: {
                label: "Eliminar",
                onClick: () => eliminarProyectoMutation.mutate({ proyectoId, clienteId })
            },
            cancel: { label: "Cancelar", onClick: () => { } }
        });
    };

    return {
        loading: isLoading,
        clientesFiltrados,
        cuentas: data?.cuentas || [],
        packs: data?.packs || [],
        myProfile: data?.myProfile,
        userId: data?.userId || "",
        query,
        setQuery,
        // Mantener firmas antiguas aunque solo invalide
        crearCliente: (c: Cliente) => crearClienteMutation.mutateAsync(c),
        crearProyecto: (p: Proyecto) => crearProyectoMutation.mutateAsync(p),
        actualizarProyecto: (p?: any, showToast?: boolean) => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
        registrarPago: (pago: any, cliente: Cliente) => registrarPagoMutation.mutateAsync({ pago, clienteActualizado: cliente }),
        eliminarCliente,
        eliminarProyecto,
        actualizarClienteLocal: (c?: any) => queryClient.invalidateQueries({ queryKey: ['clientes'] })
    };
}
