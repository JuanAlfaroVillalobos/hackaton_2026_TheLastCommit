// Ruta: src/modulos/ayuda-humanitaria/servicios/reportesServicio.ts
// Hoy habla con la API simulada (api-mock). Después se cambia el cuerpo por Firestore
// (reportesVulnerabilidad) y funciones; las firmas y las pantallas no cambian.
import { api } from "@/nucleo/api";
import type { NuevoReporte, ReporteVulnerabilidad } from "../tipos";
import { crearOyentes } from "./oyentes";

const RUTA = "/ayuda-humanitaria/reportes";
const oyentes = crearOyentes();

/** Equivale a onSnapshot: avisa cada vez que cambia la lista. Devuelve la función para dejar de escuchar. */
export const suscribirReportes = oyentes.suscribir;

export async function listarReportes(): Promise<ReporteVulnerabilidad[]> {
  return api<ReporteVulnerabilidad[]>(RUTA);
}

export async function crearReporte(datos: NuevoReporte): Promise<ReporteVulnerabilidad> {
  try {
    return await api<ReporteVulnerabilidad>(RUTA, { metodo: "POST", cuerpo: { ...datos, canal: "APP" } });
  } finally {
    oyentes.avisar();
  }
}

/** «Voy a ayudar»: ABIERTO → EN_ATENCION. */
export async function atenderReporte(id: string): Promise<void> {
  try {
    await api(`${RUTA}/${id}/atender`, { metodo: "POST" });
  } finally {
    oyentes.avisar();
  }
}

/** EN_ATENCION → RESUELTO, solo si lo atiende quien pulsa. */
export async function resolverReporte(id: string): Promise<void> {
  try {
    await api(`${RUTA}/${id}/resolver`, { metodo: "POST" });
  } finally {
    oyentes.avisar();
  }
}
