// Ruta: src/nucleo/clima/obtenerClima.ts
// Clima de una ubicación con Open-Meteo (gratis, sin clave) y caché de 30 min por celda de ~5 km (RF29).
// Sin conexión o sin datos devuelve el último resultado guardado, o `null` (entonces se mantiene el tema actual).
import { temaPorClima, type DatosClima, type TemaClima } from "./reglasClima";

export type ClimaZona = DatosClima & {
  tema: TemaClima;
  obtenidoEn: number;
};

type Coordenada = { lat: number; lng: number };

const URL_BASE = "https://api.open-meteo.com/v1/forecast";
const VIGENCIA_MS = 30 * 60 * 1000;
const ESPERA_MAX_MS = 8000;
const cache = new Map<string, ClimaZona>();

/** Celda de ~0,05° (≈ 5 km): vecinos de la misma zona comparten el resultado. */
function claveCelda({ lat, lng }: Coordenada): string {
  return `${Math.round(lat / 0.05)},${Math.round(lng / 0.05)}`;
}

export function urlOpenMeteo({ lat, lng }: Coordenada): string {
  const q = [
    `latitude=${lat.toFixed(4)}`,
    `longitude=${lng.toFixed(4)}`,
    "current=temperature_2m,apparent_temperature,precipitation,weather_code",
    "daily=temperature_2m_max",
    "past_days=30",
    "forecast_days=1",
    "timezone=auto",
  ];
  return `${URL_BASE}?${q.join("&")}`;
}

/** Convierte la respuesta de Open-Meteo en `DatosClima`. Devuelve null si faltan datos. */
export function leerRespuesta(json: unknown): DatosClima | null {
  const r = json as {
    current?: { weather_code?: number; precipitation?: number; apparent_temperature?: number };
    daily?: { temperature_2m_max?: (number | null)[] };
  };
  const c = r?.current;
  if (!c || typeof c.apparent_temperature !== "number" || typeof c.weather_code !== "number") return null;
  const maximas = (r.daily?.temperature_2m_max ?? []).filter((x): x is number => typeof x === "number");
  return {
    codigoClima: c.weather_code,
    precipitacion: typeof c.precipitation === "number" ? c.precipitation : 0,
    temperaturaAparente: c.apparent_temperature,
    // El último valor de `daily` es hoy: no entra en la media de los últimos 30 días.
    maximasUltimos30Dias: maximas.slice(0, -1),
  };
}

export async function obtenerClima(ubicacion: Coordenada): Promise<ClimaZona | null> {
  const clave = claveCelda(ubicacion);
  const guardado = cache.get(clave);
  if (guardado && Date.now() - guardado.obtenidoEn < VIGENCIA_MS) return guardado;

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ESPERA_MAX_MS);
  try {
    const respuesta = await fetch(urlOpenMeteo(ubicacion), { signal: control.signal });
    if (!respuesta.ok) return guardado ?? null;
    const datos = leerRespuesta(await respuesta.json());
    if (!datos) return guardado ?? null;
    const clima: ClimaZona = { ...datos, tema: temaPorClima(datos), obtenidoEn: Date.now() };
    cache.set(clave, clima);
    return clima;
  } catch {
    return guardado ?? null; // sin conexión: lo último que se sabía
  } finally {
    clearTimeout(temporizador);
  }
}