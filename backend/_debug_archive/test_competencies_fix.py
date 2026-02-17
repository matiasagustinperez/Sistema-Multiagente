#!/usr/bin/env python3
import os
import re
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx import Document
from app.docx_import import import_proposal_from_docx

# Buscar archivos docx en data/uploads
uploads_dir = "./data/uploads"
test_files = []

if os.path.exists(uploads_dir):
    for file in os.listdir(uploads_dir):
        if file.endswith('.docx') and 'template' not in file.lower():
            test_files.append(file)

if not test_files:
    print("✗ No se encontraron archivos DOCX para testear")
    exit(1)

# Testear el primero
test_file = test_files[0]
algebra_path = os.path.join(uploads_dir, test_file)
print(f"✓ Testeando con: {test_file}\n")

# Importar la propuesta
try:
    data = import_proposal_from_docx(algebra_path)
    print(f"=== CARRERA ===")
    print(f"Carrera: {data.get('carrera', 'N/A')}")
    print(f"Asignatura: {data.get('asignatura', 'N/A')}")
    
    print(f"\n=== COMPETENCIAS GENÉRICAS ===")
    gen_comp = data.get('competenciasGen', [])
    print(f"Total encontradas: {len(gen_comp)}")
    for i, comp in enumerate(gen_comp, 1):
        desc_preview = comp['description'][:50].replace('\n', ' ')
        print(f"{i}. {comp['code']} - {desc_preview}... - Nivel: '{comp['level']}'")
    
    print(f"\n=== COMPETENCIAS ESPECÍFICAS ===")
    spec_comp = data.get('competenciasEsp', [])
    print(f"Total encontradas: {len(spec_comp)}")
    for i, comp in enumerate(spec_comp, 1):
        desc_preview = comp['description'][:50].replace('\n', ' ')
        print(f"{i}. {comp['code']} - {desc_preview}... - Nivel: '{comp['level']}'")
    
    print(f"\n=== RESULTADOS DE APRENDIZAJE ===")
    los = data.get('learning_outcomes', [])
    print(f"Total encontrados: {len(los)}")
    for i, ra in enumerate(los, 1):
        desc_preview = ra['description'][:60].replace('\n', ' ')
        print(f"{i}. {ra['code']}: {desc_preview}...")
    
    # Verificar si hay newlines en los niveles
    print(f"\n=== VERIFICACIÓN: Newlines en niveles ===")
    has_newlines = False
    for comp in gen_comp:
        if '\n' in comp['level']:
            print(f"✗ PROBLEMA: {comp['code']} tiene newline: {repr(comp['level'][:50])}")
            has_newlines = True
    for comp in spec_comp:
        if '\n' in comp['level']:
            print(f"✗ PROBLEMA: {comp['code']} tiene newline: {repr(comp['level'][:50])}")
            has_newlines = True
    
    if not has_newlines and (gen_comp or spec_comp):
        print("✓ OK: Ninguna competencia tiene newlines en nivel")
    
except Exception as e:
    print(f"✗ Error al importar: {e}")
    import traceback
    traceback.print_exc()

