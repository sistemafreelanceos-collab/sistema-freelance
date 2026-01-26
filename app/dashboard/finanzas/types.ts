export type Movimiento = {
  id: string;
  fecha: string;
  referencia: string; // <--- CAMBIO: Nombre correcto de columna
  monto: number;
  tipo: "ingreso" | "egreso" | "saldo_inicial";
  categoria: string;
  proyecto_id?: string;
  cuenta_id?: string;
  cuenta_nombre?: string;
  moneda: string;
  fuente?: string;
};

export type GastoFijo = {
  id: string;
  nombre: string;
  monto: number;
  dia_pago: number;
  categoria: string;
  activo: boolean;
  moneda: string;
  ultimo_pago?: string; // Nuevo campo
};
export type Presupuesto = {
  id: string;
  categoria: string;
  monto_limite: number;
};

export type ConfigFinanzas = {
  porcentaje_ahorro: number;
};

export type ProyectoStats = {
  id: string;
  nombre: string;
  ingresos: number;
  gastos: number;
  rentabilidad: number;
  margen: number;
};