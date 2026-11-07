// Ruta: src/app/(privado)/(pestanas)/inicio/_layout.tsx
// Stack propio de la pestaña: sus pantallas internas se apilan sin ocultar la barra de pestañas.
import { useTema } from "@/compartido/tema";
import { Stack } from "expo-router";

export default function Layout() {
  const { colores } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }} />;
}
