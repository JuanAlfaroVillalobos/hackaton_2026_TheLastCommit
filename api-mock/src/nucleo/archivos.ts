// Ruta: src/nucleo/archivos.ts
// Fotos (perfil, DNI, selfie). Se guardan en la colección `archivos` del almacén: en Firestore con
// ALMACEN=firestore (se ven en la consola o en http://localhost:4000/firestore) y en memoria si no.
// Cada foto llega ya reducida por la app y cabe en un documento (límite de Firestore: 1 MiB).
// Opcional: ARCHIVOS=storage las manda a Cloud Storage (proyecto real con el bucket creado).
import { getStorage } from 'firebase-admin/storage';
import { almacen } from '../datos/almacen.js';
import { datosInvalidos, ErrorHttp } from './errores.js';
import { appFirebase, PROYECTO_FIREBASE } from './firebase.js';

export interface Archivo {
  tipo: string;
  datos: Buffer;
}

/** Tamaño máximo de una foto: en base64 ocupa ~4/3 y el documento no puede pasar de 1 MiB. */
export const MAX_BYTES_ARCHIVO = 700 * 1024;

export const USA_STORAGE = process.env.ARCHIVOS === 'storage';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? `${PROYECTO_FIREBASE}.firebasestorage.app`;
const LIMITE_STORAGE_MS = 15_000;

const idDe = (ruta: string) => ruta.replace(/\//g, '__');

// ---------- Cloud Storage (opcional) ----------

const archivoStorage = (ruta: string) => getStorage(appFirebase()).bucket(BUCKET).file(ruta);

/** Falla rápido con un 503 claro en vez de dejar la app esperando los reintentos de Storage. */
async function conStorage<T>(accion: () => Promise<T>): Promise<T> {
  let temporizador: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      accion(),
      new Promise<never>((_, rechazar) => {
        temporizador = setTimeout(() => rechazar(new Error(`Storage no respondió en ${LIMITE_STORAGE_MS / 1000} s`)), LIMITE_STORAGE_MS);
      }),
    ]);
  } catch (error) {
    console.error('[archivos] Storage:', error instanceof Error ? error.message : error);
    throw new ErrorHttp(503, 'STORAGE_NO_DISPONIBLE', 'No pudimos guardar o leer la foto. Inténtalo en unos minutos.');
  } finally {
    clearTimeout(temporizador);
  }
}

// ---------- API pública ----------

/**
 * @description Guarda o reemplaza el archivo en la ruta (p. ej. «avatares/u00»).
 */
export async function guardarArchivo(ruta: string, { tipo, datos }: Archivo): Promise<void> {
  if (datos.length > MAX_BYTES_ARCHIVO) throw datosInvalidos('La foto pesa demasiado. Tómala de nuevo.');
  if (USA_STORAGE) {
    await conStorage(() => archivoStorage(ruta).save(datos, { contentType: tipo, resumable: false }));
    return;
  }
  await almacen.archivos.guardar({
    id: idDe(ruta),
    ruta,
    tipo,
    base64: datos.toString('base64'),
    bytes: datos.length,
    guardadoEn: Date.now(),
  });
}

/**
 * @description Lee el archivo, o null si no existe.
 */
export async function leerArchivo(ruta: string): Promise<Archivo | null> {
  if (USA_STORAGE) {
    return conStorage(async () => {
      const f = archivoStorage(ruta);
      const [existe] = await f.exists();
      if (!existe) return null;
      const [[datos], [metadatos]] = await Promise.all([f.download(), f.getMetadata()]);
      return { datos, tipo: metadatos.contentType ?? 'application/octet-stream' };
    });
  }
  const guardado = await almacen.archivos.obtener(idDe(ruta));
  return guardado ? { tipo: guardado.tipo, datos: Buffer.from(guardado.base64, 'base64') } : null;
}

/**
 * @description Borra el archivo si existe (no falla si ya no estaba).
 */
export async function borrarArchivo(ruta: string): Promise<void> {
  if (USA_STORAGE) {
    await conStorage(() => archivoStorage(ruta).delete({ ignoreNotFound: true }));
    return;
  }
  await almacen.archivos.eliminar(idDe(ruta));
}

/** Dónde van los archivos, para el log de arranque. */
export function destinoArchivos(): string {
  if (USA_STORAGE) {
    const emulador = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    return emulador ? `Storage (emulador ${emulador})` : `Storage (${BUCKET})`;
  }
  return process.env.ALMACEN === 'firestore' ? 'Firestore (colección archivos)' : 'memoria';
}
