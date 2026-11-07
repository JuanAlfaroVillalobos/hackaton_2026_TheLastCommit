// Ruta: src/nucleo/red/useConexion.ts
// Estado de conexión con NetInfo (RNF09, RF26). Sin internet = sin red o sin acceso a internet.
// Para revisar el diseño 04-D sin modo avión: EXPO_PUBLIC_ESCENARIO_P04=sin-conexion.
import { ESCENARIO_DEMO } from "@/simulaciones";
import { useNetInfo } from "@react-native-community/netinfo";

export function useConexion(): { sinConexion: boolean } {
  const { isConnected, isInternetReachable } = useNetInfo();
  if (ESCENARIO_DEMO === "sin-conexion") return { sinConexion: true };
  return { sinConexion: isConnected === false || isInternetReachable === false };
}
