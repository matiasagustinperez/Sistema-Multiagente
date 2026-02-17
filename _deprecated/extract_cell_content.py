import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from docx import Document

# Cargar el DOCX
docx_path = r"C:\TesisMCD\backend\data\uploads\1°_2° - Estructuras de Datos.docx"
doc = Document(docx_path)

print("="*70)
print("CONTENIDO COMPLETO DE LA TABLA CON COMPETENCIAS")
print("="*70)

table = doc.tables[4]
cell = table.rows[0].cells[0]

full_text = cell.text

print(f"\nTAMAÑO: {len(full_text)} caracteres\n")
print("PRIMER FRAGMENTO (1000 chars):")
print(repr(full_text[:1000]))

print("\n\nBUSCANDO PATRONES:")
import re

# Buscar CG
cgs = re.findall(r'CG[A-Za-z]\d+', full_text)
print(f"\nCGs encontrados: {cgs}")

# Buscar niveles
niveles = re.findall(r'(Alto|Medio|Bajo)', full_text)
print(f"Niveles encontrados: {niveles[:10]}...")

# Mostrar contexto de primeras 3 competencias
print("\n\nCONTEXTO DE PRIMERAS COMPETENCIAS:")
for match in re.finditer(r'CG[A-Za-z]\d+.*?(?=CG[A-Za-z]\d+|$)', full_text):
    text = match.group(0)[:150]
    print(f"\n{repr(text)}...")

print("\n" + "="*70)
