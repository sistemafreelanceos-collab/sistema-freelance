// Agregamos 'Cobro' a las categorías y tipos
export type Categoria = "Urgente" | "Diseño" | "Dev" | "Reunión" | "Admin" | "Pagos" | "Proyecto" | "Cobro";
export type TipoNota = "amarillo" | "rojo" | "azul" | "verde";

export type EventoCalendario = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    descripcion?: string;
    categoria: Categoria | string;
    completada?: boolean;
    es_automatico?: boolean;
    // Agregamos 'cobro' aquí
    tipo_evento: 'tarea' | 'gasto' | 'proyecto' | 'cobro';
    monto?: number;
    colorOverride?: string;
    className?: string;
    projectId?: string;
  };
};

export type PostIt = {
    id: string; 
    texto: string; 
    fecha: string; 
    color: TipoNota; 
    rotacion: number;
};

export const CATEGORIAS_COLORS: Record<string, string> = {
  Urgente: "#EF4444", 
  Diseño: "#8B5CF6", 
  Dev: "#3B82F6", 
  Reunión: "#EAB308", 
  Admin: "#6B7280", 
  Pagos: "#EF4444", // Rojo (Salida de dinero)
  Cobro: "#10B981", // Verde (Entrada de dinero) <--- NUEVO
  Proyecto: "#6366F1"
};

export const POSTIT_STYLES: Record<TipoNota, string> = {
  amarillo: "bg-[#FEF08A] text-yellow-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
  rojo:     "bg-[#FECACA] text-red-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
  azul:     "bg-[#BFDBFE] text-blue-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
  verde:    "bg-[#BBF7D0] text-green-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
};