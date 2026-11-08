// Ruta: src/modulos/emergencia/index.ts
// API PÚBLICA del módulo emergencia (RF20–RF25).
export { BotonSos } from "./componentes/BotonSos";
export { ProveedorEmergencia, RUTA_MAPA } from "./componentes/ProveedorEmergencia";
export {
  hayEmergenciaActiva,
  refrescarEmergencia,
  useEmergencia,
  useEmergenciaStore,
  useVersionEmergencia,
} from "./estado";
export { RUTA_ALERTA } from "./notificaciones";
export { AlertaEmergenciaPantalla } from "./pantallas/AlertaEmergenciaPantalla";
export type { Emergencia, EstadoEmergencia, EstadoVecinoEmergencia, VecinoEnEmergencia } from "./tipos";
