---
name: generation-strategy
description: Ejecutar técnicamente la generación audiovisual local desde planes de tomas y referencias ya preparados, usando I2V como ruta por defecto y workflows especializados solo cuando la toma lo justifique. Usar para preflight, generación, diagnóstico, montaje y registro; dejar la planificación narrativa y cinematográfica a sus skills propias.
---

# Dirección técnica de producción audiovisual

Conecta los planes cinematográficos y referencias preparados por las skills del repositorio con los adaptadores de generación ya disponibles. La responsabilidad aquí es preflight → ejecución → QC → correcciones → montaje → registro; no rehagas la escritura ni la planificación de tomas salvo que falte un insumo necesario para ejecutar. Trabaja en español, conserva el plan aprobado y usa registros locales reanudables. No descargues ni reinstales modelos por rutina.

Esta capa comienza con guion/plan aprobado; no modifica Screenwriting Skills ni reescribe la historia para acomodar un modelo. Si llega solo una idea, conserva el desarrollo narrativo existente y alcanza ese handoff antes de la estrategia técnica. Una aprobación previa o autorización inequívoca del encargo cuenta; no pidas permisos rutinarios por cada plano. Escribir o evaluar planes no autoriza renders de demostración.

## Selección y contratos

Lee [capacidades y adaptadores](references/adapters.md) y [contratos/comandos](references/contracts.md). Usa el selector local `scripts/strategy.py` como preflight técnico; no sustituye las skills del repo que desglosan guion, cámara, assets y prompts.

- `i2v`: ruta predeterminada. Usa el primer frame compuesto desde los assets aprobados y anima la acción planificada. El storyboard se recorta por panel y nunca se pasa como collage.
- `flf2v`: excepción cuando la toma requiere llegar a un estado visual final concreto y los extremos se revisaron como estados compatibles de la misma acción. Tener dos imágenes disponibles no basta.
- `msr`: excepción para una toma cuya puesta o referencias no puedan resolverse adecuadamente con un primer frame; justifica la elección concreta. No lo elijas solo porque hay identidades recurrentes.
- `t2v`: excepción para tomas donde una imagen inicial no aporta o perjudica la acción, normalmente atmósfera/entorno; justifica por qué no conviene preparar un primer frame.
- Director, Ingredients, keyframes intermedios, pose/motion conditioning, Wan y proveedores externos se consideran candidatos **no habilitados automáticamente**: requieren inspección, receta compatible y disponibilidad verificadas. Respeta una petición explícita de modelo; si no puede ejecutarse, indica el bloqueo, no la reemplaces a escondidas.

Por toma registra workflow, modelo/checkpoint, hash, prompt entregado, imágenes y semillas, resolución solicitada/real, duración/FPS, `prompt_id`, riesgos y QC. I2V usa 0.6 MP por defecto. En planos abiertos puede probarse 0.8 MP para evaluar si mejora la legibilidad facial; comprueba VRAM y resultados reales antes de ampliarlo más y no prometas que la resolución por sí sola corrija artefactos. Conserva ajustes explícitos del usuario.

## Reutilización de capacidades existentes

Para ejecutar, lee **solo la receta del modo** en [adaptadores](references/adapters.md) y las guías de ejecución del workflow local. Reutiliza el runner MSR únicamente para MSR. I2V/FLF2V/T2V requieren exportar el API del grafo real y validar nodos/modelos; no inventes clases UUID ni conexiones. No uses MSR como ruta automática por existir una receta previa.

Consume las referencias, keyframes y prompts que prepararon las skills del repositorio. Si falta el primer frame necesario para I2V, genera una composición con el servicio de imágenes autorizado para el encargo y respeta la biblioteca de identidad/escenarios. No conviertas automáticamente una referencia de personaje en un frame inicial.

## Calidad, recuperación y entrega

Respeta el encuadre y la cobertura ya aprobados. Antes de ejecutar I2V confirma que cada toma tiene un frame inicial adecuado; reporta assets faltantes en vez de cambiar de workflow sin justificarlo. Conserva la duración definida por la planificación y por los límites efectivos del grafo.

Clasifica defectos y aplica [recuperación](references/production-method.md#diagnóstico-y-recuperación): conserva versiones buenas, corrige una variable principal y limita a dos reintentos dirigidos por toma/pasada. Guarda decisiones y estados persistentes, reanuda desde archivos existentes y reconcilia `prompt_id` antes de reenviar un trabajo de estado incierto.

Revisa fotogramas durante toda la acción y cortes; escucha cuando sea posible y distingue presencia de stream, transcripción, escucha y sincronía audiovisual. Mide resolución/FPS/duración de archivos exportados; las etiquetas de selectores no son evidencia. Unifica el formato del montaje con transformaciones registradas y preserva originales. Entrega video, imágenes generadas, manifiesto y QC con enlaces absolutos, técnicas/evidencia utilizadas y límites pendientes reales. No reportes tests de reglas o planes A/B como experimentos de calidad de video.
