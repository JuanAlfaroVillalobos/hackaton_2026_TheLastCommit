// Ruta: src/app/(privado)/emergencia/directorio.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { DirectorioEmergenciaPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function DirectorioEmergenciaRuta() {
  const router = useRouter();
  return (
    <DirectorioEmergenciaPantalla
      onVolver={() => router.back()}
      onProponer={() => router.push("/emergencia/proponer-ficha")}
    />
  );
}
