import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Cliente, Cuenta, PackServicio, Proyecto } from "../../types";
import { toast } from "sonner";

export function useClientes() {
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [packs, setPacks] = useState<PackServicio[]>([]);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [userId, setUserId] = useState("");
    const [query, setQuery] = useState("");

    const clientesFiltrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clientes;
        return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
    }, [clientes, query]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUserId(session.user.id);

            const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", session.user.id).single(),
                supabase.from("clientes").select("*, pagos_cliente(id, monto, fecha_pago, referencia, proyecto_id)").order("created_at", { ascending: false }),

                supabase.from("proyectos")
                    .select("*, gastos(monto), pagos_cliente(id, monto, fecha_pago, referencia)")
                    .eq("owner_id", session.user.id)
                    .neq("estado", "finalizado"),

                supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", session.user.id),
                supabase.from("plantillas_proyectos").select("*").eq("owner_id", session.user.id)
            ]);

            if (resProfile.data) setMyProfile(resProfile.data);
            if (resCuentas.data) setCuentas(resCuentas.data as Cuenta[]);
            if (resPacks.data) setPacks(resPacks.data);

            if (resClientes.data) {
                const clientesConProyectos = (resClientes.data as any[]).map(c => ({
                    ...c,
                    proyectos: resProyectos.data?.filter(p => p.cliente_id === c.id) || []
                }));
                setClientes(clientesConProyectos as Cliente[]);
            }
        } catch (e) {
            toast.error("Error cargando clientes");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const crearCliente = (nuevoCliente: Cliente) => {
        setClientes([{ ...nuevoCliente, proyectos: [], pagos_cliente: [] }, ...clientes]);
        toast.success("Cliente creado");
    };

    const crearProyecto = (nuevoProyecto: Proyecto) => {
        setClientes(prev => prev.map(c => c.id === nuevoProyecto.cliente_id ? { ...c, proyectos: [...(c.proyectos || []), nuevoProyecto] } : c));
        toast.success("Proyecto creado");
    };

    const actualizarProyecto = (proyectoEditado: Proyecto, mostrarToast = true) => {
        setClientes(prev => prev.map(c => {
            if (c.id === proyectoEditado.cliente_id) {
                const proyectosActualizados = c.proyectos?.map(p => p.id === proyectoEditado.id ? proyectoEditado : p);
                return { ...c, proyectos: proyectosActualizados };
            }
            return c;
        }));
        if (mostrarToast) toast.success("Proyecto actualizado");
    };

    const registrarPago = (pago: any, clienteActualizado: Cliente) => {
        setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));

        if (pago.proyecto_id) {
            const cliente = clientes.find(c => c.id === clienteActualizado.id);
            if (cliente && cliente.proyectos) {
                const proyecto = cliente.proyectos.find(p => p.id === pago.proyecto_id);
                if (proyecto) {
                    const nuevosPagosProyecto = [...(proyecto.pagos_cliente || []), pago];
                    const proyectoActualizado = { ...proyecto, pagos_cliente: nuevosPagosProyecto };
                    actualizarProyecto(proyectoActualizado, false);
                }
            }
        }
    };

    const eliminarCliente = async (id: string) => {
        if (!confirm("⚠️ Se borrarán el cliente y sus proyectos. ¿Seguro?")) return;
        const { error } = await supabase.from("clientes").delete().eq("id", id);
        if (error) {
            toast.error("Error al eliminar cliente");
        } else {
            setClientes(prev => prev.filter(c => c.id !== id));
            toast.success("Cliente eliminado");
        }
    };

    const eliminarProyecto = async (proyectoId: string, clienteId: string) => {
        if (!confirm("¿Borrar proyecto?")) return;
        const { error } = await supabase.from("proyectos").delete().eq("id", proyectoId);
        if (error) {
            toast.error("Error al eliminar proyecto");
        } else {
            setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, proyectos: c.proyectos?.filter(p => p.id !== proyectoId) } : c));
            toast.success("Proyecto eliminado");
        }
    };

    const actualizarClienteLocal = (clienteActualizado: Cliente) => {
        setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
    };

    return {
        loading,
        clientesFiltrados,
        cuentas,
        packs,
        myProfile,
        userId,
        query,
        setQuery,
        crearCliente,
        crearProyecto,
        actualizarProyecto,
        registrarPago,
        eliminarCliente,
        eliminarProyecto,
        actualizarClienteLocal
    };
}
