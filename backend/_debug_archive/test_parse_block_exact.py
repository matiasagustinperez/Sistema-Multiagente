"""Llamar EXACTAMENTE parse_practical_block como lo hace extract_practicals_from_docx"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app.docx_import import extract_text_from_table_cell, parse_practical_block
import re

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

table = doc.tables[7]

header_pattern = re.compile(r'pr[áa]ctico\s*n[°º]?\s*:?\s*(\d+)\s*(.*)', re.IGNORECASE)

print("="*80)
print("PASANDO TEXTO A parse_practical_block EXACTAMENTE COMO extract_practicals_from_docx")
print("="*80)

found = 0
for row_idx, row in enumerate(table.rows):
    row_cells = [cell.text.strip() for cell in row.cells]
    
    for cell_idx, cell_text in enumerate(row_cells):
        match = header_pattern.search(cell_text)
        if match:
            tp_number = match.group(1)
            found += 1
            
            print(f"\n{'='*40}")
            print(f"PRÁCTICO {tp_number}")
            print(f"{'='*40}")
            
            if row_idx + 1 < len(table.rows):
                block_cells = table.rows[row_idx + 1].cells
                block_text = '\n'.join([extract_text_from_table_cell(cell) for cell in block_cells]).strip()
                
                print(f"block_text ({len(block_text)} chars):")
                
                # LLamar exactamente como lo hace
                parsed = parse_practical_block(block_text)
                
                print(f"\nRETORNO de parse_practical_block:")
                for key in ['objective', 'activities', 'materials', 'scope', 'ra_codes']:
                    value = parsed.get(key, '')
                    if key == 'ra_codes':
                        print(f"  {key}: {value}")
                    else:
                        preview = value[:100] if isinstance(value, str) else str(value)[:100]
                        print(f"  {key}: {preview}...")
    
    if found >= 1:
        break
