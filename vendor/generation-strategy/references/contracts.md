> Compatibilidad histórica LTX/MSR, fuera de la ruta oficial nueva. Leer solo para planes heredados o una petición explícita. Fast Ref/Motion y los contratos Studio se rigen por [la guía oficial](../../../docs/AI_FILM_DIRECTION_PLAYBOOK.md). No crear el journal ni biblioteca paralelos descritos aquí para proyectos Studio.

# Contratos, persistencia y comandos

No se encontró un contrato de estudio/orquestador versionado ya instalado en `user/` durante esta integración. Este formato v1 sirve como handoff técnico local; **no** se presenta como compatible automáticamente con los repositorios externos. Conserva IDs de sus artefactos y escribe un mapeo explícito si se conectan más adelante, sin modificar las skills narrativas.

Todos los comandos usan Python estándar, no contactan proveedores ni generan imágenes/videos. Raíz del skill: `<PROJECT_ROOT>/vendor/generation-strategy`. Proyecto: `<COMFYUI_ROOT>/user/productions/<slug>/`. Estado reutilizable: `<COMFYUI_ROOT>/user/generation_strategy/`.

## Entrada validada

`plan.json` necesita `schema_version: 1`, `project_id`, `plan_approved: true` y `shots` no vacío. Esa bandera registra una aprobación real recibida, no debe inventarse para pasar el validador. Cada toma: `id` único, `intent`, `framing`, `action`, `camera`, `lighting`, `duration_seconds` positiva. Opcionales: `scenario` (clase de plano para comparar evidencia), `subjects`, `fps`, `seed`, `orientation`, `resolution: {width,height}`, `motion_complexity`, `head_turn_degrees`, `identity_required`, `identity_references`, `first_frame`, `last_frame`, `last_frame_required`, `endpoints_compatible`, `requested_mode`, `requested_model`, `required_capabilities`, `continuation_source`, `postprocess`, `dialogue` y sus presupuestos. No inventes compatibilidad de extremos sin revisar ambas imágenes.

Ejemplo mínimo de plan técnico, no autorización de generación:

```json
{
  "schema_version": 1,
  "project_id": "example_plan",
  "plan_approved": true,
  "shots": [{
    "id": "S01",
    "intent": "Establish the deserted town before the arrival.",
    "framing": "wide establishing shot",
    "action": "Dust crosses the empty street.",
    "camera": "slow controlled pan",
    "lighting": "late afternoon sunlight",
    "duration_seconds": 5,
    "subjects": 0,
    "seed": 42
  }]
}
```

`dialogue` es una lista de `{speaker,text,rate_wpm}`. Registra `pauses_seconds`, `exclusive_action_seconds`, `cut_margin_seconds` sin duplicar acciones simultáneas al habla. I2V es el modo predeterminado: si no hay `first_frame`, el selector solicita ese asset. `requested_mode` permite una excepción deliberada; si se proporciona `last_frame`, FLF2V solo se elige automáticamente cuando ambos frames existen y `endpoints_compatible: true` (salvo que `last_frame_required: false`). Sin `resolution`, I2V solicita 0.6 MP (0.8 MP para encuadre abierto); `resolution_megapixels` o `resolution` explícitos prevalecen. La estimación de diálogo no valida pronunciación ni garantiza tiempos de LTX. Guarda el prompt final exacto enviado al API.

## Salida y estados

`strategy.json` guarda por toma técnica/modelo/workflow y hash, intención neutral, prompt base, frames/referencias y faltantes, configuración solicitada, presupuestos, riesgos, alternativas condicionadas, justificación, evidencia local y criterios de validación. `blocked` = restricción no cumplida; `needs_assets` = faltan imágenes; `planned` = propuesta que aún necesita revisión/API/preflight, **no** `ready_to_render`. El script no exporta API ni llena parámetros específicos de nodos.

En `execution/events.jsonl` o biblioteca `experiments.jsonl`, cada evento lleva `event_id` idempotente, `shot_id`, `take_id` nuevo por versión, y `state`. Secuencia validada: planned → preflight → submitted → running/generated/failed → reviewed → selected/rejected → assembled → exported. planned/preflight pueden terminar blocked. Un error se reintenta con **otra toma/version**, no borrando historia. Submitted requiere `prompt_id`; generated requiere un archivo existente. Para reviewed conserva `file`, `scenario`, `mode`, `workflow_sha256`, `review_decision` (`accept`/`reject`/`pending`), evidencia de QC, parámetros, seed(s), defectos, corrección, tiempo y costo si se midieron, o null si no.

El registro bloquea escrituras concurrentes y rechaza colisiones/estados fuera de secuencia; un `.lock` residual tras caída exige comprobar que no hay escritor activo antes de retirarlo. No es un scheduler distribuido. Al reanudar consulta manifiestos y `/history/<prompt_id>`; un estado incierto no habilita reenviar el mismo trabajo. El selector puede leer historia real mediante `--history`; solo toma resultados reviewed con mismo escenario, modo/hash y archivo existente. Dos rechazos comparables exigen replantear; no aprende pesos ni convierte anécdotas en hechos universales. El agente debe distinguir diferencias de parámetros antes de considerar comparables los registros.

Ficha de biblioteca `characters.json`: `id`, `version` positiva, `masters` (rutas existentes), `invariants`, `views`, `wardrobes`, `visual_review`. El comando preserva versiones previas, pero no evalúa imágenes por sí mismo. Usar IDs estables entre proyectos; antes de generar consultar biblioteca y registrar cobertura faltante.

## Uso en PowerShell

```powershell
$strategyTool = '<PROJECT_ROOT>/vendor/generation-strategy\scripts\strategy.py'
py $strategyTool inspect --output '<COMFYUI_ROOT>/user/generation_strategy/capability_inspection.json'
py $strategyTool select --input '<COMFYUI_ROOT>/user/productions/<slug>\plan.json' --output '<COMFYUI_ROOT>/user/productions/<slug>\strategy.json'
# Opcional: --history '<ruta al journal JSONL de resultados revisados>'
py $strategyTool evaluate --output '<COMFYUI_ROOT>/user/generation_strategy/evaluation_plans.json'
py $strategyTool record --input '<evento.json>' --output '<COMFYUI_ROOT>/user/generation_strategy/experiments.jsonl'
py $strategyTool character --input '<ficha.json>' --output '<COMFYUI_ROOT>/user/generation_strategy/characters.json'
py -m unittest discover -s '<PROJECT_ROOT>/vendor/generation-strategy\tests' -v
```

`inspect` no prueba instalación de modelos; expone los nombres referidos y hashes actuales. Si el workflow cambió desde `capabilities.json`, el selector bloquea: inspecciona conexiones/capacidades, actualiza la receta y solo entonces el hash registrado. Las recetas de ejecución viven en los adaptadores existentes. Los tests usan temporales y fixtures, sin GPU. `evaluate` genera diez planes con variantes A–D y calidad null, no conclusiones de experimentos.
