import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SesionProvider, useSesion } from '../nucleo/sesion';

/**
 * @description Decide qué grupo de rutas se puede abrir según haya sesión: (privado) con sesión, (publico) sin ella.
 */
function Navegacion() {
  const { autenticado, cargando } = useSesion();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF9' }}>
        <ActivityIndicator size="large" color="#C2410C" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(privado)" />
      </Stack.Protected>
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="(publico)" />
      </Stack.Protected>
    </Stack>
  );
}

/**
 * @description Layout raíz: proveedores globales (sesión; luego tema, bandeja de salida y notificaciones).
 */
export default function RootLayout() {
  return (
    <SesionProvider>
      <StatusBar style="dark" />
      <Navegacion />
    </SesionProvider>
  );
}
