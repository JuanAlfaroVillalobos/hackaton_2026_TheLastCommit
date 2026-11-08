// Ruta: src/nucleo/notificaciones/permiso.ts
// Permiso de notificaciones (RF08; en Android 13+ es POST_NOTIFICATIONS).
import { ESCENARIO_DEMO } from '@/simulaciones';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';
import type { EstadoPermiso } from './tipos';

/**
 * @description Lee el estado actual del permiso sin pedirlo.
 */
export async function leerPermisoNotificaciones(): Promise<EstadoPermiso> {
  if (Platform.OS !== 'android') return 'concedido';
  try {
    const ajustes = await notifee.getNotificationSettings();
    return ajustes.authorizationStatus === AuthorizationStatus.AUTHORIZED ? 'concedido' : 'denegado';
  } catch {
    // Sin módulo nativo (Expo Go): no hay nada que pedir, no se muestra el aviso.
    return 'concedido';
  }
}

/**
 * @description Pide el permiso (muestra el diálogo del sistema la primera vez) y devuelve el resultado.
 */
export async function pedirPermisoNotificaciones(): Promise<EstadoPermiso> {
  if (Platform.OS !== 'android') return 'concedido';
  try {
    const ajustes = await notifee.requestPermission();
    return ajustes.authorizationStatus === AuthorizationStatus.AUTHORIZED ? 'concedido' : 'denegado';
  } catch {
    // Sin módulo nativo (Expo Go).
    return 'concedido';
  }
}

/**
 * @description Estado del permiso; se vuelve a leer al regresar de Ajustes. El escenario 04-D de diseño lo fuerza a «denegado».
 */
export function usePermisoNotificaciones(): EstadoPermiso {
  const [estado, setEstado] = useState<EstadoPermiso>('concedido');

  useEffect(() => {
    let vigente = true;
    const leer = () => {
      void leerPermisoNotificaciones().then((e) => vigente && setEstado(e));
    };
    leer();
    const suscripcion = AppState.addEventListener('change', (s) => s === 'active' && leer());
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);

  return ESCENARIO_DEMO === 'sin-conexion' ? 'denegado' : estado;
}

/**
 * @description Abre los ajustes de notificaciones de la app en Android.
 */
export async function abrirAjustesNotificaciones(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await notifee.openNotificationSettings();
    } catch {
      await Linking.openSettings();
    }
    return;
  }
  await Linking.openSettings();
}