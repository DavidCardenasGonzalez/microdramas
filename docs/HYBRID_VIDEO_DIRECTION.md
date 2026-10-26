# Dirección oficial de video

La fuente rectora es [AI_FILM_DIRECTION_PLAYBOOK.md](AI_FILM_DIRECTION_PLAYBOOK.md), aportada por el usuario el 25 de octubre de 2026. Este archivo conserva su ruta para enlaces existentes y concreta la integración. Las instrucciones del usuario prevalecen; el documento aporta metodología, no autorización de gastos, instalaciones o renders.

| Beat | Ruta oficial | Preparación |
| --- | --- | --- |
| DIALOGUE / CONTROLLED_ACTION | `h3_fast_ref` → `comfy-h3-fast-ref` | Identidades reutilizadas, continuidad textual y Reference Plan |
| DYNAMIC_ACTION | `h3_motion` → `comfy-h3-motion` | Misma interfaz; trayectoria, contacto y consecuencia claros |
| COMPLEX_TRANSITION | Dividir con intención; Fast Ref/Motion según la unidad | Conservar el efecto dramático y proteger rostros durante giros rápidos |
| Acción compleja indispensable que necesita escalamiento | `seedance` o `kling` | Razón registrada, plataforma inspeccionada y aprobación humana del gasto |

La dirección registra `beatType`, `generationMode`, `routingReason`, duración razonada y estados inicial/final. Los puntos observados de ~20 s Fast Ref y ~10 s Motion a 0.4 orientan pruebas; no son límites universales. No rellenar acciones triviales. Varios planos y cortes motivados dentro de una generación H3 son válidos; las cantidades de planos son orientativas.

## Continuidad y referencias

Antes de crear imágenes, inspeccionar estado, referencias, jobs, `media/`, `generation/` y `review-drafts/`. Reutilizar identidades reales revisadas. Set, posiciones, eje, luz, vestuario breve y utilería se conservan primero mediante texto exacto. No crear hoja, frame, set ni vestuario por clip. Considerar imágenes adicionales ante deriva repetida, uso importante en aproximadamente seis clips o varios capítulos, ponderando memoria y tiempo. Es una recomendación, no una cuota.

`SequenceContinuity` vive versionado en `.studio/state.json`: `sceneId`, `canonicalText` completo en inglés, `set`, `spatialMap`, `axis`, `lighting`, `characters` (identidad, ropa, posición, voz, estado físico) y `props` (nombre, estado, propietario). Importar conserva versiones e invalida solo dependientes. Cada Shot oficial H3 enlaza `{id, version}` en `sequenceContinuity` y en `deps`. El compilador copia literalmente `canonicalText`; los estados de Shot registran cambios de conocimiento, emoción y acción sin repetir palabras ya pronunciadas.

```powershell
node bin/studio.mjs -p productions/<proyecto> continuity --import sequence-continuity.json
node bin/studio.mjs -p productions/<proyecto> task --stage shots --scene EP001-SC001
node bin/studio.mjs -p productions/<proyecto> plan --import-shots directed-shots.json --approve
node bin/studio.mjs -p productions/<proyecto> references --prepare --scene EP001-SC001
```

El `referencePlan` conserva referencias ordenadas y roles, sujetos, planos con tiempos contiguos, continuidad y criterios de aceptación. Un sujeto con `referenceIds: []` y `textOnlyReason` permite figurantes incidentales o presencia no reconocible. Un personaje recurrente reconocible usa su propia identidad o una referencia combinada de identidad/ropa. No asignar la imagen de otro personaje. El orden determina `<Picture N>` y conexiones del grafo. `reference_manifest` es una vista derivada, nunca otro estado editable.

No pasar video previo por defecto. Una imagen `start` puede guiar la apertura, transmitida como referencia; no prometer keyframe exacto. `end` literal permanece bloqueado sin binding verificado. I2V/FLF conservan sus requisitos físicos solo para planes heredados o peticiones explícitas.

## Registro de workflows

La copia portátil [Fast Ref API](../assets/workflows/video_fasth3_omniref_r2v.api.json) deriva del archivo adjunto `video_fasth3_ominiref_r2v.json`. Conserva modelos, sampler de ocho pasos, selector 0.4 y expresión de duración; elimina prompt e imágenes de ejemplo. No certifica disponibilidad actual ni VRAM. Fuente original SHA-256: `edc7364c372482fcb7f8025a1b0c7f5a471abd26f54cd699b0a945bf54292cf4`.

```powershell
node bin/studio.mjs -p productions/<proyecto> doctor
node bin/studio.mjs -p productions/<proyecto> workflows --register-h3 assets/workflows/video_fasth3_omniref_r2v.api.json --variant fast-ref
node bin/studio.mjs -p productions/<proyecto> workflows --register-h3 <motion-api-real.json> --variant motion
node bin/studio.mjs -p productions/<proyecto> generate --adapter auto --shot UNIT-ID --dry-run
node bin/studio.mjs -p productions/<proyecto> generate --adapter auto --shot UNIT-ID --prepare-only
```

Fast Ref y Motion tienen registros independientes: uno no demuestra la presencia del otro. Registrar valida nodos/modelos activos y guarda una copia por variante; no modifica el master ni renderiza. Acepta la política inspeccionada `17*n+5` a 24 FPS, con límites del nodo activo y techo operativo del grafo fuente. La plantilla de 20 s se alinea a 481 frames, 20.0417 s efectivos; el director debe usar el tiempo efectivo en Shot e intervalos, sin redondeo oculto. Un control de 10 s equivale a 243 frames, 10.125 s. Otra expresión o FPS exige soporte explícito.

La [dirección cinematográfica](CINEMATIC_DIRECTION.md) completa el contrato oficial con `direction`, actuación y sujetos visibles por plano y `dialogueStaging`. La CLI exige estos campos antes de una nueva aprobación/compilación, permite planos continuos justificados más largos que el límite histórico por plano y conserva el límite efectivo de la unidad del workflow. Las alternativas usan `--recovery` con un `RecoveryDecision`; un cambio de cobertura/audio/ruta se importa como nueva versión antes de preparar.

## Prompts, QA y recuperación

Inglés cinematográfico y diálogo literal en el idioma del proyecto. Enviar duración/estilo, mapeos, continuidad completa, blocking y acción temporizada con cámara, foco, estados y cortes. Retención, títulos poéticos y razones de duración quedan en metadatos; no se envían como rótulos pronunciables. Solo se habla el diálogo citado una vez. La regla **sin música ni acentos sintéticos de principio a fin** se mantiene, también desde dispositivos.

Aplicar códigos y reparaciones del playbook. Revisar temporalmente identidad, anatomía, causalidad, voz y palabras. Registrar segundos utilizables y costo por segundo aprobado cuando haya datos; decodificar no equivale a evaluar audiovisual. Segundo intento diagnóstico; tercero opcional solo con valor y cambio de ruta/división explícito, sin bucles. Cambiar hechos narrativos requiere revisión Screenwriting; una corrección técnica del mismo plan no lo reimporta.

`premiumBudgetPerEpisode` y `budget` limitan reservas y gasto; `approve --paid` conserva aprobación humana. Kling exige modelo, límites y evidencia de plataforma en `bridge.kling`; no se simula un conector. El handoff premium se traduce a la interfaz real del proveedor.

Los planes históricos `h3_reference_to_video`, LTX y MSR y sus archivos se conservan por compatibilidad. `auto` respeta modos/estrategias heredados explícitos; una ruta de referencias sin modo elige Fast Ref y exige su plan, nunca MSR silenciosamente. Los jobs ya preparados conservan el adaptador guardado y se reanudan por ID. No se migran silenciosamente proyectos, autorizaciones o trabajos en curso.

