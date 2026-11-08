// Ruta: src/nucleo/notificaciones/ProveedorNotificaciones.tsx
// Con sesión: crea canales, pide permiso, registra el token de FCM, escucha mensajes con la app abierta,
// abre la ruta de la notificación que inició la app y arranca el sondeo de respaldo.
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import notifee, { EventType } from 'react-native-notify-kit';
import { crearCanales } from './canales';
import { registrarDispositivo } from './dispositivo';
import { fcm } from './fcm';
import { aCarga, alPulsar, despachar } from './manejadores';
import { pedirPermisoNotificaciones } from './permiso';
import { iniciarSondeo } from './sondeo';

/**
 * @description Proveedor de notificaciones; va dentro de SesionProvider y no dibuja nada propio.
 */
export function ProveedorNotificaciones({ children }: { children: ReactNode }) {
  const { perfil, modoDesarrollo } = useSesion();
  const uid = perfil?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    let vigente = true;
    const limpiezas: (() => void)[] = [];

    void (async () => {
      try {
        if (Platform.OS === 'android') {
          await crearCanales().catch(() => undefined);
          await pedirPermisoNotificaciones();
          if (!modoDesarrollo) await registrarDispositivo();

          // Notificación que abrió la app desde cerrada.
          const inicial = await notifee.getInitialNotification().catch(() => null);
          const cargaInicial = aCarga(inicial?.notification.data);
          if (vigente && cargaInicial) {
            await alPulsar(cargaInicial, inicial?.pressAction.id === 'default' ? null : (inicial?.pressAction.id ?? null), false);
            if (cargaInicial.ruta) setTimeout(() => router.push(cargaInicial.ruta as never), 300);
          }

          limpiezas.push(
            notifee.onForegroundEvent(({ type, detail }) => {
              if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
              const carga = aCarga(detail.notification?.data);
              if (carga) void alPulsar(carga, type === EventType.ACTION_PRESS ? (detail.pressAction?.id ?? null) : null);
            }),
          );

          const m = fcm();
          try {
            if (m) {
              limpiezas.push(
                m.onMessage(m.getMessaging(), async (mensaje) => {
                  const carga = aCarga(mensaje.data);
                  if (carga) await despachar(carga, { enPrimerPlano: true, origen: 'fcm' });
                }),
              );
            }
          } catch {
            // sin FCM: queda el sondeo
          }
        }
      } catch {
        // Sin módulo nativo (Expo Go): quedan el sondeo y la app sin notificaciones del sistema.
      }
      if (vigente && !modoDesarrollo) limpiezas.push(iniciarSondeo());
    })();

    return () => {
      vigente = false;
      limpiezas.forEach((l) => l());
    };
  }, [uid, modoDesarrollo]);

  return children;
}