> Registro histórico de implementación. No dirige nuevas producciones; la política vigente es [AI_FILM_DIRECTION_PLAYBOOK.md](AI_FILM_DIRECTION_PLAYBOOK.md). Sus límites y rutas describen la versión evaluada entonces.

# Integración híbrida — 23-10-2026

Se integran `ltx_i2v` y `h3_reference_to_video` en Shot y PromptPackage sin migrar ni invalidar la producción aprobada. La decisión de dirección queda en `generationMode` y `routingReason`; `--adapter auto` aplica esa decisión por unidad. Los planes anteriores mantienen la ruta de su estrategia.

H3 incluye Reference Plan con sujetos, vestuario, referencias ordenadas, roles, planos temporizados, cortes, continuidad, salida esperada y criterios de revisión. Los beats y líneas se conservan una sola vez en orden; no hay storyboard obligatorio para H3. El contrato de imágenes de tareas mixtas excluye H3 y solo se exige cuando la tarea pide cobertura de composición inicial. La ampliación conserva jobs, tokens de autorización, recuperación, takes, rangos de montaje, audio, subtítulos y exportación.

El workflow se registra como `H3_motion_ref2v`, adaptador `comfy-h3-ref2v`. Se localizó el canvas `H3_ Motion_Ref2v.json` y su API `Prompt Mastery - H3 Best Action Workflow Ref2v_API.json`. El registro mediante CLI creó una copia de producción, con hash, límites, bindings y evidencia de validación de nodos/modelos del servicio activo; no modificó los masters. El grafo preparado conecta imágenes en el orden declarado. Se admite el primer frame como imagen de referencia con rol start y anclaje explícito a 0.00 s. Se bloquean el último frame literal no verificado y las referencias simuladas para modelos reales. En esa revisión histórica se aplicó un máximo de cinco segundos, sustituido por la guía oficial del 25 de octubre de 2026; la rejilla nativa actual permite como mayor duración inferior al máximo 107/24 s. Los límites efectivos se describen en [HYBRID_VIDEO_DIRECTION.md](HYBRID_VIDEO_DIRECTION.md).

El prompt H3 usa seis secciones de la guía oficial de referencias, con tiempos y HARD CUTS. La preferencia del usuario mantiene diálogo narrativo entre comillas en lugar de bloques de parlamentos. Ambas rutas prohíben música de introducción, score, acentos de revelación y cierre. La revisión distingue criterios LTX y H3 y conserva audiovisual pendiente hasta revisión real.

## Comprobaciones

- `npm run typecheck`: correcto.
- `npm run build`: correcto.
- `npm test`: 34/34 correctas tras incorporar el máximo de cinco segundos y la referencia de primer frame. Incluye pruebas nuevas de orden de referencias, reutilización sin imágenes adicionales, separación H3/LTX de storyboard, diálogo único, rechazo de incoherencias temporales/identidad, preparación de grafo contra servicio simulado sin POST de render, integridad de workflow y bloqueo de referencias simuladas. El fixture previo se actualizó para incluir el `durationReason` exigido por el contrato.
- `studio schemas`: esquemas generados desde Zod, incluido ReferencePlan.
- `studio validate` de Party Girl: correcto, 218 artefactos y 59 spans fuente.
- Doctor y registro H3 contra ComfyUI activo: correctos para nodos/modelos y copia API; evidencia en `productions/party-girl/requests/hybrid-doctor.json` y configuración del estado.
- Dry-run `--adapter auto` de la toma LTX existente SH007: conserva `comfy-i2v`; no se envió trabajo.
- `npm run skills:verify`: pendiente por modificación previa de `vendor/film/plan-camera-shots/SKILL.md` respecto al hash fijado. Esta integración no modificó vendor ni reescribió el lock para ocultar la discrepancia.

No se ejecutó un render H3 ni se atribuye a estas pruebas calidad visual, continuidad, consumo de VRAM o sincronía de ese modelo. La producción conserva sus clips existentes; utilizar H3 requiere un plan dirigido/aprobado, referencias revisadas, dry-run, prepare-only y token de ejecución local.
