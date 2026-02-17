"""Ver qué hay en los primeros 203 chars"""
import sys
import os
sys.path.insert(0, os.getcwd())

from docx import Document
from app.docx_import import extract_text_from_table_cell
import re

doc = Document(r"1º_1º - CBI - Álgebra I.docx")
table = doc.tables[7]

block_cells = table.rows[1].cells
block_text = '\n'.join([extract_text_from_table_cell(cell) for cell in block_cells]).strip()

print("="*80)
print("ANALIZANDO EXTRACCIÓN DE OBJETIVO VÍA parse_practical_block")
print("="*80)

# Replicar EXACTAMENTE el código
label_patterns = [
    ('objective', re.compile(r'(?i)objetivo(?:\s*\(.*?\))?\s*:?')),
    ('activities', re.compile(r'(?i)actividades?\s+a\s+desarrollar(?:\s*\(.*?\))?\s*:?')),
    ('materials', re.compile(r'(?i)materiales?\s*:?')),
    ('scope', re.compile(r'(?i)[áa]mbito(?:\s+de\s+pr[áa]ctica)?\s*:?')),
]

def strip_trailing_labels(segment: str) -> str:
    if not segment:
        return ''
    earliest = None
    for _, pattern in label_patterns:
        match = pattern.search(segment)
        if match:
            earliest = match.start() if earliest is None else min(earliest, match.start())
    if earliest is None:
        return segment.strip()
    return segment[:earliest].strip()

matches = []
for label, pattern in label_patterns:
    match = pattern.search(block_text)
    if match:
        matches.append((match.start(), match.end(), label))
        print(f"{label}: pos {match.start()}-{match.end()}")

matches.sort(key=lambda x: x[0])

segments = {}

for idx, (start, end, label) in enumerate(matches):
    next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(block_text)
    segment = block_text[end:next_start].strip()
    segments[label] = strip_trailing_labels(segment)
    
    print(f"\n{label} (posiciones {end} a {next_start}):")
    print(f"  Sin limpiar ({len(segment)} chars): {segment[:100]}")
    print(f"  Limpio ({len(segments[label])} chars): {segments[label][:100]}")

objective_raw = segments.get('objective', '')
print(f"\n\nOBJETIVE_RAW FINAL ({len(objective_raw)} chars):")
print(objective_raw[:300])
