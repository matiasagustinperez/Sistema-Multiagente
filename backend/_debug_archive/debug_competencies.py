#!/usr/bin/env python3
"""
Debug script to see what text is being passed to extract_generic_competencies
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx import Document
from app.docx_import import find_section_paragraphs, extract_section_content, extract_competencies_from_table

# Use test file
uploads_dir = "./data/uploads"
test_file = "1°_2° - Estructuras de Datos.docx"
test_path = os.path.join(uploads_dir, test_file)

print(f"Analyzing: {test_file}\n")

doc = Document(test_path)
sections = find_section_paragraphs(doc)

print("=== SECCIONES ENCONTRADAS EN PÁRRAFOS ===")
for section_key in sorted(sections.keys()):
    print(f"\n{section_key}")
    if 'OBJETIVOS' in section_key or 'objetivo' in section_key.lower():
        start_idx, end_idx = sections[section_key]
        text = extract_section_content(doc, start_idx, end_idx)
        print(f"Párrafos: {start_idx} a {end_idx}")
        print(f"Longitud: {len(text)} caracteres")
        if len(text) == 0:
            print("⚠ VACÍO - Probablemente en tabla")

print("\n\n=== BUSCANDO COMPETENCIAS EN TABLAS ===")
for idx, table in enumerate(doc.tables):
    text_content = '\n'.join([cell.text for row in table.rows for cell in row.cells])
    if 'cg' in text_content.lower() or 'ce' in text_content.lower() or 'competencia' in text_content.lower():
        print(f"\nTabla {idx} contiene palabras clave:")
        # Try extracting from this table
        gen_comp, spec_comp = extract_competencies_from_table(doc, idx)
        print(f"  Genéricas: {len(gen_comp)}")
        print(f"  Específicas: {len(spec_comp)}")
        
        if gen_comp:
            for comp in gen_comp:
                print(f"    - {comp['code']}: {comp['description'][:50]}... nivel='{comp['level']}'")
        if spec_comp:
            for comp in spec_comp:
                print(f"    - {comp['code']}: {comp['description'][:50]}... nivel='{comp['level']}'")

