# Prompt de diseño — Pnn <Nombre>

Prompt para generar el diseño de la pantalla nn y sus hojas inferiores con Stitch. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame nn-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RFxx, RN-xx y secciones 4.7, 5.3, 7 y 8), `diseno/P04-Inicio/muro.png` (posiciones de la navegación) y los frames <Pxx, Pyy> como referencia de estilo. Módulo `modulos/<…>`, dueño Persona <A–E> (PLAN, sección 1).

_(Si hay referencia visual del usuario: [referencia-x.png](referencia-x.png); se toma … / no se sigue … por RN-xx.)_

---

## Contexto común (pegar en cada pasada)

```text
<copiar de .claude/skills/diseno-stitch/templates/contexto-comun.md, con pestaña, título y reglas propias>
```

---

## Frame nn-A — <vista principal>

```text
…
```

## Frame nn-B — <variante: otro actor, otro estado o sin conexión>

```text
…
```

## Frame nn-C — Hoja inferior: <acción>

```text
Sobre el frame nn-A atenuado, una hoja inferior (bottom sheet) blanca con radio superior 24px:
- …
- Botón primario naranja "…" y botón secundario "…".
```

## Frame nn-X — Estado vacío

```text
Mismo encabezado y navegación. En el centro, ilustración lineal sencilla …, el texto "…" y el botón secundario "…".
```

## Frame nn-Y — Tema emergencia (si aplica)

```text
Duplica el frame nn-A y cambia solo lo siguiente: <bloque del tema emergencia de contexto-comun.md>.
```

---

## Supuestos a validar

- …

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | nn-A | Contexto común + nn-A | — |

### Decisiones de flujo

_(Qué pasa antes y después de la pantalla, decisiones con el usuario y fecha. «Confirmada», «propuesta» o «adoptada sin objeción». Enlazar otras pantallas afectadas.)_

### Mensajes de validación (para la implementación)

_(Solo si hay formulario. Los literales salen de la sección 4.7 del README.)_

| Campo | Regla | Mensaje |
| --- | --- | --- |
| … | RFxx / RN-xx | "…" |

### Revisión de v1.1

**Lo que funciona:** …

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | … | nn-A | Alta / Media / Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame nn-A en Stitch; guardar como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. …
```

<!-- Al aprobar, agregar:

### Decisión

Se aprueba. Capturas finales: nn-A → v1.2, nn-B → v1.4, … Ajustes a resolver en la implementación (React Native + tokens de useTema()):

1. …

**Aprendizaje para las siguientes pantallas:** …
-->
