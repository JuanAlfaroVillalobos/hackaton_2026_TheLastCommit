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
  return /^9\d{8}$/.test(local) ? `+51${local}` : null;
}

/** RF01: clave de 8 a 64 caracteres con al menos una letra y un número. */
export function validarClave(clave: string): void {
  if (clave.length < 8 || clave.length > 64 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
    throw datosInvalidos('La clave debe tener de 8 a 64 caracteres, con al menos una letra y un número.');
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
