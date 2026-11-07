// Ruta: src/modulos/ayuda-humanitaria/reglas.ts
// Reglas puras y testeables (sin React ni Firebase).
import type {
  Coordenada,
  EstadoVecino,
  ReporteVulnerabilidad,
  TipoVulnerabilidad,
  VecinoEmergencia,
} from "./tipos";

/** RF22: en el mapa solo se muestran los vecinos NECESITA_AYUDA o SIN_RESPONDER. */
export function requiereAtencion(estado: EstadoVecino): boolean {
  return estado === "NECESITA_AYUDA" || estado === "SIN_RESPONDER";
}

/** «hace 3 min», «hace 2 h»… a partir de una marca de tiempo en milisegundos. */
export function tiempoDesde(marcaMs: number, ahoraMs: number): string {
  const minutos = Math.max(0, Math.floor((ahoraMs - marcaMs) / 60_000));
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

/** Primero los que piden ayuda; dentro de cada grupo, la alerta más reciente primero. */
export function ordenarPorUrgencia(vecinos: VecinoEmergencia[]): VecinoEmergencia[] {
  const peso = (e: EstadoVecino) => (e === "NECESITA_AYUDA" ? 0 : 1);
  return [...vecinos].sort(
    (a, b) => peso(a.estado) - peso(b.estado) || b.ultimaAlertaEn - a.ultimaAlertaEn,
  );
}

// ---- RF38: reporte de vulnerabilidad ----
export const MAX_NOTA = 60;
export const MIN_PERSONAS = 1;
export const MAX_PERSONAS = 99;

export type BorradorReporte = {
  tipo: TipoVulnerabilidad | null;
  personas: number;
  nota: string;
  ubicacion: Coordenada | null;
};

export function limitarPersonas(n: number): number {
  return Math.min(MAX_PERSONAS, Math.max(MIN_PERSONAS, Math.round(n)));
}

/** Devuelve los problemas del borrador; lista vacía = se puede enviar. */
export function validarReporte(b: BorradorReporte): string[] {
  const errores: string[] = [];
  if (!b.tipo) errores.push("Elige qué ocurre.");
  if (b.personas < MIN_PERSONAS || b.personas > MAX_PERSONAS) {
    errores.push("Las personas deben ser entre 1 y 99.");
  }
  if (b.nota.length > MAX_NOTA) errores.push("La nota admite hasta 60 caracteres.");
  if (!b.ubicacion) errores.push("Falta la ubicación.");
  return errores;
}

/** Código corto de 6 caracteres para citar el reporte por SMS. */
export function generarCodigo(): string {
  let s = "";
  while (s.length < 6) s += Math.random().toString(36).slice(2).toUpperCase();
  return s.slice(0, 6);
}

/** ABIERTO → EN_ATENCION: cualquiera puede pulsar «Voy a ayudar». */
export function puedeAyudar(r: ReporteVulnerabilidad): boolean {
  return r.estado === "ABIERTO";
}

/** EN_ATENCION → RESUELTO: solo quien está atendiendo. */
export function puedeResolver(r: ReporteVulnerabilidad, uid: string): boolean {
  return r.estado === "EN_ATENCION" && r.atiendeId === uid;
}

/** Abiertos primero, luego en atención, luego resueltos; dentro de cada grupo, el más reciente primero. */
export function ordenarReportes(rs: ReporteVulnerabilidad[]): ReporteVulnerabilidad[] {
  const peso = { ABIERTO: 0, EN_ATENCION: 1, RESUELTO: 2 } as const;
  return [...rs].sort((a, b) => peso[a.estado] - peso[b.estado] || b.creadoEn - a.creadoEn);
}