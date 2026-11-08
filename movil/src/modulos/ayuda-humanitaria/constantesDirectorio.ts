// Ruta: src/modulos/ayuda-humanitaria/constantesDirectorio.ts
// Textos e iconos del directorio de emergencia (RF40). Si se agrega un tipo de ficha, solo se toca aquí y en tipos.ts.
import type { TipoFichaDirectorio } from "./tipos";

/** Orden en que se muestran los tipos (también es el orden de los filtros). */
export const TIPOS_FICHA: TipoFichaDirectorio[] = [
  "BOMBEROS",
  "SERENAZGO",
  "COMISARIA",
  "CENTRO_SALUD",
  "BRIGADA",
  "OLLA_COMUN",
  "GRUPO_WHATSAPP",
];

export const ETIQUETA_TIPO_FICHA: Record<TipoFichaDirectorio, string> = {
  BOMBEROS: "Bomberos",
  SERENAZGO: "Serenazgo",
  COMISARIA: "Comisaría",
  CENTRO_SALUD: "Centro de salud",
  BRIGADA: "Brigada vecinal",
  OLLA_COMUN: "Olla común",
  GRUPO_WHATSAPP: "Grupo de WhatsApp",
};

export const ICONO_TIPO_FICHA: Record<TipoFichaDirectorio, string> = {
  BOMBEROS: "🚒",
  SERENAZGO: "🛡️",
  COMISARIA: "🚓",
  CENTRO_SALUD: "🏥",
  BRIGADA: "🦺",
  OLLA_COMUN: "🍲",
  GRUPO_WHATSAPP: "💬",
};
