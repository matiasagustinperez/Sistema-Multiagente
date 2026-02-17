#!/usr/bin/env python
"""Test final - Verificar extracción de contenido desde tablas"""
import sys
sys.path.insert(0, 'c:\\TesisMCD\\backend')

from app.docx_import_final import import_proposal_from_docx

# Test con real DOCX
file_path = r'c:\TesisMCD\backend\data\uploads\5°_2° - Proyecto de Ingeniería Mecatrónica.docx'
filename = '5°_2° - Proyecto de Ingeniería Mecatrónica.docx'

print("=" * 80)
print("EXTRACCIÓN FINAL - BÚSQUEDA POR CONTENIDO EN TABLAS")
print("=" * 80)

result = import_proposal_from_docx(file_path, filename)

# Mostrar resultados
print("\n[ENCABEZADO]")
print(f"  Asignatura: {result['subject']}")
print(f"  Año: {result['year_of_career']}")
print(f"  Cuatrimestre: {result['quarter']}")

print("\n[PROGRAMA ANALÍTICO]")
print(f"  Carácter: {result['character']}")
print(f"  Régimen: {result['regime']}")
print(f"  Carga Horaria Total: {result['total_hours']}")
print(f"  Hs Teóricas: {result['theoretical_hours']}")
print(f"  Hs Prácticas: {result['practical_hours']}")
print(f"  Hs Semanales: {result['weekly_hours']}")

print("\n[EQUIPO DOCENTE]")
for idx, prof in enumerate(result['teaching_team'], 1):
    print(f"  Docente {idx}: {prof['name']} ({prof['category']}) {prof['email']}")

print("\n[CONTENIDOS MÍNIMOS]")
if result['minimum_content']:
    print(f"  {result['minimum_content'][:200]}...")
else:
    print("  [VACÍO]")

print("\n[FUNDAMENTOS]")
if result['fundamentals']:
    print(f"  {result['fundamentals'][:200]}...")
else:
    print("  [VACÍO]")

print("\n[OBJETIVOS]")
if result['objectives']:
    print(f"  {result['objectives'][:200]}...")
else:
    print("  [VACÍO]")

print("\n[UNIDADES]")
print(f"  Total: {len(result['units'])}")
for unit in result['units'][:3]:
    print(f"    Unidad {unit['number']}: {unit['name']}")

print("\n[PRÁCTICOS]")
print(f"  Total: {len(result['practicals'])}")
for tp in result['practicals'][:3]:
    print(f"    TP {tp['number']}: {tp['name']}")

print("\n" + "=" * 80)
