// Ruta: src/nucleo/imagenes/index.ts
// Captura de fotos para perfil (RF06) e identidad (RF36): pide el permiso, abre la cámara o la galería,
// reduce la imagen y la entrega como data URI lista para enviar a la API.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

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
  const permiso =
    origen === 'camara'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    avisarSinPermiso(origen);
    return null;
  }

  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: cuadrada,
    aspect: cuadrada ? [1, 1] : undefined,
    quality: 1,
    exif: false,
    cameraType: camaraFrontal ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
  };
  const resultado =
    origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  if (resultado.canceled || !resultado.assets[0]) return null;

  const original = resultado.assets[0];
  const horizontal = original.width >= original.height;
  const contexto = ImageManipulator.manipulate(original.uri);
  if (Math.max(original.width, original.height) > ladoMax) {
    contexto.resize(horizontal ? { width: ladoMax } : { height: ladoMax });
  }
  const imagen = await contexto.renderAsync();
  const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: calidad, base64: true });
  if (!guardada.base64) return null;

  return {
    uri: guardada.uri,
    dataUri: `data:image/jpeg;base64,${guardada.base64}`,
    ancho: guardada.width,
    alto: guardada.height,
  };
}

/**
 * @description Pregunta si usar la cámara o la galería y devuelve la foto elegida (o null).
 */
export function elegirOrigenYObtenerFoto(opciones: Omit<OpcionesFoto, 'origen'>, titulo = 'Foto de perfil'): Promise<FotoLista | null> {
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      '¿De dónde quieres tomarla?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(null) },
        { text: 'Galería', onPress: () => void obtenerFoto({ ...opciones, origen: 'galeria' }).then(resolver, () => resolver(null)) },
        { text: 'Cámara', onPress: () => void obtenerFoto({ ...opciones, origen: 'camara' }).then(resolver, () => resolver(null)) },
      ],
      { cancelable: true, onDismiss: () => resolver(null) },
    );
  });
}
