// Ruta: src/modulos/ayuda-humanitaria/servicios/ubicacionServicio.ts
// Ubicación validada (RF42). Mientras no esté la de Fabrizio (nucleo/ubicacion), se usa el centro de la zona.
// Cuando exista, solo se cambia el cuerpo de esta función.
import type { Coordenada } from "../tipos";
import { obtenerCentroZona } from "./vecinosEmergenciaServicio";

export async function obtenerUbicacionValidada(): Promise<Coordenada> {
  return obtenerCentroZona();
}
