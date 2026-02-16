#!/usr/bin/env python3
"""Debug find_section_paragraphs"""

import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from docx import Document
from app.docx_import import find_section_paragraphs

DOCX_PATH = r"C:\TesisMCD\backend\5°_2° - Proyecto de Ingeniería Mecatrónica.docx"
doc = Document(DOCX_PATH)

print("Llamando find_section_paragraphs...")
sections = find_section_paragraphs(doc)

print("\nResultado:")
print("Tipo: %s" % type(sections))
print("Cantidad de secciones: %d" % len(sections))

print("\nSecciones encontradas:")
for section_name, (start_idx, end_idx) in sections.items():
    print("  '%s': indices (%d, %d)" % (section_name[:60], start_idx, end_idx))
