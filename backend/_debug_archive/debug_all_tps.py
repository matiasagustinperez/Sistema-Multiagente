"""Debug script to extract all Practice Numbers and their RAs from docx"""
import re
from docx import Document

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

print("="*80)
print("BÚSQUEDA DE TODOS LOS PRÁCTICOS")
print("="*80)

for table_idx, table in enumerate(doc.tables):
    table_text = '\n'.join([' '.join([cell.text for cell in row.cells]) for row in table.rows])
    
    # Buscar número de práctico
    practico_match = re.search(r'Práctico\s*N[°º]?:\s*(\d+)', table_text, re.IGNORECASE)
    if not practico_match:
        continue
    
    tp_number = practico_match.group(1)
    
    # Buscar tema del práctico
    tema_match = re.search(r'Práctico\s*N[°º]?:\s*\d+\s*\n([^\n]+)', table_text, re.IGNORECASE)
    tp_title = tema_match.group(1).strip() if tema_match else "Sin título"
    
    print(f"\n{'='*80}")
    print(f"TP {tp_number}: {tp_title}")
    print(f"{'='*80}")
    
    # Extraer objetivo (entre "Objetivo" y "Actividades")
    objetivo_match = re.search(
        r'objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=actividades)',
        table_text,
        re.DOTALL | re.IGNORECASE
    )
    
    if objetivo_match:
        objetivo_text = objetivo_match.group(1).strip()
        print(f"\nOBJETIVO (primeros 500 chars):\n{objetivo_text[:500]}\n")
        
        # Buscar todos los RAs con el regex actualizado
        ra_codes = re.findall(r'RA\s*(\d+)', objetivo_text)
        print(f"RAs DETECTADOS: {['RA' + code for code in ra_codes]}")
    else:
        print("No se encontró sección 'Objetivo'")

print("\n" + "="*80)
print("RESUMEN: Se encontraron todos los prácticos con sus RAs")
print("="*80)
