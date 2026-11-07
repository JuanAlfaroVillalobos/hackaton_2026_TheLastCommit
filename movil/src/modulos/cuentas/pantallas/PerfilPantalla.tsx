import { router } from 'expo-router';
import { useSesion } from '../../../nucleo/sesion';
import EsqueletoPantalla from '../componentes/EsqueletoPantalla';

/**
 * @description Perfil del vecino (P10, RF05, RF06, RF17); por ahora da acceso a las pantallas privadas y al cierre del modo desarrollo.
 */
export default function PerfilPantalla() {
  const { modoDesarrollo, salirModoDesarrollo } = useSesion();

  return (
    <EsqueletoPantalla
      titulo="Mi perfil"
      codigo="P10"
      acciones={[
        { texto: 'Completar perfil', onPress: () => router.push('/completar-perfil'), secundaria: true },
        { texto: 'Verificar identidad', onPress: () => router.push('/verificar-identidad'), secundaria: true },
        ...(modoDesarrollo ? [{ texto: 'Salir del modo desarrollo', onPress: salirModoDesarrollo }] : []),
      ]}
    />
  );
}
