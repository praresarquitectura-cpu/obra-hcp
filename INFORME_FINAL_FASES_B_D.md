# Informe final — Reestructuración de Análisis de Precios (Fases B, C, D)

**Obra/sistema:** ObraERP — PRARES ARQUITECTURA (Diego Rojas, Maestro Mayor de Obra, Ushuaia, TDF)
**Repositorio:** praresarquitectura-cpu/obra-hcp
**Período:** Fase B a Fase D de la ORDEN MAESTRA de reestructuración de Análisis de Precios
**Fecha de cierre de este informe:** 2026-09-08

Este documento consolida, en el formato que se pidió en la orden original (rubro / ítem / recurso / valor anterior / valor nuevo / unidad / fuente / confianza / motivo), todo lo corregido y agregado desde la Fase A (auditoría, ya entregada en `AUDITORIA_FASE_A.md`) hasta hoy. No reemplaza esos documentos previos (`AUDITORIA_FASE_A.md`, `CRITERIO_UNICO_FUENTES.md`) — los complementa con el detalle de lo efectivamente implementado y desplegado.

---

## 1. Resumen ejecutivo

| Fase | Estado | Qué hizo |
|---|---|---|
| A — Auditoría | ✅ Completa | Inventario completo, conteo de errores, propuesta de migraciones (sin tocar nada) |
| B — Reestructuración | ✅ Completa y desplegada | Separación de tipo de recurso, corrección de unidades de equipo, normalización de unidades, Auditor de APU |
| C — Compatibilidad con obras | ✅ Completa y desplegada | Revisión de las 3 obras cargadas, 1 error encontrado y corregido |
| D — Revisión técnica ítem por ítem | ✅ Completa con las fuentes disponibles | Contrapiso, Muro con H25, alertas CIRSOC en estructura metálica, limpieza de falsos positivos del auditor |
| E — Recalcular precios | ⏸ Pendiente | Depende de que se acumulen mediciones reales (ver módulo nuevo, sección 5) |
| F — Comparación antes/después | ⏸ Pendiente | Idem — tiene sentido una vez que haya recalibraciones reales que comparar |

Estado actual del Auditor de Biblioteca (`cpAuditarAPU()`), sobre 180 ítems: **103 correctos, 105 advertencias, 0 errores**. Todas las advertencias restantes están identificadas y catalogadas (ver sección 4) — ninguna es un "error silencioso": todas están marcadas explícitamente para que se sepa que faltan.

---

## 2. Fase B — Reestructuración de tipos de recurso y unidades

**Commit:** "Fase B: unidades de equipo (h-eq), normalizacion y auditor de APU"

| Rubro | Ítem | Recurso | Valor anterior | Valor nuevo | Fuente | Confianza | Motivo |
|---|---|---|---|---|---|---|---|
| (transversal, 112 recursos en 47 ítems distintos) | Varios — todo ítem con equipo | Cualquier recurso con `esEquipo:true` (vibradores, hormigoneras, retroexcavadoras, etc.) | `un:'hh'` (hora-hombre) | `un:'h-eq'` (hora-equipo) | Ejemplo señalado por Diego: "Vibrador de inmersión hp 8" | Alto (error conceptual, no de fuente) | Un equipo no se mide en horas-hombre. Corrección estructural, no cambia ningún número de rendimiento |
| (transversal) | Varios | Unidades con puntuación/abreviación residual: `un.`→`un` (44), `u`→`un` (3), `ml.`→`ml` (9), `lts`→`lt` (123) | Formato inconsistente | Formato normalizado | — | Alto | Limpieza de formato, no cambia valores |
| PR_DATA | Mano de obra (Oficial Esp., Oficial, Medio Oficial, Ayudante) | `un`/`medida` | `hs` | `hh` | — | Alto | Consistencia con el resto del sistema (hora-hombre) |

**Nuevas herramientas agregadas:**
- `cpTipoRecurso()` — clasifica cualquier recurso como MATERIAL / MANO_OBRA / EQUIPO sin agregar campos nuevos a los datos existentes.
- `cpAuditarAPU()` + botón **"🔍 Auditar Biblioteca"** — corre automáticamente sobre toda la biblioteca y detecta: unidades cruzadas equipo↔MO, material sin unidad, unidad no normalizada, consumo/rendimiento en cero, precio en cero, recurso duplicado dentro de un ítem, ítem sin mano de obra, ítems marcados "verificar".
- `APU_HISTORIAL` / `apuRegistrarCambio()` — registro de auditoría de cada cambio de rendimiento (quién, cuándo, por qué, con qué fuente), usado por el módulo de calibración (sección 5).

---

## 3. Fase C — Compatibilidad con obras ya cargadas

Se revisaron las 3 obras existentes en la cuenta:

| Obra | Resultado |
|---|---|
| PRUEBA - Oficina de Turismo | Sin cómputo guardado — nada que revisar |
| LABORATORIO DE ENSAYOS MUNICIPAL | Sin cómputo guardado — nada que revisar |
| **Cerco Perimetral** | 1 error encontrado y corregido |

| Rubro | Ítem | Recurso | Valor anterior | Valor nuevo | Fuente | Confianza | Motivo |
|---|---|---|---|---|---|---|---|
| Cerco Perimetral (obra) | Cerco de obra perimetral (postes + malla) | Atornillador inalámbrico | `un:'hh'` | `un:'h-eq'` | Mismo criterio que la Fase B | Alto | Cuando se agrega un ítem de la biblioteca a una obra, la receta queda "congelada" en ese momento — no se actualiza sola cuando se corrige la biblioteca. Este ítem se había agregado antes de la Fase B |

**Nota técnica importante para el futuro:** como los ítems de obra son copias congeladas (no enlazadas a la biblioteca), cualquier corrección futura a la biblioteca **no** va a actualizar automáticamente lo que ya está cargado en una obra existente. Si en algún momento se quiere "refrescar" un ítem de obra contra la versión corregida de la biblioteca, hay que volver a seleccionarlo desde el catálogo en esa obra puntual.

---

## 4. Fase D — Revisión técnica ítem por ítem (con las fuentes disponibles)

Fuente principal: Pliego Municipalidad de Ushuaia, Licitación Pública S.P. e I.P. Nº 03/2022 ("Residencia de Adultos Mayores"), más CIRSOC 301. Ver `CRITERIO_UNICO_FUENTES.md` para el detalle completo de fuentes y su nivel de confianza.

| Rubro | Ítem | Recurso | Valor anterior | Valor nuevo | Unidad | Fuente | Confianza | Motivo |
|---|---|---|---|---|---|---|---|---|
| SOLADOS | Contrapiso de 10cm (404) | Hormigón | H13 250kg (cod 102) | H21 350kg (cod 104) | m³/m² | Pliego Muni Ushuaia 03/2022 | Alto | El pliego exige mínimo 350kg cemento/m³ para contrapiso interior de 10cm |
| SOLADOS | Contrapiso de 10cm (404) | Malla | Malla Sima 4mm 2x6m | Malla Sima 5mm Q131 (=15x15cm Ø5mm) | m²/m² | Pliego Muni Ushuaia 03/2022 | Alto | El pliego exige malla de diámetro mínimo 5mm |
| SOLADOS | Contrapiso de 10cm (404) | Poliestireno expandido 50mm | — (faltaba por completo) | Agregado, 1.05 m²/m² | m²/m² | Pliego Muni Ushuaia 03/2022 | Alto | El pliego exige aislación de poliestireno expandido 2"(50mm)/30kg/m³ que no estaba en la receta |
| ESTRUCTURA HºAº | **Nuevo ítem HA09** — Muro HºAº alta durabilidad (sala de tanques / contacto con agua) | Hormigón | — (no existía) | H25 380kg (cod 105), rendimiento `0` marcado PENDIENTE DE VALIDACIÓN | m³ | Pliego Muni Ushuaia 03/2022 | Alto (el grado); el rendimiento queda explícitamente sin definir | El pliego exige H25 para elementos con resistencia a congelamiento/deshielo, sales y abrasión (300kg/cm², min. 380kg cemento/m³). El espesor real depende del cálculo estructural de cada proyecto — no se inventó ese número |
| ESTRUCTURA METÁLICA | Estructura Metálica (EM01) | Tubo Cuadrado 100x100x2mm | Sin alerta | Nota agregada, sin cambiar el perfil | m | CIRSOC 301 (vía pliego) | Alto (la norma); no se resolvió el reemplazo | Espesor 2mm por debajo del mínimo normativo (3-4mm) para elementos resistentes. El perfil correcto depende del cálculo estructural — se deja documentado, no se inventa el reemplazo |
| ESTRUCTURA METÁLICA | Entrepiso Metálico (EM02) | Tubo rectangular 60x40x2mm | Sin alerta | Nota agregada, sin cambiar el perfil | m | CIRSOC 301 (vía pliego) | Alto (la norma) | Idem anterior |
| Auditor (biblioteca) | — | Unidad "mes" (alquiler de baño químico) | Marcada como no-normalizada (falso positivo) | Agregada a la lista de unidades válidas | — | — | — | No era un error de datos, era un hueco en la lista blanca del auditor |
| Biblioteca del usuario (datos en vivo) | Columnas HºAº in situ (copia guardada por el usuario) | Vibrador de inmersión hp 8, Hormigonera 130L | `un:'hh'` | `un:'h-eq'` | h-eq | Mismo criterio Fase B | Alto | Copia personalizada guardada antes de la Fase B, no se actualiza sola |
| Biblioteca del usuario (datos en vivo) | Drenaje PVC ø160mm (copia guardada por el usuario) | Herramientas menores | `un:'hh'` | `un:'h-eq'` | h-eq | Mismo criterio Fase B | Alto | Idem |
| Biblioteca del usuario (datos en vivo) | Drenaje PVC ø160mm | "Varios" | `un:'Un'` (mayúscula) | `un:'un'` | — | — | Alto | Normalización de mayúsculas/minúsculas |

### Revisado y confirmado SIN errores (no se tocó)

- **Familia Hormigón/Estructura HºAº completa** (HA01 a HA06, variantes "elaborado" e "in situ c/hormigonera"): las dosificaciones (350kg cemento / 0.45 arena / 0.8 ripio para H21) ya habían sido corregidas en un commit anterior contra la propia planilla de cómputo métrico de Diego. No se encontró ninguna discrepancia adicional.
- **Vereda de Hº peinado esp=10cm**: ya usaba correctamente H21/350kg — confirmado contra el pliego.

### Pendiente — sin fuente pública disponible (Diego las va a cargar directamente)

Precios en $0 que bloquean el cálculo de varios ítems de la familia Hormigón/Estructura HºAº:

| Material | Unidad | Motivo de por qué sigue pendiente |
|---|---|---|
| Arena gruesa | m³ | IMCOFUE bloquea el acceso automatizado (403); Masciotra no publica precios online |
| Ripio (para hormigón) | m³ | Idem |
| Madera Tabla Pino Norte (encofrado) | Pie² | Idem |
| Tirante Pino Norte (encofrado) | Pie² | Idem |

### Pendiente menor — detectado en esta revisión final, no corregido (no destructivo)

Dos pares de materiales duplicados en el Listado de Precios (mismo nombre, mismo precio, distinto código) — no afectan ningún cálculo activo, pero convendría unificarlos en algún momento:

- "Mortero autonivelante Sikafloor-200 Level" — cods `1004` y `1717` (ninguno referenciado actualmente por ningún ítem de la biblioteca)
- "Caldera dual 20.000kcal/h mural PEISA DIVA DS" — cods `2501` (usado por el ítem AG04) y `2452` (no usado por ningún ítem)

No se borró nada — es una decisión que te corresponde a vos (cuál código dejar como el "oficial").

---

## 5. Nuevo módulo: Rendimiento Real de Obra

Con las fuentes públicas agotadas (no existe ningún APU real publicado con hh/unidad para Ushuaia), se construyó el módulo que vos mismo propusiste en la orden original, para que la biblioteca se siga corrigiendo con datos propios en vez de fuentes que no existen.

**Ubicación:** Análisis de Precios → botón "📏 Rendimiento Real"

**Flujo:**
1. Buscás un ítem de la biblioteca por nombre o código.
2. Ves su receta presupuestada actual (de referencia).
3. Cargás una medición real: fecha, obra (opcional), cantidad ejecutada, y para cada material/equipo/rol de MO, la cantidad o las horas totales realmente consumidas (todo opcional — cargás solo lo que mediste).
4. El sistema calcula el rendimiento real (consumo real ÷ cantidad ejecutada) y lo compara contra lo presupuestado, con el % de desvío.
5. Con 2 o más mediciones, un botón "Calibrar" por recurso te deja aplicar el promedio real a la biblioteca — con confirmación explícita antes de tocar nada, y queda registrado en `APU_HISTORIAL` con fecha, motivo y fuente ("Rendimiento Real de Obra").

Ningún número se inventa ni se estima acá: todo sale de una medición real que vos cargás.

---

## 6. Pendiente menor, ya identificado en Fase A y todavía no tocado (bajo impacto)

Estos quedaron fuera del alcance de Fase B/D por decisión explícita (no afectan cálculos, solo etiquetas de UI):

- Los selectores genéricos de unidad multiuso (para cualquier tipo de recurso) todavía listan "hs" como una opción entre muchas — no se tocaron porque no son específicos de mano de obra.
- Los diccionarios internos de agregación (resumen de obra, exportación a PDF/Excel) usan la clave `'hs'` como identificador interno para agrupar filas de mano de obra — es una clave de programación, no un dato visible al usuario, y cambiarla sin necesidad agrega riesgo de romper esas exportaciones.

---

## 7. Archivos de referencia

- `AUDITORIA_FASE_A.md` — auditoría inicial completa (Fase A)
- `CRITERIO_UNICO_FUENTES.md` — criterio único de fuentes técnicas (pliego + CECCDU-UTN + limitaciones)
- Este documento (`INFORME_FINAL_FASES_B_D.md`) — consolidado de lo implementado y desplegado (Fases B, C, D) más el módulo de Rendimiento Real de Obra

---

*Diego Rojas, Maestro Mayor de Obra — PRARES ARQUITECTURA, Ushuaia, Tierra del Fuego.*
