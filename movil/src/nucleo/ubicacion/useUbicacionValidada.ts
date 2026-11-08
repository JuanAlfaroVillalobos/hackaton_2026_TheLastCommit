// Ruta: src/nucleo/ubicacion/useUbicacionValidada.ts
// Hook de RF42 para todos los módulos (favores, directorio, trabajos, ayuda humanitaria, emergencia):
//   const { pedir } = useUbicacionValidada();
//   const ubicacion = await pedir();      // null si el vecino cancela
//   if (!ubicacion) return;
// Resuelve solo los avisos: ubicación simulada, reintentar, pin manual o ajustes.
import { useSesion } from '@/nucleo/sesion';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { informarUbicacion } from './informar';
import { solicitarPinManual } from './pinManual';
import {
  MENSAJES_UBICACION,
  obtenerUbicacionValidada,
  sigueFresca,
  type MotivoRechazo,
  type UbicacionValidada,
} from './validar';

export type EstadoUbicacion = 'inactivo' | 'buscando' | 'lista' | 'error';

type Decision = 'reintentar' | 'pin' | 'ajustes' | 'cancelar';

type OpcionesPedir = {
  /** Reutiliza la última ubicación si aún está fresca (≤ 2 min). Por defecto, true. */
  reutilizar?: boolean;
  /** Permite elegir en el mapa si el GPS falla. Por defecto, true (RF42). */
  permitirPin?: boolean;
};

/**
 * @description Muestra el aviso del motivo y espera la decisión del vecino.
 */
function preguntar(motivo: MotivoRechazo, permitirPin: boolean): Promise<Decision> {
  const { titulo, texto } = MENSAJES_UBICACION[motivo];
  return new Promise((resolver) => {
    const botones: { text: string; style?: 'cancel' | 'default'; onPress: () => void }[] = [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver('cancelar') },
    ];
    if (motivo === 'SIN_PERMISO') botones.push({ text: 'Ir a Ajustes', onPress: () => resolver('ajustes') });
    if (motivo !== 'SIN_PERMISO') botones.push({ text: 'Reintentar', onPress: () => resolver('reintentar') });
    if (permitirPin && motivo !== 'SIMULADA') botones.push({ text: 'Elegir en el mapa', onPress: () => resolver('pin') });
    Alert.alert(titulo, texto, botones, { cancelable: true, onDismiss: () => resolver('cancelar') });
  });
}

/**
 * @description Devuelve `pedir()` para obtener una ubicación validada (RF42) y el estado para mostrar un indicador.
 */
export function useUbicacionValidada() {
  const { perfil, fijarUbicacionLocal } = useSesion();
  const [estado, setEstado] = useState<EstadoUbicacion>('inactivo');
  const [ubicacion, setUbicacion] = useState<UbicacionValidada | null>(null);
  const [motivo, setMotivo] = useState<MotivoRechazo | null>(null);
  const ultima = useRef<UbicacionValidada | null>(null);

  const aceptar = useCallback(
    (lista: UbicacionValidada) => {
      ultima.current = lista;
      setUbicacion(lista);
      setMotivo(null);
      setEstado('lista');
      fijarUbicacionLocal(lista.coordenada);
      void informarUbicacion(lista);
      return lista;
    },
    [fijarUbicacionLocal],
  );

  const pedir = useCallback(
    async ({ reutilizar = true, permitirPin = true }: OpcionesPedir = {}): Promise<UbicacionValidada | null> => {
      if (reutilizar && sigueFresca(ultima.current)) return ultima.current;

      setEstado('buscando');
      for (;;) {
        const resultado = await obtenerUbicacionValidada();
        if (resultado.ok) return aceptar(resultado.ubicacion);

        setMotivo(resultado.motivo);
        const decision = await preguntar(resultado.motivo, permitirPin);
        if (decision === 'reintentar') continue;
        if (decision === 'ajustes') await Linking.openSettings().catch(() => undefined);
        if (decision === 'pin') {
          const coordenada = await solicitarPinManual(resultado.aproximada ?? perfil?.ubicacion ?? null);
          if (coordenada) return aceptar({ coordenada, precisionM: null, manual: true, tomadaEn: Date.now() });
        }
        setEstado('error');
        return null;
      }
    },
    [aceptar, perfil?.ubicacion],
  );

  return { pedir, estado, ubicacion, motivo, buscando: estado === 'buscando' };
}
