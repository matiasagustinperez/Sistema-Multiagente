"""Extraer TP3 específicamente de TABLA 7"""
import re
from docx import Document

doc_path = r"1º_1º - CBI - Álgebra I.docx"
doc = Document(doc_path)

# TABLA 7 contiene todos los TPs
table = doc.tables[7]
table_text = '\n'.join([' '.join([cell.text for cell in row.cells]) for row in table.rows])

print("="*80)
print("EXTRAYENDO TP3 DE TABLA 7")
print("="*80)

# Buscar TP3 específicamente: "Práctico Nº: 3 Sistemas de ecuaciones lineales"
# Patrón: desde "Práctico Nº: 3" hasta "Práctico Nº: 4" o final
tp3_pattern = r'Práctico\s*N[°º]?:\s*3\s*[^\n]*?(.*?)(?=Práctico\s*N[°º]?:\s*4|$)'
tp3_match = re.search(tp3_pattern, table_text, re.DOTALL | re.IGNORECASE)

if tp3_match:
    tp3_text = tp3_match.group(1)
    print("\n✓ TP3 ENCONTRADO")
    print(f"\nContenido completo de TP3 (primeros 1000 chars):")
    print("-" * 80)
    print(tp3_text[:1000])
    print("-" * 80)
    
    # Extraer objetivo de TP3
    objetivo_match = re.search(
        r'objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=actividades)',
        tp3_text,
        re.DOTALL | re.IGNORECASE
    )
    
    if objetivo_match:
        objetivo_text = objetivo_match.group(1).strip()
        print(f"\nOBJETIVO DE TP3:")
        print("-" * 80)
        print(objetivo_text)
        print("-" * 80)
        
        # Buscar RAs con el regex actualizado
        ra_codes = re.findall(r'RA\s*(\d+)', objetivo_text)
        print(f"\n✓ RAs DETECTADOS EN TP3: {['RA' + code for code in ra_codes]}")
        
        if '5' in ra_codes:
            print("\n✓✓✓ ¡RA5 DETECTADO EN TP3!")
        else:
            print("\n❌ RA5 NO ENCONTRADO EN TP3")
    else:
        print("❌ No se encontró sección Objetivo en TP3")
else:
    print("❌ No se encontró TP3")

# Mostrar también los otros TPs para comparación
print("\n\n" + "="*80)
print("RESUMEN DE TODOS LOS TPs EN TABLA 7")
print("="*80)

for tp_num in [1, 2, 3, 4]:
    pattern = rf'Práctico\s*N[°º]?:\s*{tp_num}\s*[^\n]*?(.*?)(?=Práctico\s*N[°º]?:\s*{tp_num+1}|$)'
    match = re.search(pattern, table_text, re.DOTALL | re.IGNORECASE)
    
    if match:
        tp_text = match.group(1)
        obj_match = re.search(
            r'objetivo\s*(?:\([^)]*\))?\s*:?(.*?)(?=actividades)',
            tp_text,
            re.DOTALL | re.IGNORECASE
        )
        
        if obj_match:
            objetivo_text = obj_match.group(1).strip()
            ra_codes = re.findall(r'RA\s*(\d+)', objetivo_text)
            ra_list = ['RA' + code for code in ra_codes]
            print(f"TP{tp_num}: {ra_list}")
