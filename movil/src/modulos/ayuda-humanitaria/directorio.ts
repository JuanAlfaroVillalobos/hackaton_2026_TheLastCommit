// Ruta: src/modulos/ayuda-humanitaria/directorio.ts
// Reglas puras del directorio de emergencia (P23, RF40): validación, enlaces, búsqueda y orden.
import { TIPOS_FICHA } from "./constantesDirectorio";
import type { FichaDirectorio, TipoFichaDirectorio } from "./tipos";

export const MAX_NOMBRE_FICHA = 60;
export const MAX_DIRECCION_FICHA = 100;
export const MAX_HORARIO_FICHA = 40;
export const MIN_DIGITOS_TELEFONO = 3; // números de emergencia como 116 o 105
export const MAX_DIGITOS_TELEFONO = 15;
export const MIN_DIGITOS_WHATSAPP = 9;

export type FiltroFicha = TipoFichaDirectorio | "TODOS";

export type BorradorFicha = {
  nombre: string;
  tipo: TipoFichaDirectorio | null;
  telefono: string;
  whatsapp: string;
  direccion: string;
  horario: string;
};

export function soloDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/** Devuelve los problemas del borrador; lista vacía = se puede enviar. */
export function validarFicha(b: BorradorFicha): string[] {
  const errores: string[] = [];
  if (b.nombre.trim().length === 0) errores.push("Escribe el nombre.");
  if (b.nombre.length > MAX_NOMBRE_FICHA) errores.push("El nombre admite hasta 60 caracteres.");
  if (!b.tipo) errores.push("Elige el tipo de ficha.");
  const tel = soloDigitos(b.telefono).length;
  if (tel < MIN_DIGITOS_TELEFONO || tel > MAX_DIGITOS_TELEFONO) errores.push("Revisa el teléfono.");
  if (b.whatsapp.trim().length > 0) {
    const wa = soloDigitos(b.whatsapp).length;
    if (wa < MIN_DIGITOS_WHATSAPP || wa > MAX_DIGITOS_TELEFONO) errores.push("Revisa el número de WhatsApp.");
  }
  if (b.direccion.length > MAX_DIRECCION_FICHA) errores.push("La dirección admite hasta 100 caracteres.");
  if (b.horario.length > MAX_HORARIO_FICHA) errores.push("El horario admite hasta 40 caracteres.");
  return errores;
}

/** Enlace para abrir el marcador del teléfono. */
export function enlaceLlamar(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

/** Enlace para abrir WhatsApp con ese número (con código de país, p. ej. 51999999999). */
export function enlaceWhatsApp(numero: string): string {
  return `https://wa.me/${soloDigitos(numero)}`;
}

/** Minúsculas y sin tildes, para buscar sin importar cómo se escriba. */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Fichas aprobadas, más las que yo propuse y siguen pendientes. */
export function fichasVisibles(fichas: FichaDirectorio[], uid: string): FichaDirectorio[] {
  return fichas.filter((f) => f.aprobado || f.propuestaPorId === uid);
}

export function filtrarFichas(
  fichas: FichaDirectorio[],
  texto: string,
  tipo: FiltroFicha,
): FichaDirectorio[] {
  const q = normalizar(texto.trim());
  return fichas.filter(
    (f) =>
      (tipo === "TODOS" || f.tipo === tipo) &&
      (q === "" || normalizar(`${f.nombre} ${f.direccion}`).includes(q)),
  );
}

/** Aprobadas primero; luego por tipo (bomberos, serenazgo, comisaría…); luego por nombre. */
export function ordenarFichas(fichas: FichaDirectorio[]): FichaDirectorio[] {
  return [...fichas].sort(
    (a, b) =>
      Number(b.aprobado) - Number(a.aprobado) ||
      TIPOS_FICHA.indexOf(a.tipo) - TIPOS_FICHA.indexOf(b.tipo) ||
      a.nombre.localeCompare(b.nombre),
  );
}
