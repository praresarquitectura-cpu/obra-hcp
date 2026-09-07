# ObraERP — Criterio único de fuentes técnicas (para la Fase D)

**Fecha:** 2026-09-07
**Qué es este documento:** la fuente de referencia consolidada que vas a usar de acá en adelante para justificar cada rendimiento/consumo que se corrija en la base de ObraERP. Combina lo que pediste como 1ª y 2ª prioridad (CECCDU-UTN y pliegos de Ushuaia) más los dos PDF que subiste (que resultaron ser la MISMA obra: "Residencia de Adultos Mayores", Municipalidad de Ushuaia, Licitación Pública S.P. e I.P. Nº 03/2022, Expte. E 326/2022, Presupuesto Oficial $376.471.952).

Voy a ser directo sobre lo que sí conseguí y lo que no — tal como pediste en la Etapa 29, prefiero decirte "esto no está" antes que inventarlo.

---

## 1. Lo que los pliegos de Ushuaia SÍ dan (y es oro para la Fase B/D)

### 1.1 — La estructura oficial de Análisis de Precios que exige la Municipalidad de Ushuaia

Ambos PDF que subiste incluyen el **Anexo I — "Análisis de Precios, Planilla Modelo para el Cálculo"**, que todo oferente debe usar. Esta es la estructura EXACTA:

```
1. MATERIALES: Descripción | Unidad | Cantidad (por unidad de ítem) | Precio unitario | Precio total
   → (1) COSTO UNITARIO MATERIALES

2. EQUIPOS: Descripción | Unidad | Cantidad | Monto | Precio total
   → (2) COSTO UNITARIO EQUIPOS   (separado de materiales, como pediste en la Etapa 3)

3. MANO DE OBRA: rol | $/hora | Cantidad hs | Precio total
   Roles: Oficial especializado, Oficial, Medio oficial, Ayudante
   + Vigilancia: % del subtotal de MO (solo casos excepcionales justificados)
   → (3) COSTO UNIT. MANO DE OBRA

4. COSTO UNITARIO TOTAL (C.U.T.) = (1) + (2) + (3)

5. GASTOS:
   5.1 Gastos generales e indirectos = C.U.T. × p%
   5.2 Beneficio = (C.U.T. + 5.1) × 10%        ← FIJO, "no pudiendo modificarse"
   Subtotal 1 = C.U.T. + 5.1 + 5.2
   5.3 Gastos financieros = (C.U.T. + 5.1) × a%
   Subtotal 2 = Subtotal 1 + 5.3
   5.4 Impuestos/IVA = Subtotal 2 × b%

   PRECIO UNITARIO = Subtotal 2 + 5.4
```

**Por qué esto es tan valioso:** es prácticamente idéntico a la cascada que ObraERP ya tiene programada (la vi la sesión pasada: comentario en el código dice *"Gastos: 5.1(15%) + 5.2(10%) + 5.3(3%) + 5.4(4%) cascada exacta sobre CUT → factor = 1.35148"*). El **10% de beneficio ya coincide exactamente** con el valor fijo que exige este pliego real de Ushuaia. Es decir: quien construyó ObraERP en su momento ya usó esta misma referencia — no hay que inventar la fórmula de precio de venta, hay que **confirmar y documentar** que viene de acá, y revisar si los otros tres porcentajes (15%/3%/4%) están tomados de este mismo pliego o de otro (en este PDF esos tres quedan como "p%"/"a%"/"b%" a definir, no vienen fijados por número — el 15/3/4% que usa ObraERP puede venir de una cláusula particular distinta que no llegué a identificar en estas 226 páginas, o puede ser un criterio propio adoptado en una sesión anterior. Te lo marco como **PENDIENTE DE CONFIRMAR fuente exacta**, no como error).

**Los 4 roles de mano de obra que usa ObraERP (`ofEsp`, `of`, `mo`, `ay`) coinciden exactamente** con los 4 roles de este pliego oficial (Oficial especializado, Oficial, Medio oficial, Ayudante). Esto valida la Etapa 5/6 sin tener que tocar nada — la taxonomía de roles ya está bien.

**Nuevo, no está en ObraERP todavía:** el ítem "Vigilancia" como % opcional sobre el subtotal de mano de obra, para casos excepcionales justificados. Lo agrego a la lista de mejoras de la Fase B como campo opcional, no obligatorio.

### 1.2 — Criterios técnicos de dosificación REALES y firmados, extraídos de las Especificaciones Técnicas

Esto es lo más valioso para tu pedido de "no inventar rendimientos": son exigencias mínimas concretas, con número, en un pliego firmado por la Municipalidad de Ushuaia para una obra real en tu ciudad.

| Elemento (ítem del pliego) | Exigencia real citada textualmente |
|---|---|
| **Contrapiso interior, esp. 10cm** (9.1) | Hormigón H21, contenido mínimo de cemento **350 kg/m³**, espesor mínimo 10cm. Film de polietileno 200µ + aislación térmica de poliestireno expandido de **2" (5cm), densidad 30 kg/m³**, en toda la superficie de planta baja. Malla tipo Sima 15×15cm Ø5mm. Juntas de dilatación cada ~10m² de paño. |
| **Carpeta armada, esp. 7cm** (9.2) | Contenido mínimo de cemento **300 kg/m³**, espesor mínimo 7cm, terminación fratasada (o alisada). |
| **Vereda de Hº peinado, esp. 10cm** (10.3) | Contenido mínimo de cemento **350 kg/m³** + aditivo hidrófugo, malla electrosoldada Ø5mm 15×15cm, film de polietileno 200µ, juntas cada 3m máximo, pendiente 2% al cordón. |
| **Losa de HºAº en sala de tanques** (4.4) | Resistencia 300 kg/cm² (hormigón exigente por presión hidrostática); por durabilidad, mínimo **380 kg de cemento/m³**; espesor mínimo 12cm; membrana asfáltica de impermeabilización. |
| **Estructuras metálicas** (5) | Espesor mínimo de elementos resistentes de acero: **4mm** (reducible a 3mm en ambientes no corrosivos), según CIRSOC 301. |
| **Terraplén** (3.1) | Densidad mínima exigida en capas de 15cm: 96-98% (suelos A1-a/A1-b/A2/A3) o 93-97% (suelos A4 a A7), según cuadro del pliego. |
| **Cañería PVC de desagüe** (3.2) | Asiento de 15cm de grava/arena compactada al 90% Proctor; prohíbe expresamente ensamblar los tubos con el balde de la retroexcavadora. |

**Tipo de fuente (según tu propia clasificación de la Etapa 14):** `PLIEGO OFICIAL`, jurisdicción Municipalidad de Ushuaia, fecha 2022, nivel de confianza `ALTO` (es un documento firmado, vigente, específico de tu ciudad — exactamente el tipo de fuente que pediste priorizar).

### 1.3 — Comparación directa contra lo que ObraERP tiene cargado HOY

Ya cruce esto contra la biblioteca actual de ObraERP (sin modificar nada, solo comparé):

- **`Vereda de Hº peinado esp=10cm`** — ObraERP ya usa `H21 350kg` (cod 104) + malla Sima + film 200μ. **Coincide con el pliego real.** Esto no hay que tocarlo — es una confirmación positiva, no todo estaba mal.
- **`Contrapiso de 10cm`** — ObraERP usa hoy `H13 250kg` (cod 102), no `H21 350kg` como exige este pliego para un contrapiso de 10cm. Además, no encontré la aislación de poliestireno expandido 2"/30kg/m³ en el análisis de materiales de ese ítem (sí tiene el film de polietileno y la malla). **Esto es una discrepancia real, con fuente concreta**, candidata a corregir en la Fase D — pero la dejo señalada, no la cambio todavía, porque falta confirmar si tu "Contrapiso de 10cm" genérico se usa siempre para interior habitado (que exigiría H21) o también para contrapisos no estructurales/de menor exigencia (donde H13 podría ser un criterio válido y más económico). Es tu decisión técnica, no la mía.
- No llegué a cruzar los otros ítems de este pliego (carpeta, losa de sala de tanques, estructura metálica) contra los ítems equivalentes de ObraERP en esta pasada — queda para la Fase D, ítem por ítem, como corresponde.

---

## 2. Lo que CECCDU-UTN (1ª prioridad que pediste) da — y sus límites reales

Confirmé que el boletín mensual "Costos en la Construcción" de CECCDU-UTN sigue publicándose (encontré la edición de diciembre 2025, base Venado Tuerto/Santa Fe, índice base dic-2012=100). Contiene:

- Costo por m² de vivienda tipo (2 y 3 dormitorios).
- **Precio unitario por rubro/ítem ya armado** (ej. losa H21 cuantía 80kg/m³: $1.026.893,29/m³; mampostería ladrillo común: $237.466,32/m³; revoque fino a la cal: $13.802,72/m²).
- Porcentaje de incidencia de cada rubro sobre el presupuesto total de una vivienda tipo (ej. Revoques 18,94%, Aberturas 13,67%, Cubiertas 11,27%).
- Seguimiento mensual/anual de precios de insumos clave (cemento, cal, arena, acero).

**Lo que NO da, y hay que ser honesto con esto:** no desglosa el precio en `hh/unidad` de mano de obra ni en consumo físico de material por unidad (`kg/m³`, `m²/m²`, etc.) — separa el precio en $ mano de obra + $ materiales + $ equipo, pero no en las cantidades físicas que los generan. Sirve como **benchmark de precio final** (para saber si un $/m² que carga ObraERP está en el orden correcto), no como fuente de rendimiento. Además es de Santa Fe, no de Ushuaia — cualquier comparación necesita ajustarse por la diferencia real de logística/flete/clima entre las dos zonas, que hoy ObraERP no tiene modelada como factor (esto es justamente la Etapa 17/18 que planteaste).

**Uso que le voy a dar:** referencia de contraste de orden de magnitud del precio final ($/unidad), tipo `BASE DE COSTOS`, jurisdicción Santa Fe (no Ushuaia), confianza `MEDIA` para Ushuaia (porque hay que ajustarlo, no aplicarlo directo).

---

## 3. Lo que busqué y NO encontré (para que sepas exactamente el límite de esto)

Fui a buscar específicamente lo que más nos serviría — una Análisis de Precios YA COMPLETO, real, presentado por un contratista y adjudicado en una obra pública de Ushuaia o Tierra del Fuego, con los `hh/unidad` y consumos reales que usó para ganar la licitación. **No lo encontré, y tengo motivos para creer que no existe públicamente**: la Municipalidad de Ushuaia y el IPVyH publican los pliegos (la plantilla vacía que ya analicé arriba) y las resoluciones de adjudicación (solo el monto total adjudicado), pero no publican como documento separado el Análisis de Precios que cada oferente entrega "dentro del sobre de la oferta" — ese papel queda archivado en el expediente administrativo, no en la web.

Tampoco encontré ejemplos numéricos trabajados en el Manual de Análisis y Redeterminación de Precios de la Nación (no pude acceder al PDF) ni en el capítulo "C-06 Los Costos de las Obras" del CPAU (es puramente metodológico, remite a un anexo que no está incluido en ese archivo).

**Conclusión honesta:** no existe hoy una fuente pública argentina de rendimiento de mano de obra a nivel `hh/unidad` con el detalle que la Etapa 3/5 necesita, específica de Ushuaia. Las dos fuentes reales que sí tengo (los pliegos que subiste y CECCDU-UTN) me dan: la **estructura de precio de venta** (confirmada, ya coincide con lo que tiene ObraERP), **algunas dosificaciones técnicas de material puntuales** (tabla de la sección 1.2, con fuente sólida), y un **benchmark de precio final** para contrastar magnitudes. No me dan rendimiento de mano de obra.

---

## 4. Criterio único que voy a aplicar de acá en adelante (Fase D)

1. **Fórmula de precio de venta (5.1 a 5.4):** confirmada contra el Anexo I de Ushuaia. Beneficio 10% fijo, queda documentado con esta fuente. Los otros tres porcentajes de ObraERP (15/3/4%) quedan marcados `PENDIENTE DE CONFIRMAR fuente exacta` hasta que encuentre o me confirmes de dónde salieron.
2. **Roles de mano de obra:** confirmados contra el mismo Anexo I. Sin cambios.
3. **Dosificaciones de hormigón/mortero puntuales:** donde el pliego de esta obra real da un mínimo concreto (tabla de la sección 1.2), lo uso como fuente `PLIEGO OFICIAL / ALTO` para contrastar el ítem equivalente de ObraERP en la Fase D — como ya hice arriba con el contrapiso.
4. **Rendimiento de mano de obra (hh/unidad) y consumo físico de material donde no hay pliego que lo diga:** no lo voy a inventar. Cada uno de esos valores en la base actual de ObraERP se queda exactamente como está (no lo estoy tocando en esta etapa) y, a medida que lo revisemos ítem por ítem en la Fase D, lo voy a marcar como uno de estos tres:
   - `MEDICIÓN REAL PROPIA` — si me confirmás que ese número sale de tu propia experiencia en obra (que es, a esta altura, la fuente más confiable y específica de Ushuaia que tenemos disponible — mejor que cualquier PDF que encontré).
   - `BASE DE COSTOS` (CECCDU-UTN, ajustado) — solo para contrastar el orden de magnitud del precio final, no el rendimiento físico.
   - `PENDIENTE DE VALIDACIÓN` — si no hay ni pliego ni tu propia experiencia que lo respalde.
5. **Le doy prioridad a tu propia experiencia de obra en Ushuaia por sobre cualquier fuente bibliográfica genérica** cuando ambas estén disponibles y no coincidan — es literalmente más específica y más confiable que un boletín de Santa Fe. Esto significa que en la Fase D te voy a ir preguntando, ítem por ítem donde no haya pliego, cuál es tu criterio real de obra antes de asignar un valor.

---

## 5. Qué necesito de vos para avanzar

- Si tenés guardado algún otro pliego de Ushuaia/TDF (aunque sea de otro rubro: sanitario, eléctrico, vial) o algún presupuesto propio de una obra ya ejecutada, compartímelo — cada uno de estos suma directamente a la sección 1.2 de este documento.
- Confirmame si puedo avanzar a la Fase D cruzando ítem por ítem los ~15 ítems más relevantes de este pliego (contrapiso, carpeta, losa de tanque, estructura metálica, terraplén, cañería) contra sus equivalentes de ObraERP, o si preferís que primero cerremos las migraciones estructurales de la Fase B que quedaron pendientes de tu confirmación en el informe anterior.
