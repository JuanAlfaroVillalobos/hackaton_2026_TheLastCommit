// Ruta: src/nucleo/firebaseAuth.ts
// Firebase Authentication detrás de la API (AUTENTICACION=firebase). Las cuentas viven en Firebase Auth
// (se ven en la consola → Authentication), Firebase guarda y verifica la clave, envía el correo para
// recuperarla y el de verificación, y frena los ataques de fuerza bruta. La app sigue hablando solo con
// esta API, así que funciona igual en Expo Go, en la web y en el development build.
//  - Ingreso, renovación y correos: API REST de Identity Toolkit (la misma que usa el SDK de Firebase).
//  - Crear, cambiar clave, revocar y borrar cuentas, y verificar tokens: firebase-admin.
// Con FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 usa el emulador (los correos salen en su consola).
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { ErrorHttp } from './errores.js';
import { appFirebase } from './firebase.js';

export const USA_FIREBASE_AUTH = process.env.AUTENTICACION === 'firebase';
const EMULADOR = process.env.FIREBASE_AUTH_EMULATOR_HOST;
/** Clave web del proyecto (Consola → Configuración del proyecto → General → Clave de API web). El emulador acepta cualquiera. */
const CLAVE_WEB = process.env.FIREBASE_WEB_API_KEY ?? (EMULADOR ? 'clave-del-emulador' : '');

export interface TokensFirebase {
  uid: string;
  /** ID token (1 h). La app lo manda en `Authorization: Bearer`. */
  token: string;
  /** Refresh token: con él la app pide un ID token nuevo en /auth/renovar. */
  renovacion: string;
  expiraEn: number;
}

/** Problema de configuración que se muestra al arrancar (null si todo está bien). */
export function problemaConfiguracionAuth(): string | null {
  if (!USA_FIREBASE_AUTH) return null;
  if (!EMULADOR && !CLAVE_WEB) return 'falta FIREBASE_WEB_API_KEY en .env (o FIREBASE_AUTH_EMULATOR_HOST para el emulador)';
  return null;
}

export const destinoAuth = () =>
  !USA_FIREBASE_AUTH ? 'sesiones propias de la API' : EMULADOR ? `Firebase Auth (emulador ${EMULADOR})` : 'Firebase Auth (proyecto real)';

const auth = () => getAuth(appFirebase());

function url(servicio: 'identitytoolkit' | 'securetoken', ruta: string): string {
  const base = EMULADOR ? `http://${EMULADOR}/${servicio}.googleapis.com` : `https://${servicio}.googleapis.com`;
  return `${base}${ruta}?key=${encodeURIComponent(CLAVE_WEB)}`;
}

/** Traduce los códigos de Firebase Auth a los errores de la API, con mensajes para el vecino. */
export function errorDeFirebase(codigo: string): ErrorHttp {
  switch (codigo) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new ErrorHttp(401, 'CREDENCIALES_INVALIDAS', 'Correo o clave incorrectos.');
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new ErrorHttp(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Espera unos minutos o recupera tu clave.');
    case 'USER_DISABLED':
    case 'auth/user-disabled':
      return new ErrorHttp(403, 'CUENTA_DESACTIVADA', 'Esta cuenta está desactivada. Escríbenos si crees que es un error.');
    case 'EMAIL_EXISTS':
    case 'auth/email-already-exists':
      return new ErrorHttp(409, 'CONFLICTO', 'Ya existe una cuenta con ese correo. Inicia sesión.');
    case 'TOKEN_EXPIRED':
    case 'INVALID_REFRESH_TOKEN':
    case 'USER_NOT_FOUND':
      return new ErrorHttp(401, 'SIN_SESION', 'Tu sesión venció. Vuelve a iniciar sesión.');
    case 'WEAK_PASSWORD':
    case 'auth/invalid-password':
      return new ErrorHttp(400, 'DATOS_INVALIDOS', 'La clave no cumple los requisitos de seguridad.');
    default:
      console.error('[firebaseAuth] error no previsto:', codigo);
      return new ErrorHttp(502, 'AUTH_NO_DISPONIBLE', 'No pudimos conectar con el servicio de cuentas. Inténtalo en un momento.');
  }
}

async function llamarRest<T>(direccion: string, cuerpo: Record<string, unknown> | URLSearchParams): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(direccion, {
      method: 'POST',
      headers: { 'Content-Type': cuerpo instanceof URLSearchParams ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: cuerpo instanceof URLSearchParams ? cuerpo : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error('[firebaseAuth] sin respuesta:', error instanceof Error ? error.message : error);
    throw new ErrorHttp(502, 'AUTH_NO_DISPONIBLE', 'No pudimos conectar con el servicio de cuentas. ¿Está encendido el emulador?');
  }
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!respuesta.ok) throw errorDeFirebase((datos.error?.message ?? 'DESCONOCIDO').split(' ')[0]);
  return datos;
}

/**
 * @description Verifica correo y clave con Firebase y devuelve los tokens de la sesión.
 */
export async function ingresarConClave(correo: string, clave: string): Promise<TokensFirebase> {
  const r = await llamarRest<{ localId: string; idToken: string; refreshToken: string; expiresIn: string }>(
    url('identitytoolkit', '/v1/accounts:signInWithPassword'),
    { email: correo, password: clave, returnSecureToken: true },
  );
  return { uid: r.localId, token: r.idToken, renovacion: r.refreshToken, expiraEn: Date.now() + Number(r.expiresIn) * 1000 };
}

/**
 * @description Cambia un refresh token por un ID token nuevo (los ID tokens duran 1 hora).
 */
export async function renovarToken(renovacion: string): Promise<TokensFirebase> {
  const r = await llamarRest<{ user_id: string; id_token: string; refresh_token: string; expires_in: string }>(
    url('securetoken', '/v1/token'),
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: renovacion }),
  );
  return { uid: r.user_id, token: r.id_token, renovacion: r.refresh_token, expiraEn: Date.now() + Number(r.expires_in) * 1000 };
}

/**
 * @description Firebase envía el correo con el enlace para crear una clave nueva (en el emulador, el enlace sale en su consola).
 */
export async function enviarCorreoRecuperacion(correo: string): Promise<void> {
  await llamarRest(url('identitytoolkit', '/v1/accounts:sendOobCode'), { requestType: 'PASSWORD_RESET', email: correo });
}

/**
 * @description Firebase envía el correo para verificar la dirección del vecino.
 */
export async function enviarCorreoVerificacion(token: string): Promise<void> {
  await llamarRest(url('identitytoolkit', '/v1/accounts:sendOobCode'), { requestType: 'VERIFY_EMAIL', idToken: token });
}

/**
 * @description Verifica un ID token. Lanza 401 TOKEN_VENCIDO si expiró (la app lo renueva sola) o SIN_SESION si no vale.
 */
export async function verificarToken(token: string): Promise<DecodedIdToken> {
  try {
    return await auth().verifyIdToken(token);
  } catch (error) {
    const codigo = (error as { code?: string }).code;
    if (codigo === 'auth/id-token-expired') throw new ErrorHttp(401, 'TOKEN_VENCIDO', 'La sesión necesita renovarse.');
    throw new ErrorHttp(401, 'SIN_SESION', 'Inicia sesión para continuar.');
  }
}

/** Ejecuta una operación de firebase-admin y traduce sus errores. */
async function conAdmin<T>(accion: () => Promise<T>): Promise<T> {
  try {
    return await accion();
  } catch (error) {
    if (error instanceof ErrorHttp) throw error;
    throw errorDeFirebase((error as { code?: string }).code ?? 'DESCONOCIDO');
  }
}

export const crearCuentaAuth = (datos: { uid?: string; correo: string; clave: string; nombre: string; verificado?: boolean }) =>
  conAdmin(() =>
    auth().createUser({
      uid: datos.uid,
      email: datos.correo,
      password: datos.clave,
      displayName: datos.nombre,
      emailVerified: datos.verificado ?? false,
    }),
  );

/** null si no existe una cuenta con ese uid. */
export async function obtenerCuentaAuth(uid: string) {
  try {
    return await auth().getUser(uid);
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') return null;
    throw errorDeFirebase((error as { code?: string }).code ?? 'DESCONOCIDO');
  }
}

/** null si no existe una cuenta con ese correo. */
export async function buscarCuentaPorCorreo(correo: string) {
  try {
    return await auth().getUserByEmail(correo);
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') return null;
    throw errorDeFirebase((error as { code?: string }).code ?? 'DESCONOCIDO');
  }
}

export const cambiarClaveAuth = (uid: string, clave: string) => conAdmin(() => auth().updateUser(uid, { password: clave }));
export const actualizarNombreAuth = (uid: string, nombre: string) => conAdmin(() => auth().updateUser(uid, { displayName: nombre }));
/** Cierra todas las sesiones: sus refresh tokens dejan de servir (los ID tokens vigentes vencen en ≤ 1 h). */
export const revocarSesionesAuth = (uid: string) => conAdmin(() => auth().revokeRefreshTokens(uid));
export async function borrarCuentaAuth(uid: string): Promise<void> {
  try {
    await auth().deleteUser(uid);
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw errorDeFirebase((error as { code?: string }).code ?? '');
  }
}
