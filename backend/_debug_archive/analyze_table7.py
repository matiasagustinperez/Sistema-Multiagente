"""Analizar estructura detallada de TABLA 7"""
from docx import Document

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

table = doc.tables[7]

print("="*80)
print("ESTRUCTURA DETALLADA DE TABLA 7")
print("="*80)
print(f"\nTabla 7: {len(table.rows)} filas, {len(table.columns)} columnas")

for row_idx, row in enumerate(table.rows):
    print(f"\nFila {row_idx}:")
    
    for cell_idx, cell in enumerate(row.cells):
        text = cell.text.strip()
        # Mostrar primeros 150 chars o menos
        preview = text[:150].replace('\n', ' ') if text else "(vacío)"
        print(f"  Celda {cell_idx}: {preview}")
    
    if row_idx < 5:
        print("  ---")
    else:
        print("  ... (otras filas similar)")
        break
