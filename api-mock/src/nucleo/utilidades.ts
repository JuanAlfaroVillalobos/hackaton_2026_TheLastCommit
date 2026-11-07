// Ruta: src/nucleo/utilidades.ts
import { randomInt } from 'node:crypto';

/** Id corto con prefijo, p. ej. `nc-lq3x8k2a`. Mongo/Firestore generan los suyos. */
export const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}${randomInt(36 ** 2).toString(36)}`;

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Código de 6 caracteres para reportes y recursos (lo que se dicta por SMS). */
export const nuevoCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');

/** Lee un texto obligatorio del cuerpo, sin espacios a los lados. */
export function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

export function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}
