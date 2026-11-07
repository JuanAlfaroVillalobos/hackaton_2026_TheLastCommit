import { useTema } from '@/compartido/tema';
import { Encabezado } from '@/compartido/ui';
import { BotonSos } from '@/modulos/emergencia';
import { useVecinoActual } from '@/modulos/favores';
import { Stack } from 'expo-router';

/**
 * @description Encabezado de la sección 7: casa + «Vecinos» + barrio y el botón «SOS» (RF20).
 * El barrio sale de un adaptador temporal de favores hasta que el perfil (A) lo exponga.
 */
function EncabezadoPrivado() {
  const { barrio } = useVecinoActual();
  return <Encabezado barrio={barrio} derecha={<BotonSos />} />;
}

/**
 * @description Rutas con sesión. Las pestañas llevan el encabezado con «SOS»; P11 (emergencia) tiene su
 * propia barra, y los flujos de cuentas e identidad usan su propio diseño de pantalla.
 */
export default function PrivadoLayout() {
  const { colores } = useTema();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
      <Stack.Screen name="(pestanas)" options={{ headerShown: true, header: () => <EncabezadoPrivado /> }} />
    </Stack>
  );
}
