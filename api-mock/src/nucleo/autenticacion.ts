// Ruta: src/nucleo/autenticacion.ts
// Quién hace la petición. Dos modos, según AUTENTICACION en .env:
//  - firebase: el token es un ID token de Firebase Auth y se verifica con firebase-admin.
//  - local (por defecto): el token es un UUID guardado en `sesiones/{token}` (Firestore con
//    ALMACEN=firestore, así un reinicio de la API no saca a todos de la app; memoria si no).
// En ambos, el uid queda en `res.locals.uid` y las rutas no cambian.
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { almacen } from '../datos/almacen.js';
import type { Sesion } from '../datos/tipos.js';
import { ErrorHttp } from './errores.js';
import { revocarSesionesAuth, USA_FIREBASE_AUTH, verificarToken } from './firebaseAuth.js';

/** Una sesión local dura 30 días desde que se abre. */
const DURACION_MS = 30 * 24 * 60 * 60 * 1000;
/** Caché en memoria para no leer Firestore en cada petición. */
const CACHE_MS = 60_000;
const cache = new Map<string, { uid: string; hasta: number }>();

/** Lo que devuelven ingresar, registro, restablecer y renovar. */
export interface TokensSesion {
  token: string;
  /** Solo con Firebase Auth: para pedir un token nuevo cuando el actual vence. */
  renovacion: string | null;
  expiraEn: number;
}

const venceEn = (s: Sesion) => s.venceEn ?? s.creadoEn + DURACION_MS;

/**
 * @description Abre una sesión local para el usuario y devuelve su token (modo local).
 */
export async function abrirSesion(uid: string): Promise<TokensSesion> {
  const token = randomUUID();
  const ahora = Date.now();
  await almacen.sesiones.guardar({ id: token, uid, creadoEn: ahora, venceEn: ahora + DURACION_MS });
  cache.set(token, { uid, hasta: ahora + CACHE_MS });
  return { token, renovacion: null, expiraEn: ahora + DURACION_MS };
}

export async function cerrarSesion(token: string): Promise<void> {
  cache.delete(token);
  if (!USA_FIREBASE_AUTH) await almacen.sesiones.eliminar(token);
}

/**
 * @description Cierra todas las sesiones de un usuario (cambio de clave, cuenta eliminada), salvo `excepto` en modo local.
 */
export async function cerrarSesionesDe(uid: string, excepto?: string | null): Promise<void> {
  for (const [token, c] of cache) if (c.uid === uid && token !== excepto) cache.delete(token);
  if (USA_FIREBASE_AUTH) {
    await revocarSesionesAuth(uid).catch(() => undefined);
    return;
  }
  const sesiones = await almacen.sesiones.listar({ uid });
  await Promise.all(sesiones.filter((s) => s.id !== excepto).map((s) => almacen.sesiones.eliminar(s.id)));
}

export function leerToken(cabecera: string | undefined): string | null {
  const [tipo, token] = (cabecera ?? '').split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

/**
 * @description Devuelve el uid dueño de un token local, o null si no existe o venció.
 */
async function uidDeTokenLocal(token: string): Promise<string | null> {
  const enCache = cache.get(token);
  if (enCache && enCache.hasta > Date.now()) return enCache.uid;

  const sesion = await almacen.sesiones.obtener(token);
  if (!sesion || venceEn(sesion) < Date.now()) {
    cache.delete(token);
    if (sesion) await almacen.sesiones.eliminar(token).catch(() => undefined);
    return null;
  }
  cache.set(token, { uid: sesion.uid, hasta: Date.now() + CACHE_MS });
  return sesion.uid;
}

/** Exige `Authorization: Bearer <token>` y deja el uid en `res.locals.uid`. */
export const requiereSesion: RequestHandler = async (req, res, next) => {
  const token = leerToken(req.headers.authorization);
  if (!token) {
    next(new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión para continuar.'));
    return;
  }
  try {
    if (USA_FIREBASE_AUTH) {
      const decodificado = await verificarToken(token);
      res.locals.uid = decodificado.uid;
      res.locals.correoVerificado = decodificado.email_verified === true;
      next();
      return;
    }
    const uid = await uidDeTokenLocal(token);
    if (!uid) {
      next(new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión para continuar.'));
      return;
    }
    res.locals.uid = uid;
    next();
  } catch (error) {
    next(error);
  }
};
