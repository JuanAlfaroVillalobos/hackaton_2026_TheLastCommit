import * as Location from "expo-location";
import { Boton } from "@/compartido/ui";
import { MapaBase } from "@/compartido/ui/MapaBase";
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { formatearFechaCorta, iniciales } from "@/compartido/utilidades/formatos";
import { distanciaMetros } from "@/compartido/utilidades/geo";
import { OFICIOS } from "@/compartido/constantes/oficios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import type { LocationSubscription } from "expo-location";
import { AvisoFavores, MarcoPantallaFavores, OpcionFavores, TituloSeccionFavores } from "../componentes/MarcoPantallaFavores";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO } from "../constantes";
import { useVecinoActual } from "../hooks/useVecinoActual";
import { hrefCalificarFavor } from "../rutas";
import {
  aceptarPublicacion,
  cancelarPublicacion,
  confirmarFin,
  confirmarLlegada,
  desistirPublicacion,
  marcarLlegada as marcarLlegadaServicio,
  publicarUbicacionPrestador,
  rechazarFin,
  rechazarLlegada,
  registrarDevolucion,
  solicitarFin,
  suscribirPublicacion,
} from "../servicios/publicacionesServicio";
import type { EstadoNecesidad, PublicacionConAutor } from "../tipos";

type Props = { id: string };
type AccionConfirmacion = { mensaje: string; ejecutar: () => Promise<unknown> };

const TERMINALES = new Set<EstadoNecesidad>(["FINALIZADO", "CANCELADA", "EXPIRADA"]);
const ETIQUETA_ESTADO: Record<EstadoNecesidad, string> = {
  PUBLICADA: "Esperando a un vecino",
  ACEPTADA: "El prestador va en camino",
  EN_SITIO: "El prestador indicó que llegó",
  EN_CURSO: "El servicio está en curso",
  FIN_SOLICITADO: "Falta confirmar el cierre",
  FINALIZADO: "Servicio finalizado",
  CANCELADA: "Publicación cancelada",
  EXPIRADA: "La publicación venció",
};

function nombreEstadoIdentidad(estado?: string): string {
  switch (estado) {
    case "VERIFICADA": return "Identidad verificada";
    case "PENDIENTE": return "Identidad en revisión";
    case "RECHAZADA": return "Identidad pendiente de corrección";
    default: return "Identidad no verificada";
  }
}

export function DetallePublicacionPantalla({ id }: Props) {
  const { colores } = useTema();
  const router = useRouter();
  const vecino = useVecinoActual();
  const [publicacion, setPublicacion] = useState<PublicacionConAutor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [etaMinutos, setEtaMinutos] = useState<5 | 10 | 15>(10);
  const [compartiendoUbicacion, setCompartiendoUbicacion] = useState(false);
  const [confirmacion, setConfirmacion] = useState<AccionConfirmacion | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const suscripcionUbicacion = useRef<LocationSubscription | null>(null);
  const estadoPublicacion = publicacion?.estado;
  const prestadorPublicacion = publicacion?.prestadorId;

  useEffect(() => {
    setCargando(true);
    return suscribirPublicacion(
      id,
      (datos) => {
        setPublicacion(datos);
        setCargando(false);
        setError(datos ? null : "No se encontró esta publicación.");
      },
      (e) => {
        setError(e.message);
        setCargando(false);
      },
    );
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const detenerUbicacion = useCallback(() => {
    suscripcionUbicacion.current?.remove();
    suscripcionUbicacion.current = null;
    setCompartiendoUbicacion(false);
  }, []);

  useEffect(() => {
    if (
      (estadoPublicacion !== "ACEPTADA" && estadoPublicacion !== "EN_SITIO") ||
      prestadorPublicacion !== vecino.uid
    ) detenerUbicacion();
    return detenerUbicacion;
  }, [detenerUbicacion, estadoPublicacion, prestadorPublicacion, vecino.uid]);

  const ejecutar = useCallback(async (accion: () => Promise<unknown>) => {
    setOcupado(true);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  }, []);

  const confirmarAccion = async () => {
    if (!confirmacion) return;
    const accion = confirmacion.ejecutar;
    setConfirmacion(null);
    await ejecutar(accion);
  };

  const confirmarLlegadaEnSitio = async () => {
    let coordenada: { lat: number; lng: number } | undefined;
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        setConfirmacion({
          mensaje: "No pudimos verificar tu ubicación. ¿Confirmas que ya llegaste?",
          ejecutar: () => marcarLlegadaServicio(id),
        });
        return;
      }
      const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      coordenada = { lat: ubicacion.coords.latitude, lng: ubicacion.coords.longitude };
    } catch {
      setConfirmacion({
        mensaje: "No pudimos verificar tu ubicación. ¿Confirmas que ya llegaste?",
        ejecutar: () => marcarLlegadaServicio(id),
      });
      return;
    }

    if (
      publicacion?.ubicacionSolicitanteExacta &&
      distanciaMetros(coordenada, publicacion.ubicacionSolicitanteExacta) > 200
    ) {
      setConfirmacion({
        mensaje: "Parece que estás a más de 200 m del punto. ¿Confirmas que ya llegaste?",
        ejecutar: () => marcarLlegadaServicio(id, coordenada),
      });
      return;
    }
    await ejecutar(() => marcarLlegadaServicio(id, coordenada));
  };

  const compartirUbicacion = async () => {
    setError(null);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        setError("Activa el permiso de ubicación para compartir tu posición durante el servicio.");
        return;
      }
      const suscripcion = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 50 },
        (ubicacion) => {
          void publicarUbicacionPrestador(id, {
            lat: ubicacion.coords.latitude,
            lng: ubicacion.coords.longitude,
          }).catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudo compartir la ubicación."));
        },
      );
      suscripcionUbicacion.current?.remove();
      suscripcionUbicacion.current = suscripcion;
      setCompartiendoUbicacion(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el seguimiento de ubicación.");
    }
  };

  if (cargando && !publicacion) {
    return (
      <MarcoPantallaFavores titulo="Detalle del favor">
        <ActivityIndicator color={colores.primario} accessibilityLabel="Cargando publicación" />
      </MarcoPantallaFavores>
    );
  }
  if (!publicacion) {
    return (
      <MarcoPantallaFavores titulo="Detalle del favor">
        <AvisoFavores texto={error ?? "No se encontró esta publicación."} />
      </MarcoPantallaFavores>
    );
  }

  const esSolicitante = publicacion.solicitanteId === vecino.uid;
  const esPrestador = publicacion.prestadorId === vecino.uid;
  const esAutor = publicacion.autorId === vecino.uid;
  const perfilAutor = publicacion.perfilAutor;
  const perfilContraparte = esSolicitante ? publicacion.perfilPrestador : publicacion.perfilSolicitante;
  const categoria = publicacion.oficioId ? `Oficio: ${OFICIOS[publicacion.oficioId]}` : ETIQUETA_CATEGORIA[publicacion.categoria];
  const marcaUbicacion = publicacion.ubicacionSolicitanteExacta
    ? {
        id: "solicitante",
        lat: publicacion.ubicacionSolicitanteExacta.lat,
        lng: publicacion.ubicacionSolicitanteExacta.lng,
        titulo: "Ubicación del solicitante",
        color: colores.primario,
      }
    : publicacion.ubicacionPrestadorEnVivo
      ? {
          id: "prestador",
          lat: publicacion.ubicacionPrestadorEnVivo.lat,
          lng: publicacion.ubicacionPrestadorEnVivo.lng,
          titulo: "Ubicación en vivo del prestador",
          color: colores.primario,
        }
      : null;

  return (
    <MarcoPantallaFavores titulo="Detalle del favor" descripcion={ETIQUETA_ESTADO[publicacion.estado]}>
      {error ? <AvisoFavores texto={error} /> : null}
      <View style={[styles.tarjeta, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
        <View style={styles.etiquetas}>
          <Text style={[styles.chip, { color: colores.primario, backgroundColor: colores.primarioSuave }]}>
            {ETIQUETA_TIPO[publicacion.tipo]}
          </Text>
          <Text style={[styles.chip, { color: colores.texto, backgroundColor: colores.superficieAlterna }]}>{categoria}</Text>
        </View>
        <Text style={[styles.descripcion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {publicacion.descripcion}
        </Text>
        <Text style={[styles.meta, { color: colores.textoSecundario }]}>
          Publicado {formatearFechaCorta(publicacion.creadoEn)}
        </Text>
        {publicacion.devolucionEn ? (
          <Text style={[styles.meta, { color: colores.textoSecundario }]}>
            {publicacion.devolucionRegistradaEn
              ? `Devolución registrada ${formatearFechaCorta(publicacion.devolucionRegistradaEn)}`
              : `Fecha de devolución: ${formatearFechaCorta(publicacion.devolucionEn)}`}
          </Text>
        ) : null}
      </View>

      <TituloSeccionFavores>Vecino que publicó</TituloSeccionFavores>
      <PerfilResumen
        nombre={perfilAutor?.nombre ?? publicacion.autorNombre}
        fotoUrl={perfilAutor?.fotoUrl ?? null}
        identidad={nombreEstadoIdentidad(perfilAutor?.estadoIdentidad)}
        horasAyudadas={perfilAutor?.horasAyudadas ?? 0}
        horasSolicitadas={perfilAutor?.horasSolicitadas ?? 0}
        promedio={perfilAutor?.promedio ?? null}
        calificaciones={perfilAutor?.numCalificaciones ?? 0}
      />

      {publicacion.prestadorId && perfilContraparte && !esAutor ? (
        <>
          <TituloSeccionFavores>{esSolicitante ? "Tu prestador" : "Quien recibe el favor"}</TituloSeccionFavores>
          <PerfilResumen
            nombre={perfilContraparte.nombre}
            fotoUrl={perfilContraparte.fotoUrl}
            identidad={nombreEstadoIdentidad(perfilContraparte.estadoIdentidad)}
            horasAyudadas={perfilContraparte.horasAyudadas}
            horasSolicitadas={perfilContraparte.horasSolicitadas}
            promedio={perfilContraparte.promedio}
            calificaciones={perfilContraparte.numCalificaciones}
          />
        </>
      ) : null}

      {publicacion.etaMinutos && publicacion.llegadaEstimada ? (
        <AvisoFavores
          texto={
            publicacion.estado === "ACEPTADA"
              ? publicacion.retrasoAvisadoEn
                ? "Tu vecino se está demorando. Puedes revisar el estado desde aquí."
                : `Tu vecino llega en aproximadamente ${Math.max(0, Math.ceil((publicacion.llegadaEstimada - ahora) / 60_000))} min.`
              : `Tiempo de llegada acordado: ${publicacion.etaMinutos} min.`
          }
        />
      ) : null}
      {publicacion.inicioServicio !== null &&
      (publicacion.estado === "EN_CURSO" || publicacion.estado === "FIN_SOLICITADO") ? (
        <ContadorServicio inicio={publicacion.inicioServicio} fin={publicacion.finServicio} ahora={ahora} />
      ) : null}

      {marcaUbicacion ? (
        <>
          <TituloSeccionFavores>{esSolicitante ? "Ubicación en vivo del prestador" : "Ubicación del solicitante"}</TituloSeccionFavores>
          <MapaBase
            centro={{ lat: marcaUbicacion.lat, lng: marcaUbicacion.lng }}
            marcadores={[marcaUbicacion]}
            delta={0.006}
            estilo={styles.mapa}
          />
          <Text style={[styles.meta, { color: colores.textoSecundario }]}>
            Coordenadas: {marcaUbicacion.lat.toFixed(5)}, {marcaUbicacion.lng.toFixed(5)}
          </Text>
          {publicacion.ubicacionPrestadorEnVivo ? (
            <Text style={[styles.meta, { color: colores.textoSecundario }]}>
              Actualizada {formatearFechaCorta(publicacion.ubicacionPrestadorEnVivo.actualizadoEn)}
            </Text>
          ) : null}
        </>
      ) : null}

      <View style={styles.acciones}>
        {publicacion.estado === "PUBLICADA" && !esAutor ? (
          <>
            <TituloSeccionFavores>¿En cuánto tiempo llegas?</TituloSeccionFavores>
            <View style={styles.opcionesEta}>
              {([5, 10, 15] as const).map((minutos) => (
                <View key={minutos} style={styles.opcionEta}>
                  <OpcionFavores
                    titulo={`${minutos} min`}
                    seleccionada={etaMinutos === minutos}
                    onPress={() => setEtaMinutos(minutos)}
                  />
                </View>
              ))}
            </View>
            <Boton texto="Aceptar y ayudar" onPress={() => void ejecutar(() => aceptarPublicacion(id, etaMinutos))} deshabilitado={ocupado} />
          </>
        ) : null}

        {publicacion.estado === "PUBLICADA" && esAutor ? (
          <Boton
            texto="Cancelar publicación"
            variante="secundario"
            onPress={() => setConfirmacion({ mensaje: "¿Confirmas que quieres cancelar esta publicación?", ejecutar: () => cancelarPublicacion(id) })}
            deshabilitado={ocupado}
          />
        ) : null}

        {publicacion.estado === "ACEPTADA" && esPrestador ? (
          <>
            <Boton texto="Ya llegué" onPress={() => void confirmarLlegadaEnSitio()} deshabilitado={ocupado} />
            <Boton
              texto="Desistir del servicio"
              variante="secundario"
              onPress={() => setConfirmacion({ mensaje: "¿Confirmas que quieres desistir? La publicación volverá a estar disponible.", ejecutar: () => desistirPublicacion(id) })}
              deshabilitado={ocupado}
            />
            {compartiendoUbicacion ? (
              <Boton texto="Dejar de compartir ubicación" variante="secundario" onPress={detenerUbicacion} />
            ) : (
              <Boton texto="Compartir ubicación en vivo" variante="secundario" onPress={() => void compartirUbicacion()} />
            )}
          </>
        ) : null}
        {publicacion.estado === "ACEPTADA" && esSolicitante ? (
          <Boton
            texto="Cancelar necesidad"
            variante="secundario"
            onPress={() => setConfirmacion({ mensaje: "¿Confirmas que quieres cancelar esta necesidad?", ejecutar: () => cancelarPublicacion(id) })}
            deshabilitado={ocupado}
          />
        ) : null}

        {publicacion.estado === "EN_SITIO" && esSolicitante ? (
          <>
            <Boton texto="Confirmar llegada" onPress={() => void ejecutar(() => confirmarLlegada(id))} deshabilitado={ocupado} />
            <Boton texto="Aún no llegó" variante="secundario" onPress={() => void ejecutar(() => rechazarLlegada(id))} deshabilitado={ocupado} />
            <Boton
              texto="Cancelar necesidad"
              variante="secundario"
              onPress={() => setConfirmacion({ mensaje: "¿Confirmas que quieres cancelar esta necesidad?", ejecutar: () => cancelarPublicacion(id) })}
              deshabilitado={ocupado}
            />
          </>
        ) : null}
        {publicacion.estado === "EN_SITIO" && esPrestador ? (
          <>
            <AvisoFavores texto="Tu llegada está pendiente de confirmación por el solicitante." />
            {compartiendoUbicacion ? (
              <Boton texto="Dejar de compartir ubicación" variante="secundario" onPress={detenerUbicacion} />
            ) : (
              <Boton texto="Compartir ubicación en vivo" variante="secundario" onPress={() => void compartirUbicacion()} />
            )}
          </>
        ) : null}

        {publicacion.estado === "EN_CURSO" ? (
          <>
            <Boton texto="Solicitar fin del servicio" onPress={() => void ejecutar(() => solicitarFin(id))} deshabilitado={ocupado} />
          </>
        ) : null}

        {publicacion.estado === "FIN_SOLICITADO" ? (
          publicacion.finSolicitadoPor === vecino.uid ? (
            <AvisoFavores texto="Avisaste que el servicio terminó. Esperando la confirmación de la otra persona." />
          ) : (
            <>
              <Boton texto="Confirmar fin del servicio" onPress={() => void ejecutar(() => confirmarFin(id))} deshabilitado={ocupado} />
              <Boton texto="El servicio continúa" variante="secundario" onPress={() => void ejecutar(() => rechazarFin(id))} deshabilitado={ocupado} />
            </>
          )
        ) : null}

        {publicacion.tipo === "OFREZCO" && publicacion.categoria === "PRESTAMO" && esSolicitante &&
        ["ACEPTADA", "EN_SITIO", "FIN_SOLICITADO"].includes(publicacion.estado) && !publicacion.devolucionRegistradaEn ? (
          <Boton texto="Registrar devolución de la herramienta" variante="secundario" onPress={() => void ejecutar(() => registrarDevolucion(id))} deshabilitado={ocupado} />
        ) : null}

        {publicacion.estado === "FINALIZADO" && !publicacion.misCalificaciones?.some((calificacion) => calificacion.autorUid === vecino.uid) ? (
          <Boton texto="Calificar a tu vecino" onPress={() => router.push(hrefCalificarFavor(id))} />
        ) : null}
        {TERMINALES.has(publicacion.estado) && publicacion.estado !== "FINALIZADO" ? (
          <Text style={[styles.meta, { color: colores.textoSecundario }]}>Este favor ya no está activo.</Text>
        ) : null}
      </View>
      {confirmacion ? (
        <View style={[styles.confirmacion, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
          <AvisoFavores texto={confirmacion.mensaje} />
          <Boton texto="Confirmar" onPress={() => void confirmarAccion()} deshabilitado={ocupado} />
          <Boton texto="Volver" variante="secundario" onPress={() => setConfirmacion(null)} deshabilitado={ocupado} />
        </View>
      ) : null}
    </MarcoPantallaFavores>
  );
}

function ContadorServicio({ inicio, fin, ahora }: { inicio: number; fin: number | null; ahora: number }) {
  const { colores } = useTema();
  const duracion = Math.max(0, (fin ?? ahora) - inicio);
  const segundos = Math.floor(duracion / 1_000);
  const tiempo = [Math.floor(segundos / 3_600), Math.floor((segundos % 3_600) / 60), segundos % 60]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
  const bloques = Math.min(16, Math.max(1, Math.ceil(duracion / (30 * 60_000))));
  return (
    <View style={[styles.contador, { backgroundColor: colores.primarioSuave, borderColor: colores.borde }]}>
      <Text style={[styles.contadorEtiqueta, { color: colores.textoSecundario }]}>Tiempo de servicio</Text>
      <Text style={[styles.contadorTiempo, { color: colores.texto }]} accessibilityLabel={`Tiempo de servicio ${tiempo}`}>
        {tiempo}
      </Text>
      <Text style={[styles.meta, { color: colores.textoSecundario }]}>{bloques} bloques de 30 minutos</Text>
    </View>
  );
}

function PerfilResumen({
  nombre,
  fotoUrl,
  identidad,
  horasAyudadas,
  horasSolicitadas,
  promedio,
  calificaciones,
}: {
  nombre: string;
  fotoUrl: string | null;
  identidad: string;
  horasAyudadas: number;
  horasSolicitadas: number;
  promedio: number | null;
  calificaciones: number;
}) {
  const { colores } = useTema();
  return (
    <View style={[styles.perfil, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
      <View style={styles.identidad}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} accessibilityLabel={`Foto de ${nombre}`} style={styles.foto} />
        ) : (
          <View style={[styles.foto, styles.iniciales, { backgroundColor: colores.primarioSuave }]}>
            <Text style={[styles.inicialesTexto, { color: colores.texto }]}>{iniciales(nombre)}</Text>
          </View>
        )}
        <View style={styles.datosPerfil}>
          <Text style={[styles.nombre, { color: colores.texto }]}>{nombre}</Text>
          <Text style={[styles.meta, { color: colores.textoSecundario }]}>{identidad}</Text>
        </View>
      </View>
      <View style={styles.estadisticas}>
        <Text style={[styles.meta, { color: colores.textoSecundario }]}>Ayudó: {horasAyudadas} h</Text>
        <Text style={[styles.meta, { color: colores.textoSecundario }]}>Pidió: {horasSolicitadas} h</Text>
      </View>
      <Text style={[styles.meta, { color: colores.textoSecundario }]}>
        Calificación: {calificaciones < 3 || promedio === null ? "Aún no disponible" : `${promedio.toFixed(1)} / 5`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, gap: ESPACIO.s },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: ESPACIO.s },
  chip: { ...TIPO.pequeno, overflow: "hidden", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  descripcion: TIPO.cuerpo,
  meta: TIPO.pequeno,
  perfil: { borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, gap: ESPACIO.xs },
  identidad: { flexDirection: "row", alignItems: "center", gap: ESPACIO.m },
  foto: { width: 52, height: 52, borderRadius: 26 },
  iniciales: { alignItems: "center", justifyContent: "center" },
  inicialesTexto: { fontWeight: "700" },
  datosPerfil: { flex: 1, gap: 2 },
  nombre: TIPO.cuerpoFuerte,
  estadisticas: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: ESPACIO.s },
  mapa: { height: 230, borderRadius: 14, overflow: "hidden" },
  acciones: { gap: ESPACIO.s },
  confirmacion: { borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, gap: ESPACIO.s },
  contador: { borderWidth: 1, borderRadius: 14, padding: ESPACIO.m, alignItems: "center", gap: ESPACIO.xs },
  contadorEtiqueta: TIPO.pequeno,
  contadorTiempo: { fontSize: 32, fontVariant: ["tabular-nums"], fontWeight: "700" },
  opcionesEta: { flexDirection: "row", gap: ESPACIO.s },
  opcionEta: { flex: 1 },
});
