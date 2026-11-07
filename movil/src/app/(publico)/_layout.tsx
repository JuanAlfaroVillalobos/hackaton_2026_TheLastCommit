import { Stack } from 'expo-router';

/**
 * @description Rutas sin sesión: bienvenida, ingresar y registro.
 */
export default function PublicoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
