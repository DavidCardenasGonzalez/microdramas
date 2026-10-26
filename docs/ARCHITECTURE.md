# Arquitectura implementada

La [guía oficial](AI_FILM_DIRECTION_PLAYBOOK.md) gobierna el ciclo. `src/direction.ts` comparte esa política entre solicitudes narrativas y tareas de producción; `src/hybrid.ts` enruta Fast Ref/Motion y conserva planes heredados. `src/continuity.ts` importa biblias de secuencia versionadas, invalida solo dependientes y deriva el reference_manifest.

`src/cinematography.ts` importa identidad de producción y compila la apertura Hollywood por género; `src/sequences.ts` versiona cobertura global y valida herencia de estados; `src/dialogue.ts` comprueba intención, idioma y ventanas plausibles. La [corrección integral](CINEMATIC_PIPELINE_CORRECTION.md) documenta contratos y límites.

## Módulos y ejecución

`src/cli.ts` expone la interfaz operativa. Commander interpreta opciones; Zod valida todos los contratos al cargar y guardar. `src/studio.ts` inicializa proyectos, informa progreso, valida el conjunto y descubre herramientas. `src/narrative.ts` prepara solicitudes para Codex, importa resultados Screenwriting y aprueba versiones inmutables. `src/tasks.ts` limita el contexto por episodio, escena o toma.

`src/planning.ts` conserva el texto del guion, obtiene encabezados, párrafos y hablantes conocidos, y genera escenas, beats, planes de cámara y referencias. Los spans son offsets de caracteres UTF-16 `[start,end)` y llevan la cita exacta, scriptId y versión. No son una traducción ni una paráfrasis. La estimación temporal es provisional: palabras/2.2 más pausas para diálogo y una estimación conservadora para acciones. No certifica actuación ni velocidad de habla. Las líneas demasiado largas requieren revisión; no se recortan automáticamente. El plan automático es un borrador; Codex lo dirige con Film Production y criterios de Drama.

Los IDs de escena se reutilizan por encabezado y ocurrencia cuando es posible; los de beat combinan escena, hash del párrafo y ocurrencia. Las tomas se emparejan por beats compartidos al revisar. Un elemento nuevo obtiene un ID nuevo. Un encabezado completamente reescrito o un párrafo completamente nuevo puede requerir reconciliación explícita por el director. No se interpreta similitud semántica como identidad demostrada.

`src/adapters.ts` compila una representación independiente del proveedor, comprueba capacidades y construye copias de grafos. MSR llama al constructor local existente. `src/reference-generation.ts` prepara FLUX con o sin imagen fuente, preserva modelo/sampler/VAE instalados y registra las modificaciones del grafo. No ejecuta templates de ejemplo ajenos.

`src/generation.ts` gestiona jobs, autorizaciones, reservas de presupuesto, concurrencia, alternativas y reanudación. `src/review.ts` registra verificaciones técnicas y revisión audiovisual explícita. `src/editing.ts` valida timelines, produce cortes FFmpeg, mezcla pistas, normaliza audio, genera/incrusta SRT y exporta versiones. `src/media.ts` maneja subprocesses sin shell y comprobaciones reales de medios.

## Persistencia y fuentes de verdad

Cada producción es independiente:

```text
.studio/state.json          contratos, revisiones, relaciones y decisiones vigentes
.studio/write.lock          exclusión de escritores por PID
narrative/                 snapshots del guion, biblia derivada y procedencia
narrative/drafts/           borradores editables, creados al necesitarlos
requests/                  tareas delimitadas y handoffs a Codex/MCP
contracts/                 vistas derivadas de producción
references/                originales copiados/versionados, candidatos y fixtures
generation/JOB-ID/         prompts, parámetros, grafo, historia de backend
media/                     tomas originales, nunca editadas destructivamente
editing/                   manifiestos de edición versionados
exports/EXPORT-ID/         master, distribución, SRT, fuentes, hashes, comandos y QA
```

La escritura del estado es atómica mediante archivo temporal y rename. Un lock evita dos escritores de CLI simultáneos; si el PID murió puede recuperarse. No ejecutes dos renderizadores contra el mismo proyecto. Los workers mock comparten memoria y serializan checkpoints; los modelos locales se ejecutan de uno en uno para preservar VRAM y cola ajena.

No se guarda una segunda copia editable de contratos en cada etapa. Las vistas derivadas identifican `.studio/state.json` como fuente de verdad. Para restaurar una producción conserva la carpeta completa. El usuario es responsable de sus backups; no se activa sincronización o servicio externo adicional.

## Contratos

Los esquemas de `schemas/` se generan desde `src/contracts.ts`. Se implementaron `Project`, `StoryBible`, `Character`, `Episode`, `Script`, `Scene`, `Beat`, `Shot`, `CinematicStyle`, `SequencePlan`, `SequenceContinuity`, `ContinuityState`, `CinematicAssessment`, `ReferencePlan`, `Asset`, `Reference`, `GenerationJob`, `GeneratedTake`, `Review`, `Timeline`, `Export`; además `Profile`, `Config`, `PromptPackage`, `Approval`, `ReferenceGeneration` y diagnósticos.

Los artefactos tienen ID, versión, estado y dependencias exactas `{id,version}`. Una toma apunta al job, plano y versiones de referencias. El plano apunta al guion, escena, beats, personajes, assets y referencias; el seleccionado y sus in/out están identificados explícitamente. Timeline y Export dependen de las selecciones y versiones correspondientes.

`validate` comprueba esquemas, unicidad de ID/versión, existencia de dependencias, citas fuente, igualdad literal del diálogo, hashes de guiones/snapshots, referencias, paquetes y medios. FFmpeg realiza las pruebas técnicas de cada toma y exportación. La validación estructural no puede demostrar por sí sola que una instrucción visual arbitraria conserve el significado dramático: esa responsabilidad sigue en el director y la revisión audiovisual.

## Cambios e invalidación

Una revisión de guion no invalida producción hasta aprobarse. Después se marca obsoleta la versión anterior y los dependientes alcanzables de su DAG. La revisión de un asset afecta a sus referencias, planos, generaciones, tomas y montajes dependientes. Los elementos no relacionados siguen vigentes. Las relaciones prev/next de tomas son enlaces editoriales, no dependencias que invaliden en cascada una temporada completa; el director revisa las uniones afectadas.

Después de cambiar un asset, `plan --approve` clona solo planos obsoletos, reutiliza escenas/beats y actualiza dependencias de assets; `references --prepare` crea las versiones faltantes. Los renders anteriores permanecen en disco. Cambiar una referencia ya adjunta también invalida dependientes y exige replanificar/aprobar. Importar una dirección revisada crea una versión nueva del plano y requiere `references --prepare` para reconciliar sus bindings.

## Cola, permisos y fallos

Los jobs conservan fingerprint del paquete completo, intentos, timestamps, prompt_id y resultados. Ejecutar de nuevo un job exitoso no lo envía otra vez. Si desaparece o cambia su archivo, queda bloqueado para restauración o alternativa explícita. Una corrección usa un job nuevo; no destruye el historial.

Un POST sin respuesta confirmada deja estado `uncertain`. La reanudación no lo reenvía. Un ID remoto conocido se observa por `/history`; un timeout de observación conserva ese ID y el estado ejecutándose. Un error confirmado de backend queda fallido, y se propone una alternativa corregida. La CLI no cancela el backend al terminar su espera.

Los tokens de aprobación vinculan IDs, fingerprints, estimaciones, tipo de recurso, techo y expiración de 24 h. El presupuesto predeterminado externo es cero. `spent` representa una **reserva estimada** de recursos, no un recibo ni conciliación de facturación. No se liberan reservas de llamadas inciertas automáticamente. La ejecución pagada real solo se realiza mediante Codex con el conector autorizado y el costo actual del proveedor.

## QA y edición

Automatizado: existencia/hash, dimensiones y relación de aspecto derivada, FPS, duración con tolerancia, pistas de audio, decodificación completa, detección de negro y freeze. Negro/freeze son alertas para inspección, ya que un plano estático o un fundido intencional pueden ser válidos. La revisión temporal de identidad, manos, movimientos, continuidad, palabras, actuación y sincronía queda pendiente hasta evaluación explícita.

La selección exige QA técnico y revisión audiovisual. Las tomas nuevas reales con estilo vinculado requieren informe CinematicAssessment con reproducción, escucha, muestras temporales y checks explícitos. Además, la exportación cinematográfica aprobada requiere revisiones de continuidad y narrativa del timeline actual; --allow-pending produce un preview pendiente. Cambiar timeline invalida esas revisiones. El manifiesto incluye los dos niveles de QA de secuencia. Los in/out son obligatorios y se comparan con la duración real. No se genera una timeline seleccionando automáticamente todos los videos enteros. Las fuentes permanecen intactas. La timeline permite cortes directos, audio nativo/silenciado/externo por segmento, pistas de diálogo/música/efecto con offset, recorte y ganancia, normalización loudnorm, y subtítulos con tiempos explícitos. Se bloquea mezclar voz independiente con diálogo nativo activo. Se soportan archivos de TTS/voz externa; **no se implementó un motor TTS nuevo ni alineación forzada automática**.

El manifiesto registra las instrucciones de FFmpeg, hashes, timeline, jobs, versiones de skills y QA para reproducir el resultado. La normalización es una pasada de loudnorm; no se afirma mastering de dos pasadas. Los subtítulos automáticos de demo usan tiempos sintéticos identificados como tales; para audio real deben revisarse/importarse. La revisión de continuidad audiovisual de una secuencia real sigue requiriendo inspección temporal.

## Extensión

Un proveedor nuevo implementa `Adapter` con `capabilities`, `prepare` y `execute`. Debe declarar límites comprobados y escribir un ID remoto antes de esperar. Registra la capacidad y expón la selección en CLI; no escribas lógica narrativa dentro del adaptador. Usa una prueba de contrato, una prueba de recuperación ante fallo de transporte y una prueba real pequeña autorizada antes de marcarlo operativo.

Una skill nueva exige revisar procedencia/licencia, fijar commit, documentar su responsabilidad y añadir ruta en `src/tasks.ts`. No se convierte en autoridad narrativa salvo que pertenezca a Screenwriting y el usuario lo autorice. Los perfiles se validan por `Profile` y pueden importarse desde JSON; no precisan cambiar el pipeline.
