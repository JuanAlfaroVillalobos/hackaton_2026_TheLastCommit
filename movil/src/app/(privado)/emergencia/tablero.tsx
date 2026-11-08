// Ruta: src/app/(privado)/emergencia/tablero.tsx
// Archivo delgado: solo importa la pantalla del módulo.
// Prueba: /emergencia/tablero?emergencia=1 fuerza el modo emergencia. Después lo decide el módulo emergencia.
import { TableroHumanitarioPantalla } from "@/modulos/ayuda-humanitaria";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function TableroRuta() {
  const router = useRouter();
  const { emergencia } = useLocalSearchParams<{ emergencia?: string }>();
  return (
    <TableroHumanitarioPantalla
      emergencia={emergencia === "1"}
      onVolver={() => router.back()}
      onReportar={() => router.push("/emergencia/reportar")}
      onPublicarRecurso={() => router.push("/emergencia/publicar-recurso")}
      onDirectorio={() => router.push("/emergencia/directorio")}
    />
  );
}
