// Ruta: src/modulos/ayuda-humanitaria/sms/enviarAyuda.ts
// Decide por dónde sale un reporte o un recurso: internet (servicio normal) o SMS (RF38, RF39, RF41).
import { ErrorApi } from "@/nucleo/api";
import { crearRecurso } from "../servicios/recursosServicio";
import { crearReporte } from "../servicios/reportesServicio";
import type { NuevoRecurso, NuevoReporte } from "../tipos";
import { iniciarSincronizacionAutomatica } from "./sincronizarCola";
import { transporteSmsActual, type ResultadoSms } from "./transporte";

/** Envía por SMS y deja vigilando la red para subir lo pendiente cuando vuelva internet. */
async function porSms<T extends "V" | "R">(
  tipo: T,
  datos: T extends "V" ? NuevoReporte : NuevoRecurso,
): Promise<ResultadoSms> {
  iniciarSincronizacionAutomatica();
  return (transporteSmsActual().enviar as (t: T, d: typeof datos) => Promise<ResultadoSms>)(tipo, datos);
}

export type ResultadoEnvio = { via: "INTERNET" } | ({ via: "SMS" } & ResultadoSms);

/** Sin internet (o si la llamada falla por falta de conexión) el envío sale por SMS. */
function faltaInternet(sinConexion: boolean, error?: unknown): boolean {
  return sinConexion || (error instanceof ErrorApi && error.codigo === "SIN_CONEXION");
}

export async function enviarReporte(datos: NuevoReporte, sinConexion: boolean): Promise<ResultadoEnvio> {
  if (!faltaInternet(sinConexion)) {
    try {
      await crearReporte(datos);
      return { via: "INTERNET" };
    } catch (e) {
      if (!faltaInternet(false, e)) throw e;
    }
  }
  return { via: "SMS", ...(await porSms("V", datos)) };
}

export async function enviarRecurso(datos: NuevoRecurso, sinConexion: boolean): Promise<ResultadoEnvio> {
  if (!faltaInternet(sinConexion)) {
    try {
      await crearRecurso(datos);
      return { via: "INTERNET" };
    } catch (e) {
      if (!faltaInternet(false, e)) throw e;
    }
  }
  return { via: "SMS", ...(await porSms("R", datos)) };
}

/** Mensaje para el vecino tras enviar por SMS. */
export function avisoSms(r: ResultadoEnvio, que: "reporte" | "recurso"): string | null {
  if (r.via !== "SMS") return null;
  return r.estado === "ENVIADO"
    ? `Sin internet: tu ${que} salió por SMS.`
    : `Sin internet: tu ${que} quedó pendiente de enviar por SMS.`;
}