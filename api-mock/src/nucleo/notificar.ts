// Ruta: src/nucleo/notificar.ts
// Envío de notificaciones (README 9.1). Cualquier módulo llama a notificar(uids, carga):
//  1) La guarda en el buzón del vecino (colección `notificaciones`) → la app la recoge por sondeo
//     (GET /vecinos/yo/notificaciones). Funciona siempre, también con el emulador.
//  2) Con FCM=si (y credenciales reales: GOOGLE_APPLICATION_CREDENTIALS), también la manda por FCM con
//     firebase-admin → llega con la app cerrada. El emulador de Firebase no tiene FCM.
import { getMessaging } from 'firebase-admin/messaging';
import { almacen } from '../datos/almacen.js';
import { appFirebase } from './firebase.js';
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

export const USA_FCM = process.env.FCM === 'si';
const MAX_POR_BUZON = 50;

function limpiar(carga: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(carga).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
}

/**
 * @description Envía la misma notificación a varios vecinos. Devuelve su id. Nunca lanza: si FCM falla, queda el buzón.
 */
export async function notificar(uids: string[], carga: CargaNotificacion): Promise<string> {
  const idNotificacion = nuevoId('nt');
  const creadaEn = Date.now();
  const datos = limpiar({ ...carga, idNotificacion, creadaEn: String(creadaEn) });
  const destinatarios = [...new Set(uids)];

  await Promise.all(
    destinatarios.map((uid) =>
      almacen.notificaciones
        .guardar({ id: `${idNotificacion}_${uid}`, uid, creadaEn, datos })
        .catch((e: Error) => console.warn('[notificar] buzón:', e.message)),
    ),
  );

  if (USA_FCM) void enviarPorFcm(destinatarios, datos).catch((e: Error) => console.warn('[notificar] FCM:', e.message));
  return idNotificacion;
}

/**
 * @description Notificaciones del vecino creadas después de `desde` (ms). Borra las más antiguas si pasan de 50.
 */
export async function leerBuzon(uid: string, desde: number): Promise<{ notificaciones: NotificacionGuardada[]; hasta: number }> {
  const hasta = Date.now();
  const todas = (await almacen.notificaciones.listar({ uid })).sort((a, b) => b.creadaEn - a.creadaEn);
  const sobran = todas.slice(MAX_POR_BUZON);
  if (sobran.length) void Promise.all(sobran.map((n) => almacen.notificaciones.eliminar(n.id))).catch(() => undefined);

  const notificaciones = todas
    .slice(0, MAX_POR_BUZON)
    .filter((n) => n.creadaEn > desde)
    .reverse()
    .map((n) => n.datos as NotificacionGuardada);
  return { notificaciones, hasta };
}

// ---------- FCM con firebase-admin ----------

/** Códigos de FCM que indican que el token ya no sirve (app desinstalada o sesión cerrada). */
const TOKEN_INVALIDO = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

async function enviarPorFcm(uids: string[], datos: Record<string, string>): Promise<void> {
  const urgente = datos.canal === 'emergencias';
  const mensajeria = getMessaging(appFirebase());

  for (const uid of uids) {
    const usuario = await almacen.usuarios.obtener(uid);
    const tokens = usuario?.dispositivos ?? [];
    if (!tokens.length) continue;

    // Solo `data`: la app decide cómo mostrarla (canal, botones, pantalla completa).
    const respuesta = await mensajeria.sendEachForMulticast({
      tokens,
      data: datos,
      android: { priority: urgente ? 'high' : 'normal', ttl: urgente ? 600_000 : 86_400_000 },
    });

    const invalidos = respuesta.responses
      .map((r, i) => (!r.success && r.error && TOKEN_INVALIDO.has(r.error.code) ? tokens[i] : null))
      .filter((t): t is string => t !== null);
    if (invalidos.length) {
      await almacen.usuarios.actualizar(uid, { dispositivos: tokens.filter((t) => !invalidos.includes(t)) });
    }
  }
}
