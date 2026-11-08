// Ruta: src/compartido/hooks/useCalle.ts
// Calle donde está el vecino según su ubicación (geocodificación inversa de expo-location).
// Se muestra en el encabezado en lugar del barrio. Si no se puede leer (sin internet, sin servicio de
// direcciones), devuelve null y el encabezado conserva el barrio.
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

type Coordenada = { lat: number; lng: number };

/** Evita volver a consultar la misma ubicación (~11 m) mientras la app está abierta. */
const cache = new Map<string, string | null>();
const claveDe = ({ lat, lng }: Coordenada) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

/** Códigos tipo «3FJ8+2X» que algunos servicios devuelven como nombre. */
const CODIGO_PLUS = /^[A-Z0-9]{4,8}\+[A-Z0-9]*/;

/**
 * @description «Calle número, Distrito». Sin calle usa el distrito; sin nada devuelve null.
 */
export function formatearCalle(direccion: Location.LocationGeocodedAddress): string | null {
  const calle = direccion.street?.trim() || null;
  const numero = direccion.streetNumber?.trim() || null;
  const nombre = direccion.name?.trim() || null;
  const distrito = direccion.district?.trim() || direccion.subregion?.trim() || null;

  const via = calle ? (numero ? `${calle} ${numero}` : calle) : nombre && !CODIGO_PLUS.test(nombre) ? nombre : null;
  if (via && distrito && !via.includes(distrito)) return `${via}, ${distrito}`;
  return via ?? distrito;
}

/**
 * @description Calle de la ubicación dada, o null mientras carga o si no se pudo leer.
 */
export function useCalle(ubicacion: Coordenada | null | undefined): string | null {
  const lat = ubicacion?.lat;
  const lng = ubicacion?.lng;
  const [calle, setCalle] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setCalle(null);
      return;
    }
    const clave = claveDe({ lat, lng });
    if (cache.has(clave)) {
      setCalle(cache.get(clave) ?? null);
      return;
    }
    let vigente = true;
    Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      .then((resultado) => {
        const texto = resultado[0] ? formatearCalle(resultado[0]) : null;
        cache.set(clave, texto);
        if (vigente) setCalle(texto);
      })
      .catch(() => {
        if (vigente) setCalle(null);
      });
    return () => {
      vigente = false;
    };
  }, [lat, lng]);

  return calle;
}

const REFRESCO_POSICION_MS = 30_000;

/**
 * @description Calle donde está el teléfono ahora (GPS en vivo si el permiso de ubicación está dado).
 * Si no hay permiso o aún no hay posición, usa la ubicación de respaldo (la del perfil).
 */
export function useCalleActual(respaldo: Coordenada | null | undefined): string | null {
  const [posicion, setPosicion] = useState<Coordenada | null>(null);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      try {
        const permiso = await Location.getForegroundPermissionsAsync();
        if (!permiso.granted) return;
        const p =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (vigente && p) setPosicion({ lat: p.coords.latitude, lng: p.coords.longitude });
      } catch {
        // sin GPS o sin permiso: se queda la ubicación de respaldo
      }
    };
    void leer();
    const intervalo = setInterval(() => void leer(), REFRESCO_POSICION_MS);
    const suscripcion = AppState.addEventListener("change", (estado) => estado === "active" && void leer());
    return () => {
      vigente = false;
      clearInterval(intervalo);
      suscripcion.remove();
    };
  }, []);

  return useCalle(posicion ?? respaldo);
}