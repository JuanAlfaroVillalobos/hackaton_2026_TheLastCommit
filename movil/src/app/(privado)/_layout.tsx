// Ruta: src/app/(privado)/_layout.tsx
// Pantallas con sesión. Encabezado común (README, sección 7): casa + «Vecinos» + barrio y «SOS» (RF20).
// P11 (emergencia) tiene su propia barra superior, por eso oculta este encabezado.
import { useTema } from "@/compartido/tema";
import { Encabezado } from "@/compartido/ui";
import { BotonSos } from "@/modulos/emergencia";
import { useSesion } from "@/nucleo/sesion";
import { Stack } from "expo-router";

function EncabezadoPrivado() {
  const { vecino } = useSesion();
  return <Encabezado barrio={vecino.barrio} derecha={<BotonSos />} />;
}

export default function LayoutPrivado() {
  const { colores } = useTema();
  return (
    <Stack
      screenOptions={{
        header: () => <EncabezadoPrivado />,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="(pestanas)" />
      <Stack.Screen name="emergencia/index" options={{ headerShown: false }} />
    </Stack>
  );
}
