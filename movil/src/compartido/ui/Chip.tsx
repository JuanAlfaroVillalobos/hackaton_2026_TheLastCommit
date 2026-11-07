// Ruta: src/compartido/ui/Chip.tsx
// Chip informativo (tipo, oficio, estado) o seleccionable (filtros).
// Variantes informativas: `marca` (naranja suave), `neutro` (gris), `contorno` (borde de acento) y `exito`.
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icono, type NombreIcono } from "./Icono";

type Variante = "marca" | "neutro" | "contorno" | "exito";

type Props = {
  texto: string;
  variante?: Variante;
  icono?: NombreIcono;
};

export function Chip({ texto, variante = "neutro", icono }: Props) {
  const { colores, oscuro } = useTema();

  const estilos: Record<Variante, { fondo: string; texto: string; borde: string }> = {
    marca: { fondo: colores.primarioSuave, texto: oscuro ? colores.texto : colores.primarioOscuro, borde: colores.primarioSuave },
    neutro: { fondo: colores.superficieAlterna, texto: oscuro ? colores.texto : colores.textoSecundario, borde: "transparent" },
    contorno: { fondo: colores.acentoFondo, texto: oscuro ? colores.acento : colores.primarioOscuro, borde: colores.acento },
    exito: { fondo: colores.exitoFondo, texto: colores.exito, borde: colores.exitoFondo },
  };
  const e = estilos[variante];

  return (
    <View style={[styles.chip, { backgroundColor: e.fondo, borderColor: e.borde }]}>
      {icono ? <Icono nombre={icono} color={e.texto} tamano={14} /> : null}
      <Text style={[styles.texto, { color: e.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {texto}
      </Text>
    </View>
  );
}

type PropsFiltro = {
  texto: string;
  activo: boolean;
  onPress: () => void;
};

/** Chip de filtro con área táctil de 48 dp (RNF02). */
export function ChipFiltro({ texto, activo, onPress }: PropsFiltro) {
  const { colores, oscuro } = useTema();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`Filtrar: ${texto}`}
      onPress={onPress}
      style={styles.filtroArea}
    >
      <View
        style={[
          styles.filtro,
          {
            backgroundColor: activo ? colores.primarioSuave : colores.superficie,
            borderColor: activo ? (oscuro ? colores.primarioSuave : colores.acento) : colores.borde,
          },
        ]}
      >
        <Text
          style={[
            styles.textoFiltro,
            {
              color: activo ? (oscuro ? colores.texto : colores.primarioOscuro) : colores.textoSecundario,
              fontWeight: activo ? "700" : "400",
            },
          ]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {texto}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ESPACIO.xs,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: ESPACIO.s,
    paddingVertical: 2,
  },
  texto: TIPO.chip,
  filtroArea: { minHeight: TACTIL_MIN, justifyContent: "center" },
  filtro: {
    borderWidth: 1,
    borderRadius: RADIO.pildora,
    paddingHorizontal: ESPACIO.l,
    paddingVertical: ESPACIO.s,
  },
  textoFiltro: { ...TIPO.cuerpo, fontSize: 15 },
});
