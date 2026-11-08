import { OFICIOS, type OficioId } from '@/compartido/constantes/oficios';
import type { Coordenada } from '@/compartido/utilidades/geo';
import { api, configurarRenovacion, ErrorApi, esErrorDeRed, fijarToken } from '@/nucleo/api';
import { darDeBajaDispositivo } from '@/nucleo/notificaciones/dispositivo';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  CambiosPerfil,
  DatosRegistro,
  PerfilVecino,
  RespuestaSesion,
  ResultadoRecuperacion,
  UsuarioApi,
  UsuarioSesion,
} from './tipos';

// La sesión viene de la API (api-mock/). La API decide cómo se autentica: con Firebase Auth
// (AUTENTICACION=firebase: el token es un ID token de 1 h que se renueva solo con `renovacion`) o con sus
// propias sesiones (modo local). La app funciona igual en los dos modos.

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
  /** RF07: pide el código (modo local) o el correo con el enlace (Firebase Auth). */
  pedirCodigoClave: (correo: string) => Promise<ResultadoRecuperacion>;
  /** RF07, modo local: cambia la clave con el código y deja la sesión abierta. */
  restablecerClave: (correo: string, codigo: string, clave: string) => Promise<void>;
  /** Guarda tokens nuevos sin tocar el perfil (p. ej. después de cambiar la clave). */
  actualizarTokens: (token: string, renovacion: string | null) => Promise<void>;
  /** Firebase Auth: reenvía el correo para verificar la dirección. */
  reenviarVerificacion: () => Promise<void>;
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
/** Clave de SecureStore del refresh token de Firebase (solo con AUTENTICACION=firebase en la API). */
const CLAVE_RENOVACION = 'vecinos.sesion.renovacion';

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
  correoVerificado: null,
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
    correoVerificado: u.correoVerificado ?? null,
  };
}

const aUsuario = (p: PerfilVecino): UsuarioSesion => ({ uid: p.uid, displayName: p.nombre, email: p.correo });

/**
 * @description Guarda o borra un valor; SecureStore puede fallar (web, almacenamiento bloqueado) y la sesión sigue en memoria.
 */
async function guardarSeguro(clave: string, valor: string | null): Promise<void> {
  try {
    if (valor) await SecureStore.setItemAsync(clave, valor);
    else await SecureStore.deleteItemAsync(clave);
  } catch {
    // sin persistencia: al reabrir la app pedirá ingresar de nuevo
  }
}

const leerSeguro = (clave: string) => SecureStore.getItemAsync(clave).catch(() => null);

/**
 * @description Expone el usuario y el perfil de la sesión y un modo de desarrollo para entrar sin cuenta.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilVecino | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoDesarrollo, setModoDesarrollo] = useState(false);
  const [recienRegistrado, setRecienRegistrado] = useState(false);

  const guardarTokens = useCallback(async (token: string | null, renovacion: string | null) => {
    fijarToken(token);
    await Promise.all([guardarSeguro(CLAVE_TOKEN, token), guardarSeguro(CLAVE_RENOVACION, renovacion)]);
  }, []);

  // Con Firebase Auth el token vence cada hora: el cliente de la API llama a esto y reintenta solo.
  useEffect(() => {
    configurarRenovacion(async () => {
      const renovacion = await leerSeguro(CLAVE_RENOVACION);
      if (!renovacion) return null;
      try {
        const r = await api<{ token: string; renovacion: string | null }>('/auth/renovar', {
          metodo: 'POST',
          cuerpo: { renovacion },
          sinRenovar: true,
        });
        await guardarTokens(r.token, r.renovacion);
        return r.token;
      } catch (error) {
        // La renovación fue rechazada (clave cambiada, cuenta borrada): se cierra la sesión local.
        if (error instanceof ErrorApi && error.estado === 401) {
          await guardarTokens(null, null);
          setPerfil(null);
        }
        return null;
      }
    });
    return () => configurarRenovacion(null);
  }, [guardarTokens]);

  // Restaura la sesión guardada; si la API no responde o el token ya no vale, se entra sin sesión.
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const token = await leerSeguro(CLAVE_TOKEN);
        if (!token) return;
        fijarToken(token);
        const yo = await api<UsuarioApi>('/vecinos/yo');
        if (vigente) setPerfil(aPerfil(yo));
      } catch (error) {
        // Sin conexión se conserva el token para reintentar al volver; un 401 lo invalida.
        if (error instanceof ErrorApi && error.estado === 401) await guardarTokens(null, null);
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [guardarTokens]);

  const abrir = useCallback(
    async ({ token, renovacion, usuario }: RespuestaSesion) => {
      await guardarTokens(token, renovacion);
      setPerfil(aPerfil(usuario));
    },
    [guardarTokens],
  );

  const ingresar = useCallback(
    async (correo: string, clave: string) => {
      const r = await api<RespuestaSesion>('/auth/ingresar', {
        metodo: 'POST',
        cuerpo: { correo: correo.trim().toLowerCase(), clave },
      });
      await abrir(r);
    },
    [abrir],
  );

  const registrar = useCallback(
    async ({ nombre, correo, telefono, clave, aceptaTerminos }: DatosRegistro) => {
      const r = await api<RespuestaSesion>('/auth/registro', {
        metodo: 'POST',
        cuerpo: { nombre: nombre.trim(), correo: correo.trim().toLowerCase(), telefono: `+51${telefono}`, clave, aceptaTerminos },
      });
      setRecienRegistrado(true);
      await abrir(r);
    },
    [abrir],
  );

  const olvidarRegistro = useCallback(() => setRecienRegistrado(false), []);

  const pedirCodigoClave = useCallback(async (correo: string): Promise<ResultadoRecuperacion> => {
    const r = await api<{ modo?: 'codigo' | 'enlace'; codigoDemo?: string }>('/auth/recuperar', {
      metodo: 'POST',
      cuerpo: { correo: correo.trim().toLowerCase() },
    });
    return { modo: r.modo ?? 'codigo', codigoDemo: r.codigoDemo };
  }, []);

  const restablecerClave = useCallback(
    async (correo: string, codigo: string, clave: string) => {
      const r = await api<RespuestaSesion>('/auth/restablecer', {
        metodo: 'POST',
        cuerpo: { correo: correo.trim().toLowerCase(), codigo: codigo.trim(), clave },
      });
      await abrir(r);
    },
    [abrir],
  );

  const actualizarTokens = useCallback(
    (token: string, renovacion: string | null) => guardarTokens(token, renovacion),
    [guardarTokens],
  );

  const reenviarVerificacion = useCallback(async () => {
    await api('/auth/verificar-correo', { metodo: 'POST' });
  }, []);

  const salir = useCallback(async () => {
    // Antes de cerrar sesión: este teléfono deja de recibir avisos de la cuenta.
    await darDeBajaDispositivo();
    await api('/auth/salir', { metodo: 'POST' }).catch(() => undefined);
    await guardarTokens(null, null);
    setPerfil(null);
    setModoDesarrollo(false);
  }, [guardarTokens]);

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
        if (modoDesarrollo && error instanceof ErrorApi && (esErrorDeRed(error) || error.codigo === 'SIN_SESION')) {
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
      actualizarTokens,
      reenviarVerificacion,
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
      actualizarTokens,
      reenviarVerificacion,
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
