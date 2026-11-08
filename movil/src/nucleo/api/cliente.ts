// Ruta: src/nucleo/api/cliente.ts
// Cliente HTTP de la API (api-mock/ en la raíz del repo). Los servicios de cada módulo llaman a `api()`.
// URL: EXPO_PUBLIC_API_URL si existe; si no, la IP de la computadora que corre Metro, en el puerto 3000.
// - Cada llamada tiene un tiempo límite: la app nunca se queda «cargando» para siempre.
// - Con Firebase Auth el token dura 1 h: si la API responde TOKEN_VENCIDO, se renueva solo y se reintenta.
import Constants from 'expo-constants';

const PUERTO_API = 3000;
/** Tiempo límite por defecto de una llamada. Las subidas de fotos piden más con `tiempoMs`. */
const TIEMPO_POR_DEFECTO_MS = 20_000;

function urlBase(): string {
  const definida = process.env.EXPO_PUBLIC_API_URL;
  if (definida) return definida.replace(/\/$/, '');
  // hostUri = "192.168.1.20:8081" cuando la app viene de Metro; el celular ya llega a esa IP.
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${PUERTO_API}/api/v1`;
}

export const URL_API = urlBase();

let token: string | null = null;
let renovador: (() => Promise<string | null>) | null = null;
let renovando: Promise<string | null> | null = null;

/** Lo fija la sesión al ingresar o restaurar; se manda como `Authorization: Bearer`. */
export function fijarToken(nuevo: string | null): void {
  token = nuevo;
}

/**
 * @description La sesión registra cómo pedir un token nuevo cuando el actual vence (null para quitarlo).
 */
export function configurarRenovacion(funcion: (() => Promise<string | null>) | null): void {
  renovador = funcion;
}

/** Varias llamadas pueden vencer a la vez: todas esperan la misma renovación. */
function renovarUnaVez(): Promise<string | null> {
  if (!renovador) return Promise.resolve(null);
  renovando ??= renovador()
    .catch(() => null)
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

/** Cabecera de sesión para cargar recursos privados con <Image source={{ uri, headers }} />. */
export function cabecerasSesion(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** URL completa de un recurso de la API a partir de su ruta, p. ej. «/avatares/u00?v=1». */
export function urlApi(ruta: string): string {
  return /^https?:\/\//.test(ruta) ? ruta : `${URL_API}${ruta}`;
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** true si el error es de red (sin conexión o sin respuesta a tiempo): la acción se puede reintentar. */
export const esErrorDeRed = (error: unknown) =>
  error instanceof ErrorApi && (error.codigo === 'SIN_CONEXION' || error.codigo === 'TIEMPO_AGOTADO');

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  /** Id único de la acción (bandeja de salida): la API ignora repeticiones con el mismo id (RN-20). */
  idAccion?: string;
  /** Tiempo límite en ms (por defecto 20 s). */
  tiempoMs?: number;
  /** Uso interno: no intentar renovar el token (la propia renovación). */
  sinRenovar?: boolean;
}

/**
 * @description Llama a la API y devuelve el JSON. Lanza ErrorApi con el mensaje del servidor, `SIN_CONEXION` si
 * la API no responde o `TIEMPO_AGOTADO` si tarda demasiado, para que la pantalla lo muestre tal cual.
 */
export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, idAccion, tiempoMs = TIEMPO_POR_DEFECTO_MS, sinRenovar = false } = opciones;
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempoMs);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(idAccion && { 'X-Id-Accion': idAccion }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch {
    if (control.signal.aborted) {
      throw new ErrorApi(0, 'TIEMPO_AGOTADO', 'La conexión está muy lenta y no recibimos respuesta. Inténtalo de nuevo.');
    }
    throw new ErrorApi(0, 'SIN_CONEXION', `No se pudo conectar con la API (${URL_API}).`);
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401 && datos?.error === 'TOKEN_VENCIDO' && !sinRenovar) {
      const nuevo = await renovarUnaVez();
      if (nuevo) return api<T>(ruta, { ...opciones, sinRenovar: true });
    }
    throw new ErrorApi(respuesta.status, datos?.error ?? 'ERROR', datos?.mensaje ?? `Error ${respuesta.status}`);
  }
  return datos as T;
}
