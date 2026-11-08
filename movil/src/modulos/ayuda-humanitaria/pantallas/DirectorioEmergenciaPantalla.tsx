// Ruta: src/modulos/ayuda-humanitaria/pantallas/DirectorioEmergenciaPantalla.tsx
// P23 · Directorio de emergencia y grupos de apoyo (RF40): buscar, llamar y abrir WhatsApp.
import type { Colores } from "../estilos";
import { useTema } from "@/compartido/tema";
import { useSesion } from "@/nucleo/sesion";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoError } from "../componentes/AvisoError";
import { TarjetaFicha } from "../componentes/TarjetaFicha";
import { ETIQUETA_TIPO_FICHA, TIPOS_FICHA } from "../constantesDirectorio";
import { enlaceLlamar, enlaceWhatsApp, fichasVisibles, filtrarFichas, type FiltroFicha } from "../directorio";
import { useDirectorio } from "../hooks/useDirectorio";

type Props = {
  onVolver?: () => void;
  /** Botón «Proponer ficha». Si no se pasa, no se muestra. */
  onProponer?: () => void;
};

const FILTROS: { valor: FiltroFicha; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos" },
  ...TIPOS_FICHA.map((t) => ({ valor: t as FiltroFicha, etiqueta: ETIQUETA_TIPO_FICHA[t] })),
];

export function DirectorioEmergenciaPantalla({ onVolver, onProponer }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const uid = useSesion().usuario?.uid ?? "";
  const { fichas, cargando, error: errorCarga } = useDirectorio();
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<FiltroFicha>("TODOS");
  const [error, setError] = useState<string | null>(null);

  const visibles = useMemo(
    () => filtrarFichas(fichasVisibles(fichas, uid), texto, filtro),
    [fichas, texto, filtro],
  );

  async function abrir(url: string) {
    setError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setError("No se pudo abrir en este dispositivo.");
    }
  }

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Directorio de emergencia</Text>
      </View>

      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Buscar por nombre o dirección"
        placeholderTextColor={T.textoSecundario}
        style={styles.buscador}
        autoCorrect={false}
        accessibilityLabel="Buscar en el directorio"
      />

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => {
            const activo = filtro === f.valor;
            return (
              <Pressable
                key={f.valor}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setFiltro(f.valor)}
                style={[styles.filtro, activo && styles.filtroActivo]}
              >
                <Text style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}>{f.etiqueta}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {errorCarga ? <AvisoError mensaje={errorCarga} /> : null}
      {cargando ? (
        <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.vacio}>No se encontró ninguna ficha.</Text>}
          renderItem={({ item }) => (
            <TarjetaFicha
              ficha={item}
              onLlamar={(tel) => abrir(enlaceLlamar(tel))}
              onWhatsApp={(num) => abrir(enlaceWhatsApp(num))}
            />
          )}
        />
      )}

      {onProponer ? (
        <Pressable accessibilityRole="button" style={styles.nuevo} onPress={onProponer}>
          <Text style={styles.nuevoTexto}>Proponer ficha</Text>
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
  buscador: {
    color: T.texto,
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  filtros: { paddingHorizontal: 16, paddingVertical: 12 },
  filtro: { borderColor: T.borde, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filtroActivo: { backgroundColor: T.primarioSuave, borderColor: T.primario },
  filtroTexto: { color: T.textoSecundario, fontSize: 13, fontWeight: "700" },
  filtroTextoActivo: { color: T.texto },
  error: { color: T.primario, fontSize: 14, fontWeight: "700", marginHorizontal: 16, marginBottom: 4 },
  cargando: { flex: 1 },
  lista: { padding: 16 },
  vacio: { color: T.textoSecundario, fontSize: 15, textAlign: "center", marginTop: 32 },
  nuevo: { backgroundColor: T.primario, margin: 16, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nuevoTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});
