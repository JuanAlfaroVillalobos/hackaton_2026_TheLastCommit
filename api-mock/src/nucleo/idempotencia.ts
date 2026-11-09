// Ruta: src/nucleo/idempotencia.ts
// RN-20: una acción de la bandeja de salida puede llegar dos veces (reintento, o SMS y luego internet).
// Si una escritura trae `X-Id-Accion` ya vista, se responde lo mismo que la primera vez sin repetirla.
// Las acciones procesadas viven en la colección `accionesProcesadas` (Firestore con ALMACEN=firestore).
// El intermediario SMS debe usar el mismo id (registrarAccionProcesada) para que la copia por internet se ignore.
import type { RequestHandler } from 'express';
import { almacen } from '../datos/almacen.js';

/** Pasado este tiempo, el mismo id se procesa de nuevo. */
const VIGENCIA_MS = 24 * 60 * 60 * 1000;

/**
 * @description Marca una acción como procesada por otra vía (p. ej. el SMS), para que su copia por internet no se repita.
 */
export async function registrarAccionProcesada(idAccion: string, estado = 200, cuerpo: unknown = { repetida: true }): Promise<void> {
  await almacen.accionesProcesadas.guardar({
    id: idAccion,
    estado,
    cuerpo: cuerpo === undefined ? null : JSON.stringify(cuerpo),
    guardadoEn: Date.now(),
  });
}

export const idempotencia: RequestHandler = async (req, res, next) => {
  const idAccion = req.get('X-Id-Accion');
  if (!idAccion || req.method === 'GET' || idAccion.length > 100 || idAccion.includes('/')) return next();

  const previa = await almacen.accionesProcesadas.obtener(idAccion);
  if (previa && previa.guardadoEn > Date.now() - VIGENCIA_MS) {
    res.set('X-Accion-Repetida', 'si');
    if (previa.cuerpo === null) res.status(previa.estado).end();
    else res.status(previa.estado).type('json').send(previa.cuerpo);
    return;
  }

  // Guarda la respuesta solo si salió bien: un 409 o un 500 se puede reintentar con el mismo id.
  let guardada = false;
  const guardar = (cuerpo: unknown) => {
    if (guardada || res.statusCode >= 400) return;
    guardada = true;
    void registrarAccionProcesada(idAccion, res.statusCode, cuerpo).catch(() => undefined);
  };
  const json = res.json.bind(res);
  res.json = (cuerpo: unknown) => {
    guardar(cuerpo);
    return json(cuerpo);
  };
  const end = res.end.bind(res) as (...args: unknown[]) => typeof res;
  res.end = ((...args: unknown[]) => {
    guardar(undefined);
    return end(...args);
  }) as typeof res.end;
  next();
};
