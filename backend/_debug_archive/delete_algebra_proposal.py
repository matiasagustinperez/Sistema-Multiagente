"""Eliminar propuesta 9 y re-importarla"""
import sqlite3

db_path = r"data/proposals.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("="*80)
print("ELIMINANDO PROPUESTA 9")
print("="*80)

# Delete proposal 9
cursor.execute("DELETE FROM proposals WHERE id = 9")
conn.commit()

print("\n✓ Propuesta 9 eliminada")

# Verify
cursor.execute("SELECT COUNT(*) FROM proposals WHERE id = 9")
count = cursor.fetchone()[0]
print(f"  Propuestas con ID 9: {count}")

conn.close()

print("\n" + "="*80)
print("AHORA PUEDES RE-IMPORTAR EL ARCHIVO DE ÁLGEBRA")
print("="*80)
