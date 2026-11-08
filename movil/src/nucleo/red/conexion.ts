// Ruta: src/nucleo/red/conexion.ts
// Conexión fuera de React (para la bandeja de salida y servicios). Sin internet = sin red o sin acceso a internet.
import { ESCENARIO_DEMO } from '@/simulaciones';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

const enLinea = (estado: NetInfoState) => estado.isConnected !== false && estado.isInternetReachable !== false;

/**
 * @description true si hay internet ahora mismo. Si NetInfo no responde, asume que sí y deja que la API decida.
 */
export async function estaEnLinea(): Promise<boolean> {
  if (ESCENARIO_DEMO === 'sin-conexion') return false;
  try {
    return enLinea(await NetInfo.fetch());
  } catch {
    return true;
  }
}

/**
 * @description Llama a `alVolver` cada vez que la conexión pasa de «sin internet» a «con internet». Devuelve la función para dejar de escuchar.
 */
export function alVolverLaRed(alVolver: () => void): () => void {
  let anterior: boolean | null = null;
  return NetInfo.addEventListener((estado) => {
    const ahora = enLinea(estado);
    if (ahora && anterior === false) alVolver();
    anterior = ahora;
  });
}
