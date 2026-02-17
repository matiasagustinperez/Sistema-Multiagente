"""Llama extract_practicals_from_docx y debuggea los RAs retornados"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app import docx_import

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

print("="*80)
print("LLAMANDO extract_practicals_from_docx")
print("="*80)

practicals = docx_import.extract_practicals_from_docx(doc)

print(f"\n✓ {len(practicals)} prácticos retornados\n")

for idx, p in enumerate(practicals, 1):
    print(f"TP{idx}:")
    print(f"  number: {p.get('number')}")
    print(f"  name: {p.get('name')}")
    
    # Check ra_codes field
    ra_codes = p.get('ra_codes')
    print(f"  ra_codes (presente: {ra_codes is not None}): {ra_codes}")
    
    # Mostrar objetivo
    objective = p.get('objective', '')
    print(f"  objective (primeros 100 chars): {objective[:100]}")
    print()
