export type ProyectoProveedor = {
    id: string;
    workspace_id: string;
    proveedor_id: string;
    nombre: string;
    descripcion?: string | null;
    monto: number;
    moneda: string;
    estado: 'pendiente' | 'en_progreso' | 'completado';
    fecha_pago?: string | null;
    created_at: string;
    pagos_proveedor?: PagoProveedor[];
};

export type Proveedor = {
    id: string;
    workspace_id: string;
    nombre: string;
    empresa?: string | null;
    email?: string | null;
    telefono?: string | null;
    especialidad?: string | null;
    moneda: string;
    nit?: string | null;
    notas?: string | null;
    activo: boolean;
    created_at: string;
    pagos_proveedor?: PagoProveedor[];
    proyectos_proveedor?: ProyectoProveedor[];
};

export type PagoProveedor = {
    id: string;
    workspace_id: string;
    proveedor_id: string;
    proyecto_proveedor_id?: string | null;
    cuenta_id?: string | null;
    monto: number;
    moneda: string;
    fecha_pago: string;
    descripcion?: string | null;
    estado: 'pendiente' | 'pagado';
    comprobante_url?: string | null;
    created_at: string;
};
