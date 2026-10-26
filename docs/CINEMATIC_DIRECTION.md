# Dirección dramática y cinematográfica

Corrección adoptada el 25 de octubre de 2026 a partir de las notas del usuario y del caso Funny Girl `EP001-SC001-R25-U01`. Complementa el playbook y gobierna los handoffs de escritura, cámara, prompts, diagnóstico y montaje. El ejemplo ilustra decisiones; no fija un estilo ni tres planos para todas las escenas.

## Identidad persistente y secuencia completa

La [corrección integral del 26 de octubre](CINEMATIC_PIPELINE_CORRECTION.md) añade CinematicStyle y SequencePlan versionados, invariantes separados del estado dinámico heredado, visualEvidence y QA en tres niveles. Prevalece ante cualquier ejemplo anterior de posiciones congeladas, ventanas largas sin justificación o voces invisibles nativas. Primero dirigir la secuencia, después dividir unidades. Cada prompt comienza con dirección de película Hollywood del género propio y conserva fotografía, actuación, ritmo y cámara concretos de la biblia.

## Escribir intención; dirigir su manifestación

Screenwriting establece qué quiere cada personaje, qué se opone, qué intenta ocultar y qué cambia. Una escena filmable también debe tener vida emocional. Las acotaciones pueden mostrar acciones que revelan esa intención sin enumerar cada parpadeo. El director interpreta el material y decide mirada, escucha, respiración, postura, gesto, voz, foco y montaje. Estas decisiones interpretativas no necesitan otra aprobación creativa rutinaria dentro del encargo.

«Preservar el guion» conserva hechos, palabras, conocimientos, decisiones y consecuencias. No prohíbe interpretar subtexto ni expresar una reacción mediante actuación. Cambiar una entrada, un descubrimiento o una ocultación explícita vuelve a Screenwriting y se importa como revisión. «Está fuera del baño» describe geografía; «permanece invisible» impone una elección de cobertura. No escribir la segunda por comodidad técnica cuando la historia solo exige la primera.

## Contrato de dirección antes del prompt

Cada unidad oficial Fast Ref/Motion necesita `Shot.direction`:

- `genre`, `dramaticObjective`, `turn` y `audienceExperience`: género, objetivo/cambio y experiencia buscada.
- `visualTreatment`: decisiones ejecutables de luz, contraste/color, escala/lente, cámara, foco y ritmo pertinentes a la escena. «Cinematic» o «Hollywood» solos no deciden nada. El género no impone una receta de cámara o color.
- `characters`: `characterId`, `objective`, `obstacle`, `subtext`, `emotionalProgression` por participante. Los pensamientos se conservan como análisis; los planos traducen lo importante a comportamiento perceptible.
- `coverageReason`: por qué esta cobertura expresa la escena. Si solo hay un plano, `singleShotReason` explica por qué sostenerlo gana algo.

Cada intervalo de `referencePlan.shots` incluye `dramaticPurpose`, `performance` observable y `visibleSubjectIds`. Después del primero incluye `cutReason`. La composición explica jerarquía y escala facial; cámara/lente, luz y profundidad apoyan esa jerarquía. No copiar un encuadre ni una cámara fija del borrador automático. No cortar mecánicamente por frase o por un límite histórico de doce segundos. El límite efectivo del workflow gobierna la unidad H3, y la acción y el ritmo gobiernan sus planos internos.

Decidir cobertura antes de compilar. Comparar un plano continuo con cortes cuando cambie la atención, aparezca información, una reacción tenga valor o estén separados los interlocutores. Un continuo puede proteger una trayectoria, contacto o tensión sostenida; un corte puede proteger identidad, anatomía o un cambio emocional. No agregar cortes decorativos ni suprimirlos para minimizar el número de planos. Dar a cada acción tiempo humano suficiente; una pausa necesita una función, no una cuota.

La CLI comprueba que estas decisiones estén registradas y sean coherentes. No sabe juzgar si una actuación conmueve o un plano funciona. El agente debe leer críticamente sus decisiones antes de aprobar; rellenar campos con frases genéricas no satisface esa revisión.

## Hablante, imagen y sonido

Cada línea original aparece una sola vez en `referencePlan.dialogueStaging`, con `beatId`, `speakerId`, `shotId`, `inSeconds`, `outSeconds`, `strategy`, `lipSync` y `rationale`, `language`, `intent` y, para ventanas excepcionales, `timingReason`. Los tiempos son locales a la unidad, ordenados y dentro del plano. La identidad usa `subjects.characterId`; la presencia visual usa `shots[].visibleSubjectIds`; la presencia sonora y la línea usan esta asignación. No atribuir una voz al actor visible más próximo.

El desglose reconoce los sufijos Fountain `(O.S.)`, `(O.C.)` y `(V.O.)` como metadatos de `Beat.delivery`, conservando el hablante. Las acotaciones en líneas parentéticas se guardan en `performanceNotes` y no son palabras habladas. El span original conserva ambas cosas para trazabilidad. Si el guion marca una voz fuera de campo, mostrarla requiere una revisión explícita de esa indicación; el compilador no decide el cambio por su cuenta.

| Estrategia | Video | Audio y montaje |
| --- | --- | --- |
| `on-camera` | El hablante original está visible y `lipSync: required` | El generador recibe su línea literal en su ventana temporal |
| `offscreen-audio` | Hablante invisible, `lipSync: none` | Voz independiente; sus palabras quedan fuera del prompt de video |
| `reaction-audio` | Oyente visible, hablante invisible, `lipSync: none` | Voz independiente sobre la reacción; palabras fuera del prompt de video |

Mostrar al hablante suele ser una solución clara cuando aporta ritmo y geografía. La invisibilidad puede ser indispensable: en ese caso elegir audio independiente, no confiar en la palabra «off-screen» dentro de un prompt con otras bocas visibles. El pipeline no incorpora un sintetizador de voz nuevo: prepara la obligación en `PromptPackage.parameters.externalDialogue`. Generar/obtener la voz necesita una herramienta real disponible y autorización aplicable; no afirmar que ya existe.

Para estrategias independientes, el montaje exige `segment.audio: external` y `externalAudio`: una mezcla completa revisada para el rango seleccionado que reemplace el audio nativo e incluya las líneas necesarias, sonido de lugar y silencio natural. Puede conservar en esa mezcla las voces nativas correctas de otros planos, una sola vez. No exportar el video mudo ni mezclar una voz duplicada. Revisar identidad vocal, palabras, tiempos, escucha y labios cuando corresponda. Una transcripción no certifica voz, música, actuación o sincronía.

## Referencias útiles

Para una identidad recurrente nueva, preferir cuando ayude un tríptico de frente de cuerpo entero, primer plano facial y espalda de cuerpo entero. Permite ángulos y una cara legible en una sola referencia; no trasladar los paneles al video. Una identidad existente revisada y suficiente puede reutilizarse sin regenerarla por formato. La proximidad facial y la interacción importan al decidir suficiencia. Los secundarios de una sola aparición pueden definirse por texto.

Separar identidad de vestuario. El atuendo incidental de una hoja no es ropa universal. Vestuario breve y localización usan primero texto canónico persistente; justificar imágenes adicionales por continuidad observada o reutilización. Un error de voz o de dirección no se arregla automáticamente con más imágenes.

## Compilación y recuperación

El compilador ejecuta la dirección aprobada. Envía tratamiento concreto, referencias ordenadas, continuidad literal, acción, actuación, cámara/foco y palabras asignadas a cada tiempo. Objetivos abstractos, razones de cortes, análisis y títulos quedan en metadatos. Después de la apertura cinematográfica, la política de audio se expresa una vez al inicio, con un recordatorio breve al final y negativo cuando lo admita el workflow: sin música ni acentos sintéticos de principio a fin, tampoco desde dispositivos. No repetir el catálogo completo entre cada bloque.

Antes de una alternativa oficial, registrar `RecoveryDecision` con `fromJobId`, `category`, evidencia en `diagnosis`, `action`, `changedVariable` y `expectedImprovement`; entregar el JSON con `generate --recovery <archivo>`. Una prueba cercana al objetivo puede refinar una variable o semilla. Si la dirección es estructuralmente débil, volver a cámara y aprobar una nueva versión; no proteger el plan fallido por la regla de una variable. Cambiar hechos requiere antes revisión narrativa. Una atribución repetidamente errónea cambia cobertura o usa audio independiente. No encadenar prohibiciones hasta agotar intentos.

Los jobs históricos conservan prompt, referencias, hashes e IDs y pueden recuperarse por ID. Sus planes siguen siendo legibles; una nueva aprobación o compilación oficial exige el contrato actual. Un job previo no cambia su prompt al actualizar el compilador. Los hallazgos de QA y las decisiones de recuperación viajan en el paquete acotado del siguiente agente.

## Caso de comprobación: Funny Girl

La unidad anterior tenía un solo plano de 10.125 s, encuadre hasta cintura, cámara inmóvil y una voz invisible junto a un invitado visible. Su continuidad y guion imponían que Steve no se viera; su descripción física completa también entraba en el prompt. El reintento añadió un párrafo de prohibiciones sin resolver la cobertura. La muestra temporal permitió comprobar una entrada indebida; la atribución vocal es un hallazgo comunicado por el usuario y no una escucha independiente del agente.

La revisión conserva beso, dos golpes, línea de Steve, respuesta de Molly y puerta cerrada. Revisa explícitamente el guion para permitir ver el pasillo. La cobertura propuesta es: intimidad en primer plano → Steve al otro lado de la puerta → Molly intentando sonar despreocupada y revelando después su incomodidad. El invitado pasa a segundo término en el plano de respuesta. Cada corte cambia atención o información y cada línea tiene su actor visible. Los tiempos 0–2.5 / 2.5–6.8 / 6.8–10.125 s son propios de esta prueba.

La comprobación del paquete y del grafo demuestra compilación y bindings, no calidad de un nuevo render. Solo una generación seguida de revisión real de imagen y audio puede confirmar el resultado cinematográfico.
