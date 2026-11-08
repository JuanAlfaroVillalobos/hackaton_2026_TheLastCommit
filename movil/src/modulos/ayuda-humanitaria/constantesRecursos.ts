// Ruta: src/modulos/ayuda-humanitaria/constantesRecursos.ts
// Textos, iconos y colores de los recursos críticos (RF39). Si se agrega un tipo nuevo, solo se toca aquí y en tipos.ts.
import type { EstadoRecurso, ModoRecurso, TipoRecurso } from "./tipos";

export const MODOS_RECURSO: ModoRecurso[] = ["OFREZCO", "NECESITO"];

export const ETIQUETA_MODO_RECURSO: Record<ModoRecurso, string> = {
  OFREZCO: "Ofrezco",
  NECESITO: "Necesito",
};

/** Botón que ve OTRO vecino: quien necesita recibe «Lo tengo»; quien ofrece recibe «Lo necesito». */
export const ACCION_RECURSO: Record<ModoRecurso, string> = {
  NECESITO: "Lo tengo",
  OFREZCO: "Lo necesito",
};

export const COLOR_MODO_RECURSO: Record<ModoRecurso, string> = {
  OFREZCO: "#4ADE80",
  NECESITO: "#FFC400",
};

export const TIPOS_RECURSO: TipoRecurso[] = [
  "AGUA",
  "ALIMENTOS",
  "MEDICINAS",
  "REFUGIO",
  "TRANSPORTE",
  "HERRAMIENTAS",
  "ENERGIA",
  "CARGA_CELULARES",
];

export const ETIQUETA_TIPO_RECURSO: Record<TipoRecurso, string> = {
  AGUA: "Agua",
  ALIMENTOS: "Alimentos",
  MEDICINAS: "Medicinas",
  REFUGIO: "Refugio",
  TRANSPORTE: "Transporte",
  HERRAMIENTAS: "Herramientas",
  ENERGIA: "Energía",
  CARGA_CELULARES: "Carga de celulares",
};

export const ICONO_TIPO_RECURSO: Record<TipoRecurso, string> = {
  AGUA: "💧",
  ALIMENTOS: "🍲",
  MEDICINAS: "💊",
  REFUGIO: "🏠",
  TRANSPORTE: "🚗",
  HERRAMIENTAS: "🛠️",
  ENERGIA: "🔋",
  CARGA_CELULARES: "📱",
};

export const ETIQUETA_ESTADO_RECURSO: Record<EstadoRecurso, string> = {
  ABIERTO: "Abierto",
  ASIGNADO: "Asignado",
  CERRADO: "Cerrado",
};

export const COLOR_ESTADO_RECURSO: Record<EstadoRecurso, string> = {
  ABIERTO: "#FFC400",
  ASIGNADO: "#4ADE80",
  CERRADO: "#9E9E9E",
};
