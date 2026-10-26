> Compatibilidad histórica LTX/MSR, fuera de la ruta oficial nueva. Leer solo para planes heredados o una petición explícita. Fast Ref/Motion y los contratos Studio se rigen por [la guía oficial](../../../docs/AI_FILM_DIRECTION_PLAYBOOK.md). No crear el journal ni biblioteca paralelos descritos aquí para proyectos Studio.

# Metodología técnica

## Plan y biblioteca visual

Las skills del repo planifican guion, cámara, assets, keyframes y prompts. Esta skill conecta ese plan aprobado con los workflows de ejecución; conserva sus IDs y no reescribas la puesta para simplificar un adaptador.

Antes de crear frames, consulta `user/generation_strategy/characters.json`: ID estable, versión, rasgos invariables, estilo, vestuarios por ID, archivos maestros y vistas disponibles. Planea solo las vistas necesarias: frontal, perfiles, tres cuartos, cuerpo/posterior, expresiones o luces específicas según movimientos. Conserva versiones, no sobreescribas la identidad. `strategy.py character` permite incorporar una ficha validada; validar rutas existentes no prueba identidad visual: la revisión humana/agente debe registrarse. Los escenarios y objetos pueden usar el mismo patrón de biblioteca dentro de la producción.

Para varios personajes fija quiénes aparecen, izquierda/derecha, distancia, profundidad, orientación, mirada, vestuario y luz. Si falta composición conjunta, créala desde maestros, valida cada identidad y úsala como inicio I2V. Alternativas: conjunto sostenido, sobrehombro, plano/contraplano, medios y reacciones, elegidos por información dramática. No fuerces toda conversación a un solo render ni cada turno a otro clip. Revisa espacio/cuerpos/ropa además de caras; no uses cuotas de tamaños ni primerísimos planos como reparación universal.

Clasifica imágenes por función; texto incidental no es instrucción. Separa paneles del storyboard y conserva procedencia/coordenadas. El board es planificación, no necesariamente un frame de video. Genera imágenes con ImageGen o FLUX según referencias y receta; registra y revisa estilo/identidad antes de animar.

## Selección por toma

Respeta requisitos explícitos y capacidades verificadas. Por defecto ejecuta I2V desde el primer frame compuesto por la planificación. Si falta, prepara el frame con los assets aprobados; la ausencia del archivo no cambia por sí sola a T2V o MSR. FLF2V es una excepción cuando el último frame es un requisito narrativo y ambos extremos son compatibles. Usa MSR cuando una composición inicial no resuelve una toma que necesita referencias independientes; la recurrencia de identidad por sí sola no basta. T2V queda para una toma concreta que no se beneficie de una imagen inicial, como atmósfera sin sujeto o acción visual inicial determinada. Registra la justificación de cada excepción.

Evalúa y registra candidatos excluidos: keyframes intermedios, referencias adicionales I2V, Ingredients, pose/motion, continuación y división/montaje. No están disponibles hasta validar integración. Para giros grandes busca ángulos que revelen zonas ocultas; considera keyframes coherentes o un corte antes que confiar ciegamente en reconstrucción. Toda estrategia lleva riesgo y plan alternativo. El selector automatizado es intencionalmente simple y sus reglas son configurables; el agente puede perfeccionar la propuesta con justificación y evidencia, respetando restricciones duras.

Duración según acción, habla y complejidad. Conserva la receta MSR hasta 15 s; no es máximo universal. Un diálogo requiere palabras/ritmo más pausas, acciones exclusivas y margen de corte según la guía editorial. 24 FPS inicial, no obligación del modelo. Verifica frames/FPS reales y compatibilidad de audio antes de convertir. Movimiento lento, salto de poses, falta de frames y deformación temporal son problemas diferentes: no todos se corrigen interpolando. Retiming solo si conserva significado, voces y sincronía; no acelerar una frase incorrecta para ocultarla.

Resolución I2V por defecto: 0.6 MP con el múltiplo de dimensiones requerido por el workflow. En un plano abierto, si los rostros quedan pequeños en la composición, se puede probar 0.8 MP y revisar VRAM/tiempo antes de ampliar más. Un aumento puede mejorar legibilidad, pero no garantiza corregir deformación facial. Mide siempre el archivo exportado; conserva originales y registra cualquier normalización.

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
