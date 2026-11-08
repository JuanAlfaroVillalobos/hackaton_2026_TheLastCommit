// Ruta: src/nucleo/notificar.ts
// Envío de notificaciones (README 9.1). Cualquier módulo llama a notificar(uids, carga):
//  1) La guarda en el buzón del vecino → la app la recoge por sondeo (GET /vecinos/yo/notificaciones).
//  2) Si existe FCM_CUENTA_SERVICIO (ruta a la cuenta de servicio de Firebase), también la manda por
//     FCM HTTP v1 → llega con la app cerrada. Sin dependencias: el JWT se firma con node:crypto.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { almacen } from '../datos/almacen.js';
import { nuevoId } from './utilidades.js';

/** Igual que CargaNotificacion en movil/src/nucleo/notificaciones/tipos.ts. FCM solo admite textos. */
export interface CargaNotificacion {
  modulo: string;
  tipo: string;
  titulo?: string;
  cuerpo?: string;
  canal?: 'general' | 'emergencias';
  ruta?: string;
  pantallaCompleta?: 'si' | 'no';
  [campo: string]: string | undefined;
}

export interface NotificacionGuardada extends Record<string, string | undefined> {
  idNotificacion: string;
  creadaEn: string;
}

const MAX_POR_BUZON = 50;
const buzones = new Map<string, { creadaEn: number; datos: NotificacionGuardada }[]>();

/**
 * @description Envía la misma notificación a varios vecinos. Devuelve su id. Nunca lanza: si FCM falla, queda el buzón.
 */
export async function notificar(uids: string[], carga: CargaNotificacion): Promise<string> {
  const idNotificacion = nuevoId('nt');
  const creadaEn = Date.now();
  const datos: NotificacionGuardada = { ...limpiar(carga), idNotificacion, creadaEn: String(creadaEn) };

  for (const uid of new Set(uids)) {
    const buzon = buzones.get(uid) ?? [];
    buzon.push({ creadaEn, datos });
    if (buzon.length > MAX_POR_BUZON) buzon.splice(0, buzon.length - MAX_POR_BUZON);
    buzones.set(uid, buzon);
  }

  void enviarPorFcm([...new Set(uids)], datos).catch((e) => console.warn('[notificar] FCM:', e.message));
  return idNotificacion;
}

/**
 * @description Notificaciones del vecino creadas después de `desde` (ms). Las recoge el sondeo de la app.
 */
export function leerBuzon(uid: string, desde: number): { notificaciones: NotificacionGuardada[]; hasta: number } {
  const hasta = Date.now();
  const notificaciones = (buzones.get(uid) ?? []).filter((n) => n.creadaEn > desde).map((n) => n.datos);
  return { notificaciones, hasta };
}

function limpiar(carga: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(carga).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
}

// ---------- FCM HTTP v1 ----------

interface CuentaServicio {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cuenta: CuentaServicio | null | undefined;
let acceso: { token: string; vence: number } | null = null;

function leerCuenta(): CuentaServicio | null {
  if (cuenta !== undefined) return cuenta;
  const ruta = process.env.FCM_CUENTA_SERVICIO;
  try {
    cuenta = ruta ? (JSON.parse(readFileSync(ruta, 'utf8')) as CuentaServicio) : null;
  } catch {
    console.warn(`[notificar] No se pudo leer FCM_CUENTA_SERVICIO (${ruta}). Solo se usará el buzón.`);
    cuenta = null;
  }
  return cuenta;
}

const base64url = (texto: string | Buffer) => Buffer.from(texto).toString('base64url');

async function tokenAcceso(c: CuentaServicio): Promise<string> {
  if (acceso && acceso.vence > Date.now() + 60_000) return acceso.token;
  const ahora = Math.floor(Date.now() / 1000);
  const encabezado = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const reclamos = base64url(
    JSON.stringify({
      iss: c.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    }),
  );
  const firma = createSign('RSA-SHA256').update(`${encabezado}.${reclamos}`).sign(c.private_key);
  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${encabezado}.${reclamos}.${base64url(firma)}`,
    }),
  });
  if (!respuesta.ok) throw new Error(`OAuth ${respuesta.status}`);
  const { access_token, expires_in } = (await respuesta.json()) as { access_token: string; expires_in: number };
  acceso = { token: access_token, vence: Date.now() + expires_in * 1000 };
  return access_token;
}

async function enviarPorFcm(uids: string[], datos: NotificacionGuardada): Promise<void> {
  const c = leerCuenta();
  if (!c) return;
  const token = await tokenAcceso(c);
  const urgente = datos.canal === 'emergencias';

  for (const uid of uids) {
    const usuario = await almacen.usuarios.obtener(uid);
    for (const dispositivo of usuario?.dispositivos ?? []) {
      // Solo `data`: la app decide cómo mostrarla (canal, botones, pantalla completa).
      const respuesta = await fetch(`https://fcm.googleapis.com/v1/projects/${c.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: dispositivo,
            data: limpiar(datos),
            android: { priority: urgente ? 'HIGH' : 'NORMAL', ttl: urgente ? '600s' : '86400s' },
          },
        }),
      });
      // 404 UNREGISTERED: el token caducó o la app se desinstaló; se quita del perfil.
      if (respuesta.status === 404) {
        const actual = await almacen.usuarios.obtener(uid);
        if (actual) {
          await almacen.usuarios.actualizar(uid, {
            dispositivos: (actual.dispositivos ?? []).filter((t) => t !== dispositivo),
          });
        }
      }
    }
  }
}
