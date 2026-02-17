#!/usr/bin/env python3
"""Test filename extraction from real DOCX"""

from app.docx_import import import_proposal_from_docx
import json

# Probar con el DOCX real
docx_path = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
filename = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

print(f"Testing filename parsing from: {filename}")
print("=" * 60)

result = import_proposal_from_docx(docx_path, filename)

# Mostrar campos extraídos
print("\n📋 CAMPOS EXTRAÍDOS DEL ENCABEZADO:")
print("-" * 60)
print(f"Carrera: {result.get('career') or '-'}")
print(f"Asignatura: {result.get('subject') or '-'}")
print(f"Año de Carrera: {result.get('year_of_career') or '-'}")
print(f"Cuatrimestre: {result.get('quarter') or '-'}")
print(f"Régimen: {result.get('regime') or '-'}")
print(f"Horas: {result.get('total_hours') or '-'}")
print(f"Plan de Estudio: {result.get('study_plan') or '-'}")

# Docentes
print(f"\n👥 DOCENTES ({len(result.get('teaching_team', []))}):")
for idx, teacher in enumerate(result.get('teaching_team', []), 1):
    print(f"  {idx}. {teacher.get('name', '-')} ({teacher.get('category', '-')})")
    if teacher.get('email'):
        print(f"     📧 {teacher.get('email')}")

# Resumen
print("\n📊 RESUMEN:")
print("-" * 60)
print(f"Unidades encontradas: {len(result.get('units', []))}")
print(f"Trabajos Prácticos encontrados: {len(result.get('practicals', []))}")
print(f"Resultados de Aprendizaje: {len(result.get('learning_outcomes', []))}")

print("\n✅ Test completado")
