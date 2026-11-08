import { useTutorialVisto } from '@/modulos/bienvenida';
import { Redirect } from 'expo-router';
import { useSesion } from '../nucleo/sesion';

/**
 * @description Punto de entrada: con sesión va a las pestañas; sin sesión, al tutorial la primera vez (RF37) y luego a la bienvenida.
 */
export default function Inicio() {
  const { autenticado } = useSesion();
  const tutorialVisto = useTutorialVisto();

  if (autenticado) return <Redirect href="/inicio" />;
  if (tutorialVisto === null) return null;
  return <Redirect href={tutorialVisto ? '/bienvenida' : '/tutorial'} />;
}
