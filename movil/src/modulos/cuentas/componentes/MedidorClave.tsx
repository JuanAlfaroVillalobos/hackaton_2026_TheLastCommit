import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Icono } from '@/compartido/ui';
import { StyleSheet, Text, View } from 'react-native';
import { fuerzaClave, reglasClave, type ContextoClave } from '../validaciones';

type Props = { clave: string; contexto?: ContextoClave };

/**
 * @description Barra de fuerza de la clave y lista de reglas que se marcan en vivo mientras se escribe.
 */
export function MedidorClave({ clave, contexto }: Props) {
  const { colores } = useTema();
  const { nivel, texto } = fuerzaClave(clave, contexto);
  const reglas = reglasClave(clave);
  const colorNivel = [colores.borde, colores.sos, colores.acento, colores.exito, colores.exito][nivel];

  return (
    <View style={styles.raiz}>
      {clave ? (
        <View
          style={styles.fila}
          accessible
          accessibilityLabel={`Seguridad de la clave: ${texto}`}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.barras}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[styles.barra, { backgroundColor: n <= nivel ? colorNivel : colores.borde }]} />
            ))}
          </View>
          <Text style={[TIPO.pequeno, styles.nivel, { color: colorNivel }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {texto}
          </Text>
        </View>
      ) : null}

      <View style={styles.reglas}>
        {reglas.map((r) => (
          <View
            key={r.id}
            style={styles.regla}
            accessible
            accessibilityLabel={`${r.texto}: ${r.cumple ? 'cumple' : 'pendiente'}`}
          >
            <Icono
              nombre={r.cumple ? 'check_circle' : 'radio_button_unchecked'}
              color={r.cumple ? colores.exito : colores.textoSecundario}
              tamano={16}
            />
            <Text
              style={[TIPO.pequeno, { color: r.cumple ? colores.exito : colores.textoSecundario }]}
              maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            >
              {r.texto}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.s },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  barras: { flex: 1, flexDirection: 'row', gap: ESPACIO.xs },
  barra: { flex: 1, height: 6, borderRadius: 3 },
  nivel: { fontWeight: '700', minWidth: 72, textAlign: 'right' },
  reglas: { flexDirection: 'row', flexWrap: 'wrap', columnGap: ESPACIO.m, rowGap: ESPACIO.xs },
  regla: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.xs, minWidth: '45%' },
});
