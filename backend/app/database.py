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
    ensure_drive_settings_columns()
    ensure_intelligent_controls_columns()
    ensure_intelligent_settings_columns()


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
        if "gdoc_hash" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN gdoc_hash VARCHAR(64)"))
            conn.commit()
        if "gdoc_last_checked" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN gdoc_last_checked DATETIME"))
            conn.commit()
        if "gdoc_last_synced" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN gdoc_last_synced DATETIME"))
            conn.commit()
        if "gdoc_status" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN gdoc_status VARCHAR(20)"))
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


def ensure_drive_settings_columns():
    """Ensure drive_settings table has correct schema (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='drive_settings'"
        ))
        table_exists = result.fetchone() is not None
        
        if table_exists:
            # Check if columns have correct nullable settings
            result = conn.execute(text("PRAGMA table_info(drive_settings)"))
            columns = {row[1]: (row[3], row[4]) for row in result}  # name: (notnull, default)
            
            # If root_folder_url or pdf_folder_url are NOT NULL, drop and recreate
            needs_recreation = False
            if "root_folder_url" in columns and columns["root_folder_url"][0]:  # 1 means NOT NULL
                needs_recreation = True
            if "pdf_folder_url" in columns and columns["pdf_folder_url"][0]:
                needs_recreation = True
            
            if needs_recreation:
                # Drop and recreate table
                conn.execute(text("DROP TABLE IF EXISTS drive_settings"))
                conn.commit()
                table_exists = False
        
        if not table_exists:
            # Create table with correct schema
            conn.execute(text("""
                CREATE TABLE drive_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    career VARCHAR(255) NOT NULL,
                    plan_name VARCHAR(255),
                    root_folder_url VARCHAR(1000),
                    pdf_folder_url VARCHAR(1000),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("CREATE INDEX idx_drive_settings_career ON drive_settings(career)"))
            conn.execute(text("CREATE INDEX idx_drive_settings_plan ON drive_settings(plan_name)"))
            conn.commit()


def ensure_intelligent_controls_columns():
    """Add missing intelligent control related columns (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(proposals)"))
        columns = {row[1] for row in result}
        if "intelligent_status" not in columns:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN intelligent_status VARCHAR(30)"))
            conn.commit()


def ensure_intelligent_settings_columns():
    """Ensure intelligent control settings table and columns (SQLite only)."""
    if "sqlite" not in DATABASE_URL:
        return
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='intelligent_control_settings'"
        ))
        table_exists = result.fetchone() is not None

        if not table_exists:
            conn.execute(text("""
                CREATE TABLE intelligent_control_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    director_last_mode VARCHAR(20) NOT NULL DEFAULT 'delfin',
                    docente_mode VARCHAR(20) NOT NULL DEFAULT 'guepardo',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("""
                INSERT INTO intelligent_control_settings (director_last_mode, docente_mode)
                VALUES ('delfin', 'guepardo')
            """))
            conn.commit()
            return

        columns_result = conn.execute(text("PRAGMA table_info(intelligent_control_settings)"))
        columns = {row[1] for row in columns_result}
        if "director_last_mode" not in columns:
            conn.execute(text("ALTER TABLE intelligent_control_settings ADD COLUMN director_last_mode VARCHAR(20) NOT NULL DEFAULT 'delfin'"))
            conn.commit()
        if "docente_mode" not in columns:
            conn.execute(text("ALTER TABLE intelligent_control_settings ADD COLUMN docente_mode VARCHAR(20) NOT NULL DEFAULT 'guepardo'"))
            conn.commit()

        count = conn.execute(text("SELECT COUNT(*) FROM intelligent_control_settings")).scalar() or 0
        if count == 0:
            conn.execute(text("""
                INSERT INTO intelligent_control_settings (director_last_mode, docente_mode)
                VALUES ('delfin', 'guepardo')
            """))
            conn.commit()

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
