import { Redirect } from 'expo-router';
import { useSesion } from '../nucleo/sesion';

/**
 * @description Punto de entrada: con sesión va a las pestañas; sin sesión, a la bienvenida.
 */
export default function Inicio() {
  const { autenticado } = useSesion();
  return <Redirect href={autenticado ? '/inicio' : '/bienvenida'} />;
}
