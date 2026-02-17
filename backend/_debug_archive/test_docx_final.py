#!/usr/bin/env python3
"""Test the new section-based DOCX extraction - SIN EMOJIS"""

import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import import_proposal_from_docx

# Probar con el DOCX real
DOCX_PATH = r"C:\TesisMCD\backend\5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
filename = "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

print("=" * 80)
print("PRUEBA: EXTRACCION COMPLETA POR SECCIONES")
print("=" * 80)

try:
    data = import_proposal_from_docx(DOCX_PATH, filename)
    
    print("\n[1] ENCABEZADO:")
    print("-" * 80)
    print("Carrera: [%s]" % data.get('career', '-'))
    print("Asignatura: [%s]" % data.get('subject', '-'))
    print("Año: [%s]" % data.get('year_of_career', '-'))
    print("Cuatrimestre: [%s]" % data.get('quarter', '-'))
    print("Plan de Estudio: [%s]" % data.get('study_plan', '-'))
    
    print("\n[2] TABLA PROGRAMA ANALITICO (Todos los campos):")
    print("-" * 80)
    print("Carácter: [%s]" % data.get('character', '-'))
    print("Régimen: [%s]" % data.get('regime', '-'))
    print("Carga Horaria Total: [%s]" % data.get('total_hours', '-'))
    print("Horas Teóricas: [%s]" % data.get('theoretical_hours', '-'))
    print("Horas Prácticas: [%s]" % data.get('practical_hours', '-'))
    print("Horas Semanales: [%s]" % data.get('weekly_hours', '-'))
    
    print("\n[3] EQUIPO DOCENTE:")
    print("-" * 80)
    teaching_team = data.get('teaching_team', [])
    print("Total de docentes: %d" % len(teaching_team))
    for idx, doc_info in enumerate(teaching_team, 1):
        print("\n  Docente %d:" % idx)
        print("    Nombre: %s" % doc_info.get('name', '-'))
        print("    Categoría: %s" % doc_info.get('category', '-'))
        print("    Email: %s" % doc_info.get('email', '-'))
    
    print("\n[4] CONTENIDOS MINIMOS (Seccion 1):")
    print("-" * 80)
    min_content = data.get('minimum_content', '')
    preview = min_content[:200] if min_content else "NO ENCONTRADO"
    print(preview if len(min_content) <= 200 else preview + "...")
    print("Longitud: %d caracteres" % len(min_content))
    
    print("\n[5] FUNDAMENTOS (Seccion 2):")
    print("-" * 80)
    importance = data.get('importance', '')
    profile = data.get('professional_profile', '')
    print("Importancia en Plan: [%s]..." % importance[:100] if importance else "NO ENCONTRADA")
    print("Relación con Perfil: [%s]..." % profile[:100] if profile else "NO ENCONTRADA")
    
    print("\n[6] OBJETIVOS (Seccion 3):")
    print("-" * 80)
    gen_comp = data.get('generic_competencies', '')
    spec_comp = data.get('specific_competencies', '')
    print("Competencias Genéricas: [%s]..." % gen_comp[:100] if gen_comp else "NO ENCONTRADAS")
    print("Competencias Específicas: [%s]..." % spec_comp[:100] if spec_comp else "NO ENCONTRADAS")
    ra_list = data.get('learning_outcomes', [])
    print("Resultados de Aprendizaje encontrados: %d" % len(ra_list))
    for idx, ra in enumerate(ra_list[:3], 1):
        print("  RA%d: %s..." % (idx, ra[:60]))
    
    print("\n[7] UNIDADES (Seccion 4):")
    print("-" * 80)
    units = data.get('units', [])
    print("Total de unidades: %d" % len(units))
    for unit in units[:3]:
        print("\n  Unidad %s:" % unit.get('number', '?'))
        print("    Nombre: %s" % unit.get('name', '-')[:60])
        print("    Contenido: %s..." % unit.get('content', '-')[:80] if unit.get('content') else "-")
    
    print("\n[8] TRABAJOS PRACTICOS (Seccion 5):")
    print("-" * 80)
    practicals = data.get('practicals', [])
    print("Total de TPs: %d" % len(practicals))
    for practical in practicals[:3]:
        print("\n  TP %s:" % practical.get('number', '?'))
        print("    Nombre: %s" % practical.get('name', '-')[:60])
        print("    Objetivo: %s..." % practical.get('objective', '-')[:80] if practical.get('objective') else "-")
    
    print("\n[9] METODOLOGIA (Seccion 6):")
    print("-" * 80)
    methodology = data.get('methodology', '')
    preview_method = methodology[:150] if len(methodology) > 150 else methodology
    print(preview_method if preview_method else "NO ENCONTRADA")
    
    print("\n[10] EVALUACION (Seccion 7):")
    print("-" * 80)
    evaluation = data.get('evaluation', '')
    preview_eval = evaluation[:150] if len(evaluation) > 150 else evaluation
    print(preview_eval if preview_eval else "NO ENCONTRADA")
    
    print("\n[11] BIBLIOGRAFIA (Seccion 8):")
    print("-" * 80)
    bibliography = data.get('bibliography', '')
    preview_bib = bibliography[:150] if len(bibliography) > 150 else bibliography
    print(preview_bib if preview_bib else "NO ENCONTRADA")
    
    print("\n[12] OBSERVACIONES (Seccion 9):")
    print("-" * 80)
    observations = data.get('observations', '')
    preview_obs = observations[:150] if len(observations) > 150 else observations
    print(preview_obs if preview_obs else "NO ENCONTRADA")
    
    print("\n" + "=" * 80)
    print("OK: EXTRACCION COMPLETADA")
    print("=" * 80)

except Exception as e:
    print("ERROR: %s" % str(e))
    import traceback
    traceback.print_exc()
