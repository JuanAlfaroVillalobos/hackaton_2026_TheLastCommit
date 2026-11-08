// Ruta: src/nucleo/notificaciones/segundoPlano.ts
// Manejadores con la app cerrada o en segundo plano (FCM de datos y toques en la notificación).
// Deben registrarse antes de montar la app: los importa `src/nucleo/arranque.ts` desde `movil/index.ts`.
import { Platform } from 'react-native';
import notifee, { EventType } from 'react-native-notify-kit';
import { fcm } from './fcm';
import { aCarga, alPulsar, despachar } from './manejadores';

if (Platform.OS === 'android') {
  const m = fcm();
  try {
    m?.setBackgroundMessageHandler(m.getMessaging(), async (mensaje) => {
      const carga = aCarga(mensaje.data);
      if (carga) await despachar(carga, { enPrimerPlano: false, origen: 'fcm' });
    });
  } catch {
    // FCM no disponible (p. ej. sin google-services.json): las notificaciones locales siguen funcionando.
  }

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
    const carga = aCarga(detail.notification?.data);
    if (!carga) return;
    // Con la app cerrada no hay navegación montada: solo se avisa al módulo (p. ej. «Estoy bien» sin abrir la app).
    await alPulsar(carga, type === EventType.ACTION_PRESS ? (detail.pressAction?.id ?? null) : null, false);
  });
}
