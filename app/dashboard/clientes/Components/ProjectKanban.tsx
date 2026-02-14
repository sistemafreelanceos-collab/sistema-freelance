"use client";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    pointerWithin, // 🟢 MEJORA: Detección basada en el puntero
    defaultDropAnimationSideEffects,
    DropAnimation,
    CollisionDetection,
    rectIntersection
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useMemo, useState } from "react";

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

// Configuración de animación para que se sienta suave al soltar
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export default function ProjectKanban({ proyectos, onStatusChange }: Props) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // 1. SENSORES: Evitamos drags accidentales (requiere mover 5px para activar)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 2,
            },
        })
    );

    // Agrupamos proyectos por columna
    const boardData = useMemo(() => {
        const data: Record<string, any[]> = { pendiente: [], en_proceso: [], revision: [], finalizado: [] };
        proyectos.forEach((p) => {
            const estado = data[p.estado] ? p.estado : "pendiente";
            data[estado].push(p);
        });
        return data;
    }, [proyectos]);

    // Encontrar el proyecto activo para el Overlay
    const activeProject = useMemo(() =>
        proyectos.find((p) => p.id === activeId),
        [activeId, proyectos]);

    // 2. MEJORA: Algoritmo de colisión híbrido
    // Para Kanban, pointerWithin es mucho mejor para "sentir" que el puntero está dentro de la columna.
    // Usamos una función personalizada para máxima precisión.
    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        // Primero intentamos detectar si el puntero está explícitamente sobre una columna
        const pointerCollisions = pointerWithin(args);

        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        // Si no (ej. movimiento muy rápido), usamos la intersección de rectángulos como fallback
        return rectIntersection(args);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null); // Limpiamos el estado activo siempre

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
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection} // 🟢 USAR ALGORITMO MEJORADO
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px] overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        colorClass={col.color}
                        projects={boardData[col.id]}
                    />
                ))}
            </div>

            {/* 3. DRAG OVERLAY: El elemento "fantasma" que sigue al mouse */}
            <DragOverlay dropAnimation={dropAnimation}>
                {activeProject ? (
                    <ProjectCard project={activeProject} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// --- Subcomponentes ---

function KanbanColumn({ id, title, colorClass, projects }: { id: string, title: string, colorClass: string, projects: any[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-xl border p-3 h-full min-h-[400px] transition-colors duration-200 
                ${isOver ? 'bg-white/5 ring-2 ring-white/10' : 'backdrop-blur-sm'} 
                ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}
        >
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

// Lógica de arrastre
function DraggableCard({ project }: { project: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id });

    // Si se está arrastrando, ocultamos el original (pero mantenemos el espacio)
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="opacity-30 grayscale border border-dashed border-white/20 p-3 rounded-lg h-[100px] bg-black/20"
            />
        );
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes}>
            <ProjectCard project={project} />
        </div>
    );
}

// Componente Visual Puro (reutilizado en el Overlay y en la lista)
function ProjectCard({ project, isOverlay = false }: { project: any, isOverlay?: boolean }) {
    // Formato de dinero
    const monto = new Intl.NumberFormat('en-US', { style: 'currency', currency: project.moneda || 'USD', maximumFractionDigits: 0 }).format(project.monto);

    return (
        <div className={`
            bg-[#1C2128] border p-4 rounded-xl shadow-lg transition-colors duration-200 group
            ${isOverlay
                ? 'rotate-2 scale-105 border-emerald-500/50 shadow-2xl cursor-grabbing' // Estilo cuando está flotando
                : 'border-white/10 hover:border-white/30 hover:bg-[#252b33] cursor-grab' // Estilo normal
            }
        `}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-emerald-400 font-medium truncate max-w-[120px] bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {project.clientes?.nombre || "Sin Cliente"}
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                    {project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                </span>
            </div>

            <h4 className="text-white font-bold text-sm mb-3 leading-snug">{project.nombre}</h4>

            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="text-white/90 font-mono text-sm font-bold tracking-tight">{monto}</span>
                {/* Indicador de prioridad */}
                {project.prioridad === 'alta' && (
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] text-red-400 font-bold uppercase">Urgente</span>
                    </div>
                )}
            </div>
        </div>
    );
}
