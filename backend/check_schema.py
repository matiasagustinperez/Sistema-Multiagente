import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "proposals.db"
conn = sqlite3.connect(str(DB_PATH))
cursor = conn.cursor()

# Listar todas las tablas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]

print("Tablas en la BD:")
for table in tables:
    cursor.execute(f"PRAGMA table_info({table})")
    cols = cursor.fetchall()
    print(f"\n{table}:")
    for col in cols:
        print(f"  - {col[1]} ({col[2]})")

conn.close()
