// Ruta: src/nucleo/notificaciones/canales.ts
// Canales de Android (README 9.1): «General» y «Emergencias» (importancia máxima, sonido y vibración propios).
import notifee, { AndroidImportance, AndroidVisibility } from 'react-native-notify-kit';
import { Platform } from 'react-native';
import type { IdCanal } from './tipos';

export const CANALES: Record<IdCanal, IdCanal> = { general: 'general', emergencias: 'emergencias' };

let creados = false;

/**
 * @description Crea los canales una sola vez por arranque (idempotente en Android).
 */
export async function crearCanales(): Promise<void> {
  if (creados || Platform.OS !== 'android') return;
  await notifee.createChannels([
    {
      id: CANALES.general,
      name: 'General',
      description: 'Avisos de favores, servicios, directorio y trabajos.',
      importance: AndroidImportance.DEFAULT,
    },
    {
      id: CANALES.emergencias,
      name: 'Emergencias',
      description: 'Alertas de emergencia de tu zona y «¿Estás bien?».',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      bypassDnd: true,
    },
  ]);
  creados = true;
}
