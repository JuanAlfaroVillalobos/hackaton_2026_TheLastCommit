import { router } from 'expo-router';
import EsqueletoPantalla from '../componentes/EsqueletoPantalla';

/**
 * @description Completar perfil: oficios, foto y permisos (P03, RF05, RF06, RF08); pendiente de implementar.
 */
export default function CompletarPerfilPantalla() {
  return (
    <EsqueletoPantalla
      titulo="Completa tu perfil"
      codigo="P03"
      acciones={[{ texto: 'Volver', onPress: () => router.back(), secundaria: true }]}
    />
  );
}
