"""Obtener texto completo de celdas para ver RA5"""
from docx import Document

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

table = doc.tables[7]

print("="*80)
print("CONTENIDO COMPLETO - TP1 OBJETIVO")
print("="*80)

# Fila 1 contiene el objetivo de TP1
row = table.rows[1]

for cell_idx, cell in enumerate(row.cells):
    text = cell.text.strip()
    print(f"\nCelda {cell_idx}:")
    print("-" * 80)
    print(text)
    print("-" * 80)

print("\n" + "="*80)
print("BÚSQUEDA DE RA5")
print("="*80)

# Buscar RA5 en el texto
import re
for row_idx in [1, 3, 5, 7]:  # Filas con objetivo
    for cell_idx, cell in enumerate(table.rows[row_idx].cells):
        text = cell.text
        if 'RA 5' in text or 'RA5' in text:
            print(f"\n✓ RA5 ENCONTRADO en Fila {row_idx}, Celda {cell_idx}")
            ra_codes = re.findall(r'RA\s*(\d+)', text, re.IGNORECASE)
            print(f"  Códigos encontrados: {['RA' + code for code in ra_codes]}")
            break
    else:
        print(f"✗ RA5 NO encontrado en Fila {row_idx}")
