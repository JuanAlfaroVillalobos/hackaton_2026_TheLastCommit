import { distanceBetween, geohashForLocation } from 'geofire-common';
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import type {
  Calificacion,
  CategoriaPublicacion,
  Coordenada,
  EstadoNecesidad,
  NotificacionFavor,
  Publicacion,
  TipoPublicacion,
  Usuario,
} from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, nuevoCodigo, numero, texto } from '../../nucleo/utilidades.js';
import {
  calcularBloques,
  esParticipante,
  puedeAceptarPorIdentidad,
  puedeCancelar,
  puedeVerUbicacionPrestador,
  puedeVerUbicacionSolicitante,
} from './reglas.js';

const VIGENCIA_MS = 24 * 60 * 60_000;
const MAX_DESCRIPCION = 280;
const MIN_DESCRIPCION = 10;
const ETA_PERMITIDA = [5, 10, 15];
const CATEGORIAS: CategoriaPublicacion[] = ['FAVOR_OFICIO', 'PRESTAMO', 'DONACION', 'INTERCAMBIO', 'MOVILIDAD'];
const TIPOS: TipoPublicacion[] = ['NECESITO', 'OFREZCO'];

type UbicacionPrivada = {
  solicitante: Coordenada;
  prestadorEnVivo: (Coordenada & { actualizadoEn: number }) | null;
};

const ubicacionesPrivadas = new Map<string, UbicacionPrivada>();
const calificaciones = new Map<string, Map<string, Calificacion>>();
const notificaciones: NotificacionFavor[] = [];
const bloqueos = new Map<string, Promise<void>>();

export const rutasFavores = Router();
rutasFavores.use(requiereSesion);

async function conBloqueo<T>(clave: string, accion: () => Promise<T>): Promise<T> {
  const anterior = bloqueos.get(clave) ?? Promise.resolve();
  let liberar!: () => void;
  const turno = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  const cola = anterior.then(() => turno);
  bloqueos.set(clave, cola);
  await anterior;
  try {
    return await accion();
  } finally {
    liberar();
    if (bloqueos.get(clave) === cola) bloqueos.delete(clave);
  }
}

async function conBloqueos<T>(claves: string[], accion: () => Promise<T>): Promise<T> {
  const ordenadas = [...new Set(claves)].sort();
  const entrar = (indice: number): Promise<T> =>
    indice === ordenadas.length ? accion() : conBloqueo(ordenadas[indice], () => entrar(indice + 1));
  return entrar(0);
}

function notificar(uid: string | null, publicacion: Publicacion, tipo: NotificacionFavor['tipo'], mensaje: string): void {
  if (!uid) return;
  notificaciones.unshift({
    id: nuevoId('nf'),
    uid,
    publicacionId: publicacion.id,
    tipo,
    mensaje,
    leida: false,
    creadaEn: Date.now(),
  });
}

function usuarioDe(publicacion: Publicacion, uid: string | null): Promise<Usuario | null> {
  return uid ? almacen.usuarios.obtener(uid) : Promise.resolve(null);
}

function perfilPublico(usuario: Usuario | null, nombreRespaldo: string | null) {
  return {
    uid: usuario?.id ?? null,
    nombre: usuario?.nombre ?? nombreRespaldo ?? 'Vecino',
    fotoUrl: usuario?.fotoUrl ?? null,
    horasAyudadas: usuario?.horasAyudadas ?? 0,
    horasSolicitadas: usuario?.horasSolicitadas ?? 0,
    promedio: usuario?.promedio ?? null,
    numCalificaciones: usuario?.numCalificaciones ?? 0,
    estadoIdentidad: usuario?.identidad?.estado ?? 'NO_ENVIADA',
  };
}

async function respuestaPublicacion(publicacion: Publicacion, uid: string) {
  const [autor, solicitante, prestador] = await Promise.all([
    usuarioDe(publicacion, publicacion.autorId),
    usuarioDe(publicacion, publicacion.solicitanteId),
    usuarioDe(publicacion, publicacion.prestadorId),
  ]);
  const privada = ubicacionesPrivadas.get(publicacion.id);
  const puedeVerExacta = puedeVerUbicacionSolicitante(publicacion, uid);
  const puedeVerEnVivo = puedeVerUbicacionPrestador(publicacion, uid);
  const calificacionesPropias = [...(calificaciones.get(publicacion.id)?.values() ?? [])].filter(
    (calificacion) => calificacion.autorUid === uid,
  );
  return {
    ...publicacion,
    autorNombre: autor?.nombre ?? publicacion.autorNombre,
    prestadorNombre: prestador?.nombre ?? publicacion.prestadorNombre,
    perfilAutor: perfilPublico(autor, publicacion.autorNombre),
    perfilSolicitante: perfilPublico(solicitante, null),
    perfilPrestador: perfilPublico(prestador, publicacion.prestadorNombre),
    ...(puedeVerExacta && privada ? { ubicacionSolicitanteExacta: privada.solicitante } : {}),
    ...(puedeVerEnVivo && privada?.prestadorEnVivo ? { ubicacionPrestadorEnVivo: privada.prestadorEnVivo } : {}),
    ...(esParticipante(publicacion, uid) ? { misCalificaciones: calificacionesPropias } : {}),
  };
}

function leerCoordenada(latValor: unknown, lngValor: unknown): Coordenada | null {
  const lat = numero(latValor);
  const lng = numero(lngValor);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function requerido(uid: string, publicacion: Publicacion, participante: string | null, descripcion: string): void {
  if (participante !== uid) throw new ErrorHttp(403, 'NO_AUTORIZADO', descripcion);
}

async function liberarPunteros(publicacion: Publicacion): Promise<void> {
  const uids = [...new Set([publicacion.solicitanteId, publicacion.prestadorId].filter((uid): uid is string => Boolean(uid)))];
  await Promise.all(
    uids.map(async (uid) => {
      const usuario = await almacen.usuarios.obtener(uid);
      if (!usuario) return;
      const cambios: Partial<Usuario> = {};
      if (usuario.necesidadActivaId === publicacion.id) cambios.necesidadActivaId = null;
      if (usuario.servicioActivoId === publicacion.id) cambios.servicioActivoId = null;
      if (Object.keys(cambios).length) await almacen.usuarios.actualizar(uid, cambios);
    }),
  );
}

rutasFavores.get('/notificaciones', async (_req, res) => {
  const uid = res.locals.uid as string;
  res.json(notificaciones.filter((n) => n.uid === uid).slice(0, 50));
});

rutasFavores.patch('/notificaciones/:id/leida', async (req, res) => {
  const uid = res.locals.uid as string;
  const notificacion = notificaciones.find((n) => n.id === req.params.id && n.uid === uid);
  if (!notificacion) throw noEncontrado('La notificación');
  notificacion.leida = true;
  res.json(notificacion);
});

rutasFavores.get('/mis-publicaciones', async (_req, res) => {
  const uid = res.locals.uid as string;
  const lista = await almacen.publicaciones.listar();
  const mias = lista
    .filter((p) => p.autorId === uid || p.solicitanteId === uid || p.prestadorId === uid)
    .sort((a, b) => b.creadoEn - a.creadoEn);
  res.json(await Promise.all(mias.map((p) => respuestaPublicacion(p, uid))));
});

rutasFavores.get('/publicaciones', async (req, res) => {
  const estado = texto(req.query.estado);
  if (estado && !['PUBLICADA', 'ACEPTADA', 'EN_SITIO', 'EN_CURSO', 'FIN_SOLICITADO', 'FINALIZADO', 'CANCELADA', 'EXPIRADA'].includes(estado)) {
    throw datosInvalidos('El estado solicitado no es válido.');
  }
  const publicaciones = await almacen.publicaciones.listar(estado ? { estado: estado as EstadoNecesidad } : {});
  const vigentes = publicaciones
    .filter((p) => p.estado !== 'PUBLICADA' || p.expiraEn > Date.now())
    .sort((a, b) => b.creadoEn - a.creadoEn);
  res.json(await Promise.all(vigentes.map((p) => respuestaPublicacion(p, res.locals.uid as string))));
});

rutasFavores.post('/publicaciones', async (req, res) => {
  const uid = res.locals.uid as string;
  const tipo = req.body?.tipo as TipoPublicacion;
  const categoria = req.body?.categoria as CategoriaPublicacion;
  const descripcion = texto(req.body?.descripcion);
  const coordenada = leerCoordenada(req.body?.lat, req.body?.lng);
  const oficioId = texto(req.body?.oficioId);
  const devolucionEn = numero(req.body?.devolucionEn);

  if (!TIPOS.includes(tipo)) throw datosInvalidos('Elige si necesitas u ofreces ayuda.');
  if (!CATEGORIAS.includes(categoria)) throw datosInvalidos('Elige una categoría válida.');
  if (!descripcion || descripcion.length < MIN_DESCRIPCION || descripcion.length > MAX_DESCRIPCION) {
    throw datosInvalidos(`La descripción debe tener entre ${MIN_DESCRIPCION} y ${MAX_DESCRIPCION} caracteres.`);
  }
  if (categoria === 'FAVOR_OFICIO' && !oficioId) throw datosInvalidos('Elige el oficio o habilidad.');
  if (!coordenada) throw datosInvalidos('Confirma una ubicación válida.');
  if (tipo === 'OFREZCO' && categoria === 'PRESTAMO' && (!devolucionEn || devolucionEn <= Date.now())) {
    throw datosInvalidos('Indica una fecha futura para la devolución de la herramienta.');
  }

  const nueva = await conBloqueos([`usuario:${uid}`], async () => {
    const autor = await almacen.usuarios.obtener(uid);
    if (!autor) throw noEncontrado('El usuario');
    if (tipo === 'NECESITO' && autor.necesidadActivaId) {
      throw conflicto('Ya tienes una necesidad activa. Termínala o cancélala para publicar otra.');
    }

    const ahora = Date.now();
    const publicacion: Publicacion = {
      id: nuevoId('nc'),
      autorId: uid,
      autorNombre: autor.nombre,
      solicitanteId: tipo === 'NECESITO' ? uid : null,
      prestadorId: tipo === 'OFREZCO' ? uid : null,
      prestadorNombre: tipo === 'OFREZCO' ? autor.nombre : null,
      tipo,
      categoria,
      oficioId,
      descripcion,
      geohash: geohashForLocation([coordenada.lat, coordenada.lng], 7),
      estado: 'PUBLICADA',
      etaMinutos: null,
      llegadaEstimada: null,
      inicioServicio: null,
      finServicio: null,
      finSolicitadoPor: null,
      bloques: null,
      devolucionEn,
      devolucionRegistradaEn: null,
      retrasoAvisadoEn: null,
      expiraEn: ahora + VIGENCIA_MS,
      creadoEn: ahora,
    };

    if (tipo === 'NECESITO') await almacen.usuarios.actualizar(uid, { necesidadActivaId: publicacion.id });
    await almacen.publicaciones.crear(publicacion);
    ubicacionesPrivadas.set(publicacion.id, { solicitante: coordenada, prestadorEnVivo: null });
    return publicacion;
  });

  res.status(201).json(await respuestaPublicacion(nueva, uid));
});

rutasFavores.get('/publicaciones/:id', async (req, res) => {
  const publicacion = await almacen.publicaciones.obtener(req.params.id);
  if (!publicacion) throw noEncontrado('La publicación');
  res.json(await respuestaPublicacion(publicacion, res.locals.uid as string));
});

rutasFavores.post('/publicaciones/:id/aceptar', async (req, res) => {
  const uid = res.locals.uid as string;
  const etaMinutos = numero(req.body?.etaMinutos);
  if (!ETA_PERMITIDA.includes(etaMinutos ?? 0)) throw datosInvalidos('Elige un tiempo de llegada de 5, 10 o 15 minutos.');

  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    if (actual.estado !== 'PUBLICADA' || actual.expiraEn <= Date.now()) {
      throw conflicto('Otro vecino ya aceptó esta publicación o ya venció.');
    }
    if (actual.autorId === uid) throw conflicto('No puedes aceptar tu propia publicación.');

    const receptor = await almacen.usuarios.obtener(uid);
    if (!receptor) throw noEncontrado('El usuario');
    if (!puedeAceptarPorIdentidad(receptor)) {
      throw new ErrorHttp(403, 'IDENTIDAD_REQUERIDA', 'Envía tu verificación de identidad antes de aceptar una publicación.');
    }

    const solicitanteId = actual.tipo === 'OFREZCO' ? uid : actual.solicitanteId;
    const prestadorId = actual.tipo === 'OFREZCO' ? actual.autorId : uid;
    if (!solicitanteId || !prestadorId) throw conflicto('No se pudieron determinar los participantes del servicio.');

    return conBloqueos([`usuario:${solicitanteId}`, `usuario:${prestadorId}`], async () => {
      const [solicitante, prestador] = await Promise.all([
        almacen.usuarios.obtener(solicitanteId),
        almacen.usuarios.obtener(prestadorId),
      ]);
      if (!solicitante || !prestador) throw noEncontrado('Uno de los participantes');
      if (prestador.servicioActivoId && prestador.servicioActivoId !== actual.id) {
        throw conflicto('Ya tienes un servicio activo como prestador.');
      }
      if (solicitante.necesidadActivaId && solicitante.necesidadActivaId !== actual.id) {
        throw conflicto('Ya tienes una necesidad activa. Termínala o cancélala antes de aceptar.');
      }

      const llegadaEstimada = Date.now() + etaMinutos! * 60_000;
      const actualizado: Publicacion = {
        ...actual,
        estado: 'ACEPTADA',
        solicitanteId,
        prestadorId,
        prestadorNombre: prestador.nombre,
        etaMinutos,
        llegadaEstimada,
      };
      await almacen.publicaciones.actualizar(actual.id, actualizado);
      await Promise.all([
        almacen.usuarios.actualizar(solicitanteId, { necesidadActivaId: actual.id }),
        almacen.usuarios.actualizar(prestadorId, { servicioActivoId: actual.id }),
      ]);
      notificar(solicitanteId, actualizado, 'ACEPTADA', `${prestador.nombre} va en camino, llega en ~${etaMinutos} min.`);
      return actualizado;
    });
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/llegada', async (req, res) => {
  const uid = res.locals.uid as string;
  const coordenada = leerCoordenada(req.body?.lat, req.body?.lng);
  const publicacion = await conBloqueos([`publicacion:${req.params.id}`], async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    requerido(uid, actual, actual.prestadorId, 'Solo el prestador asignado puede marcar su llegada.');
    if (actual.estado !== 'ACEPTADA') throw conflicto('La llegada solo se puede marcar cuando el servicio está aceptado.');

    const ubicacion = ubicacionesPrivadas.get(actual.id);
    const lejos =
      coordenada && ubicacion
        ? distanceBetween([coordenada.lat, coordenada.lng], [ubicacion.solicitante.lat, ubicacion.solicitante.lng]) * 1000 > 200
        : false;
    const actualizado = await almacen.publicaciones.actualizar(actual.id, { estado: 'EN_SITIO' });
    if (!actualizado) throw noEncontrado('La publicación');
    notificar(actualizado.solicitanteId, actualizado, 'LLEGADA', `${actualizado.prestadorNombre ?? 'Tu vecino'} dice que ya llegó.`);
    return { actualizado, lejos };
  });
  res.json({ ...(await respuestaPublicacion(publicacion.actualizado, uid)), advertenciaDistancia: publicacion.lejos });
});

rutasFavores.post('/publicaciones/:id/confirmar-llegada', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    requerido(uid, actual, actual.solicitanteId, 'Solo quien recibe la ayuda puede confirmar la llegada.');
    if (actual.estado !== 'EN_SITIO') throw conflicto('La publicación no está esperando confirmación de llegada.');
    const actualizado = await almacen.publicaciones.actualizar(actual.id, {
      estado: 'EN_CURSO',
      inicioServicio: Date.now(),
    });
    if (!actualizado) throw noEncontrado('La publicación');
    return actualizado;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/aun-no-llega', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    requerido(uid, actual, actual.solicitanteId, 'Solo quien recibe la ayuda puede rechazar la llegada.');
    if (actual.estado !== 'EN_SITIO') throw conflicto('La publicación no está esperando confirmación de llegada.');
    const actualizado = await almacen.publicaciones.actualizar(actual.id, { estado: 'ACEPTADA' });
    if (!actualizado) throw noEncontrado('La publicación');
    notificar(actualizado.prestadorId, actualizado, 'LLEGADA', 'El solicitante indica que aún no llegaste.');
    return actualizado;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/solicitar-fin', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    if (!esParticipante(actual, uid)) throw new ErrorHttp(403, 'NO_AUTORIZADO', 'Solo los participantes pueden finalizar el servicio.');
    if (actual.estado !== 'EN_CURSO') throw conflicto('El servicio no está en curso.');
    const actualizado = await almacen.publicaciones.actualizar(actual.id, {
      estado: 'FIN_SOLICITADO',
      finServicio: Date.now(),
      finSolicitadoPor: uid,
    });
    if (!actualizado) throw noEncontrado('La publicación');
    const otro = uid === actualizado.solicitanteId ? actualizado.prestadorId : actualizado.solicitanteId;
    notificar(otro, actualizado, 'FIN_SOLICITADO', 'Confirma que el servicio terminó.');
    return actualizado;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/rechazar-fin', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    if (!esParticipante(actual, uid) || actual.finSolicitadoPor === uid) {
      throw new ErrorHttp(403, 'NO_AUTORIZADO', 'Solo la otra parte puede rechazar el cierre.');
    }
    if (actual.estado !== 'FIN_SOLICITADO') throw conflicto('No hay un cierre pendiente de confirmar.');
    const actualizado = await almacen.publicaciones.actualizar(actual.id, {
      estado: 'EN_CURSO',
      finServicio: null,
      finSolicitadoPor: null,
    });
    if (!actualizado) throw noEncontrado('La publicación');
    return actualizado;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/registrar-devolucion', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueo(`publicacion:${req.params.id}`, async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    if (actual.tipo !== 'OFREZCO' || actual.categoria !== 'PRESTAMO') {
      throw conflicto('Esta publicación no es un préstamo de herramienta.');
    }
    requerido(uid, actual, actual.solicitanteId, 'Solo quien recibió la herramienta puede registrar su devolución.');
    if (!['ACEPTADA', 'EN_SITIO', 'EN_CURSO', 'FIN_SOLICITADO'].includes(actual.estado)) {
      throw conflicto('La devolución solo se puede registrar mientras el préstamo está activo.');
    }
    if (actual.devolucionRegistradaEn) throw conflicto('La devolución ya fue registrada.');
    const actualizado = await almacen.publicaciones.actualizar(actual.id, { devolucionRegistradaEn: Date.now() });
    if (!actualizado) throw noEncontrado('La publicación');
    notificar(actualizado.prestadorId, actualizado, 'LLEGADA', 'El vecino registró la devolución de la herramienta.');
    return actualizado;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/confirmar-fin', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueos([`publicacion:${req.params.id}`], async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    if (!esParticipante(actual, uid) || actual.finSolicitadoPor === uid) {
      throw new ErrorHttp(403, 'NO_AUTORIZADO', 'Solo la otra parte puede confirmar el cierre.');
    }
    if (actual.estado !== 'FIN_SOLICITADO' || actual.finServicio === null || actual.inicioServicio === null) {
      throw conflicto('No hay un cierre pendiente de confirmar.');
    }
    if (actual.tipo === 'OFREZCO' && actual.categoria === 'PRESTAMO' && !actual.devolucionRegistradaEn) {
      throw conflicto('Registra la devolución de la herramienta antes de finalizar el favor.');
    }

    const solicitanteId = actual.solicitanteId;
    const prestadorId = actual.prestadorId;
    if (!solicitanteId || !prestadorId) throw conflicto('Faltan participantes para cerrar el servicio.');
    const bloques = calcularBloques(actual.inicioServicio, actual.finServicio);
    const [solicitante, prestador] = await Promise.all([
      almacen.usuarios.obtener(solicitanteId),
      almacen.usuarios.obtener(prestadorId),
    ]);
    if (!solicitante || !prestador) throw noEncontrado('Uno de los participantes');
    const finalizada = await almacen.publicaciones.actualizar(actual.id, {
      estado: 'FINALIZADO',
      bloques,
    });
    if (!finalizada) throw noEncontrado('La publicación');
    await Promise.all([
      almacen.usuarios.actualizar(solicitanteId, {
        horasSolicitadas: (solicitante.horasSolicitadas ?? 0) + bloques * 0.5,
        necesidadActivaId: solicitante.necesidadActivaId === actual.id ? null : solicitante.necesidadActivaId,
      }),
      almacen.usuarios.actualizar(prestadorId, {
        horasAyudadas: (prestador.horasAyudadas ?? 0) + bloques * 0.5,
        servicioActivoId: prestador.servicioActivoId === actual.id ? null : prestador.servicioActivoId,
      }),
    ]);
    notificar(solicitanteId, finalizada, 'FINALIZADA', 'El servicio terminó. Puedes calificar a tu vecino.');
    notificar(prestadorId, finalizada, 'FINALIZADA', 'El servicio terminó. Puedes calificar a tu vecino.');
    return finalizada;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/cancelar', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueos([`publicacion:${req.params.id}`, `usuario:${uid}`], async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    const autorizado = actual.estado === 'PUBLICADA' ? actual.autorId === uid : actual.solicitanteId === uid;
    if (!autorizado) throw new ErrorHttp(403, 'NO_AUTORIZADO', 'Solo el autor o quien recibe la ayuda puede cancelar.');
    if (!puedeCancelar(actual.estado)) throw conflicto('El servicio ya inició y no se puede cancelar.');
    const cancelada = await almacen.publicaciones.actualizar(actual.id, { estado: 'CANCELADA' });
    if (!cancelada) throw noEncontrado('La publicación');
    await liberarPunteros(cancelada);
    const otro = uid === cancelada.solicitanteId ? cancelada.prestadorId : cancelada.solicitanteId;
    notificar(otro, cancelada, 'CANCELADA', 'La publicación fue cancelada.');
    return cancelada;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/desistir', async (req, res) => {
  const uid = res.locals.uid as string;
  const publicacion = await conBloqueos([`publicacion:${req.params.id}`, `usuario:${uid}`], async () => {
    const actual = await almacen.publicaciones.obtener(req.params.id);
    if (!actual) throw noEncontrado('La publicación');
    requerido(uid, actual, actual.prestadorId, 'Solo el prestador puede desistir del servicio.');
    if (actual.estado !== 'ACEPTADA') throw conflicto('Solo puedes desistir antes de llegar al lugar.');

    const solicitanteId = actual.solicitanteId;
    const cambios: Partial<Publicacion> =
      actual.tipo === 'OFREZCO'
        ? {
            estado: 'PUBLICADA',
            solicitanteId: null,
            prestadorId: actual.autorId,
            prestadorNombre: actual.autorNombre,
            etaMinutos: null,
            llegadaEstimada: null,
          }
        : {
            estado: 'PUBLICADA',
            prestadorId: null,
            prestadorNombre: null,
            etaMinutos: null,
            llegadaEstimada: null,
          };
    const actualizada = await almacen.publicaciones.actualizar(actual.id, cambios);
    if (!actualizada) throw noEncontrado('La publicación');
    if (solicitanteId && solicitanteId !== actual.autorId) {
      const solicitante = await almacen.usuarios.obtener(solicitanteId);
      if (solicitante?.necesidadActivaId === actual.id) {
        await almacen.usuarios.actualizar(solicitanteId, { necesidadActivaId: null });
      }
    }
    const prestador = await almacen.usuarios.obtener(uid);
    if (prestador?.servicioActivoId === actual.id) await almacen.usuarios.actualizar(uid, { servicioActivoId: null });
    notificar(solicitanteId, actualizada, 'CANCELADA', 'El prestador desistió; la publicación vuelve a estar disponible.');
    return actualizada;
  });
  res.json(await respuestaPublicacion(publicacion, uid));
});

rutasFavores.post('/publicaciones/:id/ubicacion-prestador', async (req, res) => {
  const uid = res.locals.uid as string;
  const coordenada = leerCoordenada(req.body?.lat, req.body?.lng);
  if (!coordenada) throw datosInvalidos('Envía una ubicación válida.');
  const publicacion = await almacen.publicaciones.obtener(req.params.id);
  if (!publicacion) throw noEncontrado('La publicación');
  requerido(uid, publicacion, publicacion.prestadorId, 'Solo el prestador asignado puede compartir su ubicación.');
  if (publicacion.estado !== 'ACEPTADA' && publicacion.estado !== 'EN_SITIO') {
    throw conflicto('La ubicación solo se comparte antes de iniciar el servicio.');
  }
  const privada = ubicacionesPrivadas.get(publicacion.id);
  if (!privada) throw noEncontrado('La ubicación privada');
  privada.prestadorEnVivo = { ...coordenada, actualizadoEn: Date.now() };
  res.json({ actualizadoEn: privada.prestadorEnVivo.actualizadoEn });
});

rutasFavores.post('/publicaciones/:id/calificar', async (req, res) => {
  const uid = res.locals.uid as string;
  const estrellas = numero(req.body?.estrellas);
  if (!estrellas || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw datosInvalidos('Elige de 1 a 5 estrellas.');
  }
  const calificacion = await conBloqueos([`publicacion:${req.params.id}`, `usuario:${uid}`], async () => {
    const publicacion = await almacen.publicaciones.obtener(req.params.id);
    if (!publicacion) throw noEncontrado('La publicación');
    if (publicacion.estado !== 'FINALIZADO' || !esParticipante(publicacion, uid)) {
      throw new ErrorHttp(403, 'NO_AUTORIZADO', 'Solo puedes calificar un servicio finalizado en el que participaste.');
    }
    if (publicacion.finServicio && Date.now() - publicacion.finServicio > 7 * 24 * 60 * 60_000) {
      throw conflicto('El plazo para calificar este servicio ya terminó.');
    }
    const calificadoId = uid === publicacion.solicitanteId ? publicacion.prestadorId : publicacion.solicitanteId;
    if (!calificadoId) throw conflicto('No se pudo determinar a quién calificar.');
    const porPublicacion = calificaciones.get(publicacion.id) ?? new Map<string, Calificacion>();
    if (porPublicacion.has(uid)) throw conflicto('Ya calificaste este servicio.');
    const nuevo: Calificacion = {
      id: `${publicacion.id}_${uid}`,
      publicacionId: publicacion.id,
      autorUid: uid,
      calificadoId,
      estrellas,
      creadoEn: Date.now(),
    };
    porPublicacion.set(uid, nuevo);
    calificaciones.set(publicacion.id, porPublicacion);
    const calificado = await almacen.usuarios.obtener(calificadoId);
    if (!calificado) throw noEncontrado('El vecino calificado');
    const cantidadAnterior = calificado.numCalificaciones ?? 0;
    const numCalificaciones = cantidadAnterior + 1;
    const promedio = (((calificado.promedio ?? 0) * cantidadAnterior) + estrellas) / numCalificaciones;
    await almacen.usuarios.actualizar(calificadoId, { promedio, numCalificaciones });
    return nuevo;
  });
  res.status(201).json(calificacion);
});

export async function ejecutarTareasFavoresMock(ahora = Date.now()): Promise<void> {
  const publicaciones = await almacen.publicaciones.listar();
  for (const publicacion of publicaciones) {
    if (publicacion.estado === 'PUBLICADA' && publicacion.expiraEn <= ahora) {
      await conBloqueo(`publicacion:${publicacion.id}`, async () => {
        const actual = await almacen.publicaciones.obtener(publicacion.id);
        if (!actual || actual.estado !== 'PUBLICADA' || actual.expiraEn > ahora) return;
        const expirada = await almacen.publicaciones.actualizar(actual.id, { estado: 'EXPIRADA' });
        if (!expirada) return;
        await liberarPunteros(expirada);
        notificar(expirada.autorId, expirada, 'EXPIRADA', 'Tu publicación venció sin que alguien la aceptara.');
      });
    }

    if (
      publicacion.estado === 'ACEPTADA' &&
      publicacion.llegadaEstimada !== null &&
      publicacion.llegadaEstimada + 10 * 60_000 < ahora &&
      publicacion.retrasoAvisadoEn === null
    ) {
      await conBloqueo(`publicacion:${publicacion.id}`, async () => {
        const actual = await almacen.publicaciones.obtener(publicacion.id);
        if (
          !actual ||
          actual.estado !== 'ACEPTADA' ||
          actual.retrasoAvisadoEn !== null ||
          actual.llegadaEstimada === null ||
          actual.llegadaEstimada + 10 * 60_000 >= ahora
        ) return;
        const actualizada = await almacen.publicaciones.actualizar(actual.id, { retrasoAvisadoEn: ahora });
        if (actualizada) notificar(actualizada.solicitanteId, actualizada, 'RETRASO', `${actualizada.prestadorNombre ?? 'Tu vecino'} se está demorando.`);
      });
    }

    if (
      publicacion.estado === 'FIN_SOLICITADO' &&
      publicacion.finServicio !== null &&
      publicacion.finServicio + 24 * 60 * 60_000 <= ahora
    ) {
      await conBloqueos([`publicacion:${publicacion.id}`], async () => {
        const actual = await almacen.publicaciones.obtener(publicacion.id);
        if (!actual || actual.estado !== 'FIN_SOLICITADO' || actual.finServicio === null || actual.finServicio + 24 * 60 * 60_000 > ahora) return;
        if (actual.tipo === 'OFREZCO' && actual.categoria === 'PRESTAMO' && !actual.devolucionRegistradaEn) return;
        const solicitanteId = actual.solicitanteId;
        const prestadorId = actual.prestadorId;
        if (!solicitanteId || !prestadorId || actual.inicioServicio === null) return;
        const [solicitante, prestador] = await Promise.all([
          almacen.usuarios.obtener(solicitanteId),
          almacen.usuarios.obtener(prestadorId),
        ]);
        if (!solicitante || !prestador) return;
        const bloqueFinal = calcularBloques(actual.inicioServicio, actual.finServicio);
        const finalizada = await almacen.publicaciones.actualizar(actual.id, { estado: 'FINALIZADO', bloques: bloqueFinal });
        if (!finalizada) return;
        await Promise.all([
          almacen.usuarios.actualizar(solicitanteId, {
            horasSolicitadas: (solicitante.horasSolicitadas ?? 0) + bloqueFinal * 0.5,
            necesidadActivaId: solicitante.necesidadActivaId === actual.id ? null : solicitante.necesidadActivaId,
          }),
          almacen.usuarios.actualizar(prestadorId, {
            horasAyudadas: (prestador.horasAyudadas ?? 0) + bloqueFinal * 0.5,
            servicioActivoId: prestador.servicioActivoId === actual.id ? null : prestador.servicioActivoId,
          }),
        ]);
        notificar(solicitanteId, finalizada, 'FINALIZADA', 'El servicio se cerró automáticamente. Puedes calificar a tu vecino.');
        notificar(prestadorId, finalizada, 'FINALIZADA', 'El servicio se cerró automáticamente. Puedes calificar a tu vecino.');
      });
    }
  }
}
