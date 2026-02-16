#!/usr/bin/env python3
"""Debug what's between sections"""

import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from docx import Document

DOCX_PATH = r"C:\TesisMCD\backend\5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
doc = Document(DOCX_PATH)

print("Contenido de párrafos entre secciones:")
print("=" * 80)

sections_to_check = [
    (5, 7, "CONTENIDOS MINIMOS"),
    (7, 10, "FUNDAMENTOS"),
    (10, 13, "OBJETIVOS"),
    (13, 19, "CONTENIDOS DE LA ASIGNATURA"),
    (19, 21, "TPS"),
]

for start, end, name in sections_to_check:
    print("\n%s (indices %d-%d):" % (name, start, end))
    print("-" * 80)
    for idx in range(start, end):
        para = doc.paragraphs[idx]
        text = para.text.strip()
        preview = text[:100] if len(text) > 100 else text
        print("  Para[%d]: '%s'" % (idx, preview))
