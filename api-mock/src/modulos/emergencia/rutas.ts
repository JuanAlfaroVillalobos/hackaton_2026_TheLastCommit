// Ruta: src/modulos/emergencia/rutas.ts
// Botón SOS (RF20). Con Firebase será la función invocable `registrarAlerta`, que además notifica
// a los vecinos cercanos (FCM) y, sin internet, llega por SMS tipo `E` (RF26).
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { AlertaEmergencia } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, numero, texto } from '../../nucleo/utilidades.js';

export const rutasEmergencia = Router();
rutasEmergencia.use(requiereSesion);

rutasEmergencia.get('/alertas', async (req, res) => {
  const estado = texto(req.query.estado) as AlertaEmergencia['estado'] | null;
  const lista = await almacen.alertas.listar(estado ? { estado } : {});
  res.json(lista.sort((a, b) => b.creadoEn - a.creadoEn));
});

/** Registra una alerta. Si no llega ubicación, usa la del perfil del vecino. */
rutasEmergencia.post('/alertas', async (req, res) => {
  const autor = await almacen.usuarios.obtener(res.locals.uid);
  if (!autor) throw noEncontrado('El usuario');

  const alerta = await almacen.alertas.crear({
    id: nuevoId('al'),
    autorId: autor.id,
    autorNombre: autor.nombre,
    lat: numero(req.body?.lat) ?? autor.ubicacion.lat,
    lng: numero(req.body?.lng) ?? autor.ubicacion.lng,
    estado: 'ACTIVA',
    canal: req.body?.canal === 'SMS' ? 'SMS' : 'APP',
    creadoEn: Date.now(),
  });
  console.log(`[SOS] ${alerta.autorNombre} (${alerta.lat}, ${alerta.lng})`);
  res.status(201).json(alerta);
});

/** Cierra una alerta propia: ACTIVA → CANCELADA. */
rutasEmergencia.post('/alertas/:id/cancelar', async (req, res) => {
  const alerta = await almacen.alertas.obtener(req.params.id);
  if (!alerta) throw noEncontrado('La alerta');
  if (alerta.autorId !== res.locals.uid) throw conflicto('Solo quien envió la alerta puede cancelarla.');
  if (alerta.estado !== 'ACTIVA') throw conflicto('La alerta ya no está activa.');
  res.json(await almacen.alertas.actualizar(alerta.id, { estado: 'CANCELADA' }));
});
