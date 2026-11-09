import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Icono } from '@/compartido/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { volver } from '@/nucleo/navegacion';

type Props = {
  etiqueta?: string;
  titulo: string;
  subtitulo?: string;
  /** Muestra la flecha «Volver» arriba del título. */
  conVolver?: boolean;
};

/**
 * @description Cabecera de pantalla del diseño del equipo: etiqueta en mayúsculas, título grande y subtítulo.
 */
export function Titular({ etiqueta, titulo, subtitulo, conVolver = false }: Props) {
  const { colores } = useTema();

  return (
    <View style={styles.raiz}>
      {conVolver ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => volver()}
          hitSlop={12}
          style={styles.volver}
        >
          <Icono nombre="arrow_back" color={colores.texto} tamano={26} />
        </Pressable>
      ) : null}
      {etiqueta ? (
        <Text style={[styles.etiqueta, { color: colores.primario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {etiqueta.toUpperCase()}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[styles.titulo, { color: colores.texto }]}
        maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
      >
        {titulo}
      </Text>
      {subtitulo ? (
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.xs },
  volver: { alignSelf: 'flex-start', minHeight: 48, minWidth: 48, justifyContent: 'center', marginBottom: ESPACIO.xs },
  etiqueta: { ...TIPO.chip, letterSpacing: 1 },
  titulo: { ...TIPO.titulo, fontSize: 30, lineHeight: 36 },
  subtitulo: { ...TIPO.cuerpo, marginTop: ESPACIO.xs },
});
