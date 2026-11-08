// Ruta: src/modulos/ayuda-humanitaria/servicios/vecinosEmergenciaServicio.ts
// Hoy habla con la API simulada (api-mock). Después se cambia el cuerpo por Firestore
// (emergencias/{id}/vecinos) y las pantallas no se enteran: la firma es la misma.
import { ErrorApi, api } from "@/nucleo/api";
import type { Coordenada, VecinoEmergencia } from "../tipos";

/** Vecinos de la zona que necesitan atención (NECESITA_AYUDA o SIN_RESPONDER), RF22. */
export async function listarVecinosEmergencia(): Promise<VecinoEmergencia[]> {
  return api<VecinoEmergencia[]>("/ayuda-humanitaria/vecinos");
}

/** Plaza de Armas de Trujillo: solo se usa si nunca hubo internet para conocer la zona. */
const CENTRO_POR_DEFECTO: Coordenada = { lat: -8.1116, lng: -79.0288 };
let ultimoCentro: Coordenada | null = null;

/** Centro de la zona. Sin internet devuelve el último conocido (o uno por defecto) para poder reportar por SMS. */
export async function obtenerCentroZona(): Promise<Coordenada> {
  try {
    ultimoCentro = await api<Coordenada>("/ayuda-humanitaria/zona");
    return ultimoCentro;
  } catch (e) {
    if (e instanceof ErrorApi && e.codigo === "SIN_CONEXION") return ultimoCentro ?? CENTRO_POR_DEFECTO;
    throw e;
  }
}