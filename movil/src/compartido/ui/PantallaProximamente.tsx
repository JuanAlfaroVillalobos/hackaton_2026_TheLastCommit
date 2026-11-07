// Ruta: src/compartido/ui/PantallaProximamente.tsx
// Marcador para las pestañas cuyo módulo aún no tiene pantalla. Se reemplaza en la ruta por la
// pantalla real del módulo dueño (Servicios → directorio/trabajos, Favores → favores, Perfil → cuentas).
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { StyleSheet, Text, View } from "react-native";

type Props = { titulo: string; descripcion: string };

export function PantallaProximamente({ titulo, descripcion }: Props) {
  const { colores } = useTema();
  return (
    <View style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <Text style={[styles.titulo, { color: colores.texto }]} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {titulo}
      </Text>
      <Text style={[styles.texto, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {descripcion}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, padding: ESPACIO.l, gap: ESPACIO.s },
  titulo: TIPO.titulo,
  texto: TIPO.cuerpo,
});
