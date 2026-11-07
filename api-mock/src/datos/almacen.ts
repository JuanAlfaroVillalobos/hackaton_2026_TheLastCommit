// Ruta: src/datos/almacen.ts
// ÚNICO lugar que decide dónde viven los datos. Para pasar una colección a MongoDB o Firestore,
// se cambia aquí `new RepositorioMemoria(...)` por la implementación nueva; las rutas no cambian.
import { RepositorioMemoria, type Repositorio } from '../nucleo/repositorio.js';
import * as semillas from './semillas.js';
import type {
  AlertaEmergencia,
  FichaEmergencia,
  Publicacion,
  RecursoCritico,
  ReporteVulnerabilidad,
  ServicioDirectorio,
  Usuario,
  VecinoEmergencia,
} from './tipos.js';

export const almacen: {
  usuarios: Repositorio<Usuario>;
  publicaciones: Repositorio<Publicacion>;
  directorio: Repositorio<ServicioDirectorio>;
  vecinosEmergencia: Repositorio<VecinoEmergencia>;
  reportes: Repositorio<ReporteVulnerabilidad>;
  recursos: Repositorio<RecursoCritico>;
  fichasEmergencia: Repositorio<FichaEmergencia>;
  alertas: Repositorio<AlertaEmergencia>;
} = {
  usuarios: new RepositorioMemoria(semillas.usuarios),
  publicaciones: new RepositorioMemoria(semillas.publicaciones),
  directorio: new RepositorioMemoria(semillas.directorio),
  vecinosEmergencia: new RepositorioMemoria(semillas.vecinosEmergencia),
  reportes: new RepositorioMemoria(semillas.reportes),
  recursos: new RepositorioMemoria(semillas.recursos),
  fichasEmergencia: new RepositorioMemoria(semillas.fichasEmergencia),
  alertas: new RepositorioMemoria(semillas.alertas),
};
