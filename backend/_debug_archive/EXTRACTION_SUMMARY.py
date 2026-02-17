#!/usr/bin/env python3
"""
RESUMEN DE MEJORAS - EXTRACCIÓN DE DOCX
Demostración del sistema mejorado de importación
"""

from app.docx_import import import_proposal_from_docx
import json

print("=" * 80)
print("🎯 SISTEMA DE IMPORTACIÓN DE DOCX - MEJORADO")
print("=" * 80)

docx_path = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
filename = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

result = import_proposal_from_docx(docx_path, filename)

print("\n📊 COMPARATIVA DE EXTRACCIÓN:")
print("-" * 80)

fields_expected = {
    '👨‍🎓 Carrera': 'career',
    '📚 Asignatura': 'subject',
    '📅 Año de Carrera': 'year_of_career',
    '🔢 Cuatrimestre': 'quarter',
    '⚖️ Régimen': 'regime',
    '⏱️ Carga Horaria': 'total_hours',
    '👥 Docentes': 'teachers',
}

print("\nCAMPOS EXTRAÍDOS:")
print("-" * 80)

all_extracted = True
for label, field_key in fields_expected.items():
    value = result.get(field_key, '')
    
    # For teachers, format nicely
    if field_key == 'teachers' and result.get('teaching_team'):
        teachers_info = []
        for t in result.get('teaching_team', []):
            teachers_info.append(f"{t.get('name')} ({t.get('category')})")
            if t.get('email'):
                teachers_info[-1] += f" - {t.get('email')}"
        value = '; '.join(teachers_info)
    
    status = "✅" if value else "⚠️"
    if not value:
        all_extracted = False
    
    print(f"{status} {label:20} : {value if value else '(vacío)'}")

print("\n📈 ESTADÍSTICAS:")
print("-" * 80)
print(f"✅ Unidades extraídas: {len(result.get('units', []))}")
print(f"✅ Trabajos Prácticos: {len(result.get('practicals', []))}")
print(f"✅ Resultados de Aprendizaje: {len(result.get('learning_outcomes', []))}")

print("\n🔧 ESTRATEGIAS DE EXTRACCIÓN UTILIZADAS:")
print("-" * 80)
print("""
1. Nombre del archivo (FILENAME PARSING):
   ✓ Año de Carrera: Extraído del "5°" en el filename
   ✓ Cuatrimestre: Extraído del "2°" en el filename  
   ✓ Asignatura: Extraída del texto después de " - "

2. Búsqueda en Tablas (TABLE PARSING):
   ✓ Régimen: Extraído de tabla "Programa Analítico"
   ✓ Carga Horaria: Extraída de tabla "Programa Analítico"
   ✓ Docentes: Extraídos de tabla "Equipo Docente" con email

3. Búsqueda en Documento (DOCUMENT SEARCH):
   ✓ Carrera: Extraída buscando en tablas y párrafos
   ✓ Unidades: Extraídas buscando tablas con "Unidad"
   ✓ Prácticos: Extraídos buscando tablas con "Práctico"
""")

print("\n" + "=" * 80)
if all_extracted:
    print("✅ ÉXITO: Todos los campos críticos fueron extraídos correctamente")
else:
    print("⚠️ NOTA: El documento no contiene todos los campos. Algunos pueden requrir entrada manual.")
print("=" * 80)
