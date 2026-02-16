#!/usr/bin/env python3
"""Test the new section-based DOCX extraction"""

import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import import_proposal_from_docx
import json

# Probar con el DOCX real
DOCX_PATH = r"C:\TesisMCD\backend\5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
filename = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

print("=" * 80)
print("PRUEBA: EXTRACCIÓN COMPLETA POR SECCIONES")
print("=" * 80)

try:
    data = import_proposal_from_docx(DOCX_PATH, filename)
    
    print("\n1️⃣ ENCABEZADO:")
    print("-" * 80)
    print(f"Carrera: {data.get('career', '-')}")
    print(f"Asignatura: {data.get('subject', '-')}")
    print(f"Año: {data.get('year_of_career', '-')}")
    print(f"Cuatrimestre: {data.get('quarter', '-')}")
    print(f"Plan de Estudio: {data.get('study_plan', '-')}")
    
    print("\n2️⃣ TABLA PROGRAMA ANALÍTICO (Todos los campos):")
    print("-" * 80)
    print(f"Carácter: {data.get('character', '-')}")
    print(f"Régimen: {data.get('regime', '-')}")
    print(f"Carga Horaria Total: {data.get('total_hours', '-')}")
    print(f"Horas Teóricas: {data.get('theoretical_hours', '-')}")
    print(f"Horas Prácticas: {data.get('practical_hours', '-')}")
    print(f"Horas Semanales: {data.get('weekly_hours', '-')}")
    
    print("\n3️⃣ EQUIPO DOCENTE:")
    print("-" * 80)
    teaching_team = data.get('teaching_team', [])
    print(f"Total de docentes: {len(teaching_team)}")
    for idx, doc_info in enumerate(teaching_team, 1):
        print(f"\n  Docente {idx}:")
        print(f"    Nombre: {doc_info.get('name', '-')}")
        print(f"    Categoría: {doc_info.get('category', '-')}")
        print(f"    Email: {doc_info.get('email', '-')}")
    
    print("\n4️⃣ CONTENIDOS MÍNIMOS (Sección 1):")
    print("-" * 80)
    min_content = data.get('minimum_content', '')
    preview = min_content[:200] if min_content else "NO ENCONTRADO"
    print(f"{preview}..." if len(min_content) > 200 else preview)
    print(f"Longitud: {len(min_content)} caracteres")
    
    print("\n5️⃣ FUNDAMENTOS (Sección 2):")
    print("-" * 80)
    print(f"Importancia en Plan: {data.get('importance', 'NO ENCONTRADA')[:100]}...")
    print(f"Relación con Perfil: {data.get('professional_profile', 'NO ENCONTRADA')[:100]}...")
    
    print("\n6️⃣ OBJETIVOS (Sección 3):")
    print("-" * 80)
    print(f"Competencias Genéricas: {data.get('generic_competencies', 'NO ENCONTRADAS')[:100]}...")
    print(f"Competencias Específicas: {data.get('specific_competencies', 'NO ENCONTRADAS')[:100]}...")
    print(f"Resultados de Aprendizaje encontrados: {len(data.get('learning_outcomes', []))}")
    for idx, ra in enumerate(data.get('learning_outcomes', [])[:3], 1):
        print(f"  RA{idx}: {ra[:80]}...")
    
    print("\n7️⃣ UNIDADES (Sección 4):")
    print("-" * 80)
    units = data.get('units', [])
    print(f"Total de unidades: {len(units)}")
    for unit in units[:2]:
        print(f"\n  Unidad {unit.get('number', '?')}:")
        print(f"    Nombre: {unit.get('name', '-')[:60]}")
        print(f"    Contenido: {unit.get('content', '-')[:80]}...")
        print(f"    Bib Básica: {unit.get('bibliography_basic', '-')[:60] if unit.get('bibliography_basic') else '-'}")
    
    print("\n8️⃣ TRABAJOS PRÁCTICOS (Sección 5):")
    print("-" * 80)
    practicals = data.get('practicals', [])
    print(f"Total de TPs: {len(practicals)}")
    for practical in practicals[:2]:
        print(f"\n  TP {practical.get('number', '?')}:")
        print(f"    Nombre: {practical.get('name', '-')[:60]}")
        print(f"    Objetivo: {practical.get('objective', '-')[:80]}...")
        print(f"    Actividades: {practical.get('activities', '-')[:60]}")
    
    print("\n9️⃣ METODOLOGÍA (Sección 6):")
    print("-" * 80)
    methodology = data.get('methodology', '')
    print(f"{methodology[:150]}..." if len(methodology) > 150 else methodology if methodology else "NO ENCONTRADA")
    
    print("\n🔟 EVALUACIÓN (Sección 7):")
    print("-" * 80)
    evaluation = data.get('evaluation', '')
    print(f"{evaluation[:150]}..." if len(evaluation) > 150 else evaluation if evaluation else "NO ENCONTRADA")
    
    print("\n📚 BIBLIOGRAFÍA (Sección 8):")
    print("-" * 80)
    bibliography = data.get('bibliography', '')
    print(f"{bibliography[:150]}..." if len(bibliography) > 150 else bibliography if bibliography else "NO ENCONTRADA")
    
    print("\n📝 OBSERVACIONES (Sección 9):")
    print("-" * 80)
    observations = data.get('observations', '')
    print(f"{observations[:150]}..." if len(observations) > 150 else observations if observations else "NO ENCONTRADA")
    
    print("\n" + "=" * 80)
    print("✅ EXTRACCIÓN COMPLETADA")
    print("=" * 80)

except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
