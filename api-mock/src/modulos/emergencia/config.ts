// Ruta: src/modulos/emergencia/config.ts
// Parámetros del modo emergencia. Los valores por defecto son los del README; se ajustan en .env para
// probar con menos teléfonos (p. ej. EMERGENCIA_MINIMO=1) o sin esperar (EMERGENCIA_INTERVALO_S=10).

const entero = (nombre: string, porDefecto: number, minimo: number) => {
  const valor = Number(process.env[nombre]);
  return Number.isFinite(valor) && valor >= minimo ? valor : porDefecto;
};

/** RN-11: mínimo absoluto de alertantes distintos en la celda. */
export const MINIMO_ALERTANTES = entero('EMERGENCIA_MINIMO', 3, 1);
/** RN-11: los alertantes deben ser MÁS de este porcentaje de los vecinos activos de la celda. */
export const PORCENTAJE_ALERTANTES = entero('EMERGENCIA_PORCENTAJE', 50, 0);
/** README 6: vecino activo = última ubicación de hace menos de 30 min. */
export const ACTIVO_MS = 30 * 60_000;
/** RF25: la emergencia termina tras este tiempo sin alertas nuevas si nadie está NECESITA_AYUDA. */
export const CIERRE_SIN_ALERTAS_MS = entero('EMERGENCIA_CIERRE_MIN', 30, 1) * 60_000;
/** RF23: cada cuánto se reenvía «¿Estás bien?» (la tarea `cadaMinuto`). */
export const INTERVALO_ALERTA_MS = entero('EMERGENCIA_INTERVALO_S', 60, 5) * 1000;
