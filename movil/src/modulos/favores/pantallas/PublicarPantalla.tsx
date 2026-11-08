import { Boton } from "@/compartido/ui";
import { useTema, useTemaStore } from "@/compartido/tema";
import { OFICIOS } from "@/compartido/constantes/oficios";
import { MapaBase } from "@/compartido/ui/MapaBase";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  AvisoFavores,
  CampoFavores,
  MarcoPantallaFavores,
  OpcionFavores,
  TituloSeccionFavores,
} from "../componentes/MarcoPantallaFavores";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO } from "../constantes";
import { hrefDetalleFavor } from "../rutas";
import { useVecinoActual } from "../hooks/useVecinoActual";
import { crearPublicacion } from "../servicios/publicacionesServicio";
import type { CategoriaPublicacion, TipoPublicacion } from "../tipos";

const CATEGORIAS: CategoriaPublicacion[] = ["FAVOR_OFICIO", "PRESTAMO", "DONACION", "INTERCAMBIO", "MOVILIDAD"];
const MIN_DESCRIPCION = 10;
const MAX_DESCRIPCION = 280;

function convertirFechaDevolucion(valor: string): number | null {
  const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (!coincidencia) return null;
  const dia = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const anio = Number(coincidencia[3]);
  const fecha = new Date(anio, mes - 1, dia, 23, 59, 0, 0);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null;
  return fecha.getTime();
}

export function PublicarPantalla() {
  const router = useRouter();
  const { colores } = useTema();
  const emergenciaActiva = useTemaStore((estado) => estado.nombre === "emergencia");
  const vecino = useVecinoActual();
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState<TipoPublicacion>("NECESITO");
  const [categoria, setCategoria] = useState<CategoriaPublicacion>("FAVOR_OFICIO");
  const [oficioId, setOficioId] = useState<keyof typeof OFICIOS | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (vecino.error) {
      setLatitud("");
      setLongitud("");
      return;
    }
    if (!vecino.ubicacion) return;
    setLatitud(String(vecino.ubicacion.lat));
    setLongitud(String(vecino.ubicacion.lng));
  }, [vecino.error, vecino.ubicacion]);

  const fechaDevolucionMs = useMemo(() => convertirFechaDevolucion(fechaDevolucion), [fechaDevolucion]);
  const lat = Number(latitud);
  const lng = Number(longitud);
  const ubicacionValida = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  const marcador = useMemo(
    () => (ubicacionValida ? [{ id: "publicacion", lat, lng, titulo: "Ubicación aproximada del favor", color: colores.primario }] : []),
    [colores.primario, lat, lng, ubicacionValida],
  );

  const avanzar = () => {
    setError(null);
    if (paso === 1 && categoria === "FAVOR_OFICIO" && !oficioId) {
      setError("Elige el oficio o la habilidad que corresponde.");
      return;
    }
    if (paso === 2) {
      const texto = descripcion.trim();
      if (texto.length < MIN_DESCRIPCION || texto.length > MAX_DESCRIPCION) {
        setError(`La descripción debe tener entre ${MIN_DESCRIPCION} y ${MAX_DESCRIPCION} caracteres.`);
        return;
      }
      if (tipo === "OFREZCO" && categoria === "PRESTAMO" && (!fechaDevolucionMs || fechaDevolucionMs <= Date.now())) {
        setError("Indica una fecha futura válida para la devolución (DD/MM/AAAA).");
        return;
      }
    }
    setPaso((actual) => Math.min(actual + 1, 3));
  };

  const publicar = async () => {
    setError(null);
    if (!ubicacionValida) {
      setError("Confirma una latitud y longitud válidas.");
      return;
    }
    if (emergenciaActiva) {
      setError("No se pueden crear publicaciones nuevas mientras está activo el modo de emergencia.");
      return;
    }
    setGuardando(true);
    try {
      const publicacion = await crearPublicacion({
        tipo,
        categoria,
        oficioId: categoria === "FAVOR_OFICIO" ? oficioId : null,
        descripcion: descripcion.trim(),
        lat,
        lng,
        devolucionEn: tipo === "OFREZCO" && categoria === "PRESTAMO" ? fechaDevolucionMs : null,
      });
      router.replace(hrefDetalleFavor(publicacion.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar el favor.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MarcoPantallaFavores
      titulo="Crear publicación"
      descripcion={`Paso ${paso} de 3 · Elige, describe y confirma tu ubicación.`}
    >
      {vecino.cargando ? <ActivityIndicator color={colores.primario} accessibilityLabel="Cargando perfil" /> : null}
      {vecino.error ? <AvisoFavores texto={vecino.error} /> : null}
      {emergenciaActiva ? (
        <AvisoFavores texto="El modo de emergencia está activo. Puedes consultar el muro, pero no crear publicaciones nuevas." />
      ) : null}

      {paso === 1 ? (
        <>
          <TituloSeccionFavores>¿Qué quieres hacer?</TituloSeccionFavores>
          <View style={styles.opciones}>
            {(["NECESITO", "OFREZCO"] as const).map((opcion) => (
              <OpcionFavores
                key={opcion}
                titulo={ETIQUETA_TIPO[opcion]}
                detalle={opcion === "NECESITO" ? "Pedir ayuda a tus vecinos" : "Ofrecer algo a la comunidad"}
                seleccionada={tipo === opcion}
                onPress={() => setTipo(opcion)}
              />
            ))}
          </View>
          <TituloSeccionFavores>Categoría</TituloSeccionFavores>
          <View style={styles.opciones}>
            {CATEGORIAS.map((opcion) => (
              <OpcionFavores
                key={opcion}
                titulo={ETIQUETA_CATEGORIA[opcion]}
                seleccionada={categoria === opcion}
                onPress={() => setCategoria(opcion)}
              />
            ))}
          </View>
          {categoria === "FAVOR_OFICIO" ? (
            <>
              <TituloSeccionFavores>Oficio o habilidad</TituloSeccionFavores>
              <View style={styles.opciones}>
                {(Object.keys(OFICIOS) as (keyof typeof OFICIOS)[]).map((id) => (
                  <OpcionFavores
                    key={id}
                    titulo={OFICIOS[id]}
                    seleccionada={oficioId === id}
                    onPress={() => setOficioId(id)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {paso === 2 ? (
        <>
          <CampoFavores
            etiqueta="Describe lo que necesitas u ofreces"
            valor={descripcion}
            onChangeText={setDescripcion}
            placeholder="Sé claro para que tus vecinos sepan cómo ayudar."
            multilinea
            maxLength={MAX_DESCRIPCION}
          />
          <Text style={[styles.contador, { color: colores.textoSecundario }]}>
            {descripcion.trim().length}/{MAX_DESCRIPCION} · mínimo {MIN_DESCRIPCION}
          </Text>
          {tipo === "OFREZCO" && categoria === "PRESTAMO" ? (
            <CampoFavores
              etiqueta="Fecha de devolución"
              valor={fechaDevolucion}
              onChangeText={setFechaDevolucion}
              placeholder="DD/MM/AAAA"
              keyboardType="numbers-and-punctuation"
              error={fechaDevolucion && !fechaDevolucionMs ? "Usa una fecha válida en formato DD/MM/AAAA." : null}
            />
          ) : null}
        </>
      ) : null}

      {paso === 3 ? (
        <>
          <AvisoFavores texto="La ubicación pública es aproximada para cuidar tu privacidad. Toca el mapa en Android o ajusta las coordenadas." />
          {ubicacionValida ? (
            <MapaBase
              centro={{ lat, lng }}
              delta={0.01}
              marcadores={marcador}
              onMapaPress={(coordenada) => {
                setLatitud(String(coordenada.lat));
                setLongitud(String(coordenada.lng));
              }}
              estilo={styles.mapa}
            />
          ) : null}
          <View style={styles.coordenadas}>
            <View style={styles.coordenada}>
              <CampoFavores etiqueta="Latitud" valor={latitud} onChangeText={setLatitud} keyboardType="decimal-pad" />
            </View>
            <View style={styles.coordenada}>
              <CampoFavores etiqueta="Longitud" valor={longitud} onChangeText={setLongitud} keyboardType="decimal-pad" />
            </View>
          </View>
          {!vecino.ubicacion ? <AvisoFavores texto="No hay ubicación guardada en tu perfil. Ingresa las coordenadas del barrio para continuar." /> : null}
        </>
      ) : null}

      {error ? <AvisoFavores texto={error} /> : null}
      <View style={styles.botones}>
        {paso > 1 ? <Boton texto="Anterior" variante="secundario" onPress={() => { setError(null); setPaso(paso - 1); }} /> : null}
        {paso < 3 ? (
          <Boton texto="Continuar" onPress={avanzar} />
        ) : (
          <Boton texto={guardando ? "Publicando..." : "Publicar"} onPress={publicar} deshabilitado={guardando || emergenciaActiva || vecino.cargando} />
        )}
      </View>
    </MarcoPantallaFavores>
  );
}

const styles = StyleSheet.create({
  opciones: { gap: 8 },
  contador: { textAlign: "right", marginTop: -10, fontSize: 13 },
  mapa: { height: 230, borderRadius: 14, overflow: "hidden" },
  coordenadas: { flexDirection: "row", gap: 10 },
  coordenada: { flex: 1 },
  botones: { gap: 10, marginTop: 6 },
});
