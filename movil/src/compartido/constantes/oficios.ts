// Ruta: src/compartido/constantes/oficios.ts
// Catálogo cerrado de oficios (RN-03). La colección `oficios/{id}` en Firestore usa los mismos ids.
export const OFICIOS = {
  gasfiteria: "Gasfitería",
  electricidad: "Electricidad",
  carpinteria: "Carpintería",
  limpieza: "Limpieza",
  "cuidado-ninos": "Cuidado de niños",
  "cuidado-adultos-mayores": "Cuidado de adultos mayores",
  mascotas: "Mascotas",
  "clases-tutorias": "Clases y tutorías",
  tecnologia: "Tecnología",
  "mandados-compras": "Mandados y compras",
  "primeros-auxilios": "Primeros auxilios",
  otro: "Otro",
} as const;

export type OficioId = keyof typeof OFICIOS;
