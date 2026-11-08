# API simulada de Vecinos

API REST en Express con datos en memoria. Sirve a la app mientras Firebase está desactivado. Cada colección se pasa después a **MongoDB** o a **Firestore** según convenga, sin tocar las rutas.

## Levantar

```bash
cd api-mock
npm install
npm run dev          # http://localhost:3000/api/v1, se recarga al guardar
```

La consola muestra la URL que usa el celular (`http://<ip-de-tu-compu>:3000/api/v1`) y la cuenta de prueba:

- **Correo:** `ana@vecinos.pe` · **Clave:** `vecinos123` (todas las cuentas sembradas usan esa clave)

Variables opcionales: `PORT` (por defecto 3000) y `RETRASO_MS` (latencia artificial para ver los estados de carga).

Los datos se reinician cada vez que se levanta el servidor.

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
| GET · POST | `/emergencia/alertas` | Botón SOS (RF20); sin `lat`/`lng` usa la ubicación del perfil |
| POST | `/emergencia/alertas/:id/cancelar` | Cancela una alerta propia |

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
    autenticacion.ts     tokens en memoria y middleware requiereSesion
    errores.ts           ErrorHttp y manejador
  datos/
    tipos.ts             formas de los documentos (copian movil/src/modulos/*/tipos.ts)
    semillas.ts          datos de arranque (copian movil/src/simulaciones/)
    almacen.ts           ← aquí se decide memoria, MongoDB o Firestore por colección
  modulos/<módulo>/rutas.ts
```

## Pasar una colección a MongoDB o Firestore

1. Escribe una clase que cumpla `Repositorio<T>` (`listar`, `obtener`, `crear`, `actualizar`, `eliminar`), por ejemplo `RepositorioMongo` con el driver `mongodb` o `RepositorioFirestore` con `firebase-admin`.
2. En `src/datos/almacen.ts`, cambia `new RepositorioMemoria(...)` por la clase nueva solo en esa colección.
3. Las rutas y la app no cambian.

Para la sesión con Firebase Auth, `requiereSesion` (en `nucleo/autenticacion.ts`) pasa a verificar el ID token con `firebase-admin` y deja el `uid` en `res.locals.uid`, igual que ahora.

Criterio sugerido: Firestore para lo que necesita tiempo real en la app (muro, alertas SOS, reportes de emergencia); MongoDB para catálogos y consultas más libres (directorio, historial).
