// Ruta: src/modulos/identidad/servicios/identidadServicio.ts
// Verificación de identidad contra la API (RF36). El envío no pasa por la bandeja de salida: las fotos
// solo se mandan con internet (como la foto de RF38), para que el vecino sepa al instante si hay un error.
import { api, cabecerasSesion, urlApi } from '@/nucleo/api';
import type { DatosVerificacion, ResumenIdentidad, SolicitudPendiente } from '../tipos';

export const obtenerMiIdentidad = () => api<ResumenIdentidad>('/identidad/yo');

export const enviarIdentidad = (datos: DatosVerificacion) =>
  api<ResumenIdentidad>('/identidad/yo', { metodo: 'POST', cuerpo: datos, tiempoMs: 60_000 });

export const listarPendientes = () => api<{ pendientes: SolicitudPendiente[] }>('/identidad/pendientes');

export const revisarIdentidad = (uid: string, decision: 'aprobar' | 'rechazar', motivo?: string) =>
  api<{ estado: string }>(`/identidad/${uid}/revisar`, { metodo: 'POST', cuerpo: { decision, motivo } });

/**
 * @description Fuente para <Image> de una foto privada (DNI o selfie), con la sesión en la cabecera.
 */
export const fuenteFotoPrivada = (uid: string, tipo: 'dni' | 'selfie') => ({
  uri: urlApi(`/identidad/${uid}/fotos/${tipo}`),
  headers: cabecerasSesion(),
});
