import { distanciaMetros, type Coordenada } from "@/compartido/utilidades/geo";
import type { PerfilVecino } from "@/nucleo/sesion";
import { serviciosMock, trabajosMock } from "@/simulaciones/directorio";
import * as SecureStore from "expo-secure-store";
import type { NuevoServicio, ServicioDirectorio, TrabajoDirectorio } from "../tipos";

let directorio: ServicioDirectorio[] = [...serviciosMock];
let trabajos: TrabajoDirectorio[] = [...trabajosMock];
const CLAVE_SERVICIOS = "directorio.servicios";
const CLAVE_TRABAJOS = "directorio.trabajos";
let serviciosCargados = false;
let trabajosCargados = false;

async function guardarLocal(clave: string, valor: unknown): Promise<void> {
  try {
    const texto = JSON.stringify(valor);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(clave, texto);
      return;
    }
    const previos = Number((await SecureStore.getItemAsync(`${clave}.n`)) ?? 0);
    const trozos = texto.match(/.{1,1500}/gs) ?? [];
    for (let indice = 0; indice < trozos.length; indice++) await SecureStore.setItemAsync(`${clave}.${indice}`, trozos[indice]);
    await SecureStore.setItemAsync(`${clave}.n`, String(trozos.length));
    for (let indice = trozos.length; indice < previos; indice++) await SecureStore.deleteItemAsync(`${clave}.${indice}`);
  } catch {
    // La copia en memoria sigue disponible si el almacenamiento local falla.
  }
}

async function leerLocal<T>(clave: string): Promise<T | null> {
  try {
    if (typeof localStorage !== "undefined") {
      const texto = localStorage.getItem(clave);
      return texto ? JSON.parse(texto) as T : null;
    }
    const cantidad = Number((await SecureStore.getItemAsync(`${clave}.n`)) ?? 0);
    if (!cantidad) return null;
    let texto = "";
    for (let indice = 0; indice < cantidad; indice++) texto += (await SecureStore.getItemAsync(`${clave}.${indice}`)) ?? "";
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

async function cargarServicios(): Promise<void> {
  if (serviciosCargados) return;
  const cache = await leerLocal<ServicioDirectorio[]>(CLAVE_SERVICIOS);
  if (cache) directorio = cache;
  serviciosCargados = true;
}

async function cargarTrabajos(): Promise<void> {
  if (trabajosCargados) return;
  const cache = await leerLocal<TrabajoDirectorio[]>(CLAVE_TRABAJOS);
  if (cache) trabajos = cache;
  trabajosCargados = true;
}

function autorDe(perfil: PerfilVecino): ServicioDirectorio["autor"] {
  return {
    uid: perfil.uid,
    nombre: perfil.nombre,
    fotoUrl: perfil.fotoUrl,
    identidad: perfil.estadoIdentidad,
    telefono: perfil.telefono,
    whatsapp: perfil.telefono?.replace(/^\+/, "") ?? null,
    barrio: perfil.barrio ?? "Mi zona",
    ubicacion: perfil.ubicacion ?? { lat: 0, lng: 0 },
  };
}

export async function listarDirectorio(): Promise<ServicioDirectorio[]> {
  await cargarServicios();
  directorio = directorio.filter((ficha) => ficha.activo);
  await guardarLocal(CLAVE_SERVICIOS, directorio);
  return [...directorio];
}

export async function obtenerServicio(id: string): Promise<ServicioDirectorio | null> {
  return (await listarDirectorio()).find((ficha) => ficha.id === id) ?? null;
}

export async function crearServicio(datos: NuevoServicio, perfil: PerfilVecino, ubicacion: Coordenada): Promise<ServicioDirectorio> {
  await cargarServicios();
  if (perfil.estadoIdentidad === "NO_ENVIADA") throw new Error("Envía tu identidad antes de publicar.");
  if (directorio.filter((ficha) => ficha.autor.uid === perfil.uid && ficha.activo).length >= 10) {
    throw new Error("Ya tienes 10 fichas activas. Desactiva una antes de publicar otra.");
  }
  const telefono = perfil.telefono ?? "";
  const ficha: ServicioDirectorio = {
    ...datos,
    id: `servicio-${Date.now()}`,
    autor: autorDe(perfil),
    ubicacion,
    telefono,
    whatsapp: telefono.replace(/^\+/, ""),
    direccion: perfil.barrio ?? "Mi zona",
    activo: true,
    creadoEn: Date.now(),
    vistosBuenos: 0,
    vistosBuenosUids: [],
    comentariosVistoBueno: [],
    horasAyudadas: 0,
  };
  directorio = [ficha, ...directorio];
  await guardarLocal(CLAVE_SERVICIOS, directorio);
  return ficha;
}

export async function alternarVistoBueno(id: string, perfil: PerfilVecino, comentario: string): Promise<boolean> {
  await cargarServicios();
  const ficha = (await listarDirectorio()).find((item) => item.id === id);
  if (!ficha) throw new Error("Esta ficha ya no está disponible.");
  if (ficha.autor.uid === perfil.uid) throw new Error("No puedes dar un Visto Bueno a tu propia ficha.");
  const yaVoto = ficha.vistosBuenosUids.includes(perfil.uid);
  if (yaVoto) {
    ficha.vistosBuenosUids = ficha.vistosBuenosUids.filter((uid) => uid !== perfil.uid);
    ficha.comentariosVistoBueno = ficha.comentariosVistoBueno.filter((voto) => voto.uid !== perfil.uid);
    ficha.vistosBuenos = Math.max(0, ficha.vistosBuenos - 1);
    await guardarLocal(CLAVE_SERVICIOS, directorio);
    return false;
  }
  if (perfil.estadoIdentidad === "NO_ENVIADA") throw new Error("Envía tu identidad para dar un Visto Bueno.");
  if (!perfil.ubicacion || distanciaMetros(perfil.ubicacion, ficha.ubicacion) > 2000) {
    throw new Error("Solo vecinos ubicados a 2 km o menos pueden dar un Visto Bueno.");
  }
  ficha.vistosBuenosUids.push(perfil.uid);
  ficha.vistosBuenos++;
  if (comentario.trim()) {
    ficha.comentariosVistoBueno = [
      { uid: perfil.uid, nombre: perfil.nombre, texto: comentario.trim().slice(0, 140), creadoEn: Date.now() },
      ...ficha.comentariosVistoBueno,
    ];
  }
  await guardarLocal(CLAVE_SERVICIOS, directorio);
  return true;
}

export async function listarTrabajos(): Promise<TrabajoDirectorio[]> {
  await cargarTrabajos();
  trabajos = trabajos.filter((trabajo) => trabajo.estado === "ABIERTO" && trabajo.venceEn > Date.now());
  await guardarLocal(CLAVE_TRABAJOS, trabajos);
  return [...trabajos];
}

export async function crearTrabajo(
  datos: Pick<TrabajoDirectorio, "oficio" | "descripcion" | "fechaHora" | "pago">,
  perfil: PerfilVecino,
  ubicacion: Coordenada,
): Promise<TrabajoDirectorio> {
  await cargarTrabajos();
  if (perfil.estadoIdentidad === "NO_ENVIADA") throw new Error("Envía tu identidad antes de publicar.");
  const trabajo: TrabajoDirectorio = {
    ...datos,
    id: `trabajo-${Date.now()}`,
    autor: autorDe(perfil),
    ubicacion,
    creadoEn: Date.now(),
    venceEn: Date.now() + 7 * 24 * 60 * 60 * 1000,
    estado: "ABIERTO",
    interesados: [],
  };
  trabajos = [trabajo, ...trabajos];
  await guardarLocal(CLAVE_TRABAJOS, trabajos);
  return trabajo;
}

export async function mostrarInteres(id: string, perfil: PerfilVecino): Promise<void> {
  await Promise.all([cargarTrabajos(), cargarServicios()]);
  const trabajo = trabajos.find((item) => item.id === id);
  if (!trabajo || trabajo.estado !== "ABIERTO" || trabajo.venceEn <= Date.now()) throw new Error("Este trabajo ya no está disponible.");
  if (trabajo.autor.uid === perfil.uid) throw new Error("No puedes interesarte en tu propio trabajo.");
  if (trabajo.interesados.some((interesado) => interesado.uid === perfil.uid)) throw new Error("Ya enviaste tu interés.");
  trabajo.interesados.push({
    uid: perfil.uid,
    nombre: perfil.nombre,
    fotoUrl: perfil.fotoUrl,
    telefono: perfil.telefono,
    whatsapp: perfil.telefono?.replace(/^\+/, "") ?? null,
    vistosBuenos: directorio.filter((ficha) => ficha.autor.uid === perfil.uid).reduce((total, ficha) => total + ficha.vistosBuenos, 0),
    creadoEn: Date.now(),
  });
  await guardarLocal(CLAVE_TRABAJOS, trabajos);
}

export async function marcarTrabajoCubierto(id: string, uid: string): Promise<void> {
  await cargarTrabajos();
  const trabajo = trabajos.find((item) => item.id === id);
  if (!trabajo || trabajo.autor.uid !== uid) throw new Error("Solo quien publicó el trabajo puede marcarlo cubierto.");
  trabajo.estado = "CUBIERTO";
  await guardarLocal(CLAVE_TRABAJOS, trabajos);
}