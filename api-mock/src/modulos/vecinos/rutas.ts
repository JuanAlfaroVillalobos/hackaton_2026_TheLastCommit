// Ruta: src/modulos/vecinos/rutas.ts
// Perfil del vecino con sesión (P10, y el «vecino actual» que usa P04).
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { noEncontrado } from '../../nucleo/errores.js';
import { texto } from '../../nucleo/utilidades.js';
import { aPublico } from '../auth/rutas.js';

export const rutasVecinos = Router();
rutasVecinos.use(requiereSesion);

rutasVecinos.get('/yo', async (_req, res) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

/** Actualiza nombre, barrio u oficios. El resto de campos lo controla la API. */
rutasVecinos.patch('/yo', async (req, res) => {
  const cambios: { nombre?: string; barrio?: string; oficios?: string[] } = {};
  const nombre = texto(req.body?.nombre);
  const barrio = texto(req.body?.barrio);
  if (nombre) cambios.nombre = nombre;
  if (barrio) cambios.barrio = barrio;
  if (Array.isArray(req.body?.oficios)) cambios.oficios = req.body.oficios.filter((o: unknown) => typeof o === 'string');

  const usuario = await almacen.usuarios.actualizar(res.locals.uid, cambios);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});
