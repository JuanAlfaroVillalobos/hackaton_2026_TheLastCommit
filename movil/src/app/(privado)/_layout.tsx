import { Stack } from 'expo-router';

/**
 * @description Rutas con sesión. El encabezado con «SOS» de la sección 7 lo agregan aquí Jamila (diseño) y Manuel (RF20).
 */
export default function PrivadoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
