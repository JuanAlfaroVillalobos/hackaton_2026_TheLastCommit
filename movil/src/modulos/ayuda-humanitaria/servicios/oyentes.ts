// Ruta: src/modulos/ayuda-humanitaria/servicios/oyentes.ts
// Avisa a las pantallas cuando cambia una lista. Equivale al onSnapshot de Firestore: cuando se conecte
// Firestore, cada servicio lo reemplaza por su listener y las pantallas no cambian.
export function crearOyentes() {
  const oyentes = new Set<() => void>();
  return {
    suscribir(alCambiar: () => void): () => void {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
    avisar(): void {
      oyentes.forEach((f) => f());
    },
  };
}
