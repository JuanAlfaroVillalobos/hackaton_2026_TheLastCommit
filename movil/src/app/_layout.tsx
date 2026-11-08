import { ProveedorTema, useTema } from '@/compartido/tema';
import { ProveedorNotificaciones } from '@/nucleo/notificaciones';
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
 * @description Layout raíz: proveedores globales (tema, sesión y notificaciones; luego bandeja de salida). Las tareas de segundo plano se registran en src/nucleo/arranque.ts. La barra de estado la ajusta ProveedorTema.
 */
export default function RootLayout() {
  return (
    <ProveedorTema>
      <SesionProvider>
        <ProveedorNotificaciones>
          <Navegacion />
        </ProveedorNotificaciones>
      </SesionProvider>
    </ProveedorTema>
  );
}
