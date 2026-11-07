// Ruta: src/modulos/favores/servicios/publicacionesServicio.ts
// Acceso a datos del muro (RF09, RF35). Hoy trabaja en memoria sobre simulaciones/.
// Con Firestore: `necesidades` con rangos de geohashQueryBounds(centro, radio) + where('estado','==','PUBLICADA')
// y onSnapshot por rango (índice `necesidades (estado, geohash)`), uniendo el nombre desde `perfiles/{uid}`.
// Las firmas no cambian, así que los hooks y las pantallas tampoco.
import type { Coordenada } from "@/compartido/utilidades/geo";
import { publicacionesMock } from "@/simulaciones";
import type { PublicacionConAutor } from "../tipos";

type DejarDeEscuchar = () => void;

let publicaciones: PublicacionConAutor[] = [...publicacionesMock];
const oyentes = new Set<() => void>();

/**
 * Equivale a los onSnapshot del muro: llama a `alCambiar` con la lista cruda de la zona.
 * El filtro exacto por distancia, vencimiento y autor se hace en reglas.prepararMuro (RF09).
 */
export function suscribirMuro(
  _centro: Coordenada,
  _radioM: number,
  alCambiar: (lista: PublicacionConAutor[]) => void,
): DejarDeEscuchar {
  const emitir = () => alCambiar([...publicaciones]);
  oyentes.add(emitir);
  emitir();
  return () => {
    oyentes.delete(emitir);
  };
}

/** Escucha una publicación por id (la necesidad activa propia, RN-04). */
export function suscribirPublicacion(
  id: string,
  alCambiar: (publicacion: PublicacionConAutor | null) => void,
): DejarDeEscuchar {
  const emitir = () => alCambiar(publicaciones.find((p) => p.id === id) ?? null);
  oyentes.add(emitir);
  emitir();
  return () => {
    oyentes.delete(emitir);
  };
}

/** Deslizar para refrescar (RF09). Con Firestore basta con volver a leer del servidor. */
export async function refrescarMuro(): Promise<void> {
  publicaciones = [...publicaciones];
  oyentes.forEach((f) => f());
}
