import { router } from 'expo-router';
import { useSesion } from '../../../nucleo/sesion';
import EsqueletoPantalla from '../componentes/EsqueletoPantalla';

/**
 * @description Inicio de sesión (P01); incluye un acceso sin cuenta solo en desarrollo para que el equipo vea las pestañas.
 */
export default function IngresarPantalla() {
  const { entrarModoDesarrollo } = useSesion();

  return (
    <EsqueletoPantalla
      titulo="Iniciar sesión"
      codigo="P01"
      acciones={[
        { texto: 'Crear cuenta', onPress: () => router.push('/registro') },
        ...(__DEV__
          ? [{ texto: 'Entrar sin cuenta (solo desarrollo)', onPress: entrarModoDesarrollo, secundaria: true }]
          : []),
      ]}
    />
  );
}
