// Ruta: src/modulos/favores/pantallas/InicioPantalla.tsx
// P04 · Inicio (muro cercano). RF09, RF35, RF37, RF38, RN-04, RNF09/RF41 y RF08.
// Frames: 04-A muro · 04-B publicación activa · 04-C vacío · 04-D sin conexión · 04-E lluvia (tema).
//
// Layout: la franja «Sin conexión» va de borde a borde fuera de la lista; todo lo demás es una sola
// FlatList (virtualizada, con deslizar para refrescar) cuyo encabezado lleva saludo, accesos y acciones.
// El encabezado con «SOS» y la barra de pestañas los ponen los layouts de (privado) y (pestanas).
import { Boton, FranjaSinConexion, ListaVacia } from "@/compartido/ui";
import { ESPACIO, useTema } from "@/compartido/tema";
import { formatearHace, primerNombre } from "@/compartido/utilidades/formatos";
import { usePendientesBandeja } from "@/nucleo/bandeja-salida";
import { abrirAjustesNotificaciones, usePermisoNotificaciones } from "@/nucleo/notificaciones";
import { useConexion } from "@/nucleo/red";
import { useSesion } from "@/nucleo/sesion";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from "react-native";
import { AccesosRapidos, type AccesoRapido } from "../componentes/AccesosRapidos";
import { AvisoNotificaciones } from "../componentes/AvisoNotificaciones";
import { CabeceraMuro } from "../componentes/CabeceraMuro";
import { SaludoInicio } from "../componentes/SaludoInicio";
import { TarjetaMiPublicacion } from "../componentes/TarjetaMiPublicacion";
import { TarjetaMuro } from "../componentes/TarjetaMuro";
import { TEXTOS_INICIO } from "../constantes";
import { useMiPublicacion } from "../hooks/useMiPublicacion";
import { useMuro } from "../hooks/useMuro";
import { puedeCrearPublicacion } from "../reglas";
import type { ElementoMuro } from "../tipos";

/** Destinos que aún no existen (P05, P06, P08, P20, P21). Se reemplazan por router.push al crearlos. */
function avisarProximamente(pantalla: string) {
  Alert.alert("Próximamente", `${pantalla} todavía no está disponible.`);
}

export function InicioPantalla() {
  const { colores } = useTema();
  const router = useRouter();
  const { vecino } = useSesion();
  const { sinConexion } = useConexion();
  const pendientes = usePendientesBandeja();
  const permiso = usePermisoNotificaciones();

  const { elementos, cargando, refrescando, refrescar, filtro, setFiltro, actualizadoEn, ahora } = useMuro({
    uid: vecino.uid,
    oficios: vecino.oficios,
    centro: vecino.ubicacion,
  });
  const miPublicacion = useMiPublicacion(vecino.necesidadActivaId);
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

  const verDetalle = useCallback((_id: string) => avisarProximamente("El detalle de la publicación"), []);

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

      <AccesosRapidos accesos={accesos} />

      {miPublicacion ? (
        <TarjetaMiPublicacion publicacion={miPublicacion} ahora={ahora} onVer={() => avisarProximamente("Tu favor")} />
      ) : null}

      <View style={styles.acciones}>
        <Boton
          texto={TEXTOS_INICIO.crearPublicacion}
          icono="add"
          onPress={() => avisarProximamente("Crear publicación")}
          deshabilitado={!crear.permitido}
          motivoDeshabilitado={crear.motivo ?? undefined}
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
});
