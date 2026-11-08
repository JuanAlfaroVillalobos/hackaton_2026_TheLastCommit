// Ruta: src/modulos/cuentas/hooks/usePermisos.ts
// Estado real de los permisos de P03 (RF08) y la acción para pedir cada uno. Se vuelve a leer al
// regresar de Ajustes. El permiso de ubicación en segundo plano se pide al aceptar un servicio (RF12).
import { leerPermisoNotificaciones, pedirPermisoNotificaciones, registrarDispositivo } from '@/nucleo/notificaciones';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import notifee from 'react-native-notify-kit';

export type IdPermiso = 'ubicacion' | 'notificaciones' | 'sms' | 'pantallaCompleta' | 'bateria';
/** `revisar`: Android no deja leerlo; se abre Ajustes para que el vecino lo confirme. */
export type EstadoPermisoApp = 'concedido' | 'pendiente' | 'bloqueado' | 'revisar';

const ANDROID = Platform.OS === 'android';
const VERSION = ANDROID ? Number(Platform.Version) : 0;
const PERMISOS_SMS = ANDROID
  ? [PermissionsAndroid.PERMISSIONS.SEND_SMS, PermissionsAndroid.PERMISSIONS.RECEIVE_SMS]
  : [];

async function leer(): Promise<Record<IdPermiso, EstadoPermisoApp>> {
  const ubicacion = await Location.getForegroundPermissionsAsync().catch(() => null);
  const notificaciones = await leerPermisoNotificaciones();
  const sms = ANDROID ? await Promise.all(PERMISOS_SMS.map((p) => PermissionsAndroid.check(p))).catch(() => [false]) : [true];
  const ahorro = ANDROID ? await notifee.isBatteryOptimizationEnabled().catch(() => false) : false;

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
          else await notifee.openNotificationSettings().catch(() => Linking.openSettings());
          break;
        }
        case 'sms': {
          if (!ANDROID) break;
          const r = await PermissionsAndroid.requestMultiple(PERMISOS_SMS);
          if (Object.values(r).includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) await Linking.openSettings();
          break;
        }
        case 'pantallaCompleta':
          await Linking.openSettings();
          break;
        case 'bateria':
          await notifee.openBatteryOptimizationSettings().catch(() => Linking.openSettings());
          break;
      }
      await actualizar();
    },
    [estados, actualizar],
  );

  return { estados, pedir, actualizar };
}
