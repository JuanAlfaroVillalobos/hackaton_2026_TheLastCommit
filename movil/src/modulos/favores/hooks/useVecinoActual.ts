import { api } from "@/nucleo/api";
import { useSesion } from "@/nucleo/sesion";
import { vecinoActualMock } from "@/simulaciones";
import { useEffect, useState } from "react";
import type { VecinoActual } from "../tipos";

type PerfilApi = {
  id: string;
  nombre: string;
  barrio: string;
  oficios: VecinoActual["oficios"];
  necesidadActivaId: string | null;
  servicioActivoId: string | null;
  ubicacion: VecinoActual["ubicacion"];
};

type VecinoActualCargado = VecinoActual & {
  cargando: boolean;
  error: string | null;
};

const INTERVALO_PERFIL_MS = 5_000;

export function useVecinoActual(): VecinoActualCargado {
  const { usuario, modoDesarrollo } = useSesion();
  const [perfil, setPerfil] = useState<VecinoActual>(() =>
    usuario && !modoDesarrollo
      ? {
          uid: usuario.uid,
          nombre: usuario.displayName?.trim() || "Vecino",
          barrio: null,
          oficios: [],
          necesidadActivaId: null,
          servicioActivoId: null,
          ubicacion: null,
        }
      : {
          ...vecinoActualMock,
          uid: usuario?.uid ?? vecinoActualMock.uid,
          nombre: usuario?.displayName?.trim() || vecinoActualMock.nombre,
        },
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    if (!usuario || modoDesarrollo) {
      setPerfil({
        ...vecinoActualMock,
        uid: usuario?.uid ?? vecinoActualMock.uid,
        nombre: usuario?.displayName?.trim() || vecinoActualMock.nombre,
      });
      setCargando(false);
      setError(null);
      return () => {
        vigente = false;
      };
    }

    setPerfil({
      uid: usuario.uid,
      nombre: usuario.displayName?.trim() || "Vecino",
      barrio: null,
      oficios: [],
      necesidadActivaId: null,
      servicioActivoId: null,
      ubicacion: null,
    });
    setCargando(true);
    setError(null);
    let consultando = false;
    const cargar = async () => {
      if (!vigente || consultando) return;
      consultando = true;
      try {
        const datos = await api<PerfilApi>("/vecinos/yo");
        if (!vigente) return;
        setPerfil({
          uid: datos.id,
          nombre: datos.nombre,
          barrio: datos.barrio || null,
          oficios: datos.oficios,
          necesidadActivaId: datos.necesidadActivaId,
          servicioActivoId: datos.servicioActivoId,
          ubicacion: datos.ubicacion,
        });
        setError(null);
      } catch (e: unknown) {
        if (vigente) setError(e instanceof Error ? e.message : "No se pudo cargar tu perfil.");
      } finally {
        consultando = false;
        if (vigente) setCargando(false);
      }
    };
    void cargar();
    const intervalo = setInterval(() => void cargar(), INTERVALO_PERFIL_MS);

    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [usuario, modoDesarrollo]);

  return { ...perfil, cargando, error };
}
