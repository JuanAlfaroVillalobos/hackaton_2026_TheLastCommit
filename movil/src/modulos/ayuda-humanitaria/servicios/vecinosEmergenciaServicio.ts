// Ruta: src/modulos/ayuda-humanitaria/servicios/vecinosEmergenciaServicio.ts
// Los vecinos salen de la emergencia real de la zona (`emergencias/{id}/vecinos`, módulo emergencia):
// GET /emergencia/vecinos solo responde a quien está en la zona (RN-14). La firma no cambió.
import { useEmergenciaStore, type VecinoEnEmergencia } from "@/modulos/emergencia";
import { ErrorApi, api } from "@/nucleo/api";
import type { Coordenada, VecinoEmergencia } from "../tipos";

/** Vecinos de la zona que necesitan atención (NECESITA_AYUDA o SIN_RESPONDER), RF22. */
export async function listarVecinosEmergencia(): Promise<VecinoEmergencia[]> {
  const vecinos = await api<VecinoEnEmergencia[]>("/emergencia/vecinos");
  // Quien entró como SIN_RESPONDER no tiene alerta propia: se usa cuándo entró a la emergencia.
  return vecinos.map((v) => ({ ...v, ultimaAlertaEn: v.ultimaAlertaEn ?? v.creadoEn }));
}

/** Plaza de Armas de Trujillo: solo se usa si nunca hubo internet para conocer la zona. */
const CENTRO_POR_DEFECTO: Coordenada = { lat: -8.1116, lng: -79.0288 };
let ultimoCentro: Coordenada | null = null;

/** Centro de la zona. Sin internet devuelve el último conocido (o uno por defecto) para poder reportar por SMS. */
export async function obtenerCentroZona(): Promise<Coordenada> {
  // Con una emergencia activa, el mapa se centra en la celda que la activó.
  const emergencia = useEmergenciaStore.getState().emergencia;
  if (emergencia) return (ultimoCentro = emergencia.centro);
  try {
    ultimoCentro = await api<Coordenada>("/ayuda-humanitaria/zona");
    return ultimoCentro;
  } catch (e) {
    if (e instanceof ErrorApi && e.codigo === "SIN_CONEXION") return ultimoCentro ?? CENTRO_POR_DEFECTO;
    throw e;
  }
}