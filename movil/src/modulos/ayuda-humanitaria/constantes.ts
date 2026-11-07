// Ruta: src/modulos/ayuda-humanitaria/constantes.ts
// Paleta del modo emergencia propuesta por el equipo (oscura). Cuando Jamila publique
// `compartido/tema`, estos valores se reemplazan por useTema() sin tocar las pantallas.
import type { EstadoReporte, EstadoVecino, TipoVulnerabilidad } from "./tipos";

export const TEMA_EMERGENCIA = {
  fondo: "#140B0B",
  superficie: "#231212",
  primario: "#FF5252",
  primarioOscuro: "#B71C1C",
  sobrePrimario: "#1A0000",
  acento: "#FFC400",
  texto: "#FFF1F1",
  textoSecundario: "#E0B4B4",
  borde: "#4A2323",
  alertaFondo: "#B71C1C",
} as const;

export const COLOR_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "#FF5252",
  SIN_RESPONDER: "#FFC400",
  ESTOY_BIEN: "#4ADE80",
};

// El color nunca va solo: cada estado lleva también un icono y un texto.
// 🆘 pide ayuda · 📵 no contesta el teléfono · ✓ está bien.
export const ICONO_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "🆘",
  SIN_RESPONDER: "📵",
  ESTOY_BIEN: "✓",
};

export const ETIQUETA_ESTADO: Record<EstadoVecino, string> = {
  NECESITA_AYUDA: "Necesita ayuda",
  SIN_RESPONDER: "Sin responder",
  ESTOY_BIEN: "Está bien",
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

export const COLOR_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  ABIERTO: "#FF5252",
  EN_ATENCION: "#FFC400",
  RESUELTO: "#4ADE80",
};