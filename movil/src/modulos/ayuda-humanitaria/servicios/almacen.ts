// Ruta: src/modulos/ayuda-humanitaria/servicios/almacen.ts
// Guarda datos en el teléfono (sobreviven al cerrar la app) usando expo-secure-store, que ya está instalado.
// SecureStore limita cada valor a ~2 KB, así que el JSON se parte en trozos. Es de mejor esfuerzo: si falla, no rompe nada.
import * as SecureStore from "expo-secure-store";

const TROZO = 1500;

export async function guardarLocal(clave: string, valor: unknown): Promise<void> {
  try {
    const texto = JSON.stringify(valor);
    const previos = Number((await SecureStore.getItemAsync(`${clave}.n`)) ?? 0);
    const trozos: string[] = [];
    for (let i = 0; i < texto.length; i += TROZO) trozos.push(texto.slice(i, i + TROZO));
    for (let i = 0; i < trozos.length; i++) await SecureStore.setItemAsync(`${clave}.${i}`, trozos[i]);
    await SecureStore.setItemAsync(`${clave}.n`, String(trozos.length));
    for (let i = trozos.length; i < previos; i++) await SecureStore.deleteItemAsync(`${clave}.${i}`);
  } catch {
    // sin almacenamiento local: se sigue con la copia en memoria
  }
}

export async function leerLocal<T>(clave: string): Promise<T | null> {
  try {
    const n = Number((await SecureStore.getItemAsync(`${clave}.n`)) ?? 0);
    if (n === 0) return null;
    let texto = "";
    for (let i = 0; i < n; i++) texto += (await SecureStore.getItemAsync(`${clave}.${i}`)) ?? "";
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}