// Ruta: src/nucleo/bandeja-salida/tipos.ts
// Bandeja de salida (RF41): toda escritura a la API pasa por aquí.

export type MetodoAccion = 'POST' | 'PATCH' | 'DELETE';

/** Lo que un servicio pide enviar. */
export interface SolicitudAccion {
  /** «modulo.accion», p. ej. «favores.aceptar». Decide si hay transporte SMS para ella. */
  tipo: string;
  /** Ruta de la API, p. ej. «/favores/nc01/aceptar». */
  ruta: string;
  metodo?: MetodoAccion;
  cuerpo?: unknown;
  /** Texto corto para la lista de pendientes y para avisar fallos: «Aceptar la necesidad de Rosa». */
  descripcion: string;
  /** Id propio si el servicio ya lo generó (p. ej. para el SMS). Si no, se crea uno (RN-20). */
  idAccion?: string;
}

export type EstadoAccion = 'pendiente' | 'enviada-sms';

/** Acción guardada en la bandeja, esperando internet. */
export interface AccionGuardada {
  idAccion: string;
  uid: string;
  tipo: string;
  ruta: string;
  metodo: MetodoAccion;
  cuerpo?: unknown;
  descripcion: string;
  estado: EstadoAccion;
  creadaEn: number;
  intentos: number;
}

export type ResultadoAccion<T> =
  /** Llegó a la API: `datos` es su respuesta. */
  | { estado: 'enviada'; idAccion: string; datos: T }
  /** Sin internet: salió por SMS y además se reenviará por internet al volver la señal (RN-20 evita duplicados). */
  | { estado: 'enviada-sms'; idAccion: string }
  /** Sin internet y sin SMS para este tipo: se envía al volver la señal. */
  | { estado: 'pendiente'; idAccion: string };

/**
 * Transporte SMS de un tipo de acción (lo registra Persona D con su codec, sección 10.4).
 * Devuelve true si el SMS salió.
 */
export type TransporteSms = (accion: AccionGuardada) => Promise<boolean>;

/** Aviso al módulo cuando una acción guardada se resuelve al volver la señal. */
export type AlResolver = (accion: AccionGuardada, resultado: { ok: true; datos: unknown } | { ok: false; mensaje: string }) => void;
