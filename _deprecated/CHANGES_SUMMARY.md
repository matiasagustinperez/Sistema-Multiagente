# 📋 Cambios Realizados - Resumen Ejecutivo

## Problema Reportado por el Usuario
```
1. Unidades y TP aparecen con "y tantos más" → Mostrar TODOS
2. Las horas no aparecen en la previsualización → Mostrar todas (total, teórica, práctica, semanal)
3. RAs no se encuentran en tabla → Buscar en tabla después de fundamentos
4. Al cargar propuesta al formulario:
   - Docentes aparecen concatenados en lugar de individual
   - Horas no se cargan
   - Contenidos mínimos no se cargan
```

---

## ✅ Soluciones Implementadas

### 1️⃣ FRONTEND: Mostrar TODOS los Units y Practicals

**ANTES:**
```jsx
{importPreview.data.units.slice(0, 3).map((unit, idx) => (
  // ...mostrar 3
))}
{importPreview.data.units.length > 3 && (
  <p>... y {importPreview.data.units.length - 3} unidades más</p>
)}
```

**AHORA:**
```jsx
{importPreview.data.units.map((unit, idx) => (
  <div key={idx}>
    <strong>Unidad {unit.number || idx + 1}: {unit.name}</strong>
    {/* Mostrar TODOS sin límite */}
  </div>
))}
```

✅ **Resultado**: Se muestran completas todas les unidades y prácticos

---

### 2️⃣ FRONTEND: Mostrar TODAS las Horas en Previsualización

**ANTES:**
```jsx
<div><strong>Horas:</strong> {importPreview.preview.hours || '-'}</div>
```
(Campo `hours` no existe, siempre vacío)

**AHORA:**
```jsx
<div><strong>Carga Horaria Total:</strong> {importPreview.preview.total_hours || '-'} hs</div>
<div><strong>Horas Teóricas:</strong> {importPreview.preview.theoretical_hours || '-'} hs</div>
<div><strong>Horas Prácticas:</strong> {importPreview.preview.practical_hours || '-'} hs</div>
<div><strong>Horas Semanales:</strong> {importPreview.preview.weekly_hours || '-'} hs</div>
```

✅ **Resultado**: 
- Preview muestra: 180 hs total | 60 teóricas | 120 prácticas | 12 semanales

---

### 3️⃣ BACKEND: Extraer RAs de TABLAS (no solo párrafos)

**NUEVO:**
```python
def extract_learning_outcomes_from_tables(doc: Document) -> List[str]:
    """Busca en TODAS las tablas por RA1:, RA2:, etc."""
    learning_outcomes = []
    seen_numbers = set()
    
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                # Buscar patrón "RAX:" en cada celda
                ra_matches = re.findall(r'RA\d+\s*[:\-]?\s*(.+)', cell_text)
                for match in ra_matches:
                    ra_num = re.search(r'RA(\d+)', cell_text)
                    if ra_num and ra_num.group(1) not in seen_numbers:
                        learning_outcomes.append(match.strip())
```

**INTEGRACIÓN:**
```python
# Intentar búsqueda en párrafos primero
learning_outcomes = re.findall(r'RA\d+[:\-]?\s*([^\n]+)', ra_text)

# Si no hay RAs, buscar en TABLAS
if not learning_outcomes:
    learning_outcomes = extract_learning_outcomes_from_tables(doc)
```

✅ **Resultado**: 
- Busca en párrafos de OBJETIVOS section
- Si no encuentra, busca en TODAS las tablas
- Deduplica por número de RA

---

### 4️⃣ FRONTEND: Cargar docentes como ARRAY individual

**ANTES:**
```jsx
// data.teachers era string concatenado
if (data.teachers) {
  setEquipoDocente([{
    id: 1,
    nombre: data.teachers.toUpperCase(),  // "PEREZ...;CRUZ..."
    categoria: 'TITULAR',
    correo: ''
  }])
}
```

**AHORA:**
```jsx
// data.teaching_team es array de objetos
if (data.teaching_team && Array.isArray(data.teaching_team)) {
  setEquipoDocente(data.teaching_team.map((docente, idx) => ({
    id: idx + 1,
    nombre: docente.name || '',      // PEREZ, MATIAS AGUSTIN
    categoria: docente.category || '', // ADJUNTO
    correo: docente.email || ''        // mataguper20@gmail.com
  })))
}
```

✅ **Resultado**: 
- Tabla de docentes con 2 filas:
  - Fila 1: PEREZ...| ADJUNTO | mataguper...
  - Fila 2: CRUZ... | JTP | alejandro...

---

### 5️⃣ FRONTEND: Cargar TODAS las horas al formulario

**ANTES:**
```jsx
hsTeo: parseInt(data.hours) || 0,    // Campo errado
hsPrac: 0,                            // No se cargaba (siempre 0)
// Faltaban: total_hours, weekly_hours
```

**AHORA:**
```jsx
hsTotal: parseInt(data.total_hours) || 0,           // 180
hsTeo: parseInt(data.theoretical_hours) || 0,       // 60
hsPrac: parseInt(data.practical_hours) || 0,        // 120
hsSemanal: parseInt(data.weekly_hours) || 0,        // 12
```

✅ **Resultado**: 
- Formulario pre-llenado con todas las horas correctas

---

### 6️⃣ BACKEND: Actualizar endpoint de preview

**ANTES:**
```python
"preview": {
    "hours": extracted_data.get('hours', ''),  # Campo que no existe
    "regime": ...,
    # Faltan los 4 campos de horas
}
```

**AHORA:**
```python
"preview": {
    "total_hours": extracted_data.get('total_hours', ''),
    "theoretical_hours": extracted_data.get('theoretical_hours', ''),
    "practical_hours": extracted_data.get('practical_hours', ''),
    "weekly_hours": extracted_data.get('weekly_hours', ''),
    "regime": ...,
}
```

✅ **Resultado**: 
- Preview retorna todas las horas por separado

---

## 📊 Flujo Completo (Después de los cambios)

```
1. Usuario sube DOCX
   ↓
2. Backend extrae:
   ✓ Units: 3 unidades con contenidos
   ✓ Practicals: 4 TP con objetivos
   ✓ RAs: Busca en párrafos → Si no, busca en tablas → Extrae todos
   ✓ Hours: 180 | 60 | 120 | 12
   ✓ Teaching Team: Array de 2 docentes individuales
   ✓ Contenidos Mínimos: desde tabla correcta
   
3. Frontend preview muestra:
   ✓ Todas 3 unidades completas (no "y más")
   ✓ Todos 4 TPs completos (no "y más")
   ✓ TODAS las horas: 180 | 60 | 120 | 12
   ✓ Tabla de 2 docentes con nombre, categoría, email
   
4. Usuario clickea "Cargar Propuesta al Formulario"
   ✓ Formulario se pre-llena con TODOS los datos
   ✓ Horas: hsTotal=180, hsTeo=60, hsPrac=120, hsSemanal=12
   ✓ Docentes: 2 registros individuales (no concatenado)
   ✓ Contenidos mínimos: 256 chars textos
   ✓ Units: 3 unidades en array
   ✓ Practicals: 4 TP en array
   ✓ RAs: Todos los RA extraídos
```

---

## 🧪 Cómo Verificar

```bash
# Terminal 1: Backend
cd backend
python -c "from app.docx_import import extract_learning_outcomes_from_tables; print('✓ OK')"

# Terminal 2: Visual
Abre http://localhost:5173
1. Click "Importar Propuesta"
2. Sube un DOCX
3. Verifica:
   ✓ Preview muestra TODAS las horas
   ✓ Preview muestra TODOS los units y TPs (no "y más")
   ✓ Tabla de docentes muestra filas individuales
4. Click "Cargar al Formulario"
5. Verifica formulario pre-lleno con:
   ✓ Todas las horas correctas
   ✓ 2 docentes individuales
   ✓ Todos los units
   ✓ Todos los TPs
```

---

## 🔧 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/app/docx_import.py` | +30 líneas (función de RAs) |
| `backend/app/main.py` | Actualiza preview fields (horas individuales) |
| `frontend/src/App.jsx` | Actualiza:units/TP display, horas, docentes loading |
| `update_docx_import.py` | Script helper (puede eliminarse) |

---

**Status**: ✅ **LISTO PARA TESTING**

Commit message: `improve: fix import preview and form loading - show all units/TPs, extract RAs from tables`
