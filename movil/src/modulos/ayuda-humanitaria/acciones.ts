// Ruta: src/modulos/ayuda-humanitaria/acciones.ts
// Ejecuta una acción del vecino (voy a ayudar, lo tengo, cerrar…) y, si falla, le muestra el motivo
// que respondió el servidor (p. ej. «El reporte ya lo atiende otro vecino») en vez de romper la pantalla.
import { ErrorApi } from "@/nucleo/api";
import { Alert } from "react-native";

export async function conAviso(accion: () => Promise<unknown>): Promise<void> {
  try {
    await accion();
  } catch (error) {
    Alert.alert("No se pudo completar", error instanceof ErrorApi ? error.message : "Inténtalo de nuevo.");
  }
}

/** Texto para mostrar cuando una lista no se pudo cargar. */
export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : "No se pudo cargar. Inténtalo de nuevo.";
}
