// Ruta: src/modulos/cuentas/servicios/cuenta.ts
// Gestión de la cuenta con sesión iniciada: cambiar la clave y eliminar la cuenta (derecho de cancelación).
import { api } from '@/nucleo/api';

/**
 * @description Cambia la clave. La API cierra las sesiones de otros teléfonos; con Firebase Auth devuelve tokens nuevos para este.
 */
export const cambiarClave = (actual: string, nueva: string) =>
  api<{ token?: string; renovacion?: string | null }>('/auth/cambiar-clave', { metodo: 'POST', cuerpo: { actual, nueva } });

/**
 * @description Elimina la cuenta, la foto y los datos de identidad. Después hay que cerrar la sesión local.
 */
export const eliminarCuenta = (clave: string) =>
  api<void>('/vecinos/yo/eliminar', { metodo: 'POST', cuerpo: { clave, confirmacion: 'ELIMINAR' } });
