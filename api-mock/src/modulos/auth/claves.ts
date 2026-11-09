// Ruta: src/modulos/auth/claves.ts
// Las claves se guardan cifradas con scrypt (sal aleatoria), nunca en texto: ahora viven en Firestore y
// cualquiera del equipo puede ver la colección. Las semillas en texto se cifran al primer ingreso.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;
const PREFIJO = 'scrypt';
const LARGO = 32;

/**
 * @description Devuelve la clave cifrada como «scrypt$sal$hash» (base64), lista para guardar.
 */
export async function cifrarClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, LARGO);
  return `${PREFIJO}$${sal.toString('base64')}$${hash.toString('base64')}`;
}

export const estaCifrada = (guardada: string) => guardada.startsWith(`${PREFIJO}$`);

/**
 * @description Compara en tiempo constante. Acepta claves antiguas en texto (semillas) para poder cifrarlas después.
 */
export async function claveCorrecta(guardada: string | undefined, clave: string): Promise<boolean> {
  if (!guardada || !clave) return false;
  if (!estaCifrada(guardada)) {
    const a = Buffer.from(guardada);
    const b = Buffer.from(clave);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [, salB64, hashB64] = guardada.split('$');
  const esperado = Buffer.from(hashB64, 'base64');
  const calculado = await scrypt(clave, Buffer.from(salB64, 'base64'), esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}
