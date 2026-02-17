"""Comparar extract_text_from_table_cell vs cell.text"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app.docx_import import extract_text_from_table_cell
import re

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

table = doc.tables[7]

# Bloque de TP1 (Fila 1)
row = table.rows[1]

print("="*80)
print("COMPARANDO extract_text_from_table_cell vs cell.text")
print("="*80)

for cell_idx, cell in enumerate(row.cells):
    print(f"\nCelda {cell_idx}:")
    
    # Método 1: extract_text_from_table_cell
    text1 = extract_text_from_table_cell(cell)
    print(f"  extract_text_from_table_cell ({len(text1)} chars)")
    
    # Método 2: cell.text
    text2 = cell.text
    print(f"  cell.text ({len(text2)} chars)")
    
    # Buscar RAs en cada uno
    ra_codes1 = re.findall(r'RA\s*(\d+)', text1, re.IGNORECASE)
    ra_codes2 = re.findall(r'RA\s*(\d+)', text2, re.IGNORECASE)
    
    print(f"  RAs (extract_text): {['RA' + code for code in ra_codes1]}")
    print(f"  RAs (cell.text): {['RA' + code for code in ra_codes2]}")
    
    # Ver cómo se usan en extract_practicals_from_docx
    block_text_1 = extract_text_from_table_cell(cell)
    
    print(f"\n  Primeros 300 chars (extract_text):")
    print(f"  {block_text_1[:300]}")
