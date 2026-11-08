// Ruta: src/nucleo/notificaciones/dispositivo.ts
// Token de FCM del dispositivo (`usuarios/{uid}/dispositivos/{token}`, README 5.4). Con la API
// simulada se guarda en POST /vecinos/yo/dispositivos; el backend lo usa en notificar().
import { api } from '@/nucleo/api';
import { deleteToken, getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

let tokenActual: string | null = null;
let quitarEscucha: (() => void) | null = null;

/**
 * @description Obtiene el token de FCM y lo registra en el perfil; se vuelve a registrar si FCM lo rota. No falla si FCM no está disponible.
 */
export async function registrarDispositivo(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const mensajeria = getMessaging();
    const token = await getToken(mensajeria);
    tokenActual = token;
    await api('/vecinos/yo/dispositivos', { metodo: 'POST', cuerpo: { token, plataforma: 'android' } });

    quitarEscucha?.();
    quitarEscucha = onTokenRefresh(mensajeria, (nuevo) => {
      tokenActual = nuevo;
      void api('/vecinos/yo/dispositivos', { metodo: 'POST', cuerpo: { token: nuevo, plataforma: 'android' } }).catch(() => undefined);
    });
    return token;
  } catch {
    // Sin Google Play Services o sin red: la app sigue con el sondeo de la API.
    return null;
  }
}

/**
 * @description Al cerrar sesión: borra el token del perfil y de FCM para que el teléfono deje de recibir avisos de esa cuenta.
 */
export async function darDeBajaDispositivo(): Promise<void> {
  quitarEscucha?.();
  quitarEscucha = null;
  const token = tokenActual;
  tokenActual = null;
  if (!token || Platform.OS !== 'android') return;
  await api(`/vecinos/yo/dispositivos/${encodeURIComponent(token)}`, { metodo: 'DELETE' }).catch(() => undefined);
  await deleteToken(getMessaging()).catch(() => undefined);
}
