// Ruta: src/modulos/favores/componentes/CabeceraMuro.tsx
// «En el muro» + «Cerca de ti · 3 km» (o «actualizado hace N min» sin conexión) y los filtros por tipo (RF35).
import { ChipFiltro } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FILTROS_MURO, TEXTOS_INICIO } from "../constantes";
import type { FiltroMuro } from "../tipos";

type Props = {
  filtro: FiltroMuro;
  onFiltro: (filtro: FiltroMuro) => void;
  /** Texto a la derecha del título. */
  contexto: string;
};

export function CabeceraMuro({ filtro, onFiltro, contexto }: Props) {
  const { colores } = useTema();
  return (
    <View style={styles.raiz}>
      <View style={styles.titulo}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {TEXTOS_INICIO.enElMuro}
        </Text>
        <Text style={[TIPO.pequeno, styles.contexto, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {contexto}
        </Text>
      </View>
      {/* Los filtros llegan hasta el borde de la pantalla: compensan el margen lateral de 16 dp. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        style={styles.filtros}
        contentContainerStyle={styles.filtrosContenido}
      >
        {FILTROS_MURO.map((f) => (
          <ChipFiltro key={f.valor} texto={f.texto} activo={filtro === f.valor} onPress={() => onFiltro(f.valor)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.xs },
  titulo: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: ESPACIO.s },
  contexto: { fontWeight: "500" },
  filtros: { marginHorizontal: -ESPACIO.l },
  filtrosContenido: { paddingHorizontal: ESPACIO.l, gap: ESPACIO.s },
});
