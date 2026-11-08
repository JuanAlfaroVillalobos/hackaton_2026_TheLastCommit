// Ruta: src/app/(privado)/emergencia/index.tsx (fuera de las pestañas, README 9.5)
// Archivo delgado: solo importa la pantalla del módulo.
import { MapaEmergenciaPantalla } from "@/modulos/ayuda-humanitaria";
import { useEmergencia } from "@/modulos/emergencia";
import { useRouter } from "expo-router";

export default function EmergenciaRuta() {
  const router = useRouter();
  // Con la zona en emergencia, P11 reemplaza a P04 (RF22): no hay «volver al inicio».
  const { activa } = useEmergencia();
  return (
    <MapaEmergenciaPantalla
      emergencia={activa}
      onVolver={activa ? undefined : () => router.back()}
      onReportar={() => router.push("/emergencia/reportar")}
      onTablero={() => router.push("/emergencia/tablero")}
      onRecursos={() => router.push("/emergencia/recursos")}
      onDirectorio={() => router.push("/emergencia/directorio")}
    />
  );
}