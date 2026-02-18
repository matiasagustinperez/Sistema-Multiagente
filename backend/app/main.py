import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal, init_db
from agents import extract as extract_agent
from .docx_import import import_proposal_from_docx
from openai import OpenAI
import shutil
import tempfile
import unicodedata

app = FastAPI(title="TesisMCD API")

# Load environment variables from backend/.env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path=env_file, override=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

UPLOAD_FOLDER = os.getenv("LOCAL_UPLOAD_PATH", "./data/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
TEMPLATE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Template Propuestas.docx"))


class AiPrompt(BaseModel):
    prompt: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_teachers_from_existing_proposals() -> None:
    db = SessionLocal()
    try:
        proposals = db.query(models.Proposal).all()
        for proposal in proposals:
            if not proposal.teaching_team:
                continue
            teacher_payload = proposal.teaching_team
            if not isinstance(teacher_payload, list):
                continue
            teacher_objs = []
            teacher_ids = []
            for entry in teacher_payload:
                if not isinstance(entry, dict):
                    continue
                teacher = upsert_teacher(db, entry)
                db.flush()
                ensure_teacher_career(db, teacher.id, proposal.career)
                teacher_objs.append(teacher)
                teacher_ids.append(teacher.id)
            if teacher_ids:
                replace_proposal_teachers(db, proposal.id, teacher_ids)
                proposal.teaching_team = build_teaching_team_payload(teacher_objs)
                db.add(proposal)
        db.commit()
    finally:
        db.close()


def get_openai_client():
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=key)


LEVEL_LABELS = {
    0: "Nulo",
    1: "Bajo",
    2: "Medio",
    3: "Alto",
}

LEVEL_VALUES = {
    "nulo": 0,
    "0": 0,
    "bajo": 1,
    "1": 1,
    "medio": 2,
    "2": 2,
    "alto": 3,
    "3": 3,
}

CATEGORY_ORDER = {
    "TITULAR": 5,
    "ASOCIADO": 4,
    "ADJUNTO": 3,
    "JTP": 2,
    "AYUDANTE 1º": 1,
}

CATEGORY_NORMALIZATION = {
    "titular": "TITULAR",
    "asociado": "ASOCIADO",
    "adjunto": "ADJUNTO",
    "jtp": "JTP",
    "ayudante 1": "AYUDANTE 1º",
    "ayudante 1o": "AYUDANTE 1º",
    "ayudante 1º": "AYUDANTE 1º",
}

DEDICATION_OPTIONS = {
    "simple": "Simple",
    "parcial": "Parcial",
    "parcial + simple": "Parcial + Simple",
    "exclusivo": "Exclusivo",
    "sin informar": "Sin Informar",
}


def normalize_competency_level(value) -> int:
    if value is None:
        return 0
    if isinstance(value, bool):
        return 0
    if isinstance(value, (int, float)):
        return max(0, min(3, int(value)))
    text = str(value).strip().lower()
    if text in LEVEL_VALUES:
        return LEVEL_VALUES[text]
    return 0


def normalize_teacher_category(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip().lower()
    text = text.replace("1o", "1º").replace("1°", "1º")
    return CATEGORY_NORMALIZATION.get(text, str(value).strip().upper())


def normalize_teacher_dedication(value: str | None) -> str:
    if not value:
        return "Sin Informar"
    text = str(value).strip().lower()
    return DEDICATION_OPTIONS.get(text, "Sin Informar")


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def normalize_teacher_key(name: str | None) -> str:
    if not name:
        return ""
    cleaned = strip_accents(str(name)).lower()
    cleaned = cleaned.replace(",", " ")
    cleaned = "".join(ch if ch.isalnum() or ch.isspace() else " " for ch in cleaned)
    tokens = [token for token in cleaned.split() if token]
    tokens.sort()
    return " ".join(tokens)


def normalize_teacher_name(name: str | None) -> str:
    if not name:
        return ""
    return str(name).strip().upper()


def normalize_teacher_tokens(name: str | None) -> list[str]:
    key = normalize_teacher_key(name)
    return key.split() if key else []


def find_teacher_by_name_fuzzy(db: Session, name: str | None) -> models.Teacher | None:
    tokens = normalize_teacher_tokens(name)
    if len(tokens) < 2:
        return None
    token_set = set(tokens)
    best_match = None
    best_score = 0
    candidates = db.query(models.Teacher).filter(models.Teacher.normalized_key != "").all()
    for candidate in candidates:
        candidate_tokens = (candidate.normalized_key or "").split()
        if len(candidate_tokens) < 2:
            continue
        candidate_set = set(candidate_tokens)
        size_diff = abs(len(candidate_tokens) - len(tokens))
        if size_diff > 1:
            continue
        if token_set.issubset(candidate_set) or candidate_set.issubset(token_set):
            score = min(len(token_set), len(candidate_set))
            if score > best_score:
                best_match = candidate
                best_score = score
    return best_match


def resolve_teacher_category(existing: str | None, incoming: str | None) -> str | None:
    existing_norm = normalize_teacher_category(existing)
    incoming_norm = normalize_teacher_category(incoming)
    if not existing_norm:
        return incoming_norm
    if not incoming_norm:
        return existing_norm
    return incoming_norm if CATEGORY_ORDER.get(incoming_norm, 0) > CATEGORY_ORDER.get(existing_norm, 0) else existing_norm


def upsert_teacher(db: Session, teacher_data: dict) -> models.Teacher:
    name = normalize_teacher_name(teacher_data.get("name"))
    email = (teacher_data.get("email") or "").strip().lower() or None
    category = normalize_teacher_category(teacher_data.get("category"))
    dedication = normalize_teacher_dedication(teacher_data.get("dedication"))
    normalized_key = normalize_teacher_key(name)

    teacher = None
    if email:
        teacher = db.query(models.Teacher).filter(models.Teacher.email == email).first()
    if not teacher and normalized_key:
        teacher = db.query(models.Teacher).filter(models.Teacher.normalized_key == normalized_key).first()
    if not teacher and name:
        teacher = find_teacher_by_name_fuzzy(db, name)

    if teacher:
        if name and (not teacher.name or len(name) > len(teacher.name)):
            teacher.name = name
        if email and not teacher.email:
            teacher.email = email
        teacher.category = resolve_teacher_category(teacher.category, category)
        if dedication and (teacher.dedication in (None, "", "Sin Informar")):
            teacher.dedication = dedication
        if normalized_key:
            teacher.normalized_key = normalized_key
        db.add(teacher)
        return teacher

    teacher = models.Teacher(
        name=name or "DOCENTE",
        normalized_key=normalized_key or normalize_teacher_key(name or "DOCENTE"),
        email=email,
        category=category,
        dedication=dedication,
    )
    db.add(teacher)
    return teacher


def ensure_teacher_career(db: Session, teacher_id: int, career: str | None) -> None:
    if not career:
        return
    existing = db.query(models.TeacherCareer).filter(
        models.TeacherCareer.teacher_id == teacher_id,
        models.TeacherCareer.career == career,
    ).first()
    if not existing:
        db.add(models.TeacherCareer(teacher_id=teacher_id, career=career))


def replace_proposal_teachers(db: Session, proposal_id: int, teacher_ids: list[int]) -> None:
    db.query(models.ProposalTeacher).filter(
        models.ProposalTeacher.proposal_id == proposal_id
    ).delete(synchronize_session=False)
    for teacher_id in teacher_ids:
        db.add(models.ProposalTeacher(
            proposal_id=proposal_id,
            teacher_id=teacher_id,
        ))


def build_teaching_team_payload(teachers: list[models.Teacher]) -> list[dict]:
    payload = []
    for teacher in teachers:
        payload.append({
            "id": teacher.id,
            "name": teacher.name,
            "category": teacher.category or "",
            "email": teacher.email or "",
            "dedication": teacher.dedication or "Sin Informar",
        })
    return payload


def build_competencies_text(items: list[dict]) -> str:
    if not items:
        return ""
    lines = []
    for item in items:
        code = (item.get("code") or "").strip()
        description = (item.get("description") or "").strip()
        level = normalize_competency_level(item.get("level"))
        level_label = LEVEL_LABELS.get(level, "Nulo")
        if code and description:
            lines.append(f"{code} - {description} - {level_label}")
        elif description:
            lines.append(f"{description} - {level_label}")
    return "\n".join(lines)


def normalize_competency_items(items: list) -> list[dict]:
    normalized = []
    for item in items or []:
        if isinstance(item, dict):
            code = (item.get("code") or "").strip()
            description = (item.get("description") or "").strip()
            level = normalize_competency_level(item.get("level"))
        else:
            data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
            code = (data.get("code") or "").strip()
            description = (data.get("description") or "").strip()
            level = normalize_competency_level(data.get("level"))
        if not code and not description:
            continue
        normalized.append({
            "code": code,
            "description": description,
            "level": level,
        })
    return normalized


def replace_proposal_competencies(db: Session, proposal_id: int, items: list[dict], competency_type: str) -> None:
    db.query(models.ProposalCompetency).filter(
        models.ProposalCompetency.proposal_id == proposal_id,
        models.ProposalCompetency.competency_type == competency_type,
    ).delete(synchronize_session=False)
    for item in items:
        db.add(models.ProposalCompetency(
            proposal_id=proposal_id,
            competency_type=competency_type,
            code=item.get("code", ""),
            description=item.get("description", ""),
            level=item.get("level", 0),
        ))


def ensure_competency_catalog(db: Session, career: str, items: list[dict], competency_type: str) -> None:
    if not career:
        return
    for item in items or []:
        code = (item.get("code") or "").strip()
        description = (item.get("description") or "").strip()
        if not code or not description:
            continue
        existing = db.query(models.CompetencyCatalog).filter(
            models.CompetencyCatalog.career == career,
            models.CompetencyCatalog.competency_type == competency_type,
            models.CompetencyCatalog.code == code,
        ).first()
        if existing:
            if not existing.description and description:
                existing.description = description
                db.add(existing)
            continue
        db.add(models.CompetencyCatalog(
            career=career,
            competency_type=competency_type,
            code=code,
            description=description,
        ))


def get_proposal_competencies(db: Session, proposal_id: int) -> dict[str, list[dict]]:
    rows = db.query(models.ProposalCompetency).filter(
        models.ProposalCompetency.proposal_id == proposal_id
    ).all()
    generic_items = []
    specific_items = []
    for row in rows:
        item = {
            "id": row.id,
            "code": row.code,
            "description": row.description,
            "level": row.level,
            "level_label": LEVEL_LABELS.get(row.level, "Nulo"),
        }
        if row.competency_type == "specific":
            specific_items.append(item)
        else:
            generic_items.append(item)
    return {
        "generic": generic_items,
        "specific": specific_items,
    }


def build_proposal_response(db: Session, proposal: models.Proposal) -> dict:
    if hasattr(schemas.Proposal, "model_validate"):
        base = schemas.Proposal.model_validate(proposal).model_dump()
    else:
        base = schemas.Proposal.from_orm(proposal).dict()
    competencies = get_proposal_competencies(db, proposal.id)
    base["generic_competencies_items"] = competencies["generic"]
    base["specific_competencies_items"] = competencies["specific"]
    return base


@app.on_event("startup")
def on_startup():
    # Validate required environment variables
    required_env_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}. "
                          f"Please set them in .env or as environment variables.")
    
    # Initialize database
    init_db()
    sync_teachers_from_existing_proposals()
    
    print("[OK] Backend startup validation passed")
    print("   - OpenAI API Key: configured")
    print("   - Database: initialized")
    print(f"   - Upload folder: {UPLOAD_FOLDER}")


@app.post("/upload", response_model=schemas.ProposalOut)
async def upload_proposal(
    file: UploadFile = File(...),
    uploader: str = Form(None),
    career: str = Form(None),
    subject: str = Form(None),
    db: Session = Depends(get_db),
    background: BackgroundTasks = None,
):
    try:
        dest_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    proposal = models.Proposal(
        title=subject or file.filename,  # Use subject as title, or filename as fallback
        original_filename=file.filename,
        source_type="upload",
        status="Importada",
        career=career,
        subject=subject,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    # launch extraction in background (creates embeddings and uploads to Pinecone)
    try:
        if background is not None:
            background.add_task(extract_agent.process_file, dest_path, proposal.id)
        else:
            # fallback synchronous
            extract_agent.process_file(dest_path, proposal.id)
    except Exception:
        # do not fail the upload if background task fails to schedule
        pass
    return proposal



@app.post("/search")
def semantic_search(q: str = Form(...), top_k: int = Form(5)):
    """Return top-k matching fragments from Pinecone for query `q`."""
    try:
        results = extract_agent.query_local(q, top_k=top_k)
        return {"matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggest")
def suggest_for_proposal(proposal_id: int = Form(...), prompt_context: str = Form(None)):
    """Generate a suggestion (text) for a proposal using nearby evidence and OpenAI.
    Returns suggestion text and used evidences.
    """
    try:
        # get top evidence for the proposal
        matches = extract_agent.query_local(f"proposal:{proposal_id}", top_k=5)
        evidence_texts = "\n\n".join([m.get("metadata", {}).get("text", "") for m in matches])
        system_prompt = "Eres un asistente que ayuda a redactar la Fundamentación de una propuesta docente, usando la evidencia asociada. Devuelve un párrafo sugerido." 
        user_prompt = f"Evidencias:\n{evidence_texts}\n\nContexto adicional:{prompt_context or ''}\n\nGenera una sugerencia concisa para la Fundamentación."
        client = get_openai_client()
        resp = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}], max_tokens=300)
        suggestion = resp.choices[0].message.content.strip()
        return {"suggestion": suggestion, "evidence_used": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-generate")
def ai_generate(payload: AiPrompt):
    try:
        if not payload.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt is required")
        system_prompt = "Eres un asistente que redacta contenido academico en espanol, claro y conciso."
        client = get_openai_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.prompt}
            ],
            max_tokens=500
        )
        content = resp.choices[0].message.content.strip()
        return {"status": "success", "content": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-reformulate")
def ai_reformulate(payload: AiPrompt):
    try:
        if not payload.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt is required")
        system_prompt = "Eres un asistente que reformula textos academicos manteniendo el significado."
        user_prompt = f"Reformula el siguiente texto, manteniendo el significado:\n\n{payload.prompt}"
        client = get_openai_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=500
        )
        content = resp.choices[0].message.content.strip()
        return {"status": "success", "content": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/proposals/{proposal_id}", response_model=schemas.Proposal)
def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return build_proposal_response(db, proposal)


@app.patch("/proposals/{proposal_id}", response_model=schemas.Proposal)
def update_proposal(proposal_id: int, payload: schemas.ProposalUpdate, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)
    generic_items_raw = data.pop("generic_competencies_items", None)
    specific_items_raw = data.pop("specific_competencies_items", None)
    
    # Convert Pydantic models to dicts for JSON storage
    if 'learning_outcomes' in data and data['learning_outcomes']:
        data['learning_outcomes'] = [
            lo if isinstance(lo, dict) else (lo.model_dump() if hasattr(lo, 'model_dump') else lo.dict())
            for lo in data['learning_outcomes']
        ]
    if 'units' in data and data['units']:
        data['units'] = [
            u if isinstance(u, dict) else (u.model_dump() if hasattr(u, 'model_dump') else u.dict())
            for u in data['units']
        ]
    if 'practicals' in data and data['practicals']:
        data['practicals'] = [
            p if isinstance(p, dict) else (p.model_dump() if hasattr(p, 'model_dump') else p.dict())
            for p in data['practicals']
        ]
    if 'teaching_team' in data:
        data['teaching_team'] = [
            t if isinstance(t, dict) else (t.model_dump() if hasattr(t, 'model_dump') else t.dict())
            for t in (data['teaching_team'] or [])
        ]

    proposal_career = data.get("career") or proposal.career
    if generic_items_raw is not None:
        normalized = normalize_competency_items(generic_items_raw)
        data['generic_competencies'] = data.get('generic_competencies') or build_competencies_text(normalized)
        ensure_competency_catalog(db, proposal_career, normalized, "generic")
        replace_proposal_competencies(db, proposal.id, normalized, "generic")

    if specific_items_raw is not None:
        normalized = normalize_competency_items(specific_items_raw)
        data['specific_competencies'] = data.get('specific_competencies') or build_competencies_text(normalized)
        ensure_competency_catalog(db, proposal_career, normalized, "specific")
        replace_proposal_competencies(db, proposal.id, normalized, "specific")

    if 'teaching_team' in data:
        teacher_objs = []
        teacher_ids = []
        for entry in data['teaching_team'] or []:
            if not isinstance(entry, dict):
                continue
            teacher = upsert_teacher(db, entry)
            db.flush()
            ensure_teacher_career(db, teacher.id, proposal_career)
            teacher_objs.append(teacher)
            teacher_ids.append(teacher.id)
        replace_proposal_teachers(db, proposal.id, teacher_ids)
        data['teaching_team'] = build_teaching_team_payload(teacher_objs)
    
    for key, value in data.items():
        setattr(proposal, key, value)
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return build_proposal_response(db, proposal)


@app.delete("/proposals/{proposal_id}")
def delete_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    db.delete(proposal)
    db.commit()
    return {"status": "deleted", "id": proposal_id}


@app.get("/proposals", response_model=list[schemas.ProposalOut])
def list_proposals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    proposals = db.query(models.Proposal).offset(skip).limit(limit).all()
    return [build_proposal_response(db, proposal) for proposal in proposals]


@app.get("/competencies", response_model=list[schemas.CompetencyCatalogOut])
def list_competencies(career: str = "", competency_type: str = "", db: Session = Depends(get_db)):
    query = db.query(models.CompetencyCatalog)
    if career:
        query = query.filter(models.CompetencyCatalog.career == career)
    if competency_type:
        query = query.filter(models.CompetencyCatalog.competency_type == competency_type)
    return query.order_by(models.CompetencyCatalog.code.asc()).all()


@app.post("/competencies", response_model=schemas.CompetencyCatalogOut)
def create_competency(payload: schemas.CompetencyCatalogCreate, db: Session = Depends(get_db)):
    existing = db.query(models.CompetencyCatalog).filter(
        models.CompetencyCatalog.career == payload.career,
        models.CompetencyCatalog.competency_type == payload.competency_type,
        models.CompetencyCatalog.code == payload.code,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Competency code already exists")
    item = models.CompetencyCatalog(
        career=payload.career,
        competency_type=payload.competency_type,
        code=payload.code,
        description=payload.description,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.patch("/competencies/{competency_id}", response_model=schemas.CompetencyCatalogOut)
def update_competency(competency_id: int, payload: schemas.CompetencyCatalogUpdate, db: Session = Depends(get_db)):
    item = db.query(models.CompetencyCatalog).filter(models.CompetencyCatalog.id == competency_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Competency not found")
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/competencies/{competency_id}/usage")
def get_competency_usage(competency_id: int, db: Session = Depends(get_db)):
    item = db.query(models.CompetencyCatalog).filter(models.CompetencyCatalog.id == competency_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Competency not found")
    rows = db.query(models.ProposalCompetency).join(models.Proposal).filter(
        models.Proposal.career == item.career,
        models.ProposalCompetency.competency_type == item.competency_type,
        models.ProposalCompetency.code == item.code,
    ).all()
    affected_ids = sorted({row.proposal_id for row in rows})
    proposals_info = []
    if affected_ids:
        proposals = db.query(models.Proposal).filter(models.Proposal.id.in_(affected_ids)).all()
        proposals_info = [
            {
                "id": proposal.id,
                "subject": proposal.subject,
                "career": proposal.career,
                "title": proposal.title,
            }
            for proposal in proposals
        ]
    return {
        "competency_id": competency_id,
        "affected_proposals": len(affected_ids),
        "affected_proposal_ids": affected_ids,
        "affected_proposals_info": proposals_info,
    }


@app.delete("/competencies/{competency_id}")
def delete_competency(competency_id: int, db: Session = Depends(get_db)):
    item = db.query(models.CompetencyCatalog).filter(models.CompetencyCatalog.id == competency_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Competency not found")
    affected_rows = db.query(models.ProposalCompetency).join(models.Proposal).filter(
        models.Proposal.career == item.career,
        models.ProposalCompetency.competency_type == item.competency_type,
        models.ProposalCompetency.code == item.code,
    ).all()
    affected_ids = {row.proposal_id for row in affected_rows}
    if affected_ids:
        db.query(models.ProposalCompetency).filter(
            models.ProposalCompetency.proposal_id.in_(affected_ids),
            models.ProposalCompetency.competency_type == item.competency_type,
            models.ProposalCompetency.code == item.code,
        ).delete(synchronize_session=False)
    db.delete(item)
    for proposal_id in affected_ids:
        proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
        if not proposal:
            continue
        remaining_rows = db.query(models.ProposalCompetency).filter(
            models.ProposalCompetency.proposal_id == proposal_id,
            models.ProposalCompetency.competency_type == item.competency_type,
        ).all()
        remaining_items = [
            {
                "code": row.code,
                "description": row.description,
                "level": row.level,
            }
            for row in remaining_rows
        ]
        updated_text = build_competencies_text(remaining_items)
        if item.competency_type == "specific":
            proposal.specific_competencies = updated_text
        else:
            proposal.generic_competencies = updated_text
        db.add(proposal)
    db.commit()
    return {
        "status": "deleted",
        "id": competency_id,
        "affected_proposals": len(affected_ids),
        "affected_proposal_ids": sorted(affected_ids),
    }


@app.get("/teachers", response_model=list[schemas.TeacherOut])
def list_teachers(career: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Teacher)
    if career:
        proposal_ids = db.query(models.Teacher.id).join(models.ProposalTeacher).join(models.Proposal).filter(
            models.Proposal.career == career
        ).distinct().all()
        career_ids = db.query(models.TeacherCareer.teacher_id).filter(
            models.TeacherCareer.career == career
        ).distinct().all()
        teacher_ids = {row[0] for row in proposal_ids} | {row[0] for row in career_ids}
        if not teacher_ids:
            return []
        query = query.filter(models.Teacher.id.in_(teacher_ids))
    return query.order_by(models.Teacher.name.asc()).distinct().all()


@app.post("/teachers", response_model=schemas.TeacherOut)
def create_teacher(payload: schemas.TeacherCreate, db: Session = Depends(get_db)):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    career = (data.get("career") or "").strip() or None
    name = normalize_teacher_name(data.get("name"))
    email = (data.get("email") or "").strip().lower() or None
    data["dedication"] = normalize_teacher_dedication(data.get("dedication"))
    normalized_key = normalize_teacher_key(name)

    existing = None
    if email:
        existing = db.query(models.Teacher).filter(models.Teacher.email == email).first()
    if not existing and normalized_key:
        existing = db.query(models.Teacher).filter(models.Teacher.normalized_key == normalized_key).first()
    if not existing and name:
        existing = find_teacher_by_name_fuzzy(db, name)

    if existing:
        ensure_teacher_career(db, existing.id, career)
        db.commit()
        db.refresh(existing)
        return existing

    teacher = upsert_teacher(db, data)
    db.flush()
    ensure_teacher_career(db, teacher.id, career)
    db.commit()
    db.refresh(teacher)
    return teacher


@app.patch("/teachers/{teacher_id}", response_model=schemas.TeacherOut)
def update_teacher(teacher_id: int, payload: schemas.TeacherUpdate, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    if not data:
        return teacher

    name = normalize_teacher_name(data.get("name") if "name" in data else teacher.name)
    email_raw = data.get("email") if "email" in data else teacher.email
    email = (email_raw or "").strip().lower() or None
    category = teacher.category
    if "category" in data:
        category = normalize_teacher_category(data.get("category"))
    dedication = teacher.dedication
    if "dedication" in data:
        dedication = normalize_teacher_dedication(data.get("dedication"))
    normalized_key = normalize_teacher_key(name)

    if email:
        existing_email = db.query(models.Teacher).filter(
            models.Teacher.email == email,
            models.Teacher.id != teacher_id,
        ).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="Teacher already exists")

    if normalized_key:
        existing_name = db.query(models.Teacher).filter(
            models.Teacher.normalized_key == normalized_key,
            models.Teacher.id != teacher_id,
        ).first()
        if existing_name:
            raise HTTPException(status_code=409, detail="Teacher already exists")
    if name:
        fuzzy = find_teacher_by_name_fuzzy(db, name)
        if fuzzy and fuzzy.id != teacher_id:
            raise HTTPException(status_code=409, detail="Teacher already exists")

    teacher.name = name or teacher.name
    teacher.email = email
    teacher.category = category
    teacher.dedication = dedication or "Sin Informar"
    teacher.normalized_key = normalized_key or teacher.normalized_key
    db.add(teacher)

    proposal_ids = db.query(models.ProposalTeacher.proposal_id).filter(
        models.ProposalTeacher.teacher_id == teacher_id
    ).distinct().all()
    for (proposal_id,) in proposal_ids:
        remaining_rows = db.query(models.ProposalTeacher).filter(
            models.ProposalTeacher.proposal_id == proposal_id
        ).all()
        remaining_ids = [row.teacher_id for row in remaining_rows]
        remaining_teachers = db.query(models.Teacher).filter(
            models.Teacher.id.in_(remaining_ids)
        ).all()
        proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
        if proposal:
            proposal.teaching_team = build_teaching_team_payload(remaining_teachers)
            db.add(proposal)

    db.commit()
    db.refresh(teacher)
    return teacher


@app.get("/teachers/{teacher_id}/usage")
def get_teacher_usage(teacher_id: int, career: str = "", db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    query = db.query(models.Proposal).join(models.ProposalTeacher).filter(
        models.ProposalTeacher.teacher_id == teacher_id
    )
    if career:
        query = query.filter(models.Proposal.career == career)
    proposals = query.all()
    affected_ids = sorted({proposal.id for proposal in proposals})
    proposals_info = [
        {
            "id": proposal.id,
            "subject": proposal.subject,
            "career": proposal.career,
            "title": proposal.title,
        }
        for proposal in proposals
    ]
    return {
        "teacher_id": teacher_id,
        "teacher_name": teacher.name,
        "affected_proposals": len(affected_ids),
        "affected_proposal_ids": affected_ids,
        "affected_proposals_info": proposals_info,
    }


@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, career: str = "", db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    query = db.query(models.ProposalTeacher).join(models.Proposal).filter(
        models.ProposalTeacher.teacher_id == teacher_id
    )
    if career:
        query = query.filter(models.Proposal.career == career)
    affected_rows = query.all()
    affected_ids = {row.proposal_id for row in affected_rows}
    if affected_ids:
        db.query(models.ProposalTeacher).filter(
            models.ProposalTeacher.teacher_id == teacher_id,
            models.ProposalTeacher.proposal_id.in_(affected_ids),
        ).delete(synchronize_session=False)

    if career:
        db.query(models.TeacherCareer).filter(
            models.TeacherCareer.teacher_id == teacher_id,
            models.TeacherCareer.career == career,
        ).delete(synchronize_session=False)

    proposals_info = []
    if affected_ids:
        proposals = db.query(models.Proposal).filter(models.Proposal.id.in_(affected_ids)).all()
        proposals_info = [
            {
                "id": proposal.id,
                "subject": proposal.subject,
                "career": proposal.career,
                "title": proposal.title,
            }
            for proposal in proposals
        ]
        for proposal in proposals:
            remaining_rows = db.query(models.ProposalTeacher).filter(
                models.ProposalTeacher.proposal_id == proposal.id
            ).all()
            if remaining_rows:
                remaining_ids = [row.teacher_id for row in remaining_rows]
                remaining_teachers = db.query(models.Teacher).filter(
                    models.Teacher.id.in_(remaining_ids)
                ).all()
                proposal.teaching_team = build_teaching_team_payload(remaining_teachers)
            else:
                proposal.teaching_team = []
            db.add(proposal)

    still_linked = db.query(models.ProposalTeacher).filter(
        models.ProposalTeacher.teacher_id == teacher_id
    ).first()
    still_career_link = db.query(models.TeacherCareer).filter(
        models.TeacherCareer.teacher_id == teacher_id
    ).first()
    if not still_linked and not still_career_link:
        db.delete(teacher)

    db.commit()
    return {
        "status": "deleted",
        "id": teacher_id,
        "affected_proposals": len(affected_ids),
        "affected_proposal_ids": sorted(affected_ids),
        "affected_proposals_info": proposals_info,
    }


@app.get("/proposals/{proposal_id}/docx")
def download_proposal_docx(
    proposal_id: int,
    db: Session = Depends(get_db),
    background: BackgroundTasks = None,
):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(status_code=500, detail="Template Propuestas.docx not found")

    try:
        from .docx_export import generate_proposal_docx
    except ImportError:
        raise HTTPException(status_code=500, detail="python-docx no esta instalado")

    output_path = generate_proposal_docx(proposal, TEMPLATE_PATH)
    if background is not None:
        output_dir = os.path.dirname(output_path)
        background.add_task(shutil.rmtree, output_dir, ignore_errors=True)

    # Generate filename: Year - Cuatrimestre - Subject.docx
    year = proposal.year_of_career or "0"
    quarter_raw = proposal.quarter or "0"
    subject = proposal.subject or "Sin_Asignatura"
    
    # Normalize quarter to 1º, 2º, or A
    import re
    quarter_lower = str(quarter_raw).lower()
    if "anual" in quarter_lower or quarter_lower.strip() == "a":
        quarter = "A"
    elif "1" in quarter_lower or "primer" in quarter_lower:
        quarter = "1º"
    elif "2" in quarter_lower or "segundo" in quarter_lower:
        quarter = "2º"
    else:
        quarter = quarter_raw
    
    # Clean filename (remove invalid characters)
    subject_clean = re.sub(r'[<>:"/\\|?*]', '', subject)
    
    filename = f"{year} - {quarter} - {subject_clean}.docx"
    return FileResponse(
        output_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )


@app.post("/proposals")
def create_proposal(proposal: schemas.ProposalCreate, db: Session = Depends(get_db)):
    """Create a new proposal from form data (no file upload)."""
    try:
        # Convert Pydantic models to dicts for JSON storage
        learning_outcomes_dict = [lo.model_dump() if hasattr(lo, 'model_dump') else lo.dict() for lo in proposal.learning_outcomes] if proposal.learning_outcomes else []
        units_dict = [u.model_dump() if hasattr(u, 'model_dump') else u.dict() for u in proposal.units] if proposal.units else []
        practicals_dict = [p.model_dump() if hasattr(p, 'model_dump') else p.dict() for p in proposal.practicals] if proposal.practicals else []
        teaching_team_dict = [t.model_dump() if hasattr(t, 'model_dump') else t.dict() for t in proposal.teaching_team] if proposal.teaching_team else []
        teacher_objs = []
        teacher_ids = []
        for entry in teaching_team_dict:
            if not isinstance(entry, dict):
                continue
            teacher = upsert_teacher(db, entry)
            db.flush()
            ensure_teacher_career(db, teacher.id, proposal.career)
            teacher_objs.append(teacher)
            teacher_ids.append(teacher.id)
        teaching_team_payload = build_teaching_team_payload(teacher_objs)
        
        generic_items = normalize_competency_items(proposal.generic_competencies_items or [])
        specific_items = normalize_competency_items(proposal.specific_competencies_items or [])

        db_proposal = models.Proposal(
            title=proposal.title,
            career=proposal.career,
            subject=proposal.subject,
            study_plan=proposal.study_plan,
            academic_year=proposal.academic_year,
            year_of_career=proposal.year_of_career,
            quarter=proposal.quarter,
            character=proposal.character,
            regime=proposal.regime,
            theoretical_hours=proposal.theoretical_hours,
            practical_hours=proposal.practical_hours,
            total_hours=proposal.total_hours,
            weekly_hours=proposal.weekly_hours,
            minimum_content=proposal.minimum_content,
            generic_competencies=proposal.generic_competencies or build_competencies_text(generic_items),
            specific_competencies=proposal.specific_competencies or build_competencies_text(specific_items),
            fundamentals_part1=proposal.fundamentals_part1,
            fundamentals_part2=proposal.fundamentals_part2,
            learning_outcomes=learning_outcomes_dict,
            units=units_dict,
            practicals=practicals_dict,
            teaching_team=teaching_team_payload,
            methodology=proposal.methodology,
            evaluation=proposal.evaluation,
            bibliography=proposal.bibliography,
            observations=proposal.observations,
            original_filename="form_submission",
            source_type="manual",
            status=proposal.status or "EnProceso"
        )
        db.add(db_proposal)
        db.flush()
        if teacher_ids:
            replace_proposal_teachers(db, db_proposal.id, teacher_ids)
        if generic_items:
            ensure_competency_catalog(db, proposal.career, generic_items, "generic")
        if specific_items:
            ensure_competency_catalog(db, proposal.career, specific_items, "specific")
        if generic_items:
            replace_proposal_competencies(db, db_proposal.id, generic_items, "generic")
        if specific_items:
            replace_proposal_competencies(db, db_proposal.id, specific_items, "specific")
        db.commit()
        db.refresh(db_proposal)
        return {"id": db_proposal.id, "title": db_proposal.title, "career": db_proposal.career, "subject": db_proposal.subject, "status": db_proposal.status, "created_at": db_proposal.created_at}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating proposal: {str(e)}")


@app.post("/proposals/import-docx")
async def import_proposal_docx(file: UploadFile = File(...)):
    """
    Importa una propuesta desde un archivo DOCX.
    Extrae todos los datos y retorna JSON para previsualización.
    """
    try:
        # Guardar archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Extraer datos del DOCX (pasar filename original para parsing)
            extracted_data = import_proposal_from_docx(tmp_path, file.filename)
            return {
                "success": True,
                "data": extracted_data,
                "preview": {
                    "career": extracted_data.get('career', ''),
                    "subject": extracted_data.get('subject', ''),
                    "teachers": extracted_data.get('teachers', ''),
                    "year": extracted_data.get('year_of_career', ''),
                    "quarter": extracted_data.get('quarter', ''),
                    "total_hours": extracted_data.get('total_hours', ''),
                    "theoretical_hours": extracted_data.get('theoretical_hours', ''),
                    "practical_hours": extracted_data.get('practical_hours', ''),
                    "weekly_hours": extracted_data.get('weekly_hours', ''),
                    "regime": extracted_data.get('regime', ''),
                    "units_count": len(extracted_data.get('units', [])),
                    "practicals_count": len(extracted_data.get('practicals', [])),
                    "ra_count": len(extracted_data.get('learning_outcomes', [])),
                    "generic_comp_count": len(extracted_data.get('generic_competencies', [])),
                    "specific_comp_count": len(extracted_data.get('specific_competencies', [])),
                }
            }
        finally:
            # Limpiar archivo temporal
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error importing DOCX: {str(e)}")
