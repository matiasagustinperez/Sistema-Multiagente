import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/proposals.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    ensure_proposals_columns()
    ensure_teachers_columns()


def ensure_proposals_columns():
    """Add missing columns to proposals table (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(proposals)"))
        columns = {row[1] for row in result}
        if "status" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN status VARCHAR(50)"))
            conn.commit()
        if "teaching_team" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN teaching_team JSON"))
            conn.commit()


def ensure_teachers_columns():
    """Add missing columns to teachers table (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(teachers)"))
        columns = {row[1] for row in result}
        if "dedication" not in columns:
            conn.execute(text("ALTER TABLE teachers ADD COLUMN dedication VARCHAR(50)"))
            conn.commit()

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
