"use client";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";

// Definimos las columnas y sus colores
const COLUMNS = [
    { id: "pendiente", title: "Pendiente", color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
    { id: "en_proceso", title: "En Proceso", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
    { id: "revision", title: "En Revisión", color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
    { id: "finalizado", title: "Finalizado", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
];

interface Props {
    proyectos: any[];
    onStatusChange: (id: string, newStatus: string) => void;
}

export default function ProjectKanban({ proyectos, onStatusChange }: Props) {

    // Agrupamos proyectos por columna
    const boardData = useMemo(() => {
        const data: Record<string, any[]> = { pendiente: [], en_proceso: [], revision: [], finalizado: [] };
        proyectos.forEach((p) => {
            // Si el estado no existe en nuestras columnas (ej: 'borrador'), lo mandamos a pendiente
            const estado = data[p.estado] ? p.estado : "pendiente";
            data[estado].push(p);
        });
        return data;
    }, [proyectos]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const proyectoId = active.id as string;
        const nuevoEstado = over.id as string;

        // Solo actualizamos si cambió de columna
        const proyectoActual = proyectos.find(p => p.id === proyectoId);
        if (proyectoActual && proyectoActual.estado !== nuevoEstado) {
            onStatusChange(proyectoId, nuevoEstado);
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px] overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn key={col.id} id={col.id} title={col.title} colorClass={col.color} projects={boardData[col.id]} />
                ))}
            </div>
        </DndContext>
    );
}

// --- Subcomponentes ---

function KanbanColumn({ id, title, colorClass, projects }: { id: string, title: string, colorClass: string, projects: any[] }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`flex flex-col rounded-xl border p-3 h-full min-h-[400px] backdrop-blur-sm ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-sm uppercase tracking-wider ${colorClass.split(" ")[2]}`}>{title}</h3>
                <span className="text-xs font-mono opacity-50 bg-black/20 px-2 py-1 rounded-md">{projects.length}</span>
            </div>

            <div className="flex-1 space-y-3">
                {projects.map((p) => (
                    <DraggableCard key={p.id} project={p} />
                ))}
                {projects.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-xs text-white/20">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableCard({ project }: { project: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

    // Formato de dinero
    const monto = new Intl.NumberFormat('en-US', { style: 'currency', currency: project.moneda || 'USD', maximumFractionDigits: 0 }).format(project.monto);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 p-3 rounded-lg cursor-grab active:cursor-grabbing shadow-lg transition group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-emerald-400 font-medium truncate max-w-[120px]">
                    {project.clientes?.nombre || "Sin Cliente"}
                </span>
                <span className="text-xs text-white/50">{project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString() : ''}</span>
            </div>

            <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{project.nombre}</h4>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                <span className="text-white font-mono text-sm">{monto}</span>
                {/* Pequeño indicador de prioridad si existe */}
                {project.prioridad === 'alta' && <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}
            </div>
        </div>
    );
}
