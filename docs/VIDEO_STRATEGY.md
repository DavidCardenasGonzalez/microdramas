# Estrategia de generación de video

La [guía oficial](AI_FILM_DIRECTION_PLAYBOOK.md) gobierna adaptación, guion, dirección, referencias, prompts, evaluación y montaje. [HYBRID_VIDEO_DIRECTION.md](HYBRID_VIDEO_DIRECTION.md) documenta contratos y comandos. Fast Ref es la ruta principal; Motion es la alternativa local con la misma interfaz de referencias. Seedance/Kling son escalamiento excepcional.

El selector Python histórico de LTX/MSR no participa en la ruta oficial. No pedir un primer frame, una hoja ni imágenes nuevas por escena de manera automática. Reutilizar identidades y continuidad textual exacta; preparar solo lo que falte y aporte una mejora concreta. Los límites provienen del workflow registrado y el adaptador, sin máximo universal de cinco segundos.

La [corrección integral](CINEMATIC_PIPELINE_CORRECTION.md) conserva identidad cinematográfica Hollywood por género, dirige la secuencia completa antes de asignar generaciones y separa invariantes del estado dinámico heredado. Las rutas oficiales y el escalamiento premium comparten este contrato; nuevas referencias FLUX requieren biblia cinematográfica. No reabrir el escenario por empezar un render.

## Ejecución y continuidad del encargo

El objetivo es recibir una novela y completar su adaptación a microdrama con mínima intervención. Codex ejecuta las etapas con skills y contratos persistentes, escena por escena; la CLI no contiene un LLM ni puede sustituir escritura, dirección o percepción audiovisual.

`completionMode: complete` es el valor predeterminado para continuar dentro del alcance autorizado: preparación → envío → recuperación por ID conocido → QA → selección/recortes → montaje/subtítulos/exportación. `config --completion-mode submit` conserva encargos donde solo se desea enviar y devolver el control. Una preferencia explícita del usuario por proyecto prevalece. Cambiar esta política no autoriza recursos nuevos ni convierte clips heredados al guion actual.

Guardar prompt_id inmediatamente. No reenviar un POST incierto; reconciliar backend y vincular el ID o confirmar ausencia explícita. Observar un ID conocido no vuelve a enviar el trabajo. Timeout de observación no significa fallo de render. Trabajos locales secuenciales y cola ajena preservada; no modificar masters, modelos, runners ni servicio.

Antes de primer uso o cambio de backend: `doctor`. Para paquetes nuevos/modificados: `generate --dry-run` y `--prepare-only`; reutilizar evidencia/preparaciones intactas. Verificar cola antes de enviar. Render local real usa autorización acotada `approve --local`; FLUX conserva `--execute --approve-local`. Preparar no renderiza ni autoriza gasto.

## Recuperación y entrega

Intento inicial en ruta apropiada; segundo diagnóstico cambiando una variable. Un tercer intento es opcional con motivo y cambio explícito de ruta/división dentro del presupuesto; no bucles. Una reparación genera alternativa y conserva archivos. Screenwriting revisa cambios narrativos; no se alteran snapshots aprobados para acomodar un generador.

Seedance/Kling requieren acción indispensable, razón de escalamiento, plataforma real inspeccionada, estimación vigente, presupuesto por episodio/proyecto y aprobación humana del pago. No gastar automáticamente al fallar el backend local.

Evaluar identidad, anatomía, movimiento, continuidad, tiempo, causalidad y diálogo mediante video y audio. Si falta capacidad para ver/escuchar/transcribir/sincronizar, registrar QA pendiente. No declarar terminado un master por pasar FFmpeg. Seleccionar rangos útiles y conservar una sola fuente por línea; subtítulos literales con tiempos revisados. Exportar master, versiones, SRT, hashes, procedencia y estado QA. Todos los prompts exigen sonido diegético planificado y diálogo, sin música de principio a fin.
