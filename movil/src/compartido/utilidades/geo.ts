// Ruta: src/compartido/utilidades/geo.ts
// Cercanía con geohash (README, sección 5.4). El documento público de una necesidad guarda solo un
// geohash de precisión 7 (~150 m, RN-14): la distancia se calcula al centro de esa celda.
import { distanceBetween } from "geofire-common";

export type Coordenada = { lat: number; lng: number };

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Centro de la celda de un geohash. */
export function centroGeohash(geohash: string): Coordenada {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let esLng = true;
  for (const caracter of geohash.toLowerCase()) {
    const valor = BASE32.indexOf(caracter);
    if (valor < 0) throw new Error(`Geohash no válido: ${geohash}`);
    for (let bit = 4; bit >= 0; bit--) {
      const uno = (valor >> bit) & 1;
      if (esLng) {
        const medio = (lngMin + lngMax) / 2;
        if (uno) lngMin = medio;
        else lngMax = medio;
      } else {
        const medio = (latMin + latMax) / 2;
        if (uno) latMin = medio;
        else latMax = medio;
      }
      esLng = !esLng;
    }
  }
  return { lat: (latMin + latMax) / 2, lng: (lngMin + lngMax) / 2 };
}

/** Distancia en metros entre dos puntos. */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  return distanceBetween([a.lat, a.lng], [b.lat, b.lng]) * 1000;
}
