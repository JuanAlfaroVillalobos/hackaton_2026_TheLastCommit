// Ruta: src/modulos/favores/rutas.ts
// Muro de necesidades y ofrecimientos (P04, RF09, RN-04). Devuelve la lista cruda de la zona: el filtro
// exacto por distancia, vencimiento y autor lo hace la app en reglas.prepararMuro, como con Firestore.
import { geohashForLocation } from 'geofire-common';
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { Publicacion } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, numero, texto } from '../../nucleo/utilidades.js';

const VIGENCIA_MS = 24 * 60 * 60_000;

export const rutasFavores = Router();
rutasFavores.use(requiereSesion);

rutasFavores.get('/publicaciones', async (req, res) => {
  const estado = texto(req.query.estado) as Publicacion['estado'] | null;
  res.json(await almacen.publicaciones.listar(estado ? { estado } : {}));
});

rutasFavores.get('/publicaciones/:id', async (req, res) => {
  const publicacion = await almacen.publicaciones.obtener(req.params.id);
  if (!publicacion) throw noEncontrado('La publicación');
  res.json(publicacion);
});

/** Crea una publicación. RN-04: un vecino solo puede tener una necesidad activa a la vez. */
rutasFavores.post('/publicaciones', async (req, res) => {
  const autor = await almacen.usuarios.obtener(res.locals.uid);
  if (!autor) throw noEncontrado('El usuario');

  const tipo = req.body?.tipo === 'OFREZCO' ? 'OFREZCO' : 'NECESITO';
  const categoria = req.body?.categoria === 'PRESTAMO' ? 'PRESTAMO' : 'FAVOR_OFICIO';
  const descripcion = texto(req.body?.descripcion);
  if (!descripcion) throw datosInvalidos('Escribe una descripción.');
  if (tipo === 'NECESITO' && autor.necesidadActivaId) throw conflicto('Ya tienes una necesidad activa (RN-04).');

  const lat = numero(req.body?.lat) ?? autor.ubicacion.lat;
  const lng = numero(req.body?.lng) ?? autor.ubicacion.lng;
  const ahora = Date.now();
  const publicacion = await almacen.publicaciones.crear({
    id: nuevoId('nc'),
    solicitanteId: autor.id,
    autorNombre: autor.nombre,
    prestadorId: null,
    prestadorNombre: null,
    tipo,
    categoria,
    oficioId: texto(req.body?.oficioId),
    descripcion,
    geohash: geohashForLocation([lat, lng], 7),
    estado: 'PUBLICADA',
    etaMinutos: null,
    llegadaEstimada: null,
    devolucionEn: numero(req.body?.devolucionEn),
    expiraEn: ahora + VIGENCIA_MS,
    creadoEn: ahora,
  });
  if (tipo === 'NECESITO') await almacen.usuarios.actualizar(autor.id, { necesidadActivaId: publicacion.id });
  res.status(201).json(publicacion);
});

/** «Yo te ayudo»: PUBLICADA → ACEPTADA. No se puede aceptar la propia. */
rutasFavores.post('/publicaciones/:id/aceptar', async (req, res) => {
  const publicacion = await almacen.publicaciones.obtener(req.params.id);
  if (!publicacion) throw noEncontrado('La publicación');
  if (publicacion.estado !== 'PUBLICADA') throw conflicto('Otro vecino ya la aceptó.');
  if (publicacion.solicitanteId === res.locals.uid) throw conflicto('No puedes aceptar tu propia publicación.');

  const prestador = await almacen.usuarios.obtener(res.locals.uid);
  const etaMinutos = numero(req.body?.etaMinutos) ?? 15;
  res.json(
    await almacen.publicaciones.actualizar(publicacion.id, {
      estado: 'ACEPTADA',
      prestadorId: res.locals.uid,
      prestadorNombre: prestador?.nombre ?? null,
      etaMinutos,
      llegadaEstimada: Date.now() + etaMinutos * 60_000,
    }),
  );
});

/** Cancela la publicación propia y libera la necesidad activa (RN-04). */
rutasFavores.post('/publicaciones/:id/cancelar', async (req, res) => {
  const publicacion = await almacen.publicaciones.obtener(req.params.id);
  if (!publicacion) throw noEncontrado('La publicación');
  if (publicacion.solicitanteId !== res.locals.uid) throw conflicto('Solo quien la publicó puede cancelarla.');

  const actualizada = await almacen.publicaciones.actualizar(publicacion.id, { estado: 'CANCELADA' });
  await almacen.usuarios.actualizar(res.locals.uid, { necesidadActivaId: null });
  res.json(actualizada);
});
