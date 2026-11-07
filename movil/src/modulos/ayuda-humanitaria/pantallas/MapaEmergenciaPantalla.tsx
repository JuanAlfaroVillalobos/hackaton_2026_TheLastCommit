// Ruta: src/modulos/ayuda-humanitaria/pantallas/MapaEmergenciaPantalla.tsx
// P11 · Mapa de emergencia (RF22).
import { MapaBase, type MarcadorMapa } from "@/compartido/ui/MapaBase";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLOR_ESTADO, ETIQUETA_ESTADO, ICONO_ESTADO, TEMA_EMERGENCIA as T } from "../constantes";
import { useVecinosEmergencia } from "../hooks/useVecinosEmergencia";
import { ordenarPorUrgencia, tiempoDesde } from "../reglas";

type Props = {
  /** Botón «Reportar vulnerabilidad» (RF38). Si no se pasa, el botón no se muestra. */
  onReportar?: () => void;
};

export function MapaEmergenciaPantalla({ onReportar }: Props) {
  const { vecinos, centro, cargando, ahora } = useVecinosEmergencia();
  const ordenados = useMemo(() => ordenarPorUrgencia(vecinos), [vecinos]);

  const marcadores: MarcadorMapa[] = useMemo(
    () =>
      ordenados.map((v) => ({
        id: v.uid,
        lat: v.lat,
        lng: v.lng,
        titulo: v.nombre,
        descripcion: `${ETIQUETA_ESTADO[v.estado]} · ${tiempoDesde(v.ultimaAlertaEn, ahora)}`,
        color: COLOR_ESTADO[v.estado],
        icono: ICONO_ESTADO[v.estado],
        etiqueta: v.nombre.split(" ")[0],
      })),
    [ordenados, ahora],
  );

  return (
    <SafeAreaView style={styles.raiz} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.banner} accessibilityRole="alert">
        <Text style={styles.bannerTitulo}>⚠ MODO EMERGENCIA</Text>
        <Text style={styles.bannerTexto}>
          Publicar nuevas necesidades está deshabilitado mientras dure el modo.
        </Text>
      </View>

      <View style={styles.mapa}>
        {cargando || !centro ? (
          <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
        ) : (
          <MapaBase centro={centro} delta={0.012} marcadores={marcadores} oscuro />
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitulo}>
          {ordenados.length} {ordenados.length === 1 ? "vecino" : "vecinos"} en tu zona
        </Text>
        <FlatList
          data={ordenados}
          keyExtractor={(v) => v.uid}
          style={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>Nadie necesita ayuda por ahora.</Text>}
          renderItem={({ item }) => (
            <View style={styles.fila}>
              <View style={[styles.punto, { backgroundColor: COLOR_ESTADO[item.estado] }]}>
                <Text style={styles.puntoIcono}>{ICONO_ESTADO[item.estado]}</Text>
              </View>
              <View style={styles.filaTexto}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.detalle}>
                  {ETIQUETA_ESTADO[item.estado]} · {tiempoDesde(item.ultimaAlertaEn, ahora)}
                </Text>
              </View>
            </View>
          )}
        />
        {onReportar ? (
          <Pressable
            onPress={onReportar}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, pressed && { backgroundColor: T.primarioOscuro }]}
          >
            <Text style={styles.botonTexto}>Reportar vulnerabilidad</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  banner: { backgroundColor: T.alertaFondo, paddingHorizontal: 16, paddingVertical: 10 },
  bannerTitulo: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  bannerTexto: { color: "#FFFFFF", fontSize: 13, marginTop: 2 },
  mapa: { flex: 1 },
  cargando: { flex: 1 },
  panel: {
    backgroundColor: T.superficie,
    borderTopWidth: 1,
    borderTopColor: T.borde,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: 280,
  },
  panelTitulo: { color: T.texto, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  lista: { flexGrow: 0 },
  vacio: { color: T.textoSecundario, fontSize: 14, paddingVertical: 8 },
  fila: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  punto: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  puntoIcono: { color: "#1A0000", fontSize: 15, fontWeight: "800" },
  filaTexto: { marginLeft: 12, flex: 1 },
  nombre: { color: T.texto, fontSize: 15, fontWeight: "600" },
  detalle: { color: T.textoSecundario, fontSize: 13, marginTop: 1 },
  boton: {
    backgroundColor: T.primario,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  botonTexto: { color: T.sobrePrimario, fontSize: 16, fontWeight: "800" },
});