import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, fijarToken } from '@/nucleo/api';

// FIREBASE DESACTIVADO: la sesión viene de la API simulada (api-mock/). Al volver a Firebase Auth,
// `ingresar`/`salir` llaman a signInWithEmailAndPassword/signOut, `usuario` sale de onAuthStateChanged
// y el ID token se manda a la API con fijarToken(). Las pantallas no cambian.

/** Subconjunto de FirebaseAuthTypes.User que usa la app; mismos nombres para que volver sea directo. */
export interface UsuarioSesion {
  uid: string;
  displayName: string | null;
  email: string | null;
}

interface UsuarioApi {
  id: string;
  nombre: string;
  correo: string;
}

interface EstadoSesion {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  autenticado: boolean;
  modoDesarrollo: boolean;
  ingresar: (correo: string, clave: string) => Promise<void>;
  salir: () => Promise<void>;
  entrarModoDesarrollo: () => void;
  salirModoDesarrollo: () => void;
}

const CLAVE_TOKEN = 'vecinos.sesion.token';

const SesionContext = createContext<EstadoSesion | null>(null);

const aUsuarioSesion = (u: UsuarioApi): UsuarioSesion => ({ uid: u.id, displayName: u.nombre, email: u.correo });

/** SecureStore puede fallar (web, almacenamiento bloqueado); la sesión sigue en memoria igual. */
async function guardarToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  } catch {
    // sin persistencia: al reabrir la app pedirá ingresar de nuevo
  }
}

/**
 * @description Expone el usuario de la sesión (hoy de la API simulada) y un modo de desarrollo para entrar sin cuenta.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoDesarrollo, setModoDesarrollo] = useState(false);

  // Restaura la sesión guardada; si la API no responde o el token ya no vale, se entra sin sesión.
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(() => null);
        if (!token) return;
        fijarToken(token);
        const yo = await api<UsuarioApi>('/auth/yo');
        if (vigente) setUsuario(aUsuarioSesion(yo));
      } catch {
        fijarToken(null);
        await guardarToken(null);
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const ingresar = useCallback(async (correo: string, clave: string) => {
    const { token, usuario: u } = await api<{ token: string; usuario: UsuarioApi }>('/auth/ingresar', {
      metodo: 'POST',
      cuerpo: { correo, clave },
    });
    fijarToken(token);
    await guardarToken(token);
    setUsuario(aUsuarioSesion(u));
  }, []);

  const salir = useCallback(async () => {
    await api('/auth/salir', { metodo: 'POST' }).catch(() => undefined);
    fijarToken(null);
    await guardarToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo<EstadoSesion>(
    () => ({
      usuario,
      cargando,
      modoDesarrollo,
      autenticado: usuario !== null || modoDesarrollo,
      ingresar,
      salir,
      entrarModoDesarrollo: () => {
        if (__DEV__) setModoDesarrollo(true);
      },
      salirModoDesarrollo: () => setModoDesarrollo(false),
    }),
    [usuario, cargando, modoDesarrollo, ingresar, salir],
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
