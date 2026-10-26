> Registro histórico de implementación. No dirige nuevas producciones; la política vigente es [AI_FILM_DIRECTION_PLAYBOOK.md](AI_FILM_DIRECTION_PLAYBOOK.md). Sus límites y rutas describen la versión evaluada entonces.

# Reporte de implementación — 22 de octubre de 2026, México

## Resultado

Se implementó y ejecutó una primera versión funcional del estudio en este repositorio. Incluye CLI, orquestación por Codex, contratos validados, fuente de verdad persistente, revisiones, invalidación selectiva, planificación, referencias, cola de generación, QA, selección editorial, montaje, audio, subtítulos y exportación. No es solamente documentación: la prueba end-to-end produjo medios reales de prueba y verificó su decodificación.

**Validación final: 30 pruebas automatizadas aprobadas, cero fallos y cero omitidas; TypeScript y compilación aprobados.** Se verificaron 172 documentos/licencias fijados por hash, correspondientes a 23 módulos de skills seleccionados. No hubo llamadas de generación pagadas, descargas de modelos, instalaciones globales, cambios en workflows maestros ni interrupciones de trabajos ajenos.

El resultado comprobado es un backend operativo y una demostración audiovisual **simulada**. La generación narrativa real se realiza por Codex bajo Screenwriting, mediante tareas acotadas e importaciones validadas. La CLI independiente no tiene un servicio LLM configurado. La primera producción real está preparada; su dependencia externa inmediata son cuatro imágenes reales revisadas o recuperar los modelos FLUX que el servicio activo no anuncia.

## Arquitectura realmente implementada

| Área | Implementación |
| --- | --- |
| CLI | Node 22, TypeScript, Commander; `bin/studio.mjs`, fuente y compilado |
| Contratos | Zod; los 15 contratos solicitados más configuración, prompts, aprobaciones y jobs de referencias; JSON Schemas exportados |
| Estado | JSON validado, escritura atómica, lock por PID, versiones y DAG de dependencias |
| Narrativa | Screenwriting exclusivo; ideas, handoffs por etapa, biblia, personajes, episodios, importación literal y aprobación de revisiones |
| Preproducción | Spans exactos, beats, dirección neutral al proveedor, continuidad declarada, referencias reutilizables y contexto por toma |
| Generación | Cola persistente, fingerprints, alternativas, reserva de presupuesto, autorización, concurrencia limitada, reanudación y tratamiento de envíos inciertos |
| QA | Hash/existencia, dimensiones, FPS, duración, pistas, decodificación y alertas de negro/freeze; revisión audiovisual explícita |
| Edición | In/out obligatorios, timeline no destructiva, cortes, audio nativo/externo, pistas con ganancia/offset, loudnorm, SRT e incrustación |
| Entrega | Master, perfiles de distribución, manifiesto con comandos, hashes, jobs, QA y versiones; exportación de manuscritos |

Detalles en `ARCHITECTURE.md` y responsabilidades del agente en `../AGENTS.md`. Los límites del parser y de la evaluación audiovisual están documentados: no se declara que una heurística interprete todo formato ni que FFmpeg evalúe actuación o palabras.

## Skills y versiones

| Fuente | Commit | Selección |
| --- | --- | --- |
| Screenwriting | `51115f18d160aa8b2ac5813e4432b6f0b425358f` | workflow, premisa, estructura, personajes/conflicto, escenas, diálogo, formato/adaptación, motor/biblia de serie y estructura de serie |
| Drama | `fdb7b7c58017e3eae64eca382c2a85ede368dab0` | assets, storyboard, prompts de imagen, prompts de video, revisión y edición |
| Film Production | `47b2a6a432235e716fa2aa0d08eefae76fdb34fd` | las cinco skills de desglose, assets, cámara, compilación y revisión/montaje solicitadas |
| Director | `35ca0a2b4cd55b0668aa9ea0f40273324b774bb4` | adaptación de modelo, diagnóstico de prompts y estilo/cinematografía |

Las cuatro fuentes son MIT y conservan sus licencias. Los hashes están en `../skills.lock.json`. La integración es metodológica y por responsabilidad, no cuatro procesos de escritura competidores. Drama no escribe el canon, Film recibe un adaptador del guion/biblia aprobado y Director complementa solo cuando procede. Se excluyeron `shape-story-blueprint`, `execute-media-generation`, los escritores Drama y los módulos Director redundantes. Ver `SKILLS.md`.

## Herramientas detectadas y probadas

| Herramienta | Resultado demostrado |
| --- | --- |
| ComfyUI local / RTX 4070 | API real accesible y cola preservada; EmptyImage → SaveImage de 32 px completada |
| Runner/base MSR existentes | Reutilización del constructor Python; grafo completo del primer plano validado contra clases, inputs, modelos y slots del backend real; **sin envío de video generativo** |
| FLUX 3 Klein | Plantillas API presentes; intento de integración bloqueado en preflight por modelo/encoders/VAE ausentes del servicio activo; cero jobs enviados |
| I2V y FLF2V LTX | Canvas inspeccionados; adaptadores configurables implementados, pendientes de exportaciones API reales verificadas |
| Director LTX | Receta/API histórica detectada; adaptador automático de escenas multi-shot pendiente |
| Higgsfield / Seedance | Catálogo consultado vía MCP, capacidades registradas; handoff y recepción de resultados implementados; generación pagada no ejecutada |
| FFmpeg 7.1 existente | Generación de fixtures, QA, recortes, mezcla, normalización, SRT incrustado, master y distribución ejecutados |
| FFprobe | No disponible en las rutas revisadas; fallback FFmpeg declarado y probado, sin instalación |

La prueba MSR estructural y el test de backend **no equivalen a inferencia generativa ni a calidad cinematográfica comprobada**. Los archivos de evidencia son `environment.detected.json`, `msr-integration.detected.json`, `higgsfield.catalog.json` y el estado `../productions/real-integration/.studio/state.json` con el bloqueo FLUX. Ver `INTEGRATIONS.md` para habilitación exacta.

## Pruebas ejecutadas

```powershell
npm run typecheck
npm test
npm run build
npm run skills:verify
node bin/studio.mjs schemas
node bin/studio.mjs doctor --smoke --output docs/environment.detected.json
npm run integration:msr
npm run demo
node bin/studio.mjs -p productions/first-microdrama validate
```

Las 30 pruebas cubren contratos, IDs obsoletos, spans/diálogos, referencias obligatorias, reutilización, revisión/aprobación de guion, invalidación selectiva y replanificación, integridad de archivos, separación de mocks, bloqueo de fallback T2V, handoff Screenwriting, presupuesto externo, rutas, dry-run sin escrituras, E2E con MP4/SRT/mezcla/distribución, fallos de decodificación, duplicación de voces, evaluación audiovisual pendiente, transporte incierto, novelas, contexto acotado, outputs desaparecidos, estabilidad de IDs al insertar escenas, observación de jobs conocidos sin reenviar ni reconstruir sus grafos, revisiones con borradores intermedios, protección del canon frente a paquetes narrativos no aprobados y rechazo de capacidades de modelo no verificadas.

Los servidores de las pruebas de transporte son simulados y se identifican así. No requieren GPU ni créditos. El test E2E sí ejecuta FFmpeg y verifica archivos MP4 reales de prueba, no solamente JSON. El demo también ejecuta sus validadores y registra fuentes y resultados.

## Demostración original

**The spare key**: Nora devuelve una llave; Eli mantiene abierta una posibilidad sin imponerle volver. Dos adultos, una tienda, un objeto, inglés B1, cuatro tomas de 9/12/12/5 s. Codex escribió el ejemplo con Screenwriting; Film/Drama orientaron la dirección, sin cambiar hechos ni diálogo. El perfil real es 720×1280, 24 FPS y un episodio de prueba, configurable.

La última demostración simulada está en `../productions/demo-1792718004624/`:

- Master: `exports/EXPORT-0a893af2-c93/master.SIMULATED.mp4`.
- SRT: `exports/EXPORT-0a893af2-c93/subtitles.srt`.
- Distribución: `exports/EXPORT-0a893af2-c93/preview.SIMULATED.mp4`.
- Manifiesto: `exports/EXPORT-0a893af2-c93/manifest.json`.
- Resultado: 36 s después de recortar 0.25 s de cada extremo de las cuatro fuentes; 360×640, 24 FPS, audio estéreo y subtítulos incrustados. Distribución 180×320. Decodificación completa aprobada, sin alertas de negro/freeze en esta ejecución.
- `demo-report.json`: 45 artefactos validados, 13 spans fuente, reanudación sin repetir trabajos y estado simulado explícito.

Son patrones de prueba con cartela **SIMULATED** y tono sintético: no representan personajes actuando, voz hablada ni sincronía validada. `npm run demo` reproduce el flujo en una carpeta nueva y no sobrescribe este resultado.

El ejemplo real preparado en `../productions/first-microdrama/` conserva la dirección de cámara/continuidad, los diálogos exactos y cuatro referencias pendientes: Nora con vestuario, Eli con vestuario, tienda y llave. Se reutilizan a través de las cuatro tomas. No se crean vistas o variantes adicionales sin necesidad del plano.

## Comandos operativos y condiciones de avance

`init`, `write`, `plan`, `references`, `shots`, `generate`, `review`, `edit`, `export`, `status`, `resume`, `run` y los comandos auxiliares están implementados; sus ejemplos completos están en `../README.md` y la ayuda de la CLI. `run` avanza hasta el próximo requisito pendiente, sin fabricar una aprobación audiovisual ni lanzar pagos.

1. Un guion aprobado permite desglose y dirección.
2. Planos aprobados y referencias reales revisadas permiten compilar paquetes para un modelo compatible.
3. Paquetes validados y autorización acotada permiten enviar generación.
4. QA técnico más revisión audiovisual registrada permiten seleccionar in/out.
5. Selecciones explícitas permiten una timeline; tiempos de subtítulos revisados permiten entrega con QA declarado.
6. Un borrador narrativo nuevo conserva la producción aprobada previa hasta aprobarse; después se invalidan dependientes.

## Pendientes y bloqueos

- **Referencias reales:** FLUX no puede ejecutar la plantilla en el servicio actual. Aportar imágenes existentes o recuperar sus modelos/rutas permite iniciar MSR sin rehacer el sistema. No se cambió la configuración externa.
- **Inferencia video real:** todavía no se ejecutó. MSR pasó preflight; requiere las referencias anteriores y revisión posterior del primer render.
- **I2V/FLF:** falta exportación API verificada, bindings efectivos y una prueba real pequeña. Sus contratos no se presentan como integración probada.
- **Director multi-shot:** inventariado, pendiente de adaptador de timeline/ventana y asociación de subintervalos a tomas.
- **Seedance:** conector detectado y handoff listo; el envío real requiere MCP en Codex, estimación actual y aprobación humana de gasto. La CLI no finge acceso directo a ese conector.
- **Narrativa fuera de Codex:** la CLI genera solicitudes y valida respuestas; no ejecuta un LLM autónomo. Dentro de Codex, `AGENTS.md` define el trabajo creativo y sus transferencias.
- **Evaluación audiovisual/audio:** requiere herramientas temporales de inspección y escucha o una persona; no se automatizó semántica, lip-sync, certificación B1 ni evaluación de actuación. Las medidas técnicas siguen separadas.
- **TTS/ASR:** se aceptan pistas externas y tiempos revisados; no se incorporó un sintetizador, transcriptor ni alineador nuevo.
- **Parser general:** admite Fountain sencillo con encabezados explícitos; otros formatos requieren normalización autorizada o ampliación del adaptador. No se destruye el original para adivinar estructura.

## Instrucción exacta para la primera prueba real

En Codex, dentro de este repositorio:

> Continúa `productions/first-microdrama` según `AGENTS.md`. Prepara o vincula sus cuatro referencias reales con las herramientas autorizadas y revísalas. Si FLUX sigue sin estar disponible, conserva ese bloqueo y utiliza únicamente referencias reales aportadas; no uses mocks ni cambies de modelo silenciosamente. Compila y ejecuta primero `EP001-SC001-SH001` con MSR local y aprobación acotada. Revisa el clip completo y escucha su audio antes de continuar con las otras tres tomas. Selecciona solo intervalos útiles, revisa los tiempos de subtítulos y exporta el montaje con manifiesto y QA. No uses servicios pagados.

Los comandos exactos para adjuntar las cuatro imágenes, validar/preparar el primer plano, obtener el token local, ejecutar, revisar y montar ya están en `../README.md`. Para comprobar inmediatamente el estado preparado:

```powershell
node bin/studio.mjs -p productions/first-microdrama status
node bin/studio.mjs -p productions/first-microdrama shots --context --shot EP001-SC001-SH001
```
