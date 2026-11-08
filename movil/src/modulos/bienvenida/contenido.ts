// Ruta: src/modulos/bienvenida/contenido.ts
// Textos del tutorial y de la guía (RF37). Lectura fácil: frases cortas, una idea por frase.
// Viven en la app, así que funcionan sin conexión.
import type { NombreIcono } from '@/compartido/ui';

export interface PasoTutorial {
  icono: NombreIcono;
  /** Íconos pequeños alrededor del principal, como ilustración. */
  acompanantes: NombreIcono[];
  titulo: string;
  texto: string;
}

export const PASOS_TUTORIAL: PasoTutorial[] = [
  {
    icono: 'home',
    acompanantes: ['groups', 'favorite', 'location_on'],
    titulo: 'Tu barrio, en tu celular',
    texto: 'Vecinos une a las personas de tu zona para ayudarse. Sin dinero de por medio y con gente cerca de ti.',
  },
  {
    icono: 'front_hand',
    acompanantes: ['edit', 'schedule', 'notifications'],
    titulo: 'Pide ayuda en segundos',
    texto: 'Escribe qué necesitas: arreglar una llave, un mandado, una herramienta. Tus vecinos reciben el aviso y te responden.',
  },
  {
    icono: 'volunteer_activism',
    acompanantes: ['build', 'handshake', 'star'],
    titulo: 'Ofrece lo que sabes hacer',
    texto: 'Elige tus oficios y verás primero lo que coincide contigo. Cada favor suma horas de ayuda a tu perfil.',
  },
  {
    icono: 'emergency',
    acompanantes: ['sms', 'shield', 'campaign'],
    titulo: 'Juntos en una emergencia',
    texto: 'Con el botón SOS avisas a tu zona. Si no hay internet, la app envía SMS. Responde «Estoy bien» para que sepan de ti.',
  },
];

export interface SeccionGuia {
  id: string;
  icono: NombreIcono;
  titulo: string;
  pasos: string[];
}

export const SECCIONES_GUIA: SeccionGuia[] = [
  {
    id: 'que-es',
    icono: 'home',
    titulo: '¿Qué es Vecinos?',
    pasos: [
      'Es una app para ayudarnos entre vecinos de la misma zona.',
      'Puedes pedir ayuda, ofrecer lo que sabes hacer y encontrar servicios cerca.',
      'En una emergencia, te ayuda a avisar y a saber quién necesita apoyo.',
    ],
  },
  {
    id: 'pedir',
    icono: 'front_hand',
    titulo: 'Cómo pedir ayuda',
    pasos: [
      'En Inicio, toca «Pedir ayuda».',
      'Elige qué tipo de ayuda necesitas y escríbelo en pocas palabras.',
      'Confirma tu ubicación. Tus vecinos cercanos recibirán el aviso.',
      'Cuando alguien acepte, verás su nombre y cuánto tarda en llegar.',
      'Al terminar, confirma que te ayudaron y califica.',
    ],
  },
  {
    id: 'ofrecer',
    icono: 'volunteer_activism',
    titulo: 'Cómo ofrecer ayuda',
    pasos: [
      'En tu perfil, elige de 1 a 5 oficios que sabes hacer.',
      'Verifica tu identidad con tu DNI y una selfie. Es necesario para ofrecer ayuda.',
      'En Inicio verás primero las necesidades que coinciden con tus oficios.',
      'Toca «Ayudar», indica en cuánto tiempo llegas y sigue los pasos.',
    ],
  },
  {
    id: 'emergencia',
    icono: 'emergency',
    titulo: 'Qué hacer en una emergencia',
    pasos: [
      'Si estás en peligro, llama primero al 105 (Policía) o al 116 (Bomberos).',
      'Toca el botón «SOS» arriba a la derecha para avisar a tu zona.',
      'Si recibes una alerta, responde «Estoy bien» o «Necesito ayuda».',
      'En el mapa de emergencia puedes ver quién necesita apoyo cerca de ti.',
    ],
  },
  {
    id: 'sin-internet',
    icono: 'sms',
    titulo: 'Sin internet',
    pasos: [
      'Lo que hagas sin señal se guarda y se envía solo cuando vuelva.',
      'Las acciones importantes, como una alerta, salen por SMS.',
      'Verás «Pendiente de enviar» con el número de acciones en espera.',
    ],
  },
  {
    id: 'seguridad',
    icono: 'shield',
    titulo: 'Tu seguridad y tus datos',
    pasos: [
      'Tus vecinos solo ven tu nombre, tu foto y tu insignia.',
      'Tu celular, correo, DNI y ubicación exacta no se publican.',
      'Busca la insignia «Identidad verificada» antes de abrir tu puerta.',
      'Si algo no te parece bien, no aceptes y avísanos.',
    ],
  },
];

/** Texto completo de una sección para leerlo en voz alta. */
export const textoParaLeer = (s: SeccionGuia) => `${s.titulo}. ${s.pasos.map((p, i) => `Paso ${i + 1}: ${p}`).join(' ')}`;
