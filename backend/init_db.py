#!/usr/bin/env python
"""Initialize the database"""
import os
import sys

# Ensure the backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import app first to trigger model registration
from app import models
from app.database import init_db, Base, engine

if __name__ == "__main__":
    print("Initializing database...")
    
    # Make sure all models are registered with Base
    from app.models import *  # noqa: F401, F403
    
    # Drop all existing tables and recreate from scratch
    print("  - Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("  - Creating new tables from models...")
    Base.metadata.create_all(bind=engine)
    
    print("  - Ensuring all columns exist...")
    # Now ensure all columns
    init_db()
    
    print("✓ Database initialized successfully!")
