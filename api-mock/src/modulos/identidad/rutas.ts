// Ruta: src/modulos/identidad/rutas.ts
// Verificación de identidad (P19, RF36). Las fotos viven en memoria, fuera del usuario, y solo las ven
// el dueño y los validadores (equivale a la ruta privada de Storage).
import { Router, type RequestHandler } from 'express';
import { almacen } from '../../datos/almacen.js';
import type { Usuario } from '../../datos/tipos.js';
import { requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import { notificar } from '../../nucleo/notificar.js';
import { texto } from '../../nucleo/utilidades.js';
import { estadoDe, esValidador } from './reglas.js';

type TipoFoto = 'dni' | 'selfie';
const fotos = new Map<string, { tipo: string; datos: Buffer }>();
const claveFoto = (uid: string, tipo: TipoFoto) => `${uid}:${tipo}`;

const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const LETRAS = 'A-Za-zÀ-ÖØ-öø-ÿ';
const NOMBRES = new RegExp(`^[${LETRAS}]+(?:['-][${LETRAS}]+)*(?: [${LETRAS}]+(?:['-][${LETRAS}]+)*)*$`);

/** Al eliminar la cuenta: borra el DNI y la selfie guardados. */
export function borrarFotosIdentidad(uid: string): void {
  fotos.delete(claveFoto(uid, 'dni'));
  fotos.delete(claveFoto(uid, 'selfie'));
}

export const rutasIdentidad = Router();
rutasIdentidad.use(requiereSesion);

const soloValidador: RequestHandler = async (_req, res, next) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario || !esValidador(usuario)) {
    next(new ErrorHttp(403, 'SIN_PERMISO', 'Solo el equipo validador puede revisar identidades.'));
    return;
  }
  next();
};

/** Lo que ve el dueño: nunca devuelve las fotos, y el DNI va enmascarado. */
function aResumen(u: Usuario) {
  const i = u.identidad;
  return {
    estado: estadoDe(u),
    dni: i?.dni ? `••••${i.dni.slice(-4)}` : null,
    nombres: i?.nombres ?? null,
    apellidos: i?.apellidos ?? null,
    enviadaEn: i?.enviadaEn ?? null,
    revisadaEn: i?.revisadaEn ?? null,
    motivo: i?.motivo ?? null,
  };
}

/** Lee una foto en data URI (JPEG/PNG/WebP), con tamaño máximo. */
function leerFoto(valor: unknown, nombre: string): { tipo: string; datos: Buffer } {
  const coincide = typeof valor === 'string' ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(valor) : null;
  if (!coincide) throw datosInvalidos(`Falta la ${nombre} o no es una imagen válida.`);
  const datos = Buffer.from(coincide[2], 'base64');
  if (datos.length < 5 * 1024) throw datosInvalidos(`La ${nombre} es demasiado pequeña. Tómala de nuevo.`);
  if (datos.length > MAX_FOTO_BYTES) throw datosInvalidos(`La ${nombre} pesa más de 2 MB. Tómala de nuevo.`);
  return { tipo: coincide[1], datos };
}

function leerNombres(valor: unknown, campo: string): string {
  const v = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ').toUpperCase() : '';
  if (v.length < 2 || v.length > 60 || !NOMBRES.test(v)) throw datosInvalidos(`Escribe tus ${campo} tal como aparecen en tu DNI.`);
  return v;
}

rutasIdentidad.get('/yo', async (_req, res) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aResumen(usuario));
});

/** Envía (o reenvía tras un rechazo) los datos y las dos fotos. Pasa a PENDIENTE. */
rutasIdentidad.post('/yo', async (req, res) => {
  const uid: string = res.locals.uid;
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');

  const estado = estadoDe(usuario);
  if (estado === 'PENDIENTE') throw conflicto('Tu verificación ya está en revisión. Te avisaremos cuando termine.');
  if (estado === 'VERIFICADA') throw conflicto('Tu identidad ya está verificada.');

  const dni = typeof req.body?.dni === 'string' ? req.body.dni.trim() : '';
  if (!/^\d{8}$/.test(dni)) throw datosInvalidos('El DNI tiene 8 dígitos.');
  if (/^(\d)\1{7}$/.test(dni) || dni === '12345678' || dni === '87654321') throw datosInvalidos('Ese número de DNI no es válido.');
  const nombres = leerNombres(req.body?.nombres, 'nombres');
  const apellidos = leerNombres(req.body?.apellidos, 'apellidos');
  if (apellidos.split(' ').length < 2 && req.body?.unSoloApellido !== true) {
    throw datosInvalidos('Escribe tus dos apellidos, como en tu DNI.');
  }
  const fotoDni = leerFoto(req.body?.fotoDni, 'foto del DNI');
  const selfie = leerFoto(req.body?.selfie, 'selfie');

  // Un DNI pertenece como máximo a un perfil.
  const otros = await almacen.usuarios.listar();
  if (otros.some((u) => u.id !== uid && u.identidad?.dni === dni && u.identidad?.estado !== 'RECHAZADA')) {
    throw conflicto('Ese DNI ya está registrado en otra cuenta. Si es un error, escríbenos.');
  }

  fotos.set(claveFoto(uid, 'dni'), fotoDni);
  fotos.set(claveFoto(uid, 'selfie'), selfie);
  const actualizado = await almacen.usuarios.actualizar(uid, {
    identidad: { estado: 'PENDIENTE', dni, nombres, apellidos, enviadaEn: Date.now(), revisadaEn: null, motivo: null },
  });

  // Aviso a los validadores (la pantalla oculta también los lista).
  const validadores = otros.filter((u) => esValidador(u) && u.id !== uid).map((u) => u.id);
  if (validadores.length) {
    void notificar(validadores, {
      modulo: 'identidad',
      tipo: 'nueva-solicitud',
      titulo: 'Nueva identidad por revisar',
      cuerpo: `${usuario.nombre} envió su DNI y selfie.`,
      ruta: '/validar-identidades',
    });
  }
  res.status(201).json(aResumen(actualizado!));
});

/** Foto privada: solo el dueño o un validador. */
rutasIdentidad.get('/:uid/fotos/:tipo', async (req, res) => {
  const tipo = req.params.tipo as TipoFoto;
  if (tipo !== 'dni' && tipo !== 'selfie') throw noEncontrado('La foto');
  const pide = await almacen.usuarios.obtener(res.locals.uid);
  if (!pide || (pide.id !== req.params.uid && !esValidador(pide))) {
    throw new ErrorHttp(403, 'SIN_PERMISO', 'No puedes ver esta foto.');
  }
  const foto = fotos.get(claveFoto(String(req.params.uid), tipo));
  if (!foto) throw noEncontrado('La foto');
  res.set('Cache-Control', 'private, no-store').type(foto.tipo).send(foto.datos);
});

/** Pantalla oculta del validador: solicitudes pendientes, la más antigua primero. */
rutasIdentidad.get('/pendientes', soloValidador, async (_req, res) => {
  const pendientes = (await almacen.usuarios.listar())
    .filter((u) => u.identidad?.estado === 'PENDIENTE')
    .sort((a, b) => (a.identidad!.enviadaEn ?? 0) - (b.identidad!.enviadaEn ?? 0))
    .map((u) => ({
      uid: u.id,
      nombrePerfil: u.nombre,
      correo: u.correo,
      dni: u.identidad!.dni,
      nombres: u.identidad!.nombres,
      apellidos: u.identidad!.apellidos,
      enviadaEn: u.identidad!.enviadaEn,
    }));
  res.json({ pendientes });
});

/** Aprobar o rechazar (con motivo). Avisa al vecino. */
rutasIdentidad.post('/:uid/revisar', soloValidador, async (req, res) => {
  const uid = String(req.params.uid);
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario?.identidad) throw noEncontrado('La solicitud');
  if (usuario.identidad.estado !== 'PENDIENTE') throw conflicto('Esta solicitud ya fue revisada.');

  const decision = req.body?.decision;
  if (decision !== 'aprobar' && decision !== 'rechazar') throw datosInvalidos('Elige aprobar o rechazar.');
  const motivo = decision === 'rechazar' ? texto(req.body?.motivo) : null;
  if (decision === 'rechazar' && (!motivo || motivo.length < 5)) throw datosInvalidos('Escribe el motivo del rechazo.');

  const aprobada = decision === 'aprobar';
  await almacen.usuarios.actualizar(uid, {
    identidad: {
      ...usuario.identidad,
      estado: aprobada ? 'VERIFICADA' : 'RECHAZADA',
      revisadaEn: Date.now(),
      motivo,
      revisadaPor: res.locals.uid,
    },
  });
  // Al aprobar, las fotos ya no se necesitan (minimización de datos, Ley 29733).
  if (aprobada) {
    fotos.delete(claveFoto(uid, 'dni'));
    fotos.delete(claveFoto(uid, 'selfie'));
  }

  void notificar([uid], {
    modulo: 'identidad',
    tipo: aprobada ? 'verificada' : 'rechazada',
    titulo: aprobada ? '¡Identidad verificada!' : 'Revisa tu verificación',
    cuerpo: aprobada
      ? 'Ya tienes la insignia «Identidad verificada». Tus vecinos confiarán más en ti.'
      : `No pudimos verificarte: ${motivo}. Puedes enviarla de nuevo.`,
    ruta: '/verificar-identidad',
  });
  res.json({ estado: aprobada ? 'VERIFICADA' : 'RECHAZADA' });
});
