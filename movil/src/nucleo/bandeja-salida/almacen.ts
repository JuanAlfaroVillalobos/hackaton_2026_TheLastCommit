// Ruta: src/nucleo/bandeja-salida/almacen.ts
// Cola persistente en un archivo JSON del teléfono (sobrevive a cerrar la app). Estado observable para los hooks.
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { AccionGuardada } from './tipos';

const MAX_ACCIONES = 100;

let acciones: AccionGuardada[] = [];
let cargada = false;
const oyentes = new Set<() => void>();

const archivo = () => new File(Paths.document, 'bandeja-salida.json');

/**
 * @description Lee la cola del disco una sola vez por arranque.
 */
export async function cargarCola(): Promise<void> {
  if (cargada) return;
  cargada = true;
  if (Platform.OS === 'web') return;
  try {
    const f = archivo();
    if (f.exists) {
      const leidas = JSON.parse(await f.text()) as AccionGuardada[];
      // Lo leído va primero: es más antiguo que lo encolado mientras se leía.
      if (Array.isArray(leidas)) acciones = [...leidas, ...acciones.filter((a) => !leidas.some((l) => l.idAccion === a.idAccion))];
    }
  } catch {
    // archivo dañado: se empieza vacía
  }
  avisar();
}

async function guardar(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await archivo().write(JSON.stringify(acciones));
  } catch {
    // sin espacio: la cola sigue en memoria mientras la app esté abierta
  }
}

function avisar(): void {
  oyentes.forEach((o) => o());
}

export function leerCola(): AccionGuardada[] {
  return acciones;
}

export async function encolar(accion: AccionGuardada): Promise<void> {
  acciones = [...acciones.filter((a) => a.idAccion !== accion.idAccion), accion].slice(-MAX_ACCIONES);
  avisar();
  await guardar();
}

export async function actualizarAccion(idAccion: string, cambios: Partial<AccionGuardada>): Promise<void> {
  acciones = acciones.map((a) => (a.idAccion === idAccion ? { ...a, ...cambios } : a));
  avisar();
  await guardar();
}

export async function quitarDeCola(idAccion: string): Promise<void> {
  acciones = acciones.filter((a) => a.idAccion !== idAccion);
  avisar();
  await guardar();
}

export function suscribirCola(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}
