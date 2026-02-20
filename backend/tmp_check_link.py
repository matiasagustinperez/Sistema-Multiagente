from app.database import SessionLocal
from app import models
import unicodedata


def norm(s):
    if s is None:
        return None
    t = "".join(c for c in unicodedata.normalize("NFKD", str(s)) if not unicodedata.combining(c))
    return " ".join(t.strip().lower().split())


db = SessionLocal()
p = db.query(models.Proposal).filter(models.Proposal.id == 8).first()
print("proposal.subject repr:", repr(p.subject))
print("proposal.study_plan repr:", repr(p.study_plan))
print("proposal norm:", norm(p.subject))

plan = db.query(models.StudyPlan).filter(
    models.StudyPlan.career == p.career,
    models.StudyPlan.name == p.study_plan,
).first()
print("plan.id", plan.id if plan else None)

if plan and isinstance(plan.payload, dict):
    years = plan.payload.get("years") or []
    names = []
    for year in years:
        for term in year.get("terms", []) or []:
            for subject in term.get("subjects", []) or []:
                names.append(subject.get("name"))
    matches = [name for name in names if norm(name) == norm(p.subject)]
    print("payload total subjects", len(names))
    print("payload exact contains?", p.subject in names)
    print("payload norm matches count", len(matches))
    print("payload norm matches sample", [repr(m) for m in matches[:5]])

if plan:
    relational_subjects = (
        db.query(models.StudySubject)
        .join(models.StudyTerm, models.StudyTerm.id == models.StudySubject.term_id)
        .join(models.StudyYear, models.StudyYear.id == models.StudyTerm.year_id)
        .filter(models.StudyYear.plan_id == plan.id)
        .all()
    )
    rel_names = [subject.name for subject in relational_subjects]
    rel_matches = [name for name in rel_names if norm(name) == norm(p.subject)]
    print("rel total subjects", len(rel_names))
    print("rel exact contains?", p.subject in rel_names)
    print("rel norm matches", [repr(m) for m in rel_matches])

db.close()
