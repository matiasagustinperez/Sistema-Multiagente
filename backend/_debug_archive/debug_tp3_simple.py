import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from docx import Document
import re

ALGEBRA_FILE = r"C:\TesisMCD\backend\1º_1º - CBI - Álgebra I.docx"

doc = Document(ALGEBRA_FILE)

print("=" * 100)
print("BÚSQUEDA DE TP EN ÁLGEBRA")
print("=" * 100)

# Búsqueda simple
for table_idx, table in enumerate(doc.tables):
    table_text = '\n'.join([cell.text for row in table.rows for cell in row.cells])
    
    if 'sistemas de ecuaciones' in table_text.lower():
        print(f"\nTABLA {table_idx}: ENCONTRADA (Sistemas de Ecuaciones)")
        print(f"Contenido (primeros 1000 chars):\n{table_text[:1000]}\n")
        
        # Buscar objetivo
        match = re.search(r'objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=actividades|$)', table_text, re.DOTALL | re.IGNORECASE)
        if match:
            obj = match.group(1).strip()
            print(f"OBJETIVO EXTRAÍDO (primeros 800 chars):\n{obj[:800]}\n")
            
            # Buscar RAs
            ras = []
            for m in re.finditer(r'RA\s*(\d+)', obj, re.IGNORECASE):
                ra = f"RA{m.group(1)}"
                if ra not in ras:
                    ras.append(ra)
            
            print(f"RAs DETECTADOS: {ras}")
            print("\nDETALLE POR LÍNEA:")
            for i, line in enumerate(obj.split('\n'), 1):
                if line.strip():
                    print(f"  Línea {i}: {line.strip()[:80]}")

print("\n" + "=" * 100)
