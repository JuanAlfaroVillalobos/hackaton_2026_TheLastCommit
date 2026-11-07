// Ruta: src/modulos/ayuda-humanitaria/servicios/vecinosEmergenciaServicio.ts
// Acceso a datos. Hoy lee de simulaciones/; después se cambia el cuerpo por Firestore
// (emergencias/{id}/vecinos) y las pantallas no se enteran: la firma es la misma.
import { vecinosEmergenciaMock, ZONA_DEMO } from "@/simulaciones";
import { requiereAtencion } from "../reglas";
import type { VecinoEmergencia } from "../tipos";

export async function listarVecinosEmergencia(): Promise<VecinoEmergencia[]> {
  return vecinosEmergenciaMock.filter((v) => requiereAtencion(v.estado));
}

export async function obtenerCentroZona(): Promise<{ lat: number; lng: number }> {
  return ZONA_DEMO;
}