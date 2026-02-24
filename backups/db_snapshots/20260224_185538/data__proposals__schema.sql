-- schema dump from c:\TesisMCD\backend\data\proposals.db

-- index: ix_accreditation_evidence_audit_log_action
CREATE INDEX ix_accreditation_evidence_audit_log_action ON accreditation_evidence_audit_log (action);

-- index: ix_accreditation_evidence_audit_log_created_at
CREATE INDEX ix_accreditation_evidence_audit_log_created_at ON accreditation_evidence_audit_log (created_at);

-- index: ix_accreditation_evidence_audit_log_evidence_id
CREATE INDEX ix_accreditation_evidence_audit_log_evidence_id ON accreditation_evidence_audit_log (evidence_id);

-- index: ix_accreditation_evidence_audit_log_id
CREATE INDEX ix_accreditation_evidence_audit_log_id ON accreditation_evidence_audit_log (id);

-- index: ix_accreditation_evidence_registry_career
CREATE INDEX ix_accreditation_evidence_registry_career ON accreditation_evidence_registry (career);

-- index: ix_accreditation_evidence_registry_checksum_sha256
CREATE INDEX ix_accreditation_evidence_registry_checksum_sha256 ON accreditation_evidence_registry (checksum_sha256);

-- index: ix_accreditation_evidence_registry_created_at
CREATE INDEX ix_accreditation_evidence_registry_created_at ON accreditation_evidence_registry (created_at);

-- index: ix_accreditation_evidence_registry_destination_file_id
CREATE INDEX ix_accreditation_evidence_registry_destination_file_id ON accreditation_evidence_registry (destination_file_id);

-- index: ix_accreditation_evidence_registry_evidence_type
CREATE INDEX ix_accreditation_evidence_registry_evidence_type ON accreditation_evidence_registry (evidence_type);

-- index: ix_accreditation_evidence_registry_id
CREATE INDEX ix_accreditation_evidence_registry_id ON accreditation_evidence_registry (id);

-- index: ix_accreditation_evidence_registry_source_file_id
CREATE INDEX ix_accreditation_evidence_registry_source_file_id ON accreditation_evidence_registry (source_file_id);

-- index: ix_accreditation_evidence_registry_source_kind
CREATE INDEX ix_accreditation_evidence_registry_source_kind ON accreditation_evidence_registry (source_kind);

-- index: ix_accreditation_evidence_registry_status
CREATE INDEX ix_accreditation_evidence_registry_status ON accreditation_evidence_registry (status);

-- index: ix_accreditation_evidence_versions_created_at
CREATE INDEX ix_accreditation_evidence_versions_created_at ON accreditation_evidence_versions (created_at);

-- index: ix_accreditation_evidence_versions_evidence_id
CREATE INDEX ix_accreditation_evidence_versions_evidence_id ON accreditation_evidence_versions (evidence_id);

-- index: ix_accreditation_evidence_versions_id
CREATE INDEX ix_accreditation_evidence_versions_id ON accreditation_evidence_versions (id);

-- index: ix_accreditation_settings_career
CREATE INDEX ix_accreditation_settings_career ON accreditation_settings (career);

-- index: ix_accreditation_settings_created_at
CREATE INDEX ix_accreditation_settings_created_at ON accreditation_settings (created_at);

-- index: ix_accreditation_settings_id
CREATE INDEX ix_accreditation_settings_id ON accreditation_settings (id);

-- index: ix_accreditation_work_plan_activities_activity_number
CREATE INDEX ix_accreditation_work_plan_activities_activity_number ON accreditation_work_plan_activities (activity_number);

-- index: ix_accreditation_work_plan_activities_activity_order
CREATE INDEX ix_accreditation_work_plan_activities_activity_order ON accreditation_work_plan_activities (activity_order);

-- index: ix_accreditation_work_plan_activities_career
CREATE INDEX ix_accreditation_work_plan_activities_career ON accreditation_work_plan_activities (career);

-- index: ix_accreditation_work_plan_activities_created_at
CREATE INDEX ix_accreditation_work_plan_activities_created_at ON accreditation_work_plan_activities (created_at);

-- index: ix_accreditation_work_plan_activities_id
CREATE INDEX ix_accreditation_work_plan_activities_id ON accreditation_work_plan_activities (id);

-- index: ix_accreditation_work_plan_activities_stage
CREATE INDEX ix_accreditation_work_plan_activities_stage ON accreditation_work_plan_activities (stage);

-- index: ix_accreditation_work_plan_activities_stage_order
CREATE INDEX ix_accreditation_work_plan_activities_stage_order ON accreditation_work_plan_activities (stage_order);

-- index: ix_accreditation_work_plan_activities_status
CREATE INDEX ix_accreditation_work_plan_activities_status ON accreditation_work_plan_activities (status);

-- index: ix_accreditation_work_plan_activities_sub_stage
CREATE INDEX ix_accreditation_work_plan_activities_sub_stage ON accreditation_work_plan_activities (sub_stage);

-- index: ix_accreditation_work_plan_activities_sub_stage_order
CREATE INDEX ix_accreditation_work_plan_activities_sub_stage_order ON accreditation_work_plan_activities (sub_stage_order);

-- index: ix_accreditation_work_plan_tasks_activity_id
CREATE INDEX ix_accreditation_work_plan_tasks_activity_id ON accreditation_work_plan_tasks (activity_id);

-- index: ix_accreditation_work_plan_tasks_created_at
CREATE INDEX ix_accreditation_work_plan_tasks_created_at ON accreditation_work_plan_tasks (created_at);

-- index: ix_accreditation_work_plan_tasks_id
CREATE INDEX ix_accreditation_work_plan_tasks_id ON accreditation_work_plan_tasks (id);

-- index: ix_accreditation_work_plan_tasks_status
CREATE INDEX ix_accreditation_work_plan_tasks_status ON accreditation_work_plan_tasks (status);

-- index: ix_competency_catalog_career
CREATE INDEX ix_competency_catalog_career ON competency_catalog (career);

-- index: ix_competency_catalog_code
CREATE INDEX ix_competency_catalog_code ON competency_catalog (code);

-- index: ix_competency_catalog_competency_type
CREATE INDEX ix_competency_catalog_competency_type ON competency_catalog (competency_type);

-- index: ix_competency_catalog_id
CREATE INDEX ix_competency_catalog_id ON competency_catalog (id);

-- index: ix_competency_catalog_plan_name
CREATE INDEX ix_competency_catalog_plan_name ON competency_catalog (plan_name);

-- index: ix_draft_proposals_id
CREATE INDEX ix_draft_proposals_id ON draft_proposals (id);

-- index: ix_drive_settings_career
CREATE INDEX ix_drive_settings_career ON drive_settings (career);

-- index: ix_drive_settings_id
CREATE INDEX ix_drive_settings_id ON drive_settings (id);

-- index: ix_drive_settings_plan_name
CREATE INDEX ix_drive_settings_plan_name ON drive_settings (plan_name);

-- index: ix_intelligent_control_settings_id
CREATE INDEX ix_intelligent_control_settings_id ON intelligent_control_settings (id);

-- index: ix_intelligent_controls_id
CREATE INDEX ix_intelligent_controls_id ON intelligent_controls (id);

-- index: ix_intelligent_controls_topic
CREATE INDEX ix_intelligent_controls_topic ON intelligent_controls (topic);

-- index: ix_proposal_competencies_competency_type
CREATE INDEX ix_proposal_competencies_competency_type ON proposal_competencies (competency_type);

-- index: ix_proposal_competencies_id
CREATE INDEX ix_proposal_competencies_id ON proposal_competencies (id);

-- index: ix_proposal_competencies_proposal_id
CREATE INDEX ix_proposal_competencies_proposal_id ON proposal_competencies (proposal_id);

-- index: ix_proposal_intelligent_control_results_checked_at
CREATE INDEX ix_proposal_intelligent_control_results_checked_at ON proposal_intelligent_control_results (checked_at);

-- index: ix_proposal_intelligent_control_results_control_id
CREATE INDEX ix_proposal_intelligent_control_results_control_id ON proposal_intelligent_control_results (control_id);

-- index: ix_proposal_intelligent_control_results_id
CREATE INDEX ix_proposal_intelligent_control_results_id ON proposal_intelligent_control_results (id);

-- index: ix_proposal_intelligent_control_results_proposal_id
CREATE INDEX ix_proposal_intelligent_control_results_proposal_id ON proposal_intelligent_control_results (proposal_id);

-- index: ix_proposal_teachers_id
CREATE INDEX ix_proposal_teachers_id ON proposal_teachers (id);

-- index: ix_proposal_teachers_proposal_id
CREATE INDEX ix_proposal_teachers_proposal_id ON proposal_teachers (proposal_id);

-- index: ix_proposal_teachers_teacher_id
CREATE INDEX ix_proposal_teachers_teacher_id ON proposal_teachers (teacher_id);

-- index: ix_proposals_id
CREATE INDEX ix_proposals_id ON proposals (id);

-- index: ix_study_plans_career
CREATE INDEX ix_study_plans_career ON study_plans (career);

-- index: ix_study_plans_id
CREATE INDEX ix_study_plans_id ON study_plans (id);

-- index: ix_study_plans_name
CREATE INDEX ix_study_plans_name ON study_plans (name);

-- index: ix_study_subject_prerequisites_id
CREATE INDEX ix_study_subject_prerequisites_id ON study_subject_prerequisites (id);

-- index: ix_study_subject_prerequisites_prerequisite_id
CREATE INDEX ix_study_subject_prerequisites_prerequisite_id ON study_subject_prerequisites (prerequisite_id);

-- index: ix_study_subject_prerequisites_subject_id
CREATE INDEX ix_study_subject_prerequisites_subject_id ON study_subject_prerequisites (subject_id);

-- index: ix_study_subjects_id
CREATE INDEX ix_study_subjects_id ON study_subjects (id);

-- index: ix_study_subjects_name
CREATE INDEX ix_study_subjects_name ON study_subjects (name);

-- index: ix_study_subjects_term_id
CREATE INDEX ix_study_subjects_term_id ON study_subjects (term_id);

-- index: ix_study_terms_id
CREATE INDEX ix_study_terms_id ON study_terms (id);

-- index: ix_study_terms_year_id
CREATE INDEX ix_study_terms_year_id ON study_terms (year_id);

-- index: ix_study_years_id
CREATE INDEX ix_study_years_id ON study_years (id);

-- index: ix_study_years_plan_id
CREATE INDEX ix_study_years_plan_id ON study_years (plan_id);

-- index: ix_teacher_careers_career
CREATE INDEX ix_teacher_careers_career ON teacher_careers (career);

-- index: ix_teacher_careers_id
CREATE INDEX ix_teacher_careers_id ON teacher_careers (id);

-- index: ix_teacher_careers_teacher_id
CREATE INDEX ix_teacher_careers_teacher_id ON teacher_careers (teacher_id);

-- index: ix_teacher_proposal_id
CREATE INDEX ix_teacher_proposal_id ON teacher_proposal (id);

-- index: ix_teachers_email
CREATE UNIQUE INDEX ix_teachers_email ON teachers (email);

-- index: ix_teachers_id
CREATE INDEX ix_teachers_id ON teachers (id);

-- table: accreditation_evidence_audit_log
CREATE TABLE accreditation_evidence_audit_log (
	id INTEGER NOT NULL, 
	evidence_id INTEGER NOT NULL, 
	action VARCHAR(50) NOT NULL, 
	changed_fields JSON, 
	note TEXT, 
	actor VARCHAR(255), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(evidence_id) REFERENCES accreditation_evidence_registry (id)
);

-- table: accreditation_evidence_registry
CREATE TABLE accreditation_evidence_registry (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	title VARCHAR(500), 
	evidence_type VARCHAR(50), 
	source_kind VARCHAR(50) NOT NULL, 
	source_reference VARCHAR(1500), 
	source_file_id VARCHAR(255), 
	source_filename VARCHAR(500), 
	normalized_filename VARCHAR(500), 
	destination_folder_url VARCHAR(1500), 
	destination_file_url VARCHAR(1500), 
	destination_file_id VARCHAR(255), 
	checksum_sha256 VARCHAR(64), 
	version_number INTEGER NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	ocr_applied BOOLEAN NOT NULL, 
	access_error TEXT, 
	metadata JSON, 
	created_by VARCHAR(255), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

-- table: accreditation_evidence_versions
CREATE TABLE accreditation_evidence_versions (
	id INTEGER NOT NULL, 
	evidence_id INTEGER NOT NULL, 
	version_number INTEGER NOT NULL, 
	source_reference VARCHAR(1500), 
	source_file_id VARCHAR(255), 
	source_filename VARCHAR(500), 
	destination_file_url VARCHAR(1500), 
	destination_file_id VARCHAR(255), 
	checksum_sha256 VARCHAR(64), 
	status VARCHAR(50) NOT NULL, 
	note TEXT, 
	created_by VARCHAR(255), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(evidence_id) REFERENCES accreditation_evidence_registry (id)
);

-- table: accreditation_settings
CREATE TABLE accreditation_settings (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	source_folder_url VARCHAR(1500), 
	destination_folder_url VARCHAR(1500), 
	process_mode VARCHAR(20) NOT NULL, 
	recursive_scan BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, evidence_types JSON, actor_roles JSON, actors JSON, study_plan VARCHAR(255), 
	PRIMARY KEY (id)
);

-- table: accreditation_work_plan_activities
CREATE TABLE accreditation_work_plan_activities (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	stage VARCHAR(255) NOT NULL, 
	stage_order INTEGER NOT NULL, 
	sub_stage VARCHAR(255) NOT NULL, 
	sub_stage_order INTEGER NOT NULL, 
	activity VARCHAR(500) NOT NULL, 
	activity_order INTEGER NOT NULL, 
	activity_number VARCHAR(30) NOT NULL, 
	responsible_actor VARCHAR(255), 
	collaborators JSON, 
	start_date DATETIME NOT NULL, 
	deadline DATETIME NOT NULL, 
	end_date DATETIME, 
	status VARCHAR(30) NOT NULL, 
	deadline_history JSON, 
	observations TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, study_plan VARCHAR(255), 
	PRIMARY KEY (id)
);

-- table: accreditation_work_plan_tasks
CREATE TABLE accreditation_work_plan_tasks (
	id INTEGER NOT NULL, 
	activity_id INTEGER NOT NULL, 
	name VARCHAR(500) NOT NULL, 
	status VARCHAR(30) NOT NULL, 
	status_date DATETIME NOT NULL, 
	notes TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(activity_id) REFERENCES accreditation_work_plan_activities (id)
);

-- table: competency_catalog
CREATE TABLE competency_catalog (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	plan_name VARCHAR(255), 
	competency_type VARCHAR(20) NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	description TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

-- table: draft_proposals
CREATE TABLE draft_proposals (
	id INTEGER NOT NULL, 
	career VARCHAR, 
	subject VARCHAR, 
	form_data TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

-- table: drive_settings
CREATE TABLE drive_settings (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	plan_name VARCHAR(255), 
	root_folder_url VARCHAR(1000), 
	pdf_folder_url VARCHAR(1000), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

-- table: intelligent_control_settings
CREATE TABLE intelligent_control_settings (
	id INTEGER NOT NULL, 
	director_last_mode VARCHAR(20) NOT NULL, 
	docente_mode VARCHAR(20) NOT NULL, 
	updated_at DATETIME, guepardo_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini', guepardo_temperature FLOAT NOT NULL DEFAULT 0.15, guepardo_max_tokens INTEGER NOT NULL DEFAULT 420, delfin_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini', delfin_temperature FLOAT NOT NULL DEFAULT 0.1, delfin_max_tokens INTEGER NOT NULL DEFAULT 500, ballena_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o', ballena_temperature FLOAT NOT NULL DEFAULT 0.1, ballena_max_tokens INTEGER NOT NULL DEFAULT 700, 
	PRIMARY KEY (id)
);

-- table: intelligent_controls
CREATE TABLE intelligent_controls (
	id INTEGER NOT NULL, 
	topic VARCHAR(100) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	instruction TEXT NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	sort_order INTEGER, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, associated_topics JSON, 
	PRIMARY KEY (id)
);

-- table: proposal_competencies
CREATE TABLE proposal_competencies (
	id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	competency_type VARCHAR(20) NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	description TEXT NOT NULL, 
	level INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id)
);

-- table: proposal_intelligent_control_results
CREATE TABLE proposal_intelligent_control_results (
	id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	control_id INTEGER NOT NULL, 
	passed BOOLEAN NOT NULL, 
	what_failed TEXT, 
	why_failed TEXT, 
	suggestion TEXT, 
	summary TEXT, 
	raw_response JSON, 
	checked_at DATETIME DEFAULT CURRENT_TIMESTAMP, proposed_text TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id), 
	FOREIGN KEY(control_id) REFERENCES intelligent_controls (id)
);

-- table: proposal_teachers
CREATE TABLE proposal_teachers (
	id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id)
);

-- table: proposals
CREATE TABLE proposals (
	id INTEGER NOT NULL, 
	filename VARCHAR NOT NULL, 
	original_filename VARCHAR NOT NULL, 
	uploader VARCHAR, 
	career VARCHAR, 
	subject VARCHAR, 
	study_plan VARCHAR, 
	quarter VARCHAR, 
	academic_year VARCHAR, 
	year_of_career VARCHAR, 
	term VARCHAR, 
	status VARCHAR, 
	notes TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, teaching_team JSON, study_subject_id INTEGER, gdoc_url VARCHAR(1000), title VARCHAR(500), character TEXT, regime TEXT, theoretical_hours INTEGER, practical_hours INTEGER, total_hours INTEGER, weekly_hours INTEGER, minimum_content TEXT, generic_competencies TEXT, specific_competencies TEXT, fundamentals_part1 TEXT, fundamentals_part2 TEXT, learning_outcomes TEXT, units TEXT, practicals TEXT, methodology TEXT, evaluation TEXT, bibliography TEXT, observations TEXT, source_type TEXT, updated_at DATETIME, gdoc_hash VARCHAR(64), gdoc_last_checked DATETIME, gdoc_last_synced DATETIME, gdoc_status VARCHAR(20), intelligent_status VARCHAR(30), 
	PRIMARY KEY (id)
);

-- table: study_plans
CREATE TABLE study_plans (
	id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	is_active BOOLEAN, 
	payload JSON, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

-- table: study_subject_prerequisites
CREATE TABLE study_subject_prerequisites (
	id INTEGER NOT NULL, 
	subject_id INTEGER NOT NULL, 
	prerequisite_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(subject_id) REFERENCES study_subjects (id), 
	FOREIGN KEY(prerequisite_id) REFERENCES study_subjects (id)
);

-- table: study_subjects
CREATE TABLE study_subjects (
	id INTEGER NOT NULL, 
	term_id INTEGER NOT NULL, 
	code VARCHAR(50), 
	name VARCHAR(255) NOT NULL, 
	character VARCHAR(50), 
	regime VARCHAR(50), 
	theoretical_hours INTEGER, 
	practical_hours INTEGER, 
	total_hours INTEGER, 
	weekly_hours INTEGER, 
	practice_scope TEXT, 
	minimum_content TEXT, 
	generic_competencies TEXT, 
	specific_competencies TEXT, 
	blocks JSON, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(term_id) REFERENCES study_terms (id)
);

-- table: study_terms
CREATE TABLE study_terms (
	id INTEGER NOT NULL, 
	year_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	sort_order INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(year_id) REFERENCES study_years (id)
);

-- table: study_years
CREATE TABLE study_years (
	id INTEGER NOT NULL, 
	plan_id INTEGER NOT NULL, 
	year_number INTEGER NOT NULL, 
	label VARCHAR(50), 
	sort_order INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(plan_id) REFERENCES study_plans (id)
);

-- table: teacher_careers
CREATE TABLE teacher_careers (
	id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id)
);

-- table: teacher_proposal
CREATE TABLE teacher_proposal (
	id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id)
);

-- table: teachers
CREATE TABLE teachers (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	category VARCHAR, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, dedication VARCHAR(50), normalized_key TEXT, updated_at DATETIME, 
	PRIMARY KEY (id)
);

