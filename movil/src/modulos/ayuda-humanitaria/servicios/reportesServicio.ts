// Ruta: src/modulos/ayuda-humanitaria/servicios/reportesServicio.ts
// Hoy trabaja en memoria sobre simulaciones/. Después se cambia el cuerpo por Firestore
// (reportesVulnerabilidad) y funciones; las firmas y las pantallas no cambian.
import { reportesMock, UID_YO, ZONA_DEMO } from "@/simulaciones";
import { geohashForLocation } from "geofire-common";
import { generarCodigo } from "../reglas";
import type { Coordenada, NuevoReporte, ReporteVulnerabilidad } from "../tipos";

let reportes: ReporteVulnerabilidad[] = [...reportesMock];
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

/** Equivale a onSnapshot: avisa cada vez que cambia la lista. Devuelve la función para dejar de escuchar. */
export function suscribirReportes(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

export async function listarReportes(): Promise<ReporteVulnerabilidad[]> {
  return [...reportes];
}

export async function crearReporte(datos: NuevoReporte): Promise<ReporteVulnerabilidad> {
  const nuevo: ReporteVulnerabilidad = {
    ...datos,
    id: `rv${Date.now()}`,
    codigo: generarCodigo(),
    autorId: UID_YO,
    geohash: geohashForLocation([datos.lat, datos.lng], 7),
    estado: "ABIERTO",
    atiendeId: null,
    canal: "APP",
    creadoEn: Date.now(),
  };
  reportes = [nuevo, ...reportes];
  avisar();
  return nuevo;
}

/** «Voy a ayudar»: ABIERTO → EN_ATENCION. */
export async function atenderReporte(id: string): Promise<void> {
  reportes = reportes.map((r): ReporteVulnerabilidad =>
    r.id === id && r.estado === "ABIERTO" ? { ...r, estado: "EN_ATENCION", atiendeId: UID_YO } : r,
  );
  avisar();
}

/** EN_ATENCION → RESUELTO, solo si lo atiende quien lo pide. */
export async function resolverReporte(id: string): Promise<void> {
  reportes = reportes.map((r): ReporteVulnerabilidad =>
    r.id === id && r.estado === "EN_ATENCION" && r.atiendeId === UID_YO
      ? { ...r, estado: "RESUELTO" }
      : r,
  );
  avisar();
}

/** Ubicación validada (RF42). Mock: la zona de la demo. Se cambia por useUbicacionValidada() de Fabrizio. */
export async function obtenerUbicacionValidada(): Promise<Coordenada> {
  return ZONA_DEMO;
}