// Ruta: src/app/(privado)/emergencia/publicar-recurso.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { PublicarRecursoPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function PublicarRecursoRuta() {
  const router = useRouter();
  return <PublicarRecursoPantalla onVolver={() => router.back()} onPublicado={() => router.back()} />;
}
