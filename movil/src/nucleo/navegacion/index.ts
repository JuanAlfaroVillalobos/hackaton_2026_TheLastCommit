// Ruta: src/nucleo/navegacion/index.ts
// «Volver» seguro: si la pantalla se abrió sin historial (enlace directo, recarga en la web o tras
// iniciar sesión), router.back() no hace nada y el vecino queda atrapado. Aquí se va a una ruta conocida.
import { router, type Href } from 'expo-router';

/**
 * @description Vuelve a la pantalla anterior o, si no hay, reemplaza por `respaldo` (por defecto, Mi perfil).
 */
export function volver(respaldo: Href = '/perfil'): void {
  if (router.canGoBack()) router.back();
  else router.replace(respaldo);
}
