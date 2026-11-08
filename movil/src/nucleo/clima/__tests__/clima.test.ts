// Ruta: src/nucleo/clima/__tests__/clima.test.ts
import { describe, expect, it } from "@jest/globals";
import { leerRespuesta, urlOpenMeteo } from "../obtenerClima";
import { esCodigoDeLluvia, hayCalorInusual, temaPorClima } from "../reglasClima";

const base = { codigoClima: 0, precipitacion: 0, temperaturaAparente: 22, maximasUltimos30Dias: [24, 25, 23] };

describe("reglas del clima", () => {
  it("códigos de lluvia WMO", () => {
    for (const c of [51, 61, 67, 80, 82, 95, 99]) expect(esCodigoDeLluvia(c)).toBe(true);
    for (const c of [0, 3, 45, 48, 68, 79, 83, 94]) expect(esCodigoDeLluvia(c)).toBe(false);
  });
  it("lluvia por código o por precipitación", () => {
    expect(temaPorClima({ ...base, codigoClima: 61 })).toBe("lluvia");
    expect(temaPorClima({ ...base, precipitacion: 0.3 })).toBe("lluvia");
    expect(temaPorClima({ ...base, precipitacion: 0.2 })).toBe("normal");
  });
  it("calor por umbral absoluto o por media + 5", () => {
    expect(hayCalorInusual({ ...base, temperaturaAparente: 30 })).toBe(true);
    expect(hayCalorInusual({ ...base, temperaturaAparente: 29.5, maximasUltimos30Dias: [24, 25, 23] })).toBe(true); // 24 + 5 = 29
    expect(hayCalorInusual({ ...base, temperaturaAparente: 28, maximasUltimos30Dias: [24, 25, 23] })).toBe(false);
  });
  it("calor gana a lluvia", () => {
    expect(temaPorClima({ ...base, codigoClima: 61, temperaturaAparente: 31 })).toBe("calor");
  });
  it("normal por defecto", () => {
    expect(temaPorClima(base)).toBe("normal");
  });
});

describe("Open-Meteo", () => {
  it("arma la URL", () => {
    const u = urlOpenMeteo({ lat: -8.1116, lng: -79.0288 });
    expect(u).toMatch(/latitude=-8\.1116&longitude=-79\.0288/);
    expect(u).toMatch(/past_days=30/);
  });
  it("lee la respuesta y quita hoy de las máximas", () => {
    const d = leerRespuesta({
      current: { weather_code: 61, precipitation: 0.5, apparent_temperature: 19.2 },
      daily: { temperature_2m_max: [24, 25, 26, 20] },
    });
    expect(d).toMatchObject({ codigoClima: 61, precipitacion: 0.5, temperaturaAparente: 19.2 });
    expect(d?.maximasUltimos30Dias).toHaveLength(3);
  });
  it("respuesta incompleta → null", () => {
    expect(leerRespuesta({})).toBe(null);
  });
});