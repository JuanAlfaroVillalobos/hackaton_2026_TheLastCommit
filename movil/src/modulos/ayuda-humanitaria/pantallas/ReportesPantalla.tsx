// Ruta: src/modulos/ayuda-humanitaria/pantallas/ReportesPantalla.tsx
// Lista de reportes de vulnerabilidad con «Voy a ayudar» y «Resuelto».
// Se reutiliza dentro del tablero humanitario (E5).
import { useTema } from "@/compartido/tema";
import { useSesion } from "@/nucleo/sesion";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { conAviso } from "../acciones";
import { AvisoError } from "../componentes/AvisoError";
import { FiltroTipos, perteneceAFiltro, type FiltroTipo } from "../componentes/FiltroTipos";
import { TarjetaReporte } from "../componentes/TarjetaReporte";
import type { Colores } from "../estilos";
import { useReportes } from "../hooks/useReportes";
import { atenderReporte, resolverReporte } from "../servicios/reportesServicio";

type Props = {
  onVolver?: () => void;
  onNuevo?: () => void;
};

export function ReportesPantalla({ onVolver, onNuevo }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const uid = useSesion().usuario?.uid ?? "";
  const { reportes, cargando, error, ahora } = useReportes();
  const [tipo, setTipo] = useState<FiltroTipo>("TODOS");
  const visibles = useMemo(
    () => (reportes.filter((r) => perteneceAFiltro(r, tipo))),
    [reportes, tipo],
  );

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Reportes de vulnerabilidad</Text>
      </View>

      <FiltroTipos reportes={reportes} valor={tipo} onCambiar={setTipo} />

      {error ? <AvisoError mensaje={error} /> : null}
      {cargando ? (
        <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay reportes por ahora.</Text>}
          renderItem={({ item }) => (
            <TarjetaReporte
              reporte={item}
              ahora={ahora}
              miUid={uid}
              onAyudar={(id) => conAviso(() => atenderReporte(id))}
              onResolver={(id) => conAviso(() => resolverReporte(id))}
            />
          )}
        />
      )}

      {onNuevo ? (
        <Pressable accessibilityRole="button" style={styles.nuevo} onPress={onNuevo}>
          <Text style={styles.nuevoTexto}>Reportar vulnerabilidad</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  barra: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.sos },
  volver: { color: "#FFFFFF", fontSize: 24, marginRight: 14 },
  barraTitulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  cargando: { flex: 1 },
  lista: { padding: 16 },
  vacio: { color: T.textoSecundario, fontSize: 15, textAlign: "center", marginTop: 32 },
  nuevo: { backgroundColor: T.primario, margin: 16, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nuevoTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});