// Ruta: src/modulos/cuentas/servicios/disponibilidad.ts
// Revisa en la API si el correo o el teléfono ya tienen cuenta (RN-01), para avisar antes de enviar.
import { api } from '@/nucleo/api';

export type Disponibilidad = 'libre' | 'ocupado' | 'desconocido';

/**
 * @description Consulta un correo o un teléfono (9 dígitos). Sin conexión devuelve «desconocido» y la API lo revisa al registrar.
 */
export async function consultarDisponibilidad(campo: 'correo' | 'telefono', valor: string): Promise<Disponibilidad> {
  try {
    const cuerpo = campo === 'correo' ? { correo: valor } : { telefono: `+51${valor}` };
    const r = await api<{ correoDisponible?: boolean; telefonoDisponible?: boolean }>('/auth/disponibilidad', {
      metodo: 'POST',
      cuerpo,
    });
    const libre = campo === 'correo' ? r.correoDisponible : r.telefonoDisponible;
    return libre === undefined ? 'desconocido' : libre ? 'libre' : 'ocupado';
  } catch {
    return 'desconocido';
  }
}
