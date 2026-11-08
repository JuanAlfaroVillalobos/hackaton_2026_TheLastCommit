// Ruta: src/nucleo/notificaciones/fcm.ts
// Acceso perezoso a @react-native-firebase/messaging. Importarlo arriba del archivo rompe la app en web,
// en iOS y en Expo Go («Native module NativeRNFBTurboApp is not registered»), porque el módulo nativo
// solo existe en el development build de Android. Aquí se carga solo cuando está disponible.
import type * as Mensajeria from '@react-native-firebase/messaging';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

let modulo: typeof Mensajeria | null | undefined;

/**
 * @description Módulo de FCM, o null si no hay módulo nativo (web, iOS, Expo Go). Quien lo use sigue con el sondeo de la API.
 */
export function fcm(): typeof Mensajeria | null {
  if (modulo !== undefined) return modulo;
  if (Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return (modulo = null);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('@react-native-firebase/messaging') as typeof Mensajeria;
  } catch {
    modulo = null;
  }
  return modulo;
}
