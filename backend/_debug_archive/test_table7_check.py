"""Verificar tabla 7 completamente"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app.docx_import import normalize_docx_text

doc = Document(r"1º_1º - CBI - Álgebra I.docx")
table = doc.tables[7]

table_text = ' '.join([cell.text for row in table.rows for cell in row.cells])
table_text_lower = normalize_docx_text(table_text)

print("="*80)
print("TABLA 7 - ANÁLISIS DETALLADO")
print("="*80)

print(f"\nLongitud de table_text: {len(table_text)}")
print(f"Primeras 200 chars: {table_text[:200]}")

print(f"\nLongitud de table_text_lower (normalizado): {len(table_text_lower)}")
print(f"Primeras 200 chars: {table_text_lower[:200]}")

print(f"\n'practico' en table_text_lower: {'practico' in table_text_lower}")
print(f"'objetivo' in table_text_lower: {'objetivo' in table_text_lower}")

# Búsqueda específica
if 'practico' not in table_text_lower or 'objetivo' not in table_text_lower:
    print("\nCONDICIÓN FALLA - TABLA SERÁ SALTADA")
else:
    print("\nCONDICIÓN PASA - TABLA SERÁ PROCESADA")
