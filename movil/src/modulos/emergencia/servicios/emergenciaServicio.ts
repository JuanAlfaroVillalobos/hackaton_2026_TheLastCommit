// Ruta: src/modulos/emergencia/servicios/emergenciaServicio.ts
// Estado del modo emergencia (RF21, RF24). La API decide si la zona está en emergencia; la app se entera
// por push (notificaciones del módulo «emergencia») y consulta el estado al abrir o volver del segundo plano.
import { api } from "@/nucleo/api";
import { obtenerUbicacionValidada } from "@/nucleo/ubicacion";
import * as Location from "expo-location";
import type { EstadoEmergencia } from "../tipos";

export function obtenerEstadoEmergencia(): Promise<EstadoEmergencia> {
  return api<EstadoEmergencia>("/emergencia/actual");
}

/**
 * Ubicación actual solo si el vecino ya dio permiso (nunca abre el diálogo aquí: lo pide P03).
 * Sin permiso, sin GPS o sin precisión, la API usa la última ubicación del perfil.
 */
async function ubicacionSinPreguntar(): Promise<{ lat: number; lng: number } | null> {
  const permiso = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (!permiso?.granted) return null;
  const resultado = await obtenerUbicacionValidada().catch(() => null);
  return resultado?.ok ? resultado.ubicacion.coordenada : null;
}

/**
 * Al abrir la app o volver del segundo plano: informa dónde está el vecino (lo mantiene «activo» para
 * RN-11) y, si su zona está en emergencia, lo suma como SIN_RESPONDER.
 */
export async function registrarPresencia(): Promise<EstadoEmergencia> {
  const ubicacion = await ubicacionSinPreguntar();
  return api<EstadoEmergencia>("/emergencia/presencia", { metodo: "POST", cuerpo: ubicacion ?? {} });
}

/** RF24: «Estoy bien» (A_SALVO) o «Necesito ayuda» (NECESITA_AYUDA). */
export function responderEmergencia(estado: "A_SALVO" | "NECESITA_AYUDA"): Promise<EstadoEmergencia> {
  return api<EstadoEmergencia>("/emergencia/respuesta", { metodo: "POST", cuerpo: { estado } });
}
