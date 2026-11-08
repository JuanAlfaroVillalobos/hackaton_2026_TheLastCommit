// Ruta: src/modulos/identidad/hooks/usePuedeOfrecer.ts
// RN-18 en la app: antes de aceptar una necesidad o publicar, revisa la identidad y, si falta, lo explica.
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { identidadEnviada } from '../reglas';

/**
 * @description Devuelve `verificarAntes()`: true si puede seguir; si no, muestra el aviso con «Verificar ahora». La API también lo exige.
 */
export function usePuedeOfrecer() {
  const { perfil } = useSesion();

  const verificarAntes = useCallback((): boolean => {
    if (identidadEnviada(perfil?.estadoIdentidad)) return true;
    const rechazada = perfil?.estadoIdentidad === 'RECHAZADA';
    Alert.alert(
      rechazada ? 'Vuelve a verificar tu identidad' : 'Primero verifica tu identidad',
      rechazada
        ? 'Tu verificación fue rechazada. Envíala de nuevo para poder ofrecer ayuda.'
        : 'Para ofrecer ayuda o publicar necesitas enviar tu DNI y una selfie. Toma un minuto. Pedir ayuda no lo requiere.',
      [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Verificar ahora', onPress: () => router.push('/verificar-identidad') },
      ],
    );
    return false;
  }, [perfil?.estadoIdentidad]);

  return { puedeOfrecer: identidadEnviada(perfil?.estadoIdentidad), verificarAntes };
}
