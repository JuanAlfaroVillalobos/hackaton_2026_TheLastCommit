// Ruta: src/modulos/ayuda-humanitaria/pantallas/ReportesPantalla.tsx
// Lista de reportes de vulnerabilidad con «Voy a ayudar» y «Resuelto».
// Se reutiliza dentro del tablero humanitario (E5).
import { UID_YO } from "@/simulaciones";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TarjetaReporte } from "../componentes/TarjetaReporte";
import { TEMA_EMERGENCIA as T } from "../constantes";
import { useReportes } from "../hooks/useReportes";
import { atenderReporte, resolverReporte } from "../servicios/reportesServicio";

type Props = {
  onVolver?: () => void;
  onNuevo?: () => void;
};

export function ReportesPantalla({ onVolver, onNuevo }: Props) {
  const { reportes, cargando, ahora } = useReportes();

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Reportes de vulnerabilidad</Text>
      </View>

      {cargando ? (
        <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay reportes por ahora.</Text>}
          renderItem={({ item }) => (
            <TarjetaReporte
              reporte={item}
              ahora={ahora}
              miUid={UID_YO}
              onAyudar={atenderReporte}
              onResolver={resolverReporte}
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

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  barra: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.alertaFondo },
  volver: { color: "#FFFFFF", fontSize: 24, marginRight: 14 },
  barraTitulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  cargando: { flex: 1 },
  lista: { padding: 16 },
  vacio: { color: T.textoSecundario, fontSize: 15, textAlign: "center", marginTop: 32 },
  nuevo: { backgroundColor: T.primario, margin: 16, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nuevoTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});