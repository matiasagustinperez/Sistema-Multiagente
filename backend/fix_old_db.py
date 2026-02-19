#!/usr/bin/env python
"""Agregar columnas faltantes a la BD antigua"""
import sqlite3
import os

db_path = './data/proposals.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    # Check actual columns
    cur.execute("PRAGMA table_info(proposals)")
    existing_cols = {row[1] for row in cur.fetchall()}
    print(f"Columnas existentes: {existing_cols}")
    
    # Agregar columnas faltantes
    if 'title' not in existing_cols:
        cur.execute('ALTER TABLE proposals ADD COLUMN title VARCHAR(500)')
        cur.execute('UPDATE proposals SET title = COALESCE(subject, "Sin titulo")')
        print("✓ Columna 'title' agregada")
    
    if 'gdoc_url' not in existing_cols:
        cur.execute('ALTER TABLE proposals ADD COLUMN gdoc_url VARCHAR(1000)')
        print("✓ Columna 'gdoc_url' agregada")
    
    if 'status' not in existing_cols:
        cur.execute('ALTER TABLE proposals ADD COLUMN status VARCHAR(50)')
        cur.execute('UPDATE proposals SET status = "EnProceso"')
        print("✓ Columna 'status' agregada")
    
    conn.commit()
    print("\n✓ BD actualizada correctamente")
    
except sqlite3.OperationalError as e:
    if 'already exists' in str(e):
        print(f"⚠ Columna ya existe: {e}")
    else:
        print(f"✗ Error: {e}")
finally:
    conn.close()
