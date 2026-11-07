# Plan de trabajo — 48 horas, 5 personas

> Equipo **TheLastCommit** · Requisitos: [README.md](README.md) (los IDs `RF`, `RN`, `RNF` y `P` de este plan son los de ese documento).
> Las personas se nombran **A, B, C, D y E**; reemplacen las letras por sus nombres en la tabla de la sección 1.

## Cómo se reparte

Cada persona es dueña de **módulos completos, de punta a punta**: pantallas, servicios, funciones de Firebase, reglas de seguridad, **su camino por SMS** y su escena de la demo. Nadie entrega «solo el backend» o «solo las pantallas».

La carpeta de cada módulo (README, sección 9.5) tiene un único dueño. Así 5 personas trabajan en paralelo sin pisarse.

El SMS es la base del modo offline, así que se reparte así:

- **D construye el transporte**: módulo nativo, cifrado, codec, móvil intermediario y la función `procesarSms`.
- **A construye la bandeja de salida**: decide si una acción sale por internet, por SMS o queda pendiente.
- **Cada dueño agrega y prueba sus propios tipos de mensaje** en `sms/` de su módulo (tabla del README, sección 10.4).

## 1. Equipo y módulos

| Persona     | Nombre       | Pilar                                   | Módulos y carpetas                                                                                                                                                                               | Requerimientos                     | Tipos SMS                                                |
| ----------- | ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **A** | _Fabrizio_ | Plataforma, cuentas e identidad         | `modulos/cuentas`, `modulos/identidad`, `modulos/bienvenida`, `nucleo/*` (salvo `clima`), `functions/src/nucleo`, configuración (`app.config.ts`, `eas.json`, Firebase, Hosting) | RF01–RF08, RF36, RF37, RF41, RF42 | Dueño de la bandeja de salida                           |
| **B** | Jamila       | Economía local + sistema visual        | `modulos/directorio`, `modulos/trabajos`, `compartido/ui`, `compartido/tema`, `nucleo/clima`                                                                                            | RF31–RF34                         | —                                                       |
| **C** | _Malek_    | Economía solidaria (cadena de favores) | `modulos/favores`, `functions/src/programadas`, paquete `compartido/src/modelos` y `esquemas`                                                                                             | RF09–RF19, RF35                   | `N`, `A`, `L`, `C`, `F`, `X`, `NV`, `ES` |
| **D** | _Manuel_   | Emergencia + transporte SMS             | `modulos/emergencia`, `modulos/contingencia-sms`, `modules/sms-nativo`, paquete `compartido/src/sms`                                                                                      | RF20, RF21, RF23–RF28             | `E`, `K`, `OK`, `EA`, `AL`                     |
| **E** | _Juan_     | Ayuda humanitaria                       | `modulos/ayuda-humanitaria`, `simulaciones/`, `scripts/seed.ts`                                                                                                                             | RF22, RF29, RF38–RF40            | `V`, `R`, `VR`                                     |

**Archivos compartidos**:

- `firestore.rules`, `firestore.indexes.json` y `functions/src/index.ts`: cada persona agrega su bloque en la sección marcada con el nombre de su módulo y avisa en el chat antes de hacer merge.
- `app.config.ts` y las dependencias nativas: solo las toca **A**, porque cada cambio obliga a un build nuevo.
- Las rutas de `src/app/` son archivos de una línea: cada dueño crea las de sus pantallas.

## 2. Cronograma

```text
H0   H3                 H16                  H30            H40     H44     H48
|-F0-|-------- F1 --------|-------- F2 --------|----- F3 -----|Pruebas|Pitch|
     online por pilar    ▲ Hito 1             ▲ Hito 2       ▲ Congelamiento
                         demo online          demo offline (SMS)
```

| Fase                          | Horas    | Objetivo                                                                                 | Se cierra cuando…                                                                                                                       |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **F0** Arranque         | H0–H3   | Proyecto corriendo en los teléfonos, estructura de carpetas creada, contratos acordados | Cada persona abre el *development build* y ve las pestañas vacías; D envía y recibe un SMS entre 2 teléfonos con el módulo nativo |
| **F1** Online           | H3–H16  | Cada módulo funciona con internet                                                       | **Hito 1:** el guion de la demo (sección 6) corre completo con internet en un build `preview`                                   |
| **F2** SMS + emergencia | H16–H30 | Cada módulo tiene su camino por SMS; emergencia completa                                | **Hito 2:** el guion corre con 2 teléfonos sin datos (solo SMS) y 1 intermediario                                                 |
| **F3** Pulido           | H30–H40 | Onboarding, temas, datos de prueba, errores, accesibilidad                               | Lista de errores críticos vacía                                                                                                        |
| **Cierre**              | H40–H48 | Build final, pruebas, pitch                                                              | APK final instalado en los teléfonos de la demo y ensayo cronometrado                                                                   |

**Descanso:** en turnos escalonados de ~4 h, para que siempre haya alguien que pueda desbloquear cada dependencia.

| Turno    | Duermen  | Despiertos |
| -------- | -------- | ---------- |
| H17–H21 | A, C y E | B y D      |
| H21–H25 | B y D    | A, C y E   |
| H31–H34 | B y D    | A, C y E   |
| H34–H37 | A, C y E | B y D      |

## 3. F0 — Arranque (H0–H3, todos juntos)

| #   | Tarea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Dueño | Resultado                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| 0.1 | Crear el proyecto de Firebase (plan Blaze, región `southamerica-east1`, alerta de presupuesto), habilitar Auth (correo, Google, enlace), Firestore, Storage, Functions y FCM                                                                                                                                                                                                                                                                                                                                                                                           | A      | `google-services.json` en los secretos de EAS                                |
| 0.2 | Crear el monorepo (`movil/`, `functions/`, `compartido/`, `hosting/`) con la **estructura de carpetas de la sección 9.5 del README** (carpetas vacías con `index.ts`), Expo Router con las rutas vacías y **todas las dependencias nativas del MVP de una vez**: React Native Firebase, Notifee, react-native-maps, expo-location, task-manager, image-picker, netinfo, secure-store, expo-speech, el esqueleto de `modules/sms-nativo` y los permisos `SEND_SMS`, `RECEIVE_SMS`, `USE_FULL_SCREEN_INTENT` y ubicación en segundo plano | A      | Primer `eas build --profile development` lanzado antes de H1 (tarda ~20 min) |
| 0.3 | ESLint con `import/no-restricted-paths` para las reglas de dependencia entre módulos (README, sección 9.5)                                                                                                                                                                                                                                                                                                                                                                                                                                                            | A      | `npm run lint` falla si un módulo importa archivos internos de otro         |
| 0.4 | **Prueba técnica (spike) de SMS:** enviar con `SmsManager` y recibir con `BroadcastReceiver` + tarea *headless* en 2 teléfonos reales                                                                                                                                                                                                                                                                                                                                                                                                                       | D      | Si a H3 no funciona, se activa el plan B (sección 7)                          |
| 0.5 | `compartido/tema` (tokens de la sección 8 del README) y `compartido/ui`: `Boton`, `Tarjeta`, `Campo`, `ListaVacia`, `Insignia`, `AsistentePasos` (asistente de 3 pasos)                                                                                                                                                                                                                                                                                                                                                                                  | B      | Usado por todos desde H3                                                       |
| 0.6 | Paquete `compartido/`: `modelos/` (colecciones de la sección 5.4 del README), `esquemas/` base; esqueleto de `firestore.rules` (todo denegado, una sección por módulo); plantilla de función invocable con Zod; `cadaMinuto` con registro de tareas por módulo                                                                                                                                                                                                                                                                                             | C      | Todos crean sus funciones con la misma plantilla                               |
| 0.7 | `MapaBase` en `compartido/ui` (react-native-maps con estilo por tema y marcadores) y `simulaciones/` con datos falsos de cada colección para trabajar sin esperar a otros                                                                                                                                                                                                                                                                                                                                                                                          | E      | Mapas y mocks disponibles desde H3                                             |
| 0.8 | Revisar entre todos el protocolo SMS (README, sección 10.4) y el guion de la demo (sección 6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Todos  | Contrato congelado; los cambios después se avisan                             |
| 0.9 | Conseguir **5 teléfonos Android con chip y saldo de SMS**, uno con datos para hacer de intermediario                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Todos  | Lista en la sección 8                                                         |

## 4. Tareas por persona

Estimaciones en horas efectivas; cada persona tiene ~30 h de trabajo real en las 48 h. Las tareas marcadas **✂** son las primeras que se recortan si hay atraso.

### Persona A — Plataforma, cuentas e identidad

| #  | Tarea                                                                                                                                                                                                                                                                                                      | Carpeta                                             | RF                     | Horas | Fase   | Listo cuando…                                                                              |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------- | ----- | ------ | ------------------------------------------------------------------------------------------- |
| A1 | Monorepo, Firebase, EAS (perfiles `development` y `preview`), Hosting con `assetlinks.json`, ESLint de dependencias                                                                                                                                                                                  | raíz, `nucleo/firebase`                          | —                     | 4     | F0     | Los 5 teléfonos tienen el dev build                                                        |
| A2 | Registro e inicio de sesión: correo + clave, Google, enlace mágico (App Link), recuperar clave, teléfono obligatorio; `nucleo/sesion`                                                                                                                                                                 | `modulos/cuentas`                                 | RF01, RF02, RF04, RF07 | 5     | F1     | Crear cuenta y volver a entrar por los 3 métodos                                           |
| A3 | Completar perfil (P03) y perfil (P10): oficios, foto, permisos explicados (ubicación, notificaciones, SMS, pantalla completa, batería)                                                                                                                                                                   | `modulos/cuentas`                                 | RF05, RF06, RF08       | 3     | F1     | Perfil completo; permisos concedidos o con aviso                                            |
| A4 | Notificaciones base: token FCM por dispositivo, canales de Notifee (General, Emergencias), manejador en segundo plano que reparte por módulo y `notificar(uids, payload)` en funciones                                                                                                                  | `nucleo/notificaciones`, `functions/src/nucleo` | —                     | 2     | F1     | B, C, D y E envían notificaciones con una llamada                                          |
| A5 | Ubicación: `useUbicacionValidada()` (frescura ≤ 2 min, precisión ≤ 100 m, rechaza `mocked`, pin manual), última ubicación del usuario y la tarea en segundo plano que usa C                                                                                                                      | `nucleo/ubicacion`                                | RF42                   | 2     | F1     | Usado por favores, directorio, ayuda humanitaria y emergencia                               |
| A6 | **Bandeja de salida**: `enviarAccion(tipo, datos)` → con internet llama a la función; sin internet, si el tipo tiene codec SMS lo pasa al transporte de D; si no, lo guarda en cola. Sincroniza al volver la señal, deduplica por id de acción (RN-20) y muestra el aviso «Pendientes ({n})» | `nucleo/bandeja-salida`, `nucleo/red`           | RF41                   | 4     | F1–F2 | Una acción hecha en modo avión llega al volver la red; las acciones con SMS salen por SMS |
| A7 | Identidad (P19): DNI, nombres, foto del DNI y selfie con cámara; Storage privado; estados; *custom claim* `validador` y una pantalla oculta de validación; regla RN-18 en las funciones                                                                                                              | `modulos/identidad`                               | RF36                   | 3     | F2     | Un validador aprueba y aparece la insignia                                                  |
| A8 | Bienvenida: 4 pantallas de tutorial y guía de ayuda (P20) sin conexión, con lectura en voz alta                                                                                                                                                                                                          | `modulos/bienvenida`                              | RF37                   | 2     | F3     | La primera apertura muestra el tutorial                                                     |
| A9 | Builds `preview` en cada hito y el final; página de descarga del APK                                                                                                                                                                                                                                    | raíz, `hosting/`                                 | RNF14                  | 2     | Hitos  | APK instalado en todos los teléfonos                                                       |

**Total: ~27 h.** A desbloquea a todos en F0 y F1 (A1, A4, A5 y A6), así que su margen es para atender dudas.

### Persona B — Economía local + sistema visual

| #     | Tarea                                                                                                                                               | Carpeta                                | RF    | Horas | Fase   | Listo cuando…                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----- | ----- | ------ | --------------------------------------------------- |
| B1    | Tema y kit de UI con `AsistentePasos`                                                                                                             | `compartido/tema`, `compartido/ui` | —    | 3     | F0     | Usado por todos                                     |
| B2    | Publicar en el directorio (P14) en 3 pasos                                                                                                          | `modulos/directorio`                 | RF31  | 3     | F1     | Ficha creada con fotos y ubicación validada        |
| B3    | Directorio (P15): lista + mapa, búsqueda, filtros, orden por Visto Bueno y distancia, consulta sin conexión                                       | `modulos/directorio`                 | RF32  | 4     | F1     | Encontrar «gasfitero» cerca y abrir su ficha      |
| B4    | Ficha (P16): contactar por llamada o WhatsApp, Visto Bueno con comentario, contador por trigger, reglas de RN-17                                    | `modulos/directorio` + funciones     | RF33  | 3     | F1     | Dar y quitar un Visto Bueno; el orden cambia        |
| B5    | Bolsa de trabajos (P17, P18): publicar en 3 pasos, «Me interesa», lista de interesados, vencimiento a 7 días                                     | `modulos/trabajos` + funciones       | RF34  | 4     | F1–F2 | Publicar un trabajo y ver al interesado             |
| B6    | Temas por clima: `obtenerClima` con Open-Meteo y caché; prioridad emergencia > calor > lluvia > normal; menú oculto de demo para forzar el tema | `nucleo/clima`, `compartido/tema`  | RF29  | 3     | F2     | El tema cambia en vivo; se puede forzar en el pitch |
| B7    | Propuesta de Visto Bueno al calificar con ≥ 4 un servicio (expone `proponerVistoBueno()` en `directorio/index.ts` para C)                      | `modulos/directorio`                 | RF33  | 1     | F2     | Tras calificar, aparece la invitación              |
| B8    | Accesibilidad: etiquetas, tamaño de letra del sistema, contraste en los 4 temas                                                                    | `compartido/ui`                      | RNF03 | 2     | F3     | Revisión con TalkBack en el muro y la alerta       |
| B9 ✂ | Fichas de productos con fotos múltiples y horario de atención                                                                                     | `modulos/directorio`                 | RF31  | 2     | F3     | —                                                  |

**Total: ~25 h.** B tiene margen para ayudar a C o E con la UI en F3.

### Persona C — Economía solidaria (cadena de favores)

| #     | Tarea                                                                                                                                                                                                      | Carpeta                                           | RF                      | Horas | Fase | Listo cuando…                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------- | ----- | ---- | ---------------------------------------------------------------- |
| C1    | Paquete `compartido` (modelos y esquemas), reglas base, plantilla de funciones y `cadaMinuto` con registro de tareas                                                                                   | `compartido/src`, `functions/src/programadas` | —                      | 3     | F0   | Usado por todos                                                  |
| C2    | Muro (P04): necesidades y ofertas cercanas, primero las de mis oficios, filtro por tipo, tiempo real                                                                                                       | `modulos/favores`                               | RF09, RF35              | 4     | F1   | Una necesidad aceptada por otro desaparece en ≤ 5 s             |
| C3    | Publicar necesidad u oferta (P05) en 3 pasos con `publicarNecesidad` (RN-04)                                                                                                                             | `modulos/favores` + funciones                   | RF10, RF35              | 3     | F1   | Push a los vecinos del oficio                                    |
| C4    | Detalle (P06) y `aceptarNecesidad` en transacción con ETA de 5/10/15 min (RN-06, RN-07)                                                                                                                 | `modulos/favores` + funciones                   | RF11, RF12              | 3     | F1   | Dos teléfonos aceptan a la vez y solo uno gana                  |
| C5    | Servicio en curso (P07, P08): mapa, ubicación en vivo en segundo plano, «Ya llegué» / «Ya llegó», cronómetro y bloques de 30 min (`reglas.ts`), fin con doble confirmación, cancelar o desistir | `modulos/favores` + funciones                   | RF13–RF16, RF18, RN-09 | 5     | F1   | Flujo completo entre 2 teléfonos                                |
| C6    | Calificación (P09) y contadores de horas y promedio                                                                                                                                                       | `modulos/favores` + funciones                   | RF17, RN-08             | 1,5   | F1   | Horas y estrellas visibles en el perfil                          |
| C7    | Tareas de `favores` en `cadaMinuto`: expirar, avisar retrasos, cierre automático a 24 h                                                                                                               | `functions/src/modulos/favores`                 | RF19, RN-10             | 1,5   | F1   | Probado acelerando el tiempo en el emulador                      |
| C8    | **SMS:** codecs (`modulos/favores/sms/`) y manejadores (`functions/.../favores/sms.ts`) de `N`, `A`, `L`, `C`, `F` y `X`; avisos de bajada `NV` y `ES`                           | `modulos/favores/sms`                           | RF26–RF28              | 5     | F2   | Publicar, aceptar y cerrar un favor con el solicitante sin datos |
| C9 ✂ | Préstamos con fecha de devolución                                                                                                                                                                        | `modulos/favores`                               | RF35                    | 2     | F3   | —                                                               |

**Total: ~28 h.**

### Persona D — Emergencia + transporte SMS

| #  | Tarea                                                                                                                                                                                                                                                        | Carpeta                                    | RF           | Horas | Fase | Listo cuando…                                                   |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------ | ----- | ---- | ---------------------------------------------------------------- |
| D1 | Spike de `sms-nativo` en Kotlin (Expo Modules API): `enviar(numero, texto)`, receptor `SMS_RECEIVED` filtrado por `VEC1:`, tarea *headless*                                                                                                        | `modules/sms-nativo`                     | —           | 3     | F0   | SMS ida y vuelta entre 2 teléfonos                              |
| D2 | Botón de emergencia (mantener 2 s, vibración, confirmar), `registrarAlerta`, celdas H3, trigger de umbral RN-11 con usuarios activos, cambio de toda la app a modo emergencia                                                                            | `modulos/emergencia` + funciones         | RF20, RF21   | 4     | F1   | 3 teléfonos activan la emergencia                               |
| D3 | Alerta a pantalla completa (P12) con Notifee: push de datos de prioridad alta, *full-screen intent*, acciones «Estoy bien» / «Necesito ayuda»; `estoyBien`; tareas de emergencia en `cadaMinuto` (alerta cada minuto y cierre)                     | `modulos/emergencia` + funciones         | RF23–RF25   | 4     | F1   | Con el teléfono bloqueado se enciende la pantalla               |
| D4 | Protocolo en `compartido/src/sms`: AES-GCM (`@noble/ciphers`), Base64URL, encabezado, enteros en base36, **registro de tipos** (cada módulo registra los suyos), prueba de presupuesto de segmentos; generación y subida de la clave por usuario | `compartido/src/sms`                     | RN-16, RNF12 | 3     | F1   | Pruebas con datos de ejemplo en verde; C y E registran sus tipos |
| D5 | Transporte en la app: `transporteSms.enviar(tipo, datos)` usado por la bandeja de A; acuses `OK`, reintentos y elección del intermediario                                                                                                               | `modulos/contingencia-sms`               | RF26         | 3     | F2   | Una acción sin datos recibe su `OK`                           |
| D6 | `procesarSms`: descifrar, validar remitente (RN-19), anti-replay (RN-20), despachar al manejador del módulo y armar la cola de bajada                                                                                                                     | `functions/src/modulos/contingencia-sms` | RF27         | 3     | F2   | C y E solo registran su manejador                                |
| D7 | Modo intermediario: activación desde el perfil con código, registro en `intermediarios`, reenvío a `procesarSms`, envío de la cola de bajada, pantalla de estado                                                                                     | `modulos/contingencia-sms`               | RF27         | 3     | F2   | El intermediario procesa los SMS de 2 teléfonos                 |
| D8 | Recepción en el teléfono del vecino: descifrar, entregar al módulo dueño del tipo, notificación (`EA` y `AL` a pantalla completa), enlace de respaldo `/s#…` (P13)                                                                               | `modulos/contingencia-sms`               | RF28         | 2     | F2   | Un teléfono sin datos recibe la emergencia por SMS              |
| D9 | Tipos `E` y `K` por SMS (alerta y «Estoy bien» sin datos)                                                                                                                                                                                              | `modulos/emergencia/sms`                 | RF20, RF24   | 1     | F2   | Emergencia activada con un alertante sin datos                   |

**Total: ~26 h.** D tiene la mayor incertidumbre técnica (módulo nativo); por eso hace el spike primero y cedió el mapa de emergencia a E.

### Persona E — Ayuda humanitaria

| #  | Tarea                                                                                                                                                                                                          | Carpeta                                   | RF         | Horas | Fase   | Listo cuando…                                         |
| -- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------- | ----- | ------ | ------------------------------------------------------ |
| E1 | `MapaBase` y `simulaciones/` con datos falsos de todas las colecciones                                                                                                                                     | `compartido/ui`, `simulaciones/`      | —         | 3     | F0     | Todos pueden trabajar con mocks desde H3               |
| E2 | Mapa de emergencia (P11): vecinos `NECESITA_AYUDA` / `SIN_RESPONDER` en tiempo real, reportes y recursos superpuestos; expuesto en `ayuda-humanitaria/index.ts` para que D lo muestre en modo emergencia | `modulos/ayuda-humanitaria`             | RF22       | 3     | F1     | Todos los teléfonos de la zona ven el mapa en ≤ 10 s |
| E3 | Reporte de vulnerabilidad (P21): formulario rápido, ubicación validada, foto opcional, estados ABIERTO → EN_ATENCION → RESUELTO, «Voy a ayudar»                                                          | `modulos/ayuda-humanitaria` + funciones | RF38       | 3     | F1     | Reporte visible en el tablero en ≤ 5 s                |
| E4 | Recursos críticos: ofrezco / necesito, «Lo tengo» / «Voy a ayudar», aviso al autor                                                                                                                        | `modulos/ayuda-humanitaria` + funciones | RF39       | 3     | F1     | Asignar un recurso y avisar al autor                   |
| E5 | Tablero humanitario (P22): lista y mapa de reportes y recursos, filtros, destacado en modo emergencia                                                                                                          | `modulos/ayuda-humanitaria`             | RF39       | 2     | F1     | Pestaña Emergencia completa                           |
| E6 | Directorio de emergencia (P23): datos de la zona (números oficiales, centros de salud, grupos del barrio con enlace a WhatsApp), propuestas de vecinos, descarga completa para uso sin conexión              | `modulos/ayuda-humanitaria` + funciones | RF40       | 2     | F2     | Funciona en modo avión                                |
| E7 | **SMS:** codecs y manejadores de `V` y `R`; aviso de bajada `VR` a vecinos cercanos sin señal                                                                                                     | `modulos/ayuda-humanitaria/sms`         | RF38, RF39 | 3     | F2     | Un reporte enviado sin datos aparece en el tablero     |
| E8 | Datos de prueba `scripts/seed.ts`: 20 vecinos, fichas, Vistos Buenos, necesidades, trabajos, directorio de emergencia y usuarios activos en la celda de la demo                                              | `scripts/`                              | —         | 2     | F2     | `npm run seed` deja la demo lista                    |
| E9 | Pruebas de punta a punta del guion sin datos (coordinador del Hito 2)                                                                                                                                          | —                                        | —         | 3     | F2–F3 | Guion offline ensayado con 5 teléfonos                |

**Total: ~24 h.** E coordina las pruebas offline porque su módulo toca emergencia, mapa y SMS a la vez.

## 5. Dependencias entre personas

| Quien necesita | Qué                                                            | De quién       | Para cuándo |
| -------------- | --------------------------------------------------------------- | --------------- | ------------ |
| Todos          | Dev build con todas las dependencias nativas y carpetas creadas | A (0.2)         | H1           |
| Todos          | Tema, kit de UI y asistente de 3 pasos                          | B (B1)          | H3           |
| Todos          | Modelos, esquemas, reglas base y plantilla de funciones         | C (C1)          | H3           |
| Todos          | `MapaBase` y simulaciones                                     | E (E1)          | H3           |
| B, C, D, E     | `notificar()`, canales y `useUbicacionValidada()`           | A (A4, A5)      | H8           |
| D              | Mapa de emergencia exportado                                    | E (E2)          | H12          |
| C, E           | Protocolo SMS con registro de tipos                             | D (D4)          | H16          |
| C, D, E        | Bandeja de salida conectada al transporte SMS                   | A (A6) + D (D5) | H20          |
| C, E           | `procesarSms` con registro de manejadores                     | D (D6)          | H22          |
| C              | `proponerVistoBueno()`                                        | B (B7)          | H24          |
| Demo           | Datos de prueba                                                 | E (E8)          | H30          |

Si una dependencia se atrasa, el que la necesita trabaja con `simulaciones/` y la misma firma de la API pública (`index.ts`), y no se detiene.

## 6. Guion de la demo (≈ 7 min)

| #  | Escena                                                                                                                                                                      | Teléfonos | Dueño | RF                     |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ---------------------- |
| 1  | Instalar, tutorial, registrarse con Google, oficios, verificar identidad (un validador aprueba en vivo)                                                                     | T1         | A      | RF02, RF05, RF36, RF37 |
| 2  | Directorio: buscar «gasfitero», ver Vistos Buenos, contactar por WhatsApp, dar Visto Bueno                                                                                | T1         | B      | RF32, RF33             |
| 3  | Muro: T2 pide «préstamo de taladro»; T1 lo ve primero (coincide con su oficio), acepta con ETA de 10 min; T2 ve a T1 en el mapa                                          | T1, T2     | C      | RF09–RF13             |
| 4  | «Ya llegué» → «Ya llegó» → terminar → calificar → propuesta de Visto Bueno; horas sumadas al perfil                                                               | T1, T2     | C, B   | RF14–RF17, RF33       |
| 5  | Bolsa: publicar un trabajo en 3 pasos                                                                                                                                       | T3         | B      | RF34                   |
| 6  | Llueve: el tema cambia a azul noche (forzado desde el menú de demo)                                                                                                        | Todos      | B      | RF29                   |
| 7  | **Emergencia:** 3 vecinos pulsan el botón → toda la zona pasa a rojo y muestra el mapa → los teléfonos bloqueados muestran «¿Estás bien?» a pantalla completa | T1–T4     | D, E   | RF20–RF24             |
| 8  | **Sin internet:** T3 en modo avión con SMS activo reporta una persona herida → llega por SMS al intermediario T5 → aparece en el tablero de T1                     | T3, T5, T1 | E, D   | RF38, RF26, RF27       |
| 9  | **Sin internet:** T3 recibe por SMS la alerta y responde «Estoy bien» por SMS; desaparece del mapa                                                                  | T3, T5     | D      | RF28, RF24             |
| 10 | Recurso crítico: T1 ofrece agua, T2 la pide desde el tablero; el directorio de emergencia se abre sin conexión                                                            | T1, T2, T4 | E      | RF39, RF40             |

## 7. Riesgos y planes B

| Riesgo                                                            | Señal                               | Plan B                                                                                                                                                                                              | Dueño |
| ----------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| El módulo SMS nativo no funciona a tiempo                        | Spike falla a H3                     | Enviar con `expo-sms` (abre el compositor, el vecino pulsa enviar) y recibir con el enlace `/s#…` que la app descifra; el intermediario usa una app de pasarela de terceros con `webhookSms` | D      |
| Algunos teléfonos (Xiaomi, Huawei) matan la app en segundo plano | Prueba de H16                        | Pedir excluirla de la optimización de batería en P03; usar en la demo los teléfonos que funcionan                                                                                                | A, D   |
| Full-screen intent no se concede en Android 14                    | `canUseFullScreenIntent()` = falso | Llevar a ajustes desde P03; en el peor caso, notificación de prioridad máxima con sonido                                                                                                          | D      |
| Conflictos de merge en archivos compartidos                       | Merges rotos                         | Secciones por módulo en `firestore.rules` y `functions/src/index.ts`; merge pequeño y frecuente                                                                                               | Todos  |
| EAS Build en cola lenta (plan gratuito)                           | Build > 30 min                       | Agrupar los cambios nativos en F0; luego solo EAS Update; tener a mano un build local (`npx expo run:android`)                                                                                    | A      |
| Sin saldo de SMS o el operador bloquea SMS repetidos              | Fallos de envío                     | Recargar saldo antes de H16; espaciar los envíos de prueba; plan con SMS ilimitados en el intermediario                                                                                            | Todos  |
| La emergencia no se activa en la demo por el umbral               | Menos de 3 alertantes activos        | Datos de prueba con pocos usuarios activos en la celda de la demo (E8) y umbral configurable en `config/emergencia`                                                                               | D, E   |
| La API de clima no muestra lluvia el día de la demo              | —                                   | Forzar el tema desde el menú oculto de demo                                                                                                                                                        | B      |

## 8. Material y cuentas

| Recurso                                                                    | Responsable | Estado |
| -------------------------------------------------------------------------- | ----------- | ------ |
| Proyecto Firebase en plan Blaze con alerta de presupuesto                  | A           | ☐     |
| Cuenta de Expo (EAS) del equipo                                            | A           | ☐     |
| Clave de Google Maps SDK for Android restringida                           | A           | ☐     |
| 5 teléfonos Android con chip y saldo de SMS (marcas y versiones anotadas) | Todos       | ☐     |
| 1 teléfono intermediario con datos y SMS                                  | D           | ☐     |
| Repositorio en GitHub con `main` protegido                               | A           | ☐     |
| Datos del directorio de emergencia de la zona de la demo                   | E           | ☐     |

## 9. Reglas de trabajo

- **Carpetas:** cada persona trabaja dentro de sus módulos (sección 1). Para usar algo de otro módulo se importa solo su `index.ts`; si falta algo, se le pide al dueño que lo exponga.
- **Ramas:** cada persona usa `a/…`, `b/…`, `c/…`, `d/…` o `e/…`, con PR pequeños y merge a `main` al menos cada 4 horas. Nadie hace merge con el build o el lint rotos.
- **Sincronización:** reunión de 10 min al inicio de cada fase y en cada hito: qué terminé, qué sigue, qué me bloquea.
- **Terminado** significa:
  1. Funciona en un teléfono real (no solo en el emulador).
  2. Tiene sus reglas de Firestore.
  3. Si la funcionalidad tiene tipo SMS, funciona sin datos.
  4. Tiene su escena del guion ensayada.
- **Corte de alcance:** si a H24 una tarea ✂ no empezó, se descarta y se anota en la sección 12.2 del README.
- **Congelamiento a H40:** después solo se corrigen errores que rompen el guion.
