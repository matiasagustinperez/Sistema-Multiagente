-- schema dump from c:\TesisMCD\backups\proposals.db

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

-- index: ix_proposal_competencies_competency_type
CREATE INDEX ix_proposal_competencies_competency_type ON proposal_competencies (competency_type);

-- index: ix_proposal_competencies_id
CREATE INDEX ix_proposal_competencies_id ON proposal_competencies (id);

-- index: ix_proposal_competencies_proposal_id
CREATE INDEX ix_proposal_competencies_proposal_id ON proposal_competencies (proposal_id);

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
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, teaching_team JSON, study_subject_id INTEGER, gdoc_url VARCHAR(1000), title VARCHAR(500), character TEXT, regime TEXT, theoretical_hours INTEGER, practical_hours INTEGER, total_hours INTEGER, weekly_hours INTEGER, minimum_content TEXT, generic_competencies TEXT, specific_competencies TEXT, fundamentals_part1 TEXT, fundamentals_part2 TEXT, learning_outcomes TEXT, units TEXT, practicals TEXT, methodology TEXT, evaluation TEXT, bibliography TEXT, observations TEXT, source_type TEXT, updated_at DATETIME, gdoc_hash VARCHAR(64), gdoc_last_checked DATETIME, gdoc_last_synced DATETIME, gdoc_status VARCHAR(20), 
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

