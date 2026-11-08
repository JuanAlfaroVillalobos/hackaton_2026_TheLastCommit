// Ruta: src/nucleo/autenticacion.ts
// Sesión simulada: el token es un UUID. Con ALMACEN=firestore se guarda en `sesiones/{token}`, así un
// reinicio de la API (tsx watch recarga al guardar cualquier archivo) no saca a todos de la app; en
// memoria se pierden al reiniciar. Al pasar a Firebase Auth, este middleware verifica el ID token con
// firebase-admin (`getAuth().verifyIdToken`) y deja el uid en `res.locals.uid`.
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { almacen } from '../datos/almacen.js';
import { ErrorHttp } from './errores.js';

/** Caché token → uid, para no leer Firestore en cada petición. */
const cache = new Map<string, string>();

export async function abrirSesion(uid: string): Promise<string> {
  const token = randomUUID();
  await almacen.sesiones.guardar({ id: token, uid, creadoEn: Date.now() });
  cache.set(token, uid);
  return token;
}

export async function cerrarSesion(token: string): Promise<void> {
  cache.delete(token);
  await almacen.sesiones.eliminar(token);
}

/** Cierra todas las sesiones de un usuario (cambio de clave, cuenta eliminada), salvo `excepto`. */
export async function cerrarSesionesDe(uid: string, excepto?: string | null): Promise<void> {
  for (const [token, dueno] of cache) {
    if (dueno === uid && token !== excepto) cache.delete(token);
  }
  const sesiones = await almacen.sesiones.listar({ uid });
  await Promise.all(sesiones.filter((s) => s.id !== excepto).map((s) => almacen.sesiones.eliminar(s.id)));
}

export function leerToken(cabecera: string | undefined): string | null {
  const [tipo, token] = (cabecera ?? '').split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

async function uidDe(token: string): Promise<string | undefined> {
  const enCache = cache.get(token);
  if (enCache) return enCache;
  const sesion = await almacen.sesiones.obtener(token);
  if (sesion) cache.set(token, sesion.uid);
  return sesion?.uid;
}

/** Exige `Authorization: Bearer <token>` y deja el uid en `res.locals.uid`. */
export const requiereSesion: RequestHandler = (req, res, next) => {
  const token = leerToken(req.headers.authorization);
  const continuar = (uid: string | undefined) => {
    if (!uid) {
      next(new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión para continuar.'));
      return;
    }
    res.locals.uid = uid;
    next();
  };
  if (!token) return continuar(undefined);
  uidDe(token).then(continuar, next);
};
