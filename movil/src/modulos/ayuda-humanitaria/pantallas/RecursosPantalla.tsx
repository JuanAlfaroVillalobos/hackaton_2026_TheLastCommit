// Ruta: src/modulos/ayuda-humanitaria/pantallas/RecursosPantalla.tsx
// Lista de recursos críticos (RF39) con filtro Ofrezco / Necesito. Se reutiliza dentro del tablero humanitario (E5).
import type { Colores } from "../estilos";
import { useTema } from "@/compartido/tema";
import { useSesion } from "@/nucleo/sesion";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { conAviso } from "../acciones";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoError } from "../componentes/AvisoError";
import { TarjetaRecurso } from "../componentes/TarjetaRecurso";
import { ETIQUETA_MODO_RECURSO, MODOS_RECURSO } from "../constantesRecursos";
import { useRecursos } from "../hooks/useRecursos";
import { filtrarRecursos, type FiltroRecursos } from "../reglas";
import { asignarRecurso, cerrarRecurso } from "../servicios/recursosServicio";

type Props = {
  onVolver?: () => void;
  onPublicar?: () => void;
};

const FILTROS: { valor: FiltroRecursos; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos" },
  ...MODOS_RECURSO.map((m) => ({ valor: m as FiltroRecursos, etiqueta: ETIQUETA_MODO_RECURSO[m] })),
];

export function RecursosPantalla({ onVolver, onPublicar }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const uid = useSesion().usuario?.uid ?? "";
  const { recursos, cargando, error, ahora } = useRecursos();
  const [filtro, setFiltro] = useState<FiltroRecursos>("TODOS");
  const visibles = filtrarRecursos(recursos, filtro);

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Recursos críticos</Text>
      </View>

      <View style={styles.filtros}>
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
      </View>

      {error ? <AvisoError mensaje={error} /> : null}
      {cargando ? (
        <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay recursos por ahora.</Text>}
          renderItem={({ item }) => (
            <TarjetaRecurso
              recurso={item}
              ahora={ahora}
              miUid={uid}
              onAsignar={(id) => conAviso(() => asignarRecurso(id))}
              onCerrar={(id) => conAviso(() => cerrarRecurso(id))}
            />
          )}
        />
      )}

      {onPublicar ? (
        <Pressable accessibilityRole="button" style={styles.nuevo} onPress={onPublicar}>
          <Text style={styles.nuevoTexto}>Publicar recurso</Text>
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
  filtros: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12 },
  filtro: { borderColor: T.borde, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filtroActivo: { backgroundColor: T.primarioSuave, borderColor: T.primario },
  filtroTexto: { color: T.textoSecundario, fontSize: 13, fontWeight: "700" },
  filtroTextoActivo: { color: T.texto },
  cargando: { flex: 1 },
  lista: { padding: 16 },
  vacio: { color: T.textoSecundario, fontSize: 15, textAlign: "center", marginTop: 32 },
  nuevo: { backgroundColor: T.primario, margin: 16, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nuevoTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});
