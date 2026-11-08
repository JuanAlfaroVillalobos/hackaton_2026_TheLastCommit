// Ruta: src/modulos/emergencia/rutas.ts
// Botón SOS (RF20). Con ALMACEN=firestore guarda en `alertas` y el conteo en `celdas`.
// Pendiente: activar la emergencia por umbral (RF21, RN-11), notificar a los vecinos cercanos con
// notificar() y la entrada por SMS tipo `E` (RF26/RF27), que debe crear la alerta igual que POST /alertas.
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { AlertaEmergencia } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, numero, texto } from '../../nucleo/utilidades.js';
import { celdaDe, recalcularCelda, VENTANA_MS } from './conteo.js';

export const rutasEmergencia = Router();
rutasEmergencia.use(requiereSesion);

/** Número de la query string (`?lat=-8.1`); vacío o ausente → null. */
const numeroQuery = (valor: unknown) => (typeof valor === 'string' && valor.trim() ? numero(Number(valor)) : null);

/** Ubicación enviada por la app, o null si no llegó completa. Fuera de rango → 400. */
function coordenada(lat: number | null, lng: number | null): { lat: number; lng: number } | null {
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw datosInvalidos('Ubicación fuera de rango.');
  return { lat, lng };
}

rutasEmergencia.get('/alertas', async (req, res) => {
  const estado = texto(req.query.estado) as AlertaEmergencia['estado'] | null;
  const lista = await almacen.alertas.listar(estado ? { estado } : {});
  res.json(lista.sort((a, b) => b.creadoEn - a.creadoEn));
});

/**
 * Registra una alerta. Sin `lat`/`lng` usa la ubicación del perfil.
 * Si el vecino ya tiene una alerta ACTIVA en la misma celda dentro de la ventana de 10 min, responde
 * 200 con esa alerta en vez de crear otra (RN-12: cada vecino cuenta una vez). Si es nueva, 201.
 * La comprobación y la creación son atómicas: dos pulsaciones simultáneas crean una sola alerta.
 */
rutasEmergencia.post('/alertas', async (req, res) => {
  const autor = await almacen.usuarios.obtener(res.locals.uid);
  if (!autor) throw noEncontrado('El usuario');

  const { lat, lng } = coordenada(numero(req.body?.lat), numero(req.body?.lng)) ?? autor.ubicacion;
  const celdaH3 = celdaDe(lat, lng);
  const ahora = Date.now();

  const { fila: alerta, creada } = await almacen.alertas.crearSiNoExiste(
    {
      id: nuevoId('al'),
      autorId: autor.id,
      autorNombre: autor.nombre,
      lat,
      lng,
      celdaH3,
      estado: 'ACTIVA',
      canal: req.body?.canal === 'SMS' ? 'SMS' : 'APP',
      creadoEn: ahora,
    },
    { autorId: autor.id, celdaH3, estado: 'ACTIVA' },
    (previa) => previa.creadoEn >= ahora - VENTANA_MS,
  );
  if (!creada) {
    res.status(200).json(alerta);
    return;
  }

  const conteo = await recalcularCelda(celdaH3, ahora);
  console.log(`[SOS] ${alerta.autorNombre} en ${celdaH3}: ${conteo.alertantes} alertante(s) en 10 min`);
  res.status(201).json(alerta);
});

/** Cierra una alerta propia: ACTIVA → CANCELADA, y deja de contar en su celda. */
rutasEmergencia.post('/alertas/:id/cancelar', async (req, res) => {
  const alerta = await almacen.alertas.obtener(req.params.id);
  if (!alerta) throw noEncontrado('La alerta');
  if (alerta.autorId !== res.locals.uid) throw conflicto('Solo quien envió la alerta puede cancelarla.');
  if (alerta.estado !== 'ACTIVA') throw conflicto('La alerta ya no está activa.');
  const cancelada = await almacen.alertas.actualizar(alerta.id, { estado: 'CANCELADA' });
  await recalcularCelda(alerta.celdaH3);
  res.json(cancelada);
});

/** Conteo de la celda de una ubicación (o de la del perfil). La app lo puede consultar cada 5 s. */
rutasEmergencia.get('/celda', async (req, res) => {
  const autor = await almacen.usuarios.obtener(res.locals.uid);
  if (!autor) throw noEncontrado('El usuario');
  const { lat, lng } = coordenada(numeroQuery(req.query.lat), numeroQuery(req.query.lng)) ?? autor.ubicacion;
  res.json(await recalcularCelda(celdaDe(lat, lng)));
});
