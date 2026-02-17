"""Verificar exactamente qué se almacenó en BD"""
import sqlite3
import json

db_path = r"data/proposals.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, title, practicals FROM proposals WHERE id = 9")
result = cursor.fetchone()

if result:
    prop_id, title, practicals_json = result
    
    print("="*80)
    print("CONTENIDO DE practicals EN BD")
    print("="*80)
    print(f"\nID: {prop_id}")
    print(f"Título: {title}")
    print(f"\nTipo de practicals: {type(practicals_json)}")
    print(f"Longitud: {len(practicals_json) if practicals_json else 0}")
    print(f"\nPrimeros 500 caracteres:")
    print("-" * 80)
    print(practicals_json[:500] if practicals_json else "NULL")
    print("-" * 80)
    
    # Intentar decodificar
    if practicals_json:
        try:
            data = json.loads(practicals_json)
            print(f"\n✓ JSON válido")
            print(f"  Tipo: {type(data)}")
            
            if isinstance(data, list):
                print(f"  Cantidad de items: {len(data)}")
                if len(data) > 0:
                    print(f"  Primer item: {json.dumps(data[0], indent=2)[:300]}")
            elif isinstance(data, dict):
                print(f"  Claves: {list(data.keys())}")
                print(f"  Contenido: {json.dumps(data, indent=2)[:300]}")
        except json.JSONDecodeError as e:
            print(f"\n❌ Error JSON: {e}")

conn.close()
