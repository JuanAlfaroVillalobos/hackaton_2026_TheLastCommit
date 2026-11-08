// Ruta: src/app/(privado)/emergencia/proponer-ficha.tsx
// Archivo delgado: solo importa la pantalla del módulo.
import { ProponerFichaPantalla } from "@/modulos/ayuda-humanitaria";
import { useRouter } from "expo-router";

export default function ProponerFichaRuta() {
  const router = useRouter();
  return <ProponerFichaPantalla onVolver={() => router.back()} onEnviada={() => router.back()} />;
}
