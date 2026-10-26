# AI Film Studio — Guía integrada de escritura, dirección y generación de video

**Versión:** 1.2 · **Actualización:** 26 de octubre de 2026
**Uso:** documento rector para los agentes de adaptación, guion, dirección, generación, evaluación y montaje. Sustituye las reglas de dirección previas cuando entren en conflicto.  
**Idioma de planificación:** español o idioma del proyecto. **Prompts cinematográficos:** inglés.  
**Principio rector:** diseñar historias que sean emocionantes **y filmables**, no escribir primero una historia imposible y delegar todos sus problemas al generador de video.

> **Estado de la evidencia.** Esta guía se basa en las pruebas narradas por el equipo con tres referencias (A: mujer, B y C: hombres), MiniMax H3 Fast Ref y Motion. Son resultados prácticos de ejecuciones concretas, no garantías universales ni benchmarks controlados. Una técnica marcada como **observada** funcionó o falló en al menos una prueba; **hipótesis** exige nuevas comparaciones; **regla operativa** es una decisión útil basada en esas observaciones. Revisar al cambiar de checkpoint, LoRA, duración, resolución, sampler o hardware.

La [corrección de dirección dramática y cinematográfica](CINEMATIC_DIRECTION.md), adoptada en la misma fecha tras revisar Funny Girl, concreta actuación, cobertura y atribución de voces. Prevalece ante ejemplos anteriores que deleguen diálogo invisible al audio nativo o minimicen planos sin una razón dramática.

La [corrección integral de producción](CINEMATIC_PIPELINE_CORRECTION.md), adoptada el 26 de octubre de 2026, exige identidad Hollywood concreta por género, CinematicStyle persistente, SequencePlan global antes de dividir generaciones, estados dinámicos heredados y QA de toma/continuidad/secuencia. Los ejemplos son fragmentos didácticos: completar su biblia cinematográfica, audio sin música, estados y referencias antes de compilarlos. No constituyen excepciones al contrato actual.

## 1. Contrato de extremo a extremo

El sistema recibe una novela, sinopsis o idea y debe producir, con intervención mínima, capítulos y clips terminados. El flujo es:

`Obra/idea → adaptación original → biblia narrativa → guion filmable → desglose de acciones → biblia cinematográfica → dirección de secuencia completa → invariantes y estados dinámicos → selección de referencias → enrutamiento de modelos → prompts temporizados → generaciones → QA → recuperación → montaje → subtítulos y publicación`.

**La escritura y la producción son un único ciclo.** El guionista debe conocer las capacidades y limitaciones de los modelos. El director puede pedir reescribir o redistribuir una acción antes de consumir una generación. El evaluador debe enviar hallazgos al guionista, no solo al generador.

**Cuando se use una novela como inspiración:** identificar las premisas, emociones, tropos y estructuras que interesan; crear personajes, diálogos, situaciones y escenas suficientemente originales. No asumir derechos para reproducir literalmente una obra de terceros. Si el proyecto pretende adaptarla fielmente, requerir una base de derechos apropiada.

## 2. Hallazgos empíricos que no deben perderse

### Conversación y puesta en escena

- **Observado:** los close-ups y medium close-ups de un rostro por plano producen actuaciones y rostros consistentes con Fast Ref.
- **Observado:** los demás personajes pueden aparecer al fondo ligeramente desenfocados, de espaldas o parcialmente ocluidos, y la escena se siente natural. No prohibir los planos compartidos indiscriminadamente.
- **Observado:** un cambio de foco (*rack focus*) de A a B funcionó muy bien en Motion; el rostro de B recuperó detalle al entrar en foco.
- **Observado:** la cámara orbitó alrededor de personajes relativamente quietos sin perder consistencia. El movimiento de cámara no equivale a rotación corporal.
- **Observado:** dos clips de conversación de ~20 segundos, con posiciones, iluminación, vestuario y escenario repetidos **solo en texto**, se pudieron unir de manera convincente.
- **Observado:** aportar video anterior como referencia provocó un problema grave de recursos/crash en el equipo utilizado. No es el modo predeterminado.
- **Observado:** títulos internos como “The Question” o “The Revelation” llegaron a pronunciarse. **No incluir títulos poéticos dentro del prompt de generación.**

### Acciones físicas

- **Observado, Fast Ref:** abrazo, entrega de llave, caminar fuera de una habitación y transportar una caja resultaron bien; el abrigo se puso correctamente pero su acción continuó repitiéndose.
- **Observado, Fast Ref:** persecución en escaleras, baile con vueltas, forcejeo y vaso/pancake volando presentaron lentitud, confusión o secuencias físicamente incompletas.
- **Observado, Motion 10 s a 0.4:** mejora velocidad y claridad de persecución, empujón y trayectoria del pancake frente a los resultados previos de Fast Ref; la llave y el abrazo funcionaron.
- **Observado, Motion 10 s:** correr de espaldas y saltar un obstáculo funcionaron; la cara tendió a deformarse cuando un cuerpo en movimiento giró bruscamente hacia cámara.
- **Observado, Motion:** cruce de personas frente a cámara, movimiento simultáneo en segundo plano, paso por una puerta, rack focus y cámara orbital funcionaron bien.
- **Observado, Motion:** lanzamiento/recepción de pelota tuvo trayectoria comprensible pero anticipación y recepción corporales antinaturales.
- **Observado:** la escena de superhéroes corriendo funcionó, pero aparecieron duplicaciones al pasar del despegue al vuelo.
- **Observado:** una pelea con empujón y caída siguió instrucciones pero no transmitió fuerza suficiente; demasiados segundos de agarre pueden convertirse en forcejeo sin progreso.
- **Observado, Motion 15 s a 0.4:** aumentaron los slops, las torsiones del torso y el tiempo/memoria; 10 s fue un punto operativo más eficiente en el equipo probado.

### Hipótesis útiles pero todavía no demostradas

- Los movimientos rápidos con giro de torso/cabeza hacia la cámara elevan el riesgo de *face morphing*.
- Las acciones con inicio, trayectoria y estado final concretos son más fiables que las acciones cíclicas o ambiguas.
- Reservar demasiados segundos para una sola acción genera repeticiones, relleno o cámara lenta.
- Las cadenas físicas causa → trayectoria → contacto → consecuencia son más difíciles que un movimiento controlado simple.
- Un sujeto facial principal en foco y personajes secundarios con menor carga de detalle reducen defectos sin empobrecer la escena.

**No convertir correlaciones de unas pocas muestras en verdades absolutas.** Repetir pruebas antes de elevar una heurística a una restricción dura.

## 3. Reglas para el agente escritor: escribir escenas filmables

### 3.1 Antes del diálogo, seleccionar una gramática visual

Toda escena debe responder: quién desea qué, qué cambia, quién actúa, qué objeto importa, cuál es el estado físico inicial, cuál es el estado físico final y qué revelación o emoción justifica el corte.

Elegir uno de cuatro perfiles por *beat*:

1. **DIALOGUE:** tensión, comedia, revelación, explicación breve, rostro y voz protagonistas.
2. **CONTROLLED_ACTION:** abrazo, abrir una puerta, entregar objeto, caminar, cargar caja, beso con postura estable.
3. **DYNAMIC_ACTION:** correr, perseguir, saltar, bailar, empujar, caer, lanzar/atrapar.
4. **COMPLEX_TRANSITION:** pelea encadenada, cambio de vehículo/asiento, correr y pasar a volar, interacciones de 3+ cuerpos, giro rápido con revelación facial.

Las escenas pueden mezclar perfiles, pero no exigir que un único clip resuelva todos.

### 3.2 Restricciones que afectan la escritura

- **Preferir personajes recurrentes con referencias propias.** Un figurante de una escena puede existir solo mediante texto.
- **Evitar multitudes cuando no agreguen valor dramático.** Personajes adicionales pueden duplicar identidades conocidas; si solo aportan ambiente, usar silhouettes, backs, blurred extras o sonido fuera de campo.
- **Una gran acción por clip Motion.** No encadenar salto + giro hacia cámara + caída + diálogo en diez segundos si se puede montar en dos planos o clips.
- **Mostrar consecuencia, no cada milisegundo.** Para una pelea: mirada → golpe con vista lateral → reacción en plano aparte. No exigir una pelea larga y continua si la acción no es central.
- **No resolver un giro narrativo con una persona que aparece de la nada.** Preparar su ubicación, entrada, dirección de mirada o presencia audible antes del corte.
- **Ajustar diálogo al tiempo físicamente disponible.** Un personaje no puede correr, sostener un objeto, girar bruscamente, besar a alguien y pronunciar dos frases largas al mismo tiempo.
- **No inflar acciones triviales.** Repartir segundos sobrantes en motivaciones, silencios dramáticos significativos, reacciones o nuevas acciones breves.
- **Para historias de aprendizaje de inglés:** diálogo natural y comprensible (p. ej. B1 si el proyecto lo requiere), frases breves, sentido emocional y subtítulos correctos. El aprendizaje no debe volver artificial la actuación.

### 3.3 Diseñar soluciones narrativas alternativas

Ejemplos de reescritura *antes* de generar:

| Escritura inicial arriesgada | Versión filmable manteniendo intención |
|---|---|
| Tres protagonistas corren frontalmente, giran y se enfrentan | Primer plano breve → carrera posterior en Motion → plano estable de confrontación |
| Lucha larga con forcejeos y múltiples golpes | Dos o tres impactos decisivos, consecuencias visibles, corte a reacción |
| Pancake vuela entre tres personas en una cocina caótica | Un lanzamiento legible en toma continua, luego reacciones separadas |
| Personaje corre, salta y gira la cabeza frontalmente al aterrizar | Salta y aterriza de espaldas; corte posterior a su rostro ya estable |
| Tres personas conversan de frente en plano general | Sujeto enfocado, otros detrás desenfocados; OTS y reacciones individuales |
| Secundario desconocido habla con el protagonista una vez | Apariencia definida por texto; plano individual o parcialmente de espaldas |

**No sacrificar la historia por restricciones técnicas:** si una acción compleja es irremplazable para el momento dramático, conservarla, dividirla y considerar Seedance como escalamiento.

## 4. Biblia de continuidad: texto como primera opción

El sistema conserva dos capas versionadas: invariantes de escena y estado dinámico completo por unidad. No copiar como inmutable una posición, dueño de objeto o emoción que cambie:

- **Personajes:** invariantes de identidad, referencia, ropa y voz; estado dinámico de presencia, posición/postura, manos, herida, mirada y emoción.
- **Set:** nombre canónico, arquitectura, mobiliario, fondo dominante, fuentes de luz, hora, paleta.
- **Mapa espacial permanente:** ventana a la izquierda de consola; entrada al fondo, relaciones entre espacios y eje. La posición actual de A/B/C va en dynamicState.
- **Objetos persistentes:** apariencia invariable; posición/propietario, llave en bolsillo o mesa, maletín sostenido, abrigo puesto y puerta abierta/cerrada se actualizan en dynamicState.
- **Eje de pantalla:** dirección de miradas y desplazamiento para preservar 180°; no cambiar izquierda/derecha sin una motivación visual.
- **Timeline:** hechos ocurridos, frases ya pronunciadas, emoción al terminar, estado al comenzar siguiente clip.

### Política de anclas

Por defecto, **repetir literalmente solo el bloque de invariantes de continuidad** entre prompts de una misma secuencia. El prompt del clip 2 no debe decir solo “same room as before”, porque el modelo no tiene memoria garantizada del clip 1.

**Ejemplo de bloque canónico que se copia sin cambios:**

> Aboard a deep-space exploration ship in 2189. A dark metallic observation room has one star-facing window left of the central console and a communications station behind the console. Soft cyan instruments contrast with warm-white facial light. A wears a fitted dark navy command uniform, B a charcoal-gray engineering uniform, and C a dark technical jumpsuit. Keep architecture, outfits, lighting and screen axis consistent.

Cada generación copia además el **estado físico/emocional final anterior completo** en su inicio, incluyendo entradas/salidas, manos/objetos/puertas y ledgers de acciones/frases. Por ejemplo: `A has just heard that the voice belongs to her dead daughter; she is devastated`. No usar el video anterior por defecto.

**Empalme entre dos clips:** preferir corte cinematográfico motivado o plano-reacción estable; no exigir reproducción pixel a pixel del último fotograma si no se suministra. Al editar, preservar continuidad de voz, room tone y dirección de mirada. El resultado satisfactorio que observamos fue **continuidad perceptiva**, no identidad matemática de cada fotograma.

## 5. Política de referencias: el mínimo suficiente

Cada referencia cuesta tiempo, memoria y potencialmente introduce conflicto. No agregar referencias simplemente porque existen.

| Recurso | Decisión predeterminada | Cuándo cambiar |
|---|---|---|
| Protagonista recurrente | Imagen de identidad | Siempre que aparezca reconocible |
| Personaje recurrente | Imagen propia | Cuando hable o aparezca múltiples veces |
| Mesero / figurante de una escena | Solo texto | Crear imagen solo si la identidad falla o reaparece con relevancia |
| Habitación de una escena corta | Descripción textual exacta | Imagen del set si el texto no conserva geometría |
| Vestuario de 2–3 clips | Texto canónico | Imagen de atuendo solo si cambia entre clips |
| Vestuario de una fiesta de varios capítulos | Referencia combinada personaje + vestuario | Cuando el costo se amortice en muchos clips |
| Video previo como referencia | No usar | Solo en prueba aislada y con presupuesto de VRAM confirmado |
| First/last frame | No usar por defecto | Cuando pruebas controladas demuestren mejora neta |

**Umbrales orientativos, no absolutos:** evaluar una nueva referencia de vestuario o set si es importante en ≥6 clips, cruza varios capítulos o ha fallado en al menos dos generaciones textuales. Medir primero el costo de crear y usarla contra regenerar con texto.

El sistema conserva un `reference_manifest`: qué personaje, atuendo y set usa qué activo, dónde se aplica y qué costo/latencia añade. No generar una referencia separada para cada clip.

**Precaución de derechos comerciales:** verificar licencia aplicable a los pesos/modelos locales y al proveedor externo antes de monetizar resultados. ComfyUI indica requisitos específicos de licencia comercial para los pesos locales de MiniMax H3. [Fuente](https://docs.comfy.org/tutorials/video/minimax/minimax-h3).

## 6. Selección del generador: Fast Ref, Motion y Seedance

**Perfil operativo observado en este equipo, sujeto a benchmarking local:**

| Generador | Default | Conviene para | Riesgos |
|---|---|---|---|
| **MiniMax H3 Fast Ref** | Conversaciones ~20 s, referencias de identidad | acting, emociones, labios, close-ups, rack de montaje conversacional, acciones controladas | carrera lenta, giros, forcejeo, cadenas físicas, deformaciones de personajes lejanos |
| **MiniMax Motion** | 10 s, resolución 0.4 | correr, saltar, recorrer espacios, puertas, baile, cámara móvil, oclusión, golpes simples | giros de cuerpo hacia cámara, deformaciones faciales durante movimiento, slow motion, manos rápidas |
| **Seedance** | Reserva de pago | set pieces indispensables y complejas donde alternativas locales no funcionan | créditos, disponibilidad, variabilidad, restricciones del proveedor |

**No asumir que 20 s o 10 s son máximos universales del modelo.** Son los puntos que funcionaron razonablemente en el workflow/hardware probados. La guía oficial de H3 describe duración nominal cercana a 15 s y distingue workflows de referencia, texto e imagen. Los 20 s usados aquí son del workflow local particular. [Fuentes](https://docs.comfy.org/tutorials/video/minimax/minimax-h3), [workflows](https://docs.comfy.org/tutorials/video/minimax/minimax-h3-native).

### Árbol de decisión

1. ¿La emoción, diálogo y rostro son lo que sostiene el beat? **Fast Ref.**
2. ¿La acción requiere trayectoria física y el movimiento es protagonista? **Motion.**
3. ¿La acción es simple, controlada y ya salió bien en Fast Ref? Puede quedarse en **Fast Ref** para ahorrar cambio de workflow.
4. ¿Es un close-up de reacción después de un salto, carrera o golpe? **Fast Ref en clip separado** o Motion con sujeto detenido.
5. ¿Motion no resuelve la acción a pesar de reducirla, controlar ángulo y probar otra semilla? Reescribir visualmente, buscar referencia de movimiento apropiada o **escalar a Seedance**, con límite de gasto.
6. ¿Se requiere simultáneamente coreografía de alta complejidad, identidades visibles y transición físicamente precisa que no puede fragmentarse? **Seedance preferente**, si los créditos y la licencia de la plataforma lo permiten.

No usar Seedance por defecto solo porque una escena contenga acción; tampoco prohibirlo cuando una acción importante falló localmente.

### Presupuesto y política de recuperación

- **Intento 1:** ruta local recomendada, resolución de trabajo.
- **Intento 2:** una variación **diagnóstica**: cambiar una variable (framing, velocidad, trayectoria o beat), manteniendo trama y referencias.
- **Intento 3:** si tiene valor, seleccionar otra ruta local o dividir en clips cortos; no hacer bucles indefinidos.
- **Escalar a Seedance:** si el clip es narrativamente indispensable, sigue fallando, tiene prioridad alta y el costo proyectado está dentro del `premium_budget_per_episode` configurado.
- **Si se agota el presupuesto:** reescribir plano/guion o entregar reporte de bloqueo; no gastar silenciosamente más créditos.

Registrar segundos utilizables y coste por segundo aprobado; no medir solo cuántos videos generamos.

## 7. Dirección de encuadre, cámara y actuación

### Composición

- Establecer una jerarquía visual deliberada; un rostro dominante suele ser útil. Pueden estar presentes múltiples personajes y compartir protagonismo cuando el beat lo requiera, sin exigir que todos muestren un rostro nítido.
- Usar foreground shoulders, backs, profiles, focus falloff y rack focus como recursos dramáticos reales.
- No imponer plano general inicial. Una escena puede empezar con una frase, un rostro, una mano o un objeto y establecer el espacio después.
- Cuando se necesite ver cuerpo entero para salto o baile, priorizar anatomía y trayectoria, aunque el rostro no sea legible durante esos segundos.
- La cámara puede orbitar o desplazarse alrededor de cuerpos casi quietos. No confundir esto con pedir a los actores rotaciones rápidas.
- **No hacer un face reveal frontal mientras el cuerpo sigue girando o aterrizando.** Dejar estabilizarse y cortar al close-up después.

### Cámara y cortes

**Diálogo ~20 s:** normalmente 3–5 planos con actos y reacciones claras; no forzar cinco si la tensión gana con un plano largo.

**Motion ~10 s:** normalmente 1–3 planos. Si se exigen cuatro o cinco, cada corte debe justificar una causa-efecto o identidad, no ser decoración. Un plano continuo es mejor para la trayectoria de un objeto o una puerta.

- Cortar **después** de que un movimiento crucial haya cruzado su punto de causalidad (lanzamiento → contacto), o usar un corte de acción que respete posición y vector.
- Durante una carrera, primer plano frontal muy breve para identidad → cámara detrás para velocidad → reacción estable en otro plano.
- Para acciones simultáneas, definir quién domina el enfoque y quién queda al fondo.
- Para impacto, preferir ángulo lateral o tres cuartos, contacto legible y reacción inmediata, evitando forcejeos de relleno.

### Tiempo natural

Cada beat físico contiene: **preparación → ejecución → estado final**. Dar segundos proporcionales a la acción, no simplemente repartir bloques idénticos.

Mal: `4–14s: she puts on her coat` (puede repetir ajuste tras terminar).  
Mejor: `4–8s: arms enter sleeves; 8–10s: coat rests on shoulders, helper releases it; 10–14s: she turns and responds, coat already on`.

Mal: `They fight intensely for nine seconds` (puede generar agarrones estáticos).  
Mejor: `A punch → recoil → separate → consequence`, con acciones inequívocas y cortes inteligentes.

## 8. Gramática obligatoria del prompt

El prompt de generación debe tener **solo instrucciones ejecutables**. Títulos internos de guion se conservan en metadatos del plan, **no** en texto enviado al modelo.

Orden recomendado:

1. `Duration; genre; natural real-time pace; visual style`.
2. `Reference mapping` con nombres/tags exactos `<Picture 1>`, etc., si el workflow los usa.
3. `Setting` y bloque canónico de continuidad.
4. `Character blocking`: quién está dónde y dónde queda el objeto.
5. `0–Xs`, `X–Ys`: encuadre, acción, estado final y diálogo atribuible.
6. `Cinematography`: cámara, foco y ritmo de corte.
7. `Physical continuity`: trayectoria, interacción, persistencia de utilería.
8. `Dialogue instruction`: `Only text inside quotation marks is spoken. All other text is visual direction.`
9. **Pocas prohibiciones relevantes**, no una lista interminable de “no”. Priorizar formulaciones positivas.

El modelo nunca debe leer como voz `The Question`, `The Betrayal`, `Shot Two` u otros rótulos. Los tiempos son límites de dirección, no texto hablado.

---

## 9. Ejemplos de prompts probables y su propósito

> Los ejemplos siguientes son **fragmentos de dirección**, no prompts completos ni garantías. Primero definir CinematicStyle y SequencePlan, sustituir A/B/C por sujetos concretos, repetir solo invariantes y heredar estados completos. El compilador añade la identidad cinematográfica completa y la política sonora. Las posiciones de estos ejemplos pertenecen a cada intervalo, no al canonicalText permanente.

### Ejemplo A — Fast Ref: confrontación dramática (20 s)

```text
Ultra-photorealistic scene from a premium Hollywood crime thriller feature film. Rain-blue exterior contrast against warm practicals, intimate facial lighting, restrained confrontational acting and cuts motivated by changing knowledge. Duration: 20 seconds.

<Picture 1>: A, adult woman. <Picture 2>: B, adult man. <Picture 3>: C, adult man. Preserve facial identity for each speaking character.

A luxurious penthouse living room at night. Heavy rain against floor-to-ceiling windows, cold blue exterior light and warm amber lamps. A wears a dark blouse and stands to the left of the dining table. B wears a charcoal suit and sits opposite her. C wears a black suit and stands near the rain-streaked window. These are their initial positions; inherit subsequent states from each directed interval.

0–4 seconds: Tight medium close-up of A. Her eyes are wet. She looks toward B outside the frame and says, "They found the car."
4–8 seconds: Medium close-up of B at the table, face clearly visible. He says, shaken, "I watched it burn."
8–12 seconds: Medium close-up of C near the window. He lowers his eyes, then says, "You burned the wrong car."
12–16 seconds: Over-the-shoulder from behind B; his shoulder softly blurred in foreground, A sharply focused. A asks, "Whose car was it?"
16–18 seconds: HARD CUT to C in close-up at the window. He meets A’s eyeline and says, "Your sister's."
18–20 seconds: HARD CUT to A in an intimate close-up. Her breath catches; her eyes lose their confrontational focus as she understands who died.

Use clean editorial cuts, stable eyelines, rich atmospheric sound and soft depth of field. No wide group shot is necessary. Secondary characters may be off camera or blurred. Only dialogue in quotation marks is spoken aloud.
```

### Ejemplo B — Dos clips conversacionales unidos solo con texto

**Bloque compartido: copiar literalmente en cada prompt:**

```text
Aboard a deep-space exploration ship in 2189. A dark metallic observation room has one star-facing window left of the central console and a communications station behind the console. Soft cyan instruments contrast with warm-white facial light. A wears a fitted dark navy command uniform, B a charcoal-gray engineering uniform, and C a dark technical jumpsuit. Keep architecture, outfits, lighting and screen axis consistent.
```

**Clip 1 (20 s):**

```text
Ultra-photorealistic scene from a premium Hollywood science-fiction thriller feature film. Cyan consoles against warm-white face light, shallow listening close-ups, psychologically grounded uncertainty and focus changes driven by discoveries. Duration: 20 seconds. <Picture 1> A, <Picture 2> B, <Picture 3> C. [INSERT THE SHARED SETTING BLOCK VERBATIM]

0–4 seconds: Close-up of A, facing B: "You traced the signal to the medical bay?"
4–8 seconds: Close-up of C at the communications console: "Yes. That door's been sealed for forty years."
8–12 seconds: Close-up of B at the main console: "Then it's a glitch. Nobody's been down there."
12–16 seconds: Over B's shoulder, A's face in focus: "A glitch doesn't know my name."
16–18 seconds: HARD CUT to C at communications, lips visible: "It called you Mom."
18–20 seconds: HARD CUT to A; her breath catches and her gaze loses focus as the words register.

Keep lighting, clothing, gaze direction, sound ambience and spatial geography consistent. Only quoted dialogue is spoken.
```

**Clip 2 (20 s):**

```text
Ultra-photorealistic scene from a premium Hollywood science-fiction thriller feature film. Preserve the same cyan/warm-white lighting, intimate listening coverage and discovery-driven focus changes. Duration: 20 seconds. Immediate continuation; inherit the complete previous final state. <Picture 1> A, <Picture 2> B, <Picture 3> C. [INSERT THE SHARED SETTING BLOCK VERBATIM]

Emotional starting state: A has just learned the voice called her Mom. She is devastated. B is worried and C is ashamed. Do not repeat dialogue already spoken.

0–4 seconds: Eye-level close-up of A, still shaken, facing slightly camera-right. "My daughter died before we launched."
4–8 seconds: Medium close-up of B at the same console: "We know. That's why we didn't tell you."
8–12 seconds: Medium close-up of C by communications: "I checked the recording. It's really her voice."
12–16 seconds: Over B's shoulder, A sharply in focus: "What does she want?"
16–19 seconds: HARD CUT to C at communications, lips visible: "She wants you to open the door."
19–20 seconds: HARD CUT to A as a distant knock interrupts her held breath.

Preserve the previous clip's wardrobe, architecture, relative positions, character identities and mood. Use a deliberate cinematic cut rather than requiring an identical first/last frame. Only quoted dialogue is spoken.
```

**Nota para implementación:** `[INSERT ...]` es instrucción del planificador, **no** texto que debe enviarse a MiniMax. El ensamblador debe sustituir ese marcador por la descripción completa.

### Ejemplo C — Motion: persecución con montaje y cara protegida (10 s, 0.4)

```text
Ultra-photorealistic scene from a premium Hollywood action thriller feature film. Cold industrial overhead light, tactile full-speed running, grounded foot impacts, urgent tracking and trajectory-preserving cuts. Duration: 10 seconds. Motion workflow at configured 0.4 resolution.

<Picture 1>: A, adult woman. <Picture 2>: B, adult man. C is not visible.

A narrow industrial corridor connected to a concrete stairwell, lit with cold overhead lights. A chases B toward the stairwell; B remains ahead of A throughout. No bystanders.

0–2 seconds: Tight chest-up tracking close-up of A running toward camera. Face large and sharply recognizable, corridor behind her softly blurred. Rapid but physically believable movement.
2–6 seconds: Clean cut to rear three-quarter tracking view of B running toward the stairwell, A following several steps behind. Faces are not required during the fast movement. The two runners keep distinct clothing and consistent separation.
6–8 seconds: Medium side shot of B opening the stairwell door and running through; A reaches the doorway after him. Each crosses in the same direction.
8–10 seconds: Low-angle shot of the landing: B reaches it, A follows, then both continue upward with backs toward the camera. End during continuous motion, without a sudden frontal face reveal.

Clear editorial cuts, grounded foot placement, physically coherent velocity and stair geometry. One main action per shot. Only A and B appear. No dialogue. Natural real-time speed.
```

### Ejemplo D — Motion: entrega de objeto + línea (10 s, 0.4)

```text
Ultra-photorealistic scene from a premium Hollywood intimate suspense drama feature film. Warm desk light shapes faces against a dim office; shallow focus reveals the silver key, withheld breath and a precise handoff before a motivated reaction cut. Duration: 10 seconds. Motion workflow at configured 0.4 resolution.

<Picture 1>: A, adult woman. <Picture 2>: B, adult man. C is not present.

A dim modern office at night. A stands beside a wooden desk. B stands opposite her holding one small silver key. Warm neutral light illuminates both faces. Their relative positions remain fixed.

0–3 seconds: Stable waist-up medium composition showing B's hand, the key and tabletop. B places the key on the desk and slides it toward A.
3–6 seconds: The key travels across the table; A stops it with two fingers, picks it up, and keeps it in her right hand. The transfer has ended.
6–8 seconds: Cut to medium close-up of A examining the same key, then lifting her eyes toward B outside frame.
8–10 seconds: A says, "So it's real." B remains silent off-screen.

The same single silver key persists; slide, stop, lift, hold and dialogue occur in that order. Realistic fingers and contact. Only quoted dialogue is spoken.
```

### Ejemplo E — Escena difícil: pelea con impacto en lugar de forcejeo

**Problema observado:** en una pelea de 10 s, agarrar la ropa + apartar manos + empujar + caer produjo una secuencia correcta pero demasiado teatral. No repetir el agarre durante segundos.

```text
Ultra-photorealistic scene from a premium Hollywood action drama feature film. Motivated apartment practicals, physically convincing full-speed contact, readable side coverage and impact-driven reaction cuts. Duration: 10 seconds.

<Picture 1>: A, adult woman. <Picture 2>: B, adult man. <Picture 3>: C, adult man.

A modern apartment at night. B and C face one another directly beside a large padded sofa. A watches from near the doorway. Keep the same side of the sofa on screen through the impact.

0–2 seconds: Tight medium close-up of B. He stares at C and says, "You lied to me."
2–5 seconds: Stable three-quarter side action shot from waist up, including the sofa behind C. B throws one fast controlled punch toward C's upper body; C recoils immediately. Their bodies remain anatomically separate and understandable.
5–7 seconds: Same side of action. C surges back and makes one decisive push against B's upper chest; B's balance shifts backward, with two clear recovery steps.
7–9 seconds: Medium side shot continuing B's backward trajectory. B falls onto the padded sofa; cushions compress under his weight. He does not deliberately sit down.
9–10 seconds: Tight close-up of A, recoiling in shock. No additional motion or dialogue.

Each impact has one immediately visible consequence; the exchange is short and decisive. Avoid prolonged hand-grabbing and repeated wrestling. Do not insert a frontal facial turn during the physical impact.
```

**Esta pelea es una hipótesis para retesting**, no un patrón validado. Si no funciona, dividir la acción, usar referencia de movimiento o escalar.

### Ejemplo F — Seedance: solicitud de escena irremplazable

**Primero generar un *brief* independiente del proveedor:**

```text
Scene goal: Two identified superheroes sprint along a skyscraper roof, jump from the same edge, and transition to sustained powered flight. Their suits are distinct and unchanged.
Story value: The moment is the episode's signature reveal; it cannot be removed.
Character references: A = crimson cape; B = dark blue cape. C is absent.
Spatial anchors: both run left-to-right toward one clearly defined rooftop edge; same skyline and sunset throughout.
Action beats: 0–3s sprint; 3–5s takeoff; 5–9s two-character flight; 9–10s stable trailing view.
Cinematography: close-up at start only when stable; side/rear action angles during takeoff; no frontal turns mid-flight.
Acceptance: exactly two distinct superheroes, no duplicates, coherent leap and flight, consistent cape colors, motion at plausible speed.
Past local defects: cloned background heroes appeared on takeoff; changing a running jump into flight was unreliable.
Budget: bounded premium escalation; follow provider's actual available duration, inputs, prompt syntax and safety rules.
```

El adaptador de Seedance traduce este brief a la interfaz real de la cuenta conectada. No fingir que el prompt de MiniMax es idéntico al de Seedance. Algunas APIs actuales admiten imágenes y videos de referencia y duraciones hasta 15 s, pero esos límites dependen del proveedor y del modelo elegido. [Referencia técnica](https://dev.runwayml.com/learn/seedance-2-0-api).

## 10. QA automático, fallos y recuperación

Toda generación debe pasar por una revisión de **identidad, anatomía, movimiento, continuidad, temporalidad, causalidad y diálogo**. Para automatización, el agente evaluador puede usar inspección de fotogramas distribuidos, segmentos de video y transcripción de audio; no basar un rechazo únicamente en un fotograma aislado.

### Defectos normalizados

| Código | Síntoma | Primera reparación |
|---|---|---|
| FACE_DISTANCE | Caras pequeñas deformadas | Sujeto en primer plano, fondo blurred/de espaldas |
| FACE_TURN | Rostro se deforma durante giro rápido | Terminar movimiento de espaldas y cortar a rostro estable |
| IDENTITY_SWAP | A se convierte en B | Reducir cuerpos activos, reforzar posiciones y diferencias de vestuario |
| DUPLICATE_CHARACTER | Extras con cara A/B/C | Exactamente N personajes; excluir extras no necesarios |
| SPATIAL_JUMP | Cambia lado, asiento o puerta | Mapa de posición persistente y plano desde un lado claro |
| ACTION_LOOP | Repite abrigo/agarrón | Reducir ventana de acción y declarar estado final |
| SLOW_MOTION | Carreras, gestos o impactos lentos | Una acción breve por beat; velocidad real; comparar con Motion |
| CAUSALITY_BREAK | Objeto aparece al final sin trayectoria | Plano continuo con origen, viaje, contacto y destino |
| HAND_PHYSICS | Lanzar/atrapar con movimientos raros | Simplificar agarre, reducir velocidad, cambiar ángulo o usar referencia de movimiento |
| CUT_DISCONTINUITY | Corte cambia posición/cuerpo | Repetir estado antes/después; eliminar corte innecesario |
| DIALOGUE_LEAK | Modelo pronuncia títulos | Eliminar títulos y limitar habla a líneas entre comillas |
| EMPTY_TIME | Tiempo muerto sin intención | Reasignar duración a reacción o nuevo beat narrativo |

### Criterios de aceptación sugeridos

El clip es **aprobado** si la acción necesaria para entender el beat se comprende, identidad del protagonista se mantiene, las voces y líneas correctas se pronuncian, y no contiene fallos de anatomía/continuidad visualmente evidentes en los segundos que irán al montaje.

Un error periférico muy breve puede ser tolerable si el encuadre o corte final lo excluye y no compromete el relato. Rechazar inmediatamente duplicación visible de protagonistas, morphs notorios, acción causal ausente, diálogos equivocados o una geografía imposible en un plano central.

Guardar por clip:

```json
{
  "scene_id": "EP01-S05",
  "clip_id": "EP01-S05-C02",
  "beat_type": "DYNAMIC_ACTION",
  "generator": "MINIMAX_MOTION",
  "duration_s": 10,
  "resolution_setting": 0.4,
  "reference_ids": ["A", "B"],
  "continuity_block_id": "SET-CORRIDOR-V1",
  "shots": ["front_face", "rear_tracking", "landing"],
  "required_event": "A chases B into stairwell",
  "status": "needs_review",
  "issues": ["FACE_TURN"],
  "usable_seconds": 8,
  "retry_count": 1,
  "premium_cost": 0
}
```

Guardar modelo/checkpoint, LoRA, sampler, steps, seed, ratio, VRAM pico, tiempo de generación y prompt completo como metadatos cuando estén disponibles. El `resolution_setting` registra la escala usada en el workflow, no una resolución universal en megapíxeles.

## 11. Responsabilidades de agentes y retorno de feedback

1. **Adaptador narrativo:** obtiene la intención de la obra y propone una historia original o licenciada, personajes, arco, hooks y lenguaje objetivo.
2. **Guionista-filmabilidad:** decide beats, tensión, duración, diálogos y riesgos físicos. Reescribe escenas demasiado exigentes antes de producción.
3. **Continuity manager:** mantiene biblia de personajes/set, vestuario, mapa espacial, objetos persistentes, estado emocional y manifest de referencias.
4. **Director / cinematógrafo:** elige encuadre y número de cortes según física real y riesgo facial; redacta prompts por beat.
5. **Model router / budget controller:** selecciona Fast Ref, Motion o Seedance y controla costo y VRAM.
6. **Generador:** produce clip y adjunta parámetros exactos, prompts y referencias realmente utilizadas.
7. **QA / editor:** inspecciona y clasifica defectos, decide recorte, reintento o escalamiento; conserva sonido y continuidad en montaje.
8. **Learning loop:** agrega hallazgos a la base de pruebas y actualiza propuestas para escritura y dirección, sin convertir una sola muestra en prohibición absoluta.

**Regla fundamental:** un error estructural recurrente debe cambiar el **diseño de la escena**; un error aleatorio puede justificar otra seed; un fallo de capacidad debería cambiar el workflow o proveedor.

## 12. Checklist de aceptación antes de generar

- ¿La escena es narrativamente necesaria y tiene un cambio claro?
- ¿Cada personaje visible tiene propósito? ¿Alguna referencia es superflua?
- ¿La biblia cinematográfica y los invariantes están completos, y el estado dinámico inicial hereda completo el final anterior?
- ¿Se entiende a quién mira y habla cada personaje sin que parezca gritarle a la nada?
- ¿Hay un sujeto visual principal y los secundarios tienen enfoque deliberado?
- ¿Las acciones tienen inicio, trayectoria, final y duración natural?
- ¿Una rotación rápida expone innecesariamente un rostro frontal?
- ¿Se pueden filmar la causa y consecuencia de cada objeto importante?
- ¿Los cortes preservan dirección y ubicación?
- ¿El prompt contiene solo texto hablado entre comillas, sin títulos pronunciables?
- ¿El modelo seleccionado corresponde al riesgo predominante?
- ¿Se usó la menor cantidad de referencias suficiente?
- ¿Está registrado el plan de recuperación y presupuesto máximo?
- ¿La generación se puede empalmar y montar sin romper continuidad sonora?

## 13. Reglas de precedencia y actualización

1. **Intención dramática, actuación y coherencia narrativa.** La realización expresa el cambio emocional y el género mediante decisiones concretas.
2. **Continuidad de identidad, lugar, vestuario, utilería y geografía.**
3. **Legibilidad causal de la acción y actuación natural.**
4. **Eficiencia de inferencia y gasto en créditos.**
5. **Economía de medios y adornos opcionales.** La luz, cámara, foco y montaje que expresan la intención se deciden desde el principio; los adornos no desplazan la legibilidad.

Esta guía reemplaza instrucciones anteriores que exijan siempre un plano general, siempre cinco cortes, siempre un solo personaje visible, first frame obligatorio, video anterior obligatorio o referencias nuevas para cada set/vestuario. **Las soluciones son adaptativas** y deben basarse en el beat y las mediciones.

Actualización recomendada: incorporar cada tanda de 6–12 pruebas con configuración registrada, patrón de defectos y decisión concreta. Subir una regla de “hipótesis” a “estándar” cuando haya evidencia repetida y comparaciones razonables.

## 14. Fuentes técnicas de consulta

- [Documentación oficial ComfyUI: MiniMax H3](https://docs.comfy.org/tutorials/video/minimax/minimax-h3)
- [Documentación oficial ComfyUI: workflows T2V, I2V, R2V, guías y continuidad](https://docs.comfy.org/tutorials/video/minimax/minimax-h3-native)
- [Documentación técnica de Seedance 2.0 mediante Runway Dev](https://dev.runwayml.com/learn/seedance-2-0-api)

**Nota:** las recomendaciones empíricas por escena provienen de las pruebas descritas en esta conversación y deliberadamente se presentan por separado de las capacidades oficiales documentadas.
