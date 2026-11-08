// Ruta: src/modulos/ayuda-humanitaria/componentes/TarjetaReporte.tsx
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  COLOR_ESTADO_REPORTE,
  ETIQUETA_ESTADO_REPORTE,
  ETIQUETA_TIPO_VULNERABILIDAD,
  ICONO_TIPO_VULNERABILIDAD,
} from "../constantes";
import type { Colores } from "../estilos";
import { FotoReporte } from "./FotoReporte";
import { puedeAyudar, puedeResolver, tiempoDesde } from "../reglas";
import type { ReporteVulnerabilidad } from "../tipos";

type Props = {
  reporte: ReporteVulnerabilidad;
  ahora: number;
  miUid: string;
  onAyudar: (id: string) => void;
  onResolver: (id: string) => void;
};

export function TarjetaReporte({ reporte: r, ahora, miUid, onAyudar, onResolver }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const color = COLOR_ESTADO_REPORTE[r.estado];
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <Text style={styles.icono}>{ICONO_TIPO_VULNERABILIDAD[r.tipo]}</Text>
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>{ETIQUETA_TIPO_VULNERABILIDAD[r.tipo]}</Text>
          <Text style={styles.detalle}>
            {r.personas} {r.personas === 1 ? "persona" : "personas"} · {tiempoDesde(r.creadoEn, ahora)} · {r.codigo}
          </Text>
        </View>
        <View style={[styles.insignia, { backgroundColor: color }]}>
          <Text style={styles.insigniaTexto}>{ETIQUETA_ESTADO_REPORTE[r.estado]}</Text>
        </View>
      </View>

      {r.nota ? <Text style={styles.nota}>{r.nota}</Text> : null}
      {r.tieneFoto ? <FotoReporte reporteId={r.id} /> : null}

      {puedeAyudar(r, miUid) ? (
        <Pressable accessibilityRole="button" style={styles.boton} onPress={() => onAyudar(r.id)}>
          <Text style={styles.botonTexto}>Voy a ayudar</Text>
        </Pressable>
      ) : null}
      {puedeResolver(r, miUid) ? (
        <Pressable accessibilityRole="button" style={styles.botonSecundario} onPress={() => onResolver(r.id)}>
          <Text style={styles.botonSecundarioTexto}>Marcar como resuelto</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  tarjeta: {
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cabecera: { flexDirection: "row", alignItems: "center" },
  icono: { fontSize: 28, marginRight: 10 },
  cabeceraTexto: { flex: 1 },
  titulo: { color: T.texto, fontSize: 15, fontWeight: "700" },
  detalle: { color: T.textoSecundario, fontSize: 12, marginTop: 2 },
  insignia: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  insigniaTexto: { color: "#1A0000", fontSize: 11, fontWeight: "800" },
  nota: { color: T.texto, fontSize: 14, marginTop: 10 },
  boton: {
    backgroundColor: T.primario,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
  },
  botonTexto: { color: T.sobrePrimario, fontSize: 15, fontWeight: "800" },
  botonSecundario: {
    borderColor: T.primario,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  botonSecundarioTexto: { color: T.primario, fontSize: 14, fontWeight: "700" },
});