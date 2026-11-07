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
| GET | `/favores/publicaciones?estado=` | Muro (P04); el filtro por distancia lo hace la app |
| GET | `/favores/publicaciones/:id` | Una publicación |
| POST | `/favores/publicaciones` | `{ tipo, categoria, descripcion, oficioId?, lat?, lng? }`; RN-04: una necesidad activa |
| POST | `/favores/publicaciones/:id/aceptar` | «Yo te ayudo» → ACEPTADA |
| POST | `/favores/publicaciones/:id/cancelar` | Cancela la propia y libera RN-04 |
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
