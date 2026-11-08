// Ruta: src/modulos/vecinos/rutas.ts
// Perfil del vecino con sesión (P03, P10, y el «vecino actual» que usa P04). Dueño: Persona A (cuentas).
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { Usuario } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { leerBuzon, notificar } from '../../nucleo/notificar.js';
import { numero, texto } from '../../nucleo/utilidades.js';
import { aPublico } from '../auth/rutas.js';
import { exigirTelefonoLibre, normalizarTelefono, validarOficios } from '../auth/validaciones.js';

export const rutasVecinos = Router();
rutasVecinos.use(requiereSesion);

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
    const nombre = texto(req.body.nombre);
    if (!nombre || nombre.length < 2 || nombre.length > 60) throw datosInvalidos('El nombre debe tener de 2 a 60 caracteres.');
    cambios.nombre = nombre;
  }
  if (req.body?.barrio !== undefined) {
    const barrio = texto(req.body.barrio);
    if (barrio) cambios.barrio = barrio;
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
