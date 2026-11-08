import { Boton } from "@/compartido/ui";
import { ESPACIO, TIPO, useTema } from "@/compartido/tema";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AvisoFavores, MarcoPantallaFavores } from "../componentes/MarcoPantallaFavores";
import { useVecinoActual } from "../hooks/useVecinoActual";
import { hrefDetalleFavor } from "../rutas";
import { calificarPublicacion, suscribirPublicacion } from "../servicios/publicacionesServicio";
import type { PublicacionConAutor } from "../tipos";

export function CalificarPantalla({ id }: { id: string }) {
  const { colores } = useTema();
  const router = useRouter();
  const vecino = useVecinoActual();
  const [publicacion, setPublicacion] = useState<PublicacionConAutor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [estrellas, setEstrellas] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    return suscribirPublicacion(
      id,
      (datos) => {
        setPublicacion(datos);
        setCargando(false);
      },
      (e) => {
        setError(e.message);
        setCargando(false);
      },
    );
  }, [id]);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await calificarPublicacion(id, estrellas);
      router.replace(hrefDetalleFavor(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar tu calificación.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <MarcoPantallaFavores titulo="Calificar favor">
        <ActivityIndicator color={colores.primario} accessibilityLabel="Cargando favor" />
      </MarcoPantallaFavores>
    );
  }
  if (!publicacion) {
    return (
      <MarcoPantallaFavores titulo="Calificar favor">
        <AvisoFavores texto={error ?? "No se encontró el favor."} />
      </MarcoPantallaFavores>
    );
  }

  const uidCalificado = publicacion.solicitanteId === vecino.uid ? publicacion.prestadorId : publicacion.solicitanteId;
  const nombreCalificado = uidCalificado === publicacion.perfilPrestador?.uid
    ? publicacion.perfilPrestador?.nombre
    : publicacion.perfilSolicitante?.nombre;
  const yaCalifico = publicacion.misCalificaciones?.some((calificacion) => calificacion.autorUid === vecino.uid);

  return (
    <MarcoPantallaFavores
      titulo="Calificar favor"
      descripcion={nombreCalificado ? `¿Cómo fue la experiencia con ${nombreCalificado}?` : "¿Cómo fue la experiencia con tu vecino?"}
    >
      {error ? <AvisoFavores texto={error} /> : null}
      {yaCalifico ? (
        <AvisoFavores texto="Ya dejaste tu calificación para este favor." />
      ) : (
        <>
          <Text style={[styles.pregunta, { color: colores.texto }]}>Tu calificación es opcional.</Text>
          <View style={styles.estrellas}>
            {[1, 2, 3, 4, 5].map((valor) => (
              <Pressable
                key={valor}
                accessibilityRole="button"
                accessibilityLabel={`${valor} ${valor === 1 ? "estrella" : "estrellas"}`}
                accessibilityState={{ selected: estrellas === valor }}
                onPress={() => setEstrellas(valor)}
                style={[styles.estrella, { borderColor: colores.borde, backgroundColor: estrellas >= valor ? colores.primarioSuave : colores.superficie }]}
              >
                <Text style={{ color: estrellas >= valor ? colores.primario : colores.textoSecundario, fontSize: 28 }}>★</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.seleccion, { color: colores.textoSecundario }]}>{estrellas} de 5 estrellas</Text>
          <Boton texto={guardando ? "Guardando..." : "Enviar calificación"} onPress={() => void guardar()} deshabilitado={guardando} />
        </>
      )}
      <Boton texto="Ahora no" variante="secundario" onPress={() => router.replace(hrefDetalleFavor(id))} />
    </MarcoPantallaFavores>
  );
}

const styles = StyleSheet.create({
  pregunta: TIPO.cuerpo,
  estrellas: { flexDirection: "row", gap: ESPACIO.xs, justifyContent: "center" },
  estrella: { width: 52, height: 52, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  seleccion: { ...TIPO.pequeno, textAlign: "center" },
});
