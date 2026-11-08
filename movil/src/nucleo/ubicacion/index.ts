// Ruta: src/nucleo/ubicacion/index.ts
// API pública de ubicación (RF42, RF13). Uso típico en cualquier módulo:
//   const { pedir, buscando } = useUbicacionValidada();
//   const u = await pedir();  if (!u) return;  publicar({ lat: u.coordenada.lat, lng: u.coordenada.lng, manual: u.manual })
export { useUbicacionValidada, type EstadoUbicacion } from './useUbicacionValidada';
export {
  FRESCURA_MAX_MS,
  MENSAJES_UBICACION,
  obtenerUbicacionValidada,
  PRECISION_MAX_M,
  type MotivoRechazo,
  type ResultadoUbicacion,
  type UbicacionValidada,
} from './validar';
export { leerPinInicial, resolverPinManual, RUTA_PIN_MANUAL } from './pinManual';
export { detenerUbicacionEnServicio, iniciarUbicacionEnServicio, TAREA_UBICACION_SERVICIO } from './segundoPlano';
