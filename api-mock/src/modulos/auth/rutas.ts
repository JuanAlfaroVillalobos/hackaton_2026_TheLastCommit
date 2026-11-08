// Ruta: src/modulos/auth/rutas.ts
// Cuentas simuladas (RF01–RF07). Con Firebase Auth el inicio de sesión pasa a la app y esta API
// solo verifica el ID token; con MongoDB, la clave se guarda con hash (bcrypt/argon2), nunca en claro.
import { Router } from 'express';
import { almacen } from '../../datos/almacen.js';
import { ZONA_DEMO } from '../../datos/semillas.js';
import type { Usuario } from '../../datos/tipos.js';
import { abrirSesion, cerrarSesion, leerToken, requiereSesion } from '../../nucleo/autenticacion.js';
import { conflicto, datosInvalidos, ErrorHttp, noEncontrado } from '../../nucleo/errores.js';
import { nuevoId, texto } from '../../nucleo/utilidades.js';
import { exigirTelefonoLibre, normalizarTelefono, validarClave } from './validaciones.js';

export type UsuarioPublico = Omit<Usuario, 'clave' | 'dispositivos'>;

export function aPublico({ clave: _clave, dispositivos: _dispositivos, ...resto }: Usuario): UsuarioPublico {
  return resto;
}

export const rutasAuth = Router();

rutasAuth.post('/registro', async (req, res) => {
  const correo = texto(req.body?.correo)?.toLowerCase();
  const clave = texto(req.body?.clave);
  const nombre = texto(req.body?.nombre);
  const telefono = normalizarTelefono(req.body?.telefono);
  if (!correo || !clave || !nombre) throw datosInvalidos('Envía correo, clave y nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw datosInvalidos('Escribe un correo válido.');
  if (nombre.length < 2 || nombre.length > 60) throw datosInvalidos('El nombre debe tener de 2 a 60 caracteres.');
  if (!telefono) throw datosInvalidos('Escribe un celular peruano de 9 dígitos que empiece en 9.');
  validarClave(clave);
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
  });
  res.status(201).json({ token: abrirSesion(usuario.id), usuario: aPublico(usuario) });
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
