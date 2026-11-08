// Ruta: src/modulos/ayuda-humanitaria/sms/__tests__/ayudaSms.test.ts
// Vectores de prueba de V, R y VR: ida y vuelta, formato exacto y presupuesto de segmentos (README 10.4).
import { describe, expect, it } from "@jest/globals";
import {
    EPOCA_SMS_MS,
    MAX_NOTA_SMS,
    SmsInvalido,
    cabeEnUnSegmento,
    codificarR,
    codificarV,
    codificarVR,
    decodificarR,
    decodificarV,
    decodificarVR,
    largoSmsEstimado,
    limpiarNota,
    nuevoIdMsg,
} from "../ayudaSms";

const AHORA = EPOCA_SMS_MS + 3600 * 1000; // 1 h = 3600 s = «2s0» en base36

describe("V · reporte de vulnerabilidad", () => {
  const d = { tipo: "NINOS_SOLOS" as const, personas: 3, nota: "Tres niños sin adultos", lat: -8.1116, lng: -79.0288 };

  it("formato exacto", () => {
    expect(codificarV(d, "ab12cd", AHORA)).toBe("V|ab12cd|2s0|N|3|-1ql8|-gxsg|Tres niños sin adultos");
  });

  it("ida y vuelta", () => {
    const m = decodificarV(codificarV(d, "ab12cd", AHORA));
    expect(m).toMatchObject({ idMsg: "ab12cd", tipo: "NINOS_SOLOS", personas: 3, nota: d.nota, ts: AHORA });
    expect(m.lat).toBeCloseTo(d.lat, 4);
    expect(m.lng).toBeCloseTo(d.lng, 4);
  });

  it("peor caso cabe en 1 segmento", () => {
    const peor = codificarV({ ...d, personas: 99, nota: "x".repeat(60) }, "zzzzzz", AHORA);
    expect(cabeEnUnSegmento(peor)).toBe(true);
    expect(largoSmsEstimado(peor)).toBeLessThanOrEqual(160);
  });

  it("la nota se limpia y se recorta", () => {
    expect(limpiarNota("a|b\nc")).toBe("a b c");
    expect(limpiarNota("x".repeat(100))).toHaveLength(MAX_NOTA_SMS);
  });

  it("nota vacía y rechazo de mensajes malos", () => {
    expect(decodificarV(codificarV({ ...d, nota: "" }, "ab12cd", AHORA)).nota).toBe("");
    expect(() => decodificarV("V|ab12cd|2s0|Z|3|1|1|x")).toThrow(SmsInvalido);
    expect(() => decodificarV("R|ab12cd|2s0|N|3|1|1|x")).toThrow(SmsInvalido);
    expect(() => decodificarV("V|ab12cd|2s0|N|0|1|1|x")).toThrow(SmsInvalido);
  });
});

describe("R · recurso crítico", () => {
  const d = { modo: "NECESITO" as const, tipo: "AGUA" as const, cantidad: 20, lat: -8.1116, lng: -79.0288 };

  it("formato exacto", () => {
    expect(codificarR(d, "q1w2e3", AHORA)).toBe("R|q1w2e3|2s0|N|A|k|-1ql8|-gxsg");
  });

  it("ida y vuelta y 1 segmento", () => {
    const texto = codificarR(d, "q1w2e3", AHORA);
    expect(decodificarR(texto)).toMatchObject({ modo: "NECESITO", tipo: "AGUA", cantidad: 20, idMsg: "q1w2e3" });
    expect(cabeEnUnSegmento(texto)).toBe(true);
  });

  it("rechaza modo o tipo inválidos", () => {
    expect(() => decodificarR("R|q1w2e3|2s0|X|A|k|1|1")).toThrow(SmsInvalido);
    expect(() => decodificarR("R|q1w2e3|2s0|N|Q|k|1|1")).toThrow(SmsInvalido);
  });
});

describe("VR · aviso de bajada", () => {
  const a = { codigo: "BK7824", tipo: "HERIDO" as const, personas: 1, lat: -8.1116, lng: -79.0288 };

  it("ida y vuelta y 1 segmento", () => {
    const texto = codificarVR(a, "mm11nn", AHORA);
    expect(texto).toBe("VR|mm11nn|2s0|BK7824|H|1|-1ql8|-gxsg");
    expect(decodificarVR(texto)).toMatchObject({ codigo: "BK7824", tipo: "HERIDO", personas: 1 });
    expect(cabeEnUnSegmento(texto)).toBe(true);
  });
});

describe("idMsg", () => {
  it("6 caracteres base36", () => {
    expect(nuevoIdMsg()).toMatch(/^[0-9a-z]{6}$/);
  });
});