export type Habito = {
  id: string;
  nombre: string;
  icono: string;
  racha_actual?: number; // Calculado en el front
  completado_hoy?: boolean; // Calculado en el front
};

export type SesionFocus = {
  id: string;
  duracion_minutos: number;
  logros: string;
  fecha: string;
};

export type DataCorrelacion = {
  fecha: string;
  nivel_habitos: number; // % de cumplimiento ese día
  facturacion: number;   // $ ganado ese día
};