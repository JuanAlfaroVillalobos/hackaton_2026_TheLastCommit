// Ruta: src/nucleo/notificaciones/manejadores.ts
// Reparto por módulo: cada módulo registra cómo manejar sus notificaciones y nucleo hace el resto
// (mostrar con el aspecto por defecto, no repetir, abrir la ruta al tocar).
import { router } from 'expo-router';
import { mostrarNotificacion } from './mostrar';
import type { CargaNotificacion, ContextoRecepcion, ManejadorNotificaciones } from './tipos';

const manejadores = new Map<string, ManejadorNotificaciones>();
const vistas = new Set<string>();
const MAX_VISTAS = 200;

/**
 * @description Registra el manejador de un módulo. Para que funcione con la app cerrada, regístralo en un archivo que importe `movil/index.ts`.
 */
export function registrarManejadorNotificaciones(modulo: string, manejador: ManejadorNotificaciones): () => void {
  manejadores.set(modulo, manejador);
  return () => {
    if (manejadores.get(modulo) === manejador) manejadores.delete(modulo);
  };
}

/**
 * @description Convierte el `data` de FCM o de la API en una carga válida; null si le faltan campos.
 */
export function aCarga(datos: Record<string, unknown> | undefined): CargaNotificacion | null {
  if (!datos) return null;
  const textos = Object.fromEntries(
    Object.entries(datos).map(([k, v]) => [k, typeof v === 'string' ? v : v == null ? undefined : JSON.stringify(v)]),
  ) as Record<string, string | undefined>;
  if (!textos.idNotificacion || !textos.modulo || !textos.tipo) return null;
  return textos as CargaNotificacion;
}

/**
 * @description Entrega una notificación recibida a su módulo; si nadie la maneja, la muestra. Ignora repetidas.
 */
export async function despachar(carga: CargaNotificacion, contexto: ContextoRecepcion): Promise<void> {
  if (vistas.has(carga.idNotificacion)) return;
  vistas.add(carga.idNotificacion);
  if (vistas.size > MAX_VISTAS) vistas.delete(vistas.values().next().value as string);

  const manejada = await Promise.resolve(manejadores.get(carga.modulo)?.alRecibir?.(carga, contexto)).catch(() => false);
  if (manejada) return;
  if (!carga.titulo) return;

  await mostrarNotificacion({
    titulo: carga.titulo,
    cuerpo: carga.cuerpo,
    canal: carga.canal ?? 'general',
    carga,
    pantallaCompleta: carga.pantallaCompleta === 'si',
  });
}

/**
 * @description Al tocar una notificación o un botón: avisa al módulo y, si trae `ruta`, la abre.
 */
export async function alPulsar(carga: CargaNotificacion, accionId: string | null, abrirRuta = true): Promise<void> {
  await Promise.resolve(manejadores.get(carga.modulo)?.alPulsar?.(carga, accionId)).catch(() => undefined);
  if (abrirRuta && carga.ruta && (accionId === null || accionId === 'default')) {
    try {
      router.push(carga.ruta as never);
    } catch {
      // la navegación aún no está montada (arranque en frío); la ruta se abre al iniciar
    }
  }
}
