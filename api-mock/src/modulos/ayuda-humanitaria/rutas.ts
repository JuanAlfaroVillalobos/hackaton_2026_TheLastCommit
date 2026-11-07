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
rutasAyudaHumanitaria.get('/reportes', async (req, res) => {
  const estado = texto(req.query.estado) as ReporteVulnerabilidad['estado'] | null;
  const lista = await almacen.reportes.listar(estado ? { estado } : {});
  res.json(lista.sort((a, b) => b.creadoEn - a.creadoEn));
});

rutasAyudaHumanitaria.post('/reportes', async (req, res) => {
  const tipo = texto(req.body?.tipo);
  const personas = numero(req.body?.personas);
  const lat = numero(req.body?.lat);
  const lng = numero(req.body?.lng);
  if (!tipo || !personas || personas < 1 || lat === null || lng === null) {
    throw datosInvalidos('Envía tipo, personas (≥ 1), lat y lng.');
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
  res.status(201).json(reporte);
});

/** «Voy a ayudar»: ABIERTO → EN_ATENCION. */
rutasAyudaHumanitaria.post('/reportes/:id/atender', async (req, res) => {
  const reporte = await almacen.reportes.obtener(req.params.id);
  if (!reporte) throw noEncontrado('El reporte');
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
  if (recurso.estado !== 'ABIERTO') throw conflicto('El recurso ya está asignado.');
  res.json(await almacen.recursos.actualizar(recurso.id, { estado: 'ASIGNADO', asignadoId: res.locals.uid }));
});

// --- fichas de contacto de emergencia ---
rutasAyudaHumanitaria.get('/fichas', async (req, res) => {
  const todas = req.query.todas === 'true';
  res.json(await almacen.fichasEmergencia.listar(todas ? {} : { aprobado: true }));
});
