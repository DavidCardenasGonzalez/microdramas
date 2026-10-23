# Estrategia de generación de video

La metodología integrada en `vendor/generation-strategy/` es la referencia técnica para elegir una estrategia por toma. Mantiene la selección separada de la escritura narrativa y de la ejecución: Screenwriting conserva autoridad sobre el guion aprobado; el selector solo propone una ruta técnica; los adaptadores del estudio preparan y ejecutan los trabajos.

## Selección

- **I2V** es la opción por defecto para cada toma. Las skills cinematográficas preparan la composición inicial y sus keyframes; la skill de generación ejecuta el workflow.
- El tamaño por defecto de I2V es **0.6 MP**. En tomas abiertas se puede probar **0.8 MP** para comprobar si los rostros se leen mejor; valida VRAM y calidad antes de subir más.
- **FLF2V** solo cuando el frame final sea un requisito de la acción y ambos extremos sean compatibles. Si el destino no es obligatorio, anima desde el inicio con I2V.
- **MSR** se reserva para tomas donde referencias independientes sean necesarias y una composición inicial I2V no resuelva la puesta. La identidad recurrente por sí sola no selecciona MSR.
- **T2V** se reserva para tomas cuyo movimiento o atmósfera no se beneficie de una composición inicial. Justifica la excepción en el plan.

Respeta el modelo solicitado. Si no hay workflow, referencias o capacidad verificada, conserva el bloqueo en el plan; no cambies de modo en silencio. Director, keyframes intermedios, Ingredients, pose/motion conditioning y proveedores externos requieren inspección y registro propios.

## Uso del selector

`vendor/generation-strategy/scripts/strategy.py` usa Python estándar. Acepta únicamente planes aprobados con `schema_version: 1`, un `project_id` y tomas con intención, encuadre, acción, cámara, iluminación y duración. Consulta `vendor/generation-strategy/references/contracts.md` para el esquema completo.

```powershell
$tool = Join-Path $PWD 'vendor/generation-strategy/scripts/strategy.py'
py $tool inspect --output '.tmp/capability-inspection.json'
py $tool select --input 'productions/<slug>/plan.json' --output 'productions/<slug>/strategy.json'
```

Antes de `inspect`, configura en `vendor/generation-strategy/assets/capabilities.json` las rutas reales de tus workflows. Los marcadores `<COMFYUI_ROOT>` son portables y no se expanden automáticamente. La inspección de un grafo solo identifica su estructura, nodos y modelos citados; no prueba disponibilidad en ejecución, VRAM libre ni calidad. Actualiza evidencia y hashes cuando cambie un workflow.

Revisa la salida y transfiere manualmente la estrategia aprobada al `Shot` correspondiente mediante el flujo de importación de planes. Después ejecuta `generate --dry-run` y `--prepare-only`. Las recetas del skill no reemplazan `src/adapters.ts` ni son una autorización para renderizar. Los registros históricos solo pueden influir en decisiones cuando los resultados tengan revisión y sean comparables por escenario, modo y hash de workflow.
