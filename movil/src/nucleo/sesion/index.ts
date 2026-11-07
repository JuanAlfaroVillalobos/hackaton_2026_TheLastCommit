// Ruta: src/nucleo/sesion/index.ts
// Usuario actual y su perfil en memoria (README, sección 9.5).
// ADAPTADOR TEMPORAL: lee de simulaciones/. Persona A lo reemplaza por Firebase Auth + listener de
// `usuarios/{uid}`; la firma de useSesion() se mantiene para no tocar las pantallas.
import type { OficioId } from "@/compartido/constantes/oficios";
import type { Coordenada } from "@/compartido/utilidades/geo";
import { vecinoActualMock } from "@/simulaciones";

export type VecinoActual = {
  uid: string;
  nombre: string;
  /** No está en el modelo de la sección 5.4: pendiente de definir (ver reporte de P04). */
  barrio: string | null;
  oficios: OficioId[];
  /** Puntero de RN-04: lo escriben solo las funciones. */
  necesidadActivaId: string | null;
  /** Última ubicación conocida del vecino (centro del muro, RF09). */
  ubicacion: Coordenada | null;
};

export function useSesion(): { vecino: VecinoActual } {
  return { vecino: vecinoActualMock };
}
