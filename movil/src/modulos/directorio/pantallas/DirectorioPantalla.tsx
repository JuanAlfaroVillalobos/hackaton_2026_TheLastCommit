import { OFICIOS } from "@/compartido/constantes/oficios";
import { ESPACIO, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Boton, Icono, Tarjeta } from "@/compartido/ui";
import { MapaBase } from "@/compartido/ui/MapaBase";
import { distanciaMetros } from "@/compartido/utilidades/geo";
import { useSesion } from "@/nucleo/sesion";
import { useUbicacionValidada } from "@/nucleo/ubicacion/useUbicacionValidada";
import { useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { alternarVistoBueno, listarDirectorio, listarTrabajos, marcarTrabajoCubierto, mostrarInteres } from "../servicios/directorioServicio";
import type { ServicioDirectorio, TrabajoDirectorio } from "../tipos";
import FichaDirectorioPantalla from "./FichaDirectorioPantalla";
import PublicarDirectorioPantalla from "./PublicarDirectorioPantalla";

type Vista = "fichas" | "trabajos";
type FiltroTipo = "todos" | "oficio" | "servicio" | "producto";
type FiltroMapa = "lista" | "mapa";

const ETIQUETAS_TIPO: Record<FiltroTipo, string> = {
  todos: "Todos",
  oficio: "Oficios",
  servicio: "Servicios",
  producto: "Productos",
};

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((parte) => parte[0] ?? "").join("").toUpperCase();
}

function distanciaEtiqueta(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`;
}

async function contactar(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("No se pudo abrir", "Revisa que tengas una aplicación disponible para este contacto.");
  }
}

function telefonoUrl(telefono: string | null, whatsapp = false): string | null {
  if (!telefono) return null;
  const numero = telefono.replace(/\D/g, "");
  if (!numero) return null;
  if (whatsapp) return `https://wa.me/${numero.startsWith("51") ? numero : `51${numero}`}`;
  return `tel:+${numero.startsWith("51") ? numero : `51${numero}`}`;
}

export default function DirectorioPantalla() {
  const { colores } = useTema();
  const { perfil } = useSesion();
  const { pedir: pedirUbicacion, buscando: buscandoUbicacion } = useUbicacionValidada();
  const [fichas, setFichas] = useState<ServicioDirectorio[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajoDirectorio[]>([]);
  const [vista, setVista] = useState<Vista>("fichas");
  const [formulario, setFormulario] = useState<"servicio" | "trabajo" | null>(null);
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas las categorías");
  const [modoMapa, setModoMapa] = useState<FiltroMapa>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  async function recargar() {
    const [servicios, avisos] = await Promise.all([listarDirectorio(), listarTrabajos()]);
    setFichas(servicios);
    setTrabajos(avisos);
    setCargando(false);
  }

  useEffect(() => {
    let vigente = true;
    Promise.all([listarDirectorio(), listarTrabajos()])
      .then(([servicios, avisos]) => {
        if (!vigente) return;
        setFichas(servicios);
        setTrabajos(avisos);
        setCargando(false);
      })
      .catch(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (fichaSeleccionada) {
    return <FichaDirectorioPantalla id={fichaSeleccionada} onVolver={() => setFichaSeleccionada(null)} />;
  }
  if (formulario) {
    return <PublicarDirectorioPantalla modo={formulario} onCancelar={() => setFormulario(null)} onPublicado={() => {
      setFormulario(null);
      void recargar();
    }} />;
  }

  const centro = perfil?.ubicacion;
  const fichasEnRadio = centro ? fichas.filter((ficha) => distanciaMetros(centro, ficha.ubicacion) <= 3000) : [];
  const categorias = ["Todas las categorías", ...new Set(fichasEnRadio.map((ficha) => ficha.categoria))];
  const fichasVisibles = fichasEnRadio
    .filter((ficha) => filtroTipo === "todos" || ficha.tipo === filtroTipo)
    .filter((ficha) => filtroCategoria === "Todas las categorías" || ficha.categoria === filtroCategoria)
    .filter((ficha) => `${ficha.titulo} ${ficha.categoria} ${ficha.autor.nombre} ${ficha.descripcion}`.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .sort((a, b) => b.vistosBuenos - a.vistosBuenos || distanciaMetros(centro!, a.ubicacion) - distanciaMetros(centro!, b.ubicacion) || b.creadoEn - a.creadoEn);
  const misOficios = new Set<string>((perfil?.oficios ?? []).map((oficio) => OFICIOS[oficio]));
  const trabajosEnRadio = centro ? trabajos.filter((trabajo) => distanciaMetros(centro, trabajo.ubicacion) <= 3000) : [];
  const trabajosVisibles = [...trabajosEnRadio].sort((a, b) => {
    const coincideA = misOficios.has(a.oficio);
    const coincideB = misOficios.has(b.oficio);
    return Number(coincideB) - Number(coincideA) || b.creadoEn - a.creadoEn;
  });
  const categoriasTrabajo = [...new Set(trabajosVisibles.map((trabajo) => trabajo.oficio))];
  const centroMapa = centro ?? fichasEnRadio[0]?.ubicacion ?? { lat: -8.1116, lng: -79.0288 };

  async function actualizarVistoBueno(ficha: ServicioDirectorio) {
    if (!perfil) return Alert.alert("Inicia sesión", "Necesitas una cuenta para participar.");
    if (perfil.estadoIdentidad === "NO_ENVIADA") return Alert.alert("Identidad pendiente", "Envía tu identidad para dar un Visto Bueno.");
    const existente = ficha.vistosBuenosUids.includes(perfil.uid);
    try {
      await alternarVistoBueno(ficha.id, perfil, "");
      await recargar();
      Alert.alert(existente ? "Visto Bueno retirado" : "Visto Bueno registrado", existente ? "Puedes volver a darlo cuando quieras." : "Gracias por recomendar a tu vecino.");
    } catch (error) {
      Alert.alert("No se pudo completar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    }
  }

  async function interesarse(trabajo: TrabajoDirectorio) {
    if (!perfil) return Alert.alert("Inicia sesión", "Necesitas una cuenta para mostrar interés.");
    try {
      await mostrarInteres(trabajo.id, perfil);
      await recargar();
      Alert.alert("Interés enviado", "Quien publicó el trabajo ya puede ver tu perfil.");
    } catch (error) {
      Alert.alert("No se pudo completar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    }
  }

  async function cubrirTrabajo(trabajo: TrabajoDirectorio) {
    if (!perfil) return;
    try {
      await marcarTrabajoCubierto(trabajo.id, perfil.uid);
      await recargar();
    } catch (error) {
      Alert.alert("No se pudo actualizar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    }
  }

  const chip = (activo: boolean) => ({
    backgroundColor: activo ? colores.texto : colores.superficie,
    borderColor: activo ? colores.texto : colores.borde,
  });

  return (
    <View style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.encabezado}>
          <View style={styles.marca}>
            <Icono nombre="build" color={colores.primario} tamano={26} />
            <View>
              <Text style={[styles.nombreApp, { color: colores.texto }]}>Servicios</Text>
              <Text style={[styles.barrio, { color: colores.textoSecundario }]} numberOfLines={1}>{perfil?.barrio ?? "Tu comunidad"}</Text>
            </View>
          </View>
          <View style={[styles.zonaPill, { backgroundColor: colores.sosFondo }]}>
            <Icono nombre="shield" color={colores.sos} tamano={15} />
            <Text style={[styles.zonaTexto, { color: colores.sos }]}>SOS</Text>
          </View>
        </View>

        <Text style={[styles.eyebrow, { color: colores.primario }]}>ECONOMÍA LOCAL</Text>
        <Text style={[styles.titulo, { color: colores.texto }]}>Talento y trabajo, a unos pasos.</Text>
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>Oficios, productos y oportunidades de tus vecinos.</Text>

        <View style={styles.accionesPrincipales}>
          <Boton texto="Publicar mi servicio" onPress={() => setFormulario("servicio")} icono="add" />
          <Pressable onPress={() => setFormulario("trabajo")} style={[styles.botonTrabajo, { borderColor: colores.borde }]}>
            <Icono nombre="handyman" color={colores.primario} tamano={19} />
            <Text style={[styles.botonTrabajoTexto, { color: colores.texto }]}>Publicar trabajo</Text>
          </Pressable>
        </View>

        <View style={[styles.segmentado, { backgroundColor: colores.superficieAlterna }]}>
          {(["fichas", "trabajos"] as const).map((opcion) => {
            const activo = vista === opcion;
            return (
              <Pressable key={opcion} onPress={() => setVista(opcion)} style={[styles.segmento, activo ? { backgroundColor: colores.superficie } : null]}>
                <Text style={[styles.segmentoTexto, { color: activo ? colores.texto : colores.textoSecundario }]}>{opcion === "fichas" ? "Servicios" : "Trabajos"}</Text>
              </Pressable>
            );
          })}
        </View>

        {vista === "fichas" ? (
          <>
            <View style={[styles.busqueda, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
              <Icono nombre="search" color={colores.textoSecundario} tamano={20} />
              <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar un oficio o producto" placeholderTextColor={colores.textoSecundario} style={[styles.inputBusqueda, { color: colores.texto }]} returnKeyType="search" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
              {(Object.keys(ETIQUETAS_TIPO) as FiltroTipo[]).map((tipo) => (
                <Pressable key={tipo} onPress={() => setFiltroTipo(tipo)} style={[styles.chip, chip(filtroTipo === tipo)]}>
                  <Text style={[styles.chipTexto, { color: filtroTipo === tipo ? colores.superficie : colores.texto }]}>{ETIQUETAS_TIPO[tipo]}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
              {categorias.map((categoria) => (
                <Pressable key={categoria} onPress={() => setFiltroCategoria(categoria)} style={[styles.chip, chip(filtroCategoria === categoria)]}>
                  <Text style={[styles.chipTexto, { color: filtroCategoria === categoria ? colores.superficie : colores.texto }]}>{categoria}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.tituloLista}>
              <Text style={[styles.tituloSeccion, { color: colores.texto }]}>Servicios de proximidad</Text>
              <Text style={[styles.ubicacionLista, { color: colores.textoSecundario }]}>{perfil?.barrio ?? "3 km a la redonda"}</Text>
            </View>
            <View style={[styles.segmentado, styles.segmentadoPequeno, { backgroundColor: colores.superficieAlterna }]}>
              {(["lista", "mapa"] as const).map((opcion) => (
                <Pressable key={opcion} onPress={() => setModoMapa(opcion)} style={[styles.segmento, modoMapa === opcion ? { backgroundColor: colores.superficie } : null]}>
                  <Icono nombre={opcion === "lista" ? "view_list" : "map"} color={modoMapa === opcion ? colores.primario : colores.textoSecundario} tamano={18} />
                  <Text style={[styles.segmentoTexto, { color: colores.texto }]}>{opcion === "lista" ? "Lista" : "Mapa"}</Text>
                </Pressable>
              ))}
            </View>
            {!centro ? (
              <Tarjeta>
                <Text style={[styles.sinUbicacion, { color: colores.texto }]}>Comparte tu ubicación para ver fichas cercanas.</Text>
                <Text style={[styles.textoSecundario, { color: colores.textoSecundario }]}>Solo mostramos servicios dentro de 3 km.</Text>
                <Boton texto={buscandoUbicacion ? "Buscando ubicación..." : "Validar mi ubicación"} onPress={() => void pedirUbicacion()} icono="my_location" deshabilitado={buscandoUbicacion} />
              </Tarjeta>
            ) : modoMapa === "mapa" ? (
              <MapaBase
                centro={centroMapa}
                delta={0.035}
                estilo={styles.mapa}
                marcadores={fichasVisibles.map((ficha) => ({ id: ficha.id, lat: ficha.ubicacion.lat, lng: ficha.ubicacion.lng, titulo: ficha.titulo, descripcion: ficha.categoria, color: colores.primario, icono: ficha.categoria[0]?.toUpperCase() ?? "S" }))}
                onMarcadorPress={setFichaSeleccionada}
              />
            ) : cargando ? (
              <Text style={[styles.textoSecundario, { color: colores.textoSecundario }]}>Cargando servicios...</Text>
            ) : fichasVisibles.length ? (
              fichasVisibles.map((ficha) => {
                const distancia = distanciaMetros(centro, ficha.ubicacion);
                return (
                  <Tarjeta key={ficha.id} style={styles.tarjetaFicha}>
                    <Pressable onPress={() => setFichaSeleccionada(ficha.id)} accessibilityRole="button" accessibilityLabel={`Ver ${ficha.titulo}`}>
                      <View style={styles.autorFila}>
                        {ficha.autor.fotoUrl ? <Image source={{ uri: ficha.autor.fotoUrl }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{iniciales(ficha.autor.nombre)}</Text></View>}
                        <View style={styles.autorDatos}>
                          <View style={styles.autorNombreFila}>
                            <Text style={[styles.autorNombre, { color: colores.texto }]} numberOfLines={1}>{ficha.autor.nombre}</Text>
                            {ficha.autor.identidad === "VERIFICADA" ? <Icono nombre="verified" color={colores.exito} tamano={16} /> : null}
                          </View>
                          <Text style={[styles.metaTexto, { color: colores.textoSecundario }]}>{distanciaEtiqueta(distancia)} · {ficha.autor.barrio}</Text>
                        </View>
                        <Icono nombre="more_horiz" color={colores.textoSecundario} tamano={20} />
                      </View>
                      <View style={styles.etiquetas}>
                        <Text style={[styles.tag, { backgroundColor: colores.acentoFondo, color: colores.texto }]}>{ficha.categoria}</Text>
                        <Text style={[styles.tag, { backgroundColor: colores.superficieAlterna, color: colores.textoSecundario }]}>{ficha.tipo === "producto" ? "Producto" : ficha.tipo === "oficio" ? "Oficio" : "Servicio"}</Text>
                      </View>
                      <Text style={[styles.fichaTitulo, { color: colores.texto }]}>{ficha.titulo}</Text>
                      <Text style={[styles.fichaDescripcion, { color: colores.textoSecundario }]} numberOfLines={4}>{ficha.descripcion}</Text>
                      {ficha.fotos?.[0] ? <Image source={{ uri: ficha.fotos[0] }} style={styles.fotoFicha} /> : null}
                      <View style={styles.infoFila}>
                        <View style={styles.infoItem}><Icono nombre="thumb_up" color={colores.primario} tamano={17} /><Text style={[styles.infoTexto, { color: colores.textoSecundario }]}>{ficha.vistosBuenos} Vistos Buenos</Text></View>
                        <Text style={[styles.infoTexto, { color: colores.textoSecundario }]}>{ficha.horasAyudadas} h ayudadas</Text>
                      </View>
                    </Pressable>
                    <View style={[styles.divisor, { backgroundColor: colores.borde }]} />
                    <View style={styles.accionesFicha}>
                      <Pressable onPress={() => void actualizarVistoBueno(ficha)} style={styles.accionSecundaria}>
                        <Icono nombre={ficha.vistosBuenosUids.includes(perfil?.uid ?? "") ? "thumb_up" : "thumb_up_off_alt"} color={colores.primario} tamano={17} />
                        <Text style={[styles.accionTexto, { color: colores.textoSecundario }]}>{ficha.vistosBuenosUids.includes(perfil?.uid ?? "") ? "Retirar" : "Dar Visto Bueno"}</Text>
                      </Pressable>
                      <Pressable onPress={() => setFichaSeleccionada(ficha.id)} style={styles.accionSecundaria}>
                        <Text style={[styles.accionTexto, { color: colores.texto }]}>Ver ficha</Text>
                        <Icono nombre="arrow_forward" color={colores.texto} tamano={17} />
                      </Pressable>
                    </View>
                  </Tarjeta>
                );
              })
            ) : (
              <Tarjeta><Text style={[styles.sinUbicacion, { color: colores.texto }]}>No hay fichas con estos filtros.</Text></Tarjeta>
            )}
          </>
        ) : (
          <>
            <View style={styles.tituloLista}>
              <View><Text style={[styles.tituloSeccion, { color: colores.texto }]}>Trabajos cercanos</Text><Text style={[styles.textoSecundario, { color: colores.textoSecundario }]}>Primero aparecen los de tus oficios.</Text></View>
              <Text style={[styles.ubicacionLista, { color: colores.textoSecundario }]}>3 km</Text>
            </View>
            {categoriasTrabajo.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>{categoriasTrabajo.map((oficio) => <Text key={oficio} style={[styles.tag, { backgroundColor: misOficios.has(oficio) ? colores.exitoFondo : colores.superficieAlterna, color: misOficios.has(oficio) ? colores.exito : colores.textoSecundario }]}>{misOficios.has(oficio) ? "Para ti · " : ""}{oficio}</Text>)}</ScrollView> : null}
            {!centro ? <Tarjeta><Text style={[styles.sinUbicacion, { color: colores.texto }]}>Comparte tu ubicación para ver trabajos cercanos.</Text><Boton texto={buscandoUbicacion ? "Buscando ubicación..." : "Validar mi ubicación"} onPress={() => void pedirUbicacion()} icono="my_location" deshabilitado={buscandoUbicacion} /></Tarjeta> : null}
            {trabajosVisibles.map((trabajo) => {
              const esAutor = trabajo.autor.uid === perfil?.uid;
              const interesado = trabajo.interesados.some((persona) => persona.uid === perfil?.uid);
              return (
                <Tarjeta key={trabajo.id} style={styles.tarjetaTrabajo}>
                  <View style={styles.autorFila}>
                    {trabajo.autor.fotoUrl ? <Image source={{ uri: trabajo.autor.fotoUrl }} style={styles.avatarPequeno} /> : <View style={[styles.avatarPequeno, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{iniciales(trabajo.autor.nombre)}</Text></View>}
                    <View style={styles.autorDatos}><Text style={[styles.autorNombre, { color: colores.texto }]}>{esAutor ? "Tu publicación" : trabajo.autor.nombre}</Text><Text style={[styles.metaTexto, { color: colores.textoSecundario }]}>{trabajo.autor.barrio} · vence el {new Date(trabajo.venceEn).toLocaleDateString("es-PE")}</Text></View>
                    <Icono nombre="work" color={colores.primario} tamano={19} />
                  </View>
                  <Text style={[styles.tag, { alignSelf: "flex-start", backgroundColor: colores.acentoFondo, color: colores.texto }]}>{trabajo.oficio}</Text>
                  <Text style={[styles.fichaDescripcion, { color: colores.texto, marginTop: ESPACIO.s }]}>{trabajo.descripcion}</Text>
                  <Text style={[styles.metaTexto, { color: colores.textoSecundario, marginTop: ESPACIO.s }]}>{new Date(trabajo.fechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })} · {typeof trabajo.pago === "number" ? `S/ ${trabajo.pago.toFixed(2)}` : trabajo.pago ?? "Pago a convenir"}</Text>
                  {esAutor ? (
                    <>
                      <Text style={[styles.seccionInteresados, { color: colores.texto }]}>Interesados · {trabajo.interesados.length}</Text>
                      {trabajo.interesados.map((persona) => <View key={persona.uid} style={[styles.interesadoFila, { borderTopColor: colores.borde }]}>{persona.fotoUrl ? <Image source={{ uri: persona.fotoUrl }} style={styles.avatarPequeno} /> : <View style={[styles.avatarPequeno, { backgroundColor: colores.primarioSuave }]}><Text style={[styles.avatarTexto, { color: colores.texto }]}>{iniciales(persona.nombre)}</Text></View>}<Text style={[styles.autorNombre, { color: colores.texto, flex: 1 }]}>{persona.nombre} · {persona.vistosBuenos} Vistos Buenos</Text>{telefonoUrl(persona.telefono) ? <Pressable onPress={() => void contactar(telefonoUrl(persona.telefono)!)}><Icono nombre="call" color={colores.primario} tamano={20} /></Pressable> : null}{telefonoUrl(persona.whatsapp, true) ? <Pressable onPress={() => void contactar(telefonoUrl(persona.whatsapp, true)!)}><Icono nombre="chat" color={colores.exito} tamano={20} /></Pressable> : null}</View>)}
                      <Pressable onPress={() => void cubrirTrabajo(trabajo)} style={[styles.cubierto, { borderColor: colores.borde }]}><Text style={[styles.accionTexto, { color: colores.textoSecundario }]}>Marcar como cubierto</Text></Pressable>
                    </>
                  ) : <Boton texto={interesado ? "Interés enviado" : "Me interesa"} onPress={() => void interesarse(trabajo)} icono={interesado ? "check" : "send"} deshabilitado={interesado} />}
                </Tarjeta>
              );
            })}
            {centro && !trabajosVisibles.length ? <Tarjeta><Text style={[styles.sinUbicacion, { color: colores.texto }]}>Todavía no hay trabajos en tu zona.</Text></Tarjeta> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingHorizontal: ESPACIO.l, paddingTop: ESPACIO.s, paddingBottom: ESPACIO.xxl, gap: ESPACIO.m },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: ESPACIO.s },
  marca: { flexDirection: "row", gap: ESPACIO.s, alignItems: "center", flexShrink: 1 },
  nombreApp: { ...TIPO.cuerpoFuerte, fontSize: 17 },
  barrio: { ...TIPO.pequeno, fontSize: 12 },
  zonaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIO.pildora },
  zonaTexto: { fontSize: 12, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  titulo: { ...TIPO.titulo, fontSize: 26, lineHeight: 31, maxWidth: 350 },
  subtitulo: { ...TIPO.pequeno },
  accionesPrincipales: { gap: ESPACIO.s, marginTop: ESPACIO.xs },
  botonTrabajo: { minHeight: TACTIL_MIN, borderWidth: 1, borderRadius: RADIO.boton, paddingHorizontal: ESPACIO.l, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: ESPACIO.s },
  botonTrabajoTexto: { ...TIPO.cuerpoFuerte },
  segmentado: { flexDirection: "row", padding: 3, borderRadius: RADIO.pildora, gap: 3, marginTop: ESPACIO.s },
  segmento: { flex: 1, minHeight: 40, borderRadius: RADIO.pildora, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: ESPACIO.xs },
  segmentoTexto: { fontSize: 14, fontWeight: "700" },
  busqueda: { minHeight: 48, borderWidth: 1, borderRadius: RADIO.boton, flexDirection: "row", alignItems: "center", gap: ESPACIO.s, paddingHorizontal: ESPACIO.m, marginTop: ESPACIO.s },
  inputBusqueda: { flex: 1, ...TIPO.pequeno, paddingVertical: 8 },
  filaChips: { gap: ESPACIO.s, alignItems: "center", paddingVertical: ESPACIO.xs },
  chip: { paddingHorizontal: ESPACIO.m, paddingVertical: ESPACIO.s, borderWidth: 1, borderRadius: RADIO.pildora },
  chipTexto: { fontSize: 13, fontWeight: "600" },
  tituloLista: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: ESPACIO.s },
  tituloSeccion: { ...TIPO.cuerpoFuerte },
  ubicacionLista: { ...TIPO.pequeno, fontSize: 12 },
  segmentadoPequeno: { alignSelf: "flex-start", minWidth: 170, marginTop: 0 },
  mapa: { height: 360, borderRadius: RADIO.tarjeta, overflow: "hidden" },
  tarjetaFicha: { padding: ESPACIO.m, gap: ESPACIO.s },
  autorFila: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarPequeno: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarTexto: { fontSize: 12, fontWeight: "800" },
  autorDatos: { flex: 1, minWidth: 0 },
  autorNombreFila: { flexDirection: "row", alignItems: "center", gap: 4 },
  autorNombre: { ...TIPO.pequeno, fontWeight: "700", flexShrink: 1 },
  metaTexto: { fontSize: 12, lineHeight: 17 },
  etiquetas: { flexDirection: "row", gap: ESPACIO.xs, flexWrap: "wrap" },
  tag: { fontSize: 12, fontWeight: "700", paddingHorizontal: ESPACIO.s, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  fichaTitulo: { ...TIPO.cuerpoFuerte, fontSize: 17, lineHeight: 22 },
  fichaDescripcion: { ...TIPO.pequeno },
  fotoFicha: { width: "100%", height: 170, borderRadius: 10, backgroundColor: "#E7E5E4" },
  infoFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ESPACIO.s },
  infoItem: { flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  infoTexto: { fontSize: 12 },
  divisor: { height: 1, marginVertical: 2 },
  accionesFicha: { flexDirection: "row", justifyContent: "space-between", gap: ESPACIO.s },
  accionSecundaria: { minHeight: TACTIL_MIN, flexDirection: "row", alignItems: "center", gap: ESPACIO.xs },
  accionTexto: { fontSize: 13, fontWeight: "700" },
  tarjetaTrabajo: { gap: ESPACIO.m },
  seccionInteresados: { ...TIPO.pequeno, fontWeight: "700", marginTop: ESPACIO.xs },
  interesadoFila: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: ESPACIO.m, borderTopWidth: 1, paddingTop: ESPACIO.s },
  cubierto: { minHeight: TACTIL_MIN, borderTopWidth: 1, alignItems: "center", justifyContent: "center" },
  sinUbicacion: { ...TIPO.cuerpoFuerte },
  textoSecundario: { ...TIPO.pequeno },
});