#!/usr/bin/env python3
"""Force sync proposal 8 to study plan with normalized matching."""

import sys
sys.path.insert(0, '/home/user/TesisMCD/backend')

from app.database import SessionLocal
from app import models
from app.main import sync_subject_from_proposal

db = SessionLocal()

try:
    proposal = db.query(models.Proposal).filter(models.Proposal.id == 8).first()
    if not proposal:
        print("❌ Proposal 8 not found!")
        sys.exit(1)
    
    print(f"Forcing resync of proposal 8: {proposal.title}")
    print(f"  Career: {proposal.career}")
    print(f"  Subject: {proposal.subject}")
    print(f"  Year: {proposal.year_of_career}")
    print(f"  Quarter: {proposal.quarter}")
    
    # Force sync
    sync_subject_from_proposal(db, proposal)
    db.commit()
    
    db.refresh(proposal)
    print(f"\n✅ Resync complete!")
    print(f"  study_subject_id: {proposal.study_subject_id}")
    
    if proposal.study_subject_id:
        subject = db.query(models.StudySubject).filter(
            models.StudySubject.id == proposal.study_subject_id
        ).first()
        print(f"  Linked to subject: '{subject.name}' (ID {subject.id})")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
