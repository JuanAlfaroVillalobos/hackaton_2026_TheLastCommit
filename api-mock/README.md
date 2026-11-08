# API simulada de Vecinos

API REST en Express. La app solo hace `fetch` (funciona en Expo Go, sin el SDK de Firebase) y la API guarda los datos. Las colecciones se migran a **Firestore** una por una con `firebase-admin`; las demás siguen **en memoria** con sus semillas.

| Colección | Dónde vive |
| --- | --- |
| `usuarios`, `alertas`, `celdas`, `emergencias` (+ `emergencias/{id}/vecinos`) | Firestore con `ALMACEN=firestore`; memoria si no |
| Todo lo demás, y las sesiones, el buzón de notificaciones y las fotos | Memoria (se reinicia al levantar el servidor) |

Al reiniciar la API las sesiones se pierden: hay que volver a ingresar en la app.

## Levantar

```bash
cd api-mock
npm install
cp .env.ejemplo .env # opcional: sin .env todo queda en memoria
npm run dev          # http://localhost:3000/api/v1, se recarga al guardar
```

### Guardar en Firestore

`.env.ejemplo` viene listo para el **emulador local** (recomendado: no toca el proyecto real ni pide credenciales). Necesita Java 11+ y `npm i -g firebase-tools`. Desde la raíz del repo:

```bash
firebase emulators:start --only firestore   # UI con los documentos en http://localhost:4000
# para conservar los datos al apagarlo: --import=./.emulador --export-on-exit
```

El emulador arranca vacío. Para cargar las cuentas de prueba (no pisa las que ya existen):

```bash
npm run sembrar                # crea ana@, rosa@, jorge@, carmen@ y luis@vecinos.pe (clave vecinos123)
npm run sembrar -- --activos   # además los deja «activos» en la zona de la demo durante 30 min (RN-11)
```

Para el **proyecto real** (`vecinos-thelastcommit`), comenta `FIRESTORE_EMULATOR_HOST` y define `GOOGLE_APPLICATION_CREDENTIALS=./credenciales/cuenta-servicio.json` (Consola de Firebase → Configuración del proyecto → Cuentas de servicio → *Generar nueva clave privada*; git ignora `credenciales/`, **no la compartas por chat**). También sirve `gcloud auth application-default login`.

Al arrancar, la consola indica a dónde va cada colección. `firebase-admin` ignora `firestore.rules`: la API es la única que escribe.

La consola muestra la URL que usa el celular (`http://<ip-de-tu-compu>:3000/api/v1`) y la cuenta de prueba:

- **Correo:** `ana@vecinos.pe` · **Clave:** `vecinos123` (todas las cuentas sembradas usan esa clave)

Variables (ver `.env.ejemplo`): `ALMACEN`, `FIREBASE_PROJECT_ID`, `FIRESTORE_EMULATOR_HOST`, `GOOGLE_APPLICATION_CREDENTIALS`, `FCM_CUENTA_SERVICIO`, `PORT` (por defecto 3000), `RETRASO_MS` (latencia artificial para ver los estados de carga) y las del modo emergencia (`EMERGENCIA_*`, ver abajo).

Lo que está en memoria se reinicia cada vez que se levanta el servidor.

## Conectar la app

La app arma la URL sola con la IP de la computadora que corre Metro (`movil/src/nucleo/api/cliente.ts`). Si no llega (otra red, emulador, túnel), fíjala al levantar Metro:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1 npx expo start
```

El celular y la computadora deben estar en la misma red Wi-Fi.

### Probar Favores en Expo Web

Abre dos terminales desde la raíz del repositorio. En la primera:

```powershell
Set-Location .\api-mock
npm install
npm run dev
```

En la segunda, para probar en el navegador de la misma computadora:

```powershell
Set-Location .\movil
$env:EXPO_PUBLIC_FAVORES_BACKEND = "mock"
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000/api/v1"
npx expo start --web
```

Si pruebas en un celular físico, cambia `localhost` por la IPv4 de la computadora que muestra la consola de la API. El celular y la computadora deben estar en la misma red. La API y las sesiones son en memoria: reiniciar el servidor restablece los datos.

Usa `ana@vecinos.pe` y `rosa@vecinos.pe` con la clave `vecinos123` para probar el flujo con dos cuentas. Las cuentas de demostración tienen identidad `PENDIENTE`, suficiente para aceptar favores según RN-18; esto no equivale a una verificación real.

### Cambio futuro a Firebase

El proveedor `mock` es el único operativo. `EXPO_PUBLIC_FAVORES_BACKEND=mock` es también el valor predeterminado. Cambiarlo a `firebase` **no conecta Firebase**: la app muestra un error explícito hasta coordinar con la persona A la autenticación Firebase, el contrato de Cloud Functions, las reglas e índices de Firestore y el proveedor Firebase del módulo. No se debe enviar el UID de una sesión mock a Functions ni abrir datos con reglas públicas. Cuando esa integración esté lista, se implementará y probará el proveedor antes de cambiar esta variable.

### Alcance del mock

Las actualizaciones del muro, el detalle y los avisos se consultan por sondeo mientras la app está abierta. La ubicación del prestador se comparte en primer plano cada 10 s o 50 m durante `ACEPTADA` / `EN_SITIO`; el seguimiento en segundo plano y las notificaciones push reales aún requieren la integración nativa. En Web el mapa es un marcador de disponibilidad y se muestran las coordenadas; el mapa interactivo es Android.

## Endpoints

Todas las rutas van bajo `/api/v1` y, salvo `auth/registro` y `auth/ingresar`, piden `Authorization: Bearer <token>`. Los errores responden `{ "error": "CODIGO", "mensaje": "…" }`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/salud` (fuera de `/api/v1`) | Verifica que la API está arriba |
| POST | `/auth/registro` | `{ correo, clave, nombre, barrio? }` → `{ token, usuario }` |
| POST | `/auth/ingresar` | `{ correo, clave }` → `{ token, usuario }` |
| GET | `/auth/yo` | Usuario de la sesión |
| POST | `/auth/salir` | Cierra la sesión |
| GET · PATCH | `/vecinos/yo` | Perfil; el PATCH acepta `nombre`, `barrio` y `oficios` |
| GET | `/favores/publicaciones?estado=` | Muro (P04); filtra distancia, vigencia y oficio en la app |
| GET | `/favores/mis-publicaciones` | Publicaciones propias y favores en que participas |
| GET | `/favores/publicaciones/:id` | Detalle, perfiles públicos y ubicación privada solo para participantes autorizados |
| POST | `/favores/publicaciones` | `{ tipo, categoria, descripcion, oficioId, lat, lng, devolucionEn? }`; límite RN-04 |
| POST | `/favores/publicaciones/:id/aceptar` | `{ etaMinutos: 5\|10\|15 }` → ACEPTADA |
| POST | `/favores/publicaciones/:id/llegada` | El prestador indica que llegó |
| POST | `/favores/publicaciones/:id/confirmar-llegada` | El solicitante inicia el servicio |
| POST | `/favores/publicaciones/:id/aun-no-llega` | El solicitante rechaza la llegada |
| POST | `/favores/publicaciones/:id/solicitar-fin` | Cualquiera de los participantes solicita el cierre |
| POST | `/favores/publicaciones/:id/rechazar-fin` · `/confirmar-fin` | Rechazo o confirmación del cierre |
| POST | `/favores/publicaciones/:id/cancelar` · `/desistir` | Cancela la publicación o desiste antes de la llegada |
| POST | `/favores/publicaciones/:id/registrar-devolucion` | Registra la devolución de un préstamo |
| POST | `/favores/publicaciones/:id/ubicacion-prestador` | Comparte ubicación en ruta, solo con el solicitante y antes de iniciar el servicio |
| POST | `/favores/publicaciones/:id/calificar` | `{ estrellas: 1..5 }`; una calificación por participante |
| GET | `/favores/notificaciones` | Avisos de favores de la sesión |
| PATCH | `/favores/notificaciones/:id/leida` | Marca un aviso como leído |
| GET · POST | `/directorio` | Economía local (`?tipo=oficio\|servicio\|comercio`) |
| GET | `/directorio/:id` | Un servicio |
| POST | `/directorio/:id/visto-bueno` | Suma un visto bueno |
| GET | `/ayuda-humanitaria/zona` | Centro de la zona de la demo |
| GET | `/ayuda-humanitaria/vecinos?todos=` | Vecinos que necesitan atención |
| GET · POST | `/ayuda-humanitaria/reportes` | Reportes de vulnerabilidad |
| POST | `/ayuda-humanitaria/reportes/:id/atender` | ABIERTO → EN_ATENCION |
| POST | `/ayuda-humanitaria/reportes/:id/resolver` | EN_ATENCION → RESUELTO (solo quien atiende) |
| GET · POST | `/ayuda-humanitaria/recursos` | Recursos críticos (`?modo=OFREZCO\|NECESITO`) |
| POST | `/ayuda-humanitaria/recursos/:id/asignar` | ABIERTO → ASIGNADO |
| GET | `/ayuda-humanitaria/fichas?todas=` | Contactos de emergencia aprobados |
| GET | `/emergencia/alertas?estado=` | Alertas SOS, de la más reciente a la más antigua |
| POST | `/emergencia/alertas` | Botón SOS (RF20): `{ lat?, lng?, canal? }`; sin ubicación usa la del perfil. Calcula la celda H3 y recalcula su conteo. **201** si es nueva; **200** con la misma alerta si el vecino ya tenía una ACTIVA en esa celda en los últimos 10 min (RN-12) |
| POST | `/emergencia/alertas/:id/cancelar` | Cancela una alerta propia y deja de contarla |
| GET | `/emergencia/celda?lat=&lng=` | Conteo de la celda (`alertantes`, `alertas` en 10 min); sin ubicación usa la del perfil |
| GET | `/emergencia/actual` | `{ emergencia, yo }`: emergencia activa del vecino (o `null`) y su estado en ella |
| POST | `/emergencia/presencia` | Al abrir la app: `{ lat?, lng? }` actualiza su ubicación y, si su zona está en emergencia, lo suma como `SIN_RESPONDER`. Responde como `/actual` |
| POST | `/emergencia/respuesta` | RF24: `{ estado: 'A_SALVO' \| 'NECESITA_AYUDA' }`. Puede cerrar la emergencia (RF25) |
| GET | `/emergencia/vecinos` | P11 (RF22): vecinos `NECESITA_AYUDA` o `SIN_RESPONDER` de la emergencia del vecino; vacío fuera de una (RN-14) |

### Botón SOS en Firestore

- `alertas/{id}`: `autorId`, `autorNombre`, `lat`, `lng`, `celdaH3` (resolución 8), `estado` (`ACTIVA` · `ATENDIDA` · `CANCELADA`), `canal` (`APP` · `SMS`), `creadoEn` (ms).
- `celdas/{celdaH3}`: `alertantes` (vecinos distintos), `alertas`, `ventanaDesde`, `ultimaAlertaEn`, `actualizadoEn`. Se **recalcula entera** en cada alerta o cancelación (`src/modulos/emergencia/conteo.ts`), así que repetir el cálculo nunca la descuadra.
- RN-12 es atómico: la búsqueda de la alerta previa y la creación van en una transacción (`crearSiNoExiste`), así que pulsaciones simultáneas crean una sola alerta.

### Modo emergencia (RF21–RF25)

La lógica está en `src/modulos/emergencia/zona.ts`; las rutas solo la llaman. Con Cloud Functions, `procesarAlerta()` pasa a un trigger de `alertas` y `tareaEmergencia()` a `cadaMinuto`.

1. **Activación (RF21, RN-11):** tras cada alerta se cuentan los alertantes distintos de la celda (10 min) y los **vecinos activos** (`usuarios` con `celdaH3` igual y `ubicacionEn` de hace menos de 30 min; quien alertó cuenta como activo). Si son al menos `EMERGENCIA_MINIMO` y **más** del `EMERGENCIA_PORCENTAJE` %, se crea `emergencias/{id}` sobre la celda y sus 6 vecinas (atómico: una sola por celda). Cada vecino de la zona entra en `emergencias/{id}/vecinos/{uid}`: `NECESITA_AYUDA` si alertó, `SIN_RESPONDER` si no. Si la celda ya está en una emergencia, la alerta se suma a ella.
2. **Avisos** con `notificar()` (FCM + buzón): `alerta` («¿Estás bien?», canal emergencias, pantalla completa), `mapa` (silencioso, para refrescar P11) y `finalizada`.
3. **Cada `EMERGENCIA_INTERVALO_S` (RF23):** se reenvía `alerta` a quienes no están `A_SALVO`.
4. **Respuesta (RF24):** `A_SALVO` o `NECESITA_AYUDA`. Pulsar SOS dentro de la zona vuelve a `NECESITA_AYUDA`; cancelar la alerta deja `A_SALVO`. Quien abre la app en la zona entra como `SIN_RESPONDER` (`/presencia`).
5. **Cierre (RF25):** cuando todos están `A_SALVO`, o tras `EMERGENCIA_CIERRE_MIN` sin alertas y sin nadie `NECESITA_AYUDA`.

| Variable | Por defecto | Para probar |
| --- | --- | --- |
| `EMERGENCIA_MINIMO` | 3 alertantes | `1` para activarla con un solo teléfono |
| `EMERGENCIA_PORCENTAJE` | 50 (debe superarse) | `0` para ignorar el porcentaje |
| `EMERGENCIA_INTERVALO_S` | 60 s | `10` para ver los reenvíos rápido |
| `EMERGENCIA_CIERRE_MIN` | 30 min | `1` para ver el cierre por inactividad |

Demo con las cuentas de prueba: `npm run sembrar -- --activos` deja 5 vecinos activos; con 3 SOS (ana, rosa, jorge) se supera el 50 % y la zona entra en emergencia.

- `emergencias/{id}`: `celdaCentro`, `centro`, `celdas[]`, `estado` (`ACTIVA` · `FINALIZADA`), `activadaEn`, `ultimaAlertaEn`, `finalizadaEn`, `motivoFin`.
- `emergencias/{id}/vecinos/{uid}`: `nombre`, `estado` (`SIN_RESPONDER` · `NECESITA_AYUDA` · `A_SALVO`), `lat`, `lng`, `ultimaAlertaEn`, `respondidoEn`, `creadoEn`.

Prueba rápida:

```bash
TOKEN=$(curl -s localhost:3000/api/v1/auth/ingresar -H 'Content-Type: application/json' \
  -d '{"correo":"ana@vecinos.pe","clave":"vecinos123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -s localhost:3000/api/v1/favores/publicaciones -H "Authorization: Bearer $TOKEN"
```

## Estructura

```text
src/
  servidor.ts            arranque y puerto
  app.ts                 middlewares y montaje de /api/v1
  nucleo/
    repositorio.ts       interfaz Repositorio<T> + RepositorioMemoria
    repositorioFirestore.ts  Repositorio<T> sobre una colección de Firestore
    firebase.ts          firebase-admin (proyecto, emulador, credenciales)
    autenticacion.ts     tokens en memoria y middleware requiereSesion
    errores.ts           ErrorHttp y manejador
  scripts/sembrar.ts     carga las cuentas de prueba en Firestore (npm run sembrar)
  datos/
    tipos.ts             formas de los documentos (copian movil/src/modulos/*/tipos.ts)
    semillas.ts          datos de arranque (copian movil/src/simulaciones/)
    almacen.ts           ← aquí se decide memoria o Firestore por colección
  modulos/<módulo>/rutas.ts
  modulos/emergencia/    conteo.ts (celdas), zona.ts (RF21–RF25), config.ts (EMERGENCIA_*)
```

## Pasar otra colección a Firestore

1. En `src/datos/almacen.ts`, cambia `new RepositorioMemoria(semillas.x)` por `persistente('nombre', semillas.x)`.
2. `Repositorio<T>` solo filtra por igualdad, para que Firestore no pida índices compuestos; los rangos (fechas, distancias) se filtran en la ruta.
3. Si una regla exige «solo uno a la vez» (RN-04, RN-12), usa `crearSiNoExiste(datos, filtro, vigente)` en vez de `listar` + `crear`.
4. Las rutas y la app no cambian.

Con el emulador, las semillas no se cargan en Firestore: la colección empieza vacía.

Para la sesión con Firebase Auth, `requiereSesion` (en `nucleo/autenticacion.ts`) pasa a verificar el ID token con `firebase-admin` y deja el `uid` en `res.locals.uid`, igual que ahora.
