"use client";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DropAnimation,
    CollisionDetection,
    pointerWithin,
    rectIntersection,
    DragOverEvent
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
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

    // Track active item being dragged for immediate UI updates
    const [items, setItems] = useState(proyectos);

    useMemo(() => {
        setItems(proyectos);
    }, [proyectos]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const boardData = useMemo(() => {
        const data: Record<string, any[]> = { pendiente: [], en_proceso: [], revision: [], finalizado: [] };
        items.forEach((p) => {
            const estado = data[p.estado] ? p.estado : "pendiente";
            data[estado].push(p);
        });
        return data;
    }, [items]);

    const activeProject = useMemo(() =>
        items.find((p) => p.id === activeId),
        [activeId, items]);

    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }
        return rectIntersection(args);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveProject = items.some(p => p.id === activeId);
        const isOverProject = items.some(p => p.id === overId);

        if (!isActiveProject) return;

        setItems((prev) => {
            const activeItems = [...prev];
            const activeIndex = activeItems.findIndex(p => p.id === activeId);

            if (isOverProject) {
                const overIndex = activeItems.findIndex(p => p.id === overId);
                const overItem = activeItems[overIndex];

                if (activeItems[activeIndex].estado !== overItem.estado) {
                    activeItems[activeIndex] = { ...activeItems[activeIndex], estado: overItem.estado };
                }
            } else {
                const isOverColumn = COLUMNS.some(col => col.id === overId);
                if (isOverColumn) {
                    activeItems[activeIndex] = { ...activeItems[activeIndex], estado: overId as string };
                }
            }

            return activeItems;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) {
            setItems(proyectos); // Revert to original if dropped outside
            return;
        }

        const proyectoId = active.id as string;
        const overId = over.id as string;
        let nuevoEstado = overId;

        const isOverProject = items.some(p => p.id === overId);
        if (isOverProject) {
            nuevoEstado = items.find(p => p.id === overId)?.estado || "pendiente";
        }

        const proyectoOriginal = proyectos.find(p => p.id === proyectoId);
        if (proyectoOriginal && proyectoOriginal.estado !== nuevoEstado) {
            onStatusChange(proyectoId, nuevoEstado);
        } else {
            setItems(proyectos); // Revert if no status change occurred
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
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

            <DragOverlay dropAnimation={dropAnimation}>
                {activeProject ? (
                    <ProjectCard project={activeProject} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ id, title, colorClass, projects }: { id: string, title: string, colorClass: string, projects: any[] }) {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
            type: "Column",
            column: id
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-xl border p-3 h-full min-h-[400px] transition-colors duration-200 
                backdrop-blur-sm
                ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-sm uppercase tracking-wider ${colorClass.split(" ")[2]}`}>{title}</h3>
                <span className="text-xs font-mono opacity-50 bg-black/20 px-2 py-1 rounded-md">{projects.length}</span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {projects.map((p) => (
                        <SortableCard key={p.id} project={p} />
                    ))}
                </SortableContext>
                {projects.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-xs text-white/20">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableCard({ project }: { project: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: project.id,
        data: {
            type: "Project",
            project,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 grayscale border border-dashed border-white/20 p-3 rounded-lg h-[100px] bg-black/20"
            />
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <ProjectCard project={project} />
        </div>
    );
}

function ProjectCard({ project, isOverlay = false }: { project: any, isOverlay?: boolean }) {
    const monto = new Intl.NumberFormat('en-US', { style: 'currency', currency: project.moneda || 'USD', maximumFractionDigits: 0 }).format(project.monto);

    return (
        <div className={`
            bg-[#1C2128] border p-4 rounded-xl shadow-lg transition-colors duration-200 group
            ${isOverlay
                ? 'rotate-2 scale-105 border-emerald-500/50 shadow-2xl cursor-grabbing'
                : 'border-white/10 hover:border-white/30 hover:bg-[#252b33] cursor-grab'
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
