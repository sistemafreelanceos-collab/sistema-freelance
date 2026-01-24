// Definimos la estructura de los datos que usamos en la configuración

export interface ConfigPerfil {
  color_tema: string;
  branding_legal: string;
  branding_logo_url: string;
  firma_digital_url: string;
  datos_fiscales: string;
  monedas_activas: string[];
  meta_mensual: number;
  meta_moneda: string; // <--- ¡NUEVO CAMPO!
  limite_horas_diario: number;
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
