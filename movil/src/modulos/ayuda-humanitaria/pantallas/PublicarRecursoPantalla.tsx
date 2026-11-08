// Ruta: src/modulos/ayuda-humanitaria/pantallas/PublicarRecursoPantalla.tsx
// Publicar un recurso crítico: «Ofrezco» o «Necesito» (RF39).
// Pendiente: envío por SMS tipo R sin internet (E7).
import { useTema } from "@/compartido/tema";
import { ErrorApi } from "@/nucleo/api";
import { useConexion } from "@/nucleo/red";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoSinConexion } from "../componentes/AvisoSinConexion";
import {
  COLOR_MODO_RECURSO,
  ETIQUETA_MODO_RECURSO,
  ETIQUETA_TIPO_RECURSO,
  ICONO_TIPO_RECURSO,
  MODOS_RECURSO,
  TIPOS_RECURSO,
} from "../constantesRecursos";
import type { Colores } from "../estilos";
import { limitarCantidad, validarRecurso } from "../reglas";
import { obtenerUbicacionValidada } from "../servicios/ubicacionServicio";
import { avisoSms, enviarRecurso } from "../sms/enviarAyuda";
import type { Coordenada, ModoRecurso, TipoRecurso } from "../tipos";

type Props = {
  onVolver?: () => void;
  /** Se llama cuando el recurso se publicó bien (la ruta decide a dónde ir). */
  onPublicado?: () => void;
};

export function PublicarRecursoPantalla({ onVolver, onPublicado }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const [modo, setModo] = useState<ModoRecurso | null>(null);
  const [tipo, setTipo] = useState<TipoRecurso | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const { sinConexion } = useConexion();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerUbicacionValidada().then(setUbicacion).catch(() => setError("No se pudo obtener tu ubicación."));
  }, []);

  const errores = validarRecurso({ modo, tipo, cantidad, ubicacion });

  async function publicar() {
    if (errores.length > 0 || !modo || !tipo || !ubicacion) {
      setError(errores[0] ?? "Completa el formulario.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const r = await enviarRecurso({ modo, tipo, cantidad, lat: ubicacion.lat, lng: ubicacion.lng }, sinConexion);
      const aviso = avisoSms(r, "recurso");
      if (aviso) Alert.alert("Enviado por SMS", aviso);
      onPublicado?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo publicar el recurso. Inténtalo de nuevo.");
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
        <Text style={styles.barraTitulo}>Publicar recurso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.etiqueta}>¿Ofreces o necesitas?</Text>
        <View style={styles.modos}>
          {MODOS_RECURSO.map((m) => {
            const activo = modo === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setModo(m)}
                style={[styles.modo, activo && { borderColor: COLOR_MODO_RECURSO[m], backgroundColor: T.superficie }]}
              >
                <Text style={[styles.modoTexto, activo && { color: COLOR_MODO_RECURSO[m] }]}>
                  {ETIQUETA_MODO_RECURSO[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>¿Qué recurso?</Text>
        <View style={styles.tipos}>
          {TIPOS_RECURSO.map((t) => {
            const activo = tipo === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setTipo(t)}
                style={[styles.tipo, activo && styles.tipoActivo]}
              >
                <Text style={styles.tipoIcono}>{ICONO_TIPO_RECURSO[t]}</Text>
                <Text style={[styles.tipoTexto, activo && styles.tipoTextoActivo]}>{ETIQUETA_TIPO_RECURSO[t]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>Cantidad</Text>
        <View style={styles.contador}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menos cantidad"
            style={styles.contadorBoton}
            onPress={() => setCantidad((c) => limitarCantidad(c - 1))}
          >
            <Text style={styles.contadorSigno}>−</Text>
          </Pressable>
          <Text style={styles.contadorValor}>{cantidad}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más cantidad"
            style={styles.contadorBoton}
            onPress={() => setCantidad((c) => limitarCantidad(c + 1))}
          >
            <Text style={styles.contadorSigno}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.ayuda}>Se usará tu ubicación actual.</Text>

        {sinConexion ? <AvisoSinConexion /> : null}

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={enviando}
          onPress={publicar}
          style={[styles.enviar, (errores.length > 0 || enviando) && styles.enviarInactivo]}
        >
          <Text style={styles.enviarTexto}>{enviando ? "Publicando…" : "Publicar"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  raiz: { flex: 1, backgroundColor: T.fondo },
  barra: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.sos },
  volver: { color: "#FFFFFF", fontSize: 24, marginRight: 14 },
  barraTitulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  contenido: { padding: 16, paddingBottom: 32 },
  etiqueta: { color: T.texto, fontSize: 15, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  modos: { flexDirection: "row" },
  modo: { flex: 1, borderColor: T.borde, borderWidth: 2, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginRight: 8 },
  modoTexto: { color: T.textoSecundario, fontSize: 16, fontWeight: "800" },
  tipos: { flexDirection: "row", flexWrap: "wrap" },
  tipo: { flexDirection: "row", alignItems: "center", borderColor: T.borde, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, marginBottom: 8, backgroundColor: T.superficie },
  tipoActivo: { borderColor: T.primario, backgroundColor: T.primarioSuave },
  tipoIcono: { fontSize: 18, marginRight: 8 },
  tipoTexto: { color: T.textoSecundario, fontSize: 14, fontWeight: "600" },
  tipoTextoActivo: { color: T.texto },
  contador: { flexDirection: "row", alignItems: "center" },
  contadorBoton: { width: 48, height: 48, borderRadius: 24, borderColor: T.borde, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: T.superficie },
  contadorSigno: { color: T.texto, fontSize: 24, fontWeight: "700" },
  contadorValor: { color: T.texto, fontSize: 22, fontWeight: "800", minWidth: 64, textAlign: "center" },
  ayuda: { color: T.textoSecundario, fontSize: 13, marginTop: 18 },
  error: { color: T.primario, fontSize: 14, fontWeight: "700", marginTop: 12 },
  enviar: { backgroundColor: T.primario, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  enviarInactivo: { opacity: 0.5 },
  enviarTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});