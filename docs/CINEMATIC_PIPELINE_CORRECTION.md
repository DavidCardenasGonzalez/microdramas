# Identidad cinematográfica y continuidad de película

Corrección integral del 26 de octubre de 2026. Complementa la guía oficial y reemplaza las instrucciones anteriores que mezclaban estados cambiantes con el bloque canónico. Rige tanto en modo sencillo como estándar. Las pruebas aquí descritas son de contratos, planificación y compilación; no certifican nuevas interpretaciones generadas.

## Diagnóstico

El compilador H3 enviaba género y `visualTreatment`, pero no existía una biblia cinematográfica persistente. El perfil podía reducirse a `cinematic`. La aprobación comprobaba campos de actuación, sin proteger la identidad de producción entre unidades. Los agentes recibían contexto de una toma sin el estado de las unidades vecinas.

`SequenceContinuity.canonicalText` mezclaba arquitectura y vestuario con posiciones, estado físico y propietario de objetos. Copiarlo literalmente podía restablecer el inicio de la escena mientras la acción temporizada ordenaba otra posición. `startState/endState` eran prosa libre sin comprobación entre generaciones. `previousShotId/nextShotId` son enlaces editoriales, no un plan global ni un registro de hechos completados.

La asignación de hablante visible y audio independiente ya existía. Faltaban idioma e intención por intervención, un filtro de ventanas de habla poco plausibles y un rechazo de habla visual sin palabras asignadas. Las llamadas necesitaban una preferencia explícita por alternar participantes importantes en sus espacios aprobados.

El compilador heredado repetía política sonora, contexto, finalidad y razones de duración; el H3 tenía menos redundancia, pero conservaba instrucciones generales de velocidad incluso ante cámara lenta deliberada. No había una obligación de identificar la evidencia visual indispensable de una herida u objeto.

Auditoría acotada de los estados de `productions/funny-girl-32` (EP001–EP003: 112 jobs) y `productions/la-ultima-llave` (14 jobs): todos registraban semilla 42. Los workflows de los ejemplos examinados no declaraban binding de negativo. Esto prueba configuración repetida y ausencia de conexión declarada; no prueba que la semilla causara encuadres repetitivos ni que todos los errores perceptivos reportados fueran observados de nuevo. Los medios, jobs y estados de esas producciones se preservaron.

## Etapa 1: identidad y actuación

Importar `CinematicStyle` mediante `cinematic-style --import`. Campos: `genre`, `subgenre`, `aestheticReferences`, `colorPalette`, `lighting`, `performanceStyle`, `rhythm`, `cameraLanguage`, `realism`, `genreTreatment`, además del envelope versionado habitual. Escribir decisiones concretas en inglés: fuentes/dirección de luz, contraste y color, conducta actoral, foco, movimiento y ritmo; no rellenar campos con adjetivos genéricos.

Cada Shot oficial enlaza `cinematicStyle: {id, version}` y la misma dependencia en `deps`. Las rutas oficiales Fast Ref/Motion y los escalamientos Seedance/Kling exigen el mismo contrato cinematográfico. El compilador abre con `Ultra-photorealistic scene from a premium Hollywood … feature film`, usando el género/subgénero de la producción, e incluye los campos completos y el tratamiento de la escena. El prefijo declara el objetivo estético, no garantiza calidad. No impone thriller, master, escala o paleta universales. Las nuevas solicitudes FLUX exigen esa biblia antes de preparar o ejecutar; los jobs remotos conocidos conservan su reanudación. FLUX recibe también la identidad de producción, distinguiendo la imagen de referencia de un plano en movimiento. Los planes heredados conservan su ruta y usan el género/estilo del perfil si no tienen biblia vinculada.

`Shot.direction` y la actuación observable por intervalo siguen siendo obligatorios. Interpretar objetivo, obstáculo y subtexto mediante mirada, respiración, postura, manos, escucha y ritmo vocal. Una revisión de estilo crea versión e invalida dependientes; no cambia paquetes históricos.

## Etapa 2: dirigir la secuencia antes de repartir generaciones

Importar `SequencePlan` con `sequence-plan --import`: `sceneIds`, `unitIds` ordenados, `dramaticArc`, `coverage` global y `transitions` entre unidades consecutivas. Cada transición registra `fromUnitId`, `toUnitId`, `technique`, `reason` y `reestablishing`. Decidir primero cómo se filma la secuencia; después asignar unidades según duración y límites efectivos. Justificar un nuevo establecimiento por información narrativa, nunca por empezar otro render.

Cada Shot oficial enlaza `sequencePlan` y su dependencia. Importar todas las unidades del plan juntas antes de aprobarlas. Puede haber varias localizaciones aprobadas en una secuencia; un encabezado intercalado puede describir dos espacios. El mapa, luz, ropa, accesorios y cobertura deben distinguirlos sin hacer entrar un personaje en el espacio del otro.

La continuidad tiene dos capas:

- `SequenceContinuity` con `scope: invariants`: arquitectura, mapa permanente/eje, luz/paleta, ropa por escena, voz y apariencia de utilería. `canonicalText` completo en inglés se repite literalmente. No incluir estados cambiantes ni palabras habladas. `characters.position/physicalState` y `props.ownerId` pertenecen a la capa dinámica y se rechazan en este modo.
- `Shot.dynamicState.start/end`: todos los personajes de las escenas del plan, incluso ausentes, con `presence`, `position`, `posture`, `hands`, `wardrobe`, `injuries`, `eyeline`, `emotion`; objetos con `id/state/ownerId` (null si ninguno); puertas con `id/state`; `completedActionIds` y `spokenBeatIds` como IDs de beats fuente. Registrar objetos aunque estén ausentes, destruidos o sin propietario. Las localizaciones de personajes presentes en espacios distintos deben ser explícitas.

El estado inicial debe igualar el final anterior completo, independientemente del orden de las listas. Los registros de acciones/frases son acumulativos: no olvidar ni volver a ejecutar lo completado. El final añade exactamente los beats completados/pronunciados de la unidad. La validación rechaza huecos, unidades sin aprobar, versiones discordantes, beats repetidos/desordenados y reinicios estructurados. La prosa `startState/endState` queda disponible para historia y compatibilidad; el prompt nuevo usa el estado dinámico como autoridad física. El director revisa además que acciones y continuidad por intervalo no lo contradigan: el software no interpreta libremente el significado de toda la prosa.

Los contratos históricos sin estos campos siguen cargando. Una nueva aprobación/compilación oficial requiere los contratos actuales; observar jobs ya enviados conserva paquete e ID.

## Etapa 3: palabras, tiempos y cobertura del hablante

Cada `dialogueStaging` añade `language` igual al idioma configurado e `intent` interpretativo en inglés. El texto exacto se obtiene de `Shot.dialogue`, validado contra el guion; no se mantiene otra copia editable. Conserva hablante, plano, ventana, estrategia, sincronía y razón de cobertura.

El filtro temporal utiliza un intervalo amplio de estimación por palabras: menos de palabras/6 segundos o más de `max(3, palabras/1.2 + 0.8)` requiere revisar la ventana o explicar `timingReason`. Es un detector de extremos, no una ley de locución para todos los idiomas. Una entrega deliberada excepcional debe tener motivo concreto; separar la pausa y su acción observable del intervalo de habla. No describir a alguien hablando sin palabras nativas asignadas; una escucha con voz independiente dirige bocas en silencio.

Preferir mostrar al hablante importante con un corte motivado. Baño: intimidad → Steve en el pasillo ante la puerta → Molly recuperando el aliento dentro. Teléfono: alternar ambos interlocutores en sus localizaciones aprobadas cuando ambos importan. Si el guion exige invisibilidad, elegir `offscreen-audio`/`reaction-audio`, omitir esas palabras del prompt de video y preparar una mezcla externa completa revisada. La CLI no inventa un TTS ni atribuye voz a otra cara. Cambiar una ocultación explícita exige revisión Screenwriting.

## Etapa 4: evidencia y recursos expresivos

Registrar `Shot.visualEvidence`: `beatId`, `detail`, `shotId`, `method`. Puede ser `[]` si no existe información visual indispensable. Para una lesión relevante, asegurar detalle legible del pie/zapato/sangre, contexto corporal y reacción; no esconderla por una precaución genérica. La evidencia debe pertenecer al beat y plano indicados, y su ejecución debe aparecer en composición/acción/cámara.

Considerar close-up, medium close-up, detalle, OTS, foco selectivo/rack focus, tracking, barrido lateral, push-in/dolly-out, órbita, frontal, espalda, revelación y reacción. Elegir por intención, geografía y causalidad. No imponer variedad decorativa, cámara fija o número de cortes. `referencePlan.shots[].playback: slow-motion` requiere `playbackReason` y afecta solo ese intervalo; los demás mantienen tiempo real. No usar cámara lenta para rellenar segundos.

## Etapa 5: compilación y QA

La salida conserva apertura de película/género, tratamiento específico, referencias ordenadas, invariantes, acciones y estados temporizados, actuación, cámara/foco y palabras atribuidas una vez. El estado inicial se envía completo y el final describe solo los cambios; la ropa inicial se resuelve desde el estado heredado para evitar repetirla en cada bloque. Se rechaza texto entre comillas ajeno a las intervenciones nativas, incluidas fugas desde estados o títulos. Análisis, IDs editoriales, razones de corte/duración, ledger de palabras y evidencia de planificación quedan en metadatos. La política sonora completa aparece una vez, con recordatorio final breve. Se acorta el negativo; no se acumulan prohibiciones para compensar dirección débil.

Las nuevas semillas predeterminadas se derivan de proyecto, unidad, versión y adaptador; permanecen estables al reintentar y permiten idempotencia. `--seed` prevalece. `seed-variation` requiere semilla explícita diferente y diagnóstico. Las comparaciones controladas de pruebas mantienen prompt/inputs iguales y modifican solo la semilla, normalizando rutas de transporte por job; comprueban que llega al grafo. **El efecto visual de variar la semilla sigue sin determinarse**: necesita renders A/B autorizados, parámetros idénticos, observación y audio. No atribuir a este cambio una mejora perceptiva no medida.

Preparar H3 o el adaptador Comfy genérico escribe `generation/JOB/input-usage.json`: para prompt, negativo y semilla informa si el valor exacto llega a un nodo conectado a la salida guardada. Un negativo sin binding o desconectado es metadato, no control efectivo. Esto acredita transmisión estructural, no la fuerza semántica con que un modelo obedece el input. No modificar workflows maestros para inventar soporte.

Tres niveles de QA:

| Nivel | Registro | Comprobaciones obligatorias |
| --- | --- | --- |
| Toma | `review --take ID --verdict pass --by … --assessment qa.json` | identity, anatomy, performance, voice, dialogue, lipSync, movement, timing, promptFidelity, music |
| Continuidad editada | `review --timeline ID --level continuity …` | positions, props, wardrobe, location, eyelines, emotion, transition |
| Secuencia narrativa | `review --timeline ID --level narrative …` | rhythm, framingVariety, visualClarity, dramaticIntention, tone, repeatedActions, generationBoundaries |

`CinematicAssessment` contiene `viewedVideo: true`, `listenedAudio: true`, `samples` ordenadas con `atSeconds/observation`, y `checks` por nombre con `verdict: pass|fail|not-applicable` y `evidence` concreta. Solo voz/diálogo/lipsync admiten no aplicable cuando realmente no existen. Ver reproducción y escuchar audio; no rellenar el formulario por pasar FFmpeg. Los samples no reemplazan la reproducción. El reporte registra una evaluación, no crea una capacidad perceptiva en la CLI.

Una toma nueva real con estilo vinculado no obtiene pase audiovisual sin ese informe. Las revisiones de continuidad/narrativa pertenecen a la versión exacta de timeline; revisarla invalida los informes anteriores. La timeline respeta el orden completo de SequencePlan; una omisión o reordenamiento deliberado requiere editorialReason y nueva revisión. Los exports dependen de las revisiones utilizadas; sustituir una evaluación invalida sus dependientes. La exportación cinematográfica real bloquea aprobación final sin ambos pases. `--allow-pending` sirve para un preview pendiente y conserva esa calidad en el manifiesto. Los simulados continúan marcados como simulados.

## Verificación por fases

`tests/hybrid.test.ts` conserva los contratos previos y agrega: estilo persistente y cambio de género; conversación de tres clips sin reinicios; baño con tres vistas; teléfono con dos locaciones y alternativa independiente; lesión con detalle, reacción y movimiento; cámara lenta justificada; semillas controladas y auditoría de conexiones; QA individual y de secuencia con invalidación al revisar timeline. Los servidores y referencias de esos tests son fixtures simulados, sin envíos de inferencia. `tests/studio.test.ts` y `tests/simple-production.test.ts` conservan recuperación de IDs, incertidumbre, presupuesto, integridad, selección y montaje sintético.

No se ejecutaron nuevas generaciones de pago ni renders generativos locales para esta corrección. La calidad cinematográfica de una película nueva requiere aún la producción y revisión audiovisual real correspondiente.

Verificación final del 26 de octubre de 2026: `npm run typecheck`, `npm test` (61/61), `npm run build` y `npm run skills:verify` (183 archivos fijados con parches locales registrados) completados correctamente. JSON Schemas regenerados desde Zod; `git diff --check` sin errores y CLI compilada operativa.
