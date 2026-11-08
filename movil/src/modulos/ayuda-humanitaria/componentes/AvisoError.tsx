// Ruta: src/modulos/ayuda-humanitaria/componentes/AvisoError.tsx
// Franja que explica por qué no se pudo cargar una lista (p. ej. «Sin conexión»).
import { useTema } from "@/compartido/tema";
import { Text } from "react-native";

export function AvisoError({ mensaje }: { mensaje: string }) {
  const { colores: T } = useTema();
  return (
    <Text
      accessibilityRole="alert"
      style={{ backgroundColor: T.sosFondo, color: T.sos, fontSize: 13, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {mensaje}
    </Text>
  );
}
