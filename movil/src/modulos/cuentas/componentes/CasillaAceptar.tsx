import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from '@/compartido/tema';
import { Icono } from '@/compartido/ui';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  marcada: boolean;
  onCambiar: (marcada: boolean) => void;
  children: ReactNode;
  error?: string;
};

/**
 * @description Casilla de aceptación (política de privacidad) con área táctil grande y mensaje de error.
 */
export function CasillaAceptar({ marcada, onCambiar, children, error }: Props) {
  const { colores } = useTema();
  const colorCaja = error ? colores.sos : marcada ? colores.primario : colores.borde;

  return (
    <View style={styles.raiz}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada }}
        accessibilityHint={error}
        onPress={() => onCambiar(!marcada)}
        style={styles.fila}
        hitSlop={8}
      >
        <View
          style={[
            styles.caja,
            { borderColor: colorCaja, backgroundColor: marcada ? colores.primario : colores.superficie },
          ]}
        >
          {marcada ? <Icono nombre="check" color={colores.sobrePrimario} tamano={18} /> : null}
        </View>
        <Text style={[TIPO.pequeno, styles.texto, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {children}
        </Text>
      </Pressable>
      {error ? (
        <View style={styles.mensaje} accessibilityLiveRegion="polite">
          <Icono nombre="error" color={colores.sos} tamano={16} />
          <Text style={[TIPO.pequeno, styles.texto, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.s },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m, minHeight: TACTIL_MIN },
  caja: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: RADIO.boton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { flex: 1 },
  mensaje: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.xs },
});
