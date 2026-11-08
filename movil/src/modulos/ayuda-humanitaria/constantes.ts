// Ruta: src/modulos/ayuda-humanitaria/constantes.ts
// Los colores de la interfaz vienen del tema compartido (`useTema()`); aquí solo van los de estado,
// que significan lo mismo en cualquier tema.
import type { EstadoReporte, EstadoVecino, TipoVulnerabilidad } from "./tipos";

export const COLOR_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "#FF5252",
  SIN_RESPONDER: "#FFC400",
  A_SALVO: "#4ADE80",
};

// El color nunca va solo: cada estado lleva también un icono y un texto.
// 🆘 pide ayuda · 📵 no contesta el teléfono · ✓ está bien.
export const ICONO_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "🆘",
  SIN_RESPONDER: "📵",
  A_SALVO: "✓",
};

export const ETIQUETA_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "Necesita ayuda",
  SIN_RESPONDER: "Sin responder",
  A_SALVO: "A salvo",
};

// ---- RF38: reporte de vulnerabilidad ----
export const TIPOS_VULNERABILIDAD: TipoVulnerabilidad[] = [
  "HERIDO",
  "ADULTO_MAYOR_O_DISCAPACIDAD",
  "NINOS_SOLOS",
  "SIN_AGUA_ALIMENTOS",
  "VIVIENDA_DANADA",
  "OTRO",
];

export const ETIQUETA_TIPO_VULNERABILIDAD: Record<TipoVulnerabilidad, string> = {
  HERIDO: "Persona herida",
  ADULTO_MAYOR_O_DISCAPACIDAD: "Adulto mayor o con discapacidad, solo",
  NINOS_SOLOS: "Niños solos",
  SIN_AGUA_ALIMENTOS: "Sin agua o alimentos",
  VIVIENDA_DANADA: "Vivienda dañada",
  OTRO: "Otro",
};

export const ICONO_TIPO_VULNERABILIDAD: Record<TipoVulnerabilidad, string> = {
  HERIDO: "🩹",
  ADULTO_MAYOR_O_DISCAPACIDAD: "🧓",
  NINOS_SOLOS: "👶",
  SIN_AGUA_ALIMENTOS: "💧",
  VIVIENDA_DANADA: "🏚️",
  OTRO: "📝",
};

export const ETIQUETA_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  ABIERTO: "Abierto",
  EN_ATENCION: "En atención",
  RESUELTO: "Resuelto",
};

/** Tipos de reporte que van primero en la lista de emergencia: lo más urgente. */
export const TIPOS_CRITICOS: TipoVulnerabilidad[] = ["HERIDO", "NINOS_SOLOS"];

/** Nombre corto para la etiqueta bajo el pin del mapa. */
export const ETIQUETA_CORTA_TIPO_VULNERABILIDAD: Record<TipoVulnerabilidad, string> = {
  HERIDO: "Herido",
  ADULTO_MAYOR_O_DISCAPACIDAD: "Adulto mayor",
  NINOS_SOLOS: "Niños solos",
  SIN_AGUA_ALIMENTOS: "Sin agua",
  VIVIENDA_DANADA: "Vivienda",
  OTRO: "Otro",
};

export const COLOR_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  ABIERTO: "#FF5252",
  EN_ATENCION: "#FFC400",
  RESUELTO: "#4ADE80",
};
/** Color del marcador de un reporte de vulnerabilidad en el mapa del tablero. */
export const COLOR_MARCADOR_REPORTE = "#E53935";