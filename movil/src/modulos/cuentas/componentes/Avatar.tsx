import { MAX_ESCALA_FUENTE, useTema } from '@/compartido/tema';
import { urlApi } from '@/nucleo/api';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  nombre: string;
  /** Ruta de la API («/avatares/u00?v=…») o URL completa. Sin foto se muestran las iniciales. */
  fotoUrl?: string | null;
  tamano?: number;
  /** Fondo sólido de marca (tarjeta de perfil) en lugar del naranja suave. */
  solido?: boolean;
};

/**
 * @description Devuelve hasta dos iniciales del nombre, p. ej. «Ana Morales» → «AM».
 */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] ?? '?').slice(0, 2);
  return letras.toUpperCase();
}

/**
 * @description Avatar circular con la foto del vecino (RF06) o sus iniciales si no tiene o no carga.
 */
export function Avatar({ nombre, fotoUrl, tamano = 48, solido = false }: Props) {
  const { colores, oscuro } = useTema();
  const [fallo, setFallo] = useState<string | null>(null);
  const conFoto = Boolean(fotoUrl) && fallo !== fotoUrl;

  return (
    <View
      accessible
      accessibilityLabel={conFoto ? `Foto de ${nombre}` : `Avatar de ${nombre}`}
      style={[
        styles.circulo,
        {
          width: tamano,
          height: tamano,
          borderRadius: tamano / 2,
          backgroundColor: solido ? colores.acento : colores.primarioSuave,
        },
      ]}
    >
      {conFoto ? (
        <Image
          source={{ uri: urlApi(fotoUrl!) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFallo(fotoUrl ?? null)}
        />
      ) : (
        <Text
          style={[
            styles.texto,
            {
              fontSize: tamano * 0.38,
              color: solido ? colores.texto : oscuro ? colores.texto : colores.primarioOscuro,
            },
          ]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {iniciales(nombre)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  texto: { fontWeight: '700' },
});
