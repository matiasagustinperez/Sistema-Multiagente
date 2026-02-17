"""Test usando la función real extract_practicals_from_docx"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app.docx_import import extract_practicals_from_docx
import json

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

print("="*80)
print("USANDO FUNCIÓN REAL extract_practicals_from_docx()")
print("="*80)

practicals = extract_practicals_from_docx(doc)

print(f"\n✓ Se extrajeron {len(practicals)} prácticos")

for idx, practical in enumerate(practicals, 1):
    print(f"\nTP{idx}:")
    print(f"  Número: {practical.get('number', 'N/A')}")
    print(f"  Nombre: {practical.get('name', 'N/A')}")
    
    ra_codes = practical.get('ra_codes', [])
    print(f"  RAs: {ra_codes}")
    
    if 'RA5' in ra_codes:
        print(f"  ✓✓✓ RA5 DETECTADO")
    else:
        print(f"  ❌ RA5 NO DETECTADO")
    
    # Mostrar primer 200 chars del objetivo
    objective = practical.get('objective', '')
    if objective:
        print(f"  Objetivo (100 chars): {objective[:100]}...")
