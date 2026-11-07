import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { StyleSheet, Text, View } from 'react-native';

/**
 * @description Línea divisoria con un texto al centro, p. ej. «o» entre el ingreso con clave y con Google.
 */
export function Separador({ texto = 'o' }: { texto?: string }) {
  const { colores } = useTema();

  return (
    <View style={styles.fila} importantForAccessibility="no-hide-descendants">
      <View style={[styles.linea, { backgroundColor: colores.borde }]} />
      <Text style={[styles.texto, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {texto}
      </Text>
      <View style={[styles.linea, { backgroundColor: colores.borde }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  linea: { flex: 1, height: 1 },
  texto: TIPO.pequeno,
});
