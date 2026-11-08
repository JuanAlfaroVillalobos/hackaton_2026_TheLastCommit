// Ruta: src/app/(privado)/emergencia/reportar.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { ReportarVulnerabilidadPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function ReportarRuta() {
  const router = useRouter();
  return (
    <ReportarVulnerabilidadPantalla
      onVolver={() => router.back()}
      onEnviado={() => router.replace("/emergencia/reportes")}
    />
  );
}
