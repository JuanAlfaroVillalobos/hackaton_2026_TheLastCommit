// Ruta: src/nucleo/repositorio.ts
// Contrato de acceso a datos. Las rutas solo conocen esta interfaz; hay dos implementaciones:
// RepositorioMemoria (aquí) y RepositorioFirestore (repositorioFirestore.ts). Cuál usa cada colección
// se decide en src/datos/almacen.ts. Todos los métodos son async aunque la memoria no lo necesite.
import { conflicto } from './errores.js';

export interface Entidad {
  id: string;
}

/** Resultado de crearSiNoExiste: la fila nueva o la que ya cumplía la condición. */
export interface ResultadoCreacion<T> {
  fila: T;
  creada: boolean;
}

export interface Repositorio<T extends Entidad> {
  /** Filtra por igualdad en cada campo dado. */
  listar(filtro?: Partial<T>): Promise<T[]>;
  obtener(id: string): Promise<T | null>;
  /** Crea el documento; lanza 409 si el id ya existe. */
  crear(datos: T): Promise<T>;
  /**
   * Crea `datos` solo si ninguna fila que cumple `filtro` pasa `vigente`; si alguna lo pasa, la
   * devuelve sin crear nada. Es atómico: con dos llamadas simultáneas solo una crea (RN-04, RN-12).
   */
  crearSiNoExiste(datos: T, filtro: Partial<T>, vigente?: (fila: T) => boolean): Promise<ResultadoCreacion<T>>;
  /** Crea o reemplaza el documento completo. */
  guardar(datos: T): Promise<T>;
  actualizar(id: string, cambios: Partial<T>): Promise<T | null>;
  eliminar(id: string): Promise<boolean>;
}

/** Implementación en memoria. Los datos se reinician cada vez que se levanta el servidor. */
export class RepositorioMemoria<T extends Entidad> implements Repositorio<T> {
  private readonly filas = new Map<string, T>();

  constructor(semilla: T[] = []) {
    for (const fila of semilla) this.filas.set(fila.id, structuredClone(fila));
  }

  private filtrar(filtro: Partial<T>): T[] {
    const condiciones = Object.entries(filtro).filter(([, valor]) => valor !== undefined);
    return [...this.filas.values()].filter((fila) =>
      condiciones.every(([campo, valor]) => fila[campo as keyof T] === valor),
    );
  }

  async listar(filtro: Partial<T> = {}): Promise<T[]> {
    return this.filtrar(filtro).map((fila) => structuredClone(fila));
  }

  async obtener(id: string): Promise<T | null> {
    const fila = this.filas.get(id);
    return fila ? structuredClone(fila) : null;
  }

  async crear(datos: T): Promise<T> {
    if (this.filas.has(datos.id)) throw conflicto(`${datos.id} ya existe.`);
    return this.guardar(datos);
  }

  // Sin `await` entre la búsqueda y la escritura: Node no intercala otra petición, así que es atómico.
  async crearSiNoExiste(datos: T, filtro: Partial<T>, vigente: (fila: T) => boolean = () => true) {
    const previa = this.filtrar(filtro).find(vigente);
    if (previa) return { fila: structuredClone(previa), creada: false };
    if (this.filas.has(datos.id)) throw conflicto(`${datos.id} ya existe.`);
    this.filas.set(datos.id, structuredClone(datos));
    return { fila: structuredClone(datos), creada: true };
  }

  async guardar(datos: T): Promise<T> {
    this.filas.set(datos.id, structuredClone(datos));
    return structuredClone(datos);
  }

  async actualizar(id: string, cambios: Partial<T>): Promise<T | null> {
    const actual = this.filas.get(id);
    if (!actual) return null;
    const nueva = { ...actual, ...cambios, id };
    this.filas.set(id, nueva);
    return structuredClone(nueva);
  }

  async eliminar(id: string): Promise<boolean> {
    return this.filas.delete(id);
  }
}
