# Mejoras de Extracción DOCX - Competencias, RAs y Fundamentos

## Resumen de Cambios

Se ha mejorado significativamente la capacidad del sistema de extraer y parsear información estructurada del DOCX de Propuestas. Ahora el sistema:

### ✅ Extrae Competencias Genéricas (CGTx)
- Formato en DOCX: `- CGT1 - Descripción - Nivel`
- Retorna: Lista de objetos con campos `code`, `description`, `level`
- Ejemplo: `[{'code': 'CGT1', 'description': 'Identificar...', 'level': 'Alto'}, ...]`
- **Función:** `extract_generic_competencies(text: str) -> List[Dict[str, str]]`

### ✅ Extrae Competencias Específicas (CEx)  
- Formato en DOCX: `- CE1 - Descripción - Nivel`
- Retorna: Lista de objetos con campos `code`, `description`, `level`
- Ejemplo: `[{'code': 'CE1', 'description': 'Analizar...', 'level': 'Alto'}, ...]`
- **Función:** `extract_specific_competencies(text: str) -> List[Dict[str, str]]`

### ✅ Extrae Resultados de Aprendizaje (RAx)
- Formato en DOCX: `- RA1 - Descripción completa del resultado`
- Retorna: Lista de objetos con campos `code`, `description`
- Ahora con descripción completa en lugar de solo la primera línea
- Ejemplo: `[{'code': 'RA1', 'description': 'Establece la forma y realiza...'}, ...]`
- **Función:** `extract_learning_outcomes_parsed(text: str) -> List[Dict[str, str]]`

### ✅ Extrae Secciones de Fundamentos Separadamente
- **"Importancia en el Plan de estudio":**
  - Separado correctamente del texto general
  - Usa regex case-insensitive: `r'importancia\s+en\s+el\s+plan\s+de\s+estudio\s*:?'`
  - Termina antes de "Relación con el perfil"

- **"Relación con el perfil profesional esperado":**
  - Separado correctamente en su propio campo
  - Usa regex case-insensitive: `r'relación\s+con\s+el\s+perfil\s+profesional\s+esperado\s*:?'`
  - Continúa hasta el final de la sección

## Cambios en la API de Retorno

### Antes:
```json
"generic_competencies": "CGT1 - Identificar... CGT2 - Concebir...",  // String concatenado
"specific_competencies": "CE1 - Analizar... CE2 - Diseñar...",        // String concatenado
"learning_outcomes": ["Establece la forma...", "Formula la..."],      // Strings simples
"importance": "importancia en el Plan de estudio: ...",               // Vago
"professional_profile": "relación con el perfil: ..."                // Vago
```

### Ahora:
```json
"generic_competencies": [
  {"code": "CGT1", "description": "Identificar, formular y resolver problemas...", "level": "Alto"},
  {"code": "CGT2", "description": "Concebir, diseñar y desarrollar proyectos...", "level": "Alto"}
],
"specific_competencies": [
  {"code": "CE1", "description": "Analizar la funcionalidad...", "level": "Alto"},
  {"code": "CE2", "description": "Diseñar, calcular e implementar...", "level": "Alto"}
],
"learning_outcomes": [
  {"code": "RA1", "description": "Establece la forma y realiza la evaluación previa del proyecto..."},
  {"code": "RA2", "description": "Formula la planificación del proyecto mediante evaluación..."}
],
"importance": "Proyecto de Ingeniería Mecatrónica es la asignatura integradora...",  // Texto limpio
"professional_profile": "Esta asignatura contribuye a que el futuro ingeniero/a pueda formular..."  // Texto limpio
```

## Función de Extracción Mejorada

En `import_proposal_from_docx()`, la sección de OBJETIVOS ahora:

1. **Busca "Competencias genéricas"** y llama a `extract_generic_competencies()`
2. **Busca "Competencias específicas"** y llama a `extract_specific_competencies()`
3. **Busca "Resultados de aprendizaje"** y llama a `extract_learning_outcomes_parsed()`
4. **Fallback:** Si no encuentra RAs en párrafos, busca en TABLAS usando `extract_learning_outcomes_from_tables()`

En `import_proposal_from_docx()`, la sección de FUNDAMENTOS ahora:

1. **Usa regex mejorado** para separar "Importancia en el Plan de estudio"
2. **Usa regex mejorado** para separar "Relación con el perfil profesional esperado"
3. **Case-insensitive:** Funciona con "IMPORTANCIA", "importancia" o variaciones con espacios

## Validación Realizada

Archivo: `test_improved_extraction.py`

✅ Test 1: Extrae 5 Competencias Genéricas (CGT1-CGT5)
✅ Test 2: Extrae 6 Competencias Específicas (CE1-CE6)  
✅ Test 3: Extrae 5 Resultados de Aprendizaje (RA1-RA5)
✅ Test 4: Extrae "Importancia en el Plan de estudio" correctamente
✅ Test 5: Extrae "Relación con perfil profesional esperado" correctamente

## Uso Frontal (App.jsx)

Ahora puedes acceder a estos datos así:

```javascript
// Competencias Genéricas
const genericComps = importedData.generic_competencies;
genericComps.forEach(comp => {
  console.log(`${comp.code}: ${comp.description} (${comp.level})`);
});

// Competencias Específicas  
const specificComps = importedData.specific_competencies;
specificComps.forEach(comp => {
  console.log(`${comp.code}: ${comp.description} (${comp.level})`);
});

// Resultados de Aprendizaje
const ras = importedData.learning_outcomes;
ras.forEach(ra => {
  console.log(`${ra.code}: ${ra.description}`);
});

// Fundamentos (ahora separados)
const importance = importedData.importance;    // Texto limpio
const profile = importedData.professional_profile;  // Texto limpio
```

## Patrones Regex Usados

### Competencias Genéricas:
```regex
r'[-•]\s*([Cc][Gg][Tt]\d+)\s*[-:]\s*([^-]+?)(?:\s*[-:]\s*([^-\n]+))?(?=\n|$)'
```

### Competencias Específicas:
```regex
r'[-•]\s*([Cc][Ee]\d+)\s*[-:]\s*([^-]+?)(?:\s*[-:]\s*([^-\n]+))?(?=\n|$)'
```

### Resultados de Aprendizaje:
```regex
r'[-•]\s*([Rr][Aa]\d+)\s*[-:]\s*([^\n]+)'
```

### Secciones de Fundamentos:
```regex
r'importancia\s+en\s+el\s+plan\s+de\s+estudio\s*:?\s*(.+?)(?=relación\s+con\s+el\s+perfil|$)'
r'relación\s+con\s+el\s+perfil\s+profesional\s+esperado\s*:?\s*(.+?)$'
```

## Ventajas

✅ **Estructura clara:** Cada competencia/RA tiene campos identificables  
✅ **Fácil de procesar:** Formato de diccionarios JSON para frontend  
✅ **Flexible:** Funciona con variaciones de formato (mayúsculas, espacios, etc.)  
✅ **Fallback robusto:** Si no encuentra RAs en párrafos, busca en tablas  
✅ **Separación correcta:** Fundamentos ahora tienen 2 campos distintos  

## Próximos Pasos

1. **Frontend:** Actualizar formulario para mostrar competencias y RAs como listas estructuradas
2. **Exportación:** Asegurar que al exportar a DOCX, se preserven estas estructuras
3. **Validación:** Contar RAs mínimos/máximos según requerimientos académicos
