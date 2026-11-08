// Ruta: src/nucleo/arranque.ts
// Se ejecuta antes de montar la app (lo importa movil/index.ts). Aquí se registra todo lo que debe
// funcionar con la app cerrada: tareas de segundo plano y manejadores de notificaciones.
// Un módulo que necesite manejar sus notificaciones con la app cerrada agrega aquí su import.
import '@/nucleo/ubicacion/segundoPlano';
import '@/nucleo/notificaciones/segundoPlano';
