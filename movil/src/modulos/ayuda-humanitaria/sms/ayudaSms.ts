// Ruta: src/modulos/ayuda-humanitaria/sms/ayudaSms.ts
// Códigos de mensaje SMS de ayuda humanitaria (README 10.4): V (reporte), R (recurso) y VR (aviso de bajada).
// Solo arma y lee el TEXTO PLANO `tipo|idMsg|ts|…campos`. Cifrar (AES-GCM), Base64URL y el prefijo `VEC1:`
// los hace `compartido/src/sms` (Persona D). Este archivo no depende de nada de React Native.
import type {
  Coordenada,
  ModoRecurso,
  NuevoRecurso,
  NuevoReporte,
  TipoRecurso,
  TipoVulnerabilidad,
} from "../tipos";

// ---- Tablas de códigos (1 carácter) ----
export const CODIGO_TIPO_VULNERABILIDAD: Record<TipoVulnerabilidad, string> = {
  HERIDO: "H",
  ADULTO_MAYOR_O_DISCAPACIDAD: "A",
  NINOS_SOLOS: "N",
  SIN_AGUA_ALIMENTOS: "S",
  VIVIENDA_DANADA: "V",
  OTRO: "O",
};
export const CODIGO_TIPO_RECURSO: Record<TipoRecurso, string> = {
  AGUA: "A",
  ALIMENTOS: "L",
  MEDICINAS: "M",
  REFUGIO: "R",
  TRANSPORTE: "T",
  HERRAMIENTAS: "H",
  ENERGIA: "E",
  CARGA_CELULARES: "C",
};
export const CODIGO_MODO_RECURSO: Record<ModoRecurso, string> = { OFREZCO: "O", NECESITO: "N" };

export const MAX_NOTA_SMS = 40;

function invertir<T extends string>(tabla: Record<T, string>): Record<string, T> {
  const r: Record<string, T> = {};
  (Object.keys(tabla) as T[]).forEach((k) => (r[tabla[k]] = k));
  return r;
}
const TIPO_VULNERABILIDAD_DE = invertir(CODIGO_TIPO_VULNERABILIDAD);
const TIPO_RECURSO_DE = invertir(CODIGO_TIPO_RECURSO);
const MODO_RECURSO_DE = invertir(CODIGO_MODO_RECURSO);

// ---- Mensajes ----
export type MensajeV = NuevoReporte & { idMsg: string; ts: number };
export type MensajeR = NuevoRecurso & { idMsg: string; ts: number };
export type AvisoVR = {
  idMsg: string;
  ts: number;
  codigo: string;
  tipo: TipoVulnerabilidad;
  personas: number;
} & Coordenada;

export class SmsInvalido extends Error {
  constructor(motivo: string) {
    super(`Mensaje no válido: ${motivo}`);
    this.name = "SmsInvalido";
  }
}

// ---- Helpers de formato ----
/** Segundo 0 del protocolo: 2026-01-01 00:00 UTC. */
export const EPOCA_SMS_MS = Date.UTC(2026, 0, 1);
const ALFABETO_ID = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nuevoIdMsg(azar: () => number = Math.random): string {
  let id = "";
  for (let i = 0; i < 6; i++) id += ALFABETO_ID[Math.floor(azar() * 36)];
  return id;
}

const aBase36 = (n: number): string => Math.round(n).toString(36);
const deBase36 = (t: string, campo: string): number => {
  if (!/^-?[0-9a-z]+$/.test(t)) throw new SmsInvalido(campo);
  const n = parseInt(t, 36);
  if (!Number.isFinite(n)) throw new SmsInvalido(campo);
  return n;
};
const coordA = (grados: number): string => aBase36(grados * 1e4);
const coordDe = (t: string, campo: string): number => deBase36(t, campo) / 1e4;
const tsA = (ms: number): string => aBase36(Math.max(0, (ms - EPOCA_SMS_MS) / 1000));
const tsDe = (t: string): number => EPOCA_SMS_MS + deBase36(t, "ts") * 1000;

/** La nota no puede llevar «|» ni saltos de línea (son el separador del protocolo). */
export function limpiarNota(nota: string): string {
  return nota.replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NOTA_SMS);
}

function campos(texto: string, tipo: string, cantidad: number): string[] {
  const partes = texto.split("|");
  if (partes[0] !== tipo) throw new SmsInvalido("tipo");
  // La nota (último campo de V) podría quedar vacía; se acepta con un campo menos solo si cantidad lo permite.
  if (partes.length < cantidad) throw new SmsInvalido("campos");
  if (!/^[0-9a-z]{6}$/.test(partes[1])) throw new SmsInvalido("idMsg");
  return partes;
}

// ---- V: reporte de vulnerabilidad (subida) ----
// V|idMsg|ts|tipo|personas|lat|lng|nota
export function codificarV(d: NuevoReporte, idMsg: string, ahora: number): string {
  const personas = Math.min(99, Math.max(1, Math.round(d.personas)));
  return [
    "V",
    idMsg,
    tsA(ahora),
    CODIGO_TIPO_VULNERABILIDAD[d.tipo],
    aBase36(personas),
    coordA(d.lat),
    coordA(d.lng),
    limpiarNota(d.nota),
  ].join("|");
}

export function decodificarV(texto: string): MensajeV {
  const p = campos(texto, "V", 7);
  const tipo = TIPO_VULNERABILIDAD_DE[p[3]];
  if (!tipo) throw new SmsInvalido("tipo de reporte");
  const personas = deBase36(p[4], "personas");
  if (personas < 1 || personas > 99) throw new SmsInvalido("personas");
  return {
    idMsg: p[1],
    ts: tsDe(p[2]),
    tipo,
    personas,
    lat: coordDe(p[5], "lat"),
    lng: coordDe(p[6], "lng"),
    nota: limpiarNota(p.slice(7).join(" ")),
  };
}

// ---- R: recurso crítico (subida) ----
// R|idMsg|ts|modo|tipo|cantidad|lat|lng
export function codificarR(d: NuevoRecurso, idMsg: string, ahora: number): string {
  return [
    "R",
    idMsg,
    tsA(ahora),
    CODIGO_MODO_RECURSO[d.modo],
    CODIGO_TIPO_RECURSO[d.tipo],
    aBase36(Math.max(1, d.cantidad)),
    coordA(d.lat),
    coordA(d.lng),
  ].join("|");
}

export function decodificarR(texto: string): MensajeR {
  const p = campos(texto, "R", 8);
  const modo = MODO_RECURSO_DE[p[3]];
  const tipo = TIPO_RECURSO_DE[p[4]];
  if (!modo) throw new SmsInvalido("modo");
  if (!tipo) throw new SmsInvalido("tipo de recurso");
  const cantidad = deBase36(p[5], "cantidad");
  if (cantidad < 1) throw new SmsInvalido("cantidad");
  return {
    idMsg: p[1],
    ts: tsDe(p[2]),
    modo,
    tipo,
    cantidad,
    lat: coordDe(p[6], "lat"),
    lng: coordDe(p[7], "lng"),
  };
}

// ---- VR: aviso de reporte cercano (bajada) ----
// VR|idMsg|ts|codigo|tipo|personas|lat|lng
export function codificarVR(
  a: { codigo: string; tipo: TipoVulnerabilidad; personas: number } & Coordenada,
  idMsg: string,
  ahora: number,
): string {
  return [
    "VR",
    idMsg,
    tsA(ahora),
    a.codigo,
    CODIGO_TIPO_VULNERABILIDAD[a.tipo],
    aBase36(a.personas),
    coordA(a.lat),
    coordA(a.lng),
  ].join("|");
}

export function decodificarVR(texto: string): AvisoVR {
  const p = campos(texto, "VR", 8);
  const tipo = TIPO_VULNERABILIDAD_DE[p[4]];
  if (!tipo) throw new SmsInvalido("tipo de reporte");
  if (!/^[0-9A-Za-z]{6}$/.test(p[3])) throw new SmsInvalido("codigo");
  return {
    idMsg: p[1],
    ts: tsDe(p[2]),
    codigo: p[3],
    tipo,
    personas: deBase36(p[5], "personas"),
    lat: coordDe(p[6], "lat"),
    lng: coordDe(p[7], "lng"),
  };
}

// ---- Presupuesto de segmentos (README 10.4) ----
const LARGO_PREFIJO = 5; // «VEC1:»
const SOBRECARGA_CIFRADO = 12 + 16; // nonce + tag AES-GCM
export const MAX_CARACTERES_SMS = 160; // 1 segmento GSM-7
export const MAX_CARACTERES_2_SEGMENTOS = 306;

function bytesUtf8(texto: string): number {
  let n = 0;
  for (const c of texto) {
    const cp = c.codePointAt(0) ?? 0;
    n += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return n;
}

/** Largo del SMS final: `VEC1:` + Base64URL(nonce ‖ cifrado ‖ tag), sin relleno «=». */
export function largoSmsEstimado(textoPlano: string): number {
  const bytes = bytesUtf8(textoPlano) + SOBRECARGA_CIFRADO;
  return LARGO_PREFIJO + Math.ceil((bytes * 4) / 3);
}

export function cabeEnUnSegmento(textoPlano: string): boolean {
  return largoSmsEstimado(textoPlano) <= MAX_CARACTERES_SMS;
}