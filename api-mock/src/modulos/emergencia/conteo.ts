// Ruta: src/modulos/emergencia/conteo.ts
// Conteo de alertas por celda H3 (RN-11, RN-12). El cálculo es idempotente (recalcula la ventana
// entera), así que se puede mover tal cual a un trigger `onDocumentWritten('alertas/{id}')` de Cloud
// Functions cuando haya más de un escritor en `alertas`.
// Pendiente (D2): comparar `alertantes` con los vecinos activos de la celda y crear `emergencias/{id}`.
import { latLngToCell } from 'h3-js';
import { almacen } from '../../datos/almacen.js';
import type { ConteoCelda } from '../../datos/tipos.js';

/** RN-11: celdas H3 de resolución 8 (~0,74 km²). */
export const RESOLUCION_H3 = 8;
/** RN-11: ventana móvil de 10 minutos. */
export const VENTANA_MS = 10 * 60_000;

export const celdaDe = (lat: number, lng: number) => latLngToCell(lat, lng, RESOLUCION_H3);

/** Recalcula y guarda `celdas/{celdaH3}` con las alertas no canceladas de los últimos 10 min. */
export async function recalcularCelda(celdaH3: string, ahora = Date.now()): Promise<ConteoCelda> {
  const ventanaDesde = ahora - VENTANA_MS;
  // Filtro de igualdad en la base; el de tiempo en código para no requerir un índice compuesto.
  const recientes = (await almacen.alertas.listar({ celdaH3 })).filter(
    (a) => a.creadoEn >= ventanaDesde && a.estado !== 'CANCELADA',
  );
  return almacen.celdas.guardar({
    id: celdaH3,
    celdaH3,
    alertantes: new Set(recientes.map((a) => a.autorId)).size,
    alertas: recientes.length,
    ventanaDesde,
    ultimaAlertaEn: recientes.length ? Math.max(...recientes.map((a) => a.creadoEn)) : null,
    actualizadoEn: ahora,
  });
}
