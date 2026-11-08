import { useCalleActual } from '@/compartido/hooks/useCalle';
import { useTema } from '@/compartido/tema';
import { Encabezado } from '@/compartido/ui';
import { BotonSos, ProveedorEmergencia } from '@/modulos/emergencia';
import { useVecinoActual } from '@/modulos/favores';
import { Stack } from 'expo-router';

/**
 * @description Encabezado de la sección 7: casa + «Vecinos» + calle actual (o el barrio si no se puede leer) y el botón «SOS» (RF20).
 * El barrio sale de un adaptador temporal de favores hasta que el perfil (A) lo exponga.
 */
function EncabezadoPrivado() {
  const { barrio, ubicacion } = useVecinoActual();
  const calle = useCalleActual(ubicacion);
  return <Encabezado barrio={calle ?? barrio} derecha={<BotonSos />} />;
}

/**
 * @description Rutas con sesión. Las pestañas llevan el encabezado con «SOS»; P11 (emergencia) tiene su
 * propia barra, y los flujos de cuentas e identidad usan su propio diseño de pantalla.
 * ProveedorEmergencia pasa toda la app a modo emergencia cuando la zona lo está (RF21, RF22).
 */
export default function PrivadoLayout() {
  const { colores } = useTema();
  return (
    <ProveedorEmergencia>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
        <Stack.Screen name="(pestanas)" options={{ headerShown: true, header: () => <EncabezadoPrivado /> }} />
      </Stack>
    </ProveedorEmergencia>
  );
}