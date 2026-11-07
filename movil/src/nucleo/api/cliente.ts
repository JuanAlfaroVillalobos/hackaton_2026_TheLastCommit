// Ruta: src/nucleo/api/cliente.ts
// Cliente HTTP de la API simulada (api-mock/ en la raíz del repo). Mientras Firebase está desactivado,
// los servicios de cada módulo llaman a `api()` en vez de a Firestore o a las funciones invocables.
// URL: EXPO_PUBLIC_API_URL si existe; si no, la IP de la computadora que corre Metro, en el puerto 3000.
import Constants from 'expo-constants';

const PUERTO_API = 3000;

function urlBase(): string {
  const definida = process.env.EXPO_PUBLIC_API_URL;
  if (definida) return definida.replace(/\/$/, '');
  // hostUri = "192.168.1.20:8081" cuando la app viene de Metro; el celular ya llega a esa IP.
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${PUERTO_API}/api/v1`;
}

export const URL_API = urlBase();

let token: string | null = null;

/** Lo fija la sesión al ingresar o restaurar; se manda como `Authorization: Bearer`. */
export function fijarToken(nuevo: string | null): void {
  token = nuevo;
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

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
}

/**
 * @description Llama a la API y devuelve el JSON. Lanza ErrorApi con el mensaje del servidor (o
 * `SIN_CONEXION` si la API no responde) para que la pantalla lo muestre tal cual.
 */
export async function api<T>(ruta: string, { metodo = 'GET', cuerpo }: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', `No se pudo conectar con la API (${URL_API}).`);
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos?.error ?? 'ERROR', datos?.mensaje ?? `Error ${respuesta.status}`);
  }
  return datos as T;
}
