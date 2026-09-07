# ObraERP — Auditoría del módulo Análisis de Precios (FASE A: diagnóstico)

**Fecha:** 2026-09-07
**Alcance:** solo lectura. No se modificó ningún dato ni archivo de producción en esta etapa.
**Archivo auditado:** `index.html` (aplicación única, ~13.230 líneas, ~1.04 MB)

Esta es la respuesta que pediste antes de tocar números: inspección completa, inventario, conteo, errores detectados con evidencia concreta, y propuesta de migración. Todavía no corregí ningún rendimiento ni consumo.

---

## 1. Arquitectura real (no hay "tablas" separadas — es un solo archivo)

ObraERP no tiene base de datos relacional para el catálogo maestro: es una aplicación de un solo archivo HTML/JS. Las "tablas" son arrays de JavaScript embebidos en el código, más un documento por obra en Firestore/localStorage. Esto es importante para las migraciones: no hay motor de SQL para hacer `ALTER TABLE`, cualquier migración es una transformación de estos arrays con un script.

| Estructura | Líneas aprox. | Qué es | Cantidad |
|---|---|---|---|
| `CP_CATALOGO` | 5626–6092 | Biblioteca maestra de ítems/tareas (rubro → APU) | 47 ítems |
| `CP_CATALOGO_EXTRA` | 6200–7603 | Ítems adicionales, se fusionan con `CP_CATALOGO` al cargar (`concat`) | 131 ítems |
| `CP_CATALOGO` (post-fusión, el que usa la app) | — | Biblioteca efectiva | **178 ítems** |
| `PR_DATA` | 10880–11666 | Listado de Precios (catálogo de insumos con `pu`, `medida`, `fuente`) | **794 filas** |
| `CP_PRECIOS_MAT` / `CP_PRECIOS_EXTRA` | 5527–6198 | Diccionarios internos de precio por id (no editables por vos, se sincronizan desde `PR_DATA`) | — |
| `SC_MAT_CATS` | 12239+ | Sistema alternativo "Sub-Cómputo" (paneles de pared por capas) | — |
| `CP_RUBROS` (por obra) | runtime | Copia de ítems de `CP_CATALOGO` dentro de cada obra concreta (Firestore/localStorage) | variable |
| `CP_RUBROS_USER` / `CP_CATALOGO_USER` | 7608+ | Ítems y rubros personalizados que vos mismo guardaste | variable |

**Aclaración importante para no confundir dos clasificaciones distintas:**
- El campo `cat` de `CP_CATALOGO` = **rubro de tarea** (ej. "MOVIMIENTO DE SUELO", "ESTRUCTURA HºAº"). Hay **35 rubros distintos** hoy.
- El campo `cat` de `PR_DATA` = **familia de insumo** (ej. "AGREGADOS", "FIJACIONES", "PERFILES HIERRO NEGRO"). Hay **36 familias distintas**, es un esquema totalmente aparte y no está mal que exista — cumple otro propósito (organizar el Listado de Precios).

No encontré una tabla de "cuadrillas", "equipos" ni "fuentes" como entidades propias — esos conceptos no existen todavía como estructura de datos. Hoy la mano de obra y el equipo viven **mezclados dentro del mismo array `mats[]`** de cada ítem, diferenciados solo por un flag `esEquipo:true/false`. Esto es la raíz de varios problemas que siguen abajo.

---

## 2. Conteo general

| Métrica | Valor |
|---|---|
| Rubros de tarea (`CP_CATALOGO.cat`) | 35 |
| Ítems/APU en la biblioteca maestra | 178 |
| Líneas de recurso en `mats[]` (materiales + equipos mezclados) | 776 |
| — de las cuales marcadas `esEquipo:true` | 115 |
| — de las cuales son materiales reales | 661 |
| Líneas de mano de obra (`mo[]`) | 274 |
| Filas en el Listado de Precios (`PR_DATA`) | 794 |
| Familias de insumo (`PR_DATA.cat`) | 36 |
| Filas de `PR_DATA` sin precio cargado (`pu = 0`) | 103 |

No hay ítems duplicados por código dentro de `CP_CATALOGO` (verifiqué que los 178 códigos son únicos — la fusión con `CP_CATALOGO_EXTRA` no genera duplicados, son conjuntos disjuntos que se suman).

---

## 3. Errores confirmados con evidencia (no supuestos — esto lo verifiqué corriendo el código real)

### 3.1 — Equipos cargados con unidad "hh" en vez de "h-eq" (CONFIRMADO, sistémico)

Este es exactamente el error que marcaste con el vibrador de inmersión, y **no es un caso aislado: aparece 115 veces** en toda la biblioteca. Cada vez que un ítem usa una retroexcavadora, un camión, un vibrador, una hormigonera, un compactador, etc., ese recurso vive dentro de `mats[]` con `un:'hh'` y el flag `esEquipo:true` — conceptualmente incorrecto según tu propia definición (Etapa 3), aunque el valor numérico pueda ser razonable.

Ejemplo real de la base (ítem `HA01B`, Bases de HºAº in situ):
```
{id:'3207', nom:'Vibrador de inmersion hp 8', un:'hh', rend:1, esEquipo:true}
{id:'3215', nom:'Hormigonera 130L (amortización)', un:'hh', rend:0.4, esEquipo:true}
```
Esto se repite en las 13 variantes de `ESTRUCTURA HºAº` (HA01 a HA07 y sus versiones "B"), en `MOVIMIENTO DE SUELO` (retroexcavadora, camión, vibrocompactador), en `TRABAJOS PRELIMINARES` (taladro, nivel láser), en demoliciones (volquetes), etc.

**No encontré el error inverso** (mano de obra cargada como si fuera equipo) — de las 274 líneas de `mo[]`, todas usan roles válidos (`of`, `ay`, `ofEsp`, `mo`) y el campo interno ya se llama `hh` consistentemente. Ese punto de la Etapa 6 ya está bien en el dato; lo que sí está mal es que en algunas pantallas la interfaz **muestra la palabra "hs"** en vez de "hh" al lado del número — es una etiqueta visual ambigua, no un error de dato, pero hay que corregirla para que no genere la misma confusión conceptual.

### 3.2 — Unidades escritas de forma inconsistente (mismo concepto, distinta cadena de texto)

Relevé todas las unidades usadas en `mats[]` y aparecen variantes de la misma unidad escritas distinto:

| Concepto | Variantes encontradas | Ocurrencias |
|---|---|---|
| Unidad suelta | `un` / `un.` / `u` | 102 / 8 / 1 |
| Litro | `lts` / `lt` | 55 / 22 |
| Metro lineal | `m` / `ml.` | 191 / 4 |

Esto no es solo estético: varias funciones de cálculo comparan la unidad con `===` contra strings exactos (por ejemplo, la lógica de desperdicio por defecto y el detector de "pack comercial" que armamos la semana pasada buscan literalmente `'m'` o `'ml'`). Una fila cargada como `'ml.'` con punto no cae en esas reglas y queda tratada como si no tuviera desperdicio ni pack — es un bug silencioso, no rompe la app pero sí el resultado.

### 3.3 — Ítems sin mano de obra

31 de los 178 ítems no tienen ninguna línea en `mo[]` (0%). La mayoría son de rubros de obra exterior (Cercos y Seguridad, Mobiliario Urbano, Iluminación Exterior, Pinturas y Señalización). Puede ser correcto en algunos casos (ítems que son solo un material con instalación tercerizada), pero hay que revisarlos uno por uno — hoy esos ítems calculan **costo directo sin mano de obra**, lo cual subestima el precio si en la práctica sí requieren instalación propia.

### 3.4 — Ítems ya auto-marcados como "verificar" por una sesión anterior

Encontré un patrón interesante: 4 ítems de `MOVIMIENTO DE SUELO` (`MS01`, `MS02`, `MS03`, `MS09`) tienen el sufijo `"(MO estándar — verificar)"` en su propio nombre, y sus recursos de equipo (`retro_excav`, `volquete_5m3`) están cargados con **rendimiento = 0** — es decir, ya estaban marcados como pendientes de completar, no es un dato nuevo que yo inventé. Hay más ítems con ese mismo sufijo de "verificar" en el nombre (ej. `HA07 Mampostería (MO estándar — verificar)`) que conviene tratar como la primera cola de trabajo de la Etapa 14 (`PENDIENTE DE VALIDACIÓN`).

### 3.5 — Acero: unidad correcta pero con precisión sospechosa

Buena noticia primero: **no encontré una incidencia de acero única "para todo HºAº"** como temías en la Etapa 10/22 — la base ya diferencia por elemento y diámetro real (zapatas con Ø10mm a 48,66 m/m³, columnas con Ø12mm a 112,64 m/m³, vigas con Ø12mm a 101,37 m/m³, losas con Ø8mm a 152,06 o 101,37 m/m³ según el ítem). Esto ya está técnicamente bien encaminado.

Lo que sí está mal, según tu propia Etapa 23 (falsa precisión): esos rendimientos se guardan en **metros con hasta 4 decimales** (`48.6588`, `112.6361`, `101.3725`, `152.0588`) — números que evidentemente salen de convertir un kg/m³ objetivo dividido por el peso lineal de la barra (ej. 30 kg/m³ ÷ 0,617 kg/m ≈ 48,6588 m/m³) y quedaron así, sin redondear. Según tu Etapa 11, el acero debería guardarse directamente en **kg**, no en metros con decimales heredados de una división — así el número real (30 kg/m³) queda visible y auditable, y el sistema deriva los metros de barra a partir del diámetro solamente para calcular cuántas barras comprar.

### 3.6 — Hormigón: la separación que pediste YA EXISTE (buena noticia)

Otra cosa que ya está bien encaminada, contrario a lo que se ve en muchas bases: cada elemento de HºAº tiene **dos variantes separadas** — por ejemplo `HA01` ("Bases de HºAº — hormigón elaborado", que consume `Hormigón elaborado H21 350kg` como material único) y `HA01B` ("Bases de HºAº — hormigón in situ c/hormigonera", que sí desglosa cemento + arena + ripio + hormigonera). Es exactamente la separación que pedís en la Etapa 9. No hay que reconstruir esto, solo formalizarlo con el nuevo modelo de `tipo_recurso`/`SUBANALISIS`.

### 3.7 — Encofrado: unidad de consumo en "Pie²" (pie tablar), no en m²

El encofrado de madera (`Madera Tabla Pino Norte`, `Tirante Pino Norte`) se carga en `Pie²` (pie tablar, unidad tradicional maderera argentina) con rendimientos de 6 a 40 Pie²/m³ según el elemento. Es una unidad de **compra de material** válida (así se vende la madera), pero no es la misma idea que pide la Etapa 12 ("analizar el encofrado por m² de superficie de contacto"). Estructuralmente hoy no existe un subanálisis de "Encofrado → m²" independiente; el consumo de madera está directamente adentro de cada ítem de hormigón. Habría que crear ese subanálisis aparte y hacer que los ítems de HºAº lo consuman por m² de encofrado de contacto, no por m³ de hormigón directamente — hoy estás perdiendo la relación real superficie/volumen del elemento.

### 3.8 — Nombres de rubro parecidos (para tu revisión manual, no fusioné nada)

Encontré estos pares/grupos que ameritan tu decisión (algunos pueden ser intencionales, no asumí nada):

| Grupo | Rubros existentes | Ítems en cada uno |
|---|---|---|
| Estructura metálica | `ESTRUCTURA METÁLICA` (3) / `ESTRUCTURAS METÁLICAS` (2) | singular vs. plural — casi seguro el mismo concepto partido en dos |
| Pintura | `PINTURAS` (6) / `PINTURAS Y SEÑALIZACIÓN` (3) | posible superposición parcial |
| Pisos/revestimientos | `PISOS Y REVESTIMIENTOS` (3) / `REVESTIMIENTOS` (1) / `MUROS Y REVESTIMIENTOS` (3) / `SOLADOS` (14) / `REVESTIMIENTO EXTERIOR` (2) | cinco rubros que tocan el mismo campo semántico, hay que definir el límite entre "solado" (piso) y "revestimiento" (pared) explícitamente |
| Tabiques | `TABIQUES` (2) / `TABIQUES LIVIANOS` (13) / `TABIQUES ESTRUCTURALES - (PGU Y PGC)` (2) | probablemente los 3 son válidos si "TABIQUES" (2) queda solo para mampostería, pero hay que confirmarlo ítem por ítem |
| Cielorraso | `CIELORRASO` (1) / `CIELORRASO LIVIANO` (3) | posible fusión, a confirmar |
| Sanitario | `INSTALACIONES SANITARIAS` (1) / `ARTEFACTOS SANITARIOS` (9) / `INSTALACIÓN SANITARIA CLOACAL/PLUVIAL` (1) | el primero tiene un solo ítem — sospecho que es un rubro "cajón" que sobrevivió de una versión vieja |

No fusioné nada, tal como pediste en la Etapa 1. Esto queda para que me confirmes rubro por rubro en la Fase B.

---

## 4. Lo que NO pude auditar en esta pasada (limitación honesta)

- **No tengo acceso a pliegos oficiales argentinos, APU de Vialidad Nacional, Vivienda, universidades, etc.** para contrastar cada rendimiento contra una fuente externa verificable (Etapas 14 y 15). Todo lo que reporté arriba lo detecté **por consistencia interna del propio código** (unidades, flags, duplicación de estructura, precisión numérica), no por comparación contra una fuente técnica externa. Para la Fase D ("revisar técnicamente APU por APU" contra fuentes) voy a necesitar que me digas qué fuentes preferís que use como referencia prioritaria (¿tenés pliegos de la Municipalidad de Ushuaia, del IPV de Tierra del Fuego, o algún APU provincial que ya uses?), porque inventar un rendimiento "razonable" sin fuente es exactamente lo que la Etapa 29 prohíbe.
- No recorrí los 178 ítems línea por línea a mano — hice un barrido automatizado (scripts sobre el código real, no estimaciones) que cubre los patrones más importantes que pediste (unidad de equipo, unidad de material, duplicados, ceros, ausencia de MO). Ítem por ítem en detalle es el trabajo de la Fase D.
- No audité `SC_MAT_CATS` (el sistema paralelo de "Sub-Cómputo" por capas de pared) con el mismo nivel de detalle — es una estructura distinta que también usa precios de `PR_DATA` pero con su propia lógica de espesores, y merece su propia pasada.

---

## 5. Migraciones propuestas (todavía no aplicadas)

Todas no destructivas: agregan campos nuevos, no reemplazan ni borran los actuales, así ningún cómputo ni presupuesto existente se rompe.

1. **`tipo_recurso`** (`MATERIAL` / `MANO_OBRA` / `EQUIPO` / `SUBANALISIS`) — se puede derivar automáticamente de los datos actuales sin ambigüedad: hoy `esEquipo:true` → `EQUIPO`, está en `mo[]` → `MANO_OBRA`, el resto de `mats[]` → `MATERIAL`. Cero riesgo, es una migración mecánica.
2. **Separar la unidad de "cantidad" de la unidad de "recurso"** para materiales: agregar `consumo_teorico`, `desperdicio_porcentaje`, `consumo_final` sin borrar `rend` (que hoy ya cumple el rol de `consumo_final` implícito) — mantener `rend` como alias de compatibilidad para no romper `cpCalcPreciso` y todo lo que ya lee ese campo.
3. **Renombrar la unidad de los 115 recursos de equipo** de `'hh'` a `'h-eq'` — mecánico y sin ambigüedad porque ya están marcados con `esEquipo:true`. Bajo riesgo, pero hay que revisar cada función que compara `un==='hh'` literalmente (hoy ninguna función de cálculo de precio distingue por texto de unidad para saber si es MO o equipo — usan el flag `esEquipo`, así que el cambio de etiqueta no debería romper cálculos, solo hay que verificarlo con las pruebas de la Etapa 31 antes de tocar nada).
4. **Normalizar unidades** (`un.`→`un`, `u`→`un`, `lts`→`lt`, `ml.`→`m`) — mecánico, bajo riesgo, pero hay que correrlo con cuidado porque el pack-parser que agregamos ayer para "Cantidad Comercial" depende de comparaciones exactas de unidad.
5. **Estructura de fuente** (`tipo_fuente`, `fuente`, `fecha`, `nivel_confianza`) por recurso — hoy `PR_DATA` ya tiene `fuente`/`fecha` a nivel de precio; falta el equivalente a nivel de rendimiento/consumo (que hoy no existe en absoluto en `mats[]`/`mo[]`). Es un campo nuevo, no reemplaza nada.
6. **Versionado de cambios** (`valor_anterior`, `valor_nuevo`, `fecha`, `motivo`, `fuente`, `usuario`) — hoy existe algo parecido para precios (`PR_HISTORIAL`, visible en el Listado de Precios), pero no existe para rendimientos/consumos de `mats[]`/`mo[]`. Hay que extender ese mismo mecanismo de historial a estos campos nuevos.
7. **Backup**: antes de tocar el archivo de producción en la Fase B, voy a generar una copia versionada (igual que hice ayer con `index_backup_before_partB.html`) y clonar el repo de GitHub a un directorio separado antes de cualquier commit, para poder revertir sin pérdida.

---

## 6. Qué voy a modificar en la Fase B (y qué NO)

**Sí voy a tocar (estructura, no números):**
- Agregar los campos nuevos descriptos arriba a cada recurso, sin cambiar ningún valor numérico existente.
- Corregir la unidad de los 115 recursos de equipo (`hh` → `h-eq`) — esto es una corrección de etiqueta/unidad, no de rendimiento: el número (ej. `rend:1` para el vibrador) queda intacto hasta que vos o una fuente confirmen si ese número está bien.
- Normalizar las unidades inconsistentes (`un.`, `u`, `lts`, `ml.`).
- Construir el motor de subanálisis, calculadora de cuadrilla y auditor automático como funciones nuevas — no reemplazan la forma de cálculo actual hasta que decidas migrar un ítem puntual a subanálisis.

**NO voy a tocar sin tu autorización explícita, ítem por ítem, y con fuente:**
- Ningún valor de `rend` (consumo o incidencia de mano de obra/equipo) existente.
- Ningún precio de `PR_DATA`.
- No voy a fusionar los rubros parecidos de la sección 3.8 sin que me confirmes cuáles son duplicados reales y cuáles no.

---

## 7. Riesgos de compatibilidad

- **Cómputos y presupuestos ya guardados** (por obra, en Firestore/localStorage) referencian ítems por `cod` y guardan una copia de `mats[]`/`mo[]` en el momento en que se agregaron al presupuesto (confirmé este patrón en sesiones anteriores). Cambiar la unidad de un recurso en la biblioteca maestra **no** va a alterar retroactivamente presupuestos ya cerrados — eso es bueno para no romper nada viejo, pero significa que una obra vieja puede quedar con la etiqueta `hh` en un equipo mientras la biblioteca ya dice `h-eq`. Hay que decidir si eso te preocupa o no (yo recomendaría dejarlo así: un presupuesto cerrado es una fotografía de un momento, no debería cambiar solo).
- El pack-parser de "Cantidad Comercial" que armamos ayer depende de comparaciones de unidad exactas (`m`, `ml`, `m²`, `kg`, `un`) — cualquier normalización de unidades tiene que revisarse contra esa función para no romperla.
- `cpCalcPreciso` y las funciones de renderizado (`cpRenderMats`, `cpVerResumen`, exportación a PDF/Excel) hoy asumen que `esEquipo` es la única señal de "esto es una máquina" — están débilmente acopladas al string de unidad, lo cual en realidad juega a favor: cambiar la etiqueta de unidad debería ser seguro. Igual lo voy a confirmar con pruebas antes de tocar nada, como pediste en la Etapa 31.

---

## 8. Próximo paso

Quedo esperando tu confirmación sobre tres cosas puntuales antes de arrancar la Fase B:

1. ¿Confirmás que puedo avanzar con las migraciones **estructurales** de la sección 6 (agregar campos, corregir unidad de equipo, normalizar unidades) sin tocar ningún número?
2. Para la Fase D (revisión técnica ítem por ítem contra fuente), ¿tenés algún pliego, APU oficial o base de costos de Tierra del Fuego/Ushuaia que quieras que use como referencia prioritaria? Si no, voy a marcar cada rendimiento sin fuente confirmada como `PENDIENTE DE VALIDACIÓN` en vez de inventar un valor.
3. Sobre los rubros parecidos de la sección 3.8: ¿los revisamos juntos uno por uno, o preferís que te arme una propuesta de fusión/separación para que la apruebes en bloque?
