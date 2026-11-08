// Ruta: src/modulos/ayuda-humanitaria/pantallas/ReportarVulnerabilidadPantalla.tsx
// P21 · Reportar vulnerabilidad (RF38).
// Foto opcional (solo con internet) y envío por SMS tipo V sin internet.
import { useTema } from "@/compartido/tema";
import { MapaBase } from "@/compartido/ui/MapaBase";
import { ErrorApi } from "@/nucleo/api";
import { useConexion } from "@/nucleo/red";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoSinConexion } from "../componentes/AvisoSinConexion";
import { MapaSinConexion } from "../componentes/MapaSinConexion";
import {
  ETIQUETA_TIPO_VULNERABILIDAD,
  ICONO_TIPO_VULNERABILIDAD,
  TIPOS_VULNERABILIDAD,
} from "../constantes";
import type { Colores } from "../estilos";
import { limitarPersonas, MAX_NOTA, validarReporte } from "../reglas";
import { elegirFoto, type OrigenFoto } from "../servicios/fotoServicio";
import { obtenerUbicacionValidada } from "../servicios/ubicacionServicio";
import { avisoSms, enviarReporte } from "../sms/enviarAyuda";
import type { Coordenada, TipoVulnerabilidad } from "../tipos";

type Props = {
  onVolver?: () => void;
  /** Se llama cuando el reporte se envió bien (la ruta decide a dónde ir). */
  onEnviado?: () => void;
};

export function ReportarVulnerabilidadPantalla({ onVolver, onEnviado }: Props) {
  const { colores: T, oscuro } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const [tipo, setTipo] = useState<TipoVulnerabilidad | null>(null);
  const [personas, setPersonas] = useState(1);
  const [nota, setNota] = useState("");
  const [miUbicacion, setMiUbicacion] = useState<Coordenada | null>(null);
  const [pin, setPin] = useState<Coordenada | null>(null);
  const [otraPersona, setOtraPersona] = useState(false);
  const { sinConexion } = useConexion();
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerUbicacionValidada().then((u) => {
      setMiUbicacion(u);
      setPin(u);
    }).catch(() => setError("No se pudo obtener tu ubicación."));
  }, []);

  const ubicacion = otraPersona ? pin : miUbicacion;
  const errores = validarReporte({ tipo, personas, nota, ubicacion });

  function alCambiarOtraPersona(valor: boolean) {
    setOtraPersona(valor);
    if (!valor) setPin(miUbicacion); // vuelve a mi ubicación
  }

  async function tomarFoto(origen: OrigenFoto) {
    try {
      const f = await elegirFoto(origen);
      if (f) setFoto(f);
      else setError("No se pudo usar la foto. Revisa el permiso o prueba con otra.");
    } catch {
      setError("No se pudo abrir la cámara o la galería.");
    }
  }

  async function enviar() {
    if (errores.length > 0 || !tipo || !ubicacion) {
      setError(errores[0] ?? "Completa el formulario.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const r = await enviarReporte({ tipo, personas, nota: nota.trim(), lat: ubicacion.lat, lng: ubicacion.lng, foto: sinConexion || !foto ? undefined : foto }, sinConexion);
      const aviso = avisoSms(r, "reporte");
      if (aviso) Alert.alert("Enviado por SMS", aviso);
      onEnviado?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} hitSlop={12}>
          <Text style={styles.volver}>←</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Reportar vulnerabilidad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.etiqueta}>¿Qué ocurre?</Text>
        <View style={styles.tipos}>
          {TIPOS_VULNERABILIDAD.map((t) => {
            const activo = tipo === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setTipo(t)}
                style={[styles.tipo, activo && styles.tipoActivo]}
              >
                <Text style={styles.tipoIcono}>{ICONO_TIPO_VULNERABILIDAD[t]}</Text>
                <Text style={[styles.tipoTexto, activo && styles.tipoTextoActivo]}>
                  {ETIQUETA_TIPO_VULNERABILIDAD[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>¿Cuántas personas?</Text>
        <View style={styles.contador}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menos personas"
            style={styles.contadorBoton}
            onPress={() => setPersonas((p) => limitarPersonas(p - 1))}
          >
            <Text style={styles.contadorSigno}>−</Text>
          </Pressable>
          <Text style={styles.contadorValor}>{personas}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más personas"
            style={styles.contadorBoton}
            onPress={() => setPersonas((p) => limitarPersonas(p + 1))}
          >
            <Text style={styles.contadorSigno}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.etiqueta}>Nota (opcional)</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          maxLength={MAX_NOTA}
          placeholder="Ej.: segundo piso, no puede bajar"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />
        <Text style={styles.contadorNota}>
          {nota.length}/{MAX_NOTA}
        </Text>

        {sinConexion ? null : (
          <View>
            <Text style={styles.etiqueta}>Foto (opcional)</Text>
            {foto ? (
              <View>
                <Image source={{ uri: `data:image/jpeg;base64,${foto}` }} style={styles.vistaFoto} resizeMode="cover" />
                <Pressable accessibilityRole="button" onPress={() => setFoto(null)} style={styles.botonFoto}>
                  <Text style={styles.botonFotoTexto}>Quitar foto</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.filaFoto}>
                <Pressable accessibilityRole="button" onPress={() => tomarFoto("camara")} style={[styles.botonFoto, styles.botonFotoMitad]}>
                  <Text style={styles.botonFotoTexto}>📷 Tomar foto</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => tomarFoto("galeria")} style={[styles.botonFoto, styles.botonFotoMitad]}>
                  <Text style={styles.botonFotoTexto}>🖼️ Galería</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={styles.filaSwitch}>
          <Text style={styles.switchTexto}>Reporto por otra persona</Text>
          <Switch
            value={otraPersona}
            onValueChange={alCambiarOtraPersona}
            trackColor={{ true: T.primarioSuave, false: T.borde }}
            thumbColor={otraPersona ? T.primario : T.textoSecundario}
          />
        </View>
        <Text style={styles.ayuda}>
          {otraPersona
            ? "Toca el mapa para mover el pin al lugar donde está la persona."
            : "Se usará tu ubicación actual."}
        </Text>

        <View style={styles.mapa}>
          {sinConexion ? (
            <MapaSinConexion
              ubicacion={miUbicacion}
              detalle="Se enviará tu ubicación actual por SMS. No se puede mover el pin sin conexión."
            />
          ) : miUbicacion ? (
            <MapaBase
              centro={miUbicacion}
              delta={0.006}
              oscuro={oscuro}
              onMapaPress={otraPersona ? setPin : undefined}
              marcadores={
                ubicacion
                  ? [
                      {
                        id: "pin",
                        lat: ubicacion.lat,
                        lng: ubicacion.lng,
                        titulo: "Ubicación del reporte",
                        color: T.primario,
                        icono: "📍",
                      },
                    ]
                  : []
              }
            />
          ) : null}
        </View>

        {sinConexion ? <AvisoSinConexion /> : null}

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={enviando}
          onPress={enviar}
          style={[styles.enviar, (errores.length > 0 || enviando) && styles.enviarInactivo]}
        >
          <Text style={styles.enviarTexto}>{enviando ? "Enviando…" : "Enviar reporte"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.sos,
  },
  volver: { color: "#FFFFFF", fontSize: 24, marginRight: 14 },
  barraTitulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  contenido: { padding: 16, paddingBottom: 32 },
  etiqueta: { color: T.texto, fontSize: 15, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  tipos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipo: {
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
  },
  tipoActivo: { borderColor: T.primario, backgroundColor: T.primarioSuave },
  tipoIcono: { fontSize: 22, marginRight: 8 },
  tipoTexto: { color: T.textoSecundario, fontSize: 13, flex: 1 },
  tipoTextoActivo: { color: T.texto, fontWeight: "700" },
  contador: { flexDirection: "row", alignItems: "center" },
  contadorBoton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorSigno: { color: T.texto, fontSize: 24, fontWeight: "700" },
  contadorValor: { color: T.texto, fontSize: 28, fontWeight: "800", minWidth: 70, textAlign: "center" },
  entrada: {
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1.5,
    borderRadius: 12,
    color: T.texto,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  contadorNota: { color: T.textoSecundario, fontSize: 12, textAlign: "right", marginTop: 4 },
  filaSwitch: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  switchTexto: { color: T.texto, fontSize: 15, fontWeight: "600" },
  ayuda: { color: T.textoSecundario, fontSize: 13, marginTop: 2, marginBottom: 10 },
  filaFoto: { flexDirection: "row", gap: 10 },
  botonFoto: { borderWidth: 1, borderColor: T.borde, backgroundColor: T.superficie, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  botonFotoMitad: { flex: 1, marginTop: 0 },
  botonFotoTexto: { color: T.texto, fontSize: 15, fontWeight: "700" },
  vistaFoto: { width: "100%", height: 180, borderRadius: 14 },
  mapa: { height: 200, borderRadius: 14, overflow: "hidden", borderColor: T.borde, borderWidth: 1 },
  error: { color: T.primario, fontSize: 14, fontWeight: "600", marginTop: 14 },
  enviar: {
    backgroundColor: T.primario,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },
  enviarInactivo: { opacity: 0.5 },
  enviarTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});