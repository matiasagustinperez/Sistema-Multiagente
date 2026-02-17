"""Verificar contenido de prácticos de Álgebra (JSON)"""
import sqlite3
import json

db_path = r"data/proposals.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("="*80)
print("VERIFICANDO PROPUESTA DE ÁLGEBRA (ID 9)")
print("="*80)

cursor.execute("SELECT id, title, subject, practicals FROM proposals WHERE id = 9")
result = cursor.fetchone()

if result:
    prop_id, title, subject, practicals_json = result
    
    print(f"\n✓ Propuesta encontrada:")
    print(f"  ID: {prop_id}")
    print(f"  Título: {title}")
    print(f"  Asignatura: {subject}")
    
    if practicals_json:
        try:
            practicals = json.loads(practicals_json)
            print(f"\n✓ Se encontraron {len(practicals)} prácticos:")
            
            for idx, practical in enumerate(practicals, 1):
                print(f"\n  TP{idx}:")
                print(f"    Título: {practical.get('title', 'Sin título')}")
                
                # RAs pueden estar en diferente estructura
                ra_codes = practical.get('ra_codes')
                if ra_codes:
                    if isinstance(ra_codes, list):
                        print(f"    RAs: {ra_codes}")
                    else:
                        print(f"    RAs (raw): {ra_codes}")
                    
                    # Buscar RA5
                    if isinstance(ra_codes, list) and 'RA5' in ra_codes:
                        print(f"    ✓✓✓ RA5 DETECTADO")
                    elif isinstance(ra_codes, str) and 'RA5' in ra_codes:
                        print(f"    ✓✓✓ RA5 DETECTADO (en string)")
                    else:
                        print(f"    ❌ RA5 NO ENCONTRADO")
                else:
                    print(f"    ❌ sin RAs")
        except json.JSONDecodeError as e:
            print(f"\n❌ Error decodificando JSON: {e}")
            print(f"Content: {practicals_json[:200]}")
    else:
        print("\n❌ No hay prácticos almacenados")
else:
    print("\n❌ Propuesta no encontrada")

conn.close()

print("\n" + "="*80)
print("RESUMEN DE RAs EN TODOS LOS TPs")
print("="*80)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, title, practicals FROM proposals WHERE id = 9")
result = cursor.fetchone()

if result:
    prop_id, title, practicals_json = result[0], result[1], result[2]
    
    if practicals_json:
        try:
            practicals = json.loads(practicals_json)
            
            for idx, practical in enumerate(practicals, 1):
                title = practical.get('title', f'TP{idx}')
                ra_codes = practical.get('ra_codes', [])
                print(f"\nTP{idx}: {title} → {ra_codes}")
                
        except:
            pass

conn.close()
