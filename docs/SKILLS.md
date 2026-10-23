# Skills integradas y selección

## Estrategia de generación de video

La skill local proporcionada por el usuario se integra en `vendor/generation-strategy/` como guía técnica para elegir por toma entre T2V, MSR, I2V y FLF2V, preparar referencias, diagnosticar bloqueos y registrar resultados. El selector es una herramienta local de planeación; no envía trabajos ni sustituye los adaptadores del estudio. Su registro de workflows usa marcadores portables que requieren configuración local. Consulta [VIDEO_STRATEGY.md](VIDEO_STRATEGY.md) para el procedimiento y sus límites.

Se inspeccionaron los cuatro repositorios solicitados, sus árboles, instrucciones y licencias antes de incorporar documentación. Las cuatro licencias son MIT y se conservan en `vendor/<source>/LICENSE`. No se instalaron plugins globales, runners upstream, dependencias Remotion ni generadores alternativos.

| Fuente | Commit fijado | Módulos locales |
| --- | --- | --- |
| [Screenwriting](https://github.com/jtydhr88/screenwriting-skills) | `51115f18d160aa8b2ac5813e4432b6f0b425358f` | 9 |
| [Drama](https://github.com/zenstory-ai/drama-skills) | `fdb7b7c58017e3eae64eca382c2a85ede368dab0` | 6 |
| [Film Production](https://github.com/zhangzhangco/film-production-skills) | `47b2a6a432235e716fa2aa0d08eefae76fdb34fd` | 5 |
| [Director](https://github.com/0xhughs/director-skills) | `35ca0a2b4cd55b0668aa9ea0f40273324b774bb4` | 3 |

Los cuatro repositorios externos aportan 23 módulos y 172 archivos fijados por licencia y hash. Además, se conserva la skill local de estrategia de video como fuente del usuario. `skills.lock.json` registra rutas originales, SHA-256 y versiones. `npm run skills:verify` verifica todos los archivos. `scripts/vendor-skills.mjs` solo descarga documentos de esos commits y confirma MIT; no ejecuta código upstream. Una nueva revisión requiere inspección de cambios y licencia antes de modificar la selección fijada.

## Screenwriting: única autoridad narrativa

Se seleccionaron `sw-workflow`, `sw-premise-theme`, `sw-story-structure`, `sw-character-conflict`, `sw-scene-craft`, `sw-dialogue`, `sw-format-adaptation`, `sw-series-engine-bible` y `sw-series-structure`.

Para un corto o microdrama inicial: workflow/premisa, después estructura breve, personajes, escenas y borrador en operaciones separadas. Para series: motor y biblia de serie antes de estructura episódica; se agrega formato para entrega o adaptación. Para película se usa la ruta de largometraje de workflow. Para novela/material escrito se usan las herramientas generales de premisa, personajes y estructura, preservando prosa aprobada; no se afirma que exista una skill especializada de novela ni se introduce otro guionista.

No se cargan las 26 skills ni se importan automáticamente casos de estudio, estilos nacionales, comedia o dramaturgia específica. Si el formato los necesita después, se evalúan individualmente. El ejemplo original fue escrito por Codex bajo las skills Screenwriting seleccionadas; la revisión está identificada como auto-revisión, sin inventar un reviewer independiente.

## Drama: criterios y producción

Seleccionadas: `short-drama-assets`, `short-drama-storyboard`, `short-drama-image-prompts`, `short-drama-video-prompts`, `short-drama-review`, `short-drama-edit`.

El rubric story-script alimenta a Screenwriting con criterios de conflicto, progresión, apertura y cierre, sin fijar cuotas ni alterar unilateralmente un guion. Las otras skills aportan continuidad, cuadros iniciales/finales, prompts y criterios de montaje. Sus archivos Markdown orientan al agente y se adaptan a la única fuente de estado; no se mantiene una segunda carpeta editable de documentos contradictorios.

Excluidas `short-drama-write`, `short-drama-develop`, el análisis/reemplazo narrativo independiente y el flujo paraguas con otro escritor. No se instala ni ejecuta su proyecto Remotion: FFmpeg existente resuelve el montaje de esta versión.

## Film Production: columna de preproducción

Se integraron las cinco solicitadas: `structure-screenplay`, `design-production-assets`, `plan-camera-shots`, `compile-generation-prompts`, `review-and-assemble`. Se adoptaron referencias exactas, separación de hechos/propuestas, IDs, dependencias, estados parciales, reintentos por elemento, linaje y revisión no destructiva.

Se adaptó su entrada de blueprint desde la biblia/guion aprobado de Screenwriting. No se importó `shape-story-blueprint` como escritor alternativo, ni `execute-media-generation` como sustituto de ComfyUI/Higgsfield. Sus schemas y field-guides son documentación de origen, y los contratos operativos del estudio están en `src/contracts.ts`; no son copias editables equivalentes.

## Director: complementos con responsabilidad acotada

Se examinaron las cinco candidatas indicadas. `shotlist-and-visual-breakdown` y `character-location-prop-bible` se descartaron de la instalación porque duplican la descomposición, assets y continuidad ya cubiertos por Film y Drama.

Se incorporaron `model-adaptation` para traducción y límites, `prompt-iteration-and-diagnostics` para fallos concretos y correcciones mínimas, y `style-cinematography-director` para convertir tono en decisiones de luz/óptica/cámara. No tienen autoridad para cambiar relaciones, hechos o diálogo. Las claims de proveedor deben comprobarse en el servicio actual; las tablas de una skill no sustituyen esa verificación.

## Skills locales existentes

Se leyeron las recetas `comfy-msr-video` y `comfy-story-director` en el entorno del usuario y sus referencias técnicas. Se reutiliza su runner/base MSR y se registran hashes en el inventario. No se sobrescribieron ni se vendieron como parte del código del repo. Sus instrucciones genéricas de escritura o preferencias de orientación se subordinan a la autoridad narrativa y al perfil explícito de este estudio. Los canvas I2V/FLF no se confunden con APIs ejecutables y Director no se convierte automáticamente en producción por clips sueltos.
