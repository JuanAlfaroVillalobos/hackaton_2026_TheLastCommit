// Ruta: src/modulos/vecinos/rutas.ts
// Perfil del vecino con sesión (P03, P10, y el «vecino actual» que usa P04). Dueño: Persona A (cuentas).
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { Usuario } from '../../datos/tipos.js';
import { cerrarSesionesDe, requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import { leerBuzon, notificar } from '../../nucleo/notificar.js';
import { numero, texto } from '../../nucleo/utilidades.js';
import { aPublico } from '../auth/rutas.js';
import { borrarFotosIdentidad } from '../identidad/rutas.js';
import { exigirTelefonoLibre, normalizarTelefono, validarNombre, validarOficios } from '../auth/validaciones.js';

export const rutasVecinos = Router();
rutasVecinos.use(requiereSesion);

/** Fotos de perfil (RF06). Son públicas dentro de la comunidad: las sirve /avatares/:uid sin sesión. */
const avatares = new Map<string, { tipo: string; datos: Buffer }>();
export const rutasAvatares = Router();
rutasAvatares.get('/:uid', (req, res) => {
  const foto = avatares.get(String(req.params.uid));
  if (!foto) throw noEncontrado('La foto');
  res.set('Cache-Control', 'public, max-age=86400').type(foto.tipo).send(foto.datos);
});

rutasVecinos.get('/yo', async (_req, res) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

/** Actualiza nombre, barrio, teléfono u oficios (RF05). El resto de campos lo controla la API. */
rutasVecinos.patch('/yo', async (req, res) => {
  const uid: string = res.locals.uid;
  const cambios: Partial<Usuario> = {};

  if (req.body?.nombre !== undefined) {
    cambios.nombre = validarNombre(req.body.nombre);
  }
  if (req.body?.barrio !== undefined) {
    const barrio = texto(req.body.barrio)?.replace(/\s+/g, ' ');
    if (!barrio || barrio.length < 3 || barrio.length > 60) throw datosInvalidos('El barrio debe tener de 3 a 60 caracteres.');
    cambios.barrio = barrio;
  }
  if (req.body?.telefono !== undefined) {
    const telefono = normalizarTelefono(req.body.telefono);
    if (!telefono) throw datosInvalidos('Escribe un celular peruano de 9 dígitos que empiece en 9.');
    await exigirTelefonoLibre(telefono, uid);
    cambios.telefono = telefono;
  }
  if (req.body?.oficios !== undefined) cambios.oficios = validarOficios(req.body.oficios);

  const usuario = await almacen.usuarios.actualizar(uid, cambios);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

/**
 * Última ubicación validada del vecino (RF42). La envían useUbicacionValidada() y la tarea en
 * segundo plano durante un servicio (RF13). Responde 204: la app ya tiene la coordenada.
 */
rutasVecinos.post('/yo/ubicacion', async (req, res) => {
  const lat = numero(req.body?.lat);
  const lng = numero(req.body?.lng);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw datosInvalidos('Envía lat y lng válidos.');
  }
  const tomadaEn = numero(req.body?.tomadaEn) ?? Date.now();
  const usuario = await almacen.usuarios.actualizar(res.locals.uid, {
    ubicacion: { lat, lng },
    ubicacionEn: Math.min(tomadaEn, Date.now()),
    ubicacionManual: req.body?.manual === true,
  });
  if (!usuario) throw noEncontrado('El usuario');
  res.status(204).end();
});

// ---------- Notificaciones (README 9.1) ----------

const MAX_DISPOSITIVOS = 5;

/** Registra el token de FCM del teléfono (lo llama registrarDispositivo() al iniciar sesión). */
rutasVecinos.post('/yo/dispositivos', async (req, res) => {
  const token = texto(req.body?.token);
  if (!token || token.length > 4096) throw datosInvalidos('Envía el token de FCM del dispositivo.');
  const uid: string = res.locals.uid;

  // Un teléfono solo recibe avisos de la última cuenta que inició sesión en él.
  for (const otro of await almacen.usuarios.listar()) {
    if (otro.id !== uid && otro.dispositivos?.includes(token)) {
      await almacen.usuarios.actualizar(otro.id, { dispositivos: otro.dispositivos.filter((t) => t !== token) });
    }
  }
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');
  const dispositivos = [...(usuario.dispositivos ?? []).filter((t) => t !== token), token].slice(-MAX_DISPOSITIVOS);
  await almacen.usuarios.actualizar(uid, { dispositivos });
  res.status(204).end();
});

/** Al cerrar sesión: el teléfono deja de recibir avisos de esta cuenta. */
rutasVecinos.delete('/yo/dispositivos/:token', async (req, res) => {
  const uid: string = res.locals.uid;
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');
  const token = String(req.params.token);
  await almacen.usuarios.actualizar(uid, { dispositivos: (usuario.dispositivos ?? []).filter((t) => t !== token) });
  res.status(204).end();
});

/** Buzón para el sondeo de la app: notificaciones creadas después de `desde` (ms). */
rutasVecinos.get('/yo/notificaciones', (req, res) => {
  const desde = Number(req.query.desde ?? 0);
  res.json(leerBuzon(res.locals.uid, Number.isFinite(desde) ? desde : 0));
});

/**
 * Prueba de la demo: se envía una notificación a sí mismo.
 * Cuerpo opcional: { canal: 'general' | 'emergencias', titulo, cuerpo, ruta }.
 */
rutasVecinos.post('/yo/notificaciones/prueba', async (req, res) => {
  const canal = req.body?.canal === 'emergencias' ? 'emergencias' : 'general';
  const idNotificacion = await notificar([res.locals.uid], {
    modulo: 'cuentas',
    tipo: 'prueba',
    canal,
    titulo: texto(req.body?.titulo) ?? (canal === 'emergencias' ? 'Alerta de prueba' : 'Notificación de prueba'),
    cuerpo: texto(req.body?.cuerpo) ?? 'Si ves esto, las notificaciones de Vecinos funcionan.',
    ruta: texto(req.body?.ruta) ?? undefined,
    pantallaCompleta: canal === 'emergencias' ? 'si' : 'no',
  });
  res.status(201).json({ idNotificacion });
});

// ---------- Foto de perfil (RF06) ----------

const MAX_AVATAR_BYTES = 1024 * 1024;

/** Recibe la foto ya recortada y reducida por la app (512×512, JPEG) en data URI. */
rutasVecinos.put('/yo/foto', async (req, res) => {
  const uid: string = res.locals.uid;
  const coincide =
    typeof req.body?.imagen === 'string' ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(req.body.imagen) : null;
  if (!coincide) throw datosInvalidos('Envía la foto como imagen JPEG, PNG o WebP.');
  const datos = Buffer.from(coincide[2], 'base64');
  if (datos.length > MAX_AVATAR_BYTES) throw datosInvalidos('La foto pesa más de 1 MB.');
  avatares.set(uid, { tipo: coincide[1], datos });
  // `v` cambia la URL para que la app no muestre la foto anterior guardada en caché.
  const usuario = await almacen.usuarios.actualizar(uid, { fotoUrl: `/avatares/${uid}?v=${Date.now()}` });
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

rutasVecinos.delete('/yo/foto', async (_req, res) => {
  const uid: string = res.locals.uid;
  avatares.delete(uid);
  const usuario = await almacen.usuarios.actualizar(uid, { fotoUrl: null });
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

// ---------- Eliminar cuenta (derecho de cancelación, Ley 29733) ----------

/** Pide la clave y la palabra ELIMINAR. Borra el perfil, la foto, el DNI y las sesiones. */
rutasVecinos.post('/yo/eliminar', async (req, res) => {
  const uid: string = res.locals.uid;
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');
  if (req.body?.confirmacion !== 'ELIMINAR') throw datosInvalidos('Escribe ELIMINAR para confirmar.');
  if (typeof req.body?.clave !== 'string' || req.body.clave !== usuario.clave) {
    throw new ErrorHttp(400, 'CLAVE_INCORRECTA', 'La clave no es correcta.');
  }
  if (usuario.necesidadActivaId) {
    throw conflicto('Tienes un pedido de ayuda activo. Ciérralo o cancélalo antes de eliminar tu cuenta.');
  }

  avatares.delete(uid);
  borrarFotosIdentidad(uid);
  await almacen.usuarios.eliminar(uid);
  cerrarSesionesDe(uid);
  res.status(204).end();
});
