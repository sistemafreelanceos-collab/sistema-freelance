import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Cliente, Cuenta, PackServicio, Proyecto } from "../../types";
import { toast } from "sonner";

export function useClientes() {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");

    // 1. QUERY PRINCIPAL
    const { data, isLoading } = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");
            const uid = session.user.id;

            const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", uid).single(),
                supabase.from("clientes").select("*, pagos_cliente(id, monto, fecha_pago, referencia, proyecto_id)").order("created_at", { ascending: false }).eq("owner_id", uid),
                supabase.from("proyectos")
                    .select("*, gastos(monto), pagos_cliente(id, monto, fecha_pago, referencia)")
                    .eq("owner_id", uid)
                    .neq("estado", "finalizado"),
                supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", uid),
                supabase.from("plantillas_proyectos").select("*").eq("owner_id", uid)
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
            // No hacemos fetch real, confiamos en optimistic update o invalidation
            // Pero como la firma original era solo actualizar estado local... 
            // ASUMIREMOS que el componente llama a Supabase antes.
            // *CORRECCIÓN*: El hook original recibía el objeto YA CREADO desde el componente (que hacía el insert).
            // Para mantener compatibilidad con components viejos que hacen el insert fuera, 
            // solo invalidamos. Pero si el componente espera actualizar estado local, invalidateQueries servirá.
            return nuevoCliente;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Cliente creado");
        }
    });

    const crearProyectoMutation = useMutation({
        mutationFn: async (nuevoProyecto: Proyecto) => {
            return nuevoProyecto;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success("Proyecto creado");
        }
    });

    const registrarPagoMutation = useMutation({
        mutationFn: async ({ pago, clienteActualizado }: { pago: any, clienteActualizado: Cliente }) => {
            // Similar al anterior, el componente ya hizo el insert. Solo invalidamos.
            return clienteActualizado;
        },
        onSuccess: () => {
            // Invalidate también finanzas porque un pago afecta saldo
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
