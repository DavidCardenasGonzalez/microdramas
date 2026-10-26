# Producción sencilla

Puedes pedir: «Todo este microdrama en modo sencillo; continúa con el siguiente video». Codex guarda la preferencia en el proyecto y trabaja escena por escena con las skills correspondientes. No hace falta enumerar comandos ni repetir la preferencia por toma.

```powershell
node bin/studio.mjs -p productions/<proyecto> config --production-mode simple
node bin/studio.mjs -p productions/<proyecto> task --stage production --scene EP001-SC001
```

`production` elige el paquete de desglose si faltan tomas, dirección si el plan aún no está aprobado y justificado, o prompts si ya lo está. Es un handoff para Codex, no un generador autónomo ni una aprobación automática. El agente aplica las skills, completa los contratos necesarios y continúa hasta enviar lo autorizado o encontrar un impedimento concreto. El modo aparece tanto en los paquetes narrativos como en los de producción y en `status`.

| Parte | Modo sencillo |
| --- | --- |
| Skills | Se aplican al trabajo pendiente y se reutilizan sus decisiones aprobadas. No releer todas las guías por toma. |
| Preparación | Una pasada de trabajo por escena; prioridad al siguiente plano listo. No preparar toda la temporada antes del primer envío. |
| Dirección | Misma identidad cinematográfica, actuación expresiva y libertad de cámara que standard. Dirigir la secuencia completa una vez antes de repartir generaciones; reutilizar decisiones, nunca reiniciar el escenario o empobrecer encuadres por simplificar el trámite. |
| Referencias | Fast Ref/Motion reutilizan identidad y continuidad textual; crear solo faltantes justificados. Hoja y frames no son obligatorios. |
| Reintento técnico | Mismo Shot aprobado y sus referencias; alternativa de job cuando cambie el prompt. No reimportar el mismo plan. |
| Verificación | Reutilizar evidencia y paquetes preparados sin cambios. Validar paquetes nuevos y revisar backend si cambió o falló. |
| Registro | Contratos, jobs, hashes e IDs existentes. Sin informes adicionales ni mantenimiento del repo durante una generación normal. |
| Envío y continuidad | Guardar prompt_id y seguir completionMode: complete continúa recuperación/QA/montaje; submit devuelve el control tras enviar. |

Se conservan las referencias reales exigidas por cada modo, los límites del adaptador, las autorizaciones de recursos y la aprobación humana de gastos pagados. No se cambia un workflow maestro, no se repite un envío incierto y no se aprueba una escucha o revisión visual que no se hizo. Los videos siguen sin música.

El modo simplifica el trabajo de producción sin cambiar el canon ni el estándar cinematográfico de [la corrección integral](CINEMATIC_PIPELINE_CORRECTION.md). Si se pide además «simplifica la historia», Screenwriting crea una revisión nueva con menos complejidad cuando conserve su efecto; usa sus skills por etapas de razonamiento y puede entregar un único NarrativeResult. La revisión sigue el proceso de importación/aprobación existente.

El modo es una política de trabajo de Codex, no un bypass de validadores ni un nuevo runner. No envía trabajos al activarlo y no convierte todos los proyectos existentes. `standard` es el valor por defecto para compatibilidad. Se puede volver con `config --production-mode standard`; el cambio no invalida medios ni contratos.

Simple y standard comparten la [dirección oficial](AI_FILM_DIRECTION_PLAYBOOK.md), sin hoja obligatoria ni replanificación de reintentos técnicos intactos. Simple reduce ceremonia; no cambia modelos, referencias, canon ni autorizaciones.
