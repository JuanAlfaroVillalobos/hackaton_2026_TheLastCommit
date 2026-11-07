import { router } from 'expo-router';
import { EsqueletoPantalla } from '../../cuentas';

/**
 * @description Verificación con DNI, nombres, foto del DNI y selfie (P19, RF36); pendiente de implementar.
 */
export default function VerificarIdentidadPantalla() {
  return (
    <EsqueletoPantalla
      titulo="Verifica tu identidad"
      codigo="P19"
      acciones={[{ texto: 'Volver', onPress: () => router.back(), secundaria: true }]}
    />
  );
}
