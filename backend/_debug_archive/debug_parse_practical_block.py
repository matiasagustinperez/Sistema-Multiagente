"""Test parse_practical_block DIRECTAMENTE"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document  
from app.docx_import import extract_text_from_table_cell

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

table = doc.tables[7]
row = table.rows[1]

# Obtener el bloque de texto como lo hace la función real
block_cells = row.cells
block_text = '\n'.join([extract_text_from_table_cell(cell) for cell in block_cells]).strip()

print("="*80)
print("BLOQUE DE TEXTO (para parse_practical_block)")
print("="*80)
print(f"\nTamaño: {len(block_text)} chars")
print(f"\nSEGUNDO 1000 chars:")
print("-" * 80)
print(block_text[1000:2000])
print("-" * 80)

# Ahora necesito recrear la lógica de parse_practical_block
import re

label_patterns = [
    ('objective', re.compile(r'(?i)objetivo(?:\s*\(.*?\))?\s*:?')),
    ('activities',re.compile(r'(?i)actividades?\s+a\s+desarrollar(?:\s*\(.*?\))?\s*:?')),
    ('materials', re.compile(r'(?i)materiales?\s*:?')),
    ('scope', re.compile(r'(?i)[áa]mbito(?:\s+de\s+pr[áa]ctica)?\s*:?')),
]

matches = []
for label, pattern in label_patterns:
    match = pattern.search(block_text)
    if match:
        matches.append((match.start(), match.end(), label))
        print(f"\n{label}: Encontrado en pos {match.start()}-{match.end()}")

matches.sort(key=lambda x: x[0])

segments = {}
for idx, (start, end, label) in enumerate(matches):
    next_start = matches[idx + 1][0] if idx +1 < len(matches) else len(block_text)
    segment = block_text[end:next_start].strip()
    segments[label] = segment
    print(f"\n{label} segment (primeros 300 chars):")
    print(f"  {segment[:300]}")

print("\n" + "="*80)
print("BUSCANDO RAs EN OBJETIVO")
print("="*80)

objective_raw = segments.get('objective', '')
print(f"\nobjective_raw ({len(objective_raw)} chars):")
print(objective_raw[:500])

ra_codes = []
for match in re.finditer(r'RA\s*(\d+)', objective_raw, re.IGNORECASE):
    code = f"RA{match.group(1)}"
    if code not in ra_codes:
        ra_codes.append(code)
        print(f"  Encontrado: {code}")

print(f"\nRA CODES FINALES: {ra_codes}")
