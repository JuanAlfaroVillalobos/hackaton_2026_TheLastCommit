import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';

interface EstadoSesion {
  usuario: FirebaseAuthTypes.User | null;
  cargando: boolean;
  autenticado: boolean;
  modoDesarrollo: boolean;
  entrarModoDesarrollo: () => void;
  salirModoDesarrollo: () => void;
}

const SesionContext = createContext<EstadoSesion | null>(null);

/**
 * @description Expone el usuario de Firebase Auth y un modo de desarrollo para entrar sin cuenta mientras se construye RF01–RF07.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<FirebaseAuthTypes.User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoDesarrollo, setModoDesarrollo] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setUsuario(u);
      setCargando(false);
    });
  }, []);

  const valor = useMemo<EstadoSesion>(
    () => ({
      usuario,
      cargando,
      modoDesarrollo,
      autenticado: usuario !== null || modoDesarrollo,
      entrarModoDesarrollo: () => {
        if (__DEV__) setModoDesarrollo(true);
      },
      salirModoDesarrollo: () => setModoDesarrollo(false),
    }),
    [usuario, cargando, modoDesarrollo],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

/**
 * @description Devuelve el estado de la sesión; debe usarse dentro de SesionProvider.
 */
export function useSesion(): EstadoSesion {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return contexto;
}
