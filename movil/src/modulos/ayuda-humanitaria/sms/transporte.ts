// Ruta: src/modulos/ayuda-humanitaria/sms/transporte.ts
// PUENTE TEMPORAL del envío por SMS. La interfaz es la misma que usará el transporte real de Manuel
// (D5: `transporteSms.enviar(tipo, datos)`): cuando exista, se llama a `registrarTransporteSms(...)` una vez
// al iniciar la app y el resto del módulo no cambia.
import { guardarLocal, leerLocal } from "../servicios/almacen";
import type { NuevoRecurso, NuevoReporte } from "../tipos";
import { codificarR, codificarV, nuevoIdMsg } from "./ayudaSms";

export type ResultadoSms = {
  idMsg: string;
  /** ENVIADO: ya salió por SMS. PENDIENTE: quedó en cola local esperando poder salir. */
  estado: "ENVIADO" | "PENDIENTE";
};

export type TransporteSms = {
  enviar(tipo: "V", datos: NuevoReporte): Promise<ResultadoSms>;
  enviar(tipo: "R", datos: NuevoRecurso): Promise<ResultadoSms>;
};

/** Simulador: arma el texto plano real (V o R) y lo deja en una cola en memoria. No manda ningún SMS. */
type Pendiente = { idMsg: string; texto: string; creadoEn: number };
const colaSimulada: Pendiente[] = [];
const CLAVE_COLA = "ah.colaSms";

function persistirCola(): void {
  void guardarLocal(CLAVE_COLA, colaSimulada);
}

/** Recupera los pendientes guardados en el teléfono (si se cerró la app sin internet). Devuelve cuántos había. */
export async function restaurarCola(): Promise<number> {
  const guardados = (await leerLocal<Pendiente[]>(CLAVE_COLA)) ?? [];
  const nuevos = guardados.filter((g) => !colaSimulada.some((c) => c.idMsg === g.idMsg));
  colaSimulada.unshift(...nuevos);
  return colaSimulada.length;
}

export const transporteSimulado: TransporteSms = {
  async enviar(tipo: "V" | "R", datos: NuevoReporte | NuevoRecurso): Promise<ResultadoSms> {
    const idMsg = nuevoIdMsg();
    const ahora = Date.now();
    const texto =
      tipo === "V" ? codificarV(datos as NuevoReporte, idMsg, ahora) : codificarR(datos as NuevoRecurso, idMsg, ahora);
    colaSimulada.push({ idMsg, texto, creadoEn: ahora });
    persistirCola();
    if (__DEV__) console.log(`[SMS simulado] ${texto}`);
    return { idMsg, estado: "PENDIENTE" };
  },
} as TransporteSms;

/** Solo para depurar y probar. */
export function colaSmsSimulada(): readonly { idMsg: string; texto: string; creadoEn: number }[] {
  return colaSimulada;
}

/** Saca el primer mensaje de la cola (lo usa la sincronización del simulador). */
export function primeroDeLaCola(): { idMsg: string; texto: string; creadoEn: number } | undefined {
  return colaSimulada[0];
}
export function quitarPrimeroDeLaCola(): void {
  colaSimulada.shift();
  persistirCola();
}

let transporte: TransporteSms = transporteSimulado;

/** Lo llama quien tenga el transporte real (Manuel/Persona A) para reemplazar el simulador. */
export function registrarTransporteSms(t: TransporteSms): void {
  transporte = t;
}

export function transporteSmsActual(): TransporteSms {
  return transporte;
}