// Ruta: src/nucleo/bandeja-salida/useBandeja.ts
// Hooks para mostrar la bandeja: «Pendientes (n)» en P04 y la lista en P13.
import { ESCENARIO_DEMO } from '@/simulaciones';
import { useSesion } from '@/nucleo/sesion';
import { useMemo, useSyncExternalStore } from 'react';
import { leerCola, suscribirCola } from './almacen';
import type { AccionGuardada } from './tipos';

/**
 * @description Acciones del vecino con sesión que aún no llegaron a la API (pendientes y enviadas por SMS), de la más antigua a la más nueva.
 */
export function useBandeja(): AccionGuardada[] {
  const cola = useSyncExternalStore(suscribirCola, leerCola, leerCola);
  const { perfil } = useSesion();
  const uid = perfil?.uid;
  return useMemo(() => cola.filter((a) => a.uid === uid), [cola, uid]);
}

/**
 * @description Número para «Pendiente de enviar (n)»: no cuenta las que ya salieron por SMS. El escenario 04-D de diseño muestra al menos 1.
 */
export function usePendientesBandeja(): number {
  const n = useBandeja().filter((a) => a.estado === 'pendiente').length;
  return ESCENARIO_DEMO === 'sin-conexion' ? Math.max(n, 1) : n;
}
