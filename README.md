# AI Film Studio

Estudio local dirigido por Codex, implementado en TypeScript y CLI. Desarrollo narrativo con Screenwriting, contratos Zod, estado transaccional, planes con citas exactas, referencias versionadas, cola reanudable, adaptadores, QA y montaje FFmpeg. Sin interfaz web.

La demostración ejecutada produce un MP4 vertical **simulado** con recortes, audio, SRT, subtítulos incrustados y distribución reducida. El primer proyecto real está preparado en `productions/first-microdrama`; requiere cuatro referencias reales revisadas. Consulta `docs/IMPLEMENTATION_REPORT.md` para resultados y límites observados.

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

Codex refina el borrador de cámara con el paquete y devuelve un array de `Shot`:

```powershell
node bin/studio.mjs -p productions/my-story plan --import-shots directed-shots.json --approve
node bin/studio.mjs -p productions/my-story references --prepare
```

Un guion existente entra con `write --script existing.fountain --episode EP001 --approve`. No se reescribe. Codex extrae las fichas y assets mediante un `NarrativeResult` cuyo `scriptText` conserva el texto original; importarlo con texto idéntico mantiene la versión del guion. El parser automático entiende encabezados `INT.`, `EXT.`, `INT/EXT.`, `I/E.` o encabezados forzados `.` y párrafos Fountain sencillos. No afirma interpretar cualquier PDF o formato arbitrario.

## Primera producción real ya preparada

Guion original en inglés B1, Nora y Eli, una tienda y una llave; cuatro tomas de 9, 12, 12 y 5 s. Perfil 720×1280, 24 FPS, un episodio. La dirección está en los contratos del proyecto y en `src/example-direction.ts`.

Coloca cuatro imágenes reales adecuadas en una carpeta de fuentes y revísalas. Adjunta cada una sin alterar sus originales:

```powershell
node bin/studio.mjs -p productions/first-microdrama references --attach C:/sources/nora.png --id REF-ASSET-NORA --by Codex
node bin/studio.mjs -p productions/first-microdrama references --attach C:/sources/eli.png --id REF-ASSET-ELI --by Codex
node bin/studio.mjs -p productions/first-microdrama references --attach C:/sources/shop.png --id REF-ASSET-SHOP --by Codex
node bin/studio.mjs -p productions/first-microdrama references --attach C:/sources/key.png --id REF-ASSET-KEY --by Codex
node bin/studio.mjs -p productions/first-microdrama generate --adapter msr --shot EP001-SC001-SH001 --dry-run
node bin/studio.mjs -p productions/first-microdrama generate --adapter msr --shot EP001-SC001-SH001 --prepare-only
node bin/studio.mjs -p productions/first-microdrama approve --shot EP001-SC001-SH001 --local --reason "First local shot test"
```

La última orden devuelve `APPROVAL-...`. Usa ese valor exacto:

```powershell
node bin/studio.mjs -p productions/first-microdrama generate --adapter msr --shot EP001-SC001-SH001 --execute --approval APPROVAL-ID
node bin/studio.mjs -p productions/first-microdrama review --shot EP001-SC001-SH001 --technical
node bin/studio.mjs -p productions/first-microdrama status
```

Revisa el clip completo y el audio antes de registrar `review --take TAKE-ID --verdict pass --by Codex --finding "..."`. Selecciona solo su intervalo útil con `review --select TAKE-ID --in 0.4 --out 8.5` (ejemplo; usa tiempos reales). Repite por las otras tomas y crea `edit --episode EP001`. Importa la timeline con tiempos de subtítulos verificados mediante `edit --import reviewed-timeline.json`; exporta con `export --episode EP001 --burn-subtitles`. Puedes exportar un montaje preliminar con `--allow-pending`; su estado de calidad no se presenta como aprobado si faltan subtítulos revisados.

**Bloqueo actual de referencias:** la plantilla FLUX existe, pero el servicio activo no anuncia `flux3-image-klein-int8-convrot.safetensors`, `qwen3vl_4b_int8_convrot.safetensors`, `qwen3.5_9b_flux3_prompt_upsampler_w4a8.safetensors` ni `flux3-flux2-vae.safetensors`. No se descargaron ni sustituyeron. Puedes aportar imágenes existentes o habilitar en ComfyUI los modelos que ya tenías. Los pasos concretos están en `docs/INTEGRATIONS.md`.

Cuando FLUX vuelva a estar disponible, `references --generate --id REF-ASSET-NORA` prepara y valida una copia del grafo. Añade `--execute --approve-local` para inferencia local; `--source <imagen>` activa la variante con referencia. El resultado queda como candidato, pendiente de inspección y `--attach`. Una plantilla sin modelos disponibles queda bloqueada antes del render.

La instrucción para Codex, sin otra fase de arquitectura, es: **«Continúa `productions/first-microdrama` según AGENTS.md. Prepara o vincula sus cuatro referencias reales con las herramientas autorizadas, revisa las imágenes y ejecuta primero `EP001-SC001-SH001` con MSR local. Revisa imagen y audio antes de continuar las otras tomas; monta solo los segmentos útiles y conserva los pendientes explícitos. No uses servicios pagados.»** La única condición externa actual son las referencias reales o recuperar los modelos FLUX del servicio activo.

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

`npm run demo` crea una producción nueva cada vez. `npm run prepare:example` crea el ejemplo real; si ya existe, lo preserva y devuelve error. `npm run integration:msr` prueba el constructor existente y nodos reales con **entradas simuladas y sin enviar video**. `doctor --smoke` prueba entrada/salida real de ComfyUI con EmptyImage/SaveImage de 32 px; no prueba un modelo generativo.

Consulta `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/SKILLS.md` y el reporte de implementación para contratos, límites y extensión.
