"""Verificar normalize_docx_text"""
import sys
import os
sys.path.insert(0, os.getcwd())

from app.docx_import import normalize_docx_text

text = "Práctico Nº: 1 Objetivo"

normalized = normalize_docx_text(text)

print(f"Original: {text}")
print(f"Normalizado: {normalized}")
print(f"'practico' en normalizado: {'practico' in normalized}")
print(f"'objetivo' en normalizado: {'objetivo' in normalized}")
