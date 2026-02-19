#!/usr/bin/env python
"""
Script para migrar la tabla 'teachers' al nuevo schema.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "proposals.db"

def migrate_teachers_table():
    """Migra la tabla teachers de esquema antiguo a nuevo."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Obtener columnas existentes
    cursor.execute("PRAGMA table_info(teachers)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    print(f"Columnas existentes en teachers: {sorted(existing_columns)}\n")
    
    print("PASO 1: Renombrando columnas...")
    
    # Renombrar nombre → name
    if 'nombre' in existing_columns and 'name' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE teachers RENAME COLUMN nombre TO name")
            existing_columns.remove('nombre')
            existing_columns.add('name')
            print("✓ Renombrado: nombre → name")
        except Exception as e:
            print(f"✗ Error al renombrar nombre: {e}")
    
    # Renombrar categoria → category
    if 'categoria' in existing_columns and 'category' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE teachers RENAME COLUMN categoria TO category")
            existing_columns.remove('categoria')
            existing_columns.add('category')
            print("✓ Renombrado: categoria → category")
        except Exception as e:
            print(f"✗ Error al renombrar categoria: {e}")
    
    print("\nPASO 2: Agregando columnas faltantes...")
    
    # Agregar normalized_key
    if 'normalized_key' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE teachers ADD COLUMN normalized_key TEXT")
            print("✓ Agregada columna: normalized_key")
            existing_columns.add('normalized_key')
            
            # Llenar normalized_key basado en name
            cursor.execute("""
                UPDATE teachers 
                SET normalized_key = LOWER(COALESCE(name, '')) 
                WHERE normalized_key IS NULL
            """)
            print("✓ Llenada columna normalized_key con nombres normalizados")
        except Exception as e:
            print(f"✗ Error al agregar normalized_key: {e}")
    
    # Agregar updated_at
    if 'updated_at' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE teachers ADD COLUMN updated_at DATETIME")
            print("✓ Agregada columna: updated_at")
            existing_columns.add('updated_at')
        except Exception as e:
            print(f"✗ Error al agregar updated_at: {e}")
    
    print("\nPASO 3: Verificando esquema final...")
    cursor.execute("PRAGMA table_info(teachers)")
    final_columns = {row[1] for row in cursor.fetchall()}
    print(f"Columnas finales: {sorted(final_columns)}")
    
    required_columns = {'id', 'name', 'normalized_key', 'email', 'category', 'dedication', 'created_at', 'updated_at'}
    if required_columns.issubset(final_columns):
        print(f"\n✓ ¡Todas las columnas requeridas están presentes!")
    else:
        missing = required_columns - final_columns
        print(f"\n⚠ Columnas aún faltantes: {missing}")
    
    conn.commit()
    conn.close()
    
    print("\n✓ Migración completada exitosamente")

if __name__ == "__main__":
    migrate_teachers_table()
