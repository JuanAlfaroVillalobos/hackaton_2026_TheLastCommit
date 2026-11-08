// Ruta: src/modulos/auth/rutas.ts
// Cuentas simuladas (RF01–RF07). Con Firebase Auth el inicio de sesión pasa a la app y esta API
// solo verifica el ID token; con MongoDB, la clave se guarda con hash (bcrypt/argon2), nunca en claro.
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import { ZONA_DEMO } from '../../datos/semillas.js';
import type { Usuario } from '../../datos/tipos.js';
import { abrirSesion, cerrarSesion, leerToken, requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import { randomInt } from 'node:crypto';
import { nuevoId, texto } from '../../nucleo/utilidades.js';
import { exigirTelefonoLibre, normalizarTelefono, validarClave, validarCorreo, validarNombre } from './validaciones.js';

export type UsuarioPublico = Omit<Usuario, 'clave' | 'dispositivos'>;

export function aPublico({ clave: _clave, dispositivos: _dispositivos, ...resto }: Usuario): UsuarioPublico {
  return resto;
}

export const rutasAuth = Router();

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

  const usuario = await almacen.usuarios.crear({
    id: nuevoId('u'),
    correo,
    clave,
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
  res.status(201).json({ token: abrirSesion(usuario.id), usuario: aPublico(usuario) });
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

rutasAuth.post('/ingresar', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  const clave = texto(req.body?.clave);
  if (!correo || !clave) throw datosInvalidos('Envía correo y clave.');

  const [usuario] = await almacen.usuarios.listar({ correo });
  if (!usuario || usuario.clave !== clave) {
    throw new ErrorHttp(401, 'CREDENCIALES_INVALIDAS', 'Correo o clave incorrectos.');
  }
  res.json({ token: abrirSesion(usuario.id), usuario: aPublico(usuario) });
});

rutasAuth.get('/yo', requiereSesion, async (_req, res) => {
  const usuario = await almacen.usuarios.obtener(res.locals.uid);
  if (!usuario) throw noEncontrado('El usuario');
  res.json(aPublico(usuario));
});

rutasAuth.post('/salir', (req, res) => {
  const token = leerToken(req.headers.authorization);
  if (token) cerrarSesion(token);
  res.status(204).end();
});

// ---------- Recuperar clave (RF07) ----------
// Con Firebase Auth esto lo hace sendPasswordResetEmail. Aquí se genera un código de 6 dígitos que
// vence en 15 min; sin servidor de correo, se imprime en la consola y, en la demo, vuelve en la respuesta.

const VIGENCIA_CODIGO_MS = 15 * 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
const MOSTRAR_CODIGO = process.env.MOSTRAR_CODIGO_DEMO !== 'no';
const codigos = new Map<string, { codigo: string; venceEn: number; intentos: number }>();

rutasAuth.post('/recuperar', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw datosInvalidos('Escribe un correo válido.');

  const [usuario] = await almacen.usuarios.listar({ correo });
  let codigoDemo: string | undefined;
  if (usuario) {
    const codigo = String(randomInt(1_000_000)).padStart(6, '0');
    codigos.set(correo, { codigo, venceEn: Date.now() + VIGENCIA_CODIGO_MS, intentos: 0 });
    console.log(`[recuperar] código para ${correo}: ${codigo}`);
    if (MOSTRAR_CODIGO) codigoDemo = codigo;
  }
  // Misma respuesta exista o no la cuenta: no revela qué correos están registrados.
  res.json({ mensaje: 'Si el correo tiene una cuenta, te enviamos un código de 6 dígitos.', codigoDemo });
});

rutasAuth.post('/restablecer', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  const codigo = texto(req.body?.codigo);
  const clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
  if (!correo || !codigo || !clave) throw datosInvalidos('Envía correo, código y la clave nueva.');

  const pedido = codigos.get(correo);
  if (!pedido || pedido.venceEn < Date.now() || pedido.intentos >= MAX_INTENTOS_CODIGO) {
    codigos.delete(correo);
    throw new ErrorHttp(400, 'CODIGO_VENCIDO', 'El código venció. Pide uno nuevo.');
  }
  if (pedido.codigo !== codigo) {
    pedido.intentos += 1;
    throw new ErrorHttp(400, 'CODIGO_INCORRECTO', 'El código no es correcto. Revísalo e inténtalo de nuevo.');
  }
  const [usuario] = await almacen.usuarios.listar({ correo });
  if (!usuario) throw noEncontrado('La cuenta');
  validarClave(clave, { nombre: usuario.nombre, correo, telefono: usuario.telefono ?? undefined });
  await almacen.usuarios.actualizar(usuario.id, { clave });
  codigos.delete(correo);
  res.json({ token: abrirSesion(usuario.id), usuario: aPublico({ ...usuario, clave }) });
});
