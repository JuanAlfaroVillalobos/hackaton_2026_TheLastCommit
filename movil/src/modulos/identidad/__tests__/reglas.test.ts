// Pruebas de las reglas de identidad (RF36, RN-18).
import { describe, expect, it } from '@jest/globals';
import { errorDni, errorNombres, identidadEnviada, normalizarComoDni } from '../reglas';

describe('DNI', () => {
  it('exige 8 dígitos reales', () => {
    expect(errorDni('')).toBe('Escribe tu número de DNI.');
    expect(errorDni('4567')).toBe('Faltan 4 dígitos.');
    expect(errorDni('4567891')).toBe('Falta 1 dígito.');
    expect(errorDni('11111111')).toMatch(/no es válido/);
    expect(errorDni('12345678')).toMatch(/no es válido/);
    expect(errorDni('45678912')).toBeUndefined();
  });
});

describe('nombres y apellidos', () => {
  it('pide los dos apellidos salvo que tenga uno solo', () => {
    expect(errorNombres('PÉREZ', 'apellidos')).toMatch(/dos apellidos/);
    expect(errorNombres('PÉREZ', 'apellidos', true)).toBeUndefined();
    expect(errorNombres('PÉREZ GÓMEZ', 'apellidos')).toBeUndefined();
    expect(errorNombres('LUIS 2', 'nombres')).toMatch(/solo letras/);
  });

  it('los escribe como en el DNI', () => {
    expect(normalizarComoDni('  luis   alberto ')).toBe('LUIS ALBERTO');
  });
});

describe('RN-18', () => {
  it('ofrecer ayuda exige la identidad al menos enviada', () => {
    expect(identidadEnviada('NO_ENVIADA')).toBe(false);
    expect(identidadEnviada('RECHAZADA')).toBe(false);
    expect(identidadEnviada('PENDIENTE')).toBe(true);
    expect(identidadEnviada('VERIFICADA')).toBe(true);
  });
});
