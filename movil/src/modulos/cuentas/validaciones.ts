// Ruta: src/modulos/cuentas/validaciones.ts
// Reglas de los formularios de cuentas (RF01, RF07). La API valida lo mismo
// (api-mock/src/modulos/auth/validaciones.ts); aquí se revisa antes para avisar campo por campo.

export const LIMITES = { nombre: 60, correo: 254, claveMin: 8, claveMax: 64 } as const;

export type CampoRegistro = 'nombre' | 'correo' | 'telefono' | 'clave' | 'confirmacion' | 'terminos';
export type ErroresFormulario<C extends string> = Partial<Record<C, string>>;

// ---------- Nombre ----------

const LETRAS = 'A-Za-zÀ-ÖØ-öø-ÿ';
const PARTE_NOMBRE = new RegExp(`^[${LETRAS}]+(?:['-][${LETRAS}]+)*$`);
const INICIAL = new RegExp(`^[${LETRAS}]\\.$`);

/**
 * @description Quita espacios sobrantes y pone mayúscula inicial: «  ana  maría » → «Ana María».
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])([a-zà-öø-ÿ])/g, (_, antes: string, letra: string) => antes + letra.toLocaleUpperCase('es'));
}

export function errorNombre(valor: string): string | undefined {
  const nombre = valor.trim().replace(/\s+/g, ' ');
  if (!nombre) return 'Escribe tu nombre y apellido.';
  if (nombre.length > LIMITES.nombre) return `Usa como máximo ${LIMITES.nombre} caracteres.`;
  const partes = nombre.split(' ');
  if (partes.some((p) => INICIAL.test(p))) {
    return 'Escribe tu apellido completo, sin abreviaturas.';
  }
  if (partes.some((p) => !PARTE_NOMBRE.test(p))) return 'Usa solo letras. Puedes incluir tildes, ñ, apóstrofo o guion.';
  if (partes.length < 2) return 'Escribe también tu apellido.';
  if (partes.filter((p) => p.replace(/['-]/g, '').length >= 2).length < 2) return 'Escribe tu nombre y apellido completos.';
  if (/(.)\1\1/i.test(nombre.replace(/\s/g, ''))) return 'Revisa tu nombre: tiene letras repetidas.';
  return undefined;
}

// ---------- Correo ----------

const CORREO = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Correos temporales: una cuenta vecinal necesita un correo que el vecino conserve. */
export const DOMINIOS_TEMPORALES = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'temp-mail.org',
  'tempmail.com', 'tempmail.net', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'emailondeck.com', 'mohmal.com', 'tempail.com',
]);

const DOMINIOS_COMUNES = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com',
  'hotmail.es', 'outlook.es', 'yahoo.es', 'msn.com', 'protonmail.com',
];

/**
 * @description Quita espacios y pasa a minúsculas.
 */
export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

export function errorCorreo(valor: string): string | undefined {
  const correo = normalizarCorreo(valor);
  if (!correo) return 'Escribe tu correo.';
  if (/\s/.test(correo)) return 'El correo no puede tener espacios.';
  if (!correo.includes('@')) return 'Falta la @ (ej.: ana@gmail.com).';
  const [local, dominio = ''] = correo.split('@');
  if (!local) return 'Falta lo que va antes de la @.';
  if (!dominio || !dominio.includes('.')) return 'Falta el dominio después de la @ (ej.: gmail.com).';
  if (correo.length > LIMITES.correo || local.length > 64) return 'El correo es demasiado largo.';
  if (local.includes('..') || dominio.includes('..')) return 'El correo no puede tener dos puntos seguidos.';
  if (!CORREO.test(correo)) return 'Revisa el correo: tiene caracteres no válidos.';
  if (DOMINIOS_TEMPORALES.has(dominio)) return 'Usa un correo permanente. No aceptamos correos temporales.';
  return undefined;
}

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/**
 * @description Si el dominio parece un error de tipeo («gmial.com», «hotmail.co»), devuelve el correo corregido.
 */
export function sugerirCorreo(valor: string): string | undefined {
  const correo = normalizarCorreo(valor);
  const [local, dominio] = correo.split('@');
  if (!local || !dominio || DOMINIOS_COMUNES.includes(dominio)) return undefined;
  let mejor: { dominio: string; d: number } | null = null;
  for (const comun of DOMINIOS_COMUNES) {
    const d = distancia(dominio, comun);
    if (d > 0 && d <= 2 && (!mejor || d < mejor.d)) mejor = { dominio: comun, d };
  }
  return mejor ? `${local}@${mejor.dominio}` : undefined;
}

// ---------- Teléfono ----------

/**
 * @description Agrupa el celular para leerlo mejor: «987654321» → «987 654 321».
 */
export const formatearTelefono = (digitos: string) => digitos.replace(/(\d{3})(?=\d)/g, '$1 ');

export function errorTelefono(digitos: string): string | undefined {
  if (!digitos) return 'Escribe tu número de celular.';
  if (digitos[0] !== '9') return 'Los celulares en Perú empiezan con 9.';
  if (digitos.length < 9) {
    const faltan = 9 - digitos.length;
    return faltan === 1 ? 'Falta 1 dígito.' : `Faltan ${faltan} dígitos.`;
  }
  if (digitos.length > 9) return 'El celular tiene 9 dígitos.';
  if (/^9(\d)\1{7}$/.test(digitos)) return 'Ese número no parece real. Escribe tu celular.';
  return undefined;
}

// ---------- Clave ----------

/** Claves que aparecen primero en las filtraciones; se rechazan aunque cumplan las reglas. */
const CLAVES_COMUNES = new Set([
  'password1', 'password123', 'passw0rd', 'contraseña1', 'contrasena1', 'qwerty123', 'qwerty1234', 'abc12345',
  'abcd1234', '1q2w3e4r', '1qaz2wsx', 'iloveyou1', 'admin123', 'welcome1', 'peru1234', 'vecinos123',
  'teamo123', 'aa123456', 'a1234567', 'p@ssw0rd', 'master123', 'sunshine1', 'football1', 'monkey123',
]);

export interface ReglaClave {
  id: 'largo' | 'minuscula' | 'mayuscula' | 'numero' | 'espacios';
  texto: string;
  cumple: boolean;
}

/**
 * @description Reglas obligatorias de la clave, para la lista en vivo debajo del campo.
 */
export function reglasClave(clave: string): ReglaClave[] {
  return [
    { id: 'largo', texto: `De ${LIMITES.claveMin} a ${LIMITES.claveMax} caracteres`, cumple: clave.length >= LIMITES.claveMin && clave.length <= LIMITES.claveMax },
    { id: 'minuscula', texto: 'Una letra minúscula', cumple: /[a-zà-ÿ]/.test(clave) },
    { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: /[A-ZÀ-Þ]/.test(clave) },
    { id: 'numero', texto: 'Un número', cumple: /\d/.test(clave) },
    { id: 'espacios', texto: 'Sin espacios', cumple: clave.length > 0 && !/\s/.test(clave) },
  ];
}

/** Datos personales que no deben aparecer en la clave. */
export interface ContextoClave {
  nombre?: string;
  correo?: string;
  telefono?: string;
}

function contieneDatosPersonales(clave: string, { nombre = '', correo = '', telefono = '' }: ContextoClave): boolean {
  const c = clave.toLowerCase();
  const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const piezas = [
    ...sinTildes(nombre.toLowerCase()).split(/\s+/),
    correo.toLowerCase().split('@')[0] ?? '',
    telefono.length >= 6 ? telefono.slice(-6) : '',
  ].filter((p) => p.length >= 4);
  return piezas.some((p) => sinTildes(c).includes(p));
}

export function errorClave(clave: string, contexto: ContextoClave = {}): string | undefined {
  if (!clave) return 'Crea una clave.';
  const pendiente = reglasClave(clave).find((r) => !r.cumple);
  if (pendiente) return `Falta: ${pendiente.texto.toLowerCase()}.`;
  if (CLAVES_COMUNES.has(clave.toLowerCase())) return 'Esa clave es muy común y fácil de adivinar. Elige otra.';
  if (/(.)\1{3}/.test(clave)) return 'No repitas el mismo carácter 4 veces seguidas.';
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|qwer/i.test(clave) && clave.length < 12) {
    return 'Evita secuencias como «1234» o «abcd», o usa 12 caracteres o más.';
  }
  if (contieneDatosPersonales(clave, contexto)) return 'No uses tu nombre, tu correo ni tu teléfono en la clave.';
  return undefined;
}

export type NivelClave = 0 | 1 | 2 | 3 | 4;

/**
 * @description Fuerza de la clave de 0 (vacía) a 4 (fuerte). Por debajo de 2 no se acepta.
 */
export function fuerzaClave(clave: string, contexto: ContextoClave = {}): { nivel: NivelClave; texto: string } {
  if (!clave) return { nivel: 0, texto: '' };
  if (errorClave(clave, contexto)) return { nivel: 1, texto: 'Débil' };
  let puntos = 0;
  if (clave.length >= 12) puntos++;
  if (clave.length >= 16) puntos++;
  if (/[^A-Za-z0-9]/.test(clave)) puntos++;
  if (new Set(clave).size >= 8) puntos++;
  if (puntos >= 3) return { nivel: 4, texto: 'Fuerte' };
  if (puntos >= 1) return { nivel: 3, texto: 'Buena' };
  return { nivel: 2, texto: 'Aceptable' };
}

// ---------- Formulario completo ----------

export type DatosFormularioRegistro = Record<Exclude<CampoRegistro, 'terminos'>, string> & { terminos: boolean };

/**
 * @description Revisa el formulario de registro y devuelve los errores por campo (vacío si todo está bien).
 */
export function validarRegistro(d: DatosFormularioRegistro): ErroresFormulario<CampoRegistro> {
  const errores: ErroresFormulario<CampoRegistro> = {
    nombre: errorNombre(d.nombre),
    correo: errorCorreo(d.correo),
    telefono: errorTelefono(d.telefono),
    clave: errorClave(d.clave, { nombre: d.nombre, correo: d.correo, telefono: d.telefono }),
    confirmacion: !d.confirmacion ? 'Repite tu clave.' : d.confirmacion !== d.clave ? 'Las claves no coinciden.' : undefined,
    terminos: d.terminos ? undefined : 'Debes aceptar la política de privacidad para crear tu cuenta.',
  };
  return Object.fromEntries(Object.entries(errores).filter(([, v]) => v)) as ErroresFormulario<CampoRegistro>;
}
