// Ruta: src/modulos/favores/componentes/TarjetaMuro.tsx
// Tarjeta de una necesidad u oferta del muro (RF09, RF35). Sin fila de pie vacía: «Ver detalle →»
// comparte fila con la devolución cuando la hay, o va alineado a la derecha (decisión 2).
import { OFICIOS } from "@/compartido/constantes/oficios";
import { Chip, Icono, Tarjeta } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { extracto, formatearDistancia, formatearFechaCorta, formatearHace, iniciales } from "@/compartido/utilidades/formatos";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO, TEXTOS_INICIO } from "../constantes";
import type { ElementoMuro } from "../tipos";

type Props = { elemento: ElementoMuro; ahora: number; onVer: (id: string) => void };

function TarjetaMuroBase({ elemento: e, ahora, onVer }: Props) {
  const { colores } = useTema();
  const meta = `${formatearDistancia(e.distanciaM)} · ${formatearHace(e.creadoEn, ahora)}`;
  const detalle = e.oficioId ? OFICIOS[e.oficioId] : ETIQUETA_CATEGORIA[e.categoria];
  const devolucion = e.tipo === "OFREZCO" && e.devolucionEn ? TEXTOS_INICIO.devolucion(formatearFechaCorta(e.devolucionEn)) : null;
  const texto = extracto(e.descripcion, 80);

  const etiquetaAccesible = [
    e.autorNombre,
    meta,
    ETIQUETA_TIPO[e.tipo],
    detalle,
    e.coincideConOficio ? TEXTOS_INICIO.coincide : null,
    texto,
    devolucion,
    TEXTOS_INICIO.verDetalle,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Tarjeta onPress={() => onVer(e.id)} accessibilityLabel={etiquetaAccesible} style={styles.tarjeta}>
      <View style={styles.autor}>
        <View style={[styles.avatar, { backgroundColor: colores.primarioSuave }]}>
          <Text style={[styles.iniciales, { color: colores.texto }]} maxFontSizeMultiplier={1.15}>
            {iniciales(e.autorNombre)}
          </Text>
        </View>
        <View style={styles.autorTextos}>
          <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {e.autorNombre}
          </Text>
          <Text style={[styles.meta, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {meta}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        <Chip texto={ETIQUETA_TIPO[e.tipo]} variante={e.tipo === "NECESITO" ? "marca" : "contorno"} />
        <Chip texto={detalle} />
      </View>
      {e.coincideConOficio ? <Chip texto={TEXTOS_INICIO.coincide} variante="exito" icono="check" /> : null}

      <Text style={[styles.descripcion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {texto}
      </Text>

      <View style={[styles.pie, devolucion ? null : styles.pieDerecha]}>
        {devolucion ? (
          <View style={styles.devolucion}>
            <Icono nombre="calendar_today" color={colores.textoSecundario} tamano={16} />
            <Text style={[styles.meta, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {devolucion}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.enlace, { color: colores.enlace }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {TEXTOS_INICIO.verDetalle} →
        </Text>
      </View>
    </Tarjeta>
  );
}

export const TarjetaMuro = memo(TarjetaMuroBase);

const AVATAR = 48;

const styles = StyleSheet.create({
  tarjeta: { gap: ESPACIO.s },
  autor: { flexDirection: "row", alignItems: "center", gap: ESPACIO.m, marginBottom: ESPACIO.xs },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, alignItems: "center", justifyContent: "center" },
  iniciales: { fontSize: 17, fontWeight: "700" },
  autorTextos: { flex: 1 },
  nombre: TIPO.cuerpoFuerte,
  meta: TIPO.pequeno,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIO.s },
  descripcion: TIPO.cuerpo,
  pie: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ESPACIO.s, marginTop: ESPACIO.xs },
  pieDerecha: { justifyContent: "flex-end" },
  devolucion: { flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  enlace: { ...TIPO.cuerpoFuerte, fontSize: 15 },
});
