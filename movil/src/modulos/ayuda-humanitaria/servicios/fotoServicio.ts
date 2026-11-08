// Ruta: src/modulos/ayuda-humanitaria/servicios/fotoServicio.ts
// Foto opcional del reporte de vulnerabilidad (RF38). Solo con internet.
// La foto SIEMPRE se comprime en el código antes de enviarla: aunque la cámara entregue 4 MB o más, aquí se achica
// el lado mayor y se recodifica en JPEG hasta que cabe en el límite de la API de prueba (~60 KB).
import { api } from "@/nucleo/api";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type OrigenFoto = "camara" | "galeria";

/** Tope del base64 (la API de prueba acepta cuerpos de 100 kb). */
const MAX_BASE64 = 85_000;
/** Lado mayor en píxeles y calidad JPEG. Si la primera no cabe, se prueba cada vez más chica. */
const INTENTOS = [
  { lado: 640, calidad: 0.5 },
  { lado: 520, calidad: 0.4 },
  { lado: 420, calidad: 0.3 },
  { lado: 320, calidad: 0.2 },
];

/** Abre la cámara o la galería y devuelve la foto en JPEG base64 (sin prefijo), o null si se canceló o se negó el permiso. */
export async function elegirFoto(origen: OrigenFoto): Promise<string | null> {
  if (origen === "camara") {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return null;
  }
  const abrir = origen === "camara" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const resultado = await abrir({ mediaTypes: ["images"], quality: 0.5, allowsEditing: false, exif: false });
  const asset = resultado.canceled ? null : resultado.assets[0];
  if (!asset?.uri) return null;
  const vertical = (asset.height ?? 0) > (asset.width ?? 0);

  for (const { lado, calidad } of INTENTOS) {
    // Se limita el lado mayor (en fotos verticales, el alto) y se conserva la proporción.
    const achicada = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: vertical ? { height: lado } : { width: lado } }], {
      compress: calidad,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (achicada.base64 && achicada.base64.length <= MAX_BASE64) return achicada.base64;
  }
  return null;
}

const copias = new Map<string, string>();

/** Foto de un reporte como dato `data:` listo para <Image>. Se guarda para no pedirla otra vez. */
export async function obtenerFotoReporte(id: string): Promise<string | null> {
  const guardada = copias.get(id);
  if (guardada) return guardada;
  try {
    const { foto } = await api<{ foto: string }>(`/ayuda-humanitaria/reportes/${id}/foto`);
    const uri = `data:image/jpeg;base64,${foto}`;
    copias.set(id, uri);
    return uri;
  } catch {
    return null;
  }
}