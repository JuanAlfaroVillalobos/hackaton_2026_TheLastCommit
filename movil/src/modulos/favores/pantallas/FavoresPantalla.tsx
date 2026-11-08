import { Boton } from "@/compartido/ui";
import { OFICIOS } from "@/compartido/constantes/oficios";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { formatearFechaCorta } from "@/compartido/utilidades/formatos";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AvisoFavores, MarcoPantallaFavores, TituloSeccionFavores } from "../componentes/MarcoPantallaFavores";
import { CabeceraMuro } from "../componentes/CabeceraMuro";
import { TarjetaMuro } from "../componentes/TarjetaMuro";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO, TEXTOS_INICIO } from "../constantes";
import { useMuro } from "../hooks/useMuro";
import { useVecinoActual } from "../hooks/useVecinoActual";
import { hrefDetalleFavor } from "../rutas";
import { listarMisPublicaciones, listarNotificaciones, marcarNotificacionLeida } from "../servicios/publicacionesServicio";
import type { NotificacionFavor, PublicacionConAutor } from "../tipos";

const TERMINALES = new Set(["FINALIZADO", "CANCELADA", "EXPIRADA"]);
const INTERVALO_MS = 5_000;

export function FavoresPantalla() {
  const { colores } = useTema();
  const router = useRouter();
  const vecino = useVecinoActual();
  const [publicaciones, setPublicaciones] = useState<PublicacionConAutor[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionFavor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const muro = useMuro({ uid: vecino.uid, oficios: vecino.oficios, centro: vecino.ubicacion });

  const cargar = useCallback(async () => {
    try {
      const [mias, avisos] = await Promise.all([listarMisPublicaciones(), listarNotificaciones()]);
      setPublicaciones(mias);
      setNotificaciones(avisos);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar tus favores.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const timer = setInterval(() => void cargar(), INTERVALO_MS);
    return () => clearInterval(timer);
  }, [cargar]);

  const activas = publicaciones.filter((publicacion) => !TERMINALES.has(publicacion.estado));
  const historial = publicaciones.filter((publicacion) => TERMINALES.has(publicacion.estado));

  const abrirNotificacion = async (notificacion: NotificacionFavor) => {
    if (!notificacion.leida) {
      try {
        const actualizada = await marcarNotificacionLeida(notificacion.id);
        setNotificaciones((lista) => lista.map((item) => item.id === actualizada.id ? actualizada : item));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar la notificación.");
        return;
      }
    }
    router.push(hrefDetalleFavor(notificacion.publicacionId));
  };

  return (
    <MarcoPantallaFavores titulo="Favores" descripcion="El muro de tu barrio, tus favores activos, el historial y los avisos de tus vecinos.">
      {error || vecino.error || muro.error ? <AvisoFavores texto={error ?? vecino.error ?? muro.error ?? ""} /> : null}
      {cargando ? <ActivityIndicator color={colores.primario} accessibilityLabel="Cargando favores" /> : null}

      <TituloSeccionFavores>Muro de tu barrio</TituloSeccionFavores>
      <CabeceraMuro filtro={muro.filtro} onFiltro={muro.setFiltro} contexto={TEXTOS_INICIO.cercaDeTi} />
      {muro.cargando && !muro.elementos.length ? (
        <ActivityIndicator color={colores.primario} accessibilityLabel="Cargando el muro" />
      ) : muro.elementos.length ? (
        <View style={styles.lista}>
          {muro.elementos.map((elemento) => (
            <TarjetaMuro key={elemento.id} elemento={elemento} ahora={muro.ahora} onVer={(id) => router.push(hrefDetalleFavor(id))} />
          ))}
        </View>
      ) : (
        <Text style={[styles.texto, { color: colores.textoSecundario }]}>{TEXTOS_INICIO.vacio}</Text>
      )}
      <Boton texto="Actualizar muro" variante="secundario" onPress={() => void muro.refrescar()} deshabilitado={muro.refrescando} />

      <TituloSeccionFavores>Avisos</TituloSeccionFavores>
      {notificaciones.length ? (
        <View style={styles.lista}>
          {notificaciones.slice(0, 10).map((notificacion) => (
            <Pressable
              key={notificacion.id}
              accessibilityRole="button"
              onPress={() => void abrirNotificacion(notificacion)}
              style={[
                styles.aviso,
                {
                  backgroundColor: notificacion.leida ? colores.superficie : colores.primarioSuave,
                  borderColor: colores.borde,
                },
              ]}
            >
              <Text style={[styles.avisoTexto, { color: colores.texto }]}>{notificacion.mensaje}</Text>
              <Text style={[styles.meta, { color: colores.textoSecundario }]}>
                {formatearFechaCorta(notificacion.creadaEn)}{notificacion.leida ? "" : " · Sin leer"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[styles.texto, { color: colores.textoSecundario }]}>Todavía no tienes avisos de favores.</Text>
      )}

      <TituloSeccionFavores>En curso</TituloSeccionFavores>
      {activas.length ? (
        <View style={styles.lista}>
          {activas.map((publicacion) => (
            <TarjetaFavor key={publicacion.id} publicacion={publicacion} onPress={() => router.push(hrefDetalleFavor(publicacion.id))} />
          ))}
        </View>
      ) : (
        <Text style={[styles.texto, { color: colores.textoSecundario }]}>No tienes favores activos.</Text>
      )}

      <TituloSeccionFavores>Historial</TituloSeccionFavores>
      {historial.length ? (
        <View style={styles.lista}>
          {historial.map((publicacion) => (
            <TarjetaFavor key={publicacion.id} publicacion={publicacion} onPress={() => router.push(hrefDetalleFavor(publicacion.id))} />
          ))}
        </View>
      ) : (
        <Text style={[styles.texto, { color: colores.textoSecundario }]}>Tus favores completados aparecerán aquí.</Text>
      )}
      <Boton texto="Actualizar" variante="secundario" onPress={() => void cargar()} />
    </MarcoPantallaFavores>
  );
}

function TarjetaFavor({ publicacion, onPress }: { publicacion: PublicacionConAutor; onPress: () => void }) {
  const { colores } = useTema();
  const categoria = publicacion.oficioId ? ` · ${OFICIOS[publicacion.oficioId]}` : ` · ${ETIQUETA_CATEGORIA[publicacion.categoria]}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ETIQUETA_TIPO[publicacion.tipo]}: ${publicacion.descripcion}`}
      onPress={onPress}
      style={[styles.favor, { backgroundColor: colores.superficie, borderColor: colores.borde }]}
    >
      <Text style={[styles.etiqueta, { color: colores.primario }]}>{estadoAmigable(publicacion.estado)}</Text>
      <Text style={[styles.tituloFavor, { color: colores.texto }]} numberOfLines={2} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {ETIQUETA_TIPO[publicacion.tipo]}{categoria}
      </Text>
      <Text style={[styles.texto, { color: colores.texto }]} numberOfLines={3}>{publicacion.descripcion}</Text>
      {publicacion.devolucionEn ? (
        <Text style={[styles.meta, { color: colores.textoSecundario }]}>
          {publicacion.devolucionRegistradaEn
            ? `Devolución registrada ${formatearFechaCorta(publicacion.devolucionRegistradaEn)}`
            : `Devolución: ${formatearFechaCorta(publicacion.devolucionEn)}`}
        </Text>
      ) : null}
      <Text style={[styles.enlace, { color: colores.enlace }]}>{TEXTOS_INICIO.verDetalle} →</Text>
    </Pressable>
  );
}

function estadoAmigable(estado: PublicacionConAutor["estado"]): string {
  const etiquetas: Record<PublicacionConAutor["estado"], string> = {
    PUBLICADA: "Esperando vecino",
    ACEPTADA: "Vecino en camino",
    EN_SITIO: "Esperando confirmación",
    EN_CURSO: "Servicio en curso",
    FIN_SOLICITADO: "Cierre por confirmar",
    FINALIZADO: "Finalizado",
    CANCELADA: "Cancelado",
    EXPIRADA: "Expirado",
  };
  return etiquetas[estado];
}

const styles = StyleSheet.create({
  lista: { gap: ESPACIO.s },
  aviso: { borderWidth: 1, borderRadius: 12, padding: ESPACIO.m, gap: ESPACIO.xs },
  avisoTexto: TIPO.cuerpo,
  favor: { borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, gap: ESPACIO.xs },
  etiqueta: { ...TIPO.pequeno, fontWeight: "700" },
  tituloFavor: TIPO.cuerpoFuerte,
  texto: TIPO.cuerpo,
  meta: TIPO.pequeno,
  enlace: { ...TIPO.cuerpoFuerte, textAlign: "right" },
});
