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
    ensure_study_plans_columns()
    ensure_competencies_columns()


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
        if "study_subject_id" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN study_subject_id INTEGER"))
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


def ensure_study_plans_columns():
    """Add missing columns to study_plans table (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(study_plans)"))
        columns = {row[1] for row in result}
        if "is_active" not in columns:
            conn.execute(text("ALTER TABLE study_plans ADD COLUMN is_active BOOLEAN DEFAULT 0"))
            conn.commit()
        if "payload" not in columns:
            conn.execute(text("ALTER TABLE study_plans ADD COLUMN payload JSON"))
            conn.commit()


def ensure_competencies_columns():
    """Add missing columns to competency_catalog table (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(competency_catalog)"))
        columns = {row[1] for row in result}
        if "plan_name" not in columns:
            conn.execute(text("ALTER TABLE competency_catalog ADD COLUMN plan_name VARCHAR(255)"))
            conn.commit()

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
