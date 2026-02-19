#!/usr/bin/env python
"""Debug DB schema"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine
from sqlalchemy import text, inspect

# Check if database file exists
db_path = "./data/proposals.db"
if os.path.exists(db_path):
    print(f"✓ Database file exists: {db_path}")
    print(f"  File size: {os.path.getsize(db_path)} bytes")
else:
    print(f"✗ Database file NOT found: {db_path}")

# Get inspector
inspector = inspect(engine)

# List all tables
tables = inspector.get_table_names()
print(f"\nTables in database: {tables}")

# Check proposals table
if 'proposals' in tables:
    print("\n✓ 'proposals' table exists")
    columns = inspector.get_columns('proposals')
    print("  Columns:")
    for col in columns:
        print(f"    - {col['name']}: {col['type']}")
else:
    print("\n✗ 'proposals' table NOT found!")
    
# Also check with raw SQL
with engine.connect() as conn:
    result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    print("\nRaw SQL tables:", [row[0] for row in result])
