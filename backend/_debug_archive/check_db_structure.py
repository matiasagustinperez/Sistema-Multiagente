"""Verificar qué tablas existen en la BD"""
import sqlite3

db_path = r"data/proposals.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Obtener lista de tablas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("="*80)
print("TABLAS EN LA BASE DE DATOS")
print("="*80)
print("\nTablas encontradas:")
for table in tables:
    print(f"  - {table[0]}")
    
    # Mostrar columnas
    cursor.execute(f"PRAGMA table_info({table[0]})")
    columns = cursor.fetchall()
    for col in columns:
        print(f"      • {col[1]} ({col[2]})")

conn.close()
