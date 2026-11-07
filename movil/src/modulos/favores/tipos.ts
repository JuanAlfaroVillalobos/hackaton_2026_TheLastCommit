// Ruta: src/modulos/favores/tipos.ts
// Tipos del módulo favores. Cuando exista `compartido/src/modelos` (Persona C), este archivo los re-exporta.
// Fechas en milisegundos (Date.now()) para no depender de Firebase en las simulaciones.
import type { OficioId } from "@/compartido/constantes/oficios";

/** Estados de la necesidad (README, sección 5.1). */
export type EstadoNecesidad =
  | "PUBLICADA"
  | "ACEPTADA"
  | "EN_SITIO"
  | "EN_CURSO"
  | "FIN_SOLICITADO"
  | "FINALIZADO"
  | "CANCELADA"
  | "EXPIRADA";

/** RF35: el muro mezcla necesidades («Necesito») y ofertas («Ofrezco»). */
export type TipoPublicacion = "NECESITO" | "OFREZCO";

/** RF35: tipos del muro, usados también por el filtro de P04. */
export type CategoriaPublicacion = "FAVOR_OFICIO" | "PRESTAMO" | "DONACION" | "INTERCAMBIO" | "MOVILIDAD";

export type FiltroMuro = "TODO" | CategoriaPublicacion;

/**
 * Documento `necesidades/{id}` (sección 5.4).
 * Campos nuevos respecto a la 5.4, opcionales en datos viejos: `tipo` (por defecto NECESITO),
 * `categoria` (por defecto FAVOR_OFICIO) y `devolucionEn` (solo préstamos, RF35).
 */
export type Publicacion = {
  id: string;
  solicitanteId: string;
  prestadorId: string | null;
  tipo: TipoPublicacion;
  categoria: CategoriaPublicacion;
  oficioId: OficioId | null;
  descripcion: string;
  /** Precisión 7 (~150 m). La ubicación exacta va en `privado/ubicacion` (RN-14). */
  geohash: string;
  estado: EstadoNecesidad;
  etaMinutos: number | null;
  llegadaEstimada: number | null;
  devolucionEn: number | null;
  expiraEn: number;
  creadoEn: number;
};

/** Publicación con los nombres leídos de `perfiles/{uid}`. */
export type PublicacionConAutor = Publicacion & {
  autorNombre: string;
  prestadorNombre: string | null;
};

/** Elemento ya calculado para pintar una tarjeta del muro. */
export type ElementoMuro = PublicacionConAutor & {
  distanciaM: number;
  coincideConOficio: boolean;
};
