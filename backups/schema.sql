CREATE TABLE teachers (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	category VARCHAR, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, dedication VARCHAR(50), normalized_key TEXT, updated_at DATETIME, 
	PRIMARY KEY (id)
);

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
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, teaching_team JSON, study_subject_id INTEGER, gdoc_url VARCHAR(1000), title VARCHAR(500), character TEXT, regime TEXT, theoretical_hours INTEGER, practical_hours INTEGER, total_hours INTEGER, weekly_hours INTEGER, minimum_content TEXT, generic_competencies TEXT, specific_competencies TEXT, fundamentals_part1 TEXT, fundamentals_part2 TEXT, learning_outcomes TEXT, units TEXT, practicals TEXT, methodology TEXT, evaluation TEXT, bibliography TEXT, observations TEXT, source_type TEXT, updated_at DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE draft_proposals (
	id INTEGER NOT NULL, 
	career VARCHAR, 
	subject VARCHAR, 
	form_data TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE teacher_proposal (
	id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id)
);

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

CREATE TABLE teacher_careers (
	id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	career VARCHAR(255) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id)
);

CREATE TABLE proposal_teachers (
	id INTEGER NOT NULL, 
	proposal_id INTEGER NOT NULL, 
	teacher_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proposal_id) REFERENCES proposals (id), 
	FOREIGN KEY(teacher_id) REFERENCES teachers (id)
);

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

CREATE TABLE study_years (
	id INTEGER NOT NULL, 
	plan_id INTEGER NOT NULL, 
	year_number INTEGER NOT NULL, 
	label VARCHAR(50), 
	sort_order INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(plan_id) REFERENCES study_plans (id)
);

CREATE TABLE study_terms (
	id INTEGER NOT NULL, 
	year_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	sort_order INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(year_id) REFERENCES study_years (id)
);

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

CREATE TABLE study_subject_prerequisites (
	id INTEGER NOT NULL, 
	subject_id INTEGER NOT NULL, 
	prerequisite_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(subject_id) REFERENCES study_subjects (id), 
	FOREIGN KEY(prerequisite_id) REFERENCES study_subjects (id)
);