// Pruebas de las reglas del muro (RF09, RF35, RN-04, sección 5.3).
import { describe, expect, it } from "@jest/globals";
import { geohashForLocation } from "geofire-common";
import { TEXTOS_INICIO } from "../constantes";
import {
  coincideConOficio,
  calcularBloques,
  esActiva,
  etiquetaEstadoSolicitante,
  minutosParaLlegar,
  prepararMuro,
  puedeCrearPublicacion,
} from "../reglas";
import type { PublicacionConAutor } from "../tipos";

const AHORA = new Date(2026, 10, 7, 10, 0).getTime();
const CENTRO = { lat: -8.1116, lng: -79.0288 };
const MIN = 60_000;
const gh = (norteM: number) => geohashForLocation([CENTRO.lat + norteM / 111_320, CENTRO.lng], 7);

function pub(parcial: Partial<PublicacionConAutor> & { id: string }): PublicacionConAutor {
  return {
    solicitanteId: "otro",
    autorId: "otro",
    prestadorId: null,
    tipo: "NECESITO",
    categoria: "FAVOR_OFICIO",
    oficioId: "gasfiteria",
    descripcion: "Descripción de prueba",
    geohash: gh(500),
    estado: "PUBLICADA",
    etaMinutos: null,
    llegadaEstimada: null,
    inicioServicio: null,
    finServicio: null,
    finSolicitadoPor: null,
    bloques: null,
    devolucionEn: null,
    devolucionRegistradaEn: null,
    retrasoAvisadoEn: null,
    expiraEn: AHORA + 60 * MIN,
    creadoEn: AHORA - 10 * MIN,
    autorNombre: "Vecino",
    prestadorNombre: null,
    ...parcial,
  };
}

const ctx = { uid: "yo", oficios: ["tecnologia" as const], centro: CENTRO, ahora: AHORA, filtro: "TODO" as const };

describe("prepararMuro (RF09)", () => {
  it("excluye las propias, las no PUBLICADA, las vencidas y las que están fuera de 3 km", () => {
    const lista = [
      pub({ id: "ok" }),
      pub({ id: "mia", autorId: "yo", solicitanteId: "yo" }),
      pub({ id: "aceptada", estado: "ACEPTADA" }),
      pub({ id: "vencida", expiraEn: AHORA - 1 }),
      pub({ id: "lejos", geohash: gh(5000) }),
    ];
    expect(prepararMuro(lista, ctx).map((e) => e.id)).toEqual(["ok"]);
  });

  it("ordena: primero mis oficios, luego distancia y luego la más reciente", () => {
    const lista = [
      pub({ id: "cerca-vieja", geohash: gh(200), creadoEn: AHORA - 50 * MIN }),
      pub({ id: "cerca-nueva", geohash: gh(200), creadoEn: AHORA - 5 * MIN }),
      pub({ id: "lejos", geohash: gh(2000) }),
      pub({ id: "mi-oficio-lejos", geohash: gh(2500), oficioId: "tecnologia" }),
    ];
    expect(prepararMuro(lista, ctx).map((e) => e.id)).toEqual(["mi-oficio-lejos", "cerca-nueva", "cerca-vieja", "lejos"]);
  });

  it("filtra por tipo (RF35)", () => {
    const lista = [pub({ id: "favor" }), pub({ id: "prestamo", tipo: "OFREZCO", categoria: "PRESTAMO", oficioId: null })];
    expect(prepararMuro(lista, { ...ctx, filtro: "PRESTAMO" }).map((e) => e.id)).toEqual(["prestamo"]);
  });

  it("calcula la distancia al centro del geohash", () => {
    const [e] = prepararMuro([pub({ id: "a", geohash: gh(600) })], ctx);
    expect(e.distanciaM).toBeGreaterThan(450);
    expect(e.distanciaM).toBeLessThan(750);
  });
});

describe("coincideConOficio", () => {
  it("solo marca necesidades de un oficio que ofrezco, no ofertas", () => {
    expect(coincideConOficio({ tipo: "NECESITO", oficioId: "tecnologia" }, ["tecnologia"])).toBe(true);
    expect(coincideConOficio({ tipo: "OFREZCO", oficioId: "tecnologia" }, ["tecnologia"])).toBe(false);
    expect(coincideConOficio({ tipo: "NECESITO", oficioId: null }, ["tecnologia"])).toBe(false);
  });
});

describe("puedeCrearPublicacion (RN-04)", () => {
  it("bloquea con una necesidad activa y da el mensaje literal de RF10", () => {
    expect(puedeCrearPublicacion("nc00")).toEqual({ permitido: false, motivo: TEXTOS_INICIO.necesidadActiva });
    expect(TEXTOS_INICIO.necesidadActiva).toBe("Ya tienes una necesidad activa. Termínala o cancélala para publicar otra.");
    expect(puedeCrearPublicacion(null)).toEqual({ permitido: true, motivo: null });
  });

  describe("calcularBloques (RN-09)", () => {
    it("redondea hacia arriba en bloques de 30 minutos, con mínimo 1 y tope 16", () => {
      const inicio = AHORA;
      expect(calcularBloques(inicio, inicio)).toBe(1);
      expect(calcularBloques(inicio, inicio + 30 * MIN)).toBe(1);
      expect(calcularBloques(inicio, inicio + 31 * MIN)).toBe(2);
      expect(calcularBloques(inicio, inicio + 9 * 60 * MIN)).toBe(16);
    });
  });
});

describe("estados (sección 5 y 5.3)", () => {
  it("esActiva", () => {
    expect(["PUBLICADA", "ACEPTADA", "EN_SITIO", "EN_CURSO", "FIN_SOLICITADO"].every((e) => esActiva(e as never))).toBe(true);
    expect(["FINALIZADO", "CANCELADA", "EXPIRADA"].some((e) => esActiva(e as never))).toBe(false);
  });

  it("etiquetas del solicitante", () => {
    expect(etiquetaEstadoSolicitante("ACEPTADA", "Luis Paredes")).toBe("Luis Paredes va en camino");
    expect(etiquetaEstadoSolicitante("EN_SITIO", "Luis Paredes")).toBe("Luis Paredes dice que llegó");
    expect(etiquetaEstadoSolicitante("PUBLICADA", null)).toBe("Esperando a un vecino");
    expect(etiquetaEstadoSolicitante("EXPIRADA", null)).toBe("Venció sin respuesta");
  });

  it("minutosParaLlegar solo en ACEPTADA y con tiempo restante", () => {
    expect(minutosParaLlegar({ estado: "ACEPTADA", llegadaEstimada: AHORA + 9.5 * MIN }, AHORA)).toBe(10);
    expect(minutosParaLlegar({ estado: "ACEPTADA", llegadaEstimada: AHORA - MIN }, AHORA)).toBeNull();
    expect(minutosParaLlegar({ estado: "EN_SITIO", llegadaEstimada: AHORA + MIN }, AHORA)).toBeNull();
  });
});
