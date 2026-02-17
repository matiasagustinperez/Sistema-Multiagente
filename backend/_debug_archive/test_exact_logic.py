"""Verificar EXACTAMENTE dónde busca la función los RAs"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
import re

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

# Esta es la ÚNICA tabla que debería procesarse según el código
table = doc.tables[7]

header_pattern = re.compile(r'pr[áa]ctico\s*n[°º]?\s*:?\s*(\d+)\s*(.*)', re.IGNORECASE)

print("="*80)
print("VERSIÓN IDÉNTICA AL CÓDIGO DE extract_practicals_from_docx")
print("="*80)

for row_idx in range(min(8, len(table.rows))):
    row = table.rows[row_idx]
    print(f"\n\nFILA {row_idx}:")
    
    # Celda por celda
    row_cells = [cell.text.strip() for cell in row.cells]
    for cell_idx, cell_text in enumerate(row_cells):
        print(f"  Celda {cell_idx}: {cell_text[:100]}")
        
        match = header_pattern.search(cell_text)
        if match:
            tp_num = match.group(1)
            print(f"\n  -> MATCH! Práctico {tp_num}")
            
            # Lógica exacta del código
            if row_idx + 1 < len(table.rows):
                print(f"  -> Extrayendo bloque de Fila {row_idx + 1}")
                
                block_cells = table.rows[row_idx + 1].cells
                print(f"     Celdd {len(block_cells)} celdas en el bloque")
                
                # Aquí es donde pueden estar los RAs
                block_text = '\n'.join([cell.text for cell in block_cells]).strip()
                
                # Buscar RAs
                ra_codes = re.findall(r'RA\s*(\d+)', block_text, re.IGNORECASE)
                print(f"     RAs encontrados: {['RA' + c for c in ra_codes]}")
