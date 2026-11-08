import { ESPACIO, RADIO, TIPO, useTema } from "@/compartido/tema";
import { Boton, Icono, Tarjeta } from "@/compartido/ui";
import { distanciaMetros } from "@/compartido/utilidades/geo";
import { useSesion } from "@/nucleo/sesion";
import { useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { alternarVistoBueno, obtenerServicio } from "../servicios/directorioServicio";
import type { ServicioDirectorio } from "../tipos";

type Props = { id: string; onVolver: () => void };

function urlContacto(telefono: string | null, whatsapp = false): string | null {
  if (!telefono) return null;
  const numero = telefono.replace(/\D/g, "");
  if (!numero) return null;
  return whatsapp
    ? `https://wa.me/${numero.startsWith("51") ? numero : `51${numero}`}`
    : `tel:+${numero.startsWith("51") ? numero : `51${numero}`}`;
}

export default function FichaDirectorioPantalla({ id, onVolver }: Props) {
  const { colores } = useTema();
  const { perfil } = useSesion();
  const [ficha, setFicha] = useState<ServicioDirectorio | null>(null);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    void obtenerServicio(id).then(setFicha);
  }, [id]);

  async function cambiarVoto() {
    if (!perfil || !ficha) return Alert.alert("Inicia sesión", "Necesitas una cuenta para participar.");
    try {
      const creado = await alternarVistoBueno(ficha.id, perfil, comentario);
      setFicha(await obtenerServicio(id));
      setComentario("");
      Alert.alert(creado ? "Visto Bueno registrado" : "Visto Bueno retirado", creado ? "Gracias por recomendar a tu vecino." : "Puedes volver a darlo cuando quieras.");
    } catch (error) {
      Alert.alert("No se pudo completar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    }
  }

  async function abrirContacto(url: string | null) {
    if (!url) return Alert.alert("Contacto no disponible", "Este vecino todavía no agregó un número de contacto.");
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("No se pudo abrir", "Revisa que tengas una aplicación disponible para este contacto.");
    }
  }

  const distancia = ficha && perfil?.ubicacion ? distanciaMetros(perfil.ubicacion, ficha.ubicacion) : null;
  const puedeVotar = Boolean(
    perfil && ficha && perfil.uid !== ficha.autor.uid && perfil.estadoIdentidad !== "NO_ENVIADA" && distancia !== null && distancia <= 2000,
  );
  const yaVoto = ficha?.vistosBuenosUids.includes(perfil?.uid ?? "") ?? false;

  return (
    <View style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.barraSuperior}>
          <Pressable onPress={onVolver} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver al directorio">
            <Icono nombre="arrow_back" color={colores.texto} tamano={23} />
          </Pressable>
          <View style={styles.encabezadoTexto}>
            <Text style={[styles.encabezadoTitulo, { color: colores.texto }]}>Detalle del servicio</Text>
            <Text style={[styles.encabezadoSubtitulo, { color: colores.textoSecundario }]} numberOfLines={1}>{ficha?.autor.barrio ?? "Directorio local"}</Text>
          </View>
          <View style={[styles.sos, { backgroundColor: colores.sosFondo }]}><Icono nombre="shield" color={colores.sos} tamano={15} /><Text style={[styles.sosTexto, { color: colores.sos }]}>SOS</Text></View>
        </View>

        {!ficha ? <Text style={[styles.texto, { color: colores.textoSecundario }]}>Esta ficha no está disponible.</Text> : <>
          <View style={styles.autorFila}>
            {ficha.autor.fotoUrl ? <Image source={{ uri: ficha.autor.fotoUrl }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{ficha.autor.nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()}</Text></View>}
            <View style={styles.autorDatos}>
              <View style={styles.nombreFila}><Text style={[styles.nombre, { color: colores.texto }]}>{ficha.autor.nombre}</Text>{ficha.autor.identidad === "VERIFICADA" ? <Icono nombre="verified" color={colores.exito} tamano={18} /> : null}</View>
              <Text style={[styles.meta, { color: colores.textoSecundario }]}>{ficha.autor.barrio}{distancia !== null ? ` · ${distancia < 1000 ? `${Math.round(distancia)} m` : `${(distancia / 1000).toFixed(1)} km`}` : ""}</Text>
            </View>
            <Icono nombre="more_horiz" color={colores.textoSecundario} tamano={21} />
          </View>

          <View style={styles.etiquetas}>
            <Text style={[styles.tag, { backgroundColor: colores.acentoFondo, color: colores.texto }]}>{ficha.categoria}</Text>
            {ficha.autor.identidad === "VERIFICADA" ? <Text style={[styles.tag, { backgroundColor: colores.exitoFondo, color: colores.exito }]}>Identidad verificada</Text> : null}
          </View>
          <Text style={[styles.titulo, { color: colores.texto }]}>{ficha.titulo}</Text>
          {ficha.fotos?.map((foto, indice) => <Image key={`${foto}-${indice}`} source={{ uri: foto }} style={styles.foto} />)}
          <Text style={[styles.descripcion, { color: colores.texto }]}>{ficha.descripcion}</Text>
          {ficha.precio !== undefined ? <Text style={[styles.precio, { color: colores.texto }]}>{typeof ficha.precio === "number" ? `S/ ${ficha.precio.toFixed(2)}` : "Precio a convenir"}</Text> : null}
          {ficha.horario ? <View style={[styles.infoVerde, { backgroundColor: colores.exitoFondo }]}><Icono nombre="schedule" color={colores.exito} tamano={19} /><Text style={[styles.infoVerdeTexto, { color: colores.texto }]}>Atiende {ficha.horario}. Coordina el alcance y el presupuesto directamente con {ficha.autor.nombre.split(" ")[0]}.</Text></View> : null}
          <View style={styles.estadisticas}>
            <View style={styles.estadistica}><Icono nombre="thumb_up" color={colores.primario} tamano={19} /><Text style={[styles.estadisticaTexto, { color: colores.texto }]}>{ficha.vistosBuenos} Vistos Buenos</Text></View>
            <View style={styles.estadistica}><Icono nombre="schedule" color={colores.textoSecundario} tamano={18} /><Text style={[styles.estadisticaTexto, { color: colores.textoSecundario }]}>{ficha.horasAyudadas} horas ayudadas</Text></View>
          </View>

          <View style={styles.tituloComentarios}><Text style={[styles.tituloSeccion, { color: colores.texto }]}>Recomendaciones vecinales</Text><Text style={[styles.meta, { color: colores.textoSecundario }]}>{Math.min(3, ficha.comentariosVistoBueno.length)} comentarios</Text></View>
          {ficha.comentariosVistoBueno.slice(0, 3).map((comentario) => <View key={`${comentario.uid}-${comentario.creadoEn}`} style={[styles.comentario, { backgroundColor: colores.superficie }]}><View style={[styles.avatarComentario, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{comentario.nombre.slice(0, 1)}</Text></View><View style={styles.comentarioCuerpo}><View style={styles.nombreFila}><Text style={[styles.nombreComentario, { color: colores.texto }]}>{comentario.nombre}</Text><Text style={[styles.meta, { color: colores.textoSecundario }]}>Vecino</Text></View><Text style={[styles.textoComentario, { color: colores.texto }]}>{comentario.texto}</Text></View></View>)}
          {!ficha.comentariosVistoBueno.length ? <Text style={[styles.meta, { color: colores.textoSecundario }]}>Aún no hay comentarios de vecinos.</Text> : null}

          <Tarjeta style={styles.votoPanel}>
            <Text style={[styles.tituloSeccion, { color: colores.texto }]}>{yaVoto ? "Ya diste tu Visto Bueno" : "¿Te fue bien con este vecino?"}</Text>
            <Text style={[styles.metaAyuda, { color: colores.textoSecundario }]}>Tu recomendación ayuda a fortalecer los servicios del barrio.</Text>
            {!yaVoto ? <TextInput value={comentario} onChangeText={setComentario} maxLength={140} multiline placeholder="Deja un comentario (opcional)" placeholderTextColor={colores.textoSecundario} style={[styles.inputComentario, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]} /> : null}
            {!puedeVotar && !yaVoto ? <Text style={[styles.restriccion, { color: colores.textoSecundario }]}>{!perfil || perfil.estadoIdentidad === "NO_ENVIADA" ? "Envía tu identidad para participar." : perfil?.uid === ficha.autor.uid ? "No puedes recomendar tu propia ficha." : distancia === null ? "Comparte tu ubicación validada para participar." : "El Visto Bueno está disponible hasta 2 km."}</Text> : null}
            <Boton texto={yaVoto ? "Retirar Visto Bueno" : "Dar Visto Bueno"} onPress={() => void cambiarVoto()} icono="thumb_up" deshabilitado={!puedeVotar && !yaVoto} />
            {!yaVoto ? <Text style={[styles.contador, { color: colores.textoSecundario }]}>{comentario.length}/140</Text> : null}
          </Tarjeta>

          <View style={styles.contactos}>
            <Boton texto="Llamar" onPress={() => void abrirContacto(urlContacto(ficha.autor.telefono))} icono="call" variante="secundario" />
            <Boton texto="WhatsApp" onPress={() => void abrirContacto(urlContacto(ficha.autor.whatsapp, true))} icono="chat" />
          </View>
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { padding: ESPACIO.l, paddingBottom: ESPACIO.xxl, gap: ESPACIO.m },
  texto: { ...TIPO.pequeno },
  barraSuperior: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s, marginBottom: ESPACIO.s },
  volver: { width: 40, height: 44, alignItems: "flex-start", justifyContent: "center" },
  encabezadoTexto: { flex: 1, minWidth: 0 },
  encabezadoTitulo: { ...TIPO.cuerpoFuerte, fontSize: 16 },
  encabezadoSubtitulo: { fontSize: 12 },
  sos: { flexDirection: "row", gap: 3, alignItems: "center", padding: 7, borderRadius: RADIO.pildora },
  sosTexto: { fontSize: 11, fontWeight: "800" },
  autorFila: { flexDirection: "row", gap: ESPACIO.s, alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarComentario: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarTexto: { fontSize: 12, fontWeight: "800" },
  autorDatos: { flex: 1 },
  nombreFila: { flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  nombre: { ...TIPO.pequeno, fontWeight: "700" },
  meta: { fontSize: 12 },
  etiquetas: { flexDirection: "row", gap: ESPACIO.s, flexWrap: "wrap" },
  tag: { fontSize: 12, fontWeight: "700", paddingHorizontal: ESPACIO.s, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  titulo: { ...TIPO.titulo, fontSize: 24, lineHeight: 29 },
  foto: { width: "100%", height: 220, borderRadius: RADIO.boton, backgroundColor: "#E7E5E4" },
  descripcion: { ...TIPO.pequeno, lineHeight: 22 },
  precio: { ...TIPO.cuerpoFuerte, fontSize: 17 },
  infoVerde: { flexDirection: "row", alignItems: "flex-start", gap: ESPACIO.s, padding: ESPACIO.m, borderRadius: RADIO.boton },
  infoVerdeTexto: { flex: 1, ...TIPO.pequeno, fontSize: 13 },
  estadisticas: { flexDirection: "row", gap: ESPACIO.l, flexWrap: "wrap" },
  estadistica: { flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  estadisticaTexto: { ...TIPO.pequeno, fontWeight: "600" },
  tituloComentarios: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: ESPACIO.s },
  tituloSeccion: { ...TIPO.cuerpoFuerte },
  comentario: { flexDirection: "row", gap: ESPACIO.s, padding: ESPACIO.m, borderRadius: RADIO.boton },
  comentarioCuerpo: { flex: 1, gap: ESPACIO.xs },
  nombreComentario: { ...TIPO.pequeno, fontWeight: "700", flex: 1 },
  textoComentario: { ...TIPO.pequeno },
  votoPanel: { gap: ESPACIO.s },
  metaAyuda: { ...TIPO.pequeno, fontSize: 13 },
  inputComentario: { minHeight: 76, borderWidth: 1, borderRadius: RADIO.boton, padding: ESPACIO.m, textAlignVertical: "top", ...TIPO.pequeno },
  restriccion: { ...TIPO.pequeno, fontSize: 12 },
  contador: { textAlign: "right", fontSize: 12 },
  contactos: { gap: ESPACIO.s, marginBottom: ESPACIO.l },
});