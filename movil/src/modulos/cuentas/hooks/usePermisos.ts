// Ruta: src/modulos/cuentas/hooks/usePermisos.ts
// Estado real de los permisos de P03 (RF08) y la acción para pedir cada uno. Se vuelve a leer al
// regresar de Ajustes. El permiso de ubicación en segundo plano se pide al aceptar un servicio (RF12).
import { leerPermisoNotificaciones, pedirPermisoNotificaciones, registrarDispositivo } from '@/nucleo/notificaciones';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import notifee from 'react-native-notify-kit';

export type IdPermiso = 'ubicacion' | 'notificaciones' | 'sms' | 'pantallaCompleta' | 'bateria';
/** `revisar`: Android no deja leerlo; se abre Ajustes para que el vecino lo confirme. */
export type EstadoPermisoApp = 'concedido' | 'pendiente' | 'bloqueado' | 'revisar';

const ANDROID = Platform.OS === 'android';
const VERSION = ANDROID ? Number(Platform.Version) : 0;
// En web PermissionsAndroid no existe: leerlo al cargar el archivo rompía la app.
const PERMISOS_SMS = ANDROID ? [PermissionsAndroid.PERMISSIONS.SEND_SMS, PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] : [];

/** Sin módulo nativo (Expo Go) Notifee lanza al llamarlo: se trata como «sin ahorro de batería». */
async function ahorroBateriaActivo(): Promise<boolean> {
  try {
    return await notifee.isBatteryOptimizationEnabled();
  } catch {
    return false;
  }
}

/** Abre una pantalla de Ajustes de Notifee; si no existe (Expo Go) abre los Ajustes generales. */
async function abrirAjustesDe(abrir: () => Promise<void>): Promise<void> {
  try {
    await abrir();
  } catch {
    await Linking.openSettings();
  }
}

/**
 * Abre directo la pantalla de Ajustes que corresponde (intent de Android) y deja un aviso corto sobre qué tocar.
 * Si el teléfono no tiene esa pantalla, abre los Ajustes de la app.
 */
async function irAjuste(accion: string, indicacion: string): Promise<void> {
  if (ANDROID) ToastAndroid.show(indicacion, ToastAndroid.LONG);
  try {
    await Linking.sendIntent(accion);
  } catch {
    await Linking.openSettings();
  }
}

async function leer(): Promise<Record<IdPermiso, EstadoPermisoApp>> {
  const ubicacion = await Location.getForegroundPermissionsAsync().catch(() => null);
  const notificaciones = await leerPermisoNotificaciones();
  const sms = ANDROID ? await Promise.all(PERMISOS_SMS.map((p) => PermissionsAndroid.check(p))).catch(() => [false]) : [true];
  const ahorro = ANDROID ? await ahorroBateriaActivo() : false;

  return {
    ubicacion: ubicacion?.granted ? 'concedido' : ubicacion && !ubicacion.canAskAgain ? 'bloqueado' : 'pendiente',
    notificaciones: notificaciones === 'concedido' ? 'concedido' : 'pendiente',
    sms: sms.every(Boolean) ? 'concedido' : 'pendiente',
    // Antes de Android 14 la app lo tiene al instalarse; desde Android 14 lo controla el vecino en Ajustes.
    pantallaCompleta: VERSION < 34 ? 'concedido' : 'revisar',
    bateria: ahorro ? 'pendiente' : 'concedido',
  };
}

/**
 * @description Estado de los 5 permisos explicados en P03 y `pedir(id)` para cada uno (abre Ajustes si Android ya no deja preguntar).
 */
export function usePermisos() {
  const [estados, setEstados] = useState<Record<IdPermiso, EstadoPermisoApp> | null>(null);

  const actualizar = useCallback(async () => setEstados(await leer()), []);

  useEffect(() => {
    let vigente = true;
    const leerSiVigente = () => void leer().then((e) => vigente && setEstados(e));
    leerSiVigente();
    const s = AppState.addEventListener('change', (e) => e === 'active' && leerSiVigente());
    return () => {
      vigente = false;
      s.remove();
    };
  }, []);

  const pedir = useCallback(
    async (id: IdPermiso) => {
      const actual = estados?.[id];
      switch (id) {
        case 'ubicacion': {
          if (actual === 'bloqueado') await Linking.openSettings();
          else await Location.requestForegroundPermissionsAsync();
          break;
        }
        case 'notificaciones': {
          const r = await pedirPermisoNotificaciones();
          if (r === 'concedido') void registrarDispositivo();
          else await abrirAjustesDe(() => notifee.openNotificationSettings());
          break;
        }
        case 'sms': {
          if (!ANDROID) break;
          let concedido = false;
          try {
            const r = await PermissionsAndroid.requestMultiple(PERMISOS_SMS);
            concedido = Object.values(r).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
          } catch {
            // Android no mostró el cuadro (permiso no declarado en esta build): se guía hacia Ajustes.
          }
          if (!concedido) {
            // Abre los Ajustes de la app; desde ahí: Permisos → SMS → Permitir.
            ToastAndroid.show('Toca «Permisos», luego «SMS» y elige «Permitir».', ToastAndroid.LONG);
            await Linking.openSettings();
          }
          break;
        }
        case 'pantallaCompleta':
          // Android 14+: lista de apps con «Notificaciones en pantalla completa».
          await irAjuste('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT', 'Busca «Vecinos» y actívalo.');
          break;
        case 'bateria':
          // Lista de apps con optimización de batería.
          await irAjuste('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS', 'Busca «Vecinos» y elige «No optimizar».');
          break;
      }
      await actualizar();
    },
    [estados, actualizar],
  );

  return { estados, pedir, actualizar };
}