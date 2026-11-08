// Ruta: src/modulos/auth/rutas.ts
// Cuentas (RF01–RF07). Dos modos, según AUTENTICACION en .env:
//  - firebase: la cuenta y la clave viven en Firebase Auth (correos de recuperación y verificación
//    incluidos); el perfil vive en la colección `usuarios` con el mismo uid.
//  - local (por defecto): la clave se guarda cifrada con scrypt en `usuarios` y la API abre sus sesiones.
// Las respuestas tienen la misma forma en los dos modos: { token, renovacion, expiraEn, usuario }.
import { randomInt } from 'node:crypto';
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import { ZONA_DEMO } from '../../datos/semillas.js';
import type { Usuario } from '../../datos/tipos.js';
import {
  abrirSesion,
  cerrarSesion,
  cerrarSesionesDe,
  leerToken,
  requiereSesion,
  type TokensSesion,
} from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import {
  borrarCuentaAuth,
  buscarCuentaPorCorreo,
  cambiarClaveAuth,
  crearCuentaAuth,
  enviarCorreoRecuperacion,
  enviarCorreoVerificacion,
  ingresarConClave,
  renovarToken,
  USA_FIREBASE_AUTH,
  type TokensFirebase,
} from '../../nucleo/firebaseAuth.js';
import { nuevoId, texto } from '../../nucleo/utilidades.js';
import { esValidador } from '../identidad/reglas.js';
import { cifrarClave, claveCorrecta, estaCifrada } from './claves.js';
import { exigirTelefonoLibre, normalizarTelefono, validarClave, validarCorreo, validarNombre } from './validaciones.js';

export type UsuarioPublico = Omit<Usuario, 'clave' | 'dispositivos' | 'identidad'> & {
  /** RF36: solo el estado; el DNI y las fotos no salen de modulos/identidad. */
  estadoIdentidad: NonNullable<Usuario['identidad']>['estado'];
  /** Puede revisar identidades (pantalla oculta). */
  validador: boolean;
};

export function aPublico({ clave: _clave, dispositivos: _dispositivos, identidad, ...resto }: Usuario): UsuarioPublico {
  return { ...resto, estadoIdentidad: identidad?.estado ?? 'NO_ENVIADA', validador: esValidador(resto) };
}

const aTokens = (t: TokensFirebase): TokensSesion => ({ token: t.token, renovacion: t.renovacion, expiraEn: t.expiraEn });

export const rutasAuth = Router();

// ---------- Registro ----------

rutasAuth.post('/registro', async (req, res) => {
  const nombre = validarNombre(req.body?.nombre);
  const correo = validarCorreo(req.body?.correo);
  const telefono = normalizarTelefono(req.body?.telefono);
  if (!telefono) throw datosInvalidos('Escribe un celular peruano de 9 dígitos que empiece en 9.');
  const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
  validarClave(clave, { nombre, correo, telefono });
  if (req.body?.aceptaTerminos !== true) {
    throw datosInvalidos('Debes aceptar la política de privacidad para crear tu cuenta.');
  }
  if ((await almacen.usuarios.listar({ correo })).length) {
    throw conflicto('Ya existe una cuenta con ese correo. Inicia sesión.');
  }
  await exigirTelefonoLibre(telefono);

  const perfil = (id: string, claveGuardada: string): Usuario => ({
    id,
    correo,
    clave: claveGuardada,
    nombre,
    barrio: texto(req.body?.barrio) ?? 'Barrio Los Olivos',
    oficios: [],
    necesidadActivaId: null,
    ubicacion: ZONA_DEMO,
    creadoEn: Date.now(),
    telefono,
    fotoUrl: null,
    ubicacionEn: null,
    terminosAceptadosEn: Date.now(),
  });

  if (!USA_FIREBASE_AUTH) {
    const usuario = await almacen.usuarios.crear(perfil(nuevoId('u'), await cifrarClave(clave)));
    res.status(201).json({ ...(await abrirSesion(usuario.id)), usuario: aPublico(usuario) });
    return;
  }

  // Firebase: primero la cuenta (Firebase guarda la clave); si el perfil falla, se borra la cuenta.
  const cuenta = await crearCuentaAuth({ correo, clave, nombre });
  let usuario: Usuario;
  try {
    usuario = await almacen.usuarios.crear(perfil(cuenta.uid, ''));
  } catch (error) {
    await borrarCuentaAuth(cuenta.uid);
    throw error;
  }
  const tokens = await ingresarConClave(correo, clave);
  // Correo de verificación (RF01): la cuenta funciona aunque no se verifique.
  await enviarCorreoVerificacion(tokens.token).catch(() => undefined);
  res.status(201).json({ ...aTokens(tokens), usuario: aPublico(usuario) });
});

/** Avisa en el formulario si el correo o el teléfono ya tienen cuenta (RN-01). */
rutasAuth.post('/disponibilidad', async (req, res) => {
  const respuesta: { correoDisponible?: boolean; telefonoDisponible?: boolean } = {};
  const correo = texto(req.body?.correo)?.toLowerCase();
  const telefono = normalizarTelefono(req.body?.telefono);
  if (correo) respuesta.correoDisponible = (await almacen.usuarios.listar({ correo })).length === 0;
  if (telefono) respuesta.telefonoDisponible = (await almacen.usuarios.listar({ telefono })).length === 0;
  res.json(respuesta);
});

// ---------- Bloqueo por intentos fallidos ----------
// 5 claves incorrectas seguidas bloquean el correo 15 minutos. Firebase Auth además tiene su propio freno.
// Los intentos viven en la colección `intentosIngreso` (id = correo): el bloqueo sobrevive a un reinicio.

const MAX_FALLOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

async function exigirSinBloqueo(correo: string): Promise<void> {
  const r = await almacen.intentosIngreso.obtener(correo);
  if (r && r.bloqueadoHasta > Date.now()) {
    const minutos = Math.ceil((r.bloqueadoHasta - Date.now()) / 60_000);
    throw new ErrorHttp(
      429,
      'DEMASIADOS_INTENTOS',
      `Demasiados intentos. Espera ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} o recupera tu clave.`,
    );
  }
}

/** Suma un fallo y devuelve cuántos intentos quedan antes del bloqueo. */
async function registrarFallo(correo: string): Promise<number> {
  const fallos = ((await almacen.intentosIngreso.obtener(correo))?.fallos ?? 0) + 1;
  if (fallos >= MAX_FALLOS) {
    await almacen.intentosIngreso.guardar({ id: correo, fallos: 0, bloqueadoHasta: Date.now() + BLOQUEO_MS });
    return 0;
  }
  await almacen.intentosIngreso.guardar({ id: correo, fallos, bloqueadoHasta: 0 });
  return MAX_FALLOS - fallos;
}

async function errorCredenciales(correo: string): Promise<ErrorHttp> {
  const quedan = await registrarFallo(correo);
  return new ErrorHttp(
    401,
    'CREDENCIALES_INVALIDAS',
    quedan > 0 && quedan <= 2
      ? `Correo o clave incorrectos. Te ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`} antes de un bloqueo de 15 minutos.`
      : 'Correo o clave incorrectos.',
  );
}

/**
 * Cuentas creadas antes de activar Firebase Auth (clave cifrada en `usuarios`): si la clave coincide, se
 * crea su cuenta en Firebase con el mismo uid y se borra la clave local. Así nadie pierde su cuenta.
 */
async function migrarCuentaLocal(correo: string, clave: string): Promise<boolean> {
  const [usuario] = await almacen.usuarios.listar({ correo });
  if (!usuario?.clave || !(await claveCorrecta(usuario.clave, clave))) return false;
  if (await buscarCuentaPorCorreo(correo)) return false;
  await crearCuentaAuth({ uid: usuario.id, correo, clave, nombre: usuario.nombre, verificado: true });
  await almacen.usuarios.actualizar(usuario.id, { clave: '' });
  return true;
}

/** Perfil del uid; si la cuenta existe en Firebase pero no tiene perfil (creada desde la consola), lo crea. */
async function perfilDe(uid: string, correo: string): Promise<Usuario> {
  const existente = await almacen.usuarios.obtener(uid);
  if (existente) return existente;
  return almacen.usuarios.crear({
    id: uid,
    correo,
    clave: '',
    nombre: correo.split('@')[0],
    barrio: 'Barrio Los Olivos',
    oficios: [],
    necesidadActivaId: null,
    ubicacion: ZONA_DEMO,
    creadoEn: Date.now(),
    telefono: null,
    fotoUrl: null,
    ubicacionEn: null,
  });
}

// ---------- Ingresar, renovar y salir ----------

rutasAuth.post('/ingresar', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
  if (!correo || !clave) throw datosInvalidos('Envía correo y clave.');
  await exigirSinBloqueo(correo);

  if (!USA_FIREBASE_AUTH) {
    const [usuario] = await almacen.usuarios.listar({ correo });
    if (!usuario || !(await claveCorrecta(usuario.clave, clave))) throw await errorCredenciales(correo);
    await almacen.intentosIngreso.eliminar(correo);
    // Las cuentas sembradas traen la clave en texto: se cifra en su primer ingreso.
    if (!estaCifrada(usuario.clave)) await almacen.usuarios.actualizar(usuario.id, { clave: await cifrarClave(clave) });
    res.json({ ...(await abrirSesion(usuario.id)), usuario: aPublico(usuario) });
    return;
  }

  let tokens: TokensFirebase;
  try {
    tokens = await ingresarConClave(correo, clave);
  } catch (error) {
    if (!(error instanceof ErrorHttp && error.codigo === 'CREDENCIALES_INVALIDAS')) throw error;
    if (!(await migrarCuentaLocal(correo, clave))) throw await errorCredenciales(correo);
    tokens = await ingresarConClave(correo, clave);
  }
  await almacen.intentosIngreso.eliminar(correo);
  const usuario = await perfilDe(tokens.uid, correo);
  res.json({ ...aTokens(tokens), usuario: aPublico(usuario) });
});

/** Firebase: cambia el refresh token por un ID token nuevo. La app lo llama sola cuando su token vence. */
rutasAuth.post('/renovar', async (req, res) => {
  if (!USA_FIREBASE_AUTH) throw new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión de nuevo.');
  const renovacion = texto(req.body?.renovacion);
  if (!renovacion) throw new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión de nuevo.');
  res.json(aTokens(await renovarToken(renovacion)));
});

rutasAuth.get('/yo', requiereSesion, async (_req, res) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

rutasAuth.post('/salir', async (req, res) => {
  const token = leerToken(req.headers.authorization);
  if (token) await cerrarSesion(token);
  res.status(204).end();
});

/** Firebase: reenvía el correo para verificar la dirección. */
rutasAuth.post('/verificar-correo', requiereSesion, async (req, res) => {
  if (!USA_FIREBASE_AUTH) throw new ErrorHttp(400, 'NO_DISPONIBLE', 'La verificación de correo está disponible con Firebase Auth.');
  await enviarCorreoVerificacion(leerToken(req.headers.authorization)!);
  res.status(204).end();
});

// ---------- Recuperar clave (RF07) ----------
// Firebase: Firebase envía un correo con un enlace para crear la clave nueva (respuesta modo «enlace»).
// Local: código de 6 dígitos que vence en 15 min; sin servidor de correo, se imprime en la consola y, en la
// demo, vuelve en la respuesta (modo «codigo»).

const VIGENCIA_CODIGO_MS = 15 * 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
const MOSTRAR_CODIGO = process.env.MOSTRAR_CODIGO_DEMO !== 'no';

rutasAuth.post('/recuperar', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw datosInvalidos('Escribe un correo válido.');
  const [usuario] = await almacen.usuarios.listar({ correo });

  if (USA_FIREBASE_AUTH) {
    if (usuario || (await buscarCuentaPorCorreo(correo))) {
      // Cuenta creada antes de Firebase Auth: se le crea su cuenta para que el enlace funcione.
      if (usuario && !(await buscarCuentaPorCorreo(correo))) {
        await crearCuentaAuth({ uid: usuario.id, correo, clave: `${nuevoId('t')}Aa1!`, nombre: usuario.nombre, verificado: true });
        await almacen.usuarios.actualizar(usuario.id, { clave: '' });
      }
      await enviarCorreoRecuperacion(correo);
    }
    // Misma respuesta exista o no la cuenta: no revela qué correos están registrados.
    res.json({ modo: 'enlace', mensaje: 'Si el correo tiene una cuenta, te enviamos un enlace para crear una clave nueva.' });
    return;
  }

  let codigoDemo: string | undefined;
  if (usuario) {
    const codigo = String(randomInt(1_000_000)).padStart(6, '0');
    await almacen.codigosClave.guardar({ id: correo, codigo, venceEn: Date.now() + VIGENCIA_CODIGO_MS, intentos: 0 });
    console.log(`[recuperar] código para ${correo}: ${codigo}`);
    if (MOSTRAR_CODIGO) codigoDemo = codigo;
  }
  res.json({ modo: 'codigo', mensaje: 'Si el correo tiene una cuenta, te enviamos un código de 6 dígitos.', codigoDemo });
});

/** Solo modo local: código + clave nueva. Con Firebase, la clave se cambia desde el enlace del correo. */
rutasAuth.post('/restablecer', async (req, res) => {
  if (USA_FIREBASE_AUTH) throw datosInvalidos('Abre el enlace que te enviamos por correo para crear tu clave nueva.');
  const correo = texto(req.body?.correo)?.toLowerCase();
  const codigo = texto(req.body?.codigo);
  const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
  if (!correo || !codigo || !clave) throw datosInvalidos('Envía correo, código y la clave nueva.');

  const pedido = await almacen.codigosClave.obtener(correo);
  if (!pedido || pedido.venceEn < Date.now() || pedido.intentos >= MAX_INTENTOS_CODIGO) {
    await almacen.codigosClave.eliminar(correo);
    throw new ErrorHttp(400, 'CODIGO_VENCIDO', 'El código venció. Pide uno nuevo.');
  }
  if (pedido.codigo !== codigo) {
    await almacen.codigosClave.actualizar(correo, { intentos: pedido.intentos + 1 });
    throw new ErrorHttp(400, 'CODIGO_INCORRECTO', 'El código no es correcto. Revísalo e inténtalo de nuevo.');
  }
  const [usuario] = await almacen.usuarios.listar({ correo });
  if (!usuario) throw noEncontrado('La cuenta');
  validarClave(clave, { nombre: usuario.nombre, correo, telefono: usuario.telefono ?? undefined });
  await almacen.usuarios.actualizar(usuario.id, { clave: await cifrarClave(clave) });
  await almacen.codigosClave.eliminar(correo);
  await almacen.intentosIngreso.eliminar(correo);
  // La clave cambió: se cierran las sesiones abiertas en otros teléfonos.
  await cerrarSesionesDe(usuario.id);
  res.json({ ...(await abrirSesion(usuario.id)), usuario: aPublico(usuario) });
});

// ---------- Cambiar clave con sesión iniciada ----------

/**
 * @description Comprueba la clave actual del usuario en el modo que corresponda.
 */
export async function verificarClaveActual(usuario: Usuario, clave: string): Promise<boolean> {
  if (!clave) return false;
  if (!USA_FIREBASE_AUTH) return claveCorrecta(usuario.clave, clave);
  try {
    await ingresarConClave(usuario.correo, clave);
    return true;
  } catch (error) {
    if (error instanceof ErrorHttp && error.codigo === 'CREDENCIALES_INVALIDAS') return false;
    throw error;
  }
}

/** Devuelve tokens nuevos: con Firebase, cambiar la clave cierra todas las sesiones, también la de este teléfono. */
rutasAuth.post('/cambiar-clave', requiereSesion, async (req, res) => {
  const uid: string = res.locals.uid;
  const actual = typeof req.body?.actual === 'string' ? req.body.actual : '';
  const nueva = typeof req.body?.nueva === 'string' ? req.body.nueva : '';
  const usuario = await almacen.usuarios.obtener(uid);
  if (!usuario) throw noEncontrado('El usuario');
  if (!(await verificarClaveActual(usuario, actual))) {
    throw new ErrorHttp(400, 'CLAVE_ACTUAL_INCORRECTA', 'Tu clave actual no es correcta.');
  }
  if (nueva === actual) throw datosInvalidos('La clave nueva debe ser distinta de la actual.');
  validarClave(nueva, { nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono ?? undefined });

  if (!USA_FIREBASE_AUTH) {
    await almacen.usuarios.actualizar(uid, { clave: await cifrarClave(nueva) });
    // Sigue abierta la sesión de este teléfono; las demás se cierran.
    await cerrarSesionesDe(uid, leerToken(req.headers.authorization));
    res.json({});
    return;
  }
  await cambiarClaveAuth(uid, nueva);
  await cerrarSesionesDe(uid);
  res.json(aTokens(await ingresarConClave(usuario.correo, nueva)));
});
