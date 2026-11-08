// Ruta: src/modulos/identidad/reglas.ts
// Estados y reglas de la verificación de identidad (RF36, RN-18). Dueño: Persona A (identidad).
import { almacen } from '../../datos/almacen.js';
import type { Usuario } from '../../datos/tipos.js';
import { ErrorHttp } from '../../nucleo/errores.js';

export type EstadoIdentidad = 'NO_ENVIADA' | 'PENDIENTE' | 'VERIFICADA' | 'RECHAZADA';

/**
 * Validadores (equivale al custom claim `validador` de Firebase Auth). Por correo, separados por coma.
 * En la demo, Ana revisa las identidades de las cuentas nuevas.
 */
const VALIDADORES = new Set(
  (process.env.VALIDADORES ?? 'ana@vecinos.pe')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean),
);

export const esValidador = (usuario: Pick<Usuario, 'correo'>) => VALIDADORES.has(usuario.correo.toLowerCase());

export const estadoDe = (usuario: Usuario | null): EstadoIdentidad => usuario?.identidad?.estado ?? 'NO_ENVIADA';

/**
 * RN-18: para publicar en el directorio o la bolsa, o para aceptar una necesidad u oferta, la identidad
 * debe estar al menos enviada. Pedir ayuda y la emergencia nunca lo exigen.
 * Uso en una ruta: `await exigirIdentidadEnviada(res.locals.uid);`
 */
export async function exigirIdentidadEnviada(uid: string): Promise<void> {
  const estado = estadoDe(await almacen.usuarios.obtener(uid));
  if (estado === 'NO_ENVIADA' || estado === 'RECHAZADA') {
    throw new ErrorHttp(
      403,
      'IDENTIDAD_REQUERIDA',
      estado === 'RECHAZADA'
        ? 'Tu verificación fue rechazada. Vuelve a enviarla desde tu perfil para continuar.'
        : 'Verifica tu identidad desde tu perfil para continuar. Solo toma un minuto.',
    );
  }
}
