import { router } from 'expo-router';
import { EsqueletoPantalla } from '../../cuentas';

/**
 * @description Tutorial inicial (P20, RF37); por ahora solo lleva al inicio de sesión.
 */
export default function BienvenidaPantalla() {
  return (
    <EsqueletoPantalla
      titulo="Bienvenido a Vecinos"
      codigo="P20"
      acciones={[{ texto: 'Continuar', onPress: () => router.replace('/ingresar') }]}
    />
  );
}
