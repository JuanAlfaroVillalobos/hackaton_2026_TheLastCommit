// Ruta: src/nucleo/notificaciones/mostrar.ts
// Notificaciones locales con react-native-notify-kit (fork mantenido de Notifee, misma API).
import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility, type AndroidAction } from 'react-native-notify-kit';
import { Platform } from 'react-native';
import { CANALES, crearCanales } from './canales';
import type { CargaNotificacion, IdCanal } from './tipos';

export interface OpcionesMostrar {
  titulo: string;
  cuerpo?: string;
  canal?: IdCanal;
  /** Se entrega a alPulsar del módulo dueño. */
  carga?: CargaNotificacion;
  /** Botones, p. ej. [{ id: 'bien', texto: 'Estoy bien' }] (RF24). */
  acciones?: { id: string; texto: string; abrirApp?: boolean }[];
  /** Enciende la pantalla y abre la app sobre la pantalla de bloqueo (RF23). Solo canal emergencias. */
  pantallaCompleta?: boolean;
  /** Reemplaza una notificación anterior con el mismo id. */
  id?: string;
}

/**
 * @description Muestra una notificación local y devuelve su id (o null fuera de Android).
 */
export async function mostrarNotificacion({
  titulo,
  cuerpo,
  canal = CANALES.general,
  carga,
  acciones = [],
  pantallaCompleta = false,
  id,
}: OpcionesMostrar): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  await crearCanales();

  const emergencia = canal === CANALES.emergencias;
  const botones: AndroidAction[] = acciones.map((a) => ({
    title: a.texto,
    pressAction: a.abrirApp ? { id: a.id, launchActivity: 'default' } : { id: a.id },
  }));

  return notifee.displayNotification({
    id: id ?? carga?.idNotificacion,
    title: titulo,
    body: cuerpo,
    data: carga ? (Object.fromEntries(Object.entries(carga).filter(([, v]) => v !== undefined)) as Record<string, string>) : undefined,
    android: {
      channelId: canal,
      smallIcon: 'ic_launcher',
      color: emergencia ? '#C62828' : '#C2410C',
      importance: emergencia ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      visibility: emergencia ? AndroidVisibility.PUBLIC : AndroidVisibility.PRIVATE,
      category: emergencia ? AndroidCategory.ALARM : undefined,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: emergencia && pantallaCompleta ? { id: 'default', launchActivity: 'default' } : undefined,
      lightUpScreen: emergencia,
      actions: botones.length ? botones : undefined,
    },
  });
}

/**
 * @description Quita una notificación mostrada (p. ej. la alerta tras responder «Estoy bien»).
 */
export async function quitarNotificacion(id: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.cancelNotification(id).catch(() => undefined);
}
