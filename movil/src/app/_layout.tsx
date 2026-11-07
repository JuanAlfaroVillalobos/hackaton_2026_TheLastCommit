import { ProveedorTema, useTema } from '@/compartido/tema';
import { SesionProvider, useSesion } from '@/nucleo/sesion';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

/**
 * @description Decide qué grupo de rutas se puede abrir según haya sesión: (privado) con sesión, (publico) sin ella.
 */
function Navegacion() {
  const { autenticado, cargando } = useSesion();
  const { colores } = useTema();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
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
 * @description Layout raíz: proveedores globales (tema y sesión; luego bandeja de salida y notificaciones). La barra de estado la ajusta ProveedorTema.
 */
export default function RootLayout() {
  return (
    <ProveedorTema>
      <SesionProvider>
        <Navegacion />
      </SesionProvider>
    </ProveedorTema>
  );
}
