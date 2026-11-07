// Ruta: src/modulos/directorio/rutas.ts
// Directorio de economía local: oficios, servicios y comercios del barrio.
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { ServicioDirectorio } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, texto } from '../../nucleo/utilidades.js';

const TIPOS: ServicioDirectorio['tipo'][] = ['oficio', 'servicio', 'comercio'];

export const rutasDirectorio = Router();
rutasDirectorio.use(requiereSesion);

rutasDirectorio.get('/', async (req, res) => {
  const tipo = texto(req.query.tipo) as ServicioDirectorio['tipo'] | null;
  const lista = await almacen.directorio.listar(tipo ? { tipo } : {});
  res.json(lista.sort((a, b) => b.vistosBuenos - a.vistosBuenos));
});

rutasDirectorio.get('/:id', async (req, res) => {
  const servicio = await almacen.directorio.obtener(req.params.id);
  if (!servicio) throw noEncontrado('El servicio');
  res.json(servicio);
});

rutasDirectorio.post('/', async (req, res) => {
  const tipo = req.body?.tipo as ServicioDirectorio['tipo'];
  const categoria = texto(req.body?.categoria);
  const titulo = texto(req.body?.titulo);
  const telefono = texto(req.body?.telefono);
  if (!TIPOS.includes(tipo) || !categoria || !titulo || !telefono) {
    throw datosInvalidos(`Envía tipo (${TIPOS.join(', ')}), categoria, titulo y telefono.`);
  }
  const servicio = await almacen.directorio.crear({
    id: nuevoId('dir'),
    tipo,
    categoria,
    titulo,
    telefono,
    descripcion: texto(req.body?.descripcion) ?? '',
    whatsapp: texto(req.body?.whatsapp) ?? undefined,
    direccion: texto(req.body?.direccion) ?? undefined,
    vistosBuenos: 0,
  });
  res.status(201).json(servicio);
});

/** Suma un visto bueno. Simulado: no impide votar dos veces (con BD, un doc por vecino y servicio). */
rutasDirectorio.post('/:id/visto-bueno', async (req, res) => {
  const servicio = await almacen.directorio.obtener(req.params.id);
  if (!servicio) throw noEncontrado('El servicio');
  res.json(await almacen.directorio.actualizar(servicio.id, { vistosBuenos: servicio.vistosBuenos + 1 }));
});
