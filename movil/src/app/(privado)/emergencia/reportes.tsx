// Ruta: src/app/(privado)/emergencia/reportes.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { ReportesPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function ReportesRuta() {
  const router = useRouter();
  return (
    <ReportesPantalla
      onVolver={() => router.back()}
      onNuevo={() => router.push("/emergencia/reportar")}
    />
  );
}
