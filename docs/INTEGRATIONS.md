# Integraciones verificadas y habilitación

Los informes `environment.detected.json` y `msr-integration.detected.json` se generan localmente y están excluidos del repositorio porque contienen rutas y datos del equipo. Los manifiestos de `productions/` también son locales. Los detalles siguientes corresponden al entorno inspeccionado, no a garantías universales de esos modelos.

## ComfyUI y MSR

- Backend activo: `http://127.0.0.1:8000`, ComfyUI 0.42.0, RTX 4070 de 12 GB.
- `GET /system_stats`, `/queue` y los `/object_info/<class>` necesarios funcionaron.
- Prueba real de backend: EmptyImage de 32×32 → SaveImage completada, prompt_id `03362a53-733c-4e15-a957-fee4e0dada14`. **No fue inferencia generativa.**
- Reutilizado: el runner local de MSR y su workflow base, disponibles en la instalación del usuario. El inventario detectado y los hashes de esa instalación se mantienen como datos locales y no forman parte del repositorio. El nuevo wrapper no duplica el diseño del grafo.
- Probado: construir el grafo completo del primer plano con entradas simuladas; validar clases, campos, parámetros y modelos contra el servicio actual. Soporta los slots reales `pic1`…`pic4` y `background`, agregando loaders opcionales solo a la copia del proyecto cuando hacen falta.
- No probado aquí: render generativo de video MSR ni calidad temporal/sonora. No se presentó el preflight como un render.
- Límites del binding existente: 720×1280 o 1280×720, 24 FPS, duración entera de 1 a 15 s. El perfil inicial planea hasta 12 s. El adaptador exige referencias revisadas; no cae a T2V al faltar una imagen.

`generate --prepare-only` crea paquetes y grafos, valida contra el servicio y no envía nada. Antes de cada envío preserva cola activa. `approve --local` autoriza los jobs concretos. `generate --execute --approval TOKEN` ejecuta; `resume --approval TOKEN` observa los prompt_id conocidos. Si un envío queda incierto, consulta backend y vincúlalo con:

```powershell
node bin/studio.mjs -p PROJECT jobs --job JOB-ID --bind-remote PROMPT-ID
```

Solo si comprobaste que no hubo envío usa `--confirm-not-submitted`. No borrar registros para forzar una repetición.

## FLUX 3 Klein

Encontradas las variantes API 1Ref, 2Ref y 4Ref bajo `<COMFYUI_ROOT>/user/flux3_research/api/`; el adaptador inicial utiliza 1Ref. El modo sin imagen fuente deriva T2I de esa copia: conserva UNET/CLIP/VAE/sampler, conecta texto directamente y omite acondicionamiento y expansor de edición. El modo `--source` conserva ReferenceMultiLatent y el expansor original.

**Bloqueo comprobado antes de encolar:** el servicio activo no publica los modelos FLUX que espera la plantilla. La prueba `productions/real-integration/generation/REFJOB-4d365763-eae/workflow.api.json` quedó guardada y el job registra el error; `attempts=0`, sin prompt_id ni uso de GPU. Una evidencia histórica en otra carpeta sí indica FLUX ejecutado antes, pero no demuestra disponibilidad en el servicio actual.

Habilitación sin reinstalar ni descargar automáticamente:

1. En ComfyUI, revisa los directorios de modelos y la instancia activa; confirma que apunta al lugar donde ya guardaste esos archivos. No se alteró tu YAML de rutas.
2. Deben aparecer los nombres exactos de la plantilla en `/object_info/UNETLoader`, `/object_info/CLIPLoader` y `/object_info/VAELoader`: `flux3-image-klein-int8-convrot.safetensors`, `qwen3vl_4b_int8_convrot.safetensors`, `qwen3.5_9b_flux3_prompt_upsampler_w4a8.safetensors` y `flux3-flux2-vae.safetensors`. Para T2I sin expansor solo hacen falta modelo, CLIP de generación y VAE. No sustituirlos por nombres parecidos.
3. Si tus rutas o nombres difieren, crea una **copia** API validada y configura `comfy.fluxBase` mediante `config --import`. No modifiques el maestro para satisfacer este repo.
4. Ejecuta `references --generate --id REF-ID` para validar. Después `--execute --approve-local`; un candidato exitoso todavía necesita inspección y `references --attach`.
5. Para un job con fallo previo, corrige la causa y usa `--retry`. Una modificación de prompt produce una solicitud nueva. `resume` continúa referencias ya autorizadas y ejecutándose; nunca reinicia una solicitud incierta sin resolución.

Puedes saltar la generación FLUX aportando imágenes reales existentes con `references --attach`. Eso habilita MSR sin instalar nada.

## I2V y first/last frame

Los canvas `video_ltx2_5_i2v.json` y `video_ltx2_5_flf2v.json` existen e incluyen subgrafos UUID. **No se enviaron como grafos API ni se inventó un convertidor de subgrafos.** Los adaptadores `comfy-i2v` y `comfy-flf2v` están implementados como contratos configurables, pendientes de una exportación API real validada.

Para habilitarlos, configura una copia en el frontend y exporta API. Valida nodos/modelos y declara en `config.comfy.apiWorkflows` su `path`, `verified: true`, límites comprobados `minSeconds`/`maxSeconds` y bindings `{node,input}` para `prompt`, `duration`, `width`, `height`, `seed`, `fps`, `save`, `start` y, para FLF, `end`. Estos bindings deben apuntar a todos los controles efectivos de la copia: si el grafo calcula longitudes o tiene switches T2V, conecta los valores exportados correctamente antes. Verifica que `--prepare-only` coincide con una exportación frontend y ejecuta una prueba pequeña antes de confiar en el marcado `verified`.

No se afirma un límite de duración validado del modelo I2V/FLF: el adaptador rechaza compilar hasta recibir una exportación verificada y su intervalo comprobado. No hereda límites ni evidencia de calidad del runner MSR. Primer/último frame son obligatorios por rol; la estrategia se edita en un Shot aprobado y se importa por `plan --import-shots`.

## Director y multi-shot

Existen la receta local y `<COMFYUI_ROOT>/user/director_quality/prompt_quality.json`. Se inventariaron; no se cambió la timeline histórica ni se ejecutó su escena de prueba. No hay adaptador automático de escena multi-shot en esta versión. El contrato reserva la estrategia, pero un proveedor sin capacidad registrada la rechaza. El primer flujo operativo utiliza MSR por tomas, tal como prioriza este proyecto. Para Director se necesita un adaptador de agrupación de escenas, sincronización de ventana/timeline y despiece de resultados con tiempos de origen; no se lo simula concatenando MP4.

## Higgsfield / Seedance

El conector MCP está disponible en la sesión Codex. Se consultó su catálogo sin generación ni cargos. La búsqueda original anunció `seedance_2_0` con duración entera 4–15 s, referencias de imagen/video/audio, start/end, audio nativo y relaciones de aspecto incluidas 9:16. Sus parámetros de resolución dependen de modo: `fast` 480p/720p, `std` admite más opciones según cuenta. No se presupone soporte multi-shot independiente ni un negative-prompt/seed no publicados.

`generate --adapter seedance` prepara el paquete e instrucciones de handoff en `requests/`; el mapping inicial corresponde a `seedance_2_0`. Otros IDs se rechazan hasta registrar su contrato específico, aunque aparezcan en el catálogo; no se les atribuyen las capacidades del primero. La CLI no posee una credencial de backend Higgsfield y no puede invocar automáticamente el MCP del escritorio. Codex debe usar las herramientas reales de estimación, upload, generate y seguimiento. No se hizo ninguna llamada de generación pagada.

Antes de enviar, Codex vuelve a consultar `models_get/models_search` para el ID elegido, sube referencias con roles correctos, estima el costo exacto y prepara jobs con `--estimate COST`. Configura `config --budget LIMIT`; registra autorización explícita con `approve --paid --max-cost LIMIT --reason ...`. El usuario debe haber autorizado ese gasto. No inferirlo de «construye el estudio». Guarda el ID inmediatamente con `jobs --bind-remote`; recibe el archivo local con `generate --receive FILE --job JOB-ID --remote-id REMOTE-ID`. `--execute` prepara el handoff y reserva autorización, pero no presenta una llamada remota como ejecutada.

La revisión audiovisual y temporal queda pendiente hasta inspección real. Los resultados externos siguen exactamente los mismos controles y manifiestos del resto de proveedores.

## Audio y subtítulos

FFmpeg 7.1 existente comprobado. FFprobe no se encontró en PATH ni en la instalación ComfyUI revisada; se usa el fallback declarado. Puedes configurar `ffprobe` explícitamente sin modificar PATH. No se instaló TTS/ASR ni una herramienta de escucha. Se admiten archivos de voz, diálogo TTS ya generado, música y efectos mediante Timeline; el montaje impide duplicar voz nativa con una pista de diálogo externa. Las evaluaciones de palabras, sincronía y actuación no se aprueban automáticamente.
