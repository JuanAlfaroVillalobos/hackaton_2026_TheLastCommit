// Ruta: src/nucleo/notificaciones/index.ts
// Permiso de notificaciones (RF08).
// ADAPTADOR TEMPORAL: lee de simulaciones/. Persona A lo reemplaza por el estado real del permiso
// (messaging().hasPermission() / POST_NOTIFICATIONS) y lo vuelve a leer al volver del segundo plano.
import { permisoNotificacionesMock } from "@/simulaciones";
import { Linking } from "react-native";

export type EstadoPermiso = "concedido" | "denegado";

export function usePermisoNotificaciones(): EstadoPermiso {
  return permisoNotificacionesMock;
}

/** Abre los ajustes de la app en Android para activar las notificaciones. */
export function abrirAjustesNotificaciones(): Promise<void> {
  return Linking.openSettings();
}
