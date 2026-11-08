// Ruta: src/app/(privado)/(pestanas)/inicio/index.tsx
// Archivo delgado: P04 Inicio, del módulo favores.
import { RUTA_MAPA, useEmergencia } from "@/modulos/emergencia";
import { InicioPantalla } from "@/modulos/favores";
import { Redirect } from "expo-router";

/** RF22: con la zona en emergencia, P04 se reemplaza por P11 (mapa de emergencia). */
export default function InicioRuta() {
  const { activa } = useEmergencia();
  if (activa) return <Redirect href={RUTA_MAPA as never} />;
  return <InicioPantalla />;
}
