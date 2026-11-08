// Ruta: src/app/(privado)/emergencia/alerta.tsx · P12 (RF23, RF24)
// Archivo delgado: solo importa la pantalla del módulo.
import { AlertaEmergenciaPantalla, RUTA_MAPA } from "@/modulos/emergencia";
import { router, Stack } from "expo-router";

export default function AlertaEmergenciaRuta() {
  return (
    <>
      {/* Sin gesto de «atrás»: se sale respondiendo o con «Ver el mapa». */}
      <Stack.Screen options={{ gestureEnabled: false, animation: "fade" }} />
      <AlertaEmergenciaPantalla
        onVerMapa={() => router.replace(RUTA_MAPA as never)}
        onSalir={() => router.replace("/inicio")}
      />
    </>
  );
}
