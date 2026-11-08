// Ruta: src/modulos/emergencia/rutas.ts
// Botón SOS (RF20) y modo emergencia de la zona (RF21–RF25). Con ALMACEN=firestore guarda en `alertas`,
// `celdas` y `emergencias/{id}/vecinos/{uid}`. La lógica de la zona vive en zona.ts.
// Pendiente: la entrada por SMS tipo `E` (RF26/RF27), que debe crear la alerta igual que POST /alertas.
import { Router } from 'express';
import { almacen, vecinosDeEmergencia } from '../../datos/almacen.js';
import type { AlertaEmergencia, Usuario } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, numero, texto } from '../../nucleo/utilidades.js';
import { celdaDe, recalcularCelda, VENTANA_MS } from './conteo.js';
import { estadoDe, procesarAlerta, registrarPresencia, responder } from './zona.js';

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

async function usuarioDeSesion(uid: string): Promise<Usuario> {
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');
  return usuario;
}

/** Guarda la ubicación que mandó la app como última ubicación del vecino (lo vuelve «activo», RN-11). */
async function actualizarUbicacion(usuario: Usuario, lat: number, lng: number, ahora: number): Promise<Usuario> {
  const cambios = { ubicacion: { lat, lng }, ubicacionEn: ahora, celdaH3: celdaDe(lat, lng) };
  return (await almacen.usuarios.actualizar(usuario.id, cambios)) ?? { ...usuario, ...cambios };
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
  let autor = await usuarioDeSesion(res.locals.uid);
  const enviada = coordenada(numero(req.body?.lat), numero(req.body?.lng));
  const ahora = Date.now();
  if (enviada) autor = await actualizarUbicacion(autor, enviada.lat, enviada.lng, ahora);

  const { lat, lng } = enviada ?? autor.ubicacion;
  const celdaH3 = celdaDe(lat, lng);

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
  if (creada) {
    const conteo = await recalcularCelda(celdaH3, ahora);
    console.log(`[SOS] ${alerta.autorNombre} en ${celdaH3}: ${conteo.alertantes} alertante(s) en 10 min`);
  }
  // También con la alerta repetida: si estaba A_SALVO en una zona en emergencia, vuelve a NECESITA_AYUDA.
  await procesarAlerta(alerta, autor, ahora);
  res.status(creada ? 201 : 200).json(alerta);
});

/** Cierra una alerta propia: ACTIVA → CANCELADA, y deja de contar en su celda. */
rutasEmergencia.post('/alertas/:id/cancelar', async (req, res) => {
  const alerta = await almacen.alertas.obtener(req.params.id);
  if (!alerta) throw noEncontrado('La alerta');
  if (alerta.autorId !== res.locals.uid) throw conflicto('Solo quien envió la alerta puede cancelarla.');
  if (alerta.estado !== 'ACTIVA') throw conflicto('La alerta ya no está activa.');
  const cancelada = await almacen.alertas.actualizar(alerta.id, { estado: 'CANCELADA' });
  await recalcularCelda(alerta.celdaH3);
  // Falsa alarma dentro de una emergencia: el vecino queda A_SALVO.
  if (alerta.emergenciaId) {
    const autor = await usuarioDeSesion(res.locals.uid);
    const { emergencia, yo } = await estadoDe(autor);
    if (emergencia?.id === alerta.emergenciaId && yo?.estado === 'NECESITA_AYUDA') await responder(autor, 'A_SALVO');
  }
  res.json(cancelada);
});

/** Conteo de la celda de una ubicación (o de la del perfil). La app lo puede consultar cada 5 s. */
rutasEmergencia.get('/celda', async (req, res) => {
  const autor = await almacen.usuarios.obtener(res.locals.uid);
  if (!autor) throw noEncontrado('El usuario');
  const { lat, lng } = coordenada(numeroQuery(req.query.lat), numeroQuery(req.query.lng)) ?? autor.ubicacion;
  res.json(await recalcularCelda(celdaDe(lat, lng)));
});

// ---------- Modo emergencia (RF21–RF25) ----------

/** Emergencia activa del vecino (o null) y su estado en ella. */
rutasEmergencia.get('/actual', async (_req, res) => {
  res.json(await estadoDe(await usuarioDeSesion(res.locals.uid)));
});

/**
 * La app abrió o volvió del segundo plano: `{ lat?, lng? }` actualiza su ubicación y, si su zona está
 * en emergencia, lo suma como SIN_RESPONDER. Responde lo mismo que GET /actual.
 */
rutasEmergencia.post('/presencia', async (req, res) => {
  let usuario = await usuarioDeSesion(res.locals.uid);
  const enviada = coordenada(numero(req.body?.lat), numero(req.body?.lng));
  if (enviada) usuario = await actualizarUbicacion(usuario, enviada.lat, enviada.lng, Date.now());
  res.json(await registrarPresencia(usuario));
});

/** RF24: `{ estado: 'A_SALVO' | 'NECESITA_AYUDA' }` desde P12 o desde la acción de la notificación. */
rutasEmergencia.post('/respuesta', async (req, res) => {
  const estado = req.body?.estado;
  if (estado !== 'A_SALVO' && estado !== 'NECESITA_AYUDA') throw datosInvalidos('estado debe ser A_SALVO o NECESITA_AYUDA.');
  res.json(await responder(await usuarioDeSesion(res.locals.uid), estado));
});

/**
 * RF22 (P11): vecinos de la emergencia del vecino que necesitan atención (NECESITA_AYUDA o
 * SIN_RESPONDER). RN-14: solo los ve quien está en la zona; fuera de una emergencia, lista vacía.
 */
rutasEmergencia.get('/vecinos', async (_req, res) => {
  const { emergencia } = await estadoDe(await usuarioDeSesion(res.locals.uid));
  if (!emergencia) {
    res.json([]);
    return;
  }
  const vecinos = await vecinosDeEmergencia(emergencia.id).listar();
  res.json(vecinos.filter((v) => v.estado !== 'A_SALVO').sort((a, b) => (b.ultimaAlertaEn ?? 0) - (a.ultimaAlertaEn ?? 0)));
});
