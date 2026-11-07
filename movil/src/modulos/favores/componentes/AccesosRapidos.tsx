// Ruta: src/modulos/favores/componentes/AccesosRapidos.tsx
// Cuadrícula 2 × 2 de accesos (README, sección 7). Icono de Favores: mano con corazón (decisión 3).
import { Icono, Tarjeta, type NombreIcono } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { StyleSheet, Text, View } from "react-native";

export type AccesoRapido = { id: string; texto: string; icono: NombreIcono; onPress: () => void };

type Props = { accesos: AccesoRapido[] };

export function AccesosRapidos({ accesos }: Props) {
  const { colores, oscuro } = useTema();
  return (
    <View style={styles.cuadricula}>
      {accesos.map((a) => (
        <View key={a.id} style={styles.celda}>
          <Tarjeta onPress={a.onPress} accessibilityLabel={a.texto} style={styles.tarjeta}>
            <Icono nombre={a.icono} color={oscuro ? colores.acento : colores.primario} tamano={26} />
            <Text
              style={[styles.texto, { color: colores.texto }]}
              numberOfLines={2}
              maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            >
              {a.texto}
            </Text>
          </Tarjeta>
        </View>
      ))}
    </View>
  );
}

/** Mitad del espacio entre tarjetas (12 dp): cada celda lo aplica a sus lados. */
const MEDIO_HUECO = ESPACIO.m / 2;

const styles = StyleSheet.create({
  cuadricula: { flexDirection: "row", flexWrap: "wrap", margin: -MEDIO_HUECO },
  celda: { width: "50%", padding: MEDIO_HUECO },
  tarjeta: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIO.m,
    paddingVertical: ESPACIO.m,
  },
  texto: { ...TIPO.cuerpoFuerte, fontSize: 17, flexShrink: 1 },
});
