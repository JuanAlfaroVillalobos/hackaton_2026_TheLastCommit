import { useTema } from '@/compartido/tema';
import { BarraPestanas, type PestanaConfig } from '@/compartido/ui';
import { Tabs } from 'expo-router/js-tabs';

/** Título e icono de cada pestaña (sección 7). Favores usa la mano con corazón (diseño P04, decisión 3). */
const PESTANAS: Record<string, PestanaConfig> = {
  inicio: { titulo: 'Inicio', icono: 'home' },
  servicios: { titulo: 'Servicios', icono: 'build' },
  favores: { titulo: 'Favores', icono: 'volunteer_activism' },
  perfil: { titulo: 'Perfil', icono: 'person' },
};

/**
 * @description Las 4 pestañas del README (sección 7), con la barra del diseño P04: de borde a borde y
 * píldora en la activa. Cada pestaña es una carpeta con su propio Stack.
 */
export default function PestanasLayout() {
  const { colores } = useTema();
  return (
    <Tabs
      tabBar={(props) => <BarraPestanas {...props} pestanas={PESTANAS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colores.fondo } }}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="servicios" />
      <Tabs.Screen name="favores" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
