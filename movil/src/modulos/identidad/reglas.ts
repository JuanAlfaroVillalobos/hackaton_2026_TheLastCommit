// Ruta: src/modulos/identidad/reglas.ts
// Validaciones del formulario de identidad (RF36). La API revisa lo mismo.

const LETRAS = 'A-Za-zÀ-ÖØ-öø-ÿ';
const PALABRAS = new RegExp(`^[${LETRAS}]+(?:['-][${LETRAS}]+)*(?: [${LETRAS}]+(?:['-][${LETRAS}]+)*)*$`);

/** Como en el DNI: en mayúsculas y sin espacios de más. */
export const normalizarComoDni = (texto: string) => texto.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es');

export function errorDni(dni: string): string | undefined {
  if (!dni) return 'Escribe tu número de DNI.';
  if (dni.length < 8) return dni.length === 7 ? 'Falta 1 dígito.' : `Faltan ${8 - dni.length} dígitos.`;
  if (!/^\d{8}$/.test(dni)) return 'El DNI tiene 8 dígitos.';
  if (/^(\d)\1{7}$/.test(dni) || dni === '12345678' || dni === '87654321') return 'Ese número de DNI no es válido.';
  return undefined;
}

export function errorNombres(valor: string, campo: 'nombres' | 'apellidos', unSoloApellido = false): string | undefined {
  const v = valor.trim().replace(/\s+/g, ' ');
  if (!v) return campo === 'nombres' ? 'Escribe tus nombres.' : 'Escribe tus apellidos.';
  if (v.length < 2 || v.length > 60) return 'Debe tener de 2 a 60 caracteres.';
  if (!PALABRAS.test(v)) return 'Usa solo letras, como en tu DNI.';
  if (campo === 'apellidos' && !unSoloApellido && v.split(' ').length < 2) return 'Escribe tus dos apellidos, como en tu DNI.';
  return undefined;
}

/**
 * @description RN-18: ofrecer ayuda y publicar exigen la identidad al menos enviada (PENDIENTE). Pedir ayuda y la emergencia nunca.
 */
export const identidadEnviada = (estado: string | null | undefined) => estado === 'PENDIENTE' || estado === 'VERIFICADA';
