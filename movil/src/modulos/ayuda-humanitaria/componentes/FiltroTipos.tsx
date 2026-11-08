// Ruta: src/modulos/ayuda-humanitaria/componentes/FiltroTipos.tsx
// Botones grandes en 2 columnas para ver un grupo de reportes. Tocar el botón activo vuelve a mostrar todo.
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Colores } from "../estilos";
import type { ReporteVulnerabilidad, TipoVulnerabilidad } from "../tipos";

export type GrupoReporte = "URGENCIAS" | "VULNERABLES" | "VIVIENDA_AGUA" | "OTROS";
export type FiltroTipo = GrupoReporte | "TODOS";

const GRUPOS: { valor: GrupoReporte; icono: string; texto: string; tipos: TipoVulnerabilidad[] }[] = [
  { valor: "URGENCIAS", icono: "🩹", texto: "Heridos", tipos: ["HERIDO"] },
  { valor: "VULNERABLES", icono: "👶", texto: "Niños y adultos mayores", tipos: ["NINOS_SOLOS", "ADULTO_MAYOR_O_DISCAPACIDAD"] },
  { valor: "VIVIENDA_AGUA", icono: "🏚️", texto: "Vivienda y agua", tipos: ["VIVIENDA_DANADA", "SIN_AGUA_ALIMENTOS"] },
  { valor: "OTROS", icono: "📝", texto: "Otros", tipos: ["OTRO"] },
];

/** ¿El reporte entra en el filtro elegido? «TODOS» deja pasar todo. */
export function perteneceAFiltro(r: ReporteVulnerabilidad, f: FiltroTipo): boolean {
  if (f === "TODOS") return true;
  return GRUPOS.find((g) => g.valor === f)?.tipos.includes(r.tipo) ?? false;
}

type Props = {
  reportes: ReporteVulnerabilidad[];
  valor: FiltroTipo;
  onCambiar: (v: FiltroTipo) => void;
};

export function FiltroTipos({ reportes, valor, onCambiar }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);

  return (
    <View style={styles.fila}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: valor === "TODOS" }}
        accessibilityLabel={`Todos, ${reportes.length}`}
        onPress={() => onCambiar("TODOS")}
        style={[styles.boton, styles.botonTodos, valor === "TODOS" && styles.botonActivo]}
      >
        <Text style={styles.icono}>📋</Text>
        <Text style={[styles.texto, valor === "TODOS" && styles.textoActivo]}>Todos</Text>
        <Text style={[styles.cuenta, valor === "TODOS" && styles.textoActivo]}>{reportes.length}</Text>
      </Pressable>
      {GRUPOS.map((g) => {
        const activo = valor === g.valor;
        const n = reportes.filter((r) => g.tipos.includes(r.tipo)).length;
        return (
          <Pressable
            key={g.valor}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${g.texto}, ${n}`}
            onPress={() => onCambiar(activo ? "TODOS" : g.valor)}
            style={[styles.boton, activo && styles.botonActivo]}
          >
            <Text style={styles.icono}>{g.icono}</Text>
            <Text style={[styles.texto, activo && styles.textoActivo]} numberOfLines={2}>
              {g.texto}
            </Text>
            <Text style={[styles.cuenta, activo && styles.textoActivo]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
    fila: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    boton: {
      width: "48.5%",
      minHeight: 60,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.borde,
      backgroundColor: T.superficie,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    botonTodos: { width: "100%", minHeight: 52 },
    botonActivo: { backgroundColor: T.primarioSuave, borderColor: T.primario },
    icono: { fontSize: 24 },
    texto: { color: T.textoSecundario, fontSize: 13, fontWeight: "700", flex: 1 },
    textoActivo: { color: T.texto },
    cuenta: { color: T.textoSecundario, fontSize: 14, fontWeight: "800" },
  });