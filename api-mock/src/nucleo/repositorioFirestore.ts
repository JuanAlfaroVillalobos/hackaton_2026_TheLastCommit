// Ruta: src/nucleo/repositorioFirestore.ts
// Repositorio<T> sobre una colección de Firestore. El `id` de la entidad es el id del documento y no se
// guarda como campo. Las fechas siguen en milisegundos (number), igual que en la app y en la memoria.
import type { Query } from 'firebase-admin/firestore';
import { conflicto } from './errores.js';
import { firestore } from './firebase.js';
import type { Entidad, Repositorio, ResultadoCreacion } from './repositorio.js';

/** Códigos gRPC que devuelve Firestore. */
const YA_EXISTE = 6;
const NO_ENCONTRADO = 5;

const codigoDe = (error: unknown) => (error as { code?: number }).code;

function sinId<T extends Entidad>(datos: Partial<T>): Record<string, unknown> {
  const { id: _id, ...resto } = datos;
  return resto;
}

export class RepositorioFirestore<T extends Entidad> implements Repositorio<T> {
  constructor(private readonly coleccion: string) {}

  private get ref() {
    return firestore().collection(this.coleccion);
  }

  /** Solo filtros de igualdad, como RepositorioMemoria. Firestore los resuelve sin índices compuestos. */
  private consulta(filtro: Partial<T>): Query {
    let consulta: Query = this.ref;
    for (const [campo, valor] of Object.entries(filtro)) {
      if (valor !== undefined) consulta = consulta.where(campo, '==', valor);
    }
    return consulta;
  }

  async listar(filtro: Partial<T> = {}): Promise<T[]> {
    const resultado = await this.consulta(filtro).get();
    return resultado.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
  }

  /** La consulta y la creación van en una transacción: Firestore reintenta si otra escritura choca. */
  async crearSiNoExiste(
    datos: T,
    filtro: Partial<T>,
    vigente: (fila: T) => boolean = () => true,
  ): Promise<ResultadoCreacion<T>> {
    return firestore().runTransaction(async (tx) => {
      const resultado = await tx.get(this.consulta(filtro));
      const previa = resultado.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T).find(vigente);
      if (previa) return { fila: previa, creada: false };
      tx.create(this.ref.doc(datos.id), sinId(datos));
      return { fila: datos, creada: true };
    });
  }

  async obtener(id: string): Promise<T | null> {
    const doc = await this.ref.doc(id).get();
    return doc.exists ? ({ ...doc.data(), id: doc.id } as T) : null;
  }

  /** Falla con 409 si el id ya existe (create() de Firestore es atómico). */
  async crear(datos: T): Promise<T> {
    try {
      await this.ref.doc(datos.id).create(sinId(datos));
    } catch (error) {
      if (codigoDe(error) === YA_EXISTE) throw conflicto(`${this.coleccion}/${datos.id} ya existe.`);
      throw error;
    }
    return datos;
  }

  async guardar(datos: T): Promise<T> {
    await this.ref.doc(datos.id).set(sinId(datos));
    return datos;
  }

  async actualizar(id: string, cambios: Partial<T>): Promise<T | null> {
    try {
      await this.ref.doc(id).update(sinId(cambios));
    } catch (error) {
      if (codigoDe(error) === NO_ENCONTRADO) return null;
      throw error;
    }
    return this.obtener(id);
  }

  async eliminar(id: string): Promise<boolean> {
    const doc = this.ref.doc(id);
    if (!(await doc.get()).exists) return false;
    await doc.delete();
    return true;
  }
}
