import { router } from 'expo-router';
import EsqueletoPantalla from '../componentes/EsqueletoPantalla';

/**
 * @description Registro con nombre, correo, teléfono y clave (P02, RF01); pendiente de implementar.
 */
export default function RegistroPantalla() {
  return (
    <EsqueletoPantalla
      titulo="Crear cuenta"
      codigo="P02"
      acciones={[{ texto: 'Volver', onPress: () => router.back(), secundaria: true }]}
    />
  );
}
