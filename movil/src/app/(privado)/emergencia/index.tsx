// Ruta: src/app/(privado)/emergencia/index.tsx (fuera de las pestañas, README 9.5)
// Archivo delgado: solo importa la pantalla del módulo.
import { MapaEmergenciaPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function EmergenciaRuta() {
  const router = useRouter();
  return (
    <MapaEmergenciaPantalla
      onVolver={() => router.back()}
      onReportar={() => router.push("/emergencia/reportar")}
      onTablero={() => router.push("/emergencia/tablero")}
      onRecursos={() => router.push("/emergencia/recursos")}
      onDirectorio={() => router.push("/emergencia/directorio")}
    />
  );
}