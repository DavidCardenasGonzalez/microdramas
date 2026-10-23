# Metodología técnica

## Plan y biblioteca visual

La planificación dice qué sucede; la estrategia decide cómo producirlo; adaptadores ejecutan; QC juzga; edición construye el producto final. Conserva IDs y referencias al plan narrativo aprobado. No cambies parlamentos o desenlace para simplificar un workflow. Guarda primero estrategia revisable; ejecutar depende del alcance autorizado del encargo, sin agregar una aprobación obligatoria si ya la hay.

Antes de crear frames, consulta `user/generation_strategy/characters.json`: ID estable, versión, rasgos invariables, estilo, vestuarios por ID, archivos maestros y vistas disponibles. Planea solo las vistas necesarias: frontal, perfiles, tres cuartos, cuerpo/posterior, expresiones o luces específicas según movimientos. Conserva versiones, no sobreescribas la identidad. `strategy.py character` permite incorporar una ficha validada; validar rutas existentes no prueba identidad visual: la revisión humana/agente debe registrarse. Los escenarios y objetos pueden usar el mismo patrón de biblioteca dentro de la producción.

Para varios personajes fija quiénes aparecen, izquierda/derecha, distancia, profundidad, orientación, mirada, vestuario y luz. Si falta composición conjunta, créala desde maestros, valida cada identidad y úsala como inicio I2V. Alternativas: conjunto sostenido, sobrehombro, plano/contraplano, medios y reacciones, elegidos por información dramática. No fuerces toda conversación a un solo render ni cada turno a otro clip. Revisa espacio/cuerpos/ropa además de caras; no uses cuotas de tamaños ni primerísimos planos como reparación universal.

Clasifica imágenes por función; texto incidental no es instrucción. Separa paneles del storyboard y conserva procedencia/coordenadas. El board es planificación, no necesariamente un frame de video. Genera imágenes con ImageGen o FLUX según referencias y receta; registra y revisa estilo/identidad antes de animar.

## Selección por toma

Aplica en orden: requisitos explícitos → capacidades del workflow/checkpoint instalado → documentación versionada → resultados locales comparables → heurísticas y evidencia comunitaria clasificada. Si falta una capacidad obligatoria, bloquea esa estrategia y ofrece una alternativa, sin fingir soporte. La ausencia de imagen no obliga a inventar un inicio: T2V puede ser adecuado para ambiente o identidad no fijada. Identidad recurrente favorece MSR o composición maestra + I2V. FLF2V necesita extremos compatibles y tiempo plausible, no se elige por tener dos archivos.

Evalúa y registra candidatos excluidos: keyframes intermedios, referencias adicionales I2V, Ingredients, pose/motion, continuación y división/montaje. No están disponibles hasta validar integración. Para giros grandes busca ángulos que revelen zonas ocultas; considera keyframes coherentes o un corte antes que confiar ciegamente en reconstrucción. Toda estrategia lleva riesgo y plan alternativo. El selector automatizado es intencionalmente simple y sus reglas son configurables; el agente puede perfeccionar la propuesta con justificación y evidencia, respetando restricciones duras.

Duración según acción, habla y complejidad. Conserva la receta MSR hasta 15 s; no es máximo universal. Un diálogo requiere palabras/ritmo más pausas, acciones exclusivas y margen de corte según la guía editorial. 24 FPS inicial, no obligación del modelo. Verifica frames/FPS reales y compatibilidad de audio antes de convertir. Movimiento lento, salto de poses, falta de frames y deformación temporal son problemas diferentes: no todos se corrigen interpolando. Retiming solo si conserva significado, voces y sincronía; no acelerar una frase incorrecta para ocultarla.

Resolución: considera caras relativas, manos/props, sujetos, movimiento, VRAM libre y tiempo observado. El selector propone un perfil inicial de 1280×720 o 720×1280, configurable; no garantiza que el grafo lo exporte ni aumenta automáticamente por contar más personajes. Inspecciona pipeline/selector y mide salida. Mejor referencia estática, refinamiento de dos etapas, reparación localizada o upscale temporal solo si el defecto lo justifica y existe integración. Diferencia detalle sintetizado, interpolación espacial y cambio de tamaño. Normaliza copias para entrega uniforme y conserva originales.

Compila desde intención neutral para cada proveedor. LTX: acción cronológica concreta, cámara explícita, luz coherente y diálogo literal atribuido/audio; cortes explícitos en prosa cuando proceda multi-shot. Guarda prompt neutral y enviado. No trasplantes tags Seedance a LTX ni supongas que una seed conserva rostro/voz. Una nueva familia necesita compilador documentado, no renombrar el modelo en la estrategia.

## Continuación y experimentos

Registra archivo y timestamp/frame exacto extraído para una continuación, resolución y toma de origen. Compara con maestros en cada clip; una cadena nunca sustituye la biblioteca. Si aparece drift, reconstruye una composición desde maestros. Distingue continuidad de movimiento de dos planos unidos con corte narrativo.

Hipótesis frontal conjunta: sigue siendo **experimental**. A: I2V con composición natural; B: misma composición y referencias frontales adicionales solo si el workflow tiene entradas compatibles (los I2V actuales no las exponen); C: FLF2V con extremos coherentes; D: planos separados. No obligues miradas a cámara al inicio. A/B controla una variable principal y conserva seeds, resolución y duración comparables; C/D son alternativas de arquitectura, no una comparación causal de una sola variable. Evalúa identidad, naturalidad, continuidad y defectos; resultados insuficientes no promueven reglas.

Los diez fixtures de `assets/evaluation_cases.json` generan planes reproducibles mediante `strategy.py evaluate`. Son pruebas de planificación, **no videos ni benchmarks**. Sus variantes son propuestas y no autorizan GPU. Un experimento real requiere encargo/alcance autorizado, adaptador válido y resultados registrados; no llamar a resultados inventados o simulados evidencia local.

## Diagnóstico y recuperación

| Defecto | Corrección dirigida candidata |
| --- | --- |
| Identity drift / rostro deformado | Revisar maestros, tamaño facial y composición/condicionamiento; reanclar solo toma afectada |
| Extremidades extra, blobs o cuerpos fusionados | Separar posiciones/oclusión, simplificar contacto o dividir acciones |
| Giro deformado / saltos de pose | Referencias de otro ángulo, keyframes compatibles si hay soporte, o corte motivado |
| Morphing/fundido no solicitado | Compatibilidad de extremos, tiempo del movimiento, corte real o cambiar FLF2V por tomas separadas |
| Objetos aparecen/desaparecen / ropa cambia | Revisar estados de props, visibilidad y maestros por toma |
| Luz/geografía inconsistente | Corregir composición, direcciones de mirada, cámara, paleta y continuidad entre clips |
| Caras pequeñas | Mejores refs, escala legible o refinamiento local validado; no encerrar todas las escenas en caras |
| Movimiento lento o incorrecto | Separar pacing de acción fallida; recortar/retiming compatible o regenerar |
| Labios, palabras, voz o ambiente incorrectos | Escucha y comparación con guion, revisar hablante/tiempo; regenerar sin ocultar errores con mute |
| Upscale/interpolación con artefactos | Comparar original, reducir tratamiento/cambiar método; revisar seams y audio al procesar lotes |

Como máximo dos reintentos dirigidos por toma/pasada, con hipótesis y cambio registrado. No repetir configuración fallida sin motivo. Si persiste, conserva versión elegida y estado pendiente; explica alternativa concreta. Ante OOM inspecciona error antes de reducir alcance; no cambies silenciosamente resolución, modelo o formato.

QC registra por separado verificación técnica, visual temporal, escucha, palabras y sincronía. Mide archivo exportado y decodifica completo; observar reproducción audiovisual no equivale a decodificar. Conserva `pending` si faltan herramientas. Aprendizaje = resultados reales revisados con versión/hash de workflow, clase de plano, sujetos, movimiento, refs, parámetros, seeds, defectos, correcciones, evaluación, tiempo/costo conocidos o null; nunca estimar un costo medido inexistente.
