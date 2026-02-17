import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from docx import Document
import re

ALGEBRA_FILE = r"C:\TesisMCD\backend\1º_1º - CBI - Álgebra I.docx"

doc = Document(ALGEBRA_FILE)

print("=" * 80)
print("ANÁLISIS DETALLADO DE EXTRACCIÓN DE TPs")
print("=" * 80)

# Buscar tablas de TPs
header_pattern = re.compile(r'pr[áa]ctico\s*n[°º]?\s*:?\s*(\d+)\s*(.*)', re.IGNORECASE)

tp_count = 0
for table_idx, table in enumerate(doc.tables):
    table_text = ' '.join([cell.text for row in table.rows for cell in row.cells])
    table_text_lower = table_text.lower()
    
    if 'practico' not in table_text_lower or 'objetivo' not in table_text_lower:
        continue
    
    tp_count += 1
    
    # Buscar el header del TP
    for row_idx, row in enumerate(table.rows):
        row_cells = [cell.text.strip() for cell in row.cells]
        header_match = None
        
        for cell_idx, cell_text in enumerate(row_cells):
            match = header_pattern.search(cell_text)
            if match:
                header_match = match
                break
        
        if not header_match:
            continue
        
        tp_number = header_match.group(1).strip()
        tp_name = header_match.group(2).strip()
        
        # Solo procesar TP 3
        if tp_number != '3':
            continue
        
        print(f"\n{'='*80}")
        print(f"TP {tp_number}: {tp_name}")
        print(f"{'='*80}")
        
        # Obtener la siguiente fila que contiene el contenido
        if row_idx + 1 < len(table.rows):
            next_row = table.rows[row_idx + 1]
            
            # Extraer el contenido de cada celda
            for cell_idx, cell in enumerate(next_row.cells):
                cell_content = cell.text
                if cell_content.strip():
                    print(f"\nCELDA {cell_idx}:")
                    print(f"Contenido (primeros 500 chars):\n{cell_content[:500]}")
                    
                    # Buscar "Objetivo" y todo hasta "Actividades"
                    obj_match = re.search(r'(?i)objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=(?i)actividades|$)', cell_content, re.DOTALL)
                    if obj_match:
                        obj_text = obj_match.group(1)
                        print(f"\n[OBJETIVO EXTRAÍDO]\n{obj_text[:600]}")
                        
                        # Buscar todos los RAs
                        ras = []
                        for ra_match in re.finditer(r'RA\s*(\d+)', obj_text, re.IGNORECASE):
                            ra_code = f"RA{ra_match.group(1)}"
                            if ra_code not in ras:
                                ras.append(ra_code)
                        
                        print(f"\n[RAs ENCONTRADOS]\n{ras}")
                        
                        print(f"\n[LÍNEAS CON RAs]")
                        for line in obj_text.split('\n'):
                            if re.search(r'RA\s*\d', line, re.IGNORECASE):
                                print(f"  > {line.strip()[:100]}")
