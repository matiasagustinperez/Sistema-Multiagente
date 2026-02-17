"""Debug script to find ALL Practices, including those without 'Práctico N°:' format"""
import re
from docx import Document

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

print("="*80)
print("BÚSQUEDA DE TODOS LOS CONTENIDOS CON 'OBJETIVO' Y 'ACTIVIDADES'")
print("="*80)

tp_count = 0
for table_idx, table in enumerate(doc.tables):
    table_text = '\n'.join([' '.join([cell.text for cell in row.cells]) for row in table.rows])
    
    # Si contiene "Objetivo" y "Actividades", probablemente sea un TP
    if 'objetivo' in table_text.lower() and 'actividades' in table_text.lower():
        tp_count += 1
        
        # Intentar extraer título del TP
        practico_match = re.search(r'Práctico\s*N[°º]?:\s*(\d+)\s*\n([^\n]+)', table_text, re.IGNORECASE)
        if practico_match:
            tp_number = practico_match.group(1)
            tp_title = practico_match.group(2).strip()
        else:
            # Buscar otro patrón
            titulo_match = re.search(r'^([^:]+?)(?:objetivo|Objetivo)', table_text, re.MULTILINE | re.IGNORECASE)
            tp_number = str(tp_count)
            tp_title = titulo_match.group(1).strip() if titulo_match else f"TP {tp_count}"
        
        print(f"\n{'='*80}")
        print(f"TP #{tp_count} | {tp_title}")
        print(f"{'='*80}")
        
        # Extraer objetivo
        objetivo_match = re.search(
            r'objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=actividades)',
            table_text,
            re.DOTALL | re.IGNORECASE
        )
        
        if objetivo_match:
            objetivo_text = objetivo_match.group(1).strip()
            print(f"\nOBJETIVO (primeros 600 chars):\n{objetivo_text[:600]}\n")
            
            # Buscar RAs
            ra_codes = re.findall(r'RA\s*(\d+)', objetivo_text)
            print(f"✓ RAs DETECTADOS: {['RA' + code for code in ra_codes]}")
            
            # Verificar si RA5 está presente
            if 'RA5' in ['RA' + code for code in ra_codes]:
                print("  ✓✓✓ RA5 DETECTADO CORRECTAMENTE")
        else:
            print("❌ No se encontró sección 'Objetivo'")

print("\n" + "="*80)
print(f"RESUMEN: Se encontraron {tp_count} prácticos")
print("="*80)
