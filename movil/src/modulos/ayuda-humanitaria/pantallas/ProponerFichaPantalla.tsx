// Ruta: src/modulos/ayuda-humanitaria/pantallas/ProponerFichaPantalla.tsx
// Proponer una ficha para el directorio de emergencia (RF40). Queda pendiente de aprobación de un validador.
import type { Colores } from "../estilos";
import { ErrorApi } from "@/nucleo/api";
import { useTema } from "@/compartido/tema";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ETIQUETA_TIPO_FICHA, ICONO_TIPO_FICHA, TIPOS_FICHA } from "../constantesDirectorio";
import {
  MAX_DIRECCION_FICHA,
  MAX_HORARIO_FICHA,
  MAX_NOMBRE_FICHA,
  validarFicha,
} from "../directorio";
import { proponerFicha } from "../servicios/directorioServicio";
import type { TipoFichaDirectorio } from "../tipos";

type Props = {
  onVolver?: () => void;
  /** Se llama cuando la propuesta se envió bien (la ruta decide a dónde ir). */
  onEnviada?: () => void;
};

export function ProponerFichaPantalla({ onVolver, onEnviada }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoFichaDirectorio | null>(null);
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [direccion, setDireccion] = useState("");
  const [horario, setHorario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errores = validarFicha({ nombre, tipo, telefono, whatsapp, direccion, horario });

  async function enviar() {
    if (errores.length > 0 || !tipo) {
      setError(errores[0] ?? "Completa el formulario.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await proponerFicha({
        nombre,
        tipo,
        telefono: telefono.trim(),
        whatsapp: whatsapp.trim() || null,
        direccion,
        horario,
      });
      onEnviada?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo enviar la propuesta. Inténtalo de nuevo.");
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
        <Text style={styles.barraTitulo}>Proponer ficha</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.nota}>
          Tu propuesta aparecerá como «Pendiente» hasta que un validador la apruebe.
        </Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          maxLength={MAX_NOMBRE_FICHA}
          placeholder="Ej.: Olla común Santa Rosa"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>Tipo</Text>
        <View style={styles.tipos}>
          {TIPOS_FICHA.map((t) => {
            const activo = tipo === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setTipo(t)}
                style={[styles.tipo, activo && styles.tipoActivo]}
              >
                <Text style={styles.tipoIcono}>{ICONO_TIPO_FICHA[t]}</Text>
                <Text style={[styles.tipoTexto, activo && styles.tipoTextoActivo]}>{ETIQUETA_TIPO_FICHA[t]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>Teléfono</Text>
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          placeholder="Ej.: 044123456"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>WhatsApp (opcional)</Text>
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="Con código de país, ej.: 51999999999"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>Dirección (opcional)</Text>
        <TextInput
          value={direccion}
          onChangeText={setDireccion}
          maxLength={MAX_DIRECCION_FICHA}
          placeholder="Ej.: Jr. Pizarro 123"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>Horario (opcional)</Text>
        <TextInput
          value={horario}
          onChangeText={setHorario}
          maxLength={MAX_HORARIO_FICHA}
          placeholder="Ej.: 12:00–14:00"
          placeholderTextColor={T.textoSecundario}
          style={styles.entrada}
        />

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
          <Text style={styles.enviarTexto}>{enviando ? "Enviando…" : "Enviar propuesta"}</Text>
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
  nota: { color: T.textoSecundario, fontSize: 13 },
  etiqueta: { color: T.texto, fontSize: 15, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  entrada: {
    color: T.texto,
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  tipos: { flexDirection: "row", flexWrap: "wrap" },
  tipo: { flexDirection: "row", alignItems: "center", borderColor: T.borde, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, marginBottom: 8, backgroundColor: T.superficie },
  tipoActivo: { borderColor: T.primario, backgroundColor: T.primarioSuave },
  tipoIcono: { fontSize: 18, marginRight: 8 },
  tipoTexto: { color: T.textoSecundario, fontSize: 14, fontWeight: "600" },
  tipoTextoActivo: { color: T.texto },
  error: { color: T.primario, fontSize: 14, fontWeight: "700", marginTop: 12 },
  enviar: { backgroundColor: T.primario, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  enviarInactivo: { opacity: 0.5 },
  enviarTexto: { color: T.sobrePrimario, fontSize: 17, fontWeight: "800" },
});
