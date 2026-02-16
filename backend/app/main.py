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

app = FastAPI(title="TesisMCD API")

# Load environment variables from backend/.env (if present)
load_dotenv()

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


def get_openai_client():
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=key)


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
    return proposal


@app.patch("/proposals/{proposal_id}", response_model=schemas.Proposal)
def update_proposal(proposal_id: int, payload: schemas.ProposalUpdate, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)
    
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
    if 'teaching_team' in data and data['teaching_team']:
        data['teaching_team'] = [
            t if isinstance(t, dict) else (t.model_dump() if hasattr(t, 'model_dump') else t.dict())
            for t in data['teaching_team']
        ]
    
    for key, value in data.items():
        setattr(proposal, key, value)
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


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
    return proposals


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
    
    # Normalize quarter to 1, 2, or A
    import re
    quarter_lower = str(quarter_raw).lower()
    if "anual" in quarter_lower or quarter_lower.strip() == "a":
        quarter = "A"
    elif "1" in quarter_lower or "primer" in quarter_lower:
        quarter = "1"
    elif "2" in quarter_lower or "segundo" in quarter_lower:
        quarter = "2"
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
            generic_competencies=proposal.generic_competencies,
            specific_competencies=proposal.specific_competencies,
            fundamentals_part1=proposal.fundamentals_part1,
            fundamentals_part2=proposal.fundamentals_part2,
            learning_outcomes=learning_outcomes_dict,
            units=units_dict,
            practicals=practicals_dict,
            teaching_team=teaching_team_dict,
            methodology=proposal.methodology,
            evaluation=proposal.evaluation,
            bibliography=proposal.bibliography,
            observations=proposal.observations,
            original_filename="form_submission",
            source_type="manual",
            status=proposal.status or "EnProceso"
        )
        db.add(db_proposal)
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
                    "hours": extracted_data.get('hours', ''),
                    "regime": extracted_data.get('regime', ''),
                    "units_count": len(extracted_data.get('units', [])),
                    "practicals_count": len(extracted_data.get('practicals', [])),
                    "ra_count": len(extracted_data.get('learning_outcomes', [])),
                }
            }
        finally:
            # Limpiar archivo temporal
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error importing DOCX: {str(e)}")
