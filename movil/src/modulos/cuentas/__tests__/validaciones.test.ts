// Pruebas de las reglas de los formularios de cuentas (RF01, RF07).
import { describe, expect, it } from '@jest/globals';
import {
  errorClave,
  errorCorreo,
  errorNombre,
  errorTelefono,
  formatearTelefono,
  fuerzaClave,
  normalizarNombre,
  reglasClave,
  sugerirCorreo,
  validarRegistro,
} from '../validaciones';

describe('nombre', () => {
  it('exige nombre y apellido con letras', () => {
    expect(errorNombre('')).toBe('Escribe tu nombre y apellido.');
    expect(errorNombre('Ana')).toBe('Escribe también tu apellido.');
    expect(errorNombre('Ana 123')).toMatch(/solo letras/);
    expect(errorNombre('Ana M.')).toMatch(/sin abreviaturas/);
    expect(errorNombre('Aaaron Pérez')).toMatch(/repetidas/);
  });

  it('acepta tildes, ñ, apóstrofo y guion', () => {
    expect(errorNombre('José Ñúñez')).toBeUndefined();
    expect(errorNombre("María-José O'Brien")).toBeUndefined();
  });

  it('ordena espacios y mayúsculas', () => {
    expect(normalizarNombre('  luis   pérez ')).toBe('Luis Pérez');
    expect(normalizarNombre("maría-josé o'brien")).toBe("María-José O'Brien");
  });
});

describe('correo', () => {
  it('explica qué falta', () => {
    expect(errorCorreo('ana')).toMatch(/Falta la @/);
    expect(errorCorreo('ana@')).toMatch(/dominio/);
    expect(errorCorreo('ana @gmail.com')).toMatch(/espacios/);
    expect(errorCorreo('ana..b@gmail.com')).toMatch(/dos puntos/);
  });

  it('rechaza correos temporales y acepta los normales', () => {
    expect(errorCorreo('ana@yopmail.com')).toMatch(/temporales/);
    expect(errorCorreo('Ana@Gmail.com')).toBeUndefined();
    expect(errorCorreo('ana@unitru.edu.pe')).toBeUndefined();
  });

  it('sugiere el dominio cuando hay un error de tipeo', () => {
    expect(sugerirCorreo('ana@gmial.com')).toBe('ana@gmail.com');
    expect(sugerirCorreo('ana@hotmail.co')).toBe('ana@hotmail.com');
    expect(sugerirCorreo('ana@gmail.com')).toBeUndefined();
    expect(sugerirCorreo('ana@unitru.edu.pe')).toBeUndefined();
  });
});

describe('celular', () => {
  it('valida celulares peruanos', () => {
    expect(errorTelefono('812345678')).toMatch(/empiezan con 9/);
    expect(errorTelefono('9123')).toBe('Faltan 5 dígitos.');
    expect(errorTelefono('99999999')).toBe('Falta 1 dígito.');
    expect(errorTelefono('999999999')).toMatch(/no parece real/);
    expect(errorTelefono('912345678')).toBeUndefined();
  });

  it('agrupa de a tres', () => {
    expect(formatearTelefono('912345678')).toBe('912 345 678');
    expect(formatearTelefono('9123')).toBe('912 3');
  });
});

describe('clave', () => {
  const contexto = { nombre: 'Ana Morales', correo: 'ana.m@gmail.com', telefono: '987654321' };

  it('marca las reglas que cumple', () => {
    const reglas = Object.fromEntries(reglasClave('abcdefg1').map((r) => [r.id, r.cumple]));
    expect(reglas).toEqual({ largo: true, minuscula: true, mayuscula: false, numero: true, espacios: true });
  });

  it('rechaza claves débiles, comunes o con datos personales', () => {
    expect(errorClave('Abc 1234x')).toMatch(/sin espacios/);
    expect(errorClave('Vecinos123')).toMatch(/muy común/);
    expect(errorClave('Abcd1234')).toBeDefined();
    expect(errorClave('Morales2026', contexto)).toMatch(/nombre/);
    expect(errorClave('Ana654321x', contexto)).toMatch(/teléfono/);
  });

  it('mide la fuerza', () => {
    expect(fuerzaClave('').nivel).toBe(0);
    expect(fuerzaClave('abc').texto).toBe('Débil');
    expect(fuerzaClave('Perro7Gato').texto).toBe('Buena');
    expect(fuerzaClave('Tr1go-Verde!Casa').texto).toBe('Fuerte');
  });
});

describe('formulario de registro', () => {
  const valido = {
    nombre: 'Luis Pérez',
    correo: 'luis@gmail.com',
    telefono: '912345678',
    clave: 'Tr1go-Verde',
    confirmacion: 'Tr1go-Verde',
    terminos: true,
  };

  it('no tiene errores si todo está bien', () => {
    expect(validarRegistro(valido)).toEqual({});
  });

  it('exige confirmar la clave y aceptar la política', () => {
    const errores = validarRegistro({ ...valido, confirmacion: 'otra', terminos: false });
    expect(Object.keys(errores).sort()).toEqual(['confirmacion', 'terminos']);
  });
});
