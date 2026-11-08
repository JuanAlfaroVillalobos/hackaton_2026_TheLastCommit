// Ruta: src/modulos/identidad/index.ts
// API pública del módulo identidad (RF36). Otros módulos usan la insignia y el estado desde aquí.
export { default as VerificarIdentidadPantalla } from './pantallas/VerificarIdentidadPantalla';
export { default as ValidarIdentidadesPantalla } from './pantallas/ValidarIdentidadesPantalla';
export { InsigniaVerificada } from './componentes/InsigniaVerificada';
export { usePuedeOfrecer } from './hooks/usePuedeOfrecer';
export { identidadEnviada } from './reglas';
export type { EstadoIdentidad, ResumenIdentidad } from './tipos';
