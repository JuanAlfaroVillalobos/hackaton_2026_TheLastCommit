// Ruta: src/app/(privado)/(pestanas)/_layout.tsx
// 4 pestañas (README, sección 7): Inicio, Servicios, Favores, Perfil. Cada pestaña es una carpeta con
// su propio Stack, para que sus pantallas internas (p. ej. P05–P09 en Favores) no oculten la barra.
import { useTema } from "@/compartido/tema";
import { BarraPestanas, type PestanaConfig } from "@/compartido/ui";
import { Tabs } from "expo-router/js-tabs";

const PESTANAS: Record<string, PestanaConfig> = {
  inicio: { titulo: "Inicio", icono: "home" },
  servicios: { titulo: "Servicios", icono: "build" },
  favores: { titulo: "Favores", icono: "volunteer_activism" },
  perfil: { titulo: "Perfil", icono: "person" },
};

export default function LayoutPestanas() {
  const { colores } = useTema();
  return (
    <Tabs
      tabBar={(props) => <BarraPestanas {...props} pestanas={PESTANAS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colores.fondo } }}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="servicios" />
      <Tabs.Screen name="favores" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
