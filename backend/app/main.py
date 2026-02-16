import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal, init_db
from agents import extract as extract_agent
from openai import OpenAI
import shutil

app = FastAPI(title="TesisMCD API")

# Load environment variables from backend/.env (if present)
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.getenv("LOCAL_UPLOAD_PATH", "./data/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    
    print("✅ Backend startup validation passed")
    print(f"   - OpenAI API Key: configured")
    print(f"   - Database: initialized")
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
        filename=dest_path,
        original_filename=file.filename,
        uploader=uploader,
        career=career,
        subject=subject,
        status="uploaded",
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
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY not set")
        client = OpenAI(api_key=key)
        resp = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}], max_tokens=300)
        suggestion = resp.choices[0].message.content.strip()
        return {"suggestion": suggestion, "evidence_used": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.patch("/proposals/{proposal_id}")
def update_proposal(proposal_id: int, payload: dict, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    # allow updating notes and status
    notes = payload.get("notes")
    status = payload.get("status")
    if notes is not None:
        proposal.notes = notes
    if status is not None:
        proposal.status = status
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


@app.get("/proposals", response_model=list[schemas.ProposalOut])
def list_proposals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    proposals = db.query(models.Proposal).offset(skip).limit(limit).all()
    return proposals
