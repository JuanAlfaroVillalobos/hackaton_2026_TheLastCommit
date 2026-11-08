// Ruta: src/modulos/bienvenida/servicios/tutorial.ts
// Recuerda si el tutorial ya se vio en este teléfono (RF37: se muestra al instalar).
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

const CLAVE = 'vecinos.tutorial.visto';

export async function marcarTutorialVisto(): Promise<void> {
  await SecureStore.setItemAsync(CLAVE, '1').catch(() => undefined);
}

/**
 * @description null mientras lee; true si ya se vio. Si no se puede leer, asume que sí para no bloquear la entrada.
 */
export function useTutorialVisto(): boolean | null {
  const [visto, setVisto] = useState<boolean | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync(CLAVE)
      .then((v) => setVisto(v === '1'))
      .catch(() => setVisto(true));
  }, []);
  return visto;
}
