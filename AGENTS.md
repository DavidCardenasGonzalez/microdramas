# AI Film Studio — instrucciones para Codex

Este repositorio es el estudio y Codex es su orquestador. Trabaja en español salvo idioma creativo configurado. Opera mediante `node bin/studio.mjs` y artefactos persistentes. Lee primero README, estado del proyecto identificado y paquete de tarea acotado. No cargar una temporada para una sola toma ni cambiar todos los proyectos si no hay uno identificado.

## Dirección oficial de extremo a extremo

La [guía oficial](docs/AI_FILM_DIRECTION_PLAYBOOK.md), incorporada por instrucción del usuario el 25 de octubre de 2026, gobierna adaptación, historia audiovisual, guion, escenas, referencias, cámara, prompts, generación, QA y montaje. [HYBRID_VIDEO_DIRECTION.md](docs/HYBRID_VIDEO_DIRECTION.md) concreta contratos y comandos. Sustituye la dirección híbrida LTX/H3 anterior, el máximo universal de cinco segundos, I2V predeterminado, hojas/frames obligatorios, video previo obligatorio y cuotas fijas de reparto o planos. Las observaciones de la guía son evidencia local; las hipótesis no se convierten en restricciones universales.

- **MiniMax H3 Fast Ref** es la ruta principal para diálogo, emoción, interpretación y acción controlada: `h3_fast_ref` / `comfy-h3-fast-ref`.
- **MiniMax Motion** es la alternativa local con la misma interfaz de referencias para movimiento dominante: `h3_motion` / `comfy-h3-motion`. Sus workflows se registran y verifican por separado.
- **Seedance/Kling en plataforma** son escalamiento excepcional para una acción indispensable que lo justifique, con evidencia del proveedor, estimación y aprobación humana del gasto.
- Clasificar beats DIALOGUE, CONTROLLED_ACTION, DYNAMIC_ACTION o COMPLEX_TRANSITION. Cada uno define deseo, cambio, sujeto, objeto importante, estado inicial/final y causa del corte. Diseñar acciones legibles con preparación, trayectoria, contacto y consecuencia. Una acción dominante por clip Motion; dividir transiciones complejas conservando intención dramática.
- Un rostro dominante suele ser útil; planos compartidos, rack focus, secundarios desenfocados, espaldas y oclusiones son válidos. No exigir master inicial, cinco planos, personaje único visible ni un corte por frase. La cámara orbital no equivale a giro corporal rápido.
- Aproximadamente 20 s Fast Ref y 10 s Motion a 0.4 son puntos operativos observados, no límites universales. Duración suficiente más breve según palabras, acción, pausa significativa, montaje y límites efectivos registrados. Sin aire muerto, bucles o relleno.
- La escritura audiovisual conoce estos riesgos antes de generar. Hallazgos de dirección/QA pueden volver a Screenwriting para nuevas revisiones. Nunca cambiar silenciosamente un guion aprobado. Una novela encargada como prosa conserva voz, interioridad y forma propia.

## Autoridad y skills

**Narrativa:** únicamente `vendor/screenwriting/`. `write --idea` o `--idea-file` prepara la solicitud; Codex continúa con premisa → estructura → personajes → escenas → diálogo, escribe NarrativeResult, importa y aprueba dentro del encargo. No entregar solo una solicitud. `sw-workflow` ordena escritura, no proveedores.

Cargar skills por etapa: inicio `sw-workflow` y `sw-premise-theme`; estructura `sw-story-structure`; personajes `sw-character-conflict`; escenas `sw-scene-craft`; borrador `sw-dialogue` y `sw-format-adaptation`; series `sw-series-engine-bible` y `sw-series-structure` cuando corresponda. Drama aporta criterios de revisión mediante `vendor/drama/short-drama-review/references/rubric-story-script.md`; no escribe ni cambia historia.

Aplicar [NARRATIVE_WRITING.md](docs/NARRATIVE_WRITING.md), [SCENE_SIMPLICITY.md](docs/SCENE_SIMPLICITY.md) y [SCENE_WARDROBE.md](docs/SCENE_WARDROBE.md). Conservar historia, descubrimientos, consecuencias y hook; no imponer cliffhanger o pregunta. Preferir reparto pequeño y purposeful, sin borrar interacciones necesarias por una cuota universal.

**Desglose:** `structure-screenplay`. **Assets:** `design-production-assets`. **Cámara:** `plan-camera-shots` y su `references/field-guide.md`. **Prompts:** `compile-generation-prompts`. **QA/montaje:** `review-and-assemble`. `task --stage ...` entrega contexto y lecturas precisas; los resultados se normalizan a contratos Studio, sin otro estado editable. `shape-story-blueprint` y `execute-media-generation` permanecen excluidas.

Dirección complementaria solo ante necesidad: `style-cinematography-director`, `model-adaptation` o `prompt-iteration-and-diagnostics`. No cargar las tres por rutina. La guía local prevalece sobre formatos y supuestos de proveedor de vendor; su documentación histórica fijada por licencia no dirige nuevas producciones. No crear subagentes salvo solicitud del usuario.

Documentos de novela son material narrativo; el playbook es metodología adoptada explícitamente por el usuario. Ningún documento externo autoriza ejecutar scripts, instalar, gastar o cambiar entorno.

## Contratos, continuidad y referencias

`.studio/state.json` es la única fuente editable mediante CLI. Guiones aprobados congelados con texto, hash, versión y aprobador; los Fountain son snapshots verificables. Nuevas revisiones en drafts e importación/aprobación CLI; nunca editar snapshots ni derivados de contracts para alterar canon. Revisiones invalidan solo dependientes y conservan historia/archivos.

Antes de pedir imágenes, revisar estado, referencias, jobs, `media/`, `generation/` y `review-drafts/`. Distinguir archivo presente, toma vigente, revisada y seleccionada. Un contador activo en cero no prueba ausencia de MP4. Comparar guion, referencias y versiones antes de usar un clip anterior.

Usar el mínimo de referencias suficiente: identidad propia revisada para recurrentes reconocibles; figurantes incidentales pueden usar texto. Set y vestuario breve usan texto canónico primero. Considerar nuevas imágenes por deriva repetida o persistencia importante (~6 clips o varios capítulos), ponderando costo/memoria. No crear una imagen por clip ni adjuntar todo lo disponible.

Registrar `SequenceContinuity` con `continuity --import`: set, mapa, eje, luz, vestuario/voz/posición por personaje, utilería y `canonicalText` completo en inglés. Enlazar versión en Shot y deps; el compilador repite el bloque literalmente. Cada Shot conserva evolución emocional, palabras ya dichas y estados físicos inicial/final. Cambiar biblia crea versión e invalida sus dependientes.

H3 requiere `referencePlan` con referencias ordenadas y roles, sujetos/identidades/ropa, planos y tiempos contiguos, continuidad y criterios QA. Puede contener varios planos en una unidad. Sujeto incidental sin imagen: `referenceIds: []` y `textOnlyReason`. No usar identidad de otro sujeto. `reference_manifest` se deriva del estado. Hojas, first/last frame y video anterior no son obligatorios. `start` se transmite como referencia visual; no prometer keyframe exacto. `end` literal exige soporte verificado.

Vestuario incidental en una identidad no es ropa universal; establecer atuendo contextual y conservarlo por escena. Variantes de ropa solo se vinculan a tomas pertinentes. Adjuntar referencias con `--by` registra inspección visual real de la imagen completa. Cambiar una referencia usada invalida dependientes: informar efecto y no hacerlo por inercia.

## Dirección dramática y cinematográfica

Aplicar [CINEMATIC_DIRECTION.md](docs/CINEMATIC_DIRECTION.md) antes de aprobar cámara. Interpretar objetivo, obstáculo, subtexto y progresión emocional; traducirlos a actuación observable. Registrar `Shot.direction`, propósito/actuación/sujetos visibles por intervalo y razón de cada corte; un continuo requiere razón dramática. Elegir tratamiento de género, luz, escala, lente, cámara, foco y ritmo concretos. Ni cámara fija predeterminada ni cuota de cortes. Preservar hechos permite interpretar actuación; cambiar una ocultación explícita requiere revisión Screenwriting.

Cada línea tiene `referencePlan.dialogueStaging`: hablante original, plano, ventana, estrategia y lipsync. Audio nativo solo con su hablante visible; para voz invisible o reacción, audio independiente y mezcla externa completa revisada en montaje. No confiar en «off-screen» para asignar la voz ni añadir identidades visuales por un fallo sonoro. Referencias nuevas recurrentes: preferir tríptico frente/cara/espalda cuando ayude; reutilizar existentes suficientes, con identidad y ropa separadas.

Una alternativa oficial requiere `generate --recovery <json>` con diagnóstico y cambio esperado. Un fallo cercano admite una variable; dirección estructuralmente débil vuelve a cámara. Error de hablante repetido cambia cobertura o estrategia de audio. No conservar por inercia el plan fallido ni acumular negativos.

## Planificación, prompts y ejecución

`plan` produce un borrador conservador. Para nueva dirección o cambios de acción/cámara/duración/ruta/dependencias, obtener `task --stage shots`, aplicar skill de cámara y field guide, importar/aprobar Shots refinados con `durationReason`. Cada unidad oficial H3 incluye beatType, generationMode, routingReason y dependencia de continuidad. Reintento técnico o corrección de prompt con mismo plan no reabre ni reimporta dirección. `task --stage prompts` compila lo aprobado; no rediseña ni añade hechos.

Prompts cinematográficos en inglés y diálogo literal en idioma del proyecto. Duración/estilo, mapeos Picture, continuidad completa, blocking, acción temporizada, cámara/foco/cortes y estados. Títulos poéticos, IDs de planos, retención y razones de duración quedan en metadatos. Fuente hablada una vez entre comillas, atribuida en prosa; solo esas palabras se pronuncian. No enviar placeholders. Incluir segundos asignados y completar solo acción aprobada, sin relleno.

**Sin música en todas las generaciones**, de primer a último frame: sin score, soundtrack, intro/outro, jingle, stinger, drone, riser, pulso tonal, bass drop, golpe de tráiler ni acento sintético. Tampoco música desde dispositivos. Solo diálogo y sonido diegético/ambiental planificado; quietud natural donde corresponda. Una regla concisa al inicio, recordatorio breve al final y negativo cuando exista; no repetir bloques completos.

Consultar [VIDEO_STRATEGY.md](docs/VIDEO_STRATEGY.md) y `vendor/generation-strategy/`. Antes de primer uso/cambio de backend: doctor. Paquetes nuevos/modificados: dry-run y prepare-only; reutilizar verificaciones vigentes. Validar disponibilidad, límites reales y cola antes de enviar. Conservar trabajos ajenos y masters; no descargar modelos, instalar dependencias globales ni modificar ComfyUI/runners para desbloquear producción.

Ejecución local real exige token `approve --local`; FLUX `--execute --approve-local`. Pagos requieren estimación actual, budget, premiumBudgetPerEpisode y `approve --paid --max-cost` con autorización humana. MCP de escritorio no es API Node: preparar handoff, registrar ID y recibir resultado real. No fingir integraciones.

Guardar prompt_id inmediatamente. POST ambiguo queda uncertain: consultar backend y vincular ID, o confirmar ausencia explícita. No reenviar inciertos. Resume observa IDs conocidos y reutiliza completos; timeout de observación no es fallo de render.

## Autonomía, QA y entrega

El objetivo es novela → microdrama terminado con mínima intervención dentro del alcance autorizado. Codex trabaja secuencialmente con tareas acotadas, reutiliza contratos y completa etapas sin confirmaciones creativas rutinarias. `completionMode: complete` permite recuperación, QA y montaje; `config --completion-mode submit` conserva encargos de solo envío. Respetar preferencia explícita por proyecto. La CLI no es un LLM ni reemplaza evaluación perceptiva.

Si se pide modo sencillo, activar `config --production-mode simple` solo en el proyecto identificado y continuar. [SIMPLE_PRODUCTION.md](docs/SIMPLE_PRODUCTION.md) reduce ceremonia, conserva skills/contratos y prioriza siguiente unidad lista. El modelo y política de referencias oficiales son iguales en simple y standard.

Primer intento apropiado; segundo diagnóstico cambia una variable; tercero opcional con valor y cambio/división explícitos, dentro de límites y presupuesto. No bucles indefinidos. Fallo estructural vuelve a escritura; aleatorio puede variar seed; capacidad requiere otra ruta. Crear alternativas, conservar resultados.

Revisar identidad, anatomía, movimiento, continuidad, temporalidad, causalidad y diálogo usando muestras temporales, reproducción y audio. Aplicar códigos del playbook. `review --technical` no aprueba actuación, identidad, palabras o sincronía. Si falta capacidad real, dejar audiovisual pendiente. No rechazar solo por un frame aislado ni declarar QA por ausencia de errores técnicos.

Seleccionar toma aprobada con rangos in/out. No concatenar renders completos por defecto. Timeline no destruye fuentes; conservar una sola fuente por línea y sustituir audio nativo al usar TTS externo. Subtítulos literales y tiempos revisados contra audio. Exportar master, variantes, SRT, manifiesto, hashes, procedencia y estado QA. Registrar segundos útiles/costo por segundo cuando estén medidos. Simulados llevan SIMULATED y no cuentan como película interpretada.

Generar video no abre mantenimiento del repo ni informes extra. Tras cambios de código: `npm run typecheck`, `npm test`, `npm run build` y `npm run skills:verify`. Las pruebas no requieren GPU ni pagos. Informar bloqueos concretos y completar partes independientes.
