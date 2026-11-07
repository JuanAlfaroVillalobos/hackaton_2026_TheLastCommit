---
name: implementar-pantalla
description: Implementa o actualiza una pantalla aprobada de Vecinos (P01–P23) a partir de su diseño en diseno/Pnn-Nombre/ y de las reglas del README raíz, de punta a punta dentro de su módulo: pantalla React Native (Expo Router) con los tokens de los 4 temas, servicios y hooks, Cloud Functions, reglas de Firestore, modelos y esquemas Zod compartidos, su tipo SMS, simulaciones, pruebas y documentación. Usar cuando el usuario pida implementar una pantalla, actualizar una funcionalidad «en base al diseño», completar las funciones o reglas que alimentan una pantalla, explicar qué documento crear en Firestore para que algo se vea, o alinear código, README y diseño después de una decisión; aunque no nombre la skill ni diga «Pnn».
---

# Implementar una pantalla aprobada de Vecinos

Una pantalla aprobada (`diseno/Pnn-Nombre/`, con sus frames y su sección «Decisión» en `prompt.md`) se lleva al código en todas las capas de su módulo. Al terminar, el diseño, el README raíz, los modelos compartidos, las funciones, las reglas, el protocolo SMS, las simulaciones y la pantalla deben decir lo mismo. Si una capa queda atrás, se descubre en la demo con dos teléfonos (por ejemplo: una tarjeta que nunca desaparece del muro porque la función no cambia el `estado`).

El diseño lo cubre la skill `diseno-stitch`. Esta skill empieza cuando la pantalla está aprobada. Si no hay diseño aprobado y el usuario igual quiere avanzar, implementar desde el README y los tokens, y avisar que habrá que revisarla contra el diseño.

## 1. Fuentes, en orden de autoridad

1. **El usuario.** Sus decisiones en el chat mandan. Cuando contradigan el README o el diseño, se aplican y se anotan en esos documentos con la fecha (sección 12.1 del README, o «Decisiones de flujo» del `prompt.md`).
2. **`README.md` raíz:** RF y fase (4; lo de Fase 2 no se implementa), criterios de aceptación con mensajes literales (4.7), RN (5), estados y transiciones (5.1, 5.2), etiquetas (5.3), modelo de Firestore (5.4), RNF (6), navegación (7), temas (8), stack (9), estructura y reglas de dependencia (9.5), protocolo SMS (10.4), secuencias (11) y decisiones (12).
3. **`PLAN.md`:** dueño de cada módulo (sección 1), tareas por persona (4), dependencias (5) y reglas de trabajo (9).
4. **`diseno/Pnn-Nombre/`:**
   - `README.md`: frames aprobados, estados y «Ajustes respecto al diseño».
   - `prompt.md`: «Decisión → Ajustes a resolver en la implementación», «Decisiones de flujo», «Mensajes de validación» y «Supuestos a validar».
   - Las capturas aprobadas `vN.M.png`. Abrirlas con Read: son la referencia visual, y los textos literales salen de ahí y de `prompt.md`.
5. **El código:** `app/` (app Expo), `functions/`, `compartido/`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`.

> **Ruta de la app:** la app vive en `app/` (el README, sección 9.5, todavía dice `movil/`; las rutas internas son las mismas). Si la carpeta no existe aún, pedir al usuario que haga pull antes de empezar. Dentro, las rutas de Expo Router están en `app/src/app/` y los módulos en `app/src/modulos/`.

## 2. Dueño y alcance

Antes de tocar código, ubicar la pantalla en la tabla de la sección 1 del PLAN:

| Persona | Módulos |
| --- | --- |
| A | `cuentas`, `identidad`, `bienvenida`, `nucleo/*` (salvo `clima`), `functions/src/nucleo`, `app.config.ts`, `eas.json`, Firebase, Hosting |
| B | `directorio`, `trabajos`, `compartido/ui`, `compartido/tema`, `nucleo/clima` |
| C | `favores`, `functions/src/programadas`, `compartido/src/modelos` y `esquemas` |
| D | `emergencia`, `contingencia-sms`, `modules/sms-nativo`, `compartido/src/sms` |
| E | `ayuda-humanitaria`, `simulaciones/`, `scripts/seed.ts` |

- La tarea abarca **el módulo de la pantalla de punta a punta**: `app/src/modulos/<modulo>/`, sus rutas en `app/src/app/`, `functions/src/modulos/<modulo>/`, su bloque en `firestore.rules` y `firestore.indexes.json`, y sus tipos SMS.
- **Si hace falta cambiar algo de otro dueño** (otro módulo, `nucleo/`, `compartido/ui` o `tema`, modelos y esquemas compartidos, `app.config.ts` o una dependencia nativa), **no editarlo**: dejar un adaptador temporal dentro del módulo o una simulación, y reportar el pedido exacto para el dueño («B: exponer `Insignia` con la variante `verificada` en `compartido/ui/index.ts`»). Si el usuario es el dueño o lo autoriza explícitamente, se edita.
- **Dependencias nativas y `app.config.ts`:** solo las toca A, porque cada cambio obliga a un build nuevo (PLAN, sección 1). Si la pantalla necesita una, avisarlo como bloqueo.
- **Archivos compartidos** (`firestore.rules`, `firestore.indexes.json`, `functions/src/index.ts`): editar solo el bloque marcado con el nombre del módulo y recordar al usuario avisar en el chat del equipo antes del merge.

## 3. Análisis de brechas antes de tocar código

Recorrer cada frame aprobado y listar cada dato que la pantalla muestra, cada acción y cada regla. Para cada uno, contestar:

- ¿El modelo de `compartido/src/modelos` (sección 5.4) lo tiene?
- ¿Una función lo escribe o lo valida (con su esquema Zod)? ¿La regla de Firestore deja leerlo a quien corresponde (RN-14) y niega lo demás?
- ¿Tiene camino sin internet: bandeja de salida (RF41) y, si es crítica, tipo SMS (10.4)?
- ¿La pantalla lo usa, en los 4 temas?

Así aparecen temprano los huecos típicos: campos que el modelo no tiene, funciones invocables que no existen, reglas sin implementar (RN-04, RN-06, RN-07, RN-18), índices compuestos que faltan, tipos SMS sin codec o pantallas destino de otro módulo que aún no existen.

Preguntar con AskUserQuestion, y solo entonces, cuando la brecha cambia el alcance, rompe algo existente o depende de otro dueño:

- **Bloqueo de otro módulo:** «simular y seguir» o «esperar al dueño». Recomendar simular con `app/src/simulaciones/` y dejar anotado el reemplazo.
- **Reglas que romperían pantallas o datos existentes** (un campo nuevo obligatorio que documentos viejos no tienen): recomendar «opcional por ahora, se valida si llega».

Lo demás, decidirlo con un valor razonable y reportarlo al final.

## 4. App (`app/`)

Antes de usar una API de Expo o React Native, leer la versión de `expo` en `app/package.json` y consultar la documentación de esa versión (`https://docs.expo.dev/versions/v<major>.0.0/` y `https://docs.expo.dev/llms.txt`), como pide `AGENTS.md` de la app. No confiar en la memoria: Expo cambia en cada SDK. Instalar paquetes con `npx expo install`, nunca con `npm install` directo, y solo si son de JavaScript puro (los nativos son de A).

- **Rutas (`src/app/`):** archivos de una línea que importan la pantalla del módulo y la exportan (sección 9.5, regla 1). Pestañas: `(privado)/(pestanas)/{inicio,servicios,favores,perfil}`; emergencia fuera de las pestañas, en `(privado)/emergencia/`; P12 en `(privado)/alerta.tsx`.
- **Estructura del módulo:** `index.ts` (API pública), `tipos.ts`, `reglas.ts` (reglas puras y testeables), `servicios/`, `hooks/`, `componentes/`, `pantallas/`, `sms/`, `__tests__/`. No crear carpetas vacías.
- **Dependencias (9.5):** un módulo importa de otro solo su `index.ts`; `nucleo/` y `compartido/` nunca importan de `modulos/`; las pantallas no llaman a Firestore: pasan por `servicios/`, y **toda escritura pasa por la bandeja de salida** (`nucleo/bandeja-salida`, `enviarAccion()`). `npx expo lint` falla si se rompe esto.
- **Cambios de estado:** siempre con una función invocable, nunca escribiendo `estado` desde el cliente (4.7, «Necesidades y servicio»).
- **Lecturas:** listeners `onSnapshot` de React Native Firebase dentro de hooks del módulo, con limpieza al desmontar. Persistencia offline activada (RNF09): la pantalla debe abrir con datos en caché y mostrar «Sin conexión».
- **Estilos y temas:** `StyleSheet` con los tokens de `useTema()` (`fondo`, `superficie`, `primario`, `primarioOscuro`, `sobrePrimario`, `acento`, `texto`, `textoSecundario`, `borde`), nunca colores fijos. Probar los 4 temas. `#FB923C` nunca como color de texto.
- **Componentes compartidos:** usar los de `compartido/ui` (`Boton`, `Tarjeta`, `Campo`, `ListaVacia`, `Insignia`, `MapaBase`, `AsistentePasos`) antes de crear uno propio. Si falta una variante, pedirla a B (sección 2).
- **Navegación (sección 7):** encabezado con casa + «Vecinos» + barrio y botón «SOS» a la derecha (RF20: mantener pulsado 2 s con `expo-haptics` y confirmar); 4 pestañas Inicio, Servicios, Favores, Perfil.
- **Formularios:** React Hook Form + el esquema Zod de `compartido/src/esquemas` (el mismo que valida la función), con los mensajes literales de la sección 4.7 o de «Mensajes de validación».
- **Formatos:** español de Perú con `date-fns` (locale `es`) y hora de Perú; distancias redondeadas a 100 m con coma decimal («1,2 km», «a 300 m»); horas de ayuda en bloques de 0,5 («1,5 h»); sin soles ni montos de dinero.
- **Estado de UI:** Zustand solo para estado de interfaz y tema; los datos vienen de Firestore.
- **Accesibilidad (RNF02, RNF03):** áreas táctiles ≥ 48 dp, `accessibilityLabel` en todos los botones e iconos con información, compatible con TalkBack, texto hasta 130 % sin cortes, zonas seguras respetadas. Un botón deshabilitado por una regla lleva el motivo visible y `accessibilityState={{ disabled: true }}`.
- **Pantallas destino de otro módulo que no existen:** dejar el botón deshabilitado («Próximamente») o enlazar a la pantalla más cercana que sí exista. Reportarlo como desviación.
- **Permisos (RNF05):** cada permiso con una pantalla previa que explica para qué sirve; la ubicación en segundo plano solo al aceptar el primer servicio (RF08, RF12).

## 5. Backend (`functions/`, reglas y paquete `compartido/`)

- **Funciones:** en `functions/src/modulos/<modulo>/`: `invocables.ts`, `disparadores.ts`, `programadas.ts` (se registran en `cadaMinuto`), `sms.ts` (manejador para `procesarSms`), `reglas.ts` y `__tests__/`. `functions/src/index.ts` solo exporta. Región `southamerica-east1`.
- **Entrada:** validar con el esquema Zod compartido; errores con `HttpsError` y el mensaje literal de la sección 4.7.
- **Transacciones:** los cambios de estado y los punteros `necesidadActivaId` / `servicioActivoId` en la misma transacción (RN-04, RN-06, RN-07). Idempotencia por id de acción, para que la misma acción por SMS y por internet se procese una vez (RN-20).
- **Auditoría (RNF13):** registrar en `auditoria` los cambios de estado, sin datos sensibles. Los logs nunca llevan tokens, ubicaciones exactas ni el contenido de los SMS (RNF05).
- **Reglas de Firestore y Storage:** todo negado por defecto; el cliente no escribe `estado` ni campos de servicio; la ubicación exacta en subcolecciones `privado` según RN-14. Cada colección nueva o campo nuevo va con su regla y su prueba.
- **Índices:** agregar a `firestore.indexes.json` los compuestos que pida la consulta (sección 5.4).
- **Modelos y esquemas compartidos:** un campo nuevo en un documento que ya existe puede faltar en datos viejos: tratarlo como opcional con valor por defecto y comentarlo.
- **SMS (sección 10.4):** si la acción de la pantalla tiene tipo, implementar su codec en `sms/` del módulo, su manejador en `functions/src/modulos/<modulo>/sms.ts` y el vector de prueba con su presupuesto de segmentos (emergencia en 1 segmento, el resto en ≤ 2). No cambiar el formato del protocolo sin avisar a D: es un contrato congelado (PLAN, tarea 0.8).

## 6. Simulaciones y datos de prueba

- `app/src/simulaciones/` (de E) permite trabajar sin depender de otro módulo. Si la pantalla cambia la forma de un documento, actualizar la simulación de ese módulo y avisar a E si toca otra.
- Para que algo se vea en el emulador o en la demo, dar el documento exacto a crear (colección, id y campos de la sección 5.4), o el bloque para `scripts/seed.ts`.

## 7. Documentación

Se actualiza en la misma tarea, no después:

- `README.md` raíz: si el usuario decidió algo distinto, el RF, la RN o el modelo afectado, con la fila en la sección 12.1; y la pregunta de la 12.2 que quede cerrada.
- `diseno/Pnn-Nombre/README.md` y `prompt.md`, si cambia un ajuste del diseño.
- No inventar etiquetas ni textos de UI que el README o el diseño no definen. Si hace falta uno, escribirlo de forma neutra y avisarlo.

## 8. Verificación

1. En `app/`: `npx tsc --noEmit` y `npx expo lint` (incluye las reglas de dependencia entre módulos).
2. Pruebas: `npx jest` en `app/` (reglas puras, codecs SMS, hooks con React Native Testing Library) y en `functions/` las pruebas con Firebase Emulator Suite (`firebase emulators:exec --only firestore,functions,auth "npm test"`), incluidas las de reglas con `@firebase/rules-unit-testing`. Una prueba por cada regla o transición nueva.
3. **En un teléfono o emulador Android** con el *development build* (no Expo Go): levantar `npx expo start --dev-client` en segundo plano y tomar capturas con [scripts/capturas.sh](scripts/capturas.sh), que abre cada ruta por enlace profundo y guarda la captura con `adb`. Abrirlas con Read y compararlas con `vN.M.png`: textos partidos, chips ocultos, colores del tema, zonas seguras. Revisar al menos el tema normal y uno oscuro (lluvia). Al terminar, detener el servidor.
4. Si el flujo es del guion de la demo (PLAN, sección 6), probar con dos sesiones (solicitante y prestador) que el cambio se ve en el otro dispositivo, y en modo avión que la acción queda en la bandeja o sale por SMS.
5. En la edición de archivos con scripts, cada reemplazo debe tener un ancla única. Después de un reemplazo masivo, revisar el resultado con grep.

Si algo no se pudo probar (sin teléfono conectado, sin emuladores de Firebase, sin chip para SMS), decirlo así, con lo que falta para probarlo.

## 9. Cierre

Reportar en español, breve:

- **Qué hace ahora la pantalla**, por frame, y qué cambió en cada capa.
- **Resultados:** tipos, lint, pruebas y capturas, con sus números.
- **Desviaciones y decisiones tomadas**, para que el usuario las confirme.
- **Pedidos a otros dueños** (sección 2), listos para pegar en el chat del equipo.
- **Datos que hay que crear en Firestore** para que algo se vea, con la ruta del documento y sus campos.
- **Lo que quedó pendiente** porque depende de otra pantalla, de un build nuevo o de otro módulo.

No hacer commit si el usuario no lo pide. Si lo pide, usar la rama de la persona (`a/…` a `e/…`, PLAN sección 9).

Al citar secciones del README, escribir «sección 5.1» o «#5.1». No usar el símbolo de sección.
