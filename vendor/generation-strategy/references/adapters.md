> Compatibilidad histórica LTX/MSR, fuera de la ruta oficial nueva. Leer solo para planes heredados o una petición explícita. Fast Ref/Motion y los contratos Studio se rigen por [la guía oficial](../../../docs/AI_FILM_DIRECTION_PLAYBOOK.md). No crear el journal ni biblioteca paralelos descritos aquí para proyectos Studio.

# Matriz y adaptadores

El registro configurable es `../assets/capabilities.json`; `strategy.py inspect` comprueba ruta, hash actual, clases y modelos citados, sin enviar trabajos. `workflow_exists` no prueba modelos instalados, compatibilidad de backend, VRAM o calidad. Los nombres de checkpoint se leen del grafo; verifica `/object_info` y `/system_stats` antes de ejecutar. Un hash distinto exige reinspección. `evidence` describe lo observado, no una certificación.

| Modo | Grafo / condicionamiento | Evidencia local inicial | Adaptador reutilizado |
| --- | --- | --- | --- |
| msr | `LTX-2.5_MSR_V2_12GB.json`, guía multirreferencia | Receta previa con ejecuciones reportadas; validar actuales archivos | `<CODEX_SKILLS_ROOT>/comfy-msr-video/references/msr-production.md` y `scripts/run_msr_shots.py` |
| t2v | `video_ltx2_5_t2v.json`, latentes AV sin imagen inicial | Inspección estructural en esta integración | Procedimiento de abajo |
| i2v | `video_ltx2_5_i2v.json`, un primer frame | Inspección, no benchmark nuevo | `<CODEX_SKILLS_ROOT>/comfy-msr-video/references/i2v-production.md` |
| flf2v | `video_ltx2_5_flf2v.json`, guías de extremos 0/−1 | Inspección, no benchmark nuevo | `<CODEX_SKILLS_ROOT>/comfy-msr-video/references/flf2v-production.md` |
| upscale | `upscale_video.json`, SeedVR2 3B int8 | Inspección; usuario reportó 5 s exitosos y 15 s fallidos, anécdota local | Inspeccionar/exportar este grafo; no tratar 5 s como máximo universal |

Planeamiento/diálogo/QC compartidos: `<CODEX_SKILLS_ROOT>/comfy-msr-video/references/story-planning-review.md`. Montaje existente: `<CODEX_SKILLS_ROOT>/comfy-msr-video/scripts/assemble_msr_edit.py`; fuerza 24 FPS, exige tamaños iguales y normaliza audio por defecto. Para otro FPS o tamaños de origen distintos, prepara copias normalizadas con FFmpeg y registra transformaciones; no cambies silenciosamente fuentes o las reglas del runner.

FLUX local: `<CODEX_SKILLS_ROOT>/comfy-story-director/references/comfyui-local.md`, solo sección de imágenes. No importa su preferencia narrativa por timeline Director. Storyboard opcional: `<CODEX_SKILLS_ROOT>/storyboard-video-prompts/references/camera-language.md`, `storyboard-layouts.md`, `aimikoda-methods.md`; adapta el contenido visual, no su sintaxis Seedance. Imagen generada: skill `imagegen` disponible cuando se requiera. No modifiques esas skills para usar esta entrada única.

## T2V real de LTX-2.5

La copia inspeccionada `<COMFYUI_ROOT>/user/default/workflows/video_ltx2_5_t2v.json` contiene subgrafo 405, definición `8b4f085c-1bb3-4ecd-aeed-603a8d6d3970` «Text to Video (LTX-2.5)», selector 409 y SaveVideo 75. Entradas: `text` prompt, `value` enhancer, `value_1` duración, `value_2` ancho, `value_3` alto, `noise_seed`, `value_4` FPS, seguidas por modelos. Comprueba conexiones, no solo widgets. No requiere LoadImage ni `pic1`.

Los internos observados incluyen prompt 376, enhancer 383, duración 362, dimensiones 372/360, FPS 361 y ruido 339/338 en dos etapas. Usa transformer `ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`, encoder Gemma4 con proyección, VAEs LTX-2.5 audio/video y upscaler latente x2 ya definidos en el grafo. Registra ambas semillas y dimensiones de cada etapa; no copies esos IDs a otra plantilla.

Duplica el canvas por producción; reemplaza todo prompt de demostración, negativos de estilo incompatibles y prefijo de salida. Conserva parámetros probados salvo hipótesis registrada; enhancer false si debe preservarse el texto literal. Exporta API con el frontend real, resuelve subgrafos y entradas conectadas y valida contra `/object_info`. Un canvas `nodes/links` no es el prompt plano de `/prompt`. El UUID no es un nodo backend inventable. Si falta exportación válida, conserva estrategia y reporta impedimento.

Consulta cola y stats en backend local configurado (las recetas documentan `http://127.0.0.1:8000`), preserva trabajos ajenos, registra `prompt_id`, sigue history con monitor persistente y recupera el archivo devuelto por SaveVideo. No confundas timeout de observación con fallo de render. Usa la receta I2V para mecánica de API/registro, sin agregar condicionamiento de imagen. Verifica audio real, dimensiones, FPS y reproducción/decodificación; no deduzcas tamaño exportado del selector o del upscale teórico.

## Capacidades candidatas

Multiple keyframes, Ingredients y pose/motion conditioning requieren receta, checkpoint y conexiones propios verificados para esta versión: no están habilitados por existir en documentación general o un archivo viejo. Director tiene receta separada pero el usuario reportó fallos: no seleccionarlo automáticamente. Seedance/Kling/Wan/MiniMax requieren proveedor y adaptador específicos, no reutilizar los prompts LTX a ciegas. Face Detailer, interpolación y restauración temporal se evalúan solo con integración comprobada y necesidad concreta. Ninguna técnica de esta lista se combina con I2V por concatenar referencias extra en su prompt.
