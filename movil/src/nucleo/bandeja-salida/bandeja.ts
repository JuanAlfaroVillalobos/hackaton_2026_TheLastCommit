// Ruta: src/nucleo/bandeja-salida/bandeja.ts
// enviarAccion(): con internet → API; sin internet → SMS (si el tipo tiene transporte) y cola.
// Al volver la señal la cola se vacía en orden; cada acción lleva su idAccion para que la API no
// la procese dos veces aunque también haya llegado por SMS (RN-20).
import { api, ErrorApi, esErrorDeRed } from '@/nucleo/api';
import { estaEnLinea } from '@/nucleo/red/conexion';
import { randomUUID } from 'expo-crypto';
import { Alert } from 'react-native';
import { actualizarAccion, cargarCola, encolar, leerCola, quitarDeCola } from './almacen';
import type { AccionGuardada, AlResolver, ResultadoAccion, SolicitudAccion, TransporteSms } from './tipos';

const transportesSms = new Map<string, TransporteSms>();
const resolutores = new Map<string, AlResolver>();
let uidActual: string | null = null;
let sincronizando: Promise<void> | null = null;

/**
 * @description Persona D registra aquí el envío por SMS de un tipo de acción (p. ej. «emergencia.alerta»).
 */
export function registrarTransporteSms(tipo: string, transporte: TransporteSms): () => void {
  transportesSms.set(tipo, transporte);
  return () => {
    if (transportesSms.get(tipo) === transporte) transportesSms.delete(tipo);
  };
}

/**
 * @description Un módulo recibe el resultado de sus acciones guardadas cuando se envían al volver la señal (p. ej. para refrescar su lista).
 */
export function alResolverAccion(tipo: string, alResolver: AlResolver): () => void {
  resolutores.set(tipo, alResolver);
  return () => {
    if (resolutores.get(tipo) === alResolver) resolutores.delete(tipo);
  };
}

/**
 * @description Lo llama ProveedorBandeja con la sesión: cada vecino solo envía sus propias acciones.
 */
export function fijarUsuarioBandeja(uid: string | null): void {
  uidActual = uid;
}

/**
 * @description Envía una escritura a la API pasando por la bandeja. Los errores de la API (p. ej. 409) se lanzan como ErrorApi para que la pantalla los muestre.
 */
export async function enviarAccion<T = unknown>(solicitud: SolicitudAccion): Promise<ResultadoAccion<T>> {
  const idAccion = solicitud.idAccion ?? randomUUID();
  const metodo = solicitud.metodo ?? 'POST';

  if (await estaEnLinea()) {
    // Respeta el orden: primero lo que quedó pendiente.
    await sincronizarBandeja();
    try {
      const datos = await api<T>(solicitud.ruta, { metodo, cuerpo: solicitud.cuerpo, idAccion });
      return { estado: 'enviada', idAccion, datos };
    } catch (error) {
      // Sin conexión o sin respuesta a tiempo: se guarda; la API ignora la copia si ya llegó (RN-20).
      if (!esErrorDeRed(error)) throw error;
    }
  }

  const accion: AccionGuardada = {
    idAccion,
    uid: uidActual ?? 'anonimo',
    tipo: solicitud.tipo,
    ruta: solicitud.ruta,
    metodo,
    cuerpo: solicitud.cuerpo,
    descripcion: solicitud.descripcion,
    estado: 'pendiente',
    creadaEn: Date.now(),
    intentos: 0,
  };

  const sms = transportesSms.get(solicitud.tipo);
  if (sms && (await sms(accion).catch(() => false))) accion.estado = 'enviada-sms';

  await encolar(accion);
  return { estado: accion.estado, idAccion };
}

/**
 * @description Vacía la cola en orden. Para al primer error de red o del servidor y reintenta en la siguiente llamada. Una sola ejecución a la vez.
 */
export function sincronizarBandeja(): Promise<void> {
  sincronizando ??= vaciar().finally(() => {
    sincronizando = null;
  });
  return sincronizando;
}

async function vaciar(): Promise<void> {
  await cargarCola();
  const uid = uidActual;
  if (!uid) return;
  const fallos: string[] = [];

  for (const accion of leerCola().filter((a) => a.uid === uid)) {
    try {
      const datos = await api(accion.ruta, { metodo: accion.metodo, cuerpo: accion.cuerpo, idAccion: accion.idAccion });
      await quitarDeCola(accion.idAccion);
      resolutores.get(accion.tipo)?.(accion, { ok: true, datos });
    } catch (error) {
      const e = error instanceof ErrorApi ? error : new ErrorApi(0, 'SIN_CONEXION', 'Sin conexión.');
      // Sin red, sesión vencida o servidor caído: se reintenta después, sin perder el orden.
      if (esErrorDeRed(e) || e.estado === 401 || e.estado >= 500) {
        await actualizarAccion(accion.idAccion, { intentos: accion.intentos + 1 });
        break;
      }
      // La API la rechazó (p. ej. «Otro vecino ya aceptó esta necesidad»): se quita y se avisa.
      await quitarDeCola(accion.idAccion);
      fallos.push(`• ${accion.descripcion}: ${e.message}`);
      resolutores.get(accion.tipo)?.(accion, { ok: false, mensaje: e.message });
    }
  }

  if (fallos.length) {
    Alert.alert(
      fallos.length === 1 ? 'Una acción no se pudo enviar' : `${fallos.length} acciones no se pudieron enviar`,
      fallos.join('\n'),
    );
  }
}

/**
 * @description Quita una acción pendiente sin enviarla (el vecino se arrepintió).
 */
export async function descartarAccion(idAccion: string): Promise<void> {
  await quitarDeCola(idAccion);
}
