import { OFICIOS, type OficioId } from '@/compartido/constantes/oficios';
import type { Coordenada } from '@/compartido/utilidades/geo';
import { api, ErrorApi, fijarToken } from '@/nucleo/api';
import { darDeBajaDispositivo } from '@/nucleo/notificaciones/dispositivo';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CambiosPerfil, DatosRegistro, PerfilVecino, UsuarioApi, UsuarioSesion } from './tipos';

// FIREBASE DESACTIVADO: la sesión viene de la API simulada (api-mock/). Al volver a Firebase Auth,
// `ingresar`/`registrar`/`salir` llaman a signInWithEmailAndPassword/createUser.../signOut, `usuario`
// sale de onAuthStateChanged y el ID token se manda a la API con fijarToken(). Las pantallas no cambian.

interface EstadoSesion {
  usuario: UsuarioSesion | null;
  /** Perfil completo del vecino (null sin sesión o mientras carga). */
  perfil: PerfilVecino | null;
  cargando: boolean;
  autenticado: boolean;
  modoDesarrollo: boolean;
  ingresar: (correo: string, clave: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  /** true justo después de crear la cuenta: la navegación abre «Completar perfil» una vez (RF05). */
  recienRegistrado: boolean;
  olvidarRegistro: () => void;
  /** RF07: pide el código de 6 dígitos. Devuelve el código solo en la demo (la API simulada no envía correos). */
  pedirCodigoClave: (correo: string) => Promise<string | undefined>;
  /** RF07: cambia la clave con el código y deja la sesión abierta. */
  restablecerClave: (correo: string, codigo: string, clave: string) => Promise<void>;
  salir: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
  actualizarPerfil: (cambios: CambiosPerfil) => Promise<void>;
  /** Lo llama nucleo/ubicacion tras validar una ubicación, para que P04 se recentre al instante. */
  fijarUbicacionLocal: (coordenada: Coordenada) => void;
  entrarModoDesarrollo: () => Promise<void>;
  salirModoDesarrollo: () => void;
}

/** Clave de SecureStore del token; también la lee la tarea de ubicación en segundo plano. */
export const CLAVE_TOKEN = 'vecinos.sesion.token';

/** Cuenta sembrada en api-mock; «Entrar sin cuenta» la usa si la API está arriba. */
const CUENTA_DEMO = { correo: 'ana@vecinos.pe', clave: 'vecinos123' };

/** Perfil local para «Entrar sin cuenta» cuando la API no responde (Plaza de Armas de Trujillo). */
const PERFIL_DEMO: PerfilVecino = {
  uid: 'u00',
  nombre: 'Ana Morales',
  correo: CUENTA_DEMO.correo,
  telefono: '+51987654321',
  barrio: 'Barrio Los Olivos',
  oficios: ['tecnologia', 'clases-tutorias'],
  fotoUrl: null,
  necesidadActivaId: null,
  ubicacion: { lat: -8.1116, lng: -79.0288 },
  ubicacionEn: null,
  estadoIdentidad: 'NO_ENVIADA',
  validador: false,
};

const SesionContext = createContext<EstadoSesion | null>(null);

const esOficio = (valor: string): valor is OficioId => valor in OFICIOS;

/**
 * @description Convierte el usuario de la API al perfil de la app, descartando oficios fuera del catálogo (RN-03).
 */
function aPerfil(u: UsuarioApi): PerfilVecino {
  return {
    uid: u.id,
    nombre: u.nombre,
    correo: u.correo,
    telefono: u.telefono ?? null,
    barrio: u.barrio ?? null,
    oficios: (u.oficios ?? []).filter(esOficio),
    fotoUrl: u.fotoUrl ?? null,
    necesidadActivaId: u.necesidadActivaId ?? null,
    ubicacion: u.ubicacion ?? null,
    ubicacionEn: u.ubicacionEn ?? null,
    estadoIdentidad: u.estadoIdentidad ?? 'NO_ENVIADA',
    validador: u.validador ?? false,
  };
}

const aUsuario = (p: PerfilVecino): UsuarioSesion => ({ uid: p.uid, displayName: p.nombre, email: p.correo });

/**
 * @description Guarda o borra el token; SecureStore puede fallar (web, almacenamiento bloqueado) y la sesión sigue en memoria.
 */
async function guardarToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  } catch {
    // sin persistencia: al reabrir la app pedirá ingresar de nuevo
  }
}

/**
 * @description Expone el usuario y el perfil de la sesión (hoy de la API simulada) y un modo de desarrollo para entrar sin cuenta.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilVecino | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoDesarrollo, setModoDesarrollo] = useState(false);
  const [recienRegistrado, setRecienRegistrado] = useState(false);

  // Restaura la sesión guardada; si la API no responde o el token ya no vale, se entra sin sesión.
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(() => null);
        if (!token) return;
        fijarToken(token);
        const yo = await api<UsuarioApi>('/vecinos/yo');
        if (vigente) setPerfil(aPerfil(yo));
      } catch (error) {
        // Sin conexión se conserva el token para reintentar al volver; un 401 lo invalida.
        if (error instanceof ErrorApi && error.estado === 401) {
          fijarToken(null);
          await guardarToken(null);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const abrir = useCallback(async (token: string, u: UsuarioApi) => {
    fijarToken(token);
    await guardarToken(token);
    setPerfil(aPerfil(u));
  }, []);

  const ingresar = useCallback(
    async (correo: string, clave: string) => {
      const { token, usuario } = await api<{ token: string; usuario: UsuarioApi }>('/auth/ingresar', {
        metodo: 'POST',
        cuerpo: { correo: correo.trim().toLowerCase(), clave },
      });
      await abrir(token, usuario);
    },
    [abrir],
  );

  const registrar = useCallback(
    async ({ nombre, correo, telefono, clave, aceptaTerminos }: DatosRegistro) => {
      const { token, usuario } = await api<{ token: string; usuario: UsuarioApi }>('/auth/registro', {
        metodo: 'POST',
        cuerpo: { nombre: nombre.trim(), correo: correo.trim().toLowerCase(), telefono: `+51${telefono}`, clave, aceptaTerminos },
      });
      setRecienRegistrado(true);
      await abrir(token, usuario);
    },
    [abrir],
  );

  const olvidarRegistro = useCallback(() => setRecienRegistrado(false), []);

  const pedirCodigoClave = useCallback(async (correo: string) => {
    const { codigoDemo } = await api<{ mensaje: string; codigoDemo?: string }>('/auth/recuperar', {
      metodo: 'POST',
      cuerpo: { correo: correo.trim().toLowerCase() },
    });
    return codigoDemo;
  }, []);

  const restablecerClave = useCallback(
    async (correo: string, codigo: string, clave: string) => {
      const { token, usuario } = await api<{ token: string; usuario: UsuarioApi }>('/auth/restablecer', {
        metodo: 'POST',
        cuerpo: { correo: correo.trim().toLowerCase(), codigo: codigo.trim(), clave },
      });
      await abrir(token, usuario);
    },
    [abrir],
  );

  const salir = useCallback(async () => {
    // Antes de cerrar sesión: este teléfono deja de recibir avisos de la cuenta.
    await darDeBajaDispositivo();
    await api('/auth/salir', { metodo: 'POST' }).catch(() => undefined);
    fijarToken(null);
    await guardarToken(null);
    setPerfil(null);
    setModoDesarrollo(false);
  }, []);

  const recargarPerfil = useCallback(async () => {
    if (modoDesarrollo && !perfil) return;
    const yo = await api<UsuarioApi>('/vecinos/yo');
    setPerfil(aPerfil(yo));
  }, [modoDesarrollo, perfil]);

  const actualizarPerfil = useCallback(
    async (cambios: CambiosPerfil) => {
      try {
        const yo = await api<UsuarioApi>('/vecinos/yo', { metodo: 'PATCH', cuerpo: cambios });
        setPerfil(aPerfil(yo));
      } catch (error) {
        // En modo desarrollo sin API, el cambio se guarda solo en memoria para poder probar las pantallas.
        if (modoDesarrollo && error instanceof ErrorApi && (error.codigo === 'SIN_CONEXION' || error.codigo === 'SIN_SESION')) {
          setPerfil((actual) => (actual ? { ...actual, ...cambios } : actual));
          return;
        }
        throw error;
      }
    },
    [modoDesarrollo],
  );

  const fijarUbicacionLocal = useCallback((coordenada: Coordenada) => {
    setPerfil((actual) => (actual ? { ...actual, ubicacion: coordenada, ubicacionEn: Date.now() } : actual));
  }, []);

  // «Entrar sin cuenta»: con la API arriba entra como la cuenta sembrada (datos reales del mock);
  // sin API, abre un perfil local para revisar las pantallas.
  const entrarModoDesarrollo = useCallback(async () => {
    if (!__DEV__) return;
    setModoDesarrollo(true);
    try {
      await ingresar(CUENTA_DEMO.correo, CUENTA_DEMO.clave);
    } catch {
      setPerfil(PERFIL_DEMO);
    }
  }, [ingresar]);

  const salirModoDesarrollo = useCallback(() => {
    void salir();
  }, [salir]);

  const valor = useMemo<EstadoSesion>(
    () => ({
      usuario: perfil ? aUsuario(perfil) : null,
      perfil,
      cargando,
      modoDesarrollo,
      autenticado: perfil !== null,
      ingresar,
      registrar,
      recienRegistrado,
      olvidarRegistro,
      pedirCodigoClave,
      restablecerClave,
      salir,
      recargarPerfil,
      actualizarPerfil,
      fijarUbicacionLocal,
      entrarModoDesarrollo,
      salirModoDesarrollo,
    }),
    [
      perfil,
      cargando,
      modoDesarrollo,
      ingresar,
      registrar,
      recienRegistrado,
      olvidarRegistro,
      pedirCodigoClave,
      restablecerClave,
      salir,
      recargarPerfil,
      actualizarPerfil,
      fijarUbicacionLocal,
      entrarModoDesarrollo,
      salirModoDesarrollo,
    ],
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

/**
 * @description Atajo para el perfil del vecino con sesión (null sin sesión).
 */
export function usePerfil(): PerfilVecino | null {
  return useSesion().perfil;
}
