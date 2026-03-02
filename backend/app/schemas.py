from pydantic import BaseModel, Field
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
    ra_codes: Optional[List[str]] = []
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
    last_login: Optional[datetime] = None
    is_admin: Optional[bool] = False

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
    source_type: Optional[str] = None
    gdoc_url: Optional[str] = None
    gdoc_hash: Optional[str] = None
    gdoc_last_checked: Optional[datetime] = None
    gdoc_last_synced: Optional[datetime] = None
    gdoc_status: Optional[str] = None
    intelligent_status: Optional[str] = None
    editing_locked: Optional[bool] = False

class ProposalCreate(ProposalBase):
    create_in_drive: Optional[bool] = None

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
    source_type: Optional[str] = None
    gdoc_url: Optional[str] = None
    create_in_drive: Optional[bool] = None
    intelligent_status: Optional[str] = None
    editing_locked: Optional[bool] = None

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
    generic_competencies_items: Optional[List[CompetencyItem]] = []
    specific_competencies_items: Optional[List[CompetencyItem]] = []
    teaching_team: Optional[List[TeachingStaff]] = []
    methodology: Optional[str] = None
    evaluation: Optional[str] = None
    bibliography: Optional[str] = None
    observations: Optional[str] = None
    source_type: Optional[str] = None
    gdoc_url: Optional[str] = None
    gdoc_hash: Optional[str] = None
    gdoc_last_checked: Optional[datetime] = None
    gdoc_status: Optional[str] = None
    gdoc_last_synced: Optional[datetime] = None
    intelligent_status: Optional[str] = None
    status: Optional[str] = None
    editing_locked: Optional[bool] = False
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


class DriveSettingsBase(BaseModel):
    career: str
    plan_name: Optional[str] = None
    root_folder_url: Optional[str] = None
    pdf_folder_url: Optional[str] = None


class DriveSettingsCreate(DriveSettingsBase):
    pass


class DriveSettingsUpdate(BaseModel):
    root_folder_url: Optional[str] = None
    pdf_folder_url: Optional[str] = None


class DriveSettingsOut(DriveSettingsBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IntelligentControlBase(BaseModel):
    topic: str
    name: str
    instruction: str
    is_active: Optional[bool] = True
    sort_order: Optional[int] = None
    associated_topics: Optional[List[str]] = []


class IntelligentControlCreate(IntelligentControlBase):
    pass


class IntelligentControlUpdate(BaseModel):
    topic: Optional[str] = None
    name: Optional[str] = None
    instruction: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    associated_topics: Optional[List[str]] = None


class IntelligentControlOut(IntelligentControlBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IntelligentControlRunRequest(BaseModel):
    control_ids: Optional[List[int]] = None
    mode: Optional[str] = "delfin"


class IntelligentModeConfigUpdate(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class IntelligentModeConfigOut(BaseModel):
    model: str
    temperature: float
    max_tokens: int


class IntelligentControlSettingsUpdate(BaseModel):
    director_last_mode: Optional[str] = None
    docente_mode: Optional[str] = None
    guepardo: Optional[IntelligentModeConfigUpdate] = None
    delfin: Optional[IntelligentModeConfigUpdate] = None
    ballena: Optional[IntelligentModeConfigUpdate] = None


class IntelligentControlSettingsOut(BaseModel):
    director_last_mode: str
    docente_mode: str
    guepardo: IntelligentModeConfigOut
    delfin: IntelligentModeConfigOut
    ballena: IntelligentModeConfigOut
    available_models: List[str] = Field(default_factory=list)
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProposalIntelligentResultUpdate(BaseModel):
    what_failed: Optional[str] = None
    why_failed: Optional[str] = None
    suggestion: Optional[str] = None
    proposed_text: Optional[str] = None
    summary: Optional[str] = None


class ProposalIntelligentControlResultOut(BaseModel):
    id: int
    proposal_id: int
    control_id: int
    control_topic: str
    control_name: str
    passed: bool
    what_failed: Optional[str] = None
    why_failed: Optional[str] = None
    suggestion: Optional[str] = None
    proposed_text: Optional[str] = None
    summary: Optional[str] = None
    checked_at: Optional[datetime] = None


class ProposalIntelligentControlsSummary(BaseModel):
    proposal_id: int
    intelligent_status: str
    total_controls: int
    passed_controls: int
    failed_controls: int
    results: List[ProposalIntelligentControlResultOut] = []
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationEvidenceBase(BaseModel):
    career: str
    title: Optional[str] = None
    evidence_type: Optional[str] = None
    source_kind: str = "local"
    source_reference: Optional[str] = None
    source_file_id: Optional[str] = None
    source_filename: Optional[str] = None
    normalized_filename: Optional[str] = None
    destination_folder_url: Optional[str] = None
    destination_file_url: Optional[str] = None
    destination_file_id: Optional[str] = None
    checksum_sha256: Optional[str] = None
    status: str = "registered"
    ocr_applied: bool = False
    access_error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AccreditationEvidenceCreate(AccreditationEvidenceBase):
    created_by: Optional[str] = None
    version_note: Optional[str] = None


class AccreditationEvidenceUpdate(BaseModel):
    title: Optional[str] = None
    evidence_type: Optional[str] = None
    created_by: Optional[str] = None
    source_reference: Optional[str] = None
    source_filename: Optional[str] = None
    normalized_filename: Optional[str] = None
    destination_folder_url: Optional[str] = None
    destination_file_url: Optional[str] = None
    status: Optional[str] = None
    ocr_applied: Optional[bool] = None
    access_error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    note: Optional[str] = None
    actor: Optional[str] = None


class AccreditationEvidenceOut(AccreditationEvidenceBase):
    id: int
    version_number: int
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationEvidenceVersionOut(BaseModel):
    id: int
    evidence_id: int
    version_number: int
    source_reference: Optional[str] = None
    source_file_id: Optional[str] = None
    source_filename: Optional[str] = None
    destination_file_url: Optional[str] = None
    destination_file_id: Optional[str] = None
    checksum_sha256: Optional[str] = None
    status: str
    note: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationEvidenceAuditOut(BaseModel):
    id: int
    evidence_id: int
    action: str
    changed_fields: Optional[Dict[str, Any]] = None
    note: Optional[str] = None
    actor: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationSettingsBase(BaseModel):
    career: str
    study_plan: Optional[str] = None
    source_folder_url: Optional[str] = None
    destination_folder_url: Optional[str] = None
    process_mode: str = "move"
    recursive_scan: bool = True
    evidence_types: List[str] = Field(default_factory=list)
    actor_roles: List[str] = Field(default_factory=list)
    actors: List[Dict[str, Any]] = Field(default_factory=list)


class AccreditationSettingsCreate(AccreditationSettingsBase):
    pass


class AccreditationSettingsOut(AccreditationSettingsBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationIngestItem(BaseModel):
    source_kind: Optional[str] = None
    source_reference: str
    source_file_id: Optional[str] = None
    source_filename: Optional[str] = None
    title: Optional[str] = None
    evidence_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AccreditationIngestRequest(BaseModel):
    career: str
    study_plan: Optional[str] = None
    actor: Optional[str] = None
    version_note: Optional[str] = None
    items: List[AccreditationIngestItem] = Field(default_factory=list)


class AccreditationPreviewRequest(BaseModel):
    career: str
    study_plan: Optional[str] = None
    items: List[AccreditationIngestItem] = Field(default_factory=list)


class AccreditationPreviewResultItem(BaseModel):
    source_kind: str
    source_reference: str
    source_file_id: Optional[str] = None
    source_filename: Optional[str] = None
    normalized_filename: Optional[str] = None
    status: str
    access_error: Optional[str] = None
    extraction_method: Optional[str] = None
    extracted_char_count: Optional[int] = None
    ocr_applied: bool = False
    preview_lines: List[str] = Field(default_factory=list)


class AccreditationPreviewResult(BaseModel):
    processed: int
    skipped: int
    items: List[AccreditationPreviewResultItem] = Field(default_factory=list)


class AccreditationIngestResultItem(BaseModel):
    evidence_id: int
    version_number: int
    action: str
    source_kind: str
    source_reference: str
    source_file_id: Optional[str] = None
    normalized_filename: Optional[str] = None
    status: str
    access_error: Optional[str] = None
    extraction_method: Optional[str] = None
    extracted_char_count: Optional[int] = None
    ocr_applied: bool = False
    preview_lines: List[str] = Field(default_factory=list)


class AccreditationIngestResult(BaseModel):
    processed: int
    created: int
    versioned: int
    skipped: int
    items: List[AccreditationIngestResultItem] = Field(default_factory=list)


class AccreditationWorkPlanTaskBase(BaseModel):
    name: str
    status: str = "pending"
    status_date: datetime
    notes: Optional[str] = None


class AccreditationWorkPlanTaskCreate(AccreditationWorkPlanTaskBase):
    pass


class AccreditationWorkPlanTaskUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    status_date: Optional[datetime] = None
    notes: Optional[str] = None


class AccreditationWorkPlanTaskOut(AccreditationWorkPlanTaskBase):
    id: int
    activity_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccreditationWorkPlanActivityBase(BaseModel):
    career: str
    study_plan: Optional[str] = None
    stage: str
    stage_order: int
    sub_stage: str
    sub_stage_order: int
    activity: str
    activity_order: int
    responsible_actor: Optional[str] = None
    collaborators: List[str] = Field(default_factory=list)
    start_date: datetime
    deadline: datetime
    status: str = "pending"
    observations: Optional[str] = None


class AccreditationWorkPlanActivityCreate(AccreditationWorkPlanActivityBase):
    pass


class AccreditationWorkPlanActivityUpdate(BaseModel):
    stage: Optional[str] = None
    stage_order: Optional[int] = None
    sub_stage: Optional[str] = None
    sub_stage_order: Optional[int] = None
    activity: Optional[str] = None
    activity_order: Optional[int] = None
    responsible_actor: Optional[str] = None
    collaborators: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    observations: Optional[str] = None


class AccreditationDeadlineHistoryOut(BaseModel):
    changed_at: datetime
    previous_deadline: datetime
    new_deadline: datetime


class AccreditationWorkPlanActivityOut(BaseModel):
    id: int
    career: str
    study_plan: Optional[str] = None
    stage: str
    stage_order: int
    sub_stage: str
    sub_stage_order: int
    activity: str
    activity_order: int
    activity_number: str
    responsible_actor: Optional[str] = None
    collaborators: List[str] = Field(default_factory=list)
    start_date: datetime
    deadline: datetime
    end_date: Optional[datetime] = None
    status: str
    deadline_history: List[AccreditationDeadlineHistoryOut] = Field(default_factory=list)
    observations: Optional[str] = None
    tasks: List[AccreditationWorkPlanTaskOut] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Evaluative Instruments ──────────────────────────────────────────────────

class EvaluativeInstrumentOut(BaseModel):
    id: int
    career: str
    study_plan: Optional[str] = None
    subject: str
    instrument_type: str
    title: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    gdrive_url: Optional[str] = None
    gdrive_file_id: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvaluativeInstrumentFolderOut(BaseModel):
    id: int
    career: str
    study_plan: Optional[str] = None
    subject: str
    gdrive_folder_url: Optional[str] = None
    gdrive_folder_id: Optional[str] = None

    class Config:
        from_attributes = True


# ── Careers ──────────────────────────────────────────────────────────────────

class CareerBase(BaseModel):
    name: str
    is_active: bool = True


class CareerCreate(CareerBase):
    pass


class CareerUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    director_id: Optional[int] = None
    secretario_id: Optional[int] = None


class CareerOut(CareerBase):
    id: int
    created_at: Optional[datetime] = None
    director_id: Optional[int] = None
    secretario_id: Optional[int] = None
    director_name: Optional[str] = None
    secretario_name: Optional[str] = None

    class Config:
        from_attributes = True

