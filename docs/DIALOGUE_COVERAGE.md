# Dirección de diálogo

Aplicar la [guía oficial](AI_FILM_DIRECTION_PLAYBOOK.md): Fast Ref es la ruta principal para interpretación, emoción y conversación; Motion también puede resolver rack focus y movimiento cuando sea el riesgo dominante.

Preferir un rostro dominante por plano, manteniendo secundarios útiles desenfocados, de perfil, de espaldas o parcialmente ocluidos. Los planos compartidos son válidos. No exigir master inicial ni alternar en cada frase. Planear cortes por cambio de poder, información, intención o reacción.

Una unidad H3 puede contener varios planos temporizados y HARD CUTS. Como orientación empírica, ~20 s de diálogo suelen admitir 3–5 planos; un plano largo puede ser mejor. No imponer esa duración ni cantidad. Ajustar cada acción, línea y pausa a los límites efectivos registrados.

Reutilizar imágenes de identidad y el bloque literal de continuidad de secuencia: arquitectura, luz, ropa y mapa permanente. Las posiciones/miradas/objetos cambiantes se heredan desde dynamicState.end anterior hasta dynamicState.start siguiente; nunca quedan congelados en canonicalText. La identidad no es un frame congelado; no requiere que postura o expresión inicial coincidan con la hoja de personaje. SequencePlan define la cobertura completa antes de repartir generaciones; no volver a presentar el lugar por empezar otra unidad. Cada Shot conserva estados inicial/final estructurados y ledgers de beats completados/pronunciados. No exigir video anterior ni copia pixel a pixel del último frame; buscar continuidad perceptiva y un corte motivado.

Aplicar [CINEMATIC_DIRECTION.md](CINEMATIC_DIRECTION.md): cada línea tiene hablante, plano, ventana temporal natural, idioma, intención, presencia visual y lipsync explícitos. Justificar ventanas excepcionales con timingReason; las pausas tienen acciones fuera de la habla. No indicar conversación o palabras sin texto literal. Si el hablante es visible, generar su línea nativa; si debe permanecer invisible o se elige un plano de escucha, usar voz independiente y reemplazar la mezcla nativa con una mezcla completa revisada. No confiar en «off-screen» para asignar voz. En llamadas con ambos participantes importantes, preferir alternarlos visibles en sus respectivos espacios; conservar la geografía del interlocutor; un corte a su espacio exige que ese espacio esté aprobado. Un J/L cut se diseña en montaje sin duplicar las palabras.

En cámara, registrar los planos y tiempos en Reference Plan; en prompts, ejecutar solo lo aprobado, en inglés con diálogo literal una sola vez entre comillas. Títulos, nombres de planos y análisis quedan en metadatos. Solo texto citado se pronuncia. Desde apertura a cierre, sin música ni acentos sintéticos.

En montaje elegir rangos útiles por actuación y continuidad de voz/ambiente; no concatenar renders enteros por defecto. Para I2V heredado o explícito sigue siendo necesario un frame compuesto y un plano continuo por generación; no trasladar esa restricción a H3.

