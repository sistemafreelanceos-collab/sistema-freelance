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
  is_principal?: boolean;
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