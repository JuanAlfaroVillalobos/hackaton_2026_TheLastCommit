// Ruta: src/modulos/favores/pantallas/InicioPantalla.tsx
// P04 · Inicio (muro cercano). RF09, RF35, RF37, RF38, RN-04, RNF09/RF41 y RF08.
// Frames: 04-A muro · 04-B publicación activa · 04-C vacío · 04-D sin conexión · 04-E lluvia (tema).
//
// Layout: la franja «Sin conexión» va de borde a borde fuera de la lista; todo lo demás es una sola
// FlatList (virtualizada, con deslizar para refrescar) cuyo encabezado lleva saludo, accesos y acciones.
// El encabezado con «SOS» y la barra de pestañas los ponen los layouts de (privado) y (pestanas).
import { Boton, FranjaSinConexion, ListaVacia } from "@/compartido/ui";
import { ESPACIO, useTema, useTemaStore } from "@/compartido/tema";
import { formatearHace, primerNombre } from "@/compartido/utilidades/formatos";
import { usePendientesBandeja } from "@/nucleo/bandeja-salida";
import { abrirAjustesNotificaciones, usePermisoNotificaciones } from "@/nucleo/notificaciones";
import { useConexion } from "@/nucleo/red";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View, type ListRenderItem } from "react-native";
import { AccesosRapidos, type AccesoRapido } from "../componentes/AccesosRapidos";
import { AvisoNotificaciones } from "../componentes/AvisoNotificaciones";
import { CabeceraMuro } from "../componentes/CabeceraMuro";
import { SaludoInicio } from "../componentes/SaludoInicio";
import { TarjetaMiPublicacion } from "../componentes/TarjetaMiPublicacion";
import { TarjetaMuro } from "../componentes/TarjetaMuro";
import { TEXTOS_INICIO } from "../constantes";
import { hrefDetalleFavor } from "../rutas";
import { useMiPublicacion } from "../hooks/useMiPublicacion";
import { useMuro } from "../hooks/useMuro";
import { useVecinoActual } from "../hooks/useVecinoActual";
import { puedeCrearPublicacion } from "../reglas";
import type { ElementoMuro, PublicacionConAutor } from "../tipos";

/** Destinos ajenos al módulo Favores que siguen pendientes. */
function avisarProximamente(pantalla: string) {
  Alert.alert("Próximamente", `${pantalla} todavía no está disponible.`);
}

export function InicioPantalla() {
  const { colores } = useTema();
  const router = useRouter();
  const vecino = useVecinoActual();
  const emergenciaActiva = useTemaStore((estado) => estado.nombre === "emergencia");
  const { sinConexion } = useConexion();
  const pendientes = usePendientesBandeja();
  const permiso = usePermisoNotificaciones();

  const { elementos, cargando, refrescando, refrescar, filtro, setFiltro, actualizadoEn, ahora, error: errorMuro } = useMuro({
    uid: vecino.uid,
    oficios: vecino.oficios,
    centro: vecino.ubicacion,
  });
  const { publicacion: miNecesidad, error: errorNecesidad } = useMiPublicacion(vecino.necesidadActivaId);
  const { publicacion: miServicio, error: errorServicio } = useMiPublicacion(vecino.servicioActivoId);
  const misPublicaciones = [miNecesidad, miServicio].filter(
    (publicacion, indice, lista): publicacion is PublicacionConAutor =>
      publicacion !== null && lista.findIndex((otra) => otra?.id === publicacion.id) === indice,
  );
  const crear = puedeCrearPublicacion(vecino.necesidadActivaId);

  const accesos: AccesoRapido[] = useMemo(
    () => [
      { id: "servicios", texto: "Servicios", icono: "build", onPress: () => router.navigate("/servicios") },
      { id: "emergencias", texto: "Emergencias", icono: "gpp_maybe", onPress: () => router.push("/emergencia") },
      { id: "favores", texto: "Favores", icono: "volunteer_activism", onPress: () => router.navigate("/favores") },
      { id: "perfil", texto: "Mi perfil", icono: "person", onPress: () => router.navigate("/perfil") },
    ],
    [router],
  );

  const verDetalle = useCallback((id: string) => router.push(hrefDetalleFavor(id)), [router]);

  const renderItem: ListRenderItem<ElementoMuro> = useCallback(
    ({ item }) => <TarjetaMuro elemento={item} ahora={ahora} onVer={verDetalle} />,
    [ahora, verDetalle],
  );

  const contextoMuro =
    sinConexion && actualizadoEn ? TEXTOS_INICIO.actualizado(formatearHace(actualizadoEn, ahora)) : TEXTOS_INICIO.cercaDeTi;

  const cabecera = (
    <View style={styles.cabecera}>
      <SaludoInicio nombre={primerNombre(vecino.nombre)} onAyuda={() => avisarProximamente("La guía de ayuda")} />

      {permiso === "denegado" ? <AvisoNotificaciones onIrAjustes={abrirAjustesNotificaciones} /> : null}
      {vecino.error || errorMuro || errorNecesidad || errorServicio ? (
        <View accessibilityRole="alert" style={[styles.error, { backgroundColor: colores.sosFondo, borderColor: colores.borde }]}>
          <Text style={[styles.errorTexto, { color: colores.texto }]}>
            {vecino.error ?? errorMuro ?? errorNecesidad ?? errorServicio}
          </Text>
        </View>
      ) : null}

      <AccesosRapidos accesos={accesos} />

      {misPublicaciones.map((publicacion) => (
        <TarjetaMiPublicacion
          key={publicacion.id}
          publicacion={publicacion}
          ahora={ahora}
          onVer={() => router.push(hrefDetalleFavor(publicacion.id))}
        />
      ))}

      <View style={styles.acciones}>
        <Boton
          texto={TEXTOS_INICIO.crearPublicacion}
          icono="add"
          onPress={() => router.push("/favores/publicar")}
          deshabilitado={!crear.permitido || emergenciaActiva}
          motivoDeshabilitado={emergenciaActiva ? "No se pueden crear publicaciones nuevas durante una emergencia." : crear.motivo ?? undefined}
        />
        <Boton
          texto={TEXTOS_INICIO.reportarVulnerabilidad}
          icono="error"
          variante="enlace"
          onPress={() => avisarProximamente("Reportar vulnerabilidad")}
        />
      </View>

      <CabeceraMuro filtro={filtro} onFiltro={setFiltro} contexto={contextoMuro} />
    </View>
  );

  return (
    <View style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      {sinConexion ? <FranjaSinConexion pendientes={pendientes} /> : null}
      <FlatList
        data={elementos}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator color={colores.primario} style={styles.cargando} accessibilityLabel="Cargando el muro" />
          ) : errorMuro ? (
            <ListaVacia texto="No se pudo cargar el muro. Revisa tu conexión e inténtalo de nuevo." />
          ) : (
            // Sin botón secundario: el primario «Crear publicación» sigue a la vista (decisión 5).
            <ListaVacia texto={TEXTOS_INICIO.vacio} />
          )
        }
        ItemSeparatorComponent={Separador}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[colores.primario]}
            progressBackgroundColor={colores.superficie}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingHorizontal: ESPACIO.l, paddingTop: ESPACIO.l, paddingBottom: ESPACIO.xl },
  cabecera: { gap: ESPACIO.l, marginBottom: ESPACIO.l },
  acciones: { gap: ESPACIO.xs, marginTop: ESPACIO.xs },
  separador: { height: ESPACIO.m },
  cargando: { marginTop: ESPACIO.xl },
  error: { borderWidth: 1, borderRadius: 12, padding: ESPACIO.m },
  errorTexto: { fontSize: 14, lineHeight: 20 },
});
