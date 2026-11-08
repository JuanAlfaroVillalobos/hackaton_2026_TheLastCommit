// Ruta: src/modulos/favores/tipos.ts
// Tipos del módulo favores. Cuando exista `compartido/src/modelos` (Persona C), este archivo los re-exporta.
// Fechas en milisegundos (Date.now()) para no depender de Firebase en las simulaciones.
import type { OficioId } from "@/compartido/constantes/oficios";
import type { Coordenada } from "@/compartido/utilidades/geo";

/**
 * Datos del vecino que necesita P04. `uid` y `nombre` salen de la sesión (nucleo/sesion);
 * el resto, de `usuarios/{uid}` cuando exista ese listener (hoy, de simulaciones/).
 */
export type VecinoActual = {
  uid: string;
  nombre: string;
  /** No está en el modelo de la sección 5.4: pendiente de definir con A. */
  barrio: string | null;
  oficios: OficioId[];
  /** Puntero de RN-04: lo escriben solo las funciones. */
  necesidadActivaId: string | null;
  servicioActivoId: string | null;
  /** Última ubicación conocida (centro del muro, RF09). */
  ubicacion: Coordenada | null;
};

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
  autorId: string;
  solicitanteId: string | null;
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
  inicioServicio: number | null;
  finServicio: number | null;
  finSolicitadoPor: string | null;
  bloques: number | null;
  devolucionEn: number | null;
  devolucionRegistradaEn: number | null;
  retrasoAvisadoEn: number | null;
  expiraEn: number;
  creadoEn: number;
};

export type PerfilPublicoFavor = {
  uid: string | null;
  nombre: string;
  fotoUrl: string | null;
  horasAyudadas: number;
  horasSolicitadas: number;
  promedio: number | null;
  numCalificaciones: number;
  estadoIdentidad: "NO_ENVIADA" | "PENDIENTE" | "VERIFICADA" | "RECHAZADA";
};

/** Publicación con los perfiles públicos necesarios para el detalle (RF11). */
export type PublicacionConAutor = Publicacion & {
  autorNombre: string;
  prestadorNombre: string | null;
  perfilAutor?: PerfilPublicoFavor;
  perfilSolicitante?: PerfilPublicoFavor;
  perfilPrestador?: PerfilPublicoFavor;
  ubicacionSolicitanteExacta?: Coordenada;
  ubicacionPrestadorEnVivo?: Coordenada & { actualizadoEn: number };
  misCalificaciones?: Calificacion[];
};

export type Calificacion = {
  id: string;
  publicacionId: string;
  autorUid: string;
  calificadoId: string;
  estrellas: number;
  creadoEn: number;
};

export type NotificacionFavor = {
  id: string;
  uid: string;
  publicacionId: string;
  tipo: "ACEPTADA" | "LLEGADA" | "FIN_SOLICITADO" | "CANCELADA" | "EXPIRADA" | "RETRASO" | "FINALIZADA";
  mensaje: string;
  leida: boolean;
  creadaEn: number;
};

/** Elemento ya calculado para pintar una tarjeta del muro. */
export type ElementoMuro = PublicacionConAutor & {
  distanciaM: number;
  coincideConOficio: boolean;
};
