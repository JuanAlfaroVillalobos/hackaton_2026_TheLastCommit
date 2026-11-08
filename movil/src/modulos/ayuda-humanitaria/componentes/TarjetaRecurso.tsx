// Ruta: src/modulos/ayuda-humanitaria/componentes/TarjetaRecurso.tsx
import type { Colores } from "../estilos";
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ACCION_RECURSO,
  COLOR_ESTADO_RECURSO,
  COLOR_MODO_RECURSO,
  ETIQUETA_ESTADO_RECURSO,
  ETIQUETA_MODO_RECURSO,
  ETIQUETA_TIPO_RECURSO,
  ICONO_TIPO_RECURSO,
} from "../constantesRecursos";
import { puedeAsignarse, puedeCerrarRecurso, tiempoDesde } from "../reglas";
import type { RecursoCritico } from "../tipos";

type Props = {
  recurso: RecursoCritico;
  ahora: number;
  miUid: string;
  onAsignar: (id: string) => void;
  onCerrar: (id: string) => void;
};

export function TarjetaRecurso({ recurso: r, ahora, miUid, onAsignar, onCerrar }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  const colorModo = COLOR_MODO_RECURSO[r.modo];
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <Text style={styles.icono}>{ICONO_TIPO_RECURSO[r.tipo]}</Text>
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>
            {ETIQUETA_TIPO_RECURSO[r.tipo]} · {r.cantidad}
          </Text>
          <Text style={styles.detalle}>
            {tiempoDesde(r.creadoEn, ahora)} · {r.codigo} · {ETIQUETA_ESTADO_RECURSO[r.estado]}
          </Text>
        </View>
        <View style={[styles.insignia, { backgroundColor: colorModo }]}>
          <Text style={styles.insigniaTexto}>{ETIQUETA_MODO_RECURSO[r.modo]}</Text>
        </View>
      </View>

      <View style={[styles.franjaEstado, { backgroundColor: COLOR_ESTADO_RECURSO[r.estado] }]} />

      {puedeAsignarse(r, miUid) ? (
        <Pressable accessibilityRole="button" style={styles.boton} onPress={() => onAsignar(r.id)}>
          <Text style={styles.botonTexto}>{ACCION_RECURSO[r.modo]}</Text>
        </Pressable>
      ) : null}
      {puedeCerrarRecurso(r, miUid) ? (
        <Pressable accessibilityRole="button" style={styles.botonSecundario} onPress={() => onCerrar(r.id)}>
          <Text style={styles.botonSecundarioTexto}>Cerrar</Text>
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
  franjaEstado: { height: 3, borderRadius: 2, marginTop: 10 },
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
