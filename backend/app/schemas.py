from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LearningOutcome(BaseModel):
    id: Optional[int] = None
    description: str
    observable_verb: str = ""
    
class Unit(BaseModel):
    id: Optional[int] = None
    name: str
    content: str = ""
    bibliography_basic: str = ""
    bibliography_complementary: str = ""

class Practical(BaseModel):
    id: Optional[int] = None
    name: str
    objective: str = ""
    activities: str = ""
    materials: str = ""
    scope: str = ""

class TeachingStaff(BaseModel):
    id: Optional[int] = None
    name: str
    category: str = ""
    email: str = ""

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
    
    methodology: Optional[str] = None
    evaluation: Optional[str] = None
    bibliography: Optional[str] = None
    observations: Optional[str] = None
    status: Optional[str] = None

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
    methodology: Optional[str] = None
    evaluation: Optional[str] = None
    bibliography: Optional[str] = None
    observations: Optional[str] = None
    status: Optional[str] = None

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
    academic_year: Optional[str] = None
    year_of_career: Optional[str] = None
    quarter: Optional[str] = None
    minimum_content: Optional[str] = None
    generic_competencies: Optional[str] = None
    specific_competencies: Optional[str] = None
    source_type: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
