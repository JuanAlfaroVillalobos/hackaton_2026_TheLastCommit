// Ruta: src/nucleo/bandeja-salida/index.ts
// Bandeja de salida (RF41, RN-20). Uso desde el servicio de un módulo:
//   const r = await enviarAccion({ tipo: 'favores.aceptar', ruta: `/favores/${id}/aceptar`, descripcion: 'Aceptar la necesidad de Rosa' });
//   if (r.estado === 'enviada') usar r.datos; si no, mostrar «Se enviará cuando vuelva la señal».
export {
  alResolverAccion,
  descartarAccion,
  enviarAccion,
  registrarTransporteSms,
  sincronizarBandeja,
} from './bandeja';
export { ProveedorBandeja } from './ProveedorBandeja';
export type {
  AccionGuardada,
  AlResolver,
  EstadoAccion,
  MetodoAccion,
  ResultadoAccion,
  SolicitudAccion,
  TransporteSms,
} from './tipos';
export { useBandeja, usePendientesBandeja } from './useBandeja';
