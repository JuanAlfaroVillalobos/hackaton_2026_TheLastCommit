import { Stack } from 'expo-router';

// Pila propia de la pestaña: aquí el dueño agrega sus pantallas internas (detalle, publicar, etc.).
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
