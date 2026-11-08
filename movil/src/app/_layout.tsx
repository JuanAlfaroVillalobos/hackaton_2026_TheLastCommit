import { ProveedorTema, useTema } from '@/compartido/tema';
import { ProveedorBandeja } from '@/nucleo/bandeja-salida';
import { ProveedorNotificaciones } from '@/nucleo/notificaciones';
import { SesionProvider, useSesion } from '@/nucleo/sesion';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * @description Decide qué grupo de rutas se puede abrir según haya sesión: (privado) con sesión, (publico) sin ella.
 */
function Navegacion() {
  const { autenticado, cargando, recienRegistrado, olvidarRegistro } = useSesion();
  const { colores } = useTema();

  // Tras crear la cuenta, una sola vez: elegir oficios y permisos (RF05).
  useEffect(() => {
    if (!autenticado || !recienRegistrado) return;
    const t = setTimeout(() => {
      olvidarRegistro();
      router.push('/completar-perfil');
    }, 0);
    return () => clearTimeout(t);
  }, [autenticado, recienRegistrado, olvidarRegistro]);

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
 * @description Layout raíz: proveedores globales (tema, sesión, bandeja de salida y notificaciones). Las tareas de segundo plano se registran en src/nucleo/arranque.ts. La barra de estado la ajusta ProveedorTema.
 */
export default function RootLayout() {
  return (
    <ProveedorTema>
      <SesionProvider>
        <ProveedorBandeja>
          <ProveedorNotificaciones>
            <Navegacion />
          </ProveedorNotificaciones>
        </ProveedorBandeja>
      </SesionProvider>
    </ProveedorTema>
  );
}
