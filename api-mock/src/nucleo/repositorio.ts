// Ruta: src/nucleo/repositorio.ts
// Contrato de acceso a datos. Las rutas solo conocen esta interfaz, así que pasar a MongoDB o
// Firestore es escribir otra clase que la cumpla (p. ej. RepositorioMongo, RepositorioFirestore)
// y cambiarla en src/datos/almacen.ts. Todos los métodos son async aunque la memoria no lo necesite.

export interface Entidad {
  id: string;
}

export interface Repositorio<T extends Entidad> {
  listar(filtro?: Partial<T>): Promise<T[]>;
  obtener(id: string): Promise<T | null>;
  crear(datos: T): Promise<T>;
  actualizar(id: string, cambios: Partial<T>): Promise<T | null>;
  eliminar(id: string): Promise<boolean>;
}

/** Implementación en memoria. Los datos se reinician cada vez que se levanta el servidor. */
export class RepositorioMemoria<T extends Entidad> implements Repositorio<T> {
  private readonly filas = new Map<string, T>();

  constructor(semilla: T[] = []) {
    for (const fila of semilla) this.filas.set(fila.id, structuredClone(fila));
  }

  async listar(filtro: Partial<T> = {}): Promise<T[]> {
    const condiciones = Object.entries(filtro).filter(([, valor]) => valor !== undefined);
    return [...this.filas.values()]
      .filter((fila) => condiciones.every(([campo, valor]) => fila[campo as keyof T] === valor))
      .map((fila) => structuredClone(fila));
  }

  async obtener(id: string): Promise<T | null> {
    const fila = this.filas.get(id);
    return fila ? structuredClone(fila) : null;
  }

  async crear(datos: T): Promise<T> {
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
