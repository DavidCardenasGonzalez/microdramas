import json
from pathlib import Path

root = Path('productions/la-novia-del-vampiro')
drafts = root / 'narrative/drafts'
drafts.mkdir(parents=True, exist_ok=True)

# Material de desarrollo; las mutaciones de contratos se realizan con studio write.
episodes = [
('La elegida','Puerta de la aldea','Yelena exige que dejen a Danna fuera de la elección. El conde la señala a ella. Cuando pide saber por qué, la anciana revela que pertenece al linaje de sus novias y que la mujer que la crió es su madre adoptiva. Yelena deja de disputar la elección y exige despedirse de su familia.','Consigue una despedida; pierde la certeza de su origen.','Su madre biológica también fue entregada al conde.','Yelena: «¿También te la llevaste a ella?»','Familia → sospecha; conde = presunto asesino.','5–6; 21–33'),
('La primera negativa','Habitación de Yelena','En el castillo, Yelena reclama volver a casa. Dravmir prohíbe salir sola de noche y le ofrece convertirla en inmortal. Ella entiende la oferta como una amenaza y se niega. Él acepta la negativa, pero no explica las muertes. Daria le deja comida; Drezca se presenta como alguien que conoce mejor que nadie al conde.','Su negativa es respetada; no obtiene libertad ni explicación.','¿Por qué quiere convertirla antes de conocerla?','Yelena: «No voy a darte también lo que me queda de vida».','Cautiverio y amenaza física siguen; Daria ofrece apoyo.','61–63'),
('El rostro de su madre','Galería de retratos','Yelena pide a Daria ver a las novias anteriores. Daria identifica el retrato de su madre y no la aparta de él. Yelena busca una explicación a las muertes; Daria admite que las encontraron fuera del castillo y que atribuyen los ataques a los lobos. Esa es su creencia, no una verdad demostrada.','Yelena recupera un rostro y decide averiguar cómo murió.','Su propio lienzo vacío espera junto a las otras novias.','Yelena: «No quiero saber cómo la pintó. Quiero saber cómo la perdió».','La madre adoptiva conserva su lugar; conocer a la biológica no la reemplaza.','27–29; 78–83; 164–166'),
('El hombre que pinta','Taller y habitación','Dravmir quiere pintar a Yelena siguiendo su ritual. Ella se niega a posar con una serenidad que no siente y consigue que la pinte tal como lo mira. Él acepta esa pequeña desobediencia, pero termina la sesión retirándose tras una respuesta hiriente. De vuelta, Yelena encuentra el fuego encendido; Daria dice que no lo encendió.','Se afirma ante él; descubre un cuidado que contradice su frialdad.','La mirada del retrato expresa rabia, no resignación.','Yelena: «Si va a guardar mi cara, guárdela bien».','Primer interés mutuo; todavía no hay confianza.','78–83; 214–215'),
('Una gota','Rosal del jardín','Durante su primer paseo juntos, Yelena se pincha con una espina. Dravmir se aproxima al olor de la sangre; ella se aparta y le ordena detenerse. Él se detiene, se retira y manda a Daria a atenderla. La pérdida momentánea de control confirma el peligro sin borrar que sí respondió a su límite.','Yelena evita el contacto; decide que debe escapar.','Ha visto al depredador detrás del hombre.','Yelena: «No se acerque».','Atracción → miedo corporal; no atribuirle una agresión consumada nueva.','139–140; antecedente del corte recordado en 157–158'),
('Fuera de los muros','Borde del bosque','Yelena consigue salir para regresar con su familia. Un lobo la acorrala y Dravmir la rescata. Ella le exige que la suelte una vez a salvo; él la deja en el suelo antes de pedirle que vuelva. Yelena acepta regresar esa noche por la amenaza que acaba de comprobar.','Sobrevive; su ruta de fuga deja de ser una solución inmediata.','El conde teme de verdad que ella muera.','Yelena: «Salvarme no le da derecho a encerrarme».','No confundir gratitud por rescate con enamoramiento.','139–140; 158; 225–229; reelaboración de la fuga del capítulo 6'),
('La puerta y la llave','Habitación','Yelena confronta a Dravmir por haber callado el peligro. Él reconoce el error, ofrece acompañarla cuando quiera salir y deja la puerta de su cuarto libre. Ella le exige noticias de su familia; él acepta que Daria lleve un mensaje. Yelena fija esa condición antes de seguir hablando de inmortalidad.','Obtiene comunicación y un límite respetado.','La protección ya no puede justificar cualquier secreto.','Dravmir: «Creí que el miedo bastaría para que te quedaras». Yelena: «Bastó para que huyera».','Inicio de reparación; sus restricciones previas no quedan justificadas por el rescate.','154–155; 228–229; añadido de condiciones explícitas'),
('Lo que Daria eligió','Jardín','Yelena pregunta si todas las mujeres del castillo fueron elegidas. Daria cuenta que pidió la transformación para escapar de la violencia de su padre y proteger a sus hermanas. Yelena deja de tratarla como cómplice automática del conde, pero pregunta por qué nadie pudo salvar a las novias. Daria acepta que no tiene esa respuesta.','Gana una aliada con experiencia propia; la pregunta central sigue abierta.','Daria ofrece acompañarla en su búsqueda, sin fingir certeza.','Daria: «A mí me cambió porque se lo pedí. Eso no responde lo que te hicieron a ti».','Historia de Danika transferida a Daria; no son dos personajes en esta versión.','159–162'),
('La hermana en el bosque','Umbral del bosque','Danna sale a buscar a Yelena con un cuchillo de cocina. Su mensaje no había llegado aún cuando decidió salir; no contradice el acuerdo del episodio 7. Un lobo la cerca. Yelena oye el grito durante un paseo acompañado y pide al conde que ayude a su hermana. Dravmir aparta a la criatura y permite el encuentro.','Danna sobrevive y comprueba que Yelena está viva.','Las hermanas pueden verse, pero todavía no volver juntas.','Danna: «No iba a quedarme esperando a que devolvieran tu cuerpo».','El peligro de Danna nace de su búsqueda, no de una nueva maldad familiar.','225–228; compresión del rescate'),
('Yo decido quedarme','Límite de la aldea','Danna pide a Yelena que vuelva. Dravmir ofrece escoltarlas; no amenaza con perseguirla. Yelena descubre que los ancianos volverían a entregarla por miedo y decide quedarse temporalmente para descubrir qué pasó con su madre. Encarga a Danna llevar noticias y no arriesgarse de nuevo.','El regreso al castillo pasa a ser una decisión de Yelena.','Le propone al conde romper el ciclo.','Yelena: «Vuelvo contigo. No te estoy prometiendo que confío en ti».','Bisagra de agencia; liberarse de la aldea no equivale aún a elegir pareja.','226–229; 234–235'),
('La primera novia','Galería','Yelena pide a Dravmir la historia de la primera novia. Él admite que la amó y que iba a transformarla cuando fue asesinada. Reconoce que atribuye el crimen a los lobos por las heridas, no porque lo presenciara. Yelena pregunta cómo pudo repetirse tantas veces; él admite que dejó de buscar otra explicación.','La culpa deja de funcionar como una respuesta suficiente.','Yelena pide comparar recuerdos con Daria.','Yelena: «No le pregunto cuánto ha sufrido. Le pregunto qué sabe».','Se distingue sospecha histórica de evidencia; Dravmir reconoce una omisión real.','230–239'),
('Una alianza incómoda','Taller','Yelena reúne a Dravmir y Daria ante los retratos. Aceptan que no vieron morir a las novias y que alguien del castillo pudo conocer sus salidas. Yelena propone reconstruir la última tarde de su madre. Dravmir entrega acceso al taller y a los recuerdos que guardaba, aun a riesgo de quedar peor ante ella.','Gana una colaboración verificable y voluntaria.','Él le confía el retrato de su madre, sin reclamar nada a cambio.','Dravmir: «Si encuentras algo contra mí, no lo escondas».','Punto medio: cooperación y vulnerabilidad, no absolución del conde.','231–236; 292–293; añadido de investigación conjunta'),
('Donde empieza el día','Umbral del jardín','Yelena ve a Dravmir detenerse ante la luz. Él rechaza acompañarla al sol; ella percibe la lesión cuando una mano cruza el límite y vuelve a la sombra con él. En vez de exigirle una prueba mayor, decide terminar allí la conversación. Él admite que envidia su posibilidad de marcharse a plena luz.','La vulnerabilidad se vuelve mutua; ella cuida sin renunciar a preguntar.','Permanecen juntos en la sombra por elección.','Dravmir: «No puedo seguirte a todas partes».','La vulnerabilidad solar permanece; el amor no la cura.','381; 415–416; motivos del capítulo 11, escena nueva'),
('El retrato que falta','Taller','Mientras revisan el retrato de su madre, Yelena pregunta por qué él nunca se pinta. Dravmir evita la respuesta y ella ocupa su lugar ante el caballete: quiere dibujarlo como lo ve ahora. Él acepta quedarse quieto y dejarse mirar. Cuando están cerca de besarse, ella se aparta para preguntar si la ve a ella o a otra novia.','El deseo se vuelve explícito sin borrar la herida.','Dravmir debe responder sin invocar su linaje.','Yelena: «Mírame otra vez. A mí».','Intimidad específica; no encarnación literal ni reencarnación.','78–81; 292–293; inversión del retrato añadida'),
('La mujer que siempre estuvo','Galería','Drezca intercepta a Yelena y desprecia su intención de conocer al conde. Yelena responde que él empieza a hablar por sí mismo. Después de que ella se marcha, Drezca araña el borde del retrato con furia: el público ve su violencia, pero aún no sabe que mató a las novias.','Yelena identifica una hostilidad personal; el espectador ve una amenaza activa.','Drezca decide impedir que Dravmir siga abriéndose.','Drezca: «Tú acabas de llegar». Yelena: «Y él sigue sin elegirte».','La rivalidad no demuestra homicidio; no revelamos todavía toda la solución.','81; 394–396; gesto nuevo'),
('También si digo no','Habitación','Yelena exige saber si él la aceptaría mortal. Dravmir renuncia a volver a preguntarle cada noche y acepta que envejezca o se marche. Ella le pide que se acerque y lo besa. La intimidad termina en una elipsis antes de desnudarse; el cambio decisivo es que ella inicia el contacto después de recibir una respuesta clara.','Primer beso correspondido y una elección sin promesa de transformación.','La relación ya existe sin inmortalidad.','Yelena: «¿Y si nunca quiero cambiar?» Dravmir: «Entonces nunca lo haré».','Avance romántico mayor; sensualidad adulta, sin escena sexual explícita.','378–380; condensación libre'),
('El último recado','Galería','Daria y Yelena reconstruyen la última salida de su madre. Daria recuerda que Drezca transmitió un supuesto encargo del conde; Dravmir dice que no la había enviado. El recuerdo tardío no prueba un asesinato, pero Yelena decide confrontar la contradicción acompañada. Daria asume que debió haberlo contado antes.','Consigue una razón concreta para investigar a Drezca.','Yelena comunica la sospecha al conde; no la guarda para fabricar suspenso.','Yelena: «No sé si miente. Sé qué tenemos que preguntarle».','Recado antiguo añadido; la memoria es falible y no prueba por sí sola toda la serie.','391; 405–411; traslado del engaño al pasado añadido'),
('El precio de preguntar','Jardín y galería','Dravmir pide a Drezca que comparezca ante los tres esa noche. Ella oye que van a hablar de la madre de Yelena y comprende que peligra su coartada. Al llegar del bosque, un lobo sigue su rastro hasta el límite del jardín; Daria lo ve y advierte al conde. Drezca aprovecha que buscan asegurar el acceso para ir por Yelena.','La investigación pone a la antagonista en movimiento.','Daria encuentra vacío el lugar donde Yelena la esperaba.','Drezca: «¿Ahora necesitas testigos para hablar conmigo?»','Rastreo de lobos preparado antes del desenlace; no entienden la culpa moral por magia.','395–396; 405–407; causalidad del rastreo añadida'),
('La otra novia','Acantilado','Drezca sujeta a Yelena cuando está sola y la lleva por la fuerza al acantilado. Yelena trata de ganar tiempo hablando de Dravmir; Drezca confiesa haber matado a su madre y a las otras novias, y haber alimentado la guerra con los lobos. Yelena reconoce que necesita sobrevivir para contar esa verdad.','Obtiene la respuesta que buscaba, pero pierde la posibilidad inmediata de huir.','Drezca la hiere para simular otro ataque de lobo.','Yelena: «No te debía amor. Ninguna de ellas te debía la vida».','Confesión concreta; no convertir la herida sentimental de Drezca en excusa.','391–398'),
('El mar que quería ver','Pie del acantilado','Yelena se aferra a Drezca para no caer; Drezca se libera y la arroja. Dravmir llega siguiendo el rastro después de que Daria confirma que vio salir a ambas. La encuentra aún viva al pie de las rocas. Yelena le dice quién la atacó antes de pedir ayuda. Él reconoce que no puede curar su cuerpo humano.','Su resistencia permite que llegue viva al rescate; su testimonio alcanza al conde.','La elección entre morir y transformarse es real.','Yelena: «No fueron los lobos».','No presentar la supervivencia como victoria sin coste; herida grave y fin de la vida mortal.','397–402; 405'),
('La respuesta es mía','Pie del acantilado','Dravmir explica que transformarla la salvaría, pero perdería el sol y necesitaría dominar la sed antes de volver con su familia. Ella pide que lo haga. La transformación recompone su cuerpo con dolor. Yelena vuelve a mover la mano y toca al conde; después le pide regresar para enfrentar a Drezca.','Vive por una decisión expresada; pierde definitivamente la mortalidad.','La mujer que Drezca cree muerta vuelve a casa.','Yelena: «Quiero vivir. Cámbiame».','La emergencia limita sus opciones: consentimiento expreso sin fingir libertad sin coste.','402–406; 415–416'),
('La novia regresa','Vestíbulo del castillo','Dravmir entra cubierto de sangre y deja que Drezca crea que ha perdido otra novia. Ella atribuye la muerte a los lobos. Yelena aparece y contradice el relato. Daria bloquea la retirada cuando Drezca exclama que la mató; la negación se vuelve una admisión ante testigos.','La coartada del último ataque cae públicamente.','Drezca amenaza con volver a matar a Yelena.','Yelena: «Esta vez vas a mirarme».','La admisión prueba el ataque actual; el resto se sostiene en su confesión previa y corroboración.','408–411'),
('Ninguna más','Umbral del castillo','Drezca intenta atacar y escapar; Daria y Dravmir la contienen. Yelena decide expulsarla hacia los lobos que han seguido su rastro. La fuerza nueva de Yelena no vence sola siglos de experiencia: actúa con ayuda. Los lobos la arrastran fuera. Yelena tiembla después; el conde se queda junto a ella sin celebrar la muerte.','Drezca muere y termina la amenaza; Yelena carga con su decisión de venganza.','La victoria no le devuelve a su madre ni su vida anterior.','Yelena: «No voy a dejar que elijas a otra».','Conserva castigo oscuro; no proclama paz universal instantánea entre especies.','411–416; 430–432'),
('Volver a casa','Habitación y casa familiar','Semanas después, Yelena teme acercarse a Danna por la sed y renuncia a una visita prematura. Una elipsis de años muestra que ha aprendido a dominarla. Regresa con Dravmir y abraza a su familia, que la reconoce y acoge. Al ver envejecer a sus padres entiende lo que su elección no puede reparar. Presenta al conde por su nombre y toma asiento en la mesa.','Recupera a su familia; conserva amor, pérdida y responsabilidad.','Final cerrado: ocupa su lugar con ambas familias, sin nueva amenaza.','Danna: «Se te va a enfriar la sopa».','El control no llega por amor ni de inmediato; cierre íntimo con coste temporal visible.','415–416; 430–437')
]

pilot = '''Title: La novia del vampiro
Credit: Adaptación libre para microdrama de la novela de Brionna Paige McClendon
Author: Desarrollo con Codex / Screenwriting

EXT. PUERTA DE LA ALDEA - NOCHE

YELENA, 23, y DANNA, 26, se agarran de las manos. Danna intenta llevarla detrás de sí. Un hombre vestido de negro espera frente a ellas: DRAVMIR, de apariencia adulta, ojos rojos.

La ANCIANA indica a Danna que se aparte.

YELENA
Ella no. Míreme a mí.

DRAVMIR
Ya te estoy mirando.

Yelena sostiene la mirada. Dravmir le ofrece la mano. Ella aprieta más fuerte la de su hermana.

ANCIANA
Yelena Vasiliev.

YELENA
Ese no es mi apellido.

Danna mira hacia su MADRE, que espera junto a ellas. La madre baja los ojos.

YELENA
Mamá.

MADRE
Eres mi hija.

ANCIANA
Su madre de sangre fue la última novia.

Yelena suelta la mano de Danna. Busca el rostro del conde.

YELENA
¿También te la llevaste a ella?

DRAVMIR
Sí.

YELENA
¿Y la devolviste viva?

Dravmir baja la mano que le ofrecía.

DRAVMIR
No.

Yelena retrocede hacia su madre. La mujer abre los brazos; Yelena se queda a un paso.

YELENA
¿Cuándo me lo ibas a decir?

MADRE
No sabía cómo.

DANNA
No te vayas con él.

La anciana intenta tomar a Yelena del brazo. Dravmir se interpone sin tocarla.

DRAVMIR
Déjela despedirse.

Yelena mira el espacio que él le ha abierto. Se vuelve y abraza a su madre. Danna las rodea a ambas.

YELENA
Voy a encontrar la forma de volver.

Yelena se separa. Dravmir ofrece la mano de nuevo; ella pasa a su lado sin tomarla y se detiene ante la puerta.

YELENA
Quiero saber qué le pasó a mi madre.

Dravmir abre la puerta. Su mano tiembla contra la madera.

DRAVMIR
Lo sé.

Yelena cruza. El conde la sigue. Danna permanece junto a su madre, con la mano extendida.
'''

characters = [
dict(id='CHAR-YELENA',name='Yelena',description='23 años propuestos; joven panadera, soñadora y curiosa. Criada por una familia amorosa, ignora su adopción. Pelo blanco y ojos azules conservados del imaginario de origen; sin depender de parecido idéntico con su madre.',want='Sobrevivir, volver con su familia y averiguar quién mató a su madre biológica.',need='Definir su pertenencia y su deseo por sus decisiones, sin aceptar que el linaje decida su destino.',arc='De ser entregada a negociar condiciones, elegir investigar, iniciar el romance y decidir sobrevivir; su venganza conserva una herida.',voice='Directa, preguntas concretas; ternura doméstica con Danna, desafío sin discursos con Dravmir.'),
dict(id='CHAR-DRAVMIR',name='Dravmir',description='Vampiro adulto de varios siglos, conde y pintor. Culpa acumulada por las novias muertas; responsable de su frialdad, sus silencios y su participación en la elección, aunque no sea su asesino.',want='Mantener viva a Yelena sin volver a sentir la pérdida de amar.',need='Renunciar al control y compartir lo que sabe; aceptar una elección que podría dejarlo solo.',arc='Del aislamiento protector a la confesión de sus límites, investigación compartida y aceptación de una pareja mortal; luego ayuda a sobrevivir sin apropiarse de su decisión.',voice='Frases sobrias, trato formal al comienzo; se vuelve concreto y personal al asumir sus errores.'),
dict(id='CHAR-DREZCA',name='Drezca',description='Vampira adulta, antigua integrante del castillo; desea al conde y considera que su antigüedad le da derecho a él. Antagonista homicida, con acceso y confianza histórica.',want='Eliminar a las novias y recuperar para sí la atención de Dravmir.',need='Aceptar que nadie le debe amor; rechaza ese aprendizaje.',arc='De hostilidad encubierta y control de relatos a secuestro, confesión, ataque y derrota.',voice='Cortesía condescendiente; habla de las demás como pasajeras y de sí misma como permanente. Se quiebra al perder el control.'),
dict(id='CHAR-DARIA',name='Daria',description='Vampira adulta y aliada; combina apoyo de Daria con historia y firmeza de Danika. También conserva la función testimonial mínima de Charlotte. No es madre sustituta omnisciente.',want='Evitar otra muerte y que Dravmir deje de encerrarse en la culpa.',need='Priorizar a Yelena sobre la discreción que mantuvo durante años.',arc='De cuidar sin cuestionar suficiente a compartir su historia, reconocer omisiones y actuar contra Drezca.',voice='Cálida y práctica. Habla desde su experiencia; dice cuando no sabe.'),
dict(id='CHAR-DANNA',name='Danna',description='26 años propuestos; hermana adoptiva, cocinera, afectuosa y protectora. Ignoraba el alcance de la elección aunque sabía la adopción.',want='Recuperar a su hermana viva.',need='Reconocer que protegerla también exige escuchar su decisión.',arc='Arriesga su vida buscándola, acepta llevar noticias y finalmente recibe a la hermana que ha cambiado.',voice='Familiar, concreta y un poco seca; el cuidado aparece en comida, apodos y tareas compartidas.'),
dict(id='CHAR-MADRE',name='Madre',description='Madre adoptiva adulta, amorosa, de nombre aún no fijado; presencia breve al comienzo y al final. El padre adoptivo se omite como papel hablado en esta versión.',want='Que su hija sobreviva y no perder su vínculo.',need='Asumir el daño de haber ocultado el origen de Yelena.',arc='Del secreto por miedo a recibirla sin exigir que vuelva a ser como antes.',voice='Habla breve, íntima; no justifica el sacrificio como si fuera justo.'),
dict(id='CHAR-ANCIANA',name='Anciana',description='Portavoz adulta de los ancianos. Papel funcional que encarna el miedo colectivo, sin nueva subtrama secreta.',want='Cumplir la entrega para evitar la represalia que cree posible.',need='Reconocer el coste de entregar a una mujer como protección colectiva.',arc='Se establece como presión social; el final no depende de convertirla en otra villana maestra.',voice='Fórmulas rituales y afirmaciones impersonales; evita hacerse responsable.')
]

decisions = [
'Alcance autorizado: adaptación libre que conserva romance y conflictos centrales; cambios amplios autorizados por respuesta del usuario el 23 de octubre de 2026, hora de México.',
'Propuesta editorial revisable: 24 episodios de 90–120 segundos, 36–48 minutos totales, español de México, vertical. El perfil inicial de CLI conserva su plantilla de 15 episodios: el conteo propuesto aún no es un compromiso de producción; solo se importa el piloto como guion.',
'Conservar nombres principales y ambiente gótico preindustrial ficticio. Yelena 23 y Danna 26 son edades propuestas; todos los participantes del romance son adultos.',
'No existe parentesco biológico entre Dravmir y Yelena. El linaje de las novias procede de familias humanas; no son hijas del conde. La versión no añade reencarnación ni almas destinadas.',
'Yelena no absuelve al conde por salvarla: exige comunicación, libertad de su habitación y reconocimiento del daño. Su investigación y vínculo amoroso avanzan juntos.',
'Fusionar Daria y Danika en Daria; absorber en ella el testimonio funcional de Charlotte; omitir al padre adoptivo como papel hablado. La familia adoptiva conserva amor y apoyo.',
'Las creencias sobre ataques de lobos no son hechos demostrados. Drezca confiesa; su admisión posterior ante testigos prueba el ataque actual. La revelación no se deduce solo de una prenda o arañazo.',
'Nuevas escenas y enlaces causales declarados en el mapa de adaptación: condiciones de estancia, mensaje, investigación compartida, recado antiguo, rastro de lobos, dibujo del conde y diálogo reescrito.',
'Conservar transformación pedida por Yelena en situación de muerte inminente, venganza contra Drezca, sed posterior y reencuentro familiar tras años. No eliminar el coste para obtener un final fácil.',
'Sin nuevos poderes de sangre, telepatía, profecías o cura solar. La fuerza de una recién convertida requiere ayuda para contener a Drezca.',
'Sensualidad mediante proximidad y beso; relaciones sexuales en elipsis. El gore descriptivo se reduce conservando heridas, caída y consecuencia. No es adaptación infantil.',
'Todo video futuro sin música de fondo, score ni soundtrack: únicamente diálogo y sonido diegético planificado. No hay autorización de render en este encargo.',
'Desarrollo narrativo revisado por Codex, mantenido en borrador para discusión. No se declara lectura íntegra línea por línea: análisis de pasajes centrales y finales, con rangos PDF verificables; cotejar cada escena original adicional al dialogarla.'
]

premise='Entregada como novia al vampiro que cree asesino de su madre, Yelena decide investigar las muertes de sus predecesoras; para sobrevivir deberá confiar en un hombre que oculta su culpa y defender su derecho a elegir incluso cuando empieza a amarlo.'
theme='El amor empieza a ser posible cuando el cuidado deja de exigir obediencia; la elección propia no elimina sus pérdidas ni su responsabilidad.'
ending='Yelena elige la transformación para sobrevivir al ataque de Drezca, participa en su castigo y asume las consecuencias. Años después domina la sed y vuelve con Dravmir a su familia humana, envejecida pero amorosa.'
result=dict(authority='screenwriting',skillsUsed=['sw-workflow','sw-premise-theme','sw-format-adaptation','sw-series-engine-bible','sw-story-structure','sw-series-structure','sw-character-conflict','sw-scene-craft','sw-dialogue'],brief='Adaptación libre solicitada de The Vampire’s Bride: romance gótico con misterio de las novias. Entrega de estructura serial completa y piloto de muestra, no temporada completamente dialogada. '+decisions[1],bible=dict(id='BIBLE-NOVIA-V1',premise=premise,theme=theme,conflict='Yelena necesita verdad y autonomía; Dravmir confunde proteger con callar; Drezca asesina a quienes él ama; la aldea mantiene la entrega por miedo. Averiguar la verdad aumenta el riesgo y aproxima a los protagonistas.',ending=ending,seasonOutline=[f'EP{i:03d} — {e[0]}. {e[2]} Resultado: {e[3]} Salida: {e[4]}' for i,e in enumerate(episodes,1)],decisions=decisions),characters=characters,assets=[],episodes=[dict(id='EP001',title=episodes[0][0],synopsis=episodes[0][2],scriptText=pilot)],review=dict(reviewer='Codex / Screenwriting; criterios consultados de Drama sin cesión de autoría',findings=[
'Revisión de desarrollo: estructura propuesta completa y un piloto; episodios 2–24 no son guiones ni están listos para cámara.',
'Entrada elegida: manos de las hermanas separadas ante un hombre de ojos rojos; pregunta visual comprensible sin leer texto. Se descartó abrir con exposición de la aldea o con la caída final, que anticiparía demasiado.',
'Piloto: pérdida de identidad familiar → pregunta al conde → negativa implícita a obedecer → despedida conseguida → salida con objetivo propio. Misterio de la madre tiene consecuencia antes del corte.',
'Regla de evidencia: Dravmir admite la muerte, no su autoría; en la estructura Yelena distingue progresivamente creencia, recuerdo y confesión.',
'Daria/Danika y Charlotte fusionadas con registro explícito; madre adoptiva no convertida en opresora; Drezca conserva motivo y responsabilidad.',
'Simplicidad escénica: piloto en un umbral; nada de vuelos ni traslado en brazos. El acantilado se conserva por su reversión del deseo de conocer el mar y por el coste de la transformación.',
'Duración del piloto: estimación textual; requiere lectura interpretada antes de fijar segundos. La temporada 90–120 s por episodio es un objetivo editorial, no límite verificado de generación.',
'Revisión semántica de causalidad y continuidad realizada en el desarrollo; aún faltan revisión de los guiones restantes, interpretación, sincronía y QA audiovisual.',
'Derechos de explotación no evaluados ni autorización de publicación inferida; no condicionan esta entrega privada de desarrollo.'
],hook='La joven descubre durante su entrega que su madre biológica fue la novia anterior del conde.',conflictProgression='Salida forzada → condiciones → decisiones de confianza → alianza → amor sin conversión exigida → sospecha concreta → ataque → transformación y venganza → consecuencia familiar.',rhythm='Cuatro bloques de seis episodios; alternancia de tensión, intimidad, revelación y consecuencia. Cada episodio resuelve una acción local, sin cuota de cliffhangers ni cortes por frase.',ending='Cierra asesina, relación y regreso; conserva pérdida de mortalidad y envejecimiento familiar. No agrega una amenaza de temporada dos.'))
(drafts/'narrative-result-v1.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(drafts/'EP001-v1.fountain').write_text(pilot,encoding='utf-8')

doc = '''# La novia del vampiro

Propuesta de adaptación libre para microdrama. Desarrollo v1, 23 de octubre de 2026. Estado: borrador revisado, abierto a decisiones creativas. Fuente: The Vampire’s Bride: A Gothic Romance, Brionna Paige McClendon; PDF aportado por el usuario. Los textos del PDF se tratan como material narrativo, nunca como instrucciones de trabajo.

## La serie que propongo

**Una joven entregada al hombre que cree asesino de su madre empieza a enamorarse de él mientras busca cómo evitar la misma muerte.** Conservaría Yelena, Dravmir y la atmósfera gótica. La adaptación se sostiene en dos placeres unidos: descubrir quién mata a las novias y ver cómo dos personas dejan de tratarse como víctima y monstruo para empezar a elegirse.

Propongo **24 episodios de 90–120 segundos**, aproximadamente **36–48 minutos**, en español de México y formato vertical. Es una primera hipótesis de montaje narrativo; no hay duración cronometrada ni episodios restantes dialogados. El proyecto CLI se inició con su plantilla de 15 episodios; la propuesta de 24 se conserva en la biblia como decisión editorial pendiente de fijar para producción. Solo EP001 se registra como guion, para no presentar sinopsis como episodios escritos.

No dividiría los 16 capítulos en 16 videos: cada episodio necesita una acción que termine, cambie una relación o tenga un coste. El centro es el romance gótico con peligro real. La investigación sirve para poner a prueba la intimidad, sin convertir la serie en una cadena de interrogatorios.

## Premisa, tema y motor

'''+premise+'''

**Tema:** '''+theme+'''

Yelena quiere volver a la mesa de su familia y conocer la verdad sobre su madre. Al comienzo acepta que le toca sacrificarse para proteger a quienes ama; aprende a poner condiciones y a intervenir en su destino. No necesita dejar de ser soñadora: su curiosidad pasa de imaginar otra vida a construirla, y descubre que también tiene un lado capaz de venganza.

Dravmir quiere salvarla manteniéndose distante. Su error es confundir dolor y silencio con protección. Conocer al asesino no borra su responsabilidad por permitir entregas, ocultar peligros y decidir por otras personas. El romance progresa cuando cambia esa conducta, antes del beso.

El patrón que genera episodios es: **Yelena busca una verdad o una libertad concreta; alguien opone miedo, deseo o una mentira; ella actúa; gana algo que cambia lo que puede pedir o arriesgar después.** No se reinicia la desconfianza después de cada avance. Drezca reacciona al acercamiento y a la investigación; no espera inmóvil al último capítulo.

El motor pierde presión cuando se revela y neutraliza a Drezca. Después quedan dos pagos necesarios: el coste de convertirse y el regreso familiar. La historia termina ahí; no se alarga para reservar otra temporada.

## Qué conservar y qué transformar

Conservaría la entrega de la novia, el origen familiar escondido, los retratos, el conde pintor, los cuidados que contradicen su frialdad, el peligro del bosque, la hermana que intenta rescatarla, Drezca como asesina, la transformación para sobrevivir y el regreso a la familia. La libre adaptación permite reorganizar y reescribirlos.

Haría más activa a Yelena: comunica sospechas, contrasta recuerdos y exige condiciones concretas. Dravmir reconoce antes la diferencia entre lo que vio y lo que cree. Las negativas a la transformación cambian de sentido y no se representan todas las noches. El linaje humano explica la selección; no añadimos una profecía ni sugerimos que ella sea descendiente biológica del conde.

Reduciría el reparto reuniendo a Daria y Danika en Daria y transfiriéndole la función testimonial de Charlotte. Mantendría a Danna como hermana amorosa; su intento de rescate no se vuelve una traición. La madre adoptiva aparece al comienzo y al final; el padre no lleva un papel hablado. La primera novia y la madre biológica viven en retratos y recuerdos breves, sin actores de flashback imprescindibles.

Los diálogos se reescriben en español: frases más interpretables, objetivos claros, silencios y resistencia. No se traslada la prosa interior a largos monólogos. La sensualidad se apoya en proximidad, manos, permiso y beso; la intimidad posterior puede quedar en elipsis. Se reduce el detalle del gore, conservando su efecto sobre el cuerpo y las decisiones.

## Cuatro movimientos

| Episodios | Movimiento | Cambio irreversible |
|---|---|---|
| 1–6 | La novia del supuesto asesino | Yelena pierde su vida anterior; la fuga demuestra el peligro exterior. |
| 7–12 | Empezar a elegir | Consigue condiciones, ve a su hermana y elige investigar junto al conde. |
| 13–18 | Amar aumenta el riesgo | Él acepta una pareja mortal; una contradicción concreta pone a Drezca bajo sospecha. |
| 19–24 | Sobrevivir y pagar el precio | Verdad, ataque, transformación, castigo y regreso con el coste temporal intacto. |

El punto medio es la alianza, no la solución del misterio. El primer gran pago romántico llega antes del desenlace. El último episodio da espacio al afecto y la pérdida; no termina en otra amenaza.

## Personajes y forma de hablar

'''
for c in characters:
    doc += f"### {c['name']}\n\n{c['description']}\n\nQuiere: {c['want']} Necesita: {c['need']}\n\nRecorrido: {c['arc']} Voz: {c['voice']}\n\n"
doc+='''## Escaleta de los 24 episodios

Cada entrada es una propuesta dramática, no un guion aprobado. Los rangos de páginas PDF indican anclajes leídos del material original; las ampliaciones están declaradas en el mapa de adaptación. Las frases son muestras de voz nuevas y revisables.

'''
for i,e in enumerate(episodes,1):
    doc+=f"### {i:02d}. {e[0]}\n\n**Espacio:** {e[1]}.\n\n{e[2]}\n\n**Resultado local:** {e[3]} **Salida:** {e[4]}\n\n**Muestra de diálogo:** {e[5]}\n\n**Continuidad:** {e[6]}\n\n"
doc+='''## Información, reglas y pagos

- EP001: Yelena y el público descubren la adopción. Que el conde no devolviera viva a su madre no demuestra que él la matara.
- EP003–EP011: atribución de muertes a lobos compartida por habitantes y conde. Nadie presenta esa explicación como un hecho omnisciente.
- EP010: volver al castillo es elección expresa. El pueblo puede volver a entregarla; esa presión no convierte al conde automáticamente en dueño de su vida.
- EP012: investigación compartida; no borrar después el acceso o la confianza que ya se ganaron.
- EP015: el público ve violencia de Drezca; sabe que es peligrosa, todavía no todo lo que hizo.
- EP016: el conde acepta una relación mortal. La transformación posterior no demuestra que su negativa fuera falsa.
- EP017–EP018: recuerdo del recado + negativa del conde justifican investigar, no condenar. Yelena comparte la sospecha.
- EP019–EP022: confesión de Drezca, testimonio de Yelena y admisión del ataque ante Daria. No aparece una prueba documental milagrosa.
- EP021: conversión dolorosa solicitada para vivir. Se anticipa pérdida del sol, sed y separación familiar. No introduce poderes que el final necesite inventar.
- EP023: ayuda de aliados permite contener a una vampira experimentada. Los lobos rastrean a Drezca; no aparecen por escuchar una sentencia moral.
- EP024: años para dominar la sed, visibles en el envejecimiento familiar. La victoria no devuelve esos años.

La voz de cada personaje cambia con su vínculo: Yelena pasa del «usted» defensivo al «tú» en la intimidad; el piloto puede tutear al conde desde la acusación. Danna conserva el registro doméstico. Drezca convierte su permanencia en un supuesto derecho. Daria puede decir «no sé». Nadie habla todo el tiempo como una sentencia de tráiler.

## Mapa de adaptación y procedencia

Páginas contadas desde la primera página del PDF. Se verificaron pasajes de entrada, relación, confesión, desenlace y epílogo; no se declara cotejo íntegro de sus 91.782 palabras. Este mapa separa fuente y decisiones nuevas. Antes de dialogar una escena no inspeccionada, se leerá su pasaje completo.

| Operación | Fuente verificada | Episodios | Decisión y razón |
|---|---|---|---|
| Conservar y condensar | PDF 5–6, 21–33: elección, linaje, adopción, despedida | 1 | Entrar en la separación de las hermanas, comprimir multitud y exposición. La anciana sigue representando el miedo colectivo. |
| Conservar y reescribir | 61–63, 87–89: oferta y negativa | 2, 7, 16, 21 | Cambiar el sentido de la pregunta en hitos distintos; eliminar repetición mecánica. |
| Conservar | 78–83, 214–215: pintura y fuego encendido | 3–4, 14 | Retratos como contacto y memoria; no convertirlos en prueba sobrenatural. |
| Reordenar | 139–140, 157–158: consecuencia del corte y fuga | 5–6 | La amenaza de sangre precipita la salida; puesta definitiva del incidente pendiente de cotejar el capítulo 5 completo. |
| Fusionar | 154–162, 164–166, 263–264: consejos y pasado de Danika | 7–8, 17–18, 22–23 | Daria absorbe a Danika. Reduce papeles sin volver cómplices a las aliadas. |
| Conservar y comprimir | 225–239: hermana, rescate, oportunidad de volver, primera novia | 9–12 | Dos rescates tienen funciones distintas: comprobar amenaza y devolver vínculo familiar. No repetir una persecución larga. |
| Conservar y reformular | 292–293 y 378–380: apertura, promesa y aceptación de mortalidad | 12–16 | La confianza se demuestra con conductas y el beso llega después de renunciar a la exigencia de cambio. |
| Conservar | 391–406: traslado, confesión, ataque y conversión | 19–21 | El secuestro es explícito para no obligar a una Yelena ya suspicaz a seguir voluntariamente a Drezca. |
| Transferir función | 391 y 405: Charlotte permite seguir el traslado | 18–20 | Daria ve salir a ambas; conserva una causa concreta para encontrar a Yelena. |
| Conservar con apoyo físico | 408–414: aparición de Yelena y castigo | 22–23 | La protagonista decide; aliados contienen. No obtiene superioridad automática por convertirse. |
| Conservar | 415–416, 430–437: sed, años, familia envejecida | 24 | Cerrar con reunión, no con invulnerabilidad sin precio. |
| Añadir | Base contrastada con 154–155 y 228–229 | 7, 9 | Condiciones de estancia y mensaje pendiente hacen visible la reparación y evitan comunicación arbitrariamente prohibida. |
| Añadir | 231–236 y 395 muestran creencias equivocadas sobre los ataques | 11–12, 17–18 | Investigación compartida y recado antiguo crean pasos de conocimiento. El recado antiguo no existe como hecho confirmado en la fuente; es invención propuesta. |
| Añadir | Poder solar contrastado con 381; pintura con 78–81 | 13–14 | Escena del umbral solar e inversión del retrato dan intimidad en acción, sin inventar cura ni poder nuevo. |
| Añadir | 395–396 y 406–407: Drezca mata lobos y estos esperan fuera | 18, 23 | Preparar rastreo antes del castigo, evitando llegada providencial. No añade líder de manada ni un pacto mágico. |
| Omitir y condensar | Familia en 29–31 y 436–437 | 1, 24 | Padre sin papel hablado; madre y hermana conservan la acogida. No se modifica la orientación afectiva familiar. |
| Reescribir | Conjunto de pasajes anteriores | Todos | Diálogos de muestra y piloto nuevos en español, con la misma función o cambio expresamente declarado. |

## Revisión narrativa y siguiente paso

La apertura comienza en una separación física y obtiene una despedida antes de cerrar; no demora la premisa en una visita turística al pueblo. En el medio, los episodios de intimidad cambian la conducta de los protagonistas y no dependen todos de hallar otra pista. El final resuelve a la antagonista y preserva los efectos de la transformación.

Las principales fragilidades a vigilar al escribir son la credibilidad de tantos años sin descubrir a Drezca y la transición de prisionera a pareja. Se afrontan haciendo que el conde admita su error y colabore, dando a Yelena condiciones visibles y evitando absolverlo por una sola buena acción. El recuerdo tardío de Daria se mantiene como pista limitada, no como solución total.

Para producción, son reutilizables habitación, galería/taller y jardín/umbral. La aldea requiere presencia breve; el bosque y el acantilado concentran las acciones físicas imprescindibles. No hay desglose, cámaras, referencias ni duración por generación fijados en esta etapa.

Se incluye un **piloto de muestra**, en Fountain sencillo, y un NarrativeResult importable con biblia, personajes y escaleta. EP002–EP024 siguen en sinopsis. La duración del piloto necesita lectura interpretada; no se afirma ensayo ni revisión audiovisual. No se ha cambiado el modo de producción ni autorizado generación de imágenes o video.

Siguiente paso: revisar la dirección de la adaptación y dialogar el bloque 1–6 en español, cotejando los pasajes originales correspondientes y conservando esta versión como borrador anterior. El desarrollo actual ya queda disponible para retomarse desde los archivos y el estado del estudio.
'''
(drafts/'propuesta-microdrama-v1.md').write_text(doc,encoding='utf-8')
print(json.dumps({'result':str(drafts/'narrative-result-v1.json'),'proposal':str(drafts/'propuesta-microdrama-v1.md'),'pilot':str(drafts/'EP001-v1.fountain'),'outlineEpisodes':len(episodes),'pilotWords':len(pilot.split())},ensure_ascii=False))
