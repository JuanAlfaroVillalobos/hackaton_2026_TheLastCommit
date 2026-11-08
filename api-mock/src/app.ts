// Ruta: src/app.ts
import cors from 'cors';
import express from 'express';
import { manejarErrores, rutaNoEncontrada } from './nucleo/errores.js';
import { idempotencia } from './nucleo/idempotencia.js';
import { panelDev } from './nucleo/panelDev.js';
import { rutasAuth } from './modulos/auth/rutas.js';
import { rutasAyudaHumanitaria } from './modulos/ayuda-humanitaria/rutas.js';
import { rutasDirectorio } from './modulos/directorio/rutas.js';
import { rutasEmergencia } from './modulos/emergencia/rutas.js';
import { rutasFavores } from './modulos/favores/rutas.js';
import { rutasIdentidad } from './modulos/identidad/rutas.js';
import { rutasAvatares, rutasVecinos } from './modulos/vecinos/rutas.js';

/** Latencia artificial en ms (env RETRASO_MS) para ver los estados de carga de la app. */
const RETRASO_MS = Number(process.env.RETRASO_MS ?? 0);

export function crearApp() {
  const app = express();
  app.use(cors());
  // Las fotos (perfil, DNI y selfie) llegan en base64: hasta ~2 MB cada una.
  app.use(express.json({ limit: '6mb' }));
  // RN-20: no repetir acciones reenviadas por la bandeja de salida (cabecera X-Id-Accion).
  app.use(idempotencia);
  if (RETRASO_MS > 0) app.use((_req, _res, next) => void setTimeout(next, RETRASO_MS));

  app.get('/salud', (_req, res) => {
    res.json({ ok: true, servicio: 'vecinos-api-mock', hora: Date.now() });
  });

  // Panel para ver los datos en memoria desde el navegador (solo en desarrollo).
  if (process.env.NODE_ENV !== 'production') app.use('/dev', panelDev);

  const v1 = express.Router();
  v1.use('/auth', rutasAuth);
  v1.use('/vecinos', rutasVecinos);
  v1.use('/avatares', rutasAvatares);
  v1.use('/identidad', rutasIdentidad);
  v1.use('/favores', rutasFavores);
  v1.use('/directorio', rutasDirectorio);
  v1.use('/ayuda-humanitaria', rutasAyudaHumanitaria);
  v1.use('/emergencia', rutasEmergencia);
  app.use('/api/v1', v1);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
