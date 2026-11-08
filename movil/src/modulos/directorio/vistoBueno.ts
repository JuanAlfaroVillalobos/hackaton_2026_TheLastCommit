// Ruta: src/modulos/directorio/vistoBueno.ts
// B7 (RF33): tras calificar con 4 o 5 estrellas un favor, se invita a dar el Visto Bueno a la ficha del prestador.
// Lo llama el módulo favores (CalificarPantalla) desde `@/modulos/directorio`.
// Respeta RN-17: no a uno mismo, con identidad enviada, a ≤ 2 km de la ficha y una sola vez por ficha.
import { distanciaMetros } from "@/compartido/utilidades/geo";
import type { PerfilVecino } from "@/nucleo/sesion";
import { Alert } from "react-native";
import { alternarVistoBueno, listarDirectorio } from "./servicios/directorioServicio";

const CALIFICACION_MINIMA = 4;
const DISTANCIA_MAX_M = 2000;

type Params = {
  /** uid del prestador que acaba de ser calificado. */
  prestadorUid: string;
  prestadorNombre?: string | null;
  /** Estrellas que dejó el vecino (1 a 5). */
  estrellas: number;
  perfil: PerfilVecino;
};

/**
 * @description Si corresponde, muestra «¿Quieres dar un Visto Bueno?» y lo registra al aceptar.
 * Devuelve `true` si mostró la invitación y `false` si no correspondía (no hay ficha, ya lo dio, está lejos, etc.).
 * Nunca lanza: un fallo aquí no debe impedir guardar la calificación.
 */
export async function proponerVistoBueno({ prestadorUid, prestadorNombre, estrellas, perfil }: Params): Promise<boolean> {
  try {
    const ubicacion = perfil.ubicacion;
    if (estrellas < CALIFICACION_MINIMA) return false;
    if (perfil.uid === prestadorUid || perfil.estadoIdentidad === "NO_ENVIADA" || !ubicacion) return false;

    const fichas = await listarDirectorio();
    const ficha = fichas.find(
      (f) =>
        f.autor.uid === prestadorUid &&
        f.activo &&
        !f.vistosBuenosUids.includes(perfil.uid) &&
        distanciaMetros(ubicacion, f.ubicacion) <= DISTANCIA_MAX_M,
    );
    if (!ficha) return false;

    const nombre = prestadorNombre?.trim() || ficha.autor.nombre;
    return await new Promise<boolean>((resolver) => {
      Alert.alert(
        `¿Recomendar a ${nombre}?`,
        `Calificaste bien su ayuda. ¿Quieres darle un Visto Bueno en el directorio por «${ficha.titulo}»?`,
        [
          { text: "Ahora no", style: "cancel", onPress: () => resolver(true) },
          {
            text: "Dar Visto Bueno",
            onPress: () => {
              void (async () => {
                try {
                  await alternarVistoBueno(ficha.id, perfil, "");
                  Alert.alert("Visto Bueno registrado", "Gracias por recomendar a tu vecino.");
                } catch (error) {
                  Alert.alert("No se pudo completar", error instanceof Error ? error.message : "Inténtalo nuevamente.");
                }
                resolver(true);
              })();
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolver(true) },
      );
    });
  } catch {
    return false;
  }
}