#!/usr/bin/env python3
"""Debug script to check proposal 8 status and why it's not linking to study plan."""

import sys
sys.path.insert(0, '/home/user/TesisMCD/backend')

from app.database import SessionLocal
from app import models
from app.main import normalize_term_name, parse_int, normalize_header

db = SessionLocal()

# Get proposal 8
proposal = db.query(models.Proposal).filter(models.Proposal.id == 8).first()

if not proposal:
    print("❌ Proposal 8 not found!")
    sys.exit(1)

print("=" * 60)
print(f"PROPOSAL 8 STATUS".center(60))
print("=" * 60)
print(f"\nBasic Info:")
print(f"  ID: {proposal.id}")
print(f"  Title: {proposal.title}")
print(f"  Status: {proposal.status}")
print(f"  Created: {proposal.created_at}")

print(f"\nPlan Linking Info:")
print(f"  study_subject_id: {proposal.study_subject_id}")
print(f"  study_plan: {proposal.study_plan}")

print(f"\nSync-Required Fields:")
print(f"  career: {proposal.career!r} {'✓' if proposal.career else '❌'}")
print(f"  subject: {proposal.subject!r} {'✓' if proposal.subject else '❌'}")
print(f"  year_of_career: {proposal.year_of_career!r}")
print(f"  quarter: {proposal.quarter!r}")

if proposal.career and proposal.subject:
    print(f"\nNormalization Simulation:")
    year_num = parse_int(proposal.year_of_career, default=0)
    term_normalized = normalize_term_name(proposal.quarter)
    subject_normalized = normalize_header(proposal.subject)
    print(f"  year_of_career '{proposal.year_of_career}' → {year_num}")
    print(f"  quarter '{proposal.quarter}' → '{term_normalized}'")
    print(f"  subject '{proposal.subject}' → normalized '{subject_normalized}'")
    
    # Check if plan exists
    plan_name = proposal.study_plan or "Plan"
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.career == proposal.career,
        models.StudyPlan.name == plan_name
    ).first()
    print(f"\n  Study Plan '{plan_name}' exists: {'✓' if plan else '❌'}")
    
    if plan:
        print(f"    Plan ID: {plan.id}")
        year = db.query(models.StudyYear).filter(
            models.StudyYear.plan_id == plan.id,
            models.StudyYear.year_number == year_num
        ).first()
        print(f"    Year {year_num} exists: {'✓' if year else '❌'}")
        
        if year:
            print(f"      Year ID: {year.id}")
            term = db.query(models.StudyTerm).filter(
                models.StudyTerm.year_id == year.id,
                models.StudyTerm.name == (term_normalized or "Sin Cuatrimestre")
            ).first()
            print(f"      Term '{term_normalized or 'Sin Cuatrimestre'}' exists: {'✓' if term else '❌'}")
            
            if term:
                print(f"        Term ID: {term.id}")
                
                # Show all subjects in this term
                all_subjects = db.query(models.StudySubject).filter(
                    models.StudySubject.term_id == term.id
                ).all()
                
                print(f"        All subjects in term ({len(all_subjects)} total):")
                for subj in all_subjects:
                    subj_normalized = normalize_header(subj.name)
                    print(f"          - '{subj.name}' (normalized: '{subj_normalized}')")
                    print(f"            Match proposal? {subj_normalized == subject_normalized}")
                
                # Try to find by normalized name
                subject = None
                for subj in all_subjects:
                    if normalize_header(subj.name) == subject_normalized:
                        subject = subj
                        break
                
                print(f"\n        Subject '{proposal.subject}' in term: {'✓' if subject else '❌'}")
                
                if subject:
                    print(f"          Subject ID: {subject.id}")
else:
    print("\n❌ Missing required fields for plan sync!")

print(f"\nGDoc Info:")
print(f"  gdoc_url: {proposal.gdoc_url!r}")
print(f"  gdoc_status: {proposal.gdoc_status}")
print(f"  source_type: {proposal.source_type}")

print("=" * 60)

db.close()
