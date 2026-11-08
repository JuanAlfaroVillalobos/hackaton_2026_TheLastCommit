// Ruta: src/nucleo/bandeja-salida/ProveedorBandeja.tsx
// Con sesión: carga la cola y la sincroniza al abrir la app, al volver la señal, al volver del
// segundo plano y cada 30 s mientras haya pendientes.
import { alVolverLaRed } from '@/nucleo/red/conexion';
import { useSesion } from '@/nucleo/sesion';
import { useEffect, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { cargarCola, leerCola } from './almacen';
import { fijarUsuarioBandeja, sincronizarBandeja } from './bandeja';

const REINTENTO_MS = 30_000;

/**
 * @description Proveedor de la bandeja de salida; va dentro de SesionProvider y no dibuja nada propio.
 */
export function ProveedorBandeja({ children }: { children: ReactNode }) {
  const { perfil, modoDesarrollo } = useSesion();
  const uid = perfil?.uid ?? null;

  useEffect(() => {
    fijarUsuarioBandeja(uid);
    void cargarCola();
    if (!uid || modoDesarrollo) return;

    const sincronizar = () => void sincronizarBandeja();
    sincronizar();

    const quitarRed = alVolverLaRed(sincronizar);
    const quitarApp = AppState.addEventListener('change', (s) => s === 'active' && sincronizar());
    const reintento = setInterval(() => {
      if (AppState.currentState === 'active' && leerCola().some((a) => a.uid === uid)) sincronizar();
    }, REINTENTO_MS);

    return () => {
      quitarRed();
      quitarApp.remove();
      clearInterval(reintento);
    };
  }, [uid, modoDesarrollo]);

  return children;
}
