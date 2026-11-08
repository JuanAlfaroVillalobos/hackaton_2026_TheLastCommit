// Ruta: src/modulos/cuentas/servicios/fotoPerfil.ts
// Foto de perfil (RF06): la app la recorta cuadrada y la reduce a 512×512 antes de subirla.
import { api } from '@/nucleo/api';
import { elegirOrigenYObtenerFoto } from '@/nucleo/imagenes';

/**
 * @description Pide la foto (cámara o galería) y la sube. Devuelve false si el vecino canceló.
 */
export async function cambiarFotoPerfil(): Promise<boolean> {
  const foto = await elegirOrigenYObtenerFoto({ cuadrada: true, ladoMax: 512, calidad: 0.8 });
  if (!foto) return false;
  await api('/vecinos/yo/foto', { metodo: 'PUT', cuerpo: { imagen: foto.dataUri } });
  return true;
}

export const quitarFotoPerfil = () => api('/vecinos/yo/foto', { metodo: 'DELETE' });
