// Ruta: src/nucleo/ubicacion/informar.ts
// Envía la última ubicación validada al perfil (`usuarios/{uid}.ubicacion`, README 5.4). La usan el
// muro (RF09), el Visto Bueno a ≤ 2 km (RN-17) y la bajada selectiva de SMS (sección 10.4).
import { api } from '@/nucleo/api';
import type { UbicacionValidada } from './validar';

/**
 * @description Guarda la ubicación en el perfil; sin conexión o sin sesión no falla (es mejor esfuerzo).
 */
export async function informarUbicacion(ubicacion: UbicacionValidada, servicioId?: string): Promise<void> {
  await api('/vecinos/yo/ubicacion', {
    metodo: 'POST',
    cuerpo: {
      lat: ubicacion.coordenada.lat,
      lng: ubicacion.coordenada.lng,
      precisionM: ubicacion.precisionM,
      manual: ubicacion.manual,
      tomadaEn: ubicacion.tomadaEn,
      ...(servicioId ? { servicioId } : null),
    },
  }).catch(() => undefined);
}
