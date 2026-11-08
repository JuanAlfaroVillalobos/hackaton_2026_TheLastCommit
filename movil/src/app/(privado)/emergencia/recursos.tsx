// Ruta: src/app/(privado)/emergencia/recursos.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { RecursosPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function RecursosRuta() {
  const router = useRouter();
  return (
    <RecursosPantalla
      onVolver={() => router.back()}
      onPublicar={() => router.push("/emergencia/publicar-recurso")}
    />
  );
}
