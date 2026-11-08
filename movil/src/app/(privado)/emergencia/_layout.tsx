// Ruta: src/app/(privado)/emergencia/_layout.tsx
import { useTemaEmergencia } from "@/modulos/ayuda-humanitaria";
import { Stack } from "expo-router";

export default function EmergenciaLayout() {
  useTemaEmergencia();
  return <Stack screenOptions={{ headerShown: false }} />;
}