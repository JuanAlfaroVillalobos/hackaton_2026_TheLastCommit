// Ruta: src/modulos/ayuda-humanitaria/sms/index.ts
// Tipos SMS de ayuda humanitaria (E7). Persona D registra estos tipos en `compartido/src/sms` (D4).
import {
    codificarR,
    codificarV,
    codificarVR,
    decodificarR,
    decodificarV,
    decodificarVR,
} from "./ayudaSms";

export * from "./ayudaSms";
export * from "./convertir";
export { registrarTransporteSms, type ResultadoSms, type TransporteSms } from "./transporte";

/** Descripción de los tipos del módulo para el registro de D. */
export const TIPOS_SMS_AYUDA = {
  V: { direccion: "subida", codificar: codificarV, decodificar: decodificarV },
  R: { direccion: "subida", codificar: codificarR, decodificar: decodificarR },
  VR: { direccion: "bajada", codificar: codificarVR, decodificar: decodificarVR },
} as const;