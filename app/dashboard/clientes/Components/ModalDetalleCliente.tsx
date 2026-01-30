import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { XMarkIcon, BriefcaseIcon, BanknotesIcon, InformationCircleIcon, DocumentTextIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Cliente, Proyecto } from "../../../../types";
import { supabase } from "@/lib/supabaseClient";
import Editor from "../../../components/wiki/Editor";
import { toast } from "sonner";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";

interface Doc {
    id: string;
    title: string;
    content: any;
    updated_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
}

export default function ModalDetalleCliente({ isOpen, onClose, cliente }: Props) {
    const [tab, setTab] = useState<'proyectos' | 'pagos' | 'info' | 'docs'>('proyectos');
    const { currentWorkspace } = useWorkspace();

    // Docs State
    const [docs, setDocs] = useState<Doc[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [savingDoc, setSavingDoc] = useState(false);

    useEffect(() => {
        if (isOpen && cliente) {
            setTab('proyectos');
            setSelectedDoc(null);
            loadDocs();
        }
    }, [isOpen, cliente]);

    const loadDocs = async () => {
        if (!cliente) return;
        setLoadingDocs(true);
        const { data, error } = await supabase
            .from('docs')
            .select('*')
            .eq('client_id', cliente.id)
            .order('updated_at', { ascending: false });

        if (data) setDocs(data);
        setLoadingDocs(false);
    };

    const handleCreateDoc = async () => {
        if (!currentWorkspace || !cliente) return;
        const newDoc = {
            title: "Nueva Nota",
            content: {},
            workspace_id: currentWorkspace.id,
            client_id: cliente.id
        };

        const { data, error } = await supabase.from('docs').insert(newDoc).select().single();
        if (data) {
            setDocs([data, ...docs]);
            setSelectedDoc(data);
            toast.success("Documento creado");
        }
    };

    const handleUpdateDoc = async (content: any) => {
        if (!selectedDoc) return;
        // Auto-save logic could go here (debounce). For now manual or direct update on blur/change?
        // Let's update local state immediately, saving to DB is debounced normally.
        // For simplicity in this step, we just update local state and have a "Save" or auto-save effect.
        // Let's implement a simple auto-save effect or just save on change for V1

        // Actually, let's just update the local object for now, and have a save function.
        // But better: Update DB on content change (debounced 1s would be best, but simple update for now)
        // Let's rely on a explicit "Guardar" or auto-save.
        // Tiptap onChange fires often.
    };

    // Auto-save debounce effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (selectedDoc && savingDoc) {
                await supabase.from('docs').update({
                    content: selectedDoc.content,
                    title: selectedDoc.title,
                    updated_at: new Date().toISOString()
                }).eq('id', selectedDoc.id);
                setSavingDoc(false);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [selectedDoc, savingDoc]);

    const updateLocalDocContent = (content: any) => {
        if (!selectedDoc) return;
        setSelectedDoc({ ...selectedDoc, content });
        setSavingDoc(true);
    };

    const updateLocalDocTitle = (title: string) => {
        if (!selectedDoc) return;
        setSelectedDoc({ ...selectedDoc, title });
        setSavingDoc(true);
    };

    const handleDeleteDoc = async (id: string) => {
        const { error } = await supabase.from('docs').delete().eq('id', id);
        if (!error) {
            setDocs(docs.filter(d => d.id !== id));
            if (selectedDoc?.id === id) setSelectedDoc(null);
            toast.success("Nota eliminada");
        }
    };

    if (!cliente) return null;

    // Calcular totales generales
    const totalProyectos = cliente.proyectos?.length || 0;
    const totalPagadoHistorico = cliente.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;

    // Obtener lista plana de todos los pagos de todos los proyectos + pagos sueltos del cliente
    // A veces los pagos están en cliente.pagos_cliente (si son directos) o en proyectos.pagos_cliente
    // Pero en useClientes.ts parece que 'pagos_cliente' en el objeto cliente NO incluye los de proyectos anidados por defecto en la query simple,
    // PERO en cargarDatos se hace un map complejo. Asumiremos que 'proyectos' tiene sus pagos.
    // Vamos a consolidar todos los pagos para la pestaña "Historial".

    // Consolidar pagos:
    // 1. Pagos Directos: Aquellos en cliente.pagos_cliente que NO tienen proyecto_id (para evitar duplicados)
    const pagosDirectos = (cliente.pagos_cliente || [])
        .filter((p: any) => !p.proyecto_id)
        .map((p: any) => ({
            ...p,
            origen: "Directo",
            // Aseguramos que tenemos los campos base aunque vengan de la query simple
            fecha_pago: p.fecha_pago,
            monto: p.monto,
            referencia: p.referencia
        }));

    // 2. Pagos de Proyectos: Extraídos de la estructura anidada de proyectos
    const pagosProyectos = (cliente.proyectos?.flatMap(proj =>
        proj.pagos_cliente?.map((p: any) => ({
            ...p,
            origen: `Proyecto: ${proj.nombre}`,
            fecha_pago: p.fecha_pago,
            monto: p.monto,
            referencia: p.referencia
        })) || []
    ) || []);

    const todosLosPagos = [
        ...pagosDirectos,
        ...pagosProyectos
    ].sort((a, b) => new Date(b.fecha_pago || 0).getTime() - new Date(a.fecha_pago || 0).getTime());


    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-[#0D1117] border border-white/10 p-6 text-left align-middle shadow-xl transition-all min-h-[600px] flex flex-col">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                            {cliente.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-2xl font-bold text-white leading-tight">
                                                {cliente.nombre}
                                            </Dialog.Title>
                                            <p className="text-emerald-400 font-mono text-sm uppercase tracking-wide">{cliente.empresa || "Cliente Particular"}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Stats Rápidos */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total Pagado</p>
                                        <p className="text-xl font-bold text-emerald-400 font-mono">${todosLosPagos.reduce((s, p) => s + p.monto, 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Proyectos</p>
                                        <p className="text-xl font-bold text-white">{totalProyectos}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                                        <p className={`text-xl font-bold ${cliente.estado === 'activo' ? 'text-blue-400' : 'text-gray-400'}`}>{cliente.estado.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex gap-2 border-b border-white/10 mb-6">
                                    <button onClick={() => setTab('proyectos')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'proyectos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <BriefcaseIcon className="w-4 h-4" /> Proyectos
                                    </button>
                                    <button onClick={() => setTab('pagos')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'pagos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <BanknotesIcon className="w-4 h-4" /> Historial de Pagos
                                    </button>
                                    <button onClick={() => setTab('docs')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'docs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <DocumentTextIcon className="w-4 h-4" /> Docs / Wiki
                                    </button>
                                    <button onClick={() => setTab('info')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'info' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <InformationCircleIcon className="w-4 h-4" /> Info Cliente
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">

                                    {tab === 'proyectos' && (
                                        <div className="space-y-3">
                                            {cliente.proyectos?.length === 0 ? (
                                                <p className="text-gray-500 text-center py-10">Sin proyectos registrados.</p>
                                            ) : (
                                                cliente.proyectos?.map(p => {
                                                    const pagado = p.pagos_cliente?.reduce((s, x) => s + x.monto, 0) || 0;
                                                    const porcentaje = Math.min((pagado / (p.monto || 1)) * 100, 100);

                                                    return (
                                                        <div key={p.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-black/40 transition">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <div className={`w-2 h-2 rounded-full ${p.estado === 'finalizado' ? 'bg-emerald-500' : p.estado === 'pendiente' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                                    <h4 className="font-bold text-white">{p.nombre}</h4>
                                                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase">{p.estado}</span>
                                                                </div>
                                                                <div className="w-full max-w-sm h-1.5 bg-gray-700/50 rounded-full mt-2 overflow-hidden">
                                                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${porcentaje}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white font-mono font-bold">${p.monto.toLocaleString()} {p.moneda}</p>
                                                                <p className="text-xs text-gray-500">Pagado: <span className="text-emerald-400">${pagado.toLocaleString()}</span></p>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )}

                                    {tab === 'pagos' && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                                        <th className="py-3 px-4">Fecha</th>
                                                        <th className="py-3 px-4">Referencia / Concepto</th>
                                                        <th className="py-3 px-4">Origen</th>
                                                        <th className="py-3 px-4 text-right">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {todosLosPagos.length === 0 ? (
                                                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">No hay pagos registrados.</td></tr>
                                                    ) : (
                                                        todosLosPagos.map((p, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                                                                <td className="py-3 px-4 text-gray-300">{p.fecha_pago || "--/--/--"}</td>
                                                                <td className="py-3 px-4 text-white font-medium">{p.referencia || "Sin referencia"}</td>
                                                                <td className="py-3 px-4 text-gray-400 text-xs">{p.origen}</td>
                                                                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">+${p.monto.toLocaleString()}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {tab === 'docs' && (
                                        <div className="h-full flex gap-4 min-h-[400px]">
                                            {/* Sidebar List */}
                                            <div className="w-1/3 border-r border-white/10 pr-4 flex flex-col">
                                                <button onClick={handleCreateDoc} className="w-full mb-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                                                    <PlusIcon className="w-4 h-4" /> Nueva Nota
                                                </button>

                                                <div className="flex-1 overflow-y-auto space-y-2">
                                                    {loadingDocs ? (
                                                        <p className="text-gray-500 text-xs text-center py-4">Cargando...</p>
                                                    ) : docs.length === 0 ? (
                                                        <p className="text-gray-500 text-xs text-center py-4">No hay notas.</p>
                                                    ) : (
                                                        docs.map(doc => (
                                                            <div key={doc.id}
                                                                onClick={() => setSelectedDoc(doc)}
                                                                className={`p-3 rounded-xl border cursor-pointer transition group relative ${selectedDoc?.id === doc.id ? 'bg-purple-500/10 border-purple-500/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                                                <p className={`text-sm font-medium truncate ${selectedDoc?.id === doc.id ? 'text-white' : 'text-gray-300'}`}>{doc.title || "Sin Título"}</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">{new Date(doc.updated_at).toLocaleDateString()}</p>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition">
                                                                    <XMarkIcon className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Editor Area */}
                                            <div className="flex-1 flex flex-col">
                                                {selectedDoc ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={selectedDoc.title}
                                                            onChange={(e) => updateLocalDocTitle(e.target.value)}
                                                            className="bg-transparent border-none text-xl font-bold text-white focus:outline-none mb-4 w-full placeholder-gray-600"
                                                            placeholder="Título del documento..."
                                                        />
                                                        <div className="flex-1 overflow-y-auto">
                                                            <Editor
                                                                content={selectedDoc.content}
                                                                onChange={updateLocalDocContent}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-gray-600 mt-2 text-right">
                                                            {savingDoc ? "Guardando..." : "Guardado"}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
                                                        <DocumentTextIcon className="w-12 h-12 opacity-20" />
                                                        <p>Selecciona o crea una nota</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {tab === 'info' && (
                                        <div className="space-y-6">

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Email</label>
                                                    <p className="text-white bg-white/5 p-3 rounded-xl border border-white/5 select-all">{cliente.email || "No registrado"}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Teléfono</label>
                                                    <p className="text-white bg-white/5 p-3 rounded-xl border border-white/5 select-all">{cliente.telefono || "No registrado"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Notas Internas</label>
                                                    <p className="text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">{cliente.nota || "Sin notas adicionales."}</p>
                                                </div>

                                                {cliente.proximo_pago && (
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Próximo Pago Recurrente</label>
                                                        <p className="text-emerald-400 font-bold bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/20">
                                                            {cliente.proximo_pago}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
