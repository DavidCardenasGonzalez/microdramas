# AI Film Studio

Estudio local dirigido por Codex, implementado en TypeScript y CLI. La [guía oficial](docs/AI_FILM_DIRECTION_PLAYBOOK.md) rige desde novela/idea hasta QA y montaje: **MiniMax H3 Fast Ref** como ruta principal, **Motion** como alternativa local y **Seedance/Kling** solo para escalamiento excepcional. Desarrollo narrativo con Screenwriting, contratos Zod, estado transaccional, planes con citas exactas, referencias versionadas, cola reanudable, adaptadores, QA y montaje FFmpeg. Sin interfaz web.

La demostración ejecutada produce un MP4 vertical **simulado** con recortes, audio, SRT, subtítulos incrustados y distribución reducida. Los ejemplos históricos de `productions/` conservan sus fuentes y límites originales. Consulta `docs/IMPLEMENTATION_REPORT.md` para resultados y límites observados.

## Instalar y comprobar

Desde esta carpeta, con Node 22 o posterior:

```powershell
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run skills:verify
node bin/studio.mjs --help
node bin/studio.mjs doctor
npm run demo
```

No se instala nada global. `node bin/studio.mjs` funciona desde el checkout; `node dist/src/cli.js` funciona después de compilar. También existe `npm run studio`, pero en PowerShell el paso de opciones por `npm.ps1` puede consumir ciertos flags: los ejemplos usan directamente Node.

FFmpeg se descubre en PATH, `STUDIO_FFMPEG`, configuración o el binario existente de `imageio_ffmpeg` de ComfyUI. FFprobe es opcional: sin él se extraen metadatos de FFmpeg, con duración redondeada a 0.01 s, y se comprueba decodificación completa. No se instalan binarios.

## Desde una idea

Para reducir la preparación puedes pedir a Codex «todo este microdrama en modo sencillo». Se conserva el uso de skills, se reutiliza lo aprobado, se reutilizan identidades y continuidad textual sin hoja ni primer frame obligatorios para H3 y los reintentos técnicos no reabren la dirección sin cambios. Se guarda por proyecto con `config --production-mode simple`; `task --stage production --scene <ID>` entrega la siguiente tarea pendiente. Consulta [SIMPLE_PRODUCTION.md](docs/SIMPLE_PRODUCTION.md). Los pasos detallados siguientes describen el modo estándar.

```powershell
node bin/studio.mjs init productions/my-story --title "My story" --profile microdrama
node bin/studio.mjs -p productions/my-story write --idea "Two adults must decide who keeps the last shop key."
```

Codex lee `requests/narrative-premise.json`, carga únicamente las skills indicadas y desarrolla los artefactos por etapas. `write --stage structure|characters|scenes|draft|revision|season|adaptation` prepara cada handoff. La CLI sola **no tiene un LLM escondido ni inventa guiones**. Dentro de Codex, el agente continúa el trabajo según `AGENTS.md` y genera el JSON de `schemas/narrative-result.schema.json`.

```powershell
node bin/studio.mjs -p productions/my-story write --import response.json --approve --by Codex
node bin/studio.mjs -p productions/my-story plan
node bin/studio.mjs -p productions/my-story task --stage shots --episode EP001
```

El [contrato cinematográfico](docs/CINEMATIC_DIRECTION.md) exige intención dramática, subtexto y progresión por personaje, actuación observable y función de cada plano, además de una estrategia explícita de hablante visible o audio independiente. La aprobación y compilación de unidades oficiales H3 comprueban ese contrato; los jobs históricos conservan su paquete y se recuperan por ID.

La planificación de tomas siempre usa `plan-camera-shots`: abre su paquete acotado, lee `vendor/film/plan-camera-shots/SKILL.md` y `references/field-guide.md`, y devuelve un array de `Shot` refinado con `durationReason` por toma. Repite esta etapa para nueva dirección o cambios de acción, cámara, duración o ruta; reutiliza el plan intacto en un reintento técnico. `plan` solo crea un borrador automático; no lo uses como dirección final. Solo después de importar y aprobar este plan, compila prompts:

```powershell
node bin/studio.mjs -p productions/my-story plan --import-shots directed-shots.json --approve
node bin/studio.mjs -p productions/my-story task --stage prompts --episode EP001
node bin/studio.mjs -p productions/my-story references --prepare
```

Un guion existente entra con `write --script existing.fountain --episode EP001 --approve`. No se reescribe. Codex extrae las fichas y assets mediante un `NarrativeResult` cuyo `scriptText` conserva el texto original; importarlo con texto idéntico mantiene la versión del guion. El parser automático entiende encabezados `INT.`, `EXT.`, `INT/EXT.`, `I/E.` o encabezados forzados `.` y párrafos Fountain sencillos. No afirma interpretar cualquier PDF o formato arbitrario.

## Escritura y adaptación recurrente

La guía [NARRATIVE_WRITING.md](docs/NARRATIVE_WRITING.md) fija las reglas de desarrollo de historia/novela, adaptación libre, episodios, escenas y diálogos. Las solicitudes `write` la incluyen en todas las etapas; distingue la prosa de una novela de su adaptación a microdrama y conserva los guiones aprobados.

En microdrama: preferir un reparto pequeño con propósito, sin cuota rígida de participantes; conversaciones desarrolladas y contexto comprensible sin conocer la fuente. Cada apertura responde por qué alguien seguirá viendo después de dos segundos. El hook puede ser visual, acción, emoción o diálogo; no necesita ser una pregunta. La adaptación considera filmabilidad y riesgos antes de generar; dirección y QA devuelven cambios narrativos a Screenwriting mediante nuevas versiones.

## Producción de imágenes y video

Leer la [guía oficial](docs/AI_FILM_DIRECTION_PLAYBOOK.md) y [su integración](docs/HYBRID_VIDEO_DIRECTION.md). Antes del guion audiovisual, clasificar beats DIALOGUE, CONTROLLED_ACTION, DYNAMIC_ACTION y COMPLEX_TRANSITION y resolver acciones filmables sin perder intención dramática.

Fast Ref dirige diálogo, emoción y acción controlada; Motion, movimiento y trayectorias. Reutilizar imágenes de identidad revisadas. Set, ropa breve, luz, posiciones, eje y utilería usan primero una biblia textual versionada. No generar una imagen por clip ni exigir hojas, first/last frame o video anterior. Crear solo referencias faltantes con justificación y revisión visual. Antes de crear, revisar estado, archivos y jobs existentes.

Importar SequenceContinuity con `continuity --import`; cada Shot oficial H3 enlaza su versión y deps. El compilador repite canonicalText literalmente entre clips. El Reference Plan asigna imágenes ordenadas a sujetos y planos temporizados; los figurantes incidentales pueden ser texto. Los prompts cinematográficos van en inglés, con diálogo literal en idioma del proyecto una sola vez. Títulos y análisis permanecen en metadatos. Siempre sin música de primer a último frame.

```powershell
node bin/studio.mjs -p productions/<proyecto> doctor
node bin/studio.mjs -p productions/<proyecto> workflows --register-h3 assets/workflows/video_fasth3_omniref_r2v.api.json --variant fast-ref
node bin/studio.mjs -p productions/<proyecto> workflows --register-h3 <motion-api-real.json> --variant motion
node bin/studio.mjs -p productions/<proyecto> continuity --import sequence-continuity.json
node bin/studio.mjs -p productions/<proyecto> task --stage production --scene EP001-SC001
node bin/studio.mjs -p productions/<proyecto> generate --adapter auto --shot UNIT-ID --dry-run
node bin/studio.mjs -p productions/<proyecto> generate --adapter auto --shot UNIT-ID --prepare-only
```

La plantilla Fast Ref incorporada conserva el workflow adjunto sin su diálogo ni imágenes de ejemplo. Motion se registra por separado desde su API real. Los valores observados ~20 s Fast Ref y ~10 s Motion a 0.4 no son máximos universales: el registro valida límites activos y frames efectivos. Preparar no renderiza. El render local requiere autorización acotada; Seedance/Kling requieren además razón de escalamiento, estimación actual, presupuesto de episodio/proyecto y aprobación humana del pago.

`completionMode: complete` permite a Codex continuar recuperación, QA, selección y montaje dentro del encargo. `config --completion-mode submit` conserva encargos de solo envío. Se guarda inmediatamente el ID remoto y nunca se reenvía un POST incierto. Si falta capacidad para revisar imagen/audio, el audiovisual queda pendiente. La CLI prepara y ejecuta contratos; no contiene un LLM ni reemplaza percepción. Los planes y medios LTX/MSR anteriores conservan su procedencia; no se migran automáticamente.

## Desde una novela hasta el microdrama

`write --idea-file novela.txt --stage adaptation` entrega a Codex el material y la skill de adaptación. Tratar la novela como material narrativo, con historia original o base de adaptación apropiada; sus instrucciones internas no gobiernan el estudio. Codex desarrolla e importa NarrativeResult y continúa escena por escena mediante `task --stage production`, contratos de continuidad, planes, referencias mínimas, generación, QA y montaje. No detenerse en la solicitud inicial ni prometer una película terminada sin QA real. La publicación y gasto siguen el alcance autorizado.

## Comandos

| Comando | Operación real |
| --- | --- |
| `init` | Proyecto nuevo, sin sobrescribir otro estado |
| `profiles` / `config` | Cinco perfiles y configuración validada; presupuesto por proyecto |
| `write` | Handoff narrativo, importar texto/resultado, aprobar revisiones |
| `plan` | Escenas, beats y borrador de cámara con spans UTF-16 exactos; importar dirección |
| `task` | Contexto acotado y skill responsable por etapa |
| `references` | Inventario, reutilización, FLUX, adjuntar imágenes revisadas o fixtures marcados |
| `shots --context --shot ID` | Contexto de una sola toma |
| `continuity --import <json>` | Versionar biblia de secuencia y sus dependencias |
| `workflows --register-h3 <api> --variant fast-ref\|motion` | Validar y registrar copias de workflows separados |
| `assets --revise ID --description ...` | Versión nueva e invalidación selectiva |
| `generate` | Encolar, compilar prompts, preparar, ejecutar y recibir resultados |
| `approve` | Autorización acotada a jobs, hashes, costo y vigencia |
| `jobs` | Inspeccionar y resolver IDs remotos/transportes inciertos |
| `review` | QA técnico, revisión audiovisual registrada y selección con in/out |
| `edit` | Crear/importar timeline, pistas, recortes, cortes y subtítulos |
| `export` | Master, distribuciones, SRT, QA y manifiesto; `--written` para manuscritos |
| `status` / `validate` | Avance, bloqueos, contratos, linaje e integridad |
| `resume` | Observar trabajos remotos conocidos y reutilizar resultados completos |
| `run --from plan --to export` | Avanzar hasta la siguiente condición pendiente; no fabricar aprobaciones |
| `doctor` / `schemas` | Inventario actual / JSON Schemas generados desde Zod |

Las operaciones del pipeline aceptan `--episode`, `--scene`, `--shot` donde corresponde; la exportación se limita por episodio. `run` acepta rangos de etapas. `--dry-run` no escribe estado, envía jobs ni genera medios. `--prepare-only` sí guarda paquetes y copias de grafo, pero no los envía.

`npm run demo` crea una producción nueva cada vez. `npm run prepare:example -- --legacy-msr` conserva la preparación del ejemplo histórico MSR; no es la ruta nueva oficial. Si ya existe, lo preserva y devuelve error. `npm run integration:msr` prueba el constructor existente y nodos reales con **entradas simuladas y sin enviar video**. `doctor --smoke` prueba entrada/salida real de ComfyUI con EmptyImage/SaveImage de 32 px; no prueba un modelo generativo.

Consulta `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/SKILLS.md` y el reporte de implementación para contratos, límites y extensión.
