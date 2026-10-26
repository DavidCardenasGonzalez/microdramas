---
name: generation-strategy
description: Ejecutar y diagnosticar video desde planes aprobados del estudio con MiniMax H3 Fast Ref como ruta principal, Motion como alternativa local y Seedance/Kling solo como escalamiento excepcional. Usar para preflight, envío, recuperación, QA y montaje; Screenwriting y cámara conservan sus contratos.
---

# Estrategia técnica de generación

Leer la política oficial del repositorio en [playbook](../../docs/AI_FILM_DIRECTION_PLAYBOOK.md), secciones pertinentes, y [contratos de integración](../../docs/HYBRID_VIDEO_DIRECTION.md). Estas reglas sustituyen I2V predeterminado y referencias/hojas obligatorias de recetas históricas.

- Fast Ref para diálogo, interpretación y acción controlada; Motion para trayectoria física dominante. El director registra beatType, ruta y razón por unidad. Seedance/Kling solo para acción indispensable que justifique escalamiento con aprobación humana del gasto.
- Consumir Shots aprobados, su Reference Plan y SequenceContinuity. Repetir canonicalText literalmente entre prompts. Reutilizar identidad propia para recurrentes; set y vestuario breve primero mediante texto. Figuración incidental puede ser textual. No crear imágenes, frames ni hojas por clip.
- Aproximadamente 20 s Fast Ref y 10 s Motion a 0.4 son observaciones locales. Respetar duración justificada, frames efectivos y límites del workflow registrado; nunca imponer cinco segundos universales ni rellenar.
- Preparar mediante `node bin/studio.mjs`: doctor ante cambio de backend; dry-run/prepare-only para paquetes nuevos. Fast Ref/Motion tienen registros separados, nodos/modelos activos y copias con hash. No modificar masters, runners, modelos ni cola ajena.
- Registrar prompt_id inmediatamente. POST incierto se reconcilia, no se reenvía. `completionMode` distingue solo envío y encargo completo; resume reutiliza IDs conocidos. CLI no puede invocar MCP de escritorio por su cuenta.
- Prompts en inglés, diálogo literal una vez en idioma del proyecto; solo instrucciones ejecutables, sin títulos ni análisis pronunciables. Exigir ausencia de música y acentos sintéticos de primer a último frame, también desde dispositivos; solo sonidos planificados.
- Segundo intento diagnóstico cambia una variable; tercero opcional con valor y cambio de ruta/división explícito. Conservar fuentes. Cambios narrativos vuelven a Screenwriting; una corrección técnica que conserve Shot no reabre dirección.
- Evaluar acción temporalmente y escuchar audio. Aplicar defectos del playbook y registrar lo observado; sin percepción real, QA audiovisual pendiente. Seleccionar rangos útiles, subtítulos revisados y una sola fuente por diálogo. Registrar segundos útiles y costo aprobado cuando se conozcan.

Las recetas en `references/` y el selector Python describen compatibilidad histórica LTX/MSR. Solo abrirlas para recuperar planes heredados o una petición explícita de esos modelos. No usarlas para elegir rutas nuevas ni crear otro journal editable. La fuente vigente es `.studio/state.json`; usar adaptadores y contratos Studio.

Video local requiere autorización acotada; servicios pagados necesitan estimación, presupuesto por episodio/proyecto y autorización humana. Metodología no autoriza recursos. No descargar modelos ni instalar globalmente para resolver bloqueos.
