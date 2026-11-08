// Ruta: src/modulos/identidad/tipos.ts
import type { EstadoIdentidad } from '@/nucleo/sesion';

export type { EstadoIdentidad };

/** Lo que el dueño ve de su verificación (GET /identidad/yo). El DNI llega enmascarado. */
export interface ResumenIdentidad {
  estado: EstadoIdentidad;
  dni: string | null;
  nombres: string | null;
  apellidos: string | null;
  enviadaEn: number | null;
  revisadaEn: number | null;
  motivo: string | null;
}

export interface SolicitudPendiente {
  uid: string;
  nombrePerfil: string;
  correo: string;
  dni: string;
  nombres: string;
  apellidos: string;
  enviadaEn: number;
}

export interface DatosVerificacion {
  dni: string;
  nombres: string;
  apellidos: string;
  unSoloApellido: boolean;
  fotoDni: string;
  selfie: string;
}
