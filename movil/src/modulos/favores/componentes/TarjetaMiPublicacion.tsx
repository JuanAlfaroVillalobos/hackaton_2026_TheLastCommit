// Ruta: src/modulos/favores/componentes/TarjetaMiPublicacion.tsx
// «Tu publicación» (frame 04-B, RN-04): resumen de la necesidad activa propia.
// El chip de estado va en su propia línea para que quepa con texto al 130 % (decisión 4).
import { OFICIOS } from "@/compartido/constantes/oficios";
import { Chip, Icono, Tarjeta } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { StyleSheet, Text, View } from "react-native";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO, TEXTOS_INICIO } from "../constantes";
import { etiquetaEstadoSolicitante, minutosParaLlegar } from "../reglas";
import type { PublicacionConAutor } from "../tipos";

type Props = { publicacion: PublicacionConAutor; ahora: number; onVer: () => void };

export function TarjetaMiPublicacion({ publicacion: p, ahora, onVer }: Props) {
  const { colores } = useTema();
  const estado =
    p.tipo === "OFREZCO"
      ? p.estado === "ACEPTADA"
        ? "Un vecino aceptó tu oferta"
        : p.estado === "EN_SITIO"
          ? "El solicitante indica que llegó"
          : etiquetaEstadoSolicitante(p.estado, p.prestadorNombre)
      : etiquetaEstadoSolicitante(p.estado, p.prestadorNombre);
  const minutos = p.tipo === "NECESITO" ? minutosParaLlegar(p, ahora) : null;
  const detalle = p.oficioId ? OFICIOS[p.oficioId] : ETIQUETA_CATEGORIA[p.categoria];

  return (
    <Tarjeta
      destacada
      onPress={onVer}
      accessibilityLabel={`${TEXTOS_INICIO.tuPublicacion}. ${estado}. ${p.descripcion}. ${TEXTOS_INICIO.verMiFavor}`}
      style={styles.tarjeta}
    >
      <View style={styles.chips}>
        <Chip texto={ETIQUETA_TIPO[p.tipo]} variante="marca" />
        <Chip texto={detalle} />
      </View>
      <Chip texto={estado} variante="contorno" />
      <Text style={[styles.descripcion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {p.descripcion}
      </Text>
      <View style={styles.pie}>
        {minutos !== null ? (
          <View style={styles.llegada}>
            <Icono nombre="schedule" color={colores.textoSecundario} tamano={18} />
            <Text style={[styles.secundario, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {TEXTOS_INICIO.llegaEn(minutos)}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={[styles.enlace, { color: colores.enlace }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {TEXTOS_INICIO.verMiFavor} →
        </Text>
      </View>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  tarjeta: { gap: ESPACIO.s },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIO.s },
  descripcion: { ...TIPO.cuerpoFuerte, fontWeight: "600" },
  pie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ESPACIO.s },
  llegada: { flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  secundario: TIPO.pequeno,
  enlace: { ...TIPO.cuerpoFuerte, fontSize: 15 },
});
