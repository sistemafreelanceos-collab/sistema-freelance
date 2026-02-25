import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

// Evitar cacheo severo en esta ruta dinámica
export const revalidate = 60; // Revalida cada 60 seg

export default async function PortalClientePage({ params }: { params: { token: string } }) {
    const { token } = await params;

    // Cliente de Supabase con Service Role (ignora RLS)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Buscar el enlace
    const { data: enlace, error: enlaceError } = await supabaseAdmin
        .from('enlaces_clientes')
        .select('cliente_id, activo')
        .eq('token_unico', token)
        .maybeSingle();

    if (enlaceError || !enlace || !enlace.activo) {
        console.error("Portal Error or Not Found - Token:", token);
        console.error("Error DB:", enlaceError);
        console.error("Data DB:", enlace);
        return notFound();
    }

    // 2. Buscar datos del cliente y sus proyectos
    const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select(`
      nombre, 
      empresa, 
      proyectos (
        id, 
        nombre, 
        descripcion, 
        monto, 
        moneda, 
        estado, 
        fecha_inicio, 
        fecha_fin,
        pagos_cliente (monto)
      )
    `)
        .eq('id', enlace.cliente_id)
        .maybeSingle();

    if (clienteError || !cliente) {
        return notFound();
    }

    // 3. Renderizar el Portal Público
    const proyectosAbiertos = cliente.proyectos?.filter(p => p.estado !== 'finalizado') || [];
    const proyectosCerrados = cliente.proyectos?.filter(p => p.estado === 'finalizado') || [];

    return (
        <div className="min-h-screen bg-[#0A0D14] text-white selection:bg-emerald-500/30 font-sans pb-20">

            {/* Header Premium */}
            <nav className="border-b border-white/5 bg-[#0F1115]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
                            O
                        </div>
                        <div>
                            <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Portal de Cliente</p>
                            <h1 className="text-sm font-medium text-gray-300">Gestionado por Onyx</h1>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Conexión Segura
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 mt-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Bienvenida */}
                <header className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{cliente.nombre}</span> 👋
                    </h2>
                    {cliente.empresa && (
                        <p className="text-xl text-gray-400 flex items-center gap-2">
                            <BuildingOfficeIcon className="w-6 h-6" />
                            {cliente.empresa}
                        </p>
                    )}
                    <p className="text-gray-500 max-w-2xl text-lg">
                        Aquí puedes monitorear el progreso de tus proyectos, revisar cotizaciones y saldos pendientes en tiempo real.
                    </p>
                </header>

                {/* Proyectos Activos */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <ClockIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold">Proyectos en Curso</h3>
                        <span className="bg-indigo-500/20 text-indigo-300 py-0.5 px-2.5 rounded-full text-xs font-bold border border-indigo-500/30">
                            {proyectosAbiertos.length}
                        </span>
                    </div>

                    {proyectosAbiertos.length === 0 ? (
                        <div className="p-12 text-center bg-white/5 border border-white/5 rounded-3xl border-dashed">
                            <p className="text-gray-500">No hay proyectos activos en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {proyectosAbiertos.map(proyecto => {
                                const pagado = proyecto.pagos_cliente?.reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
                                const porcentaje = Math.min((pagado / (proyecto.monto || 1)) * 100, 100);

                                return (
                                    <div key={proyecto.id} className="bg-[#161B22] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition"></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition">{proyecto.nombre}</h4>
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-black/40 text-gray-400 px-2 py-1 rounded-md border border-white/5 font-bold uppercase tracking-wider">
                                                        {proyecto.estado.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-mono font-bold text-white">${proyecto.monto?.toLocaleString()} <span className="text-sm text-gray-500">{proyecto.moneda}</span></p>
                                            </div>
                                        </div>

                                        {proyecto.descripcion && (
                                            <p className="text-sm text-gray-400 mb-6 line-clamp-2 relative z-10">
                                                {proyecto.descripcion}
                                            </p>
                                        )}

                                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 relative z-10">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-gray-400">Progreso de Pagos</span>
                                                <span className="font-mono font-bold text-emerald-400">{porcentaje.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                                                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${porcentaje}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs font-mono text-gray-500">
                                                <span>Abonado: ${pagado.toLocaleString()}</span>
                                                <span>Faltante: ${(proyecto.monto - pagado).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Historial Completado */}
                {proyectosCerrados.length > 0 && (
                    <section className="opacity-80">
                        <div className="flex items-center gap-3 mb-6 pt-12 border-t border-white/5">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-300">Historial Completado</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {proyectosCerrados.map(proyecto => (
                                <div key={proyecto.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <DocumentTextIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
                                        <div className="truncate">
                                            <p className="text-white font-medium truncate">{proyecto.nombre}</p>
                                            <p className="text-xs text-gray-500">Finalizado</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 pl-4">
                                        <p className="font-mono text-sm text-gray-400">${proyecto.monto?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            {/* Footer */}
            <footer className="max-w-5xl mx-auto px-6 mt-24 text-center pb-8 border-t border-white/5 pt-8">
                <p className="text-gray-600 text-sm">Este es un enlace privado autogenerado. Por favor no lo compartas.</p>
                <p className="text-gray-700 text-xs mt-2">Powered by Onyx Agency System</p>
            </footer>

        </div >
    );
}
