// Ruta: src/nucleo/imagenes/index.ts
// Captura de fotos para perfil (RF06) e identidad (RF36): pide el permiso, abre la cámara o la galería,
// reduce la imagen y la entrega como data URI lista para enviar a la API.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

const ES_WEB = Platform.OS === 'web';

/** Error con un mensaje listo para mostrar al vecino. */
export class ErrorFoto extends Error {}

/** En Android, abrir la galería mientras el diálogo anterior aún se cierra a veces no hace nada. */
const esperarDialogo = () => new Promise<void>((resolver) => setTimeout(resolver, ES_WEB ? 0 : 350));

export interface FotoLista {
  /** Archivo local, para mostrarla antes de enviar. */
  uri: string;
  /** «data:image/jpeg;base64,…» para la API. */
  dataUri: string;
  ancho: number;
  alto: number;
}

export interface OpcionesFoto {
  origen: 'camara' | 'galeria';
  /** Solo cámara: frontal para la selfie. */
  camaraFrontal?: boolean;
  /** Recorte cuadrado (avatar). */
  cuadrada?: boolean;
  /** Lado mayor en px tras reducir. */
  ladoMax?: number;
  /** Calidad JPEG de 0 a 1. */
  calidad?: number;
}

/**
 * @description Avisa que falta el permiso y ofrece abrir Ajustes (RF06: «Sin permiso para acceder a tus fotos…»).
 */
function avisarSinPermiso(origen: OpcionesFoto['origen']): void {
  Alert.alert(
    origen === 'camara' ? 'Sin permiso para usar la cámara' : 'Sin permiso para acceder a tus fotos',
    'Puedes darlo en Ajustes.',
    [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Ir a Ajustes', onPress: () => void Linking.openSettings() },
    ],
  );
}

/**
 * @description Toma o elige una foto y la devuelve reducida en JPEG. Devuelve null si el vecino cancela o niega el permiso.
 */
export async function obtenerFoto({
  origen,
  camaraFrontal = false,
  cuadrada = false,
  ladoMax = 1280,
  calidad = 0.7,
}: OpcionesFoto): Promise<FotoLista | null> {
  // La galería no necesita permiso (el selector del sistema ya es privado); la cámara sí.
  if (origen === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      avisarSinPermiso(origen);
      return null;
    }
  }

  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: cuadrada,
    aspect: cuadrada ? [1, 1] : undefined,
    // Calidad media desde el origen: una foto a máxima calidad ocupa muchos MB y en teléfonos con poca RAM
    // puede cerrar la app mientras se procesa.
    quality: 0.6,
    exif: false,
    cameraType: camaraFrontal ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
  };
  let resultado: ImagePicker.ImagePickerResult;
  try {
    resultado =
      origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  } catch (error) {
    console.warn('[imagenes] no se abrió el selector:', error);
    throw new ErrorFoto(origen === 'camara' ? 'No pudimos abrir la cámara. Prueba con la galería.' : 'No pudimos abrir tu galería.');
  }
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return reducir(resultado.assets[0], ladoMax, calidad);
}

/**
 * @description Reduce la foto elegida y la convierte a JPEG en base64. Lanza ErrorFoto si no se puede procesar.
 */
async function reducir(original: ImagePicker.ImagePickerAsset, ladoMax: number, calidad: number): Promise<FotoLista> {
  try {
    const ancho = original.width || ladoMax;
    const alto = original.height || ladoMax;
    const contexto = ImageManipulator.manipulate(original.uri);
    if (Math.max(ancho, alto) > ladoMax) {
      contexto.resize(ancho >= alto ? { width: ladoMax } : { height: ladoMax });
    }
    const imagen = await contexto.renderAsync();
    const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: calidad, base64: true });
    if (!guardada.base64) throw new Error('sin base64');
    // En la web saveAsync puede devolver el data URI completo en lugar de solo el base64.
    const base64 = guardada.base64.replace(/^data:[^,]+,/, '');
    return {
      uri: guardada.uri,
      dataUri: `data:image/jpeg;base64,${base64}`,
      ancho: guardada.width,
      alto: guardada.height,
    };
  } catch (error) {
    if (error instanceof ErrorFoto) throw error;
    console.warn('[imagenes] no se pudo reducir la foto:', error);
    throw new ErrorFoto('No pudimos procesar esa foto. Prueba con otra o tómala con la cámara.');
  }
}

/**
 * @description Pregunta si usar la cámara o la galería y devuelve la foto elegida (o null).
 */
export function elegirOrigenYObtenerFoto(opciones: Omit<OpcionesFoto, 'origen'>, titulo = 'Foto de perfil'): Promise<FotoLista | null> {
  // En la web no hay cámara del sistema: se abre directo el selector de archivos.
  if (ES_WEB) return obtenerFoto({ ...opciones, origen: 'galeria' });
  return new Promise((resolver, rechazar) => {
    let elegido = false;
    const usar = (origen: OpcionesFoto['origen']) => {
      elegido = true;
      void esperarDialogo()
        .then(() => obtenerFoto({ ...opciones, origen }))
        .then(resolver, rechazar);
    };
    Alert.alert(
      titulo,
      '¿De dónde quieres tomarla?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(null) },
        { text: 'Galería', onPress: () => usar('galeria') },
        { text: 'Cámara', onPress: () => usar('camara') },
      ],
      { cancelable: true, onDismiss: () => !elegido && resolver(null) },
    );
  });
}