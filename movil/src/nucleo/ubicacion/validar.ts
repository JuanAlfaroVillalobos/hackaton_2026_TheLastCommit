// Ruta: src/nucleo/ubicacion/validar.ts
// Ubicación validada (RF42): fresca (≤ 2 min), precisa (≤ 100 m) y no simulada.
import type { Coordenada } from '@/compartido/utilidades/geo';
import * as Location from 'expo-location';

export const FRESCURA_MAX_MS = 2 * 60 * 1000;
export const PRECISION_MAX_M = 100;
const ESPERA_GPS_MS = 15_000;

export interface UbicacionValidada {
  coordenada: Coordenada;
  /** Radio de error en metros; null si el vecino la marcó a mano. */
  precisionM: number | null;
  /** RF42: true si se eligió moviendo el pin. */
  manual: boolean;
  tomadaEn: number;
}

export type MotivoRechazo = 'SIN_PERMISO' | 'GPS_APAGADO' | 'SIMULADA' | 'IMPRECISA' | 'SIN_SENAL';

export type ResultadoUbicacion =
  | { ok: true; ubicacion: UbicacionValidada }
  | { ok: false; motivo: MotivoRechazo; aproximada?: Coordenada };

/** Textos de RF42 para cada motivo. */
export const MENSAJES_UBICACION: Record<MotivoRechazo, { titulo: string; texto: string }> = {
  SIN_PERMISO: {
    titulo: 'Necesitamos tu ubicación',
    texto: 'Sin permiso de ubicación puedes marcar tu zona a mano en el mapa.',
  },
  GPS_APAGADO: {
    titulo: 'Tu ubicación está apagada',
    texto: 'Actívala en los ajustes rápidos del teléfono o marca tu zona en el mapa.',
  },
  SIMULADA: {
    titulo: 'Ubicación simulada',
    texto: 'Detectamos una ubicación simulada. Desactívala para continuar.',
  },
  IMPRECISA: {
    titulo: 'Ubicación poco precisa',
    texto: 'No logramos ubicarte con precisión. Reintenta al aire libre o mueve el pin a mano.',
  },
  SIN_SENAL: {
    titulo: 'No encontramos tu ubicación',
    texto: 'El GPS tardó demasiado. Reintenta o marca tu zona en el mapa.',
  },
};

/**
 * @description Espera una promesa como máximo `ms` milisegundos; si se pasa, resuelve null.
 */
function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promesa, new Promise<null>((resolver) => setTimeout(() => resolver(null), ms))]);
}

/**
 * @description Convierte una lectura de expo-location en el resultado de RF42.
 */
function evaluar(lectura: Location.LocationObject): ResultadoUbicacion {
  const coordenada = { lat: lectura.coords.latitude, lng: lectura.coords.longitude };
  if (lectura.mocked) return { ok: false, motivo: 'SIMULADA' };
  const precision = lectura.coords.accuracy ?? Number.POSITIVE_INFINITY;
  if (precision > PRECISION_MAX_M) return { ok: false, motivo: 'IMPRECISA', aproximada: coordenada };
  return {
    ok: true,
    ubicacion: { coordenada, precisionM: Math.round(precision), manual: false, tomadaEn: lectura.timestamp },
  };
}

/**
 * @description Pide permiso (si falta) y devuelve una ubicación fresca y precisa, o el motivo del rechazo.
 */
export async function obtenerUbicacionValidada(): Promise<ResultadoUbicacion> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== Location.PermissionStatus.GRANTED) return { ok: false, motivo: 'SIN_PERMISO' };
  if (!(await Location.hasServicesEnabledAsync())) return { ok: false, motivo: 'GPS_APAGADO' };

  // Una lectura reciente del sistema evita esperar al GPS (≤ 2 min y ≤ 100 m).
  const reciente = await Location.getLastKnownPositionAsync({
    maxAge: FRESCURA_MAX_MS,
    requiredAccuracy: PRECISION_MAX_M,
  }).catch(() => null);
  if (reciente) {
    const resultado = evaluar(reciente);
    if (resultado.ok || resultado.motivo === 'SIMULADA') return resultado;
  }

  const actual = await conLimite(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null),
    ESPERA_GPS_MS,
  );
  if (!actual) return { ok: false, motivo: 'SIN_SENAL' };
  return evaluar(actual);
}

/**
 * @description Indica si una ubicación ya validada sigue fresca (≤ 2 min) para reutilizarla sin pedir otra.
 */
export function sigueFresca(ubicacion: UbicacionValidada | null, ahora = Date.now()): boolean {
  return ubicacion !== null && ahora - ubicacion.tomadaEn <= FRESCURA_MAX_MS;
}
