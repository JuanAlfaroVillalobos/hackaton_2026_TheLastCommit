// Ruta: src/modulos/ayuda-humanitaria/pantallas/MapaEmergenciaPantalla.tsx
// P11 · Emergencia (RF22, RF38, RF39). Réplica de Inicio (P04) enfocada en emergencias: mismo encabezado con
// «SOS», mismo saludo y tarjetas 2 × 2 (ahora hacia el tablero, reportes, recursos y teléfonos), el botón ancho
// «Reportar vulnerabilidad» y, debajo, el mapa y la lista de vecinos que necesitan ayuda.
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Boton, Encabezado, Icono, Tarjeta, type NombreIcono } from "@/compartido/ui";
import { MapaBase, type MarcadorMapa } from "@/compartido/ui/MapaBase";
import { primerNombre } from "@/compartido/utilidades/formatos";
import { BotonSos } from "@/modulos/emergencia";
import { useVecinoActual } from "@/modulos/favores";
import { useConexion } from "@/nucleo/red";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AvisoError } from "../componentes/AvisoError";
import { MapaSinConexion } from "../componentes/MapaSinConexion";
import {
  COLOR_ESTADO,
  COLOR_ESTADO_REPORTE,
  ETIQUETA_CORTA_TIPO_VULNERABILIDAD,
  ETIQUETA_ESTADO,
  ETIQUETA_TIPO_VULNERABILIDAD,
  ICONO_ESTADO,
  ICONO_TIPO_VULNERABILIDAD,
} from "../constantes";
import type { Colores } from "../estilos";
import { useReportes } from "../hooks/useReportes";
import { useVecinosEmergencia } from "../hooks/useVecinosEmergencia";
import { esReporteUrgente, ordenarPorUrgencia, tiempoDesde } from "../reglas";
import { descargarDirectorio } from "../servicios/directorioServicio";
import { useVaciarColaSms } from "../sms/sincronizarCola";
import { esReporteActivo } from "../tablero";

type Props = {
  onVolver?: () => void;
  /** «Reportar vulnerabilidad» (RF38): el botón ancho. */
  onReportar?: () => void;
  /** Tarjetas 2 × 2 (RF39). Cada una solo se muestra si se pasa su función. */
  onTablero?: () => void;
  onRecursos?: () => void;
  onDirectorio?: () => void;
  /** `true` mientras haya una emergencia activa en la zona: muestra el aviso rojo. Lo decide el módulo emergencia. */
  emergencia?: boolean;
};

export function MapaEmergenciaPantalla({
  onVolver,
  onReportar,
  onTablero,
  onRecursos,
  onDirectorio,
  emergencia = false,
}: Props) {
  const { colores: T, oscuro } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const vecino = useVecinoActual();
  const { sinConexion } = useConexion();
  useVaciarColaSms();
  // RF40: el directorio se descarga entero al abrir la emergencia para tenerlo sin conexión.
  useEffect(() => {
    void descargarDirectorio();
  }, []);
  const { vecinos, centro, cargando, error, ahora } = useVecinosEmergencia();
  const ordenados = useMemo(() => ordenarPorUrgencia(vecinos), [vecinos]);
  // Los reportes de vulnerabilidad también salen en el mapa, con el mismo estilo que los vecinos.
  const { reportes, error: errorReportes } = useReportes();
  const reportesActivos = useMemo(() => reportes.filter(esReporteActivo), [reportes]);
  // En la lista solo va lo más urgente: quien pulsó SOS y los reportes de heridos o niños solos.
  // Todo lo demás se ve en el mapa y en el tablero.
  const urgentesVecinos = useMemo(() => ordenados.filter((v) => v.estado === "NECESITA_AYUDA"), [ordenados]);
  const urgentesReportes = useMemo(() => reportesActivos.filter(esReporteUrgente), [reportesActivos]);
  // Una sola lista (SOS + reportes críticos), lo más reciente primero.
  const urgentes = useMemo(
    () =>
      [
        ...urgentesVecinos.map((v) => ({ clase: "V" as const, v, cuando: v.ultimaAlertaEn })),
        ...urgentesReportes.map((r) => ({ clase: "R" as const, r, cuando: r.creadoEn })),
      ].sort((a, b) => b.cuando - a.cuando),
    [urgentesVecinos, urgentesReportes],
  );
  const restantes = ordenados.length + reportesActivos.length - urgentesVecinos.length - urgentesReportes.length;

  const marcadores: MarcadorMapa[] = useMemo(
    () => [
      ...ordenados.map((v) => ({
        id: v.uid,
        lat: v.lat,
        lng: v.lng,
        titulo: v.nombre,
        descripcion: `${ETIQUETA_ESTADO[v.estado]} · ${tiempoDesde(v.ultimaAlertaEn, ahora)}`,
        color: COLOR_ESTADO[v.estado],
        icono: ICONO_ESTADO[v.estado],
        etiqueta: v.nombre.split(" ")[0],
      })),
      ...reportesActivos.map((r) => ({
        id: `rv-${r.id}`,
        lat: r.lat,
        lng: r.lng,
        titulo: ETIQUETA_TIPO_VULNERABILIDAD[r.tipo],
        descripcion: `${r.personas} ${r.personas === 1 ? "persona" : "personas"} · ${tiempoDesde(r.creadoEn, ahora)}`,
        color: COLOR_ESTADO_REPORTE[r.estado],
        icono: ICONO_TIPO_VULNERABILIDAD[r.tipo],
        etiqueta: ETIQUETA_CORTA_TIPO_VULNERABILIDAD[r.tipo],
      })),
    ],
    [ordenados, reportesActivos, ahora],
  );

  const accesos: { id: string; texto: string; icono: NombreIcono; onPress?: () => void }[] = [
    { id: "tablero", texto: "Tablero", icono: "dashboard", onPress: onTablero },
    { id: "recursos", texto: "Recursos", icono: "inventory_2", onPress: onRecursos },
    { id: "directorio", texto: "Teléfonos", icono: "call", onPress: onDirectorio },
  ];

  return (
    <View style={styles.raiz}>
      <Encabezado barrio={vecino.barrio} derecha={<BotonSos />} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.saludo}>
          <View style={styles.saludoFila}>
            <Text style={styles.titulo} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {primerNombre(vecino.nombre)}, estamos contigo.
            </Text>
            {onVolver ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver al inicio"
                onPress={onVolver}
                style={styles.volver}
              >
                <Icono nombre="arrow_back" color={T.texto} tamano={22} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.subtitulo} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Pide o da ayuda rápido en tu zona.
          </Text>
        </View>

        {emergencia ? (
          <View style={styles.aviso} accessibilityRole="alert">
            <Text style={styles.avisoTitulo}>⚠ MODO EMERGENCIA</Text>
            <Text style={styles.avisoTexto}>Publicar nuevas necesidades está deshabilitado mientras dure el modo.</Text>
          </View>
        ) : null}

        <View style={styles.cuadricula}>
          {accesos.map((a) =>
            a.onPress ? (
              <View key={a.id} style={[styles.celda, a.id === "tablero" && styles.celdaCompleta]}>
                <Tarjeta onPress={a.onPress} accessibilityLabel={a.texto} style={[styles.tarjeta, a.id === "tablero" && styles.tarjetaCentrada]}>
                  <Icono nombre={a.icono} color={oscuro ? T.acento : T.primario} tamano={26} />
                  <Text style={styles.accesoTexto} numberOfLines={2} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                    {a.texto}
                  </Text>
                </Tarjeta>
              </View>
            ) : null,
          )}
        </View>

        <Boton texto="Reportar vulnerabilidad" icono="error" onPress={onReportar ?? (() => undefined)} />

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Quién necesita ayuda
          </Text>
          <Text style={styles.seccionContexto} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            En tu zona
          </Text>
        </View>

        {error ?? errorReportes ? <AvisoError mensaje={(error ?? errorReportes) as string} /> : null}

        <View style={styles.mapa}>
          {sinConexion ? (
            <MapaSinConexion ubicacion={centro} />
          ) : cargando || !centro ? (
            <ActivityIndicator style={styles.cargando} color={T.primario} size="large" />
          ) : (
            <MapaBase centro={centro} delta={0.012} marcadores={marcadores} oscuro={oscuro} />
          )}
        </View>

        {!cargando && urgentesVecinos.length === 0 && urgentesReportes.length === 0 ? (
          <Text style={styles.vacio}>Nada urgente por ahora.</Text>
        ) : null}
        {urgentes.map((u) =>
          u.clase === "V" ? (
          <Tarjeta key={`v-${u.v.uid}`} style={styles.fila}>
            <View style={[styles.punto, { backgroundColor: COLOR_ESTADO[u.v.estado] }]}>
              <Text style={styles.puntoIcono}>{ICONO_ESTADO[u.v.estado]}</Text>
            </View>
            <View style={styles.filaTexto}>
              <Text style={styles.nombre} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {u.v.nombre}
              </Text>
              <Text style={styles.detalle} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {ETIQUETA_ESTADO[u.v.estado]} · {tiempoDesde(u.v.ultimaAlertaEn, ahora)}
              </Text>
            </View>
          </Tarjeta>
          ) : (
          <Tarjeta key={`r-${u.r.id}`} style={styles.fila}>
            <View style={[styles.punto, { backgroundColor: COLOR_ESTADO_REPORTE[u.r.estado] }]}>
              <Text style={styles.puntoIcono}>{ICONO_TIPO_VULNERABILIDAD[u.r.tipo]}</Text>
            </View>
            <View style={styles.filaTexto}>
              <Text style={styles.nombre} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {ETIQUETA_TIPO_VULNERABILIDAD[u.r.tipo]}
              </Text>
              <Text style={styles.detalle} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {u.r.personas} {u.r.personas === 1 ? "persona" : "personas"} · {tiempoDesde(u.r.creadoEn, ahora)}
              </Text>
            </View>
          </Tarjeta>
          ),
        )}
        {restantes > 0 && onTablero ? (
          <Boton
            texto={`Ver todo en el tablero (${restantes} más)`}
            variante="secundario"
            onPress={onTablero}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Mitad del espacio entre tarjetas: cada celda lo aplica a sus lados (igual que los accesos de Inicio). */
const MEDIO_HUECO = ESPACIO.m / 2;

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: T.fondo },
    contenido: { paddingHorizontal: ESPACIO.l, paddingTop: ESPACIO.l, paddingBottom: ESPACIO.xl, gap: ESPACIO.l },
    saludo: { gap: ESPACIO.xs },
    saludoFila: { flexDirection: "row", alignItems: "flex-start", gap: ESPACIO.m },
    titulo: { ...TIPO.titulo, color: T.texto, flex: 1 },
    volver: {
      width: TACTIL_MIN,
      height: TACTIL_MIN,
      borderRadius: TACTIL_MIN / 2,
      borderWidth: 1,
      borderColor: T.borde,
      backgroundColor: T.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    subtitulo: { ...TIPO.cuerpo, color: T.textoSecundario },
    aviso: { backgroundColor: T.sos, borderRadius: RADIO.boton, paddingHorizontal: ESPACIO.l, paddingVertical: ESPACIO.m },
    avisoTitulo: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    avisoTexto: { color: "#FFFFFF", fontSize: 13, marginTop: 2 },
    cuadricula: { flexDirection: "row", flexWrap: "wrap", margin: -MEDIO_HUECO },
    celda: { width: "50%", padding: MEDIO_HUECO },
    celdaCompleta: { width: "100%" },
    tarjeta: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: ESPACIO.m, paddingVertical: ESPACIO.m },
    tarjetaCentrada: { justifyContent: "center" },
    accesoTexto: { ...TIPO.cuerpoFuerte, fontSize: 17, color: T.texto, flexShrink: 1 },
    seccion: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: ESPACIO.s },
    seccionTitulo: { ...TIPO.seccion, color: T.texto },
    seccionContexto: { ...TIPO.pequeno, color: T.textoSecundario },
    mapa: {
      height: 260,
      borderRadius: RADIO.tarjeta,
      borderWidth: 1,
      borderColor: T.borde,
      overflow: "hidden",
      backgroundColor: T.superficie,
    },
    cargando: { flex: 1 },
    vacio: { ...TIPO.cuerpo, color: T.textoSecundario, textAlign: "center", paddingVertical: ESPACIO.s },
    fila: { flexDirection: "row", alignItems: "center", paddingVertical: ESPACIO.m },
    punto: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    puntoIcono: { color: "#1A0000", fontSize: 16, fontWeight: "800" },
    filaTexto: { marginLeft: ESPACIO.m, flex: 1 },
    nombre: { ...TIPO.cuerpoFuerte, color: T.texto },
    detalle: { ...TIPO.pequeno, color: T.textoSecundario, marginTop: 1 },
  });