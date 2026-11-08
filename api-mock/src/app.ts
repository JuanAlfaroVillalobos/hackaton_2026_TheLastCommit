// Ruta: src/app.ts
import cors from 'cors';
import express from 'express';
import { manejarErrores, rutaNoEncontrada } from './nucleo/errores.js';
import { idempotencia } from './nucleo/idempotencia.js';
import { rutasAuth } from './modulos/auth/rutas.js';
import { rutasAyudaHumanitaria } from './modulos/ayuda-humanitaria/rutas.js';
import { rutasDirectorio } from './modulos/directorio/rutas.js';
import { rutasEmergencia } from './modulos/emergencia/rutas.js';
import { rutasFavores } from './modulos/favores/rutas.js';
import { rutasVecinos } from './modulos/vecinos/rutas.js';

/** Latencia artificial en ms (env RETRASO_MS) para ver los estados de carga de la app. */
const RETRASO_MS = Number(process.env.RETRASO_MS ?? 0);

export function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  // RN-20: no repetir acciones reenviadas por la bandeja de salida (cabecera X-Id-Accion).
  app.use(idempotencia);
  if (RETRASO_MS > 0) app.use((_req, _res, next) => void setTimeout(next, RETRASO_MS));

  app.get('/salud', (_req, res) => {
    res.json({ ok: true, servicio: 'vecinos-api-mock', hora: Date.now() });
  });

  const v1 = express.Router();
  v1.use('/auth', rutasAuth);
  v1.use('/vecinos', rutasVecinos);
  v1.use('/favores', rutasFavores);
  v1.use('/directorio', rutasDirectorio);
  v1.use('/ayuda-humanitaria', rutasAyudaHumanitaria);
  v1.use('/emergencia', rutasEmergencia);
  app.use('/api/v1', v1);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
