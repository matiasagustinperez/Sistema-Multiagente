import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base
from app.models import Proposal

# Crear todas las tablas
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

print("Database tables created successfully")
