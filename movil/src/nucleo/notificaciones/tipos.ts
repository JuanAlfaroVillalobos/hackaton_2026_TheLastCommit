// Ruta: src/nucleo/notificaciones/tipos.ts
// Contrato de las notificaciones entre el backend (`notificar()`) y la app. FCM solo admite textos en
// `data`, así que todos los valores son string.

export type IdCanal = 'general' | 'emergencias';

/**
 * Carga de una notificación. `modulo` decide quién la maneja (registrarManejadorNotificaciones);
 * si nadie la maneja, se muestra con `titulo` y `cuerpo` en el canal indicado.
 */
export interface CargaNotificacion {
  /** Id único para no mostrarla dos veces si llega por FCM y por sondeo. */
  idNotificacion: string;
  /** Módulo dueño: «favores», «emergencia», «ayuda-humanitaria», «directorio», «trabajos», «cuentas»… */
  modulo: string;
  /** Evento dentro del módulo, p. ej. «necesidad-aceptada» o «alerta». */
  tipo: string;
  titulo?: string;
  cuerpo?: string;
  canal?: IdCanal;
  /** Ruta de Expo Router que se abre al tocarla, p. ej. «/favores/nc01». */
  ruta?: string;
  /** «si» para pedir pantalla completa (solo canal emergencias, RF23). */
  pantallaCompleta?: 'si' | 'no';
  [campo: string]: string | undefined;
}

export interface ContextoRecepcion {
  /** true si la app está abierta y visible. */
  enPrimerPlano: boolean;
  /** Por dónde llegó. */
  origen: 'fcm' | 'sondeo' | 'local';
}

export interface ManejadorNotificaciones {
  /**
   * Se llama al recibirla. Devuelve true si el módulo ya la mostró o la procesó en silencio;
   * false o nada para que nucleo la muestre con el aspecto por defecto.
   */
  alRecibir?: (carga: CargaNotificacion, contexto: ContextoRecepcion) => Promise<boolean | void> | boolean | void;
  /** Se llama al tocar la notificación o uno de sus botones (`accionId`). */
  alPulsar?: (carga: CargaNotificacion, accionId: string | null) => Promise<void> | void;
}

export type EstadoPermiso = 'concedido' | 'denegado';
