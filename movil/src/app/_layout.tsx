import { ProveedorTema, useTema, useTemaStore } from '@/compartido/tema';
import { ProveedorBandeja } from '@/nucleo/bandeja-salida';
import { obtenerClima, temaPorClima } from '@/nucleo/clima';
import { ProveedorNotificaciones } from '@/nucleo/notificaciones';
import { SesionProvider, useSesion } from '@/nucleo/sesion';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

const INTERVALO_CLIMA_MS = 30 * 60 * 1000;

function SincronizarTemaClima() {
  const { cargando, perfil } = useSesion();
  const lat = perfil?.ubicacion?.lat;
  const lng = perfil?.ubicacion?.lng;

  useEffect(() => {
    if (cargando || lat == null || lng == null) return;

    let activo = true;
    const actualizar = async () => {
      const clima = await obtenerClima({ lat, lng });
      if (!activo || !clima) return;
      useTemaStore.getState().setTemaClima(temaPorClima(clima));
    };

    void actualizar();
    const intervalo = setInterval(() => void actualizar(), INTERVALO_CLIMA_MS);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [cargando, lat, lng]);

  return null;
}

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
        <SincronizarTemaClima />
        <ProveedorBandeja>
          <ProveedorNotificaciones>
            <Navegacion />
          </ProveedorNotificaciones>
        </ProveedorBandeja>
      </SesionProvider>
    </ProveedorTema>
  );
}
