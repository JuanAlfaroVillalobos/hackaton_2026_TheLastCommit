// Ruta: src/nucleo/autenticacion.ts
// Sesión simulada: el token es un UUID que vive en memoria. Al pasar a Firebase Auth, este middleware
// verifica el ID token con firebase-admin (`getAuth().verifyIdToken`) y deja el uid en `res.locals.uid`.
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { ErrorHttp } from './errores.js';

const sesiones = new Map<string, string>();

export function abrirSesion(uid: string): string {
  const token = randomUUID();
  sesiones.set(token, uid);
  return token;
}

export function cerrarSesion(token: string): void {
  sesiones.delete(token);
}

export function leerToken(cabecera: string | undefined): string | null {
  const [tipo, token] = (cabecera ?? '').split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

/** Exige `Authorization: Bearer <token>` y deja el uid en `res.locals.uid`. */
export const requiereSesion: RequestHandler = (req, res, next) => {
  const token = leerToken(req.headers.authorization);
  const uid = token ? sesiones.get(token) : undefined;
  if (!uid) {
    next(new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión para continuar.'));
    return;
  }
  res.locals.uid = uid;
  next();
};
