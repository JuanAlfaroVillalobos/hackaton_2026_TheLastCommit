// Ruta: src/modulos/auth/validaciones.ts
// Reglas de cuentas (RF01, RN-01, RN-03) compartidas por auth y vecinos.
import { almacen } from '../../datos/almacen.js';
import { conflicto, datosInvalidos } from '../../nucleo/errores.js';

/** Catálogo cerrado de oficios (RN-03). Copia movil/src/compartido/constantes/oficios.ts. */
export const OFICIOS_VALIDOS = new Set([
  'gasfiteria',
  'electricidad',
  'carpinteria',
  'limpieza',
  'cuidado-ninos',
  'cuidado-adultos-mayores',
  'mascotas',
  'clases-tutorias',
  'tecnologia',
  'mandados-compras',
  'primeros-auxilios',
  'otro',
]);
export const MAX_OFICIOS = 5;

/** Acepta «+51987654321» o «987654321» y devuelve E.164; null si no es un celular peruano válido. */
export function normalizarTelefono(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const digitos = valor.replace(/[\s-]/g, '');
  const local = digitos.startsWith('+51') ? digitos.slice(3) : digitos;
  if (!/^9\d{8}$/.test(local) || /^9(\d)\1{7}$/.test(local)) return null;
  return `+51${local}`;
}

// Mismas reglas que movil/src/modulos/cuentas/validaciones.ts.
const LETRAS = 'A-Za-zÀ-ÖØ-öø-ÿ';
const PARTE_NOMBRE = new RegExp(`^[${LETRAS}]+(?:['-][${LETRAS}]+)*$`);

/** RF01: nombre y apellido con letras (tildes, ñ, apóstrofo, guion), 2 a 60 caracteres. Devuelve el nombre limpio. */
export function validarNombre(valor: unknown): string {
  const nombre = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
  const partes = nombre.split(' ');
  if (!nombre || nombre.length > 60) throw datosInvalidos('El nombre debe tener de 2 a 60 caracteres.');
  if (partes.some((p) => !PARTE_NOMBRE.test(p))) throw datosInvalidos('El nombre solo puede tener letras, apóstrofo o guion.');
  if (partes.filter((p) => p.replace(/['-]/g, '').length >= 2).length < 2) {
    throw datosInvalidos('Escribe tu nombre y apellido completos.');
  }
  if (/(.)\1\1/i.test(nombre.replace(/\s/g, ''))) throw datosInvalidos('Revisa tu nombre: tiene letras repetidas.');
  return nombre;
}

const CORREO = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const DOMINIOS_TEMPORALES = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'temp-mail.org',
  'tempmail.com', 'tempmail.net', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'emailondeck.com', 'mohmal.com', 'tempail.com',
]);

/** RF01: correo con formato válido y no temporal. Devuelve el correo en minúsculas. */
export function validarCorreo(valor: unknown): string {
  const correo = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (!correo || correo.length > 254 || correo.includes('..') || !CORREO.test(correo)) {
    throw datosInvalidos('Escribe un correo válido.');
  }
  if (DOMINIOS_TEMPORALES.has(correo.split('@')[1])) throw datosInvalidos('Usa un correo permanente. No aceptamos correos temporales.');
  return correo;
}

const CLAVES_COMUNES = new Set([
  'password1', 'password123', 'passw0rd', 'contraseña1', 'contrasena1', 'qwerty123', 'qwerty1234', 'abc12345',
  'abcd1234', '1q2w3e4r', '1qaz2wsx', 'iloveyou1', 'admin123', 'welcome1', 'peru1234', 'vecinos123',
  'teamo123', 'aa123456', 'a1234567', 'p@ssw0rd', 'master123', 'sunshine1', 'football1', 'monkey123',
]);

const sinTildes = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** RF01: 8 a 64 caracteres, minúscula, mayúscula y número, sin espacios, no común y sin datos personales. */
export function validarClave(clave: string, datos: { nombre?: string; correo?: string; telefono?: string } = {}): void {
  if (clave.length < 8 || clave.length > 64 || /\s/.test(clave) || !/[a-zà-ÿ]/.test(clave) || !/[A-ZÀ-Þ]/.test(clave) || !/\d/.test(clave)) {
    throw datosInvalidos('La clave debe tener de 8 a 64 caracteres, sin espacios, con minúscula, mayúscula y número.');
  }
  if (CLAVES_COMUNES.has(clave.toLowerCase())) throw datosInvalidos('Esa clave es muy común y fácil de adivinar. Elige otra.');
  if (/(.)\1{3}/.test(clave)) throw datosInvalidos('La clave no puede repetir el mismo carácter 4 veces seguidas.');
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|qwer/i.test(clave) && clave.length < 12) {
    throw datosInvalidos('Evita secuencias como «1234» o «abcd» en la clave, o usa 12 caracteres o más.');
  }
  const piezas = [
    ...sinTildes((datos.nombre ?? '').toLowerCase()).split(/\s+/),
    (datos.correo ?? '').toLowerCase().split('@')[0] ?? '',
    (datos.telefono ?? '').slice(-6),
  ].filter((p) => p.length >= 4);
  if (piezas.some((p) => sinTildes(clave.toLowerCase()).includes(p))) {
    throw datosInvalidos('La clave no puede contener tu nombre, tu correo ni tu teléfono.');
  }
}

/** RN-01: un teléfono pertenece como máximo a un perfil. */
export async function exigirTelefonoLibre(telefono: string, uidPropio?: string): Promise<void> {
  const usados = await almacen.usuarios.listar({ telefono });
  if (usados.some((u) => u.id !== uidPropio)) throw conflicto('Ese teléfono ya está registrado en otra cuenta.');
}

/** RN-03: de 1 a 5 oficios del catálogo, sin repetidos. */
export function validarOficios(valor: unknown): string[] {
  if (!Array.isArray(valor)) throw datosInvalidos('Envía los oficios como una lista.');
  const oficios = [...new Set(valor.filter((o): o is string => typeof o === 'string' && OFICIOS_VALIDOS.has(o)))];
  if (oficios.length !== valor.length) throw datosInvalidos('Hay oficios que no están en el catálogo o repetidos.');
  if (oficios.length < 1 || oficios.length > MAX_OFICIOS) throw datosInvalidos('Elige de 1 a 5 oficios.');
  return oficios;
}
