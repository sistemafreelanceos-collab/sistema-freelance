export type FrecuenciaPago = "semanal" | "quincenal" | "mensual" | "bimestral" | "anual" | "unidad";
export type Moneda = "USD" | "COP" | "EUR" | "MXN";
export type EstadoProyecto = "pendiente" | "en_progreso" | "revision" | "finalizado";

export type Proyecto = {
    id: string;
    nombre: string;
    monto: number;
    moneda: string;
    estado: EstadoProyecto;
    fecha_inicio?: string;
    fecha_fin?: string;
    frecuencia_pago?: string;
    cliente_id: string;
    entregables_totales: number;
    entregables_listos: number;
    gastos?: { monto: number }[];
    // NUEVO: Historial de pagos específico del proyecto
    pagos_cliente?: {
        id: string;
        monto: number;
        fecha_pago: string;
        referencia?: string;
    }[];
};

export type Cliente = {
    id: string;
    owner_id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    empresa: string | null;
    estado: "activo" | "inactivo" | "prospecto";
    nota: string | null;
    monto: number | null;
    moneda: Moneda;
    frecuencia_pago: FrecuenciaPago;
    proximo_pago: string | null;
    created_at: string;
    pagos_cliente?: { monto: number }[];
    proyectos?: Proyecto[];
};

export type PackServicio = {
    id: string;
    nombre: string;
    precio_base: number;
    moneda: string;
    descripcion: string;
};

export type Cuenta = {
    id: string;
    nombre: string;
    moneda: string;
    banco: string | null;
    tipo: string | null;
    numero: string | null;
    is_principal?: boolean;
    saldo_calculado?: number;
};

export type PagoHistorial = {
    id: string;
    fecha_pago: string;
    monto: number;
    moneda: string;
    referencia: string | null;
    nota: string | null;
    cuenta?: { nombre: string } | null;
};

export type Movimiento = {
    id: string;
    created_at?: string;
    owner_id?: string;
    tipo: 'ingreso' | 'egreso' | 'saldo_inicial';
    monto: number;
    moneda?: string;
    referencia: string;
    categoria: string;
    fecha: string;
    cuenta_id?: string;
    cuenta_nombre?: string;
    fuente?: string;
    proyecto_id?: string; // Nuevo
};

export type ProyectoStats = {
    id: string;
    nombre: string;
    ingresos: number;
    gastos: number;
    rentabilidad: number;
    margen: number;
};

export type GastoFijo = {
    id: string;
    created_at?: string;
    nombre: string;
    monto: number;
    dia_pago: number;
    activo: boolean;
    categoria: string;
    moneda?: string;
    owner_id?: string;
    ultimo_pago?: string;
};

export type Presupuesto = {
    id: string;
    categoria: string;
    monto_limite: number;
    moneda?: string;
    owner_id?: string;
};

export type ConfigFinanzas = {
    id?: string;
    owner_id?: string;
    porcentaje_ahorro: number;
    meta_mensual?: number;
    meta_moneda?: string;
};

export type UserXP = {
    xp_total: number;
    nivel: number;
    owner_id?: string;
};

// --- CONFIGURACIÓN TYPES ---
export interface ConfigPerfil {
    // Columnas reales de la BD
    nombre: string;        // Antes nombre_completo
    empresa: string;       // Antes branding_legal
    telefono: string;
    direccion: string;     // Antes ubicacion
    email: string;         // Readonly visualmente
    avatar_url: string;

    // Configuración visual/sistema
    color_tema: string;
    branding_logo_url: string;
    firma_digital_url: string;

    // Finanzas
    datos_fiscales: string;
    monedas_activas: string[];
    meta_mensual: number;
    meta_moneda: string;
    limite_horas_diario: number;

    // Suscripción (Migrado de PerfilPage)
    plan?: "gratis" | "premium";
    plan_status?: "active" | "inactive";
    plan_renovacion?: string | null;

    // Campos visuales extras (No en BD aún, los mantendremos en UI pero no guardarán si no hay columna, 
    // o usaremos 'datos_fiscales' JSON si el usuario quiere)
    titulo_profesional?: string;
    bio?: string;
    website?: string;

    // Mapeos de compatibilidad para no romper otros componentes
    branding_legal?: string; // Mapear a 'empresa'
    nombre_completo?: string; // Mapear a 'nombre'
    email_contacto?: string; // Mapear a 'email'
    ubicacion?: string; // Mapear a 'direccion'
}

export interface PlantillaContrato {
    id: string;
    titulo: string;
    contenido: string;
}

export interface Clausula {
    id: string;
    titulo: string;
    contenido: string;
}

export interface PlantillaServicio {
    id: string;
    nombre: string;
    descripcion: string;
    precio_base: number;
    moneda: string;
}

// --- CALENDARIO TYPES ---
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
    Pagos: "#EF4444",
    Cobro: "#10B981",
    Proyecto: "#6366F1"
};

export const POSTIT_STYLES: Record<TipoNota, string> = {
    amarillo: "bg-[#FEF08A] text-yellow-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
    rojo: "bg-[#FECACA] text-red-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
    azul: "bg-[#BFDBFE] text-blue-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
    verde: "bg-[#BBF7D0] text-green-900 shadow-[4px_4px_15px_rgba(0,0,0,0.2)]",
};
export type Notification = {
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    message: string | null;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link: string | null;
};

// --- WORKSPACE TYPES ---
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export type Workspace = {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    owner_id: string;
    created_at: string;
};

export type WorkspaceMember = {
    id: string;
    workspace_id: string;
    user_id: string;
    role: WorkspaceRole;
    joined_at: string;
};
