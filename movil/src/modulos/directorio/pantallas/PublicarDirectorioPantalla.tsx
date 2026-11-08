import { OFICIOS } from "@/compartido/constantes/oficios";
import { ESPACIO, RADIO, TIPO, useTema } from "@/compartido/tema";
import { Boton, Icono, Tarjeta } from "@/compartido/ui";
import { useSesion } from "@/nucleo/sesion";
import { useUbicacionValidada } from "@/nucleo/ubicacion/useUbicacionValidada";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { crearServicio, crearTrabajo } from "../servicios/directorioServicio";
import type { TipoDirectorio } from "../tipos";

type Props = { modo: "servicio" | "trabajo"; onCancelar: () => void; onPublicado: () => void };
type Paso = 1 | 2 | 3;

const CATEGORIAS: Record<TipoDirectorio, string[]> = {
  oficio: Object.values(OFICIOS),
  servicio: ["Hogar", "Clases y cuidados", "Limpieza", "Tecnología", "Belleza", "Otros"],
  producto: ["Alimentos caseros", "Bodega", "Ropa", "Artesanía", "Otros"],
};

const TIPOS: { id: TipoDirectorio; titulo: string; icono: "build" | "handyman" | "storefront" }[] = [
  { id: "oficio", titulo: "Oficio", icono: "build" },
  { id: "servicio", titulo: "Servicio", icono: "handyman" },
  { id: "producto", titulo: "Producto", icono: "storefront" },
];

function Campo({ etiqueta, ayuda, children, color }: { etiqueta: string; ayuda?: string; children: React.ReactNode; color: string }) {
  return <View style={styles.campo}><Text style={[styles.etiqueta, { color }]}>{etiqueta}</Text>{children}{ayuda ? <Text style={[styles.ayuda, { color }]}>{ayuda}</Text> : null}</View>;
}

export default function PublicarDirectorioPantalla({ modo, onCancelar, onPublicado }: Props) {
  const { colores } = useTema();
  const { perfil } = useSesion();
  const { pedir, buscando } = useUbicacionValidada();
  const [paso, setPaso] = useState<Paso>(1);
  const [tipo, setTipo] = useState<TipoDirectorio>("oficio");
  const [categoria, setCategoria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [horario, setHorario] = useState("");
  const [precio, setPrecio] = useState("");
  const [aConvenir, setAConvenir] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [oficioTrabajo, setOficioTrabajo] = useState("");
  const [fechaHora, setFechaHora] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [publicando, setPublicando] = useState(false);

  const trabajo = modo === "trabajo";
  const estaEnviada = perfil && perfil.estadoIdentidad !== "NO_ENVIADA";
  const campoEstilo = { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto };

  function continuar() {
    if (!perfil) return Alert.alert("Inicia sesión", "Necesitas una cuenta para publicar.");
    if (!estaEnviada) return Alert.alert("Envía tu identidad", "La identidad debe estar enviada antes de publicar.");
    if (paso === 1) {
      if (trabajo ? !oficioTrabajo : !categoria) return Alert.alert("Falta elegir", trabajo ? "Selecciona el oficio requerido." : "Selecciona una categoría.");
      setPaso(2);
      return;
    }
    if (paso === 2) {
      if (trabajo) {
        if (descripcion.trim().length < 10 || descripcion.trim().length > 280) return Alert.alert("Revisa la descripción", "Debe tener entre 10 y 280 caracteres.");
        if (!fechaHora || Number.isNaN(Date.parse(fechaHora)) || Date.parse(fechaHora) <= Date.now()) return Alert.alert("Revisa la fecha", "Ingresa una fecha y hora futura.");
      } else {
        if (titulo.trim().length < 5 || titulo.trim().length > 60) return Alert.alert("Revisa el título", "Debe tener entre 5 y 60 caracteres.");
        if (descripcion.trim().length < 10 || descripcion.trim().length > 280) return Alert.alert("Revisa la descripción", "Debe tener entre 10 y 280 caracteres.");
        if (precio && (!Number.isFinite(Number(precio)) || Number(precio) < 0)) return Alert.alert("Revisa el precio", "Ingresa un monto válido en soles.");
      }
      void pedir().then((resultado) => {
        if (!resultado) return;
        setUbicacion(resultado.coordenada);
        setPaso(3);
      });
    }
  }

  async function seleccionarFotos() {
    if (fotos.length >= 3) return;
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 3 - fotos.length, quality: 0.7 });
      if (!resultado.canceled) setFotos((actuales) => [...actuales, ...resultado.assets.map((asset) => asset.uri)].slice(0, 3));
    } catch {
      Alert.alert("No se pudieron cargar las fotos", "Inténtalo nuevamente.");
    }
  }

  async function publicar() {
    if (!perfil || !ubicacion || publicando) return;
    setPublicando(true);
    try {
      if (trabajo) {
        await crearTrabajo({ oficio: oficioTrabajo, descripcion: descripcion.trim(), fechaHora: new Date(fechaHora).toISOString(), pago: aConvenir ? "a convenir" : precio ? Number(precio) : undefined }, perfil, ubicacion);
      } else {
        await crearServicio({ tipo, categoria, titulo: titulo.trim(), descripcion: descripcion.trim(), horario: horario.trim() || undefined, fotos, precio: aConvenir ? "a convenir" : precio ? Number(precio) : undefined }, perfil, ubicacion);
      }
      Alert.alert("Publicado", trabajo ? "Tu trabajo estará disponible durante 7 días." : "Tu ficha ya está visible para los vecinos de tu zona.", [{ text: "Listo", onPress: onPublicado }]);
    } catch (error) {
      Alert.alert("No se pudo publicar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    } finally {
      setPublicando(false);
    }
  }

  const opcion = (activo: boolean) => ({ backgroundColor: activo ? colores.primarioSuave : colores.superficie, borderColor: activo ? colores.primario : colores.borde });

  return (
    <View style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.encabezado}>
          <Pressable onPress={paso === 1 ? onCancelar : () => setPaso((paso - 1) as Paso)} style={styles.volver} accessibilityRole="button" accessibilityLabel={paso === 1 ? "Cancelar publicación" : "Volver al paso anterior"}><Icono nombre="arrow_back" color={colores.texto} tamano={23} /></Pressable>
          <View style={styles.encabezadoTextos}><Text style={[styles.encabezadoTitulo, { color: colores.texto }]}>{trabajo ? "Publicar trabajo" : "Publicar servicio"}</Text><Text style={[styles.encabezadoSubtitulo, { color: colores.textoSecundario }]}>{perfil?.barrio ?? "Economía local"}</Text></View>
          <Text style={[styles.numeroPaso, { color: colores.primario }]}>{paso}/3</Text>
        </View>
        <View style={styles.progreso}>{([1, 2, 3] as const).map((numero) => <View key={numero} style={[styles.barraPaso, { backgroundColor: numero <= paso ? colores.primario : colores.borde }]} />)}</View>
        <Text style={[styles.eyebrow, { color: colores.primario }]}>{paso === 1 ? (trabajo ? "OFICIO REQUERIDO" : "QUÉ OFRECES") : paso === 2 ? "DETALLES" : "CONFIRMAR"}</Text>
        <Text style={[styles.titulo, { color: colores.texto }]}>{paso === 1 ? (trabajo ? "¿A quién estás buscando?" : "Tu talento también hace barrio.") : paso === 2 ? (trabajo ? "Cuéntanos qué necesitas." : "Dale forma a tu publicación.") : "Una última mirada."}</Text>
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>{paso === 1 ? "Elige la categoría que mejor describe tu publicación." : paso === 2 ? "Los vecinos podrán coordinar contigo directamente." : "Revisa la zona y los datos antes de publicar."}</Text>

        {paso === 1 ? (
          <>
            {trabajo ? <Campo etiqueta="Oficio requerido" color={colores.texto}><View style={styles.opciones}>{Object.values(OFICIOS).map((nombre) => <Pressable key={nombre} onPress={() => setOficioTrabajo(nombre)} style={[styles.opcion, opcion(oficioTrabajo === nombre)]}><Text style={[styles.opcionTexto, { color: colores.texto }]}>{nombre}</Text></Pressable>)}</View></Campo> : <>
              <Campo etiqueta="Tipo de publicación" color={colores.texto}><View style={styles.tipos}>{TIPOS.map((item) => <Pressable key={item.id} onPress={() => { setTipo(item.id); setCategoria(""); }} style={[styles.tipoOpcion, opcion(tipo === item.id)]}><Icono nombre={item.icono} color={tipo === item.id ? colores.primario : colores.textoSecundario} tamano={22} /><Text style={[styles.tipoTexto, { color: colores.texto }]}>{item.titulo}</Text></Pressable>)}</View></Campo>
              <Campo etiqueta="Categoría" color={colores.texto}><View style={styles.opciones}>{CATEGORIAS[tipo].map((nombre) => <Pressable key={nombre} onPress={() => setCategoria(nombre)} style={[styles.opcion, opcion(categoria === nombre)]}><Text style={[styles.opcionTexto, { color: colores.texto }]}>{nombre}</Text></Pressable>)}</View></Campo>
            </>}
          </>
        ) : null}

        {paso === 2 ? (
          <>
            {!trabajo ? <Campo etiqueta="Título" ayuda={`${titulo.length}/60`} color={colores.texto}><TextInput value={titulo} onChangeText={setTitulo} maxLength={60} placeholder="Ej. Gasfitería y pequeñas reparaciones" placeholderTextColor={colores.textoSecundario} style={[styles.input, campoEstilo]} /></Campo> : null}
            <Campo etiqueta={trabajo ? "Describe el trabajo" : "Describe lo que ofreces"} ayuda={`${descripcion.length}/280`} color={colores.texto}><TextInput value={descripcion} onChangeText={setDescripcion} maxLength={280} multiline placeholder={trabajo ? "Cuéntanos qué necesitas y cuándo." : "Cuéntanos qué haces, cómo trabajas y qué pueden esperar los vecinos."} placeholderTextColor={colores.textoSecundario} style={[styles.input, styles.inputMultilinea, campoEstilo]} /></Campo>
            {trabajo ? <Campo etiqueta="Fecha y hora" ayuda="Formato: año-mes-día, hora y minutos" color={colores.texto}><TextInput value={fechaHora} onChangeText={setFechaHora} placeholder="2026-11-09T09:00" placeholderTextColor={colores.textoSecundario} style={[styles.input, campoEstilo]} /></Campo> : <>
              <Campo etiqueta="Precio referencial" ayuda="Opcional · en soles" color={colores.texto}><View style={styles.precioFila}><TextInput value={precio} onChangeText={setPrecio} editable={!aConvenir} keyboardType="decimal-pad" placeholder="S/ 0.00" placeholderTextColor={colores.textoSecundario} style={[styles.input, styles.inputPrecio, campoEstilo, aConvenir ? styles.inputDesactivado : null]} /><Pressable onPress={() => setAConvenir((actual) => !actual)} style={[styles.opcion, styles.convenir, opcion(aConvenir)]}><Text style={[styles.opcionTexto, { color: colores.texto }]}>A convenir</Text></Pressable></View></Campo>
              <Campo etiqueta="Horario de atención" color={colores.texto}><TextInput value={horario} onChangeText={setHorario} placeholder="Ej. Lunes a sábado, 9:00 a 18:00" placeholderTextColor={colores.textoSecundario} style={[styles.input, campoEstilo]} /></Campo>
              <Campo etiqueta={`Fotos · ${fotos.length}/3`} ayuda="Opcionales" color={colores.texto}><View style={styles.fotosFila}>{fotos.map((foto, indice) => <View key={`${foto}-${indice}`} style={styles.fotoWrap}><Image source={{ uri: foto }} style={styles.fotoMiniatura} /><Pressable onPress={() => setFotos((actuales) => actuales.filter((_, indiceActual) => indiceActual !== indice))} style={[styles.quitarFoto, { backgroundColor: colores.superficie }]}><Icono nombre="close" color={colores.texto} tamano={16} /></Pressable></View>)}{fotos.length < 3 ? <Pressable onPress={() => void seleccionarFotos()} style={[styles.agregarFoto, { backgroundColor: colores.superficie, borderColor: colores.borde }]}><Icono nombre="add_a_photo" color={colores.primario} tamano={23} /><Text style={[styles.ayuda, { color: colores.textoSecundario }]}>Añadir</Text></Pressable> : null}</View></Campo>
            </>}
          </>
        ) : null}

        {paso === 3 ? (
          <>
            <Tarjeta style={styles.tarjetaResumen}>
              <View style={styles.autorFila}>{perfil?.fotoUrl ? <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{perfil?.nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()}</Text></View>}<View style={styles.autorDatos}><Text style={[styles.autorNombre, { color: colores.texto }]}>{perfil?.nombre}</Text><Text style={[styles.ayuda, { color: colores.textoSecundario }]}>{perfil?.barrio ?? "Mi zona"}</Text></View>{perfil?.estadoIdentidad === "VERIFICADA" ? <Icono nombre="verified" color={colores.exito} tamano={19} /> : null}</View>
              <Text style={[styles.tag, { backgroundColor: colores.acentoFondo, color: colores.texto }]}>{trabajo ? oficioTrabajo : `${tipo === "oficio" ? "Oficio" : tipo === "producto" ? "Producto" : "Servicio"} · ${categoria}`}</Text>
              <Text style={[styles.resumenTitulo, { color: colores.texto }]}>{trabajo ? oficioTrabajo : titulo}</Text>
              <Text style={[styles.resumenDescripcion, { color: colores.textoSecundario }]}>{descripcion}</Text>
              {trabajo ? <Text style={[styles.ayuda, { color: colores.textoSecundario }]}>{new Date(fechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })} · {aConvenir ? "Pago a convenir" : precio ? `S/ ${precio}` : "Pago a convenir"}</Text> : <>
                {precio || aConvenir ? <Text style={[styles.precioResumen, { color: colores.texto }]}>{aConvenir ? "Precio a convenir" : `S/ ${precio}`}</Text> : null}
                {horario ? <Text style={[styles.ayuda, { color: colores.textoSecundario }]}>{horario}</Text> : null}
                {fotos.map((foto, indice) => <Image key={`${foto}-${indice}`} source={{ uri: foto }} style={styles.fotoPreview} />)}
              </>}
            </Tarjeta>
            <Tarjeta style={styles.zonaTarjeta}><View style={styles.zonaIcono}><Icono nombre="location_on" color={colores.primario} tamano={20} /></View><View style={styles.autorDatos}><Text style={[styles.autorNombre, { color: colores.texto }]}>{perfil?.barrio ?? "Ubicación validada"}</Text><Text style={[styles.ayuda, { color: colores.textoSecundario }]}>{ubicacion ? `Ubicación confirmada · ${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}` : "Confirma tu ubicación para continuar"}</Text></View></Tarjeta>
            <Text style={[styles.notaFinal, { color: colores.textoSecundario }]}>{trabajo ? "Tu trabajo vencerá en 7 días o cuando lo marques como cubierto." : "Tu ficha aparecerá para los vecinos dentro de 3 km."}</Text>
          </>
        ) : null}

        {paso < 3 ? <Boton texto={paso === 1 ? "Continuar" : "Confirmar ubicación"} onPress={continuar} icono="arrow_forward" deshabilitado={buscando} /> : <Boton texto={publicando ? "Publicando..." : trabajo ? "Publicar trabajo" : "Publicar servicio"} onPress={() => void publicar()} icono="send" deshabilitado={publicando} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { padding: ESPACIO.l, paddingBottom: ESPACIO.xxl, gap: ESPACIO.m },
  encabezado: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s },
  volver: { width: 40, height: 44, justifyContent: "center" },
  encabezadoTextos: { flex: 1 },
  encabezadoTitulo: { ...TIPO.cuerpoFuerte },
  encabezadoSubtitulo: { fontSize: 12 },
  numeroPaso: { fontSize: 14, fontWeight: "800" },
  progreso: { flexDirection: "row", gap: ESPACIO.xs },
  barraPaso: { flex: 1, height: 4, borderRadius: 2 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginTop: ESPACIO.s },
  titulo: { ...TIPO.titulo, fontSize: 25, lineHeight: 30 },
  subtitulo: { ...TIPO.pequeno },
  campo: { gap: ESPACIO.s, marginTop: ESPACIO.s },
  etiqueta: { ...TIPO.pequeno, fontWeight: "700" },
  ayuda: { fontSize: 12 },
  tipos: { flexDirection: "row", gap: ESPACIO.s },
  tipoOpcion: { flex: 1, minHeight: 76, borderWidth: 1, borderRadius: RADIO.boton, alignItems: "center", justifyContent: "center", gap: ESPACIO.xs },
  tipoTexto: { fontSize: 13, fontWeight: "700" },
  opciones: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIO.s },
  opcion: { minHeight: 40, justifyContent: "center", borderWidth: 1, borderRadius: RADIO.pildora, paddingHorizontal: ESPACIO.m },
  opcionTexto: { fontSize: 13, fontWeight: "600" },
  input: { minHeight: 50, borderWidth: 1, borderRadius: RADIO.boton, paddingHorizontal: ESPACIO.m, ...TIPO.pequeno },
  inputMultilinea: { minHeight: 130, paddingTop: ESPACIO.m, textAlignVertical: "top" },
  precioFila: { flexDirection: "row", gap: ESPACIO.s },
  inputPrecio: { flex: 1 },
  inputDesactivado: { opacity: 0.55 },
  convenir: { alignSelf: "center", minHeight: 48 },
  fotosFila: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIO.s },
  fotoWrap: { position: "relative" },
  fotoMiniatura: { width: 82, height: 82, borderRadius: RADIO.boton },
  quitarFoto: { position: "absolute", right: -5, top: -5, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  agregarFoto: { width: 82, height: 82, borderWidth: 1, borderStyle: "dashed", borderRadius: RADIO.boton, alignItems: "center", justifyContent: "center", gap: 3 },
  tarjetaResumen: { gap: ESPACIO.m },
  autorFila: { flexDirection: "row", gap: ESPACIO.s, alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTexto: { fontSize: 12, fontWeight: "800" },
  autorDatos: { flex: 1, minWidth: 0 },
  autorNombre: { ...TIPO.pequeno, fontWeight: "700" },
  tag: { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", paddingHorizontal: ESPACIO.s, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  resumenTitulo: { ...TIPO.cuerpoFuerte, fontSize: 19 },
  resumenDescripcion: { ...TIPO.pequeno },
  precioResumen: { ...TIPO.pequeno, fontWeight: "700" },
  fotoPreview: { width: "100%", height: 160, borderRadius: RADIO.boton },
  zonaTarjeta: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s },
  zonaIcono: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: RADIO.pildora, backgroundColor: "#FFF7ED" },
  notaFinal: { ...TIPO.pequeno, fontSize: 12 },
});