from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    teaching_team = Column(JSON, nullable=True)  # List of docentes
    
    # Other sections
    methodology = Column(Text, nullable=True)
    evaluation = Column(Text, nullable=True)
    bibliography = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    
    # File metadata
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=True)
    source_type = Column(String(50), nullable=True)  # docx, pdf, manual
    status = Column(String(50), nullable=True)  # EnProceso, Importada, Creada
    
    study_subject_id = Column(Integer, ForeignKey("study_subjects.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    competencies = relationship(
        "ProposalCompetency",
        back_populates="proposal",
        cascade="all, delete-orphan",
    )

    teachers = relationship(
        "ProposalTeacher",
        back_populates="proposal",
        cascade="all, delete-orphan",
    )

    study_subject = relationship("StudySubject", back_populates="proposals")
    
    def __repr__(self):
        return f"<Proposal(id={self.id}, title={self.title}, career={self.career})>"


class CompetencyCatalog(Base):
    __tablename__ = "competency_catalog"

    id = Column(Integer, primary_key=True, index=True)
    career = Column(String(255), nullable=False, index=True)
    plan_name = Column(String(255), nullable=True, index=True)
    competency_type = Column(String(20), nullable=False, index=True)  # generic | specific
    code = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ProposalCompetency(Base):
    __tablename__ = "proposal_competencies"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False, index=True)
    competency_type = Column(String(20), nullable=False, index=True)  # generic | specific
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    level = Column(Integer, nullable=False, default=0)

    proposal = relationship("Proposal", back_populates="competencies")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    normalized_key = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    category = Column(String(50), nullable=True)
    dedication = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    proposals = relationship(
        "ProposalTeacher",
        back_populates="teacher",
        cascade="all, delete-orphan",
    )

    careers = relationship(
        "TeacherCareer",
        back_populates="teacher",
        cascade="all, delete-orphan",
    )


class TeacherCareer(Base):
    __tablename__ = "teacher_careers"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, index=True)
    career = Column(String(255), nullable=False, index=True)

    teacher = relationship("Teacher", back_populates="careers")


class ProposalTeacher(Base):
    __tablename__ = "proposal_teachers"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, index=True)

    proposal = relationship("Proposal", back_populates="teachers")
    teacher = relationship("Teacher", back_populates="proposals")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    career = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    is_active = Column(Boolean, nullable=True, default=False)
    payload = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    years = relationship(
        "StudyYear",
        back_populates="plan",
        cascade="all, delete-orphan",
    )


class StudyYear(Base):
    __tablename__ = "study_years"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False, index=True)
    year_number = Column(Integer, nullable=False)
    label = Column(String(50), nullable=True)
    sort_order = Column(Integer, nullable=True)

    plan = relationship("StudyPlan", back_populates="years")
    terms = relationship(
        "StudyTerm",
        back_populates="year",
        cascade="all, delete-orphan",
    )


class StudyTerm(Base):
    __tablename__ = "study_terms"

    id = Column(Integer, primary_key=True, index=True)
    year_id = Column(Integer, ForeignKey("study_years.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    sort_order = Column(Integer, nullable=True)

    year = relationship("StudyYear", back_populates="terms")
    subjects = relationship(
        "StudySubject",
        back_populates="term",
        cascade="all, delete-orphan",
    )


class StudySubject(Base):
    __tablename__ = "study_subjects"

    id = Column(Integer, primary_key=True, index=True)
    term_id = Column(Integer, ForeignKey("study_terms.id"), nullable=False, index=True)
    code = Column(String(50), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    character = Column(String(50), nullable=True)
    regime = Column(String(50), nullable=True)
    theoretical_hours = Column(Integer, nullable=True)
    practical_hours = Column(Integer, nullable=True)
    total_hours = Column(Integer, nullable=True)
    weekly_hours = Column(Integer, nullable=True)
    practice_scope = Column(Text, nullable=True)
    minimum_content = Column(Text, nullable=True)
    generic_competencies = Column(Text, nullable=True)
    specific_competencies = Column(Text, nullable=True)
    blocks = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    term = relationship("StudyTerm", back_populates="subjects")
    proposals = relationship("Proposal", back_populates="study_subject")
    prerequisites = relationship(
        "StudySubjectPrerequisite",
        foreign_keys="StudySubjectPrerequisite.subject_id",
        cascade="all, delete-orphan",
    )
    required_for = relationship(
        "StudySubjectPrerequisite",
        foreign_keys="StudySubjectPrerequisite.prerequisite_id",
        cascade="all, delete-orphan",
    )


class StudySubjectPrerequisite(Base):
    __tablename__ = "study_subject_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("study_subjects.id"), nullable=False, index=True)
    prerequisite_id = Column(Integer, ForeignKey("study_subjects.id"), nullable=False, index=True)


class DriveSettings(Base):
    __tablename__ = "drive_settings"

    id = Column(Integer, primary_key=True, index=True)
    career = Column(String(255), nullable=False, index=True)
    plan_name = Column(String(255), nullable=True, index=True)
    root_folder_url = Column(String(1000), nullable=True)
    pdf_folder_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
