"""Debug: ver qué texto llega a parse_practical_block para TP1"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
import re

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

# Llama a la misma lógica que extract_practicals_from_docx
table = doc.tables[7]

header_pattern = re.compile(r'pr[áa]ctico\s*n[°º]?\s*:?\s*(\d+)\s*(.*)', re.IGNORECASE)

for row_idx, row in enumerate(table.rows):
    row_cells = [cell.text.strip() for cell in row.cells]
    
    for cell_idx, cell_text in enumerate(row_cells):
        match = header_pattern.search(cell_text)
        if match:
            tp_number = match.group(1).strip()
            
            print("="*80)
            print(f"ENCONTRADO: Práctico {tp_number} en Fila {row_idx}, Celda {cell_idx}")
            print("="*80)
            
            # Ver exactamente qué se pasa a parse_practical_block
            if row_idx + 1 < len(table.rows):
                print(f"\nExtrayendo BLOQUE de Fila {row_idx + 1}:")
                
                block_cells = table.rows[row_idx + 1].cells
                
                for bc_idx, bc in enumerate(block_cells):
                    cell_content = bc.text.strip()
                    print(f"\n  BlockCelda {bc_idx} ({len(cell_content)} chars):")
                    print(f"    Primeros 300 chars:")
                    print("    " + "-" * 76)
                    print("    " + cell_content[:300].replace('\n', '\n    '))
                    print("    " + "-" * 76)
                
                block_text = '\n'.join([cell.text for cell in block_cells]).strip()
                
                print(f"\nTextuniado (primeros 500 chars):")
                print("-" * 80)
                print(block_text[:500])
                print("-" * 80)
                
                # Buscar RAs en el bloque
                ra_codes = []
                for match in re.finditer(r'RA\s*(\d+)', block_text, re.IGNORECASE):
                    code = f"RA{match.group(1)}"
                    if code not in ra_codes:
                        ra_codes.append(code)
                
                print(f"\nRAs encontrados en bloque: {ra_codes}")
                
                if tp_number == '1':
                    break
    
    if row_idx >= 2:
        break
