// Ruta: src/compartido/ui/index.ts
// Piezas reutilizables sin lógica de negocio. MapaBase se importa desde su archivo
// (`@/compartido/ui/MapaBase`) para no cargar react-native-maps en pantallas que no lo usan.
export { BarraPestanas, type PestanaConfig } from "./BarraPestanas";
export { Boton } from "./Boton";
export { Chip, ChipFiltro } from "./Chip";
export { Encabezado } from "./Encabezado";
export { FranjaSinConexion } from "./FranjaSinConexion";
export { Icono, type NombreIcono } from "./Icono";
export { ListaVacia } from "./ListaVacia";
export { PantallaProximamente } from "./PantallaProximamente";
export { Tarjeta } from "./Tarjeta";
