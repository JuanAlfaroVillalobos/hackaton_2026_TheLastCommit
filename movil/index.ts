// Punto de entrada: primero lo que debe existir con la app cerrada (FCM, tareas en segundo plano),
// luego Expo Router.
import './src/nucleo/arranque';
// Avisos que deben manejarse con la app cerrada (RF23: «¿Estás bien?» y sus acciones).
import './src/modulos/emergencia/notificaciones';
import 'expo-router/entry';
