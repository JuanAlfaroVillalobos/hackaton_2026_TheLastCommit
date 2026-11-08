// Ruta: src/nucleo/ubicacion/pinManual.ts
// Puente entre useUbicacionValidada() y la pantalla del pin (cuentas/ElegirUbicacionPantalla):
// quien pide la ubicación espera una promesa que la pantalla resuelve al confirmar o cancelar.
import type { Coordenada } from '@/compartido/utilidades/geo';
import { router } from 'expo-router';

export const RUTA_PIN_MANUAL = '/elegir-ubicacion';

let resolverPendiente: ((coordenada: Coordenada | null) => void) | null = null;
let inicialPendiente: Coordenada | null = null;

/**
 * @description Abre la pantalla del pin y espera la coordenada elegida (null si el vecino cancela).
 */
export function solicitarPinManual(inicial: Coordenada | null): Promise<Coordenada | null> {
  resolverPendiente?.(null);
  inicialPendiente = inicial;
  return new Promise((resolver) => {
    resolverPendiente = resolver;
    router.push(RUTA_PIN_MANUAL);
  });
}

/**
 * @description Coordenada con la que debe abrir el mapa del pin.
 */
export function leerPinInicial(): Coordenada | null {
  return inicialPendiente;
}

/**
 * @description La pantalla del pin la llama al confirmar (coordenada) o al salir sin elegir (null).
 */
export function resolverPinManual(coordenada: Coordenada | null): void {
  const resolver = resolverPendiente;
  resolverPendiente = null;
  inicialPendiente = null;
  resolver?.(coordenada);
}
