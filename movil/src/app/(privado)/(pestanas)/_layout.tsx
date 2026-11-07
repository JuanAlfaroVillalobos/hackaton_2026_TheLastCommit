import { Tabs } from 'expo-router';

/**
 * @description Las 4 pestañas del README (sección 7). Cada una aparece cuando su dueño crea el index.tsx de su carpeta.
 */
export default function PestanasLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C2410C',
        tabBarInactiveTintColor: '#57534E',
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="servicios" options={{ title: 'Servicios' }} />
      <Tabs.Screen name="favores" options={{ title: 'Favores' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
