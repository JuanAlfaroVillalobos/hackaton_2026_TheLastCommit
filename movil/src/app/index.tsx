// Ruta: src/app/index.tsx
// Entrada de la app: lleva a Inicio (P04). Cuando exista la sesión (Persona A), el layout de (privado)
// redirige a (publico)/ingresar si no hay usuario.
import { Redirect } from "expo-router";

export default function Entrada() {
  return <Redirect href="/inicio" />;
}
