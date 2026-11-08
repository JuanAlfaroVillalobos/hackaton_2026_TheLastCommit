import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono, type NombreIcono } from '@/compartido/ui';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  uri: string | null;
  /** Proporción de la vista previa: 1.58 para el DNI (tarjeta), 0.8 para la selfie. */
  proporcion: number;
  iconoVacio: NombreIcono;
  textoBoton: string;
  consejos: string[];
  error?: string;
  onTomar: () => void;
};

/**
 * @description Vista previa de una foto de identidad con consejos para tomarla bien y botón para tomarla o repetirla.
 */
export function CapturaFoto({ uri, proporcion, iconoVacio, textoBoton, consejos, error, onTomar }: Props) {
  const { colores } = useTema();

  return (
    <View style={styles.raiz}>
      <View
        style={[
          styles.marco,
          { aspectRatio: proporcion, borderColor: error ? colores.sos : uri ? colores.exito : colores.borde },
          { backgroundColor: colores.superficieAlterna },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Vista previa de la foto" />
        ) : (
          <Icono nombre={iconoVacio} color={colores.textoSecundario} tamano={48} />
        )}
        {uri ? (
          <View style={[styles.sello, { backgroundColor: colores.exito }]}>
            <Icono nombre="check" color={colores.superficie} tamano={16} />
          </View>
        ) : null}
      </View>

      {!uri ? (
        <View style={styles.consejos}>
          {consejos.map((c) => (
            <View key={c} style={styles.consejo}>
              <Icono nombre="check_small" color={colores.textoSecundario} tamano={18} />
              <Text style={[TIPO.pequeno, styles.flex, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {c}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {error ? (
        <View style={styles.consejo} accessibilityLiveRegion="polite">
          <Icono nombre="error" color={colores.sos} tamano={16} />
          <Text style={[TIPO.pequeno, styles.flex, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {error}
          </Text>
        </View>
      ) : null}

      <Boton texto={uri ? 'Tomar otra vez' : textoBoton} icono="photo_camera" variante="secundario" onPress={onTomar} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.m },
  marco: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIO.tarjeta,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sello: {
    position: 'absolute',
    top: ESPACIO.s,
    right: ESPACIO.s,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consejos: { gap: ESPACIO.xs },
  consejo: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.xs },
  flex: { flex: 1 },
});
