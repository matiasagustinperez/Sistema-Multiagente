from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    career = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    study_plan = Column(String(255), nullable=True)
    academic_year = Column(String(50), nullable=True)
    year_of_career = Column(String(50), nullable=True)
    quarter = Column(String(50), nullable=True)
    character = Column(String(50), nullable=True)  # Obligatoria/Optativa
    regime = Column(String(50), nullable=True)  # Cuatrimestral/Anual
    theoretical_hours = Column(Integer, nullable=True)
    practical_hours = Column(Integer, nullable=True)
    total_hours = Column(Integer, nullable=True)
    weekly_hours = Column(Integer, nullable=True)
    
    # Content sections
    minimum_content = Column(Text, nullable=True)
    generic_competencies = Column(Text, nullable=True)
    specific_competencies = Column(Text, nullable=True)
    fundamentals_part1 = Column(Text, nullable=True)  # Importancia
    fundamentals_part2 = Column(Text, nullable=True)  # Perfil Profesional
    
    # Dynamic sections (stored as JSON)
    learning_outcomes = Column(JSON, nullable=True)  # List of RA
    units = Column(JSON, nullable=True)  # List of Units
    practicals = Column(JSON, nullable=True)  # List of Practicals
    
    # Other sections
    methodology = Column(Text, nullable=True)
    evaluation = Column(Text, nullable=True)
    bibliography = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    
    # File metadata
    original_filename = Column(String(500), nullable=True)
    source_type = Column(String(50), nullable=True)  # docx, pdf, manual
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Proposal(id={self.id}, title={self.title}, career={self.career})>"
