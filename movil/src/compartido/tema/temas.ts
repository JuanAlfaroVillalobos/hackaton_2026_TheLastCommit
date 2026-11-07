// Ruta: src/compartido/tema/temas.ts
// Tokens de los 4 temas (README, sección 8). Ningún componente usa colores fijos: todo sale de aquí
// mediante useTema(). Prioridad del tema activo: emergencia > calor > lluvia > normal (RF29).
//
// Tokens extra (no están en la sección 8, propuestos en diseno/P04-Inicio, decisión 9):
// - `exito` / `exitoFondo`: chip «Coincide con tu oficio».
// - `sos` / `sosFondo`: botón «SOS» del encabezado (#C62828 salvo en lluvia, #FF5A5F).
// - `primarioSuave`: fondo de chips activos, avatares y píldora de la pestaña activa.
// - `deshabilitado` / `sobreDeshabilitado`: botón deshabilitado por una regla (RN-04).
// - `superficieAlterna` / `acentoFondo`: fondos de chips neutros y de «Ofrezco».
// - `franja` / `sobreFranja`: franja «Sin conexión» (RNF09).

export type NombreTema = "normal" | "lluvia" | "calor" | "emergencia";

export type Tema = {
  nombre: NombreTema;
  oscuro: boolean;
  colores: {
    fondo: string;
    superficie: string;
    primario: string;
    primarioOscuro: string;
    primarioSuave: string;
    sobrePrimario: string;
    acento: string;
    texto: string;
    textoSecundario: string;
    borde: string;
    /** Fondo gris de chips neutros (oficio). */
    superficieAlterna: string;
    /** Fondo del chip «Ofrezco» (contorno de acento). */
    acentoFondo: string;
    exito: string;
    exitoFondo: string;
    sos: string;
    sosFondo: string;
    deshabilitado: string;
    sobreDeshabilitado: string;
    franja: string;
    sobreFranja: string;
    /** Texto de enlaces y «Ver detalle →». En lluvia es el acento para mantener el contraste. */
    enlace: string;
  };
  /** Icono de la barra superior para que el tema no dependa solo del color (RNF03). */
  iconoClima: "rainy" | "thermostat" | "warning" | null;
};

export const TEMAS: Record<NombreTema, Tema> = {
  normal: {
    nombre: "normal",
    oscuro: false,
    iconoClima: null,
    colores: {
      fondo: "#FAFAF9",
      superficie: "#FFFFFF",
      primario: "#C2410C",
      primarioOscuro: "#9A3412",
      primarioSuave: "#FFEDD5",
      sobrePrimario: "#FFFFFF",
      acento: "#FB923C",
      texto: "#1C1917",
      textoSecundario: "#57534E",
      borde: "#E7E5E4",
      superficieAlterna: "#F5F5F4",
      acentoFondo: "#FFF7ED",
      exito: "#1B5E20",
      exitoFondo: "#E8F5E9",
      sos: "#C62828",
      sosFondo: "#FDE2E2",
      deshabilitado: "#E7E5E4",
      sobreDeshabilitado: "#57534E",
      franja: "#1C1917",
      sobreFranja: "#FFFFFF",
      enlace: "#C2410C",
    },
  },
  lluvia: {
    nombre: "lluvia",
    oscuro: true,
    iconoClima: "rainy",
    colores: {
      fondo: "#0F1B2D",
      superficie: "#172A45",
      primario: "#4F8DF5",
      primarioOscuro: "#2C5BB8",
      primarioSuave: "#2A3F5F",
      sobrePrimario: "#0F1B2D",
      acento: "#7FD1F7",
      texto: "#E6EEF8",
      textoSecundario: "#9FB3CC",
      borde: "#2A3F5F",
      superficieAlterna: "#2A3F5F",
      acentoFondo: "transparent",
      exito: "#A5D6A7",
      exitoFondo: "#1E3A2B",
      sos: "#FF5A5F",
      sosFondo: "#2A1A24",
      deshabilitado: "#2A3F5F",
      sobreDeshabilitado: "#9FB3CC",
      franja: "#E6EEF8",
      sobreFranja: "#0F1B2D",
      enlace: "#7FD1F7",
    },
  },
  calor: {
    nombre: "calor",
    oscuro: false,
    iconoClima: "thermostat",
    colores: {
      fondo: "#FDF0E6",
      superficie: "#FFFFFF",
      primario: "#9C3D1B",
      primarioOscuro: "#6F2A12",
      primarioSuave: "#FBE1CF",
      sobrePrimario: "#FFFFFF",
      acento: "#F59E0B",
      texto: "#2A140A",
      textoSecundario: "#6B3A22",
      borde: "#F1CFB5",
      superficieAlterna: "#FBEADC",
      acentoFondo: "#FEF3C7",
      exito: "#1B5E20",
      exitoFondo: "#E8F5E9",
      sos: "#C62828",
      sosFondo: "#FDE2E2",
      deshabilitado: "#F1CFB5",
      sobreDeshabilitado: "#6B3A22",
      franja: "#2A140A",
      sobreFranja: "#FFFFFF",
      enlace: "#9C3D1B",
    },
  },
  emergencia: {
    nombre: "emergencia",
    oscuro: false,
    iconoClima: "warning",
    colores: {
      fondo: "#FFF1F1",
      superficie: "#FFFFFF",
      primario: "#C62828",
      primarioOscuro: "#8E1B1B",
      primarioSuave: "#FDE2E2",
      sobrePrimario: "#FFFFFF",
      acento: "#FFD54F",
      texto: "#2B0B0B",
      textoSecundario: "#6B2B2B",
      borde: "#F3C1C1",
      superficieAlterna: "#FDECEC",
      acentoFondo: "#FFF8E1",
      exito: "#1B5E20",
      exitoFondo: "#E8F5E9",
      sos: "#C62828",
      sosFondo: "#FDE2E2",
      deshabilitado: "#F3C1C1",
      sobreDeshabilitado: "#6B2B2B",
      franja: "#2B0B0B",
      sobreFranja: "#FFFFFF",
      enlace: "#C62828",
    },
  },
};

/** Espaciados en dp (múltiplos de 4). El margen lateral de pantalla es 16 (diseño). */
export const ESPACIO = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

/** Radios del diseño: tarjetas 16, botones 12, chips y píldoras 999. */
export const RADIO = { boton: 12, tarjeta: 16, pildora: 999 } as const;

/** Escala tipográfica (dp). El texto respeta el tamaño de letra del sistema hasta 130 % (RNF03). */
export const TIPO = {
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  seccion: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  cuerpo: { fontSize: 16, lineHeight: 22, fontWeight: "400" },
  cuerpoFuerte: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  pequeno: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  chip: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
} as const;

/** Área táctil mínima (RNF02). */
export const TACTIL_MIN = 48;

/** Límite de escalado de fuente para no romper el diseño más allá del 130 % (RNF03). */
export const MAX_ESCALA_FUENTE = 1.3;
