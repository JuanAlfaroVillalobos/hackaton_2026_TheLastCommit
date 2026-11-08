// Ruta: src/modulos/ayuda-humanitaria/rutas.ts
// Modo emergencia del barrio: vecinos que necesitan ayuda, reportes de vulnerabilidad, recursos críticos
// y fichas de contacto (bomberos, serenazgo, etc.).
import { geohashForLocation } from 'geofire-common';
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import { ZONA_DEMO } from '../../datos/semillas.js';
import type { RecursoCritico, ReporteVulnerabilidad } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { nuevoCodigo, nuevoId, numero, texto } from '../../nucleo/utilidades.js';

export const rutasAyudaHumanitaria = Router();
rutasAyudaHumanitaria.use(requiereSesion);

rutasAyudaHumanitaria.get('/zona', (_req, res) => {
  res.json(ZONA_DEMO);
});

/** Vecinos que requieren atención (no incluye ESTOY_BIEN), como reglas.requiereAtencion de la app. */
rutasAyudaHumanitaria.get('/vecinos', async (req, res) => {
  const todos = req.query.todos === 'true';
  const lista = await almacen.vecinosEmergencia.listar();
  res.json(todos ? lista : lista.filter((v) => v.estado !== 'ESTOY_BIEN'));
});

// --- reportes de vulnerabilidad ---
/** Fotos de los reportes (JPEG en base64), aparte para que la lista no las arrastre en cada consulta. */
const fotosReportes = new Map<string, string>();
const MAX_FOTO_BASE64 = 90_000; // el cuerpo JSON de la API admite 100 kb

rutasAyudaHumanitaria.get('/reportes', async (req, res) => {
  const estado = texto(req.query.estado) as ReporteVulnerabilidad['estado'] | null;
  const lista = await almacen.reportes.listar(estado ? { estado } : {});
  res.json(lista.sort((a, b) => b.creadoEn - a.creadoEn).map((r) => ({ ...r, tieneFoto: fotosReportes.has(r.id) })));
});

rutasAyudaHumanitaria.get('/reportes/:id/foto', async (req, res) => {
  const foto = fotosReportes.get(req.params.id);
  if (!foto) throw noEncontrado('La foto del reporte');
  res.json({ foto });
});

rutasAyudaHumanitaria.post('/reportes', async (req, res) => {
  const tipo = texto(req.body?.tipo);
  const personas = numero(req.body?.personas);
  const lat = numero(req.body?.lat);
  const lng = numero(req.body?.lng);
  if (!tipo || !personas || personas < 1 || lat === null || lng === null) {
    throw datosInvalidos('Envía tipo, personas (≥ 1), lat y lng.');
  }
  const foto = texto(req.body?.foto);
  if (foto && (foto.length > MAX_FOTO_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(foto))) {
    throw datosInvalidos('La foto no es válida o es demasiado grande.');
  }
  const reporte = await almacen.reportes.crear({
    id: nuevoId('rv'),
    codigo: nuevoCodigo(),
    autorId: res.locals.uid,
    tipo,
    personas,
    nota: texto(req.body?.nota) ?? '',
    geohash: geohashForLocation([lat, lng], 7),
    lat,
    lng,
    estado: 'ABIERTO',
    atiendeId: null,
    canal: req.body?.canal === 'SMS' ? 'SMS' : 'APP',
    creadoEn: Date.now(),
  });
  if (foto) fotosReportes.set(reporte.id, foto);
  res.status(201).json({ ...reporte, tieneFoto: Boolean(foto) });
});

/** «Voy a ayudar»: ABIERTO → EN_ATENCION. */
rutasAyudaHumanitaria.post('/reportes/:id/atender', async (req, res) => {
  const reporte = await almacen.reportes.obtener(req.params.id);
  if (!reporte) throw noEncontrado('El reporte');
  if (reporte.autorId === res.locals.uid) throw conflicto('No puedes atender tu propio reporte.');
  if (reporte.estado !== 'ABIERTO') throw conflicto('El reporte ya lo atiende otro vecino.');
  res.json(await almacen.reportes.actualizar(reporte.id, { estado: 'EN_ATENCION', atiendeId: res.locals.uid }));
});

/** EN_ATENCION → RESUELTO, solo quien lo atiende. */
rutasAyudaHumanitaria.post('/reportes/:id/resolver', async (req, res) => {
  const reporte = await almacen.reportes.obtener(req.params.id);
  if (!reporte) throw noEncontrado('El reporte');
  if (reporte.estado !== 'EN_ATENCION' || reporte.atiendeId !== res.locals.uid) {
    throw conflicto('Solo quien atiende el reporte puede marcarlo como resuelto.');
  }
  res.json(await almacen.reportes.actualizar(reporte.id, { estado: 'RESUELTO' }));
});

// --- recursos críticos ---
rutasAyudaHumanitaria.get('/recursos', async (req, res) => {
  const modo = texto(req.query.modo) as RecursoCritico['modo'] | null;
  const lista = await almacen.recursos.listar(modo ? { modo } : {});
  res.json(lista.sort((a, b) => b.creadoEn - a.creadoEn));
});

rutasAyudaHumanitaria.post('/recursos', async (req, res) => {
  const tipo = texto(req.body?.tipo);
  const cantidad = numero(req.body?.cantidad);
  const lat = numero(req.body?.lat);
  const lng = numero(req.body?.lng);
  const modo = req.body?.modo;
  if (!tipo || !cantidad || (modo !== 'OFREZCO' && modo !== 'NECESITO') || lat === null || lng === null) {
    throw datosInvalidos('Envía modo (OFREZCO o NECESITO), tipo, cantidad, lat y lng.');
  }
  const recurso = await almacen.recursos.crear({
    id: nuevoId('rc'),
    codigo: nuevoCodigo(),
    autorId: res.locals.uid,
    modo,
    tipo,
    cantidad,
    geohash: geohashForLocation([lat, lng], 7),
    lat,
    lng,
    estado: 'ABIERTO',
    asignadoId: null,
    canal: req.body?.canal === 'SMS' ? 'SMS' : 'APP',
    creadoEn: Date.now(),
  });
  res.status(201).json(recurso);
});

rutasAyudaHumanitaria.post('/recursos/:id/asignar', async (req, res) => {
  const recurso = await almacen.recursos.obtener(req.params.id);
  if (!recurso) throw noEncontrado('El recurso');
  if (recurso.autorId === res.locals.uid) throw conflicto('No puedes responder a tu propio recurso.');
  if (recurso.estado !== 'ABIERTO') throw conflicto('El recurso ya está asignado.');
  res.json(await almacen.recursos.actualizar(recurso.id, { estado: 'ASIGNADO', asignadoId: res.locals.uid }));
});

/** Cierra el recurso (ya se entregó o ya no hace falta); solo quien lo publicó. */
rutasAyudaHumanitaria.post('/recursos/:id/cerrar', async (req, res) => {
  const recurso = await almacen.recursos.obtener(req.params.id);
  if (!recurso) throw noEncontrado('El recurso');
  if (recurso.autorId !== res.locals.uid) throw conflicto('Solo quien publicó el recurso puede cerrarlo.');
  if (recurso.estado === 'CERRADO') throw conflicto('El recurso ya está cerrado.');
  res.json(await almacen.recursos.actualizar(recurso.id, { estado: 'CERRADO' }));
});

// --- fichas de contacto de emergencia ---
/** Fichas aprobadas, más las que propuso quien consulta y siguen pendientes. `?todas=true` devuelve todas. */
rutasAyudaHumanitaria.get('/fichas', async (req, res) => {
  const todas = req.query.todas === 'true';
  const lista = await almacen.fichasEmergencia.listar({});
  res.json(todas ? lista : lista.filter((f) => f.aprobado || f.propuestaPorId === res.locals.uid));
});

/** Un vecino propone una ficha: queda pendiente (`aprobado = false`) hasta que un validador la acepte. */
rutasAyudaHumanitaria.post('/fichas', async (req, res) => {
  const nombre = texto(req.body?.nombre);
  const tipo = texto(req.body?.tipo);
  const telefono = texto(req.body?.telefono);
  const lat = numero(req.body?.lat);
  const lng = numero(req.body?.lng);
  if (!nombre || !tipo || !telefono || lat === null || lng === null) {
    throw datosInvalidos('Envía nombre, tipo, telefono, lat y lng.');
  }
  const ficha = await almacen.fichasEmergencia.crear({
    id: nuevoId('d'),
    nombre,
    tipo,
    telefono,
    whatsapp: texto(req.body?.whatsapp),
    direccion: texto(req.body?.direccion) ?? '—',
    horario: texto(req.body?.horario) ?? '—',
    geohash: geohashForLocation([lat, lng], 7),
    aprobado: false,
    propuestaPorId: res.locals.uid,
  });
  res.status(201).json(ficha);
});