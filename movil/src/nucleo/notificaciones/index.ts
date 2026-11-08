// Ruta: src/nucleo/notificaciones/index.ts
// Notificaciones (RF08, RF23, README 9.1). Uso desde un módulo:
//   registrarManejadorNotificaciones('favores', { alPulsar: (c) => ... });
//   mostrarNotificacion({ titulo, cuerpo, canal: 'emergencias', pantallaCompleta: true });
// El backend envía con notificar(uids, carga) (api-mock/src/nucleo/notificar.ts).
export { CANALES, crearCanales } from './canales';
export { darDeBajaDispositivo, registrarDispositivo } from './dispositivo';
export { registrarManejadorNotificaciones } from './manejadores';
export { mostrarNotificacion, quitarNotificacion, type OpcionesMostrar } from './mostrar';
export {
  abrirAjustesNotificaciones,
  leerPermisoNotificaciones,
  pedirPermisoNotificaciones,
  usePermisoNotificaciones,
} from './permiso';
export { ProveedorNotificaciones } from './ProveedorNotificaciones';
export { sondearAhora } from './sondeo';
export type {
  CargaNotificacion,
  ContextoRecepcion,
  EstadoPermiso,
  IdCanal,
  ManejadorNotificaciones,
} from './tipos';
