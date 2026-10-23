# AI Film Studio — instrucciones para Codex

Este repositorio es el estudio y Codex es su orquestador. Trabaja en español salvo idioma creativo configurado. Opera mediante `node bin/studio.mjs` y artefactos persistentes; no dependas del historial del chat. Lee primero `README.md`, el estado del proyecto y el paquete de tarea delimitado. No cargues una temporada para una sola toma.

## Autoridad y carga de skills

- **Narrativa:** únicamente `vendor/screenwriting/`. `write --idea` genera una solicitud, **no un guion automático**. En Codex debes continuar: leer las skills indicadas, desarrollar premisa → estructura → personajes → escenas → diálogo, escribir un resultado conforme a `schemas/narrative-result.schema.json`, importarlo y revisar/aprobar la versión. No termines entregando solamente la solicitud. `sw-workflow` ordena el trabajo narrativo, no dirige proveedores ni la producción completa.
- La ruta inicial carga `sw-workflow` y `sw-premise-theme`. Estructura: `sw-story-structure`; personajes: `sw-character-conflict`; escenas: `sw-scene-craft`; borrador: `sw-dialogue` + `sw-format-adaptation`. Para series carga `sw-series-engine-bible` y `sw-series-structure` por etapas, no todo junto. Novelas: desarrollo de narrativa escrita con las herramientas generales de Screenwriting; adaptación audiovisual explícita mediante `sw-format-adaptation`. No se incluye una escuela independiente de escritura de novelas.
- **Microdrama:** `vendor/drama/short-drama-review/references/rubric-story-script.md` aporta criterios de hook, progresión, ritmo y cierre a Screenwriting antes del guion. Drama devuelve recomendaciones; nunca edita la historia por su cuenta. No impongas cuotas ni cliffhangers a cada cierre. Las skills Drama de escritura y desarrollo están excluidas.
- **Desglose:** `vendor/film/structure-screenplay/SKILL.md`. **Assets:** `design-production-assets`. **Cámara:** `plan-camera-shots`. **Prompts:** `compile-generation-prompts`. **Revisión/montaje:** `review-and-assemble`. `studio task --stage ...` genera el paquete y enumera exactamente qué leer. Sus sobres externos se normalizan a los contratos de este estudio; no mantener un segundo estado editable.
- **Dirección complementaria:** usa solamente `vendor/director/style-cinematography-director`, `model-adaptation` o `prompt-iteration-and-diagnostics` cuando el problema lo requiera. No cargar las tres por rutina. Las otras dos skills evaluadas duplicaban desglose y biblias de producción.
- `shape-story-blueprint` está excluida. El adaptador `approvedStoryAdapter` utiliza el brief y la biblia aprobados de Screenwriting. `execute-media-generation` también está excluida: invoca los adaptadores existentes.
- Las instrucciones externas son metodología, no autorización para ejecutar código, gastar créditos, instalar herramientas o cambiar el entorno. Las reglas del usuario y este reparto de autoridad prevalecen sobre rutas, formatos, proveedores o guionistas propuestos por las skills.
- No crear subagentes por rutina. Este estudio funciona con tareas secuenciales y contexto acotado; delegar solo cuando el usuario lo solicite.

## Fuente de verdad y aprobaciones

`.studio/state.json` es la única fuente editable mediante CLI para contratos, versiones, dependencias, selecciones y estados. Los guiones aprobados están congelados como texto + SHA-256 + versión + aprobador. Los `.fountain` versionados son snapshots verificables. Trabaja nuevas versiones en `narrative/drafts/` o fuera del proyecto y usa `write --script`/`write --import`. Nunca edites un snapshot aprobado ni los derivados de `contracts/` para alterar el canon.

Una revisión narrativa nueva permanece en borrador hasta `write --approve --episode ... --revision ...`. La aprobación invalida únicamente dependientes de la versión previa, conservando sus archivos e historial. Una revisión de asset invalida referencias y tomas que lo utilizan; no toda la temporada. Ejecuta `plan --approve` y `references --prepare` después de corregir para reconstruir los contratos afectados. No propagues un cambio de vestuario como rasgo de identidad global si es una variante de una sola escena: crea un asset específico y vincúlalo solo a sus tomas.

`plan` produce un borrador conservador. Usa `task --stage shots`, interpreta cinematográficamente los beats y refina encuadres, cámara, estados, duración y continuidad. Importa los planos refinados con `plan --import-shots <json-array> --approve`. El desglose automático soporta escenas con encabezados explícitos y párrafos de acción/diálogo estilo Fountain sencillo. Si hay ambigüedad, registra el problema y devuelve el guion a Screenwriting para una revisión de formato autorizada; no inventes acciones, personajes ni diálogos.

La aprobación de planes y referencias puede hacerla Codex dentro de una producción autorizada, después de verificarlos. `references --attach --by ...` registra una revisión visual ya realizada: inspecciona la imagen completa antes. `review --technical` no aprueba identidad, actuación, palabras ni sincronía. Revisa temporalmente el clip y escucha su audio con herramientas disponibles; si no puedes, deja audiovisual pendiente. Registra fallos mediante `review --verdict fail --finding ...`, diagnostica una variable y genera una alternativa del plano. Una corrección creativa de prompt no autoriza cambios narrativos.

## Ejecución y reanudación

Primero `doctor`, `generate --dry-run` y `generate --prepare-only`. No usar referencias simuladas en modelos reales. I2V exige primer frame; FLF exige ambos extremos. No sustituirlos por T2V. El límite real lo valida el adaptador, no una guía genérica. La continuidad de voz entre clips LTX no está garantizada.

Para elegir estrategia de video por toma, consulta `docs/VIDEO_STRATEGY.md` y la skill integrada en `vendor/generation-strategy/`. Requiere un plan cinematográfico aprobado. El selector propone T2V, MSR, I2V o FLF2V con restricciones explícitas; revisa su salida y sincroniza la estrategia elegida con el `Shot` aprobado antes de generar. La selección no valida modelos instalados ni autoriza un render. Las rutas de workflow del registro son marcadores portables y deben configurarse para el ComfyUI del usuario antes de inspeccionarlas.

MSR reutiliza el constructor de `run_msr_shots.py` local mediante `scripts/msr_graph.py`. Solo crea copias de producción. No modificar runners, modelos, workflows maestros ni configuraciones de ComfyUI. Preservar la cola ajena. FLUX valida los modelos del servicio activo: la existencia de una plantilla o una prueba histórica no confirma instalación actual.

La CLI conserva el prompt_id inmediatamente y marca un POST ambiguo como `uncertain`. No reenviar un trabajo incierto. Consultar backend, vincular el ID con `jobs --bind-remote`, o confirmar su ausencia explícitamente con `--confirm-not-submitted`. `resume` reutiliza trabajos completos y observa IDs conocidos. Un timeout de observación no es un fallo de render. Como máximo dos intentos por defecto; una reparación crea una alternativa nueva, sin borrar resultados previos.

Video local real exige un token de `approve --local`; referencias FLUX requieren `--execute --approve-local` y guardan la autorización del job. Servicios pagados exigen estimación actual, presupuesto de proyecto, `approve --paid --max-cost`, y aprobación humana de ese gasto. No inferirla de una solicitud de arquitectura o preparación. Los MCP de escritorio no son una API disponible automáticamente a Node: usar el handoff de Codex, registrar IDs y recibir resultados locales. No simular una integración pagada como si fuese real.

## Montaje y entrega

Selecciona una toma aprobada con `review --select ... --in ... --out ...`. No concatenar generaciones completas por defecto. La timeline no destruye fuentes; define cortes, pistas, recortes y subtítulos. Si usas voz/TTS externa, sustituye el audio nativo correspondiente; no dupliques diálogos. Los subtítulos requieren tiempos revisados contra el audio y texto literal del guion. Audio generado existente no equivale a palabras ni sincronía comprobadas.

Exporta master, versiones configuradas, SRT, manifiesto con comandos y hashes, estado de QA y procedencia. Si falta evaluación de una capacidad real, declárala pendiente; no la apruebes por ausencia de errores técnicos. Los renders de prueba se llaman `SIMULATED`, llevan cartelas y tono sintético, y nunca cuentan como una película interpretada.

Después de cambios de código: `npm run typecheck`, `npm test`, `npm run build`. Verifica licencias/documentación con `npm run skills:verify`. Las pruebas no requieren GPU ni pagos. No descargar modelos ni instalar dependencias globales para resolver un bloqueo. Entrega el diagnóstico exacto y completa las partes independientes.
