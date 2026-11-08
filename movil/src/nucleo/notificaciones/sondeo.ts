// Ruta: src/nucleo/notificaciones/sondeo.ts
// Respaldo sin FCM: mientras la app está abierta, pregunta a la API por notificaciones nuevas.
// Así la demo funciona aunque el servidor no tenga credenciales de FCM.
import { api } from '@/nucleo/api';
import { AppState } from 'react-native';
import { aCarga, despachar } from './manejadores';

export const INTERVALO_SONDEO_MS = 15_000;

let consultaActiva: (() => Promise<void>) | null = null;

/**
 * @description Fuerza una consulta inmediata del buzón (p. ej. justo después de enviar una prueba).
 */
export function sondearAhora(): void {
  void consultaActiva?.();
}

interface RespuestaBuzon {
  notificaciones: Record<string, unknown>[];
  /** Marca de tiempo del servidor para la siguiente consulta. */
  hasta: number;
}

/**
 * @description Consulta el buzón cada 15 s con la app en primer plano y despacha lo nuevo. Devuelve la función para detenerlo.
 */
export function iniciarSondeo(): () => void {
  let desde = Date.now();
  let temporizador: ReturnType<typeof setInterval> | null = null;
  let ocupado = false;

  const consultar = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const r = await api<RespuestaBuzon>(`/vecinos/yo/notificaciones?desde=${desde}`);
      desde = r.hasta;
      for (const datos of r.notificaciones) {
        const carga = aCarga(datos);
        if (carga) await despachar(carga, { enPrimerPlano: true, origen: 'sondeo' });
      }
    } catch {
      // sin red o sin sesión: se reintenta en la siguiente vuelta
    } finally {
      ocupado = false;
    }
  };

  const arrancar = () => {
    if (temporizador) return;
    void consultar();
    temporizador = setInterval(() => void consultar(), INTERVALO_SONDEO_MS);
  };
  const parar = () => {
    if (temporizador) clearInterval(temporizador);
    temporizador = null;
  };

  consultaActiva = consultar;
  if (AppState.currentState === 'active') arrancar();
  const suscripcion = AppState.addEventListener('change', (s) => (s === 'active' ? arrancar() : parar()));

  return () => {
    parar();
    suscripcion.remove();
    if (consultaActiva === consultar) consultaActiva = null;
  };
}
