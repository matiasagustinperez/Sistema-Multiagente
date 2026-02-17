"""Verificar propuesta de Álgebra (ID 9) directamente en DB"""
import sqlite3
import json

db_path = r"data/proposals.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("="*80)
print("VERIFICANDO PROPUESTA DE ÁLGEBRA (ID 9) EN BD")
print("="*80)

# Obtener propuesta
cursor.execute("SELECT * FROM proposals WHERE id = 9")
proposal = cursor.fetchone()

if proposal:
    print(f"\n✓ Propuesta encontrada:")
    print(f"  ID: {proposal['id']}")
    print(f"  Título: {proposal['title']}")
    print(f"  Asignatura: {proposal['subject']}")
    print(f"  Status: {proposal['status']}")
    
    # Obtener prácticos asociados
    cursor.execute("SELECT * FROM practicals WHERE proposal_id = 9 ORDER BY id")
    practicals = cursor.fetchall()
    
    print(f"\n✓ Se encontraron {len(practicals)} prácticos:")
    
    for practical in practicals:
        print(f"\n  Práctico ID {practical['id']}:")
        print(f"    Título: {practical['title']}")
        print(f"    Objetivo: {practical['objective'][:100]}...")
        
        # Parsear ra_codes
        ra_codes_str = practical['ra_codes']
        if ra_codes_str:
            try:
                ra_codes = json.loads(ra_codes_str)
                print(f"    RAs: {ra_codes}")
                
                # Buscar RA5
                if 'RA5' in ra_codes:
                    print(f"    ✓✓✓ RA5 DETECTADO")
                else:
                    print(f"    ❌ RA5 NO ENCONTRADO")
            except:
                print(f"    RAs (raw): {ra_codes_str}")
else:
    print("\n❌ Propuesta NO encontrada")

conn.close()

print("\n" + "="*80)
print("RESUMEN DE PRÁCTICOS CON SUS RAs")
print("="*80)

# Query summary
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
    SELECT p.id, p.title, p.ra_codes
    FROM practicals p
    WHERE p.proposal_id = 9
    ORDER BY p.id
""")

practicals = cursor.fetchall()
for idx, practical in enumerate(practicals, 1):
    title = practical[1]
    ra_codes_str = practical[2]
    
    try:
        ra_codes = json.loads(ra_codes_str)
        print(f"\nTP{idx}: {title} → {ra_codes}")
    except:
        print(f"\nTP{idx}: {title} → {ra_codes_str}")

conn.close()
