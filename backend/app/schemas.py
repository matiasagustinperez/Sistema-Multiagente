from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LearningOutcome(BaseModel):
    id: Optional[int] = None
    description: Optional[str] = ""
    observable_verb: Optional[str] = ""
    
class Unit(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = ""
    content: Optional[str] = ""
    bibliography_basic: Optional[str] = ""
    bibliography_complementary: Optional[str] = ""

class Practical(BaseModel):
    id: Optional[int] = None
    number: Optional[str] = None
    name: Optional[str] = ""
    objective: Optional[str] = ""
    activities: Optional[str] = ""
    materials: Optional[str] = ""
    scope: Optional[str] = ""

class TeachingStaff(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = ""
    category: Optional[str] = ""
    email: Optional[str] = ""
    dedication: Optional[str] = ""


class TeacherBase(BaseModel):
    name: str
    category: Optional[str] = None
    email: Optional[str] = None
    dedication: Optional[str] = None


class TeacherCreate(TeacherBase):
    career: Optional[str] = None


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    dedication: Optional[str] = None


class TeacherOut(TeacherBase):
    id: int

    class Config:
        from_attributes = True


class CompetencyItem(BaseModel):
    id: Optional[int] = None
    code: Optional[str] = ""
    description: Optional[str] = ""
    level: Optional[int] = 0
    level_label: Optional[str] = None


class CompetencyCatalogBase(BaseModel):
    career: str
    plan_name: Optional[str] = None
    competency_type: str
    code: str
    description: str


class CompetencyCatalogCreate(CompetencyCatalogBase):
    pass


class CompetencyCatalogUpdate(BaseModel):
    career: Optional[str] = None
    plan_name: Optional[str] = None
    competency_type: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None


class CompetencyCatalogOut(CompetencyCatalogBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProposalBase(BaseModel):
    title: str
    career: Optional[str] = None
    subject: Optional[str] = None
    study_plan: Optional[str] = None
    academic_year: Optional[str] = None
    year_of_career: Optional[str] = None
    quarter: Optional[str] = None
    character: Optional[str] = None
    regime: Optional[str] = None
    theoretical_hours: Optional[int] = None
    practical_hours: Optional[int] = None
    total_hours: Optional[int] = None
    weekly_hours: Optional[int] = None
    
    minimum_content: Optional[str] = None
    generic_competencies: Optional[str] = None
    specific_competencies: Optional[str] = None
    fundamentals_part1: Optional[str] = None
    fundamentals_part2: Optional[str] = None
    
    learning_outcomes: Optional[List[LearningOutcome]] = []
    units: Optional[List[Unit]] = []
    practicals: Optional[List[Practical]] = []
    teaching_team: Optional[List[TeachingStaff]] = []
    generic_competencies_items: Optional[List[CompetencyItem]] = []
    specific_competencies_items: Optional[List[CompetencyItem]] = []
    
    methodology: Optional[str] = None
    evaluation: Optional[str] = None
    bibliography: Optional[str] = None
    observations: Optional[str] = None
    status: Optional[str] = None
    study_subject_id: Optional[int] = None

class ProposalCreate(ProposalBase):
    pass

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    career: Optional[str] = None
    subject: Optional[str] = None
    study_plan: Optional[str] = None
    academic_year: Optional[str] = None
    year_of_career: Optional[str] = None
    quarter: Optional[str] = None
    character: Optional[str] = None
    regime: Optional[str] = None
    theoretical_hours: Optional[int] = None
    practical_hours: Optional[int] = None
    total_hours: Optional[int] = None
    weekly_hours: Optional[int] = None

    minimum_content: Optional[str] = None
    generic_competencies: Optional[str] = None
    specific_competencies: Optional[str] = None
    fundamentals_part1: Optional[str] = None
    fundamentals_part2: Optional[str] = None
    learning_outcomes: Optional[List[LearningOutcome]] = None
    units: Optional[List[Unit]] = None
    practicals: Optional[List[Practical]] = None
    teaching_team: Optional[List[TeachingStaff]] = None
    generic_competencies_items: Optional[List[CompetencyItem]] = None
    specific_competencies_items: Optional[List[CompetencyItem]] = None
    methodology: Optional[str] = None
    evaluation: Optional[str] = None
    bibliography: Optional[str] = None
    observations: Optional[str] = None
    status: Optional[str] = None
    study_subject_id: Optional[int] = None

class Proposal(ProposalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProposalOut(BaseModel):
    id: int
    title: Optional[str] = None
    original_filename: Optional[str] = None
    career: Optional[str] = None
    subject: Optional[str] = None
    study_plan: Optional[str] = None
    academic_year: Optional[str] = None
    year_of_career: Optional[str] = None
    quarter: Optional[str] = None
    minimum_content: Optional[str] = None
    generic_competencies: Optional[str] = None
    specific_competencies: Optional[str] = None
    generic_competencies_items: Optional[List[CompetencyItem]] = []
    specific_competencies_items: Optional[List[CompetencyItem]] = []
    teaching_team: Optional[List[TeachingStaff]] = []
    source_type: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    study_subject_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class StudyPlanBase(BaseModel):
    career: str
    name: str
    is_active: Optional[bool] = None


class StudyPlanCreate(StudyPlanBase):
    pass


class StudyPlanOut(StudyPlanBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudyYearBase(BaseModel):
    year_number: int
    label: Optional[str] = None
    sort_order: Optional[int] = None


class StudyYearCreate(StudyYearBase):
    plan_id: int


class StudyTermBase(BaseModel):
    name: str
    sort_order: Optional[int] = None


class StudyTermCreate(StudyTermBase):
    year_id: int


class StudySubjectBase(BaseModel):
    code: Optional[str] = None
    name: str
    character: Optional[str] = None
    regime: Optional[str] = None
    theoretical_hours: Optional[int] = None
    practical_hours: Optional[int] = None
    total_hours: Optional[int] = None
    weekly_hours: Optional[int] = None
    practice_scope: Optional[str] = None
    minimum_content: Optional[str] = None
    generic_competencies: Optional[str] = None
    specific_competencies: Optional[str] = None
    blocks: Optional[List[str]] = []
    prerequisite_ids: Optional[List[int]] = []


class StudySubjectCreate(StudySubjectBase):
    term_id: int


class StudySubjectUpdate(StudySubjectBase):
    pass


class StudySubjectOut(StudySubjectBase):
    id: int
    term_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudyTermOut(StudyTermBase):
    id: int
    year_id: int
    subjects: List[StudySubjectOut] = []

    class Config:
        from_attributes = True


class StudyYearOut(StudyYearBase):
    id: int
    plan_id: int
    terms: List[StudyTermOut] = []

    class Config:
        from_attributes = True


class StudyPlanDetail(StudyPlanOut):
    years: List[StudyYearOut] = []


class StudyPlanStorageIn(BaseModel):
    id: Optional[int] = None
    career: str
    name: str
    is_active: Optional[bool] = None
    payload: Optional[Dict[str, Any]] = None


class StudyPlanStorageOut(StudyPlanStorageIn):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
