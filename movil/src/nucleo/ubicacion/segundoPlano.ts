// Ruta: src/nucleo/ubicacion/segundoPlano.ts
// Ubicación en segundo plano solo durante un servicio activo (RF13, RNF05). La usa favores (Persona C):
//   await iniciarUbicacionEnServicio(servicioId);   // al aceptar (RF12)
//   await detenerUbicacionEnServicio();             // al finalizar, cancelar o desistir
// La tarea se define al cargar este archivo; el layout raíz lo importa para que exista al arrancar.
import { fijarToken } from '@/nucleo/api';
import { CLAVE_TOKEN } from '@/nucleo/sesion';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { informarUbicacion } from './informar';

export const TAREA_UBICACION_SERVICIO = 'vecinos.ubicacion.servicio';
const CLAVE_SERVICIO = 'vecinos.ubicacion.servicioId';

type DatosTarea = { locations?: Location.LocationObject[] };

TaskManager.defineTask<DatosTarea>(TAREA_UBICACION_SERVICIO, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const lectura = data.locations[data.locations.length - 1];
  if (lectura.mocked) return;

  // Si Android revivió la app solo para esta tarea, el token no está en memoria.
  const [token, servicioId] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN).catch(() => null),
    SecureStore.getItemAsync(CLAVE_SERVICIO).catch(() => null),
  ]);
  if (!token) return;
  fijarToken(token);

  await informarUbicacion(
    {
      coordenada: { lat: lectura.coords.latitude, lng: lectura.coords.longitude },
      precisionM: lectura.coords.accuracy != null ? Math.round(lectura.coords.accuracy) : null,
      manual: false,
      tomadaEn: lectura.timestamp,
    },
    servicioId ?? undefined,
  );
});

/**
 * @description Pide el permiso de segundo plano y empieza a compartir la ubicación del servicio. Devuelve false si el vecino lo niega (el servicio sigue con la app abierta).
 */
export async function iniciarUbicacionEnServicio(servicioId: string): Promise<boolean> {
  const primerPlano = await Location.requestForegroundPermissionsAsync();
  if (primerPlano.status !== Location.PermissionStatus.GRANTED) return false;
  const fondo = await Location.requestBackgroundPermissionsAsync();
  if (fondo.status !== Location.PermissionStatus.GRANTED) return false;

  await SecureStore.setItemAsync(CLAVE_SERVICIO, servicioId).catch(() => undefined);
  if (await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION_SERVICIO).catch(() => false)) return true;

  await Location.startLocationUpdatesAsync(TAREA_UBICACION_SERVICIO, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15_000,
    distanceInterval: 20,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'Compartiendo tu ubicación',
      notificationBody: 'Solo mientras dura el servicio. Se detiene al terminar.',
      notificationColor: '#C2410C',
      killServiceOnDestroy: false,
    },
  });
  return true;
}

/**
 * @description Deja de compartir la ubicación (fin, cancelación o desistimiento del servicio).
 */
export async function detenerUbicacionEnServicio(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_SERVICIO).catch(() => undefined);
  if (await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION_SERVICIO).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TAREA_UBICACION_SERVICIO);
  }
}
