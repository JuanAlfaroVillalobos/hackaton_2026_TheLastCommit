import { MAX_ESCALA_FUENTE, useTema } from '@/compartido/tema';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  nombre: string;
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
 * @description Avatar circular con iniciales (RF06: se muestran si el vecino no tiene foto).
 */
export function Avatar({ nombre, tamano = 48, solido = false }: Props) {
  const { colores, oscuro } = useTema();

  return (
    <View
      accessible
      accessibilityLabel={`Avatar de ${nombre}`}
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
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  texto: { fontWeight: '700' },
});
