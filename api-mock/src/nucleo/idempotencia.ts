// Ruta: src/nucleo/idempotencia.ts
// RN-20: una acción de la bandeja de salida puede llegar dos veces (reintento, o SMS y luego internet).
// Si una escritura trae `X-Id-Accion` ya vista, se responde lo mismo que la primera vez sin repetirla.
// El intermediario SMS debe usar el mismo id (registrarAccionProcesada) para que la copia por internet se ignore.
import type { RequestHandler } from 'express';

const VIGENCIA_MS = 24 * 60 * 60 * 1000;
const MAX_REGISTROS = 2000;

interface Registro {
  estado: number;
  cuerpo: unknown;
  guardadoEn: number;
}

const procesadas = new Map<string, Registro>();

function limpiar(): void {
  const limite = Date.now() - VIGENCIA_MS;
  for (const [id, r] of procesadas) {
    if (r.guardadoEn < limite || procesadas.size > MAX_REGISTROS) procesadas.delete(id);
    else break;
  }
}

/**
 * @description Marca una acción como procesada por otra vía (p. ej. el SMS), para que su copia por internet no se repita.
 */
export function registrarAccionProcesada(idAccion: string, estado = 200, cuerpo: unknown = { repetida: true }): void {
  procesadas.set(idAccion, { estado, cuerpo, guardadoEn: Date.now() });
  limpiar();
}

export const idempotencia: RequestHandler = (req, res, next) => {
  const idAccion = req.get('X-Id-Accion');
  if (!idAccion || req.method === 'GET' || idAccion.length > 100) return next();

  const previa = procesadas.get(idAccion);
  if (previa) {
    res.set('X-Accion-Repetida', 'si');
    if (previa.cuerpo === undefined) res.status(previa.estado).end();
    else res.status(previa.estado).json(previa.cuerpo);
    return;
  }

  // Guarda la respuesta solo si salió bien: un 409 o un 500 se puede reintentar con el mismo id.
  const json = res.json.bind(res);
  res.json = (cuerpo: unknown) => {
    if (res.statusCode < 400) registrarAccionProcesada(idAccion, res.statusCode, cuerpo);
    return json(cuerpo);
  };
  const end = res.end.bind(res) as (...args: unknown[]) => typeof res;
  res.end = ((...args: unknown[]) => {
    if (res.statusCode < 400 && !procesadas.has(idAccion)) registrarAccionProcesada(idAccion, res.statusCode, undefined);
    return end(...args);
  }) as typeof res.end;
  next();
};
