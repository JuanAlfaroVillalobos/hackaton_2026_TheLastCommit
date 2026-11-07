// Ruta: src/app/_layout.tsx
// Layout raíz: proveedores globales (README 9.5). Hoy: zonas seguras y tema.
// Pendiente (Persona A): sesión (redirección a (publico) sin usuario), bandeja de salida y notificaciones.
import { ProveedorTema, useTema } from "@/compartido/tema";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

function Navegacion() {
  const { colores } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }} />;
}

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProveedorTema>
        <Navegacion />
      </ProveedorTema>
    </SafeAreaProvider>
  );
}
