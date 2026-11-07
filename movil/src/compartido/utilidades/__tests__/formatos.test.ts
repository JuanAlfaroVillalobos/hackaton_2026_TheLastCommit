// Pruebas de los formatos de español de Perú y del geohash.
import { describe, expect, it } from "@jest/globals";
import { geohashForLocation } from "geofire-common";
import { extracto, formatearDistancia, formatearFechaCorta, formatearHace, iniciales, primerNombre } from "../formatos";
import { centroGeohash, distanciaMetros } from "../geo";

describe("formatearDistancia", () => {
  it("redondea a 100 m, con coma decimal y mínimo 100 m", () => {
    expect(formatearDistancia(20)).toBe("a 100 m");
    expect(formatearDistancia(349)).toBe("a 300 m");
    expect(formatearDistancia(960)).toBe("a 1 km");
    expect(formatearDistancia(1180)).toBe("a 1,2 km");
    expect(formatearDistancia(2999)).toBe("a 3 km");
  });
});

describe("formatearHace", () => {
  const ahora = 1_000_000_000;
  it("usa min, h y d", () => {
    expect(formatearHace(ahora - 20_000, ahora)).toBe("hace un momento");
    expect(formatearHace(ahora - 10 * 60_000, ahora)).toBe("hace 10 min");
    expect(formatearHace(ahora - 60 * 60_000, ahora)).toBe("hace 1 h");
    expect(formatearHace(ahora - 49 * 3600_000, ahora)).toBe("hace 2 d");
  });
});

describe("textos", () => {
  it("fecha corta en español", () => {
    expect(formatearFechaCorta(new Date(2026, 10, 8, 18).getTime())).toBe("dom 8 nov");
  });

  it("extracto de hasta 80 caracteres", () => {
    const largo = "Necesito ayuda para configurar el WhatsApp del celular de mi mamá y también el correo, la cámara y las fotos.";
    const r = extracto(largo, 80);
    expect(r.length).toBeLessThanOrEqual(80);
    expect(r.endsWith("…")).toBe(true);
    expect(extracto("  corto  ")).toBe("corto");
  });

  it("iniciales y primer nombre", () => {
    expect(iniciales("Rosa Vega")).toBe("RV");
    expect(iniciales("Carmen del Pilar Huamán")).toBe("CH");
    expect(iniciales("Ana")).toBe("A");
    expect(primerNombre("Ana Morales")).toBe("Ana");
  });
});

describe("geohash", () => {
  it("el centro de la celda de precisión 7 queda a menos de 150 m del punto", () => {
    const punto = { lat: -8.1116, lng: -79.0288 };
    const centro = centroGeohash(geohashForLocation([punto.lat, punto.lng], 7));
    expect(distanciaMetros(punto, centro)).toBeLessThan(150);
  });
});
