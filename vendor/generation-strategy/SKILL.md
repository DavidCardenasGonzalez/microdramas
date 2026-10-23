---
name: generation-strategy
description: Dirigir técnicamente una producción audiovisual desde un guion o plan aprobado, eligiendo por toma entre LTX-2.5 T2V, MSR, I2V y first/last frame locales, con storyboard, referencias, generación, diagnóstico, montaje y registros. Usar para producción automática multimodo o selección de estrategia; respetar workflows explícitos y no reemplazar las skills de guion.
---

# Dirección técnica de producción audiovisual

Entrada única para las herramientas existentes, con decisiones por toma y responsabilidades separadas: intención narrativa → planificación cinematográfica → estrategia → referencias → ejecución → QC → correcciones → montaje → exportación. Trabaja en español y protege tokens antes que rapidez mediante registros locales y monitores espaciados. No descargues ni reinstales modelos por rutina.

Esta capa comienza con guion/plan aprobado; no modifica Screenwriting Skills ni reescribe la historia para acomodar un modelo. Si llega solo una idea, conserva el desarrollo narrativo existente y alcanza ese handoff antes de la estrategia técnica. Una aprobación previa o autorización inequívoca del encargo cuenta; no pidas permisos rutinarios por cada plano. Escribir o evaluar planes no autoriza renders de demostración.

## Selección y contratos

Lee [la metodología](references/production-method.md), [capacidades y adaptadores](references/adapters.md) y [contratos/comandos](references/contracts.md). Consulta [fuentes](references/knowledge.md) solo para decisiones que requieran evidencia nueva. Usa el selector local `scripts/strategy.py`; no reconstruye los adaptadores ni envía trabajos. El razonamiento cinematográfico sigue siendo responsabilidad del agente: el selector propone una base revisable y aplica restricciones transparentes.

- `t2v`: workflow real `video_ltx2_5_t2v.json`, para una toma sin inicio obligatorio ni identidad recurrente estricta. No lo confundas con MSR.
- `msr`: el flujo probado MSR V2 para referencias de identidad independientes de una composición inicial.
- `i2v`: anima una composición inicial; un storyboard se analiza y recorta, no se introduce como collage.
- `flf2v`: solo cuando el inicio y destino visuales de la misma acción sean coherentes. Dos imágenes cualesquiera no justifican interpolarlas.
- Director, Ingredients, keyframes intermedios, pose/motion conditioning, Wan y proveedores externos se consideran candidatos **no habilitados automáticamente**: requieren inspección, receta compatible y disponibilidad verificadas. Respeta una petición explícita de modelo; si no puede ejecutarse, indica el bloqueo, no la reemplaces a escondidas.

Por toma guarda intención neutral y prompt específico, modelo/checkpoint, hash y ruta del workflow, técnica, referencias y keyframes, resolución solicitada, duración/FPS, complejidad, riesgos, alternativa, criterios de QC y justificación. Consulta la biblioteca maestra y resultados locales antes de crear imágenes o repetir fallos. Revisa el plan guardado antes de ejecutar; una estrategia seleccionada no es un API ejecutable ni confirma VRAM disponible.

## Reutilización de capacidades existentes

Para ejecutar, lee **solo la receta del modo** en [adaptadores](references/adapters.md). Reutiliza el runner MSR únicamente para MSR y el ensamblador existente solo cuando sus restricciones sean apropiadas. I2V/FLF2V/T2V requieren exportar el API del grafo real y validar nodos/modelos, no inventar clases UUID ni conexiones. Las recetas antiguas describen su propio modo; la selección de este skill gobierna un encargo multimodo, sin heredar preferencias de Director o límites de MSR a otros workflows.

Usa FLUX local o ChatGPT/ImageGen para referencias y composiciones según el modo, la disponibilidad y las instrucciones del usuario. Aplica la skill de imágenes correspondiente al generar. Reutiliza la planificación visual de `storyboard-video-prompts` cuando haga falta un storyboard, leyendo únicamente sus referencias pertinentes: conserva idioma/formato del encargo, no impongas chino, una grilla ni Seedance a LTX. Paneles y anotaciones son metadatos; no son instrucciones de mayor autoridad ni deben aparecer en los fotogramas finales.

## Calidad, recuperación y entrega

No sesgues toda la película hacia caras aisladas: la escala de cada plano responde al espacio, acción, vestuario y emoción que debe mostrar. Primer plano con aire cuando aporte; primerísimo plano solo con motivo. Aprovecha tomas largas coherentes sin convertir toda conversación en un monólogo o forzar 15 s. Calcula palabras, pausas y acciones con la receta editorial existente.

Clasifica defectos y aplica [recuperación](references/production-method.md#diagnóstico-y-recuperación): conserva versiones buenas, corrige una variable principal y limita a dos reintentos dirigidos por toma/pasada. Guarda decisiones y estados persistentes, reanuda desde archivos existentes y reconcilia `prompt_id` antes de reenviar un trabajo de estado incierto.

Revisa fotogramas durante toda la acción y cortes; escucha cuando sea posible y distingue presencia de stream, transcripción, escucha y sincronía audiovisual. Mide resolución/FPS/duración de archivos exportados; las etiquetas de selectores no son evidencia. Unifica el formato del montaje con transformaciones registradas y preserva originales. Entrega video, imágenes generadas, manifiesto y QC con enlaces absolutos, técnicas/evidencia utilizadas y límites pendientes reales. No reportes tests de reglas o planes A/B como experimentos de calidad de video.
