// Ruta: src/modulos/ayuda-humanitaria/pantallas/TableroHumanitarioPantalla.tsx
// P22 · Tablero humanitario (RF39): reportes de vulnerabilidad y recursos críticos, en lista y en mapa.
// Visible siempre; con `emergencia` se destaca (cabecera roja y aviso).
import { useTema } from "@/compartido/tema";
import { MapaBase } from "@/compartido/ui/MapaBase";
import { useConexion } from "@/nucleo/red";
import { useSesion } from "@/nucleo/sesion";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { conAviso } from "../acciones";
import { AvisoError } from "../componentes/AvisoError";
import { FiltroTipos, perteneceAFiltro, type FiltroTipo } from "../componentes/FiltroTipos";
import { MapaSinConexion } from "../componentes/MapaSinConexion";
import { TarjetaRecurso } from "../componentes/TarjetaRecurso";
import { TarjetaReporte } from "../componentes/TarjetaReporte";
import type { Colores } from "../estilos";
import { useRecursos } from "../hooks/useRecursos";
import { useReportes } from "../hooks/useReportes";
import { asignarRecurso, cerrarRecurso } from "../servicios/recursosServicio";
import { atenderReporte, resolverReporte } from "../servicios/reportesServicio";
import { obtenerCentroZona } from "../servicios/vecinosEmergenciaServicio";
import { useVaciarColaSms } from "../sms/sincronizarCola";
import {
  armarTablero,
  claveItem,
  esRecursoActivo,
  esReporteActivo,
  marcadoresTablero,
} from "../tablero";
import type { Coordenada } from "../tipos";

type Props = {
  /** true cuando la zona está en modo emergencia (lo decide el módulo emergencia). */
  emergencia?: boolean;
  onVolver?: () => void;
  /** Botón «Reportar vulnerabilidad». Si no se pasa, no se muestra. */
  onReportar?: () => void;
  /** Botón «Publicar recurso». Si no se pasa, no se muestra. */
  onPublicarRecurso?: () => void;
  /** Acceso al directorio de emergencia (P23). Si no se pasa, no se muestra. */
  onDirectorio?: () => void;
};

type Vista = "LISTA" | "MAPA";

const VISTAS: { valor: Vista; etiqueta: string }[] = [
  { valor: "LISTA", etiqueta: "Lista" },
  { valor: "MAPA", etiqueta: "Mapa" },
];


export function TableroHumanitarioPantalla({
  emergencia = false,
  onVolver,
  onReportar,
  onPublicarRecurso,
  onDirectorio,
}: Props) {
  const { colores: T, oscuro } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const uid = useSesion().usuario?.uid ?? "";
  const { reportes, cargando: cargandoReportes, error: errorReportes, ahora } = useReportes();
  const { recursos, cargando: cargandoRecursos, error: errorRecursos } = useRecursos();
  const { sinConexion } = useConexion();
  useVaciarColaSms();
  const [vista, setVista] = useState<Vista>("LISTA");
  const [filtro, setFiltro] = useState<FiltroTipo>("TODOS");
  const [centro, setCentro] = useState<Coordenada | null>(null);

  useEffect(() => {
    obtenerCentroZona().then(setCentro).catch(() => undefined);
  }, []);

  const items = useMemo(
    () => armarTablero(reportes.filter((r) => perteneceAFiltro(r, filtro)), recursos, "REPORTES"),
    [reportes, recursos, filtro],
  );
  const marcadores = useMemo(() => marcadoresTablero(items), [items]);
  const totalReportes = reportes.filter(esReporteActivo).length;
  const totalRecursos = recursos.filter(esRecursoActivo).length;
  const cargando = cargandoReportes || cargandoRecursos;
  const error = errorReportes ?? errorRecursos;

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>

      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12} style={styles.lado}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <View style={styles.barraTextos}>
          <Text style={styles.barraTitulo}>Tablero</Text>
          {emergencia ? <Text style={styles.barraAviso}>⚠ MODO EMERGENCIA</Text> : null}
        </View>
        <View style={styles.lado}>
          {onDirectorio ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Directorio de emergencia" onPress={onDirectorio} hitSlop={12}>
              <Text style={styles.directorio}>📞</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.resumen}>
        <Text style={[styles.resumenTexto, emergencia && styles.resumenEmergencia]}>
          {totalReportes} {totalReportes === 1 ? "reporte" : "reportes"} · {totalRecursos}{" "}
          {totalRecursos === 1 ? "recurso" : "recursos"}
        </Text>
        <View style={styles.vistas}>
          {VISTAS.map((v) => {
            const activo = vista === v.valor;
            return (
              <Pressable
                key={v.valor}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setVista(v.valor)}
                style={[styles.vista, activo && styles.vistaActiva]}
              >
                <Text style={[styles.vistaTexto, activo && styles.vistaTextoActivo]}>{v.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FiltroTipos
        reportes={reportes.filter(esReporteActivo)}
        valor={filtro}
        onCambiar={setFiltro}
      />

      <View style={styles.contenido}>
        {error ? <AvisoError mensaje={error} /> : null}
        {cargando ? (
          <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
        ) : vista === "MAPA" ? (
          sinConexion ? (
            <MapaSinConexion ubicacion={centro} detalle="Usa la lista para ver los reportes." />
          ) : centro ? (
            <MapaBase centro={centro} delta={0.012} marcadores={marcadores} oscuro={oscuro} />
          ) : (
            <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
          )
        ) : (
          <FlatList
            data={items}
            keyExtractor={claveItem}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={<Text style={styles.vacio}>No hay nada por ahora.</Text>}
            renderItem={({ item }) =>
              item.clase === "REPORTE" ? (
                <View>
                <TarjetaReporte
                  reporte={item.reporte}
                  ahora={ahora}
                  miUid={uid}
                  onAyudar={(id) => conAviso(() => atenderReporte(id))}
                  onResolver={(id) => conAviso(() => resolverReporte(id))}
                />
                </View>
              ) : (
                <View>
                <TarjetaRecurso
                  recurso={item.recurso}
                  ahora={ahora}
                  miUid={uid}
                  onAsignar={(id) => conAviso(() => asignarRecurso(id))}
                  onCerrar={(id) => conAviso(() => cerrarRecurso(id))}
                />
                </View>
              )
            }
          />
        )}
      </View>

      {onReportar || onPublicarRecurso ? (
        <View style={styles.acciones}>
          {onReportar ? (
            <Pressable accessibilityRole="button" style={[styles.accion, styles.accionPrincipal]} onPress={onReportar}>
              <Text style={styles.accionTextoPrincipal}>Reportar vulnerabilidad</Text>
            </Pressable>
          ) : null}
          {onPublicarRecurso ? (
            <Pressable accessibilityRole="button" style={[styles.accion, styles.accionSecundaria]} onPress={onPublicarRecurso}>
              <Text style={styles.accionTextoSecundaria}>Publicar recurso</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  barra: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.sos },
  lado: { width: 44, alignItems: "center" },
  volver: { color: "#FFFFFF", fontSize: 26 },
  barraTextos: { flex: 1, alignItems: "center" },
  barraTitulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", textAlign: "center" },
  directorio: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  barraAviso: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginTop: 2 },
  resumen: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12 },
  resumenTexto: { color: T.textoSecundario, fontSize: 14, fontWeight: "700" },
  resumenEmergencia: { color: T.primario },
  vistas: { flexDirection: "row" },
  vista: { borderColor: T.borde, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 6, borderRadius: 14 },
  vistaActiva: { backgroundColor: T.primarioSuave, borderColor: T.primario },
  vistaTexto: { color: T.textoSecundario, fontSize: 13, fontWeight: "700" },
  vistaTextoActivo: { color: T.texto },
  grupo: { color: T.textoSecundario, fontSize: 13, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  filtros: { paddingHorizontal: 16, paddingVertical: 12 },
  filtro: { borderColor: T.borde, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filtroActivo: { backgroundColor: T.primarioSuave, borderColor: T.primario },
  filtroTexto: { color: T.textoSecundario, fontSize: 13, fontWeight: "700" },
  filtroTextoActivo: { color: T.texto },
  contenido: { flex: 1 },
  cargando: { flex: 1 },
  lista: { padding: 16 },
  vacio: { color: T.textoSecundario, fontSize: 15, textAlign: "center", marginTop: 32 },
  acciones: { flexDirection: "row", padding: 12, borderTopColor: T.borde, borderTopWidth: 1 },
  accion: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginHorizontal: 4 },
  accionPrincipal: { backgroundColor: T.primario },
  accionSecundaria: { borderColor: T.primario, borderWidth: 1.5 },
  accionTextoPrincipal: { color: T.sobrePrimario, fontSize: 14, fontWeight: "800" },
  accionTextoSecundaria: { color: T.primario, fontSize: 14, fontWeight: "800" },
});