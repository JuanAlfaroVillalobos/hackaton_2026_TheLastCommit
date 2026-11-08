// Ruta: src/modulos/ayuda-humanitaria/sms/convertir.ts
// Pasa un mensaje SMS ya leído al dato que entienden los servicios del módulo, y viceversa (bajada VR).
import type { NuevoRecurso, NuevoReporte, ReporteVulnerabilidad } from "../tipos";
import type { AvisoVR, MensajeR, MensajeV } from "./ayudaSms";

/** V recibido → datos para crear el reporte (con `canal: "SMS"`). */
export function reporteDesdeV(m: MensajeV): NuevoReporte & { canal: "SMS" } {
  return { tipo: m.tipo, personas: m.personas, nota: m.nota, lat: m.lat, lng: m.lng, canal: "SMS" };
}

/** R recibido → datos para crear el recurso (con `canal: "SMS"`). */
export function recursoDesdeR(m: MensajeR): NuevoRecurso & { canal: "SMS" } {
  return { modo: m.modo, tipo: m.tipo, cantidad: m.cantidad, lat: m.lat, lng: m.lng, canal: "SMS" };
}

/** Reporte creado → datos del aviso VR que se manda a los vecinos cercanos sin señal. */
export function avisoDesdeReporte(r: ReporteVulnerabilidad): Pick<AvisoVR, "codigo" | "tipo" | "personas" | "lat" | "lng"> {
  return { codigo: r.codigo, tipo: r.tipo, personas: r.personas, lat: r.lat, lng: r.lng };
}