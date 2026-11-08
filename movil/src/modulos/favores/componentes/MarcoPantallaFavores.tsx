import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { useRouter } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MarcoProps = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
};

export function MarcoPantallaFavores({ titulo, descripcion, children }: MarcoProps) {
  const { colores } = useTema();
  const router = useRouter();
  const volver = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/favores");
  }, [router]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.marco}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Favores"
            onPress={volver}
            style={styles.volver}
          >
            <Text style={[styles.volverTexto, { color: colores.enlace }]}>‹  Favores</Text>
          </Pressable>
          <Text style={[styles.titulo, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {titulo}
          </Text>
          {descripcion ? (
            <Text style={[styles.descripcion, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {descripcion}
            </Text>
          ) : null}
          <View style={styles.cuerpo}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type OpcionProps = {
  titulo: string;
  detalle?: string;
  seleccionada: boolean;
  onPress: () => void;
};

export function OpcionFavores({ titulo, detalle, seleccionada, onPress }: OpcionProps) {
  const { colores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionada }}
      onPress={onPress}
      style={[
        styles.opcion,
        {
          backgroundColor: seleccionada ? colores.primarioSuave : colores.superficie,
          borderColor: seleccionada ? colores.primario : colores.borde,
        },
      ]}
    >
      <Text style={[styles.opcionTitulo, { color: colores.texto }]}>{titulo}</Text>
      {detalle ? <Text style={[styles.opcionDetalle, { color: colores.textoSecundario }]}>{detalle}</Text> : null}
    </Pressable>
  );
}

type CampoProps = {
  etiqueta: string;
  valor: string;
  onChangeText: (valor: string) => void;
  placeholder?: string;
  multilinea?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  error?: string | null;
};

export function CampoFavores({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  multilinea = false,
  maxLength,
  keyboardType,
  error,
}: CampoProps) {
  const { colores } = useTema();
  return (
    <View style={styles.campo}>
      <Text style={[styles.etiqueta, { color: colores.texto }]}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colores.textoSecundario}
        maxLength={maxLength}
        keyboardType={keyboardType}
        multiline={multilinea}
        textAlignVertical={multilinea ? "top" : "center"}
        style={[
          styles.entrada,
          multilinea ? styles.entradaMultilinea : null,
          { color: colores.texto, borderColor: error ? colores.sos : colores.borde, backgroundColor: colores.superficie },
        ]}
      />
      {error ? <Text style={[styles.error, { color: colores.sos }]} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

export function AvisoFavores({ texto }: { texto: string }) {
  const { colores } = useTema();
  return (
    <View accessibilityRole="alert" style={[styles.aviso, { borderColor: colores.borde, backgroundColor: colores.sosFondo }]}>
      <Text style={[styles.avisoTexto, { color: colores.texto }]}>{texto}</Text>
    </View>
  );
}

export function TituloSeccionFavores({ children }: { children: ReactNode }) {
  const { colores } = useTema();
  return <Text style={[styles.tituloSeccion, { color: colores.texto }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { flexGrow: 1, paddingHorizontal: ESPACIO.l, paddingTop: ESPACIO.s, paddingBottom: ESPACIO.xl },
  marco: { width: "100%", maxWidth: 640, alignSelf: "center", gap: ESPACIO.m },
  volver: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingRight: ESPACIO.m },
  volverTexto: { ...TIPO.cuerpoFuerte, fontSize: 16 },
  titulo: { ...TIPO.titulo, fontSize: 26 },
  descripcion: { ...TIPO.cuerpo, marginTop: -ESPACIO.s },
  cuerpo: { gap: ESPACIO.m, marginTop: ESPACIO.s },
  opcion: { minHeight: 52, borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, justifyContent: "center", gap: 2 },
  opcionTitulo: { ...TIPO.cuerpoFuerte },
  opcionDetalle: { ...TIPO.pequeno },
  campo: { gap: ESPACIO.xs },
  etiqueta: { ...TIPO.cuerpoFuerte },
  entrada: { ...TIPO.cuerpo, minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: ESPACIO.m, paddingVertical: ESPACIO.s },
  entradaMultilinea: { minHeight: 124 },
  error: { ...TIPO.pequeno },
  aviso: { borderWidth: 1, borderRadius: 12, padding: ESPACIO.m },
  avisoTexto: { ...TIPO.cuerpo },
  tituloSeccion: { ...TIPO.cuerpoFuerte, fontSize: 18 },
});
