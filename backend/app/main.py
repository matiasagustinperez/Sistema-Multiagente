import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from .database import SessionLocal, init_db
from agents import extract as extract_agent
from .docx_import import import_proposal_from_docx
from openai import OpenAI
import shutil
import tempfile
import unicodedata
import re
import hashlib
import json
import ast
from datetime import datetime
from io import BytesIO
import requests

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

# --- Google Docs import logic and endpoint ---
def get_docx_from_gdoc_url(gdoc_url: str) -> bytes:
    """
    Given a public Google Docs URL, convert to export DOCX and download the file content as bytes.
    """
    # Accept both https://docs.google.com/document/d/ID/edit and https://drive.google.com/open?id=ID
    doc_id = None
    # Try to extract from /d/{id}/
    m = re.search(r"/d/([\w-]+)", gdoc_url)
    if m:
        doc_id = m.group(1)
    else:
        # Try to extract from ?id={id}
        m = re.search(r"[?&]id=([\w-]+)", gdoc_url)
        if m:
            doc_id = m.group(1)
    if not doc_id:
        raise HTTPException(status_code=400, detail="No se pudo extraer el ID del documento de Google Docs.")
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=docx"
    resp = requests.get(export_url)
    if resp.status_code != 200 or not resp.content or resp.headers.get('Content-Type','').find('application/vnd.openxmlformats-officedocument.wordprocessingml.document') == -1:
        raise HTTPException(status_code=400, detail="No se pudo descargar el DOCX desde Google Docs. ¿El documento es público?")
    return resp.content

@app.post("/proposals/import-gdoc-url")
async def import_proposal_gdoc_url(
    url: str = Body(..., embed=True, description="URL pública de Google Docs")
):
    """
    Importa una propuesta desde un Google Docs público (URL), descargando como DOCX y extrayendo los datos.
    Retorna JSON para previsualización.
    """
    try:
        docx_bytes = get_docx_from_gdoc_url(url)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(docx_bytes)
            tmp_path = tmp.name
        try:
            extracted_data = import_proposal_from_docx(tmp_path, "imported_from_gdoc.docx")
            extracted_data["gdoc_url"] = url
            return {
                "success": True,
                "data": extracted_data,
                "gdoc_url": url,
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
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error importando desde Google Docs: {str(e)}")

# Load environment variables from backend/.env (if not already loaded)

UPLOAD_FOLDER = os.getenv("LOCAL_UPLOAD_PATH", "./data/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
TEMPLATE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Template Propuestas.docx"))


class AiPrompt(BaseModel):
    prompt: str


class GdocStatusRequest(BaseModel):
    ids: list[int]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_subject_name(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def normalize_title_name(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def normalize_hash_value(value):
    if isinstance(value, str):
        return re.sub(r"\s+", " ", value.strip())
    if isinstance(value, list):
        return [normalize_hash_value(item) for item in value]
    if isinstance(value, dict):
        return {key: normalize_hash_value(value[key]) for key in sorted(value.keys())}
    return value


def compute_payload_hash(payload: dict) -> str:
    normalized = normalize_hash_value(payload)
    encoded = json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def extract_gdoc_payload(gdoc_url: str) -> tuple[str, str, str, dict]:
    docx_bytes = get_docx_from_gdoc_url(gdoc_url)
    extracted_subject = ""
    extracted_title = ""
    extracted_payload: dict = {}
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp.write(docx_bytes)
        tmp_path = tmp.name
    try:
        extracted_payload = import_proposal_from_docx(tmp_path, "imported_from_gdoc.docx")
        extracted_subject = extracted_payload.get("subject") or ""
        extracted_title = extracted_payload.get("title") or ""
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    doc_hash = compute_payload_hash(build_extracted_snapshot(extracted_payload))
    return extracted_subject, extracted_title, doc_hash, extracted_payload


def extract_drive_folder_id(url_or_id: str | None) -> str | None:
    raw = str(url_or_id or "").strip()
    if not raw:
        return None
    folder_match = re.search(r"/folders/([\w-]+)", raw)
    if folder_match:
        return folder_match.group(1)
    query_match = re.search(r"[?&]id=([\w-]+)", raw)
    if query_match:
        return query_match.group(1)
    if re.fullmatch(r"[\w-]+", raw):
        return raw
    return None


def load_gcp_service_account_info() -> dict:
    raw = (os.getenv("GCP_SERVICE_ACCOUNT_JSON") or "").strip()
    if not raw:
        raise HTTPException(status_code=500, detail="Falta configurar GCP_SERVICE_ACCOUNT_JSON en backend/.env")

    if os.path.exists(raw):
        try:
            with open(raw, "r", encoding="utf-8") as handler:
                return json.load(handler)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"No se pudo leer el archivo de service account: {exc}")

    try:
        return json.loads(raw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"GCP_SERVICE_ACCOUNT_JSON inválido: {exc}")


def load_google_oauth_user_credentials(required: bool = False):
    client_id = (os.getenv("GOOGLE_OAUTH_CLIENT_ID") or "").strip()
    client_secret = (os.getenv("GOOGLE_OAUTH_CLIENT_SECRET") or "").strip()
    refresh_token = (os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN") or "").strip()
    access_token = (os.getenv("GOOGLE_OAUTH_ACCESS_TOKEN") or "").strip() or None
    token_uri = (os.getenv("GOOGLE_OAUTH_TOKEN_URI") or "https://oauth2.googleapis.com/token").strip()

    has_any = any([client_id, client_secret, refresh_token, access_token])
    has_required = bool(client_id and client_secret and refresh_token)

    if not has_required:
        if required:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Modo OAuth de usuario activo, pero faltan variables: "
                    "GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN"
                ),
            )
        if has_any:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Configuración OAuth de usuario incompleta. Debes definir: "
                    "GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN"
                ),
            )
        return None

    try:
        from google.oauth2.credentials import Credentials
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Faltan dependencias para OAuth de Google. Instala google-auth y google-api-python-client",
        )

    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/drive"],
    )


def get_google_drive_service():
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Faltan dependencias de Google Drive. Instala google-api-python-client y google-auth",
        )

    auth_mode = (os.getenv("GDRIVE_AUTH_MODE") or "auto").strip().lower()
    oauth_aliases = {"oauth", "oauth-user", "user"}
    service_aliases = {"service-account", "service", "sa"}

    def build_service(credentials):
        return build("drive", "v3", credentials=credentials)

    if auth_mode in oauth_aliases:
        oauth_credentials = load_google_oauth_user_credentials(required=True)
        try:
            return build_service(oauth_credentials)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"No se pudo inicializar Google Drive API (OAuth usuario): {exc}")

    if auth_mode in service_aliases:
        service_account_info = load_gcp_service_account_info()
        try:
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=["https://www.googleapis.com/auth/drive"],
            )
            return build_service(credentials)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"No se pudo inicializar Google Drive API (Service Account): {exc}")

    oauth_error = None
    service_error = None

    try:
        oauth_credentials = load_google_oauth_user_credentials(required=False)
        if oauth_credentials is not None:
            return build_service(oauth_credentials)
    except HTTPException as exc:
        oauth_error = exc.detail
    except Exception as exc:
        oauth_error = str(exc)

    try:
        service_account_info = load_gcp_service_account_info()
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/drive"],
        )
        return build_service(credentials)
    except HTTPException as exc:
        service_error = exc.detail
    except Exception as exc:
        service_error = str(exc)

    raise HTTPException(
        status_code=500,
        detail=(
            "No se pudo inicializar Google Drive API. "
            f"OAuth usuario: {oauth_error or 'no configurado'}. "
            f"Service Account: {service_error or 'no configurado'}."
        ),
    )


@app.get("/drive-auth-debug")
def drive_auth_debug():
    service = get_google_drive_service()
    try:
        about = service.about().get(
            fields="user(displayName,emailAddress),storageQuota(limit,usage,usageInDrive,usageInDriveTrash)"
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"No se pudo consultar datos de Drive: {exc}")

    user = about.get("user") or {}
    quota = about.get("storageQuota") or {}

    def to_int(value):
        try:
            return int(value)
        except Exception:
            return None

    return {
        "auth_mode": (os.getenv("GDRIVE_AUTH_MODE") or "auto").strip().lower(),
        "user": {
            "display_name": user.get("displayName"),
            "email": user.get("emailAddress"),
        },
        "storage_quota": {
            "limit": to_int(quota.get("limit")),
            "usage": to_int(quota.get("usage")),
            "usage_in_drive": to_int(quota.get("usageInDrive")),
            "usage_in_drive_trash": to_int(quota.get("usageInDriveTrash")),
        },
        "raw": about,
    }


def resolve_drive_settings_for_proposal(db: Session, proposal: models.Proposal) -> models.DriveSettings | None:
    if not proposal.career:
        return None

    study_plan = (proposal.study_plan or "").strip()
    if study_plan:
        scoped = db.query(models.DriveSettings).filter(
            models.DriveSettings.career == proposal.career,
            models.DriveSettings.plan_name == study_plan,
        ).first()
        if scoped:
            return scoped

    return db.query(models.DriveSettings).filter(
        models.DriveSettings.career == proposal.career,
        models.DriveSettings.plan_name.is_(None),
    ).first()


def build_proposal_docx_filename(proposal: models.Proposal) -> str:
    year = proposal.year_of_career or "0"
    quarter_raw = proposal.quarter or "0"
    subject = proposal.subject or proposal.title or "Sin_Asignatura"

    quarter_lower = str(quarter_raw).lower()
    if "anual" in quarter_lower or quarter_lower.strip() == "a":
        quarter = "A"
    elif "1" in quarter_lower or "primer" in quarter_lower:
        quarter = "1°"
    elif "2" in quarter_lower or "segundo" in quarter_lower:
        quarter = "2°"
    else:
        quarter = quarter_raw

    subject_clean = re.sub(r'[<>:"/\\|?*]', '', subject)
    year_display = f"{year}°" if str(year).strip() else "0°"
    return f"{year_display}_{quarter} - {subject_clean}.docx"


@app.post("/proposals/{proposal_id}/validate-gdoc")
def validate_proposal_gdoc(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not proposal.gdoc_url:
        proposal.gdoc_status = "missing"
        proposal.gdoc_last_checked = datetime.utcnow()
        db.add(proposal)
        db.commit()
        return {"status": "missing", "message": "La propuesta no tiene enlace de Google Docs."}

    try:
        extracted_subject, extracted_title, doc_hash, _ = extract_gdoc_payload(proposal.gdoc_url)
    except HTTPException:
        proposal.gdoc_url = None
        proposal.gdoc_status = "lost"
        proposal.gdoc_last_checked = datetime.utcnow()
        db.add(proposal)
        db.commit()
        return {
            "status": "missing",
            "message": "No se pudo acceder al documento de Google Docs. Se eliminó el enlace.",
            "gdoc_url": None,
        }

    extracted_name = extracted_subject or extracted_title
    if not extracted_name:
        proposal.gdoc_url = None
        proposal.gdoc_status = "lost"
        proposal.gdoc_last_checked = datetime.utcnow()
        db.add(proposal)
        db.commit()
        return {
            "status": "mismatch",
            "message": "No se pudo identificar la asignatura en el documento. Se eliminó el enlace.",
            "gdoc_url": None,
        }

    if proposal.subject and extracted_name:
        if normalize_subject_name(proposal.subject) != normalize_subject_name(extracted_name):
            proposal.gdoc_url = None
            proposal.gdoc_status = "lost"
            proposal.gdoc_last_checked = datetime.utcnow()
            db.add(proposal)
            db.commit()
            return {
                "status": "mismatch",
                "message": "El documento no coincide con la propuesta. Se eliminó el enlace.",
                "gdoc_url": None,
                "extracted_subject": extracted_subject,
                "extracted_title": extracted_title,
            }

    if proposal.title and (extracted_title or extracted_subject):
        compare_value = extracted_title or extracted_subject
        if normalize_title_name(proposal.title) != normalize_title_name(compare_value):
            proposal.gdoc_url = None
            proposal.gdoc_status = "lost"
            proposal.gdoc_last_checked = datetime.utcnow()
            db.add(proposal)
            db.commit()
            return {
                "status": "mismatch",
                "message": "El documento no coincide con el título de la propuesta. Se eliminó el enlace.",
                "gdoc_url": None,
                "extracted_subject": extracted_subject,
                "extracted_title": extracted_title,
            }

    proposal.gdoc_last_checked = datetime.utcnow()

    if not proposal.gdoc_hash or not proposal.gdoc_last_synced:
        proposal.gdoc_hash = doc_hash
        if not proposal.gdoc_last_synced:
            proposal.gdoc_last_synced = proposal.gdoc_last_checked
        proposal.gdoc_status = "ok"
        db.add(proposal)
        db.commit()
        return {
            "status": "ok",
            "message": "Enlace válido.",
            "gdoc_url": proposal.gdoc_url,
            "extracted_subject": extracted_subject or None,
            "extracted_title": extracted_title or None,
            "gdoc_hash": proposal.gdoc_hash,
            "gdoc_last_checked": proposal.gdoc_last_checked,
            "gdoc_last_synced": proposal.gdoc_last_synced,
        }

    if proposal.gdoc_hash != doc_hash:
        proposal.gdoc_status = "updated"
        db.add(proposal)
        db.commit()
        return {
            "status": "updated",
            "message": "El documento fue actualizado en Google Docs.",
            "gdoc_url": proposal.gdoc_url,
            "extracted_subject": extracted_subject or None,
            "extracted_title": extracted_title or None,
            "new_hash": doc_hash,
            "gdoc_last_checked": proposal.gdoc_last_checked,
            "gdoc_last_synced": proposal.gdoc_last_synced,
        }

    proposal.gdoc_status = "ok"
    db.add(proposal)
    db.commit()
    return {
        "status": "ok",
        "message": "Enlace válido.",
        "gdoc_url": proposal.gdoc_url,
        "extracted_subject": extracted_subject or None,
        "extracted_title": extracted_title or None,
        "gdoc_hash": proposal.gdoc_hash,
        "gdoc_last_checked": proposal.gdoc_last_checked,
        "gdoc_last_synced": proposal.gdoc_last_synced,
    }


@app.post("/proposals/{proposal_id}/link-gdoc")
def link_proposal_gdoc(
    proposal_id: int,
    url: str = Body(..., embed=True, description="URL pública de Google Docs"),
    db: Session = Depends(get_db),
):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not url or not str(url).strip():
        raise HTTPException(status_code=400, detail="URL de Google Docs requerida")

    extracted_subject, extracted_title, doc_hash, _ = extract_gdoc_payload(url)
    extracted_name = extracted_subject or extracted_title
    if not extracted_name:
        raise HTTPException(status_code=400, detail="No se pudo identificar la asignatura en el documento")

    if proposal.subject and normalize_subject_name(proposal.subject) != normalize_subject_name(extracted_name):
        raise HTTPException(status_code=400, detail="El documento no coincide con la propuesta")

    if proposal.title and (extracted_title or extracted_subject):
        compare_value = extracted_title or extracted_subject
        if normalize_title_name(proposal.title) != normalize_title_name(compare_value):
            raise HTTPException(status_code=400, detail="El documento no coincide con el título de la propuesta")

    proposal.gdoc_url = url
    proposal.source_type = "gdoc"
    proposal.gdoc_hash = doc_hash
    proposal.gdoc_last_checked = datetime.utcnow()
    proposal.gdoc_last_synced = proposal.gdoc_last_checked
    proposal.gdoc_status = "ok"
    db.add(proposal)
    db.commit()
    return {
        "status": "linked",
        "gdoc_url": proposal.gdoc_url,
        "extracted_subject": extracted_subject or None,
        "extracted_title": extracted_title or None,
    }


@app.post("/proposals/{proposal_id}/unlink-gdoc")
def unlink_proposal_gdoc(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    proposal.gdoc_url = None
    proposal.gdoc_status = "missing"
    proposal.gdoc_last_checked = datetime.utcnow()
    db.add(proposal)
    db.commit()
    return {"status": "unlinked", "gdoc_url": None}


def try_create_gdoc_for_proposal(db: Session, proposal: models.Proposal) -> tuple[bool, str | None]:
    """
    Intenta crear un GDoc para una propuesta existente.
    Retorna True si se crea exitosamente, False si falla (no lanza excepción).
    """
    if not proposal:
        return False, "proposal-not-found"
    if proposal.gdoc_url:
        return True, None
    
    if not os.path.exists(TEMPLATE_PATH):
        return False, "template-not-found"

    settings = resolve_drive_settings_for_proposal(db, proposal)
    if not settings or not settings.root_folder_url:
        return False, "drive-settings-missing"

    folder_id = extract_drive_folder_id(settings.root_folder_url)
    if not folder_id:
        return False, "drive-folder-invalid"

    try:
        from googleapiclient.http import MediaFileUpload
        from googleapiclient.errors import HttpError
        from .docx_export import generate_proposal_docx
    except ImportError:
        return False, "drive-dependencies-missing"

    try:
        drive_service = get_google_drive_service()
        output_path = generate_proposal_docx(proposal, TEMPLATE_PATH)
        output_dir = os.path.dirname(output_path)
        
        try:
            filename = build_proposal_docx_filename(proposal)
            file_title = filename[:-5] if filename.lower().endswith(".docx") else filename
            media = MediaFileUpload(
                output_path,
                mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                resumable=False,
            )

            created = drive_service.files().create(
                body={
                    "name": file_title,
                    "mimeType": "application/vnd.google-apps.document",
                    "parents": [folder_id]
                },
                media_body=media,
                fields="id, webViewLink, parents",
                supportsAllDrives=True,
            ).execute()

            gdoc_id = created.get("id")
            if gdoc_id:
                gdoc_url = f"https://docs.google.com/document/d/{gdoc_id}/edit"
                # Extract new hash
                _, _, new_hash, _ = extract_gdoc_payload(gdoc_url)
                # Update proposal with GDoc info
                proposal.gdoc_url = gdoc_url
                proposal.gdoc_hash = new_hash
                proposal.gdoc_last_synced = datetime.utcnow()
                proposal.gdoc_last_checked = datetime.utcnow()
                proposal.gdoc_status = "ok"
                proposal.source_type = "gdoc"
                db.add(proposal)
                db.flush()
                return True, None
        finally:
            shutil.rmtree(output_dir, ignore_errors=True)
    except Exception as exc:
        return False, str(exc)

    return False, "drive-create-failed"


@app.post("/proposals/{proposal_id}/create-gdoc", response_model=schemas.Proposal)
def create_proposal_gdoc(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.gdoc_url:
        return build_proposal_response(db, proposal)

    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(status_code=500, detail="Template Propuestas.docx not found")

    settings = resolve_drive_settings_for_proposal(db, proposal)
    if not settings or not settings.root_folder_url:
        raise HTTPException(
            status_code=400,
            detail="No hay carpeta raíz de Drive configurada para esta carrera/plan",
        )

    folder_id = extract_drive_folder_id(settings.root_folder_url)
    if not folder_id:
        raise HTTPException(status_code=400, detail="La URL de Carpeta Raíz (Drive) es inválida")

    try:
        from googleapiclient.http import MediaFileUpload
        from .docx_export import generate_proposal_docx
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Faltan dependencias para generar/subir DOCX. Verifica python-docx y google-api-python-client",
        )

    drive_service = get_google_drive_service()
    output_path = generate_proposal_docx(proposal, TEMPLATE_PATH)
    output_dir = os.path.dirname(output_path)
    try:
        from googleapiclient.errors import HttpError

        filename = build_proposal_docx_filename(proposal)
        file_title = filename[:-5] if filename.lower().endswith(".docx") else filename
        media = MediaFileUpload(
            output_path,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            resumable=False,
        )

        def extract_google_error(exc: Exception) -> tuple[int | None, list[str], str]:
            status_code = None
            reasons: list[str] = []
            message = str(exc)
            if isinstance(exc, HttpError):
                status_code = getattr(exc.resp, "status", None)
                content = getattr(exc, "content", None)
                if content:
                    try:
                        payload = json.loads(content.decode("utf-8") if isinstance(content, (bytes, bytearray)) else str(content))
                        err = payload.get("error") if isinstance(payload, dict) else None
                        if isinstance(err, dict):
                            parsed_message = err.get("message")
                            if parsed_message:
                                message = str(parsed_message)
                            parsed_reasons = err.get("errors")
                            if isinstance(parsed_reasons, list):
                                reasons = [str(item.get("reason")) for item in parsed_reasons if isinstance(item, dict) and item.get("reason")]
                    except Exception:
                        pass
            return status_code, reasons, message

        def create_google_doc(target_folder_id: str | None):
            body = {
                "name": file_title,
                "mimeType": "application/vnd.google-apps.document",
            }
            if target_folder_id:
                body["parents"] = [target_folder_id]
            return drive_service.files().create(
                body=body,
                media_body=media,
                fields="id, webViewLink, parents",
                supportsAllDrives=True,
            ).execute()

        try:
            created = create_google_doc(folder_id)
        except Exception as first_exc:
            status_code, reasons, message = extract_google_error(first_exc)
            lower_message = message.lower()
            has_quota_error = "storagequotaexceeded" in lower_message or "drive storage quota" in lower_message or "storageQuotaExceeded" in reasons

            if has_quota_error:
                raise HTTPException(
                    status_code=507,
                    detail="No se pudo crear el documento: la cuota de almacenamiento de la cuenta autenticada en Google Drive está excedida.",
                )

            # Fallback probado: crear primero en raíz y luego mover a carpeta destino.
            try:
                created = create_google_doc(None)
                doc_id_for_move = created.get("id")
                if doc_id_for_move and folder_id:
                    try:
                        current_parents = created.get("parents") or []
                        remove_parents = ",".join([parent for parent in current_parents if parent and parent != folder_id])
                        move_kwargs = {
                            "fileId": doc_id_for_move,
                            "addParents": folder_id,
                            "fields": "id, webViewLink, parents",
                            "supportsAllDrives": True,
                        }
                        if remove_parents:
                            move_kwargs["removeParents"] = remove_parents
                        created = drive_service.files().update(**move_kwargs).execute()
                    except Exception:
                        # Si no se puede mover, igual dejamos el documento creado y vinculado.
                        pass
            except Exception as fallback_exc:
                fb_status, fb_reasons, fb_message = extract_google_error(fallback_exc)
                fb_lower = fb_message.lower()
                if "storagequotaexceeded" in fb_lower or "drive storage quota" in fb_lower or "storageQuotaExceeded" in fb_reasons:
                    raise HTTPException(
                        status_code=507,
                        detail="No se pudo crear el documento: la cuota de almacenamiento de la cuenta autenticada en Google Drive está excedida.",
                    )
                status_text = f"{fb_status}" if fb_status is not None else "unknown"
                reason_text = ", ".join(fb_reasons) if fb_reasons else "none"
                raise HTTPException(
                    status_code=502,
                    detail=f"Error al crear el documento en Google Drive (status={status_text}, reasons={reason_text}): {fb_message}",
                )
    except HTTPException:
        raise
    except Exception as exc:
        raw_message = str(exc)
        raise HTTPException(
            status_code=502,
            detail=f"Error al crear el documento en Google Drive: {raw_message}",
        )

    try:

        doc_id = created.get("id")
        if not doc_id:
            raise HTTPException(status_code=500, detail="Google Drive no devolvió el ID del documento creado")

        gdoc_url = created.get("webViewLink") or f"https://docs.google.com/document/d/{doc_id}/edit"
        now = datetime.utcnow()
        proposal.gdoc_url = gdoc_url
        proposal.source_type = "gdoc"
        proposal.gdoc_last_checked = now
        proposal.gdoc_last_synced = now
        proposal.gdoc_status = "ok"
        try:
            _, _, extracted_hash, _ = extract_gdoc_payload(gdoc_url)
            proposal.gdoc_hash = extracted_hash
        except Exception:
            proposal.gdoc_hash = compute_payload_hash(build_extracted_snapshot(build_proposal_snapshot(db, proposal)))
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        return build_proposal_response(db, proposal)
    finally:
        shutil.rmtree(output_dir, ignore_errors=True)


@app.post("/proposals/gdoc-status")
def get_gdoc_statuses(request: GdocStatusRequest, db: Session = Depends(get_db)):
    ids = request.ids or []
    if not ids:
        return {"statuses": {}}

    proposals = db.query(models.Proposal).filter(models.Proposal.id.in_(ids)).all()
    statuses: dict[int, dict] = {}
    now = datetime.utcnow()
    has_updates = False

    for proposal in proposals:
        status = "missing"
        if proposal.gdoc_url:
            try:
                _, _, doc_hash, _ = extract_gdoc_payload(proposal.gdoc_url)
            except HTTPException:
                status = "lost"
            else:
                if not proposal.gdoc_hash:
                    proposal.gdoc_hash = doc_hash
                    proposal.gdoc_last_synced = proposal.gdoc_last_synced or now
                    has_updates = True
                elif proposal.gdoc_hash != doc_hash:
                    status = "updated"
                else:
                    status = "ok"
                proposal.gdoc_last_checked = now
                has_updates = True
        else:
            if proposal.source_type == "gdoc":
                status = "lost"
            else:
                status = "missing"

        proposal.gdoc_status = status
        proposal.gdoc_last_checked = proposal.gdoc_last_checked or now
        has_updates = True

        statuses[proposal.id] = {"status": status}

    if has_updates:
        db.add_all(proposals)
        db.commit()

    return {"statuses": statuses}


@app.post("/proposals/{proposal_id}/gdoc-accept-latest")
def accept_latest_gdoc(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not proposal.gdoc_url:
        raise HTTPException(status_code=400, detail="La propuesta no tiene enlace de Google Docs")

    _, _, doc_hash, _ = extract_gdoc_payload(proposal.gdoc_url)
    proposal.gdoc_hash = doc_hash
    proposal.gdoc_last_checked = datetime.utcnow()
    proposal.gdoc_last_synced = proposal.gdoc_last_checked
    proposal.gdoc_status = "ok"
    db.add(proposal)
    db.commit()
    return {"status": "ok", "gdoc_hash": proposal.gdoc_hash}


def apply_extracted_payload_to_proposal(db: Session, proposal: models.Proposal, payload: dict) -> None:
    def has_text(value) -> bool:
        return isinstance(value, str) and value.strip() != ""

    def has_items(value) -> bool:
        return isinstance(value, list) and len(value) > 0

    def normalize_learning_outcomes_for_storage(items) -> list[dict]:
        normalized: list[dict] = []
        for idx, item in enumerate(items or []):
            if isinstance(item, dict):
                description = str(item.get("description") or item.get("descripcion") or "").strip()
                observable_verb = str(item.get("observable_verb") or item.get("verbo_observable") or "").strip()
            else:
                description = str(item or "").strip()
                observable_verb = ""
            if not description:
                continue
            normalized.append({
                "id": idx + 1,
                "description": description,
                "observable_verb": observable_verb,
            })
        return normalized

    def normalize_units_for_storage(items) -> list[dict]:
        normalized: list[dict] = []
        for idx, item in enumerate(items or []):
            if not isinstance(item, dict):
                continue
            name = str(
                item.get("name")
                or item.get("nombre")
                or item.get("title")
                or item.get("titulo")
                or ""
            ).strip()
            content = str(item.get("content") or item.get("contenidos") or item.get("contents") or "").strip()
            bibliography_basic = str(
                item.get("bibliography_basic")
                or item.get("bib_basica")
                or item.get("bib_basic")
                or item.get("bibliografia_basica")
                or ""
            ).strip()
            bibliography_complementary = str(
                item.get("bibliography_complementary")
                or item.get("bib_complementaria")
                or item.get("bib_comp")
                or item.get("bibliografia_complementaria")
                or ""
            ).strip()
            if not (name or content or bibliography_basic or bibliography_complementary):
                continue
            normalized.append(
                {
                    "id": idx + 1,
                    "name": name,
                    "content": content,
                    "bibliography_basic": bibliography_basic,
                    "bibliography_complementary": bibliography_complementary,
                }
            )
        return normalized

    def normalize_practicals_for_storage(items) -> list[dict]:
        normalized: list[dict] = []
        for idx, item in enumerate(items or []):
            if not isinstance(item, dict):
                continue
            number = str(item.get("number") or item.get("numero") or idx + 1).strip()
            name = str(item.get("name") or item.get("nombre") or "").strip()
            objective = str(item.get("objective") or item.get("objetivo") or "").strip()
            activities = str(item.get("activities") or item.get("actividades") or "").strip()
            materials = str(item.get("materials") or item.get("materiales") or "").strip()
            scope = str(item.get("scope") or item.get("ambito") or "").strip()
            if not (name or objective or activities or materials or scope):
                continue
            normalized.append(
                {
                    "id": idx + 1,
                    "number": number,
                    "name": name,
                    "objective": objective,
                    "activities": activities,
                    "materials": materials,
                    "scope": scope,
                }
            )
        return normalized

    proposal.career = payload.get("career") or proposal.career
    proposal.subject = payload.get("subject") or proposal.subject
    proposal.study_plan = payload.get("study_plan") or proposal.study_plan
    proposal.academic_year = payload.get("academic_year") or proposal.academic_year
    proposal.year_of_career = payload.get("year_of_career") or proposal.year_of_career
    payload_quarter = payload.get("quarter")
    proposal.quarter = normalize_term_name(payload_quarter) if payload_quarter else proposal.quarter
    proposal.character = payload.get("character") or proposal.character
    proposal.regime = payload.get("regime") or proposal.regime
    proposal.total_hours = parse_int(payload.get("total_hours"), proposal.total_hours)
    proposal.theoretical_hours = parse_int(payload.get("theoretical_hours"), proposal.theoretical_hours)
    proposal.practical_hours = parse_int(payload.get("practical_hours"), proposal.practical_hours)
    proposal.weekly_hours = parse_int(payload.get("weekly_hours"), proposal.weekly_hours)
    minimum_content = payload.get("minimum_content")
    if has_text(minimum_content):
        proposal.minimum_content = minimum_content

    fundamentals_part1 = payload.get("importance")
    if has_text(fundamentals_part1):
        proposal.fundamentals_part1 = fundamentals_part1

    fundamentals_part2 = payload.get("professional_profile")
    if has_text(fundamentals_part2):
        proposal.fundamentals_part2 = fundamentals_part2

    methodology = payload.get("methodology")
    if has_text(methodology):
        proposal.methodology = methodology

    evaluation = payload.get("evaluation")
    if has_text(evaluation):
        proposal.evaluation = evaluation

    bibliography = payload.get("bibliography")
    if has_text(bibliography):
        proposal.bibliography = bibliography

    observations = payload.get("observations")
    if has_text(observations):
        proposal.observations = observations

    learning_outcomes = normalize_learning_outcomes_for_storage(payload.get("learning_outcomes"))
    if has_items(learning_outcomes):
        proposal.learning_outcomes = learning_outcomes

    units = normalize_units_for_storage(payload.get("units"))
    if has_items(units):
        has_rich_unit_data = any(
            bool((unit.get("content") or "").strip())
            or bool((unit.get("bibliography_basic") or "").strip())
            or bool((unit.get("bibliography_complementary") or "").strip())
            for unit in units
        )
        existing_units = proposal.units or []
        if has_rich_unit_data or not existing_units:
            proposal.units = units

    practicals = normalize_practicals_for_storage(payload.get("practicals"))
    if has_items(practicals):
        proposal.practicals = practicals

    teaching_team = payload.get("teaching_team")
    if isinstance(teaching_team, list):
        teacher_objs = []
        teacher_ids = []
        for entry in teaching_team:
            if not isinstance(entry, dict):
                continue
            teacher = upsert_teacher(db, entry)
            if teacher:
                db.flush()
                ensure_teacher_career(db, teacher.id, proposal.career)
                teacher_objs.append(teacher)
                teacher_ids.append(teacher.id)
        if teacher_ids:
            replace_proposal_teachers(db, proposal.id, teacher_ids)
        proposal.teaching_team = build_teaching_team_payload(teacher_objs)

    generic_items = normalize_competency_items(payload.get("generic_competencies") or [])
    specific_items = normalize_competency_items(payload.get("specific_competencies") or [])
    if generic_items:
        proposal.generic_competencies = build_competencies_text(generic_items)
        ensure_competency_catalog(db, proposal.career, generic_items, "generic", proposal.study_plan)
        replace_proposal_competencies(db, proposal.id, generic_items, "generic")
    if specific_items:
        proposal.specific_competencies = build_competencies_text(specific_items)
        ensure_competency_catalog(db, proposal.career, specific_items, "specific", proposal.study_plan)
        replace_proposal_competencies(db, proposal.id, specific_items, "specific")

    sync_subject_from_proposal(db, proposal)


def build_proposal_snapshot(db: Session, proposal: models.Proposal) -> dict:
    competencies = get_proposal_competencies(db, proposal.id)
    return {
        "minimum_content": proposal.minimum_content or "",
        "importance": proposal.fundamentals_part1 or "",
        "professional_profile": proposal.fundamentals_part2 or "",
        "learning_outcomes": normalize_learning_outcomes(proposal.learning_outcomes or []),
        "units": normalize_unit_items(proposal.units or []),
        "practicals": normalize_practical_items(proposal.practicals or []),
        "teaching_team": normalize_teaching_team_items(proposal.teaching_team or []),
        "methodology": proposal.methodology or "",
        "evaluation": proposal.evaluation or "",
        "generic_competencies": normalize_competency_items(competencies.get("generic") or []),
        "specific_competencies": normalize_competency_items(competencies.get("specific") or []),
    }


def build_extracted_snapshot(payload: dict) -> dict:
    return {
        "minimum_content": payload.get("minimum_content") or "",
        "importance": payload.get("importance") or "",
        "professional_profile": payload.get("professional_profile") or "",
        "learning_outcomes": normalize_learning_outcomes(payload.get("learning_outcomes") or []),
        "units": normalize_unit_items(payload.get("units") or []),
        "practicals": normalize_practical_items(payload.get("practicals") or []),
        "teaching_team": normalize_teaching_team_items(payload.get("teaching_team") or []),
        "methodology": payload.get("methodology") or "",
        "evaluation": payload.get("evaluation") or "",
        "generic_competencies": normalize_competency_items(payload.get("generic_competencies") or []),
        "specific_competencies": normalize_competency_items(payload.get("specific_competencies") or []),
    }


def format_diff_value(value) -> str:
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return "\n".join([item for item in value if item])
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value or "")


def normalize_list_items(items: list, drop_keys: set[str] | None = None) -> list:
    drop_keys = drop_keys or set()
    normalized = []
    for item in items or []:
        if isinstance(item, dict):
            cleaned = {key: item.get(key) for key in item.keys() if key not in drop_keys}
            normalized.append(cleaned)
        else:
            normalized.append(item)
    return normalized


def normalize_snapshot_text(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def normalize_unit_items(items: list) -> list[dict]:
    normalized: list[dict] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "name": normalize_snapshot_text(item.get("name")),
                "content": normalize_snapshot_text(item.get("content") or item.get("contenidos")),
                "bibliography_basic": normalize_snapshot_text(
                    item.get("bibliography_basic") or item.get("bib_basica") or item.get("bib_basic")
                ),
                "bibliography_complementary": normalize_snapshot_text(
                    item.get("bibliography_complementary") or item.get("bib_complementaria") or item.get("bib_comp")
                ),
            }
        )
    return normalized


def normalize_practical_items(items: list) -> list[dict]:
    normalized: list[dict] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "number": normalize_snapshot_text(item.get("number") or item.get("numero")),
                "name": normalize_snapshot_text(item.get("name") or item.get("nombre")),
                "objective": normalize_snapshot_text(item.get("objective") or item.get("objetivo")),
                "activities": normalize_snapshot_text(item.get("activities") or item.get("actividades")),
                "materials": normalize_snapshot_text(item.get("materials") or item.get("materiales")),
                "scope": normalize_snapshot_text(item.get("scope") or item.get("ambito")),
            }
        )
    return normalized


def normalize_teaching_team_items(items: list) -> list[dict]:
    normalized: list[dict] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "name": re.sub(r"\s+", " ", str(item.get("name") or item.get("nombre") or "").strip()),
                "email": re.sub(r"\s+", " ", str(item.get("email") or item.get("correo") or "").strip().lower()),
                "category": re.sub(r"\s+", " ", str(item.get("category") or item.get("categoria") or "").strip()),
            }
        )
    normalized.sort(key=lambda value: (value.get("name") or "", value.get("email") or "", value.get("category") or ""))
    return normalized


def normalize_learning_outcomes(items: list) -> list[str]:
    normalized = []
    for item in items or []:
        if isinstance(item, dict):
            value = item.get("description") or item.get("descripcion") or ""
        else:
            value = str(item)
        normalized.append(re.sub(r"\s+", " ", value).strip())
    return normalized


@app.get("/proposals/{proposal_id}/gdoc-diff")
def get_gdoc_diff(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not proposal.gdoc_url:
        raise HTTPException(status_code=400, detail="La propuesta no tiene enlace de Google Docs")

    extracted_subject, extracted_title, doc_hash, extracted_payload = extract_gdoc_payload(proposal.gdoc_url)
    current_snapshot = build_proposal_snapshot(db, proposal)
    latest_snapshot = build_extracted_snapshot(extracted_payload)

    labels = {
        "teaching_team": "Equipo docente",
        "minimum_content": "Contenidos mínimos",
        "importance": "Importancia",
        "professional_profile": "Perfil profesional",
        "learning_outcomes": "Resultados de aprendizaje",
        "units": "Unidades",
        "practicals": "Trabajos prácticos",
        "generic_competencies": "Competencias genéricas",
        "specific_competencies": "Competencias específicas",
        "methodology": "Metodología",
        "evaluation": "Evaluación",
    }

    review_required_keys = {"minimum_content", "teaching_team"}

    changes = {}
    for key, label in labels.items():
        current_val = current_snapshot.get(key)
        latest_val = latest_snapshot.get(key)
        if compute_payload_hash({"value": current_val}) != compute_payload_hash({"value": latest_val}):
            changes[key] = {
                "label": label,
                "current": current_val,
                "latest": latest_val,
                "current_display": format_diff_value(current_val),
                "latest_display": format_diff_value(latest_val),
                "review_required": key in review_required_keys,
            }

    return {
        "current": current_snapshot,
        "latest": latest_snapshot,
        "changes": changes,
        "extracted_subject": extracted_subject or None,
        "extracted_title": extracted_title or None,
        "gdoc_hash": doc_hash,
    }


@app.post("/proposals/{proposal_id}/sync-gdoc", response_model=schemas.Proposal)
def sync_proposal_gdoc(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not proposal.gdoc_url:
        raise HTTPException(status_code=400, detail="La propuesta no tiene enlace de Google Docs")

    extracted_subject, extracted_title, doc_hash, extracted_payload = extract_gdoc_payload(proposal.gdoc_url)
    extracted_name = extracted_subject or extracted_title
    if not extracted_name:
        raise HTTPException(status_code=400, detail="No se pudo identificar la asignatura en el documento")

    if proposal.subject and normalize_subject_name(proposal.subject) != normalize_subject_name(extracted_name):
        raise HTTPException(status_code=400, detail="El documento no coincide con la propuesta")

    if proposal.title and (extracted_title or extracted_subject):
        compare_value = extracted_title or extracted_subject
        if normalize_title_name(proposal.title) != normalize_title_name(compare_value):
            raise HTTPException(status_code=400, detail="El documento no coincide con el título de la propuesta")

    apply_extracted_payload_to_proposal(db, proposal, extracted_payload)
    proposal.gdoc_hash = doc_hash
    proposal.gdoc_last_checked = datetime.utcnow()
    proposal.gdoc_last_synced = proposal.gdoc_last_checked
    proposal.gdoc_status = "ok"
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return build_proposal_response(db, proposal)


@app.get("/proposals/{proposal_id}/local-diff")
def get_local_diff(proposal_id: int, db: Session = Depends(get_db)):
    """
    Detecta cambios locales comparando el snapshot actual con el GDoc actual.
    Similar a gdoc-diff, pero muestra qué cambió EN LOCAL para enviarlo a GDoc.
    """
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if not proposal.gdoc_url:
        raise HTTPException(status_code=400, detail="La propuesta no tiene enlace de Google Docs configurado")

    extracted_subject, extracted_title, doc_hash, extracted_payload = extract_gdoc_payload(proposal.gdoc_url)
    
    # Snapshot actual en local
    local_snapshot = build_proposal_snapshot(db, proposal)
    # Snapshot del GDoc actual
    gdoc_snapshot = build_extracted_snapshot(extracted_payload)

    labels = {
        "teaching_team": "Equipo docente",
        "minimum_content": "Contenidos mínimos",
        "importance": "Importancia",
        "professional_profile": "Perfil profesional",
        "learning_outcomes": "Resultados de aprendizaje",
        "units": "Unidades",
        "practicals": "Trabajos prácticos",
        "generic_competencies": "Competencias genéricas",
        "specific_competencies": "Competencias específicas",
        "methodology": "Metodología",
        "evaluation": "Evaluación",
    }

    review_required_keys = {"minimum_content", "teaching_team"}
    
    changes = {}
    for key, label in labels.items():
        local_val = local_snapshot.get(key)
        gdoc_val = gdoc_snapshot.get(key)
        
        # Solo mostrar como cambio si LOCAL es diferente de GDoc
        if compute_payload_hash({"value": local_val}) != compute_payload_hash({"value": gdoc_val}):
            changes[key] = {
                "label": label,
                "local": local_val,
                "gdoc": gdoc_val,
                "local_display": format_diff_value(local_val),
                "gdoc_display": format_diff_value(gdoc_val),
                "review_required": key in review_required_keys,
            }

    return {
        "local": local_snapshot,
        "gdoc": gdoc_snapshot,
        "changes": changes,
        "gdoc_hash": doc_hash,
        "message": f"Se encontraron {len(changes)} diferencia(s) entre local y GDoc. Selecciona cuáles enviar a GDoc.",
    }


@app.post("/proposals/{proposal_id}/push-to-gdoc-direct")
def push_proposal_to_gdoc_direct(
    proposal_id: int,
    changes_to_apply: dict = Body(..., embed=True, description="Dict con los cambios a aplicar: {field: True/False}"),
    db: Session = Depends(get_db),
):
    """
    Aplica cambios locales directamente al documento de Google Docs.
    Genera DOCX actualizado y reemplaza el contenido en GDoc preservando la estructura.
    Actualiza: GDoc + gdoc_hash en BD.
    """
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if not proposal.gdoc_url:
        raise HTTPException(status_code=400, detail="La propuesta no tiene enlace de Google Docs")

    if not changes_to_apply or not isinstance(changes_to_apply, dict):
        raise HTTPException(status_code=400, detail="changes_to_apply es requerido")

    # Verificar que tengo cambios que aplicar
    if not any(changes_to_apply.values()):
        return {
            "status": "ok",
            "message": "No hay cambios seleccionados para aplicar",
            "gdoc_url": proposal.gdoc_url,
            "updated_fields": []
        }

    # Validar que el template existe
    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(status_code=500, detail="Template Propuestas.docx no encontrado")

    try:
        from .docx_export import generate_proposal_docx
        from googleapiclient.http import MediaFileUpload
        from googleapiclient.errors import HttpError
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Faltan dependencias: {str(e)}",
        )

    # Extraer ID del documento de GDoc
    doc_id_match = re.search(r"/d/([\w-]+)", proposal.gdoc_url)
    if not doc_id_match:
        raise HTTPException(status_code=400, detail="URL de Google Docs inválida")
    
    doc_id = doc_id_match.group(1)
    drive_service = get_google_drive_service()

    # Registrar qué campos se actualizarán
    updated_fields = [field for field, apply in changes_to_apply.items() if apply]
    
    try:
        # Generar DOCX actualizado
        output_path = generate_proposal_docx(proposal, TEMPLATE_PATH)
        output_dir = os.path.dirname(output_path)

        try:
            # Leer el DOCX actualizado como binario
            with open(output_path, 'rb') as f:
                docx_content = f.read()

            # Actualizar el contenido del documento en Google Drive
            # Esto preserva la estructura básica del documento pero reemplaza el contenido
            media = MediaFileUpload(
                output_path,
                mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                resumable=False,
            )

            try:
                drive_service.files().update(
                    fileId=doc_id,
                    media_body=media,
                    fields="id, webViewLink"
                ).execute()
            except HttpError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error al actualizar Google Docs: {e.reason if hasattr(e, 'reason') else str(e)}"
                )

            # Extraer nuevo hash del documento actualizado
            _, _, new_hash, _ = extract_gdoc_payload(proposal.gdoc_url)
            
            # Actualizar BD con el nuevo hash
            proposal.gdoc_hash = new_hash
            proposal.gdoc_last_checked = datetime.utcnow()
            proposal.gdoc_last_synced = proposal.gdoc_last_checked
            proposal.gdoc_status = "ok"
            db.add(proposal)
            db.commit()

            return {
                "status": "success",
                "message": f"Se aplicaron {len(updated_fields)} cambios en Google Docs exitosamente",
                "gdoc_url": proposal.gdoc_url,
                "updated_fields": updated_fields,
                "gdoc_hash": proposal.gdoc_hash,
            }

        finally:
            shutil.rmtree(output_dir, ignore_errors=True)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al aplicar cambios: {str(e)}"
        )





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
                if teacher:  # Only process if teacher was created
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


def model_uses_max_completion_tokens(model: str | None) -> bool:
    name = str(model or "").strip().lower()
    if not name:
        return False
    normalized = name.replace("_", "-")
    tokens = [token for token in re.split(r"[^a-z0-9]+", normalized) if token]
    for token in tokens:
        if token.startswith(("o1", "o3", "o4", "gpt-5")):
            return True
    return normalized.startswith(("o1", "o3", "o4", "gpt-5"))


def model_restricts_temperature_to_default(model: str | None) -> bool:
    name = str(model or "").strip().lower()
    if not name:
        return False
    normalized = name.replace("_", "-")
    tokens = [token for token in re.split(r"[^a-z0-9]+", normalized) if token]
    for token in tokens:
        if token.startswith(("o1", "o3", "o4", "gpt-5")):
            return True
    return normalized.startswith(("o1", "o3", "o4", "gpt-5"))


def create_chat_completion_compatible(
    client: OpenAI,
    *,
    model: str,
    messages: list[dict],
    temperature: float | int | None = None,
    max_tokens: int | None = None,
):
    kwargs = {
        "model": model,
        "messages": messages,
    }
    if temperature is not None:
        if model_restricts_temperature_to_default(model):
            try:
                temp_value = float(temperature)
            except Exception:
                temp_value = None
            if temp_value is not None and abs(temp_value - 1.0) < 1e-9:
                kwargs["temperature"] = 1
        else:
            kwargs["temperature"] = temperature
    if max_tokens is not None:
        if model_uses_max_completion_tokens(model):
            kwargs["max_completion_tokens"] = int(max_tokens)
        else:
            kwargs["max_tokens"] = int(max_tokens)

    try:
        return client.chat.completions.create(**kwargs)
    except Exception as exc:
        message = str(exc)
        lower_message = message.lower()
        retriable = False
        token_param_unsupported = (
            "unsupported parameter" in lower_message
            and ("max_tokens" in lower_message or "max_completion_tokens" in lower_message)
        )
        if token_param_unsupported and "max_tokens" in kwargs:
            kwargs["max_completion_tokens"] = kwargs.pop("max_tokens")
            retriable = True
        elif token_param_unsupported and "max_completion_tokens" in kwargs:
            kwargs["max_tokens"] = kwargs.pop("max_completion_tokens")
            retriable = True
        temperature_unsupported = "unsupported parameter: 'temperature'" in lower_message
        temperature_value_unsupported = (
            "unsupported value" in lower_message
            and "temperature" in lower_message
            and "default (1)" in lower_message
        )
        if (temperature_unsupported or temperature_value_unsupported) and "temperature" in kwargs:
            kwargs.pop("temperature", None)
            retriable = True
        if retriable:
            return client.chat.completions.create(**kwargs)
        raise


INTELLIGENT_TOPIC_ALIASES = {
    "equipo docente": "teaching_team",
    "equipo_docente": "teaching_team",
    "docentes": "teaching_team",
    "fundamentacion": "fundamentals",
    "fundamentación": "fundamentals",
    "bibliografia": "bibliography",
    "bibliografía": "bibliography",
    "contenidos minimos": "minimum_content",
    "contenidos mínimos": "minimum_content",
    "contenidos": "minimum_content",
    "resultados de aprendizaje": "learning_outcomes",
    "objetivos": "learning_outcomes",
    "unidades": "units",
    "trabajos practicos": "practicals",
    "trabajos prácticos": "practicals",
    "metodologia": "methodology",
    "metodología": "methodology",
    "evaluacion": "evaluation",
    "evaluación": "evaluation",
}

INTELLIGENT_AVAILABLE_MODELS = [
    "gpt-5.2",
    "gpt-5.2-pro",
    "gpt-5.1",
    "gpt-5-mini",
    "gpt-4o",
    "o3",
    "o3-pro",
    "o4-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
]


def default_intelligent_mode_settings() -> dict:
    return {
        "guepardo": {
            "model": os.getenv("OPENAI_MODEL_FAST", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "temperature": 0.15,
            "max_tokens": 420,
        },
        "delfin": {
            "model": os.getenv("OPENAI_MODEL_BALANCED", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "temperature": 0.1,
            "max_tokens": 500,
        },
        "ballena": {
            "model": os.getenv("OPENAI_MODEL_PRECISE", os.getenv("OPENAI_MODEL", "gpt-4o")),
            "temperature": 0.1,
            "max_tokens": 700,
        },
    }


def sanitize_mode_temperature(value, default: float) -> float:
    try:
        temp = float(value)
    except Exception:
        return float(default)
    if temp < 0:
        return 0.0
    if temp > 2:
        return 2.0
    return temp


def sanitize_mode_max_tokens(value, default: int) -> int:
    try:
        tokens = int(value)
    except Exception:
        return int(default)
    if tokens < 100:
        return 100
    if tokens > 4000:
        return 4000
    return tokens


def build_effective_intelligent_mode_settings(settings: models.IntelligentControlSettings | None) -> dict:
    defaults = default_intelligent_mode_settings()
    if not settings:
        return defaults

    result = {}
    for mode in ("guepardo", "delfin", "ballena"):
        default_mode = defaults[mode]
        model = getattr(settings, f"{mode}_model", None) or default_mode["model"]
        temperature = sanitize_mode_temperature(getattr(settings, f"{mode}_temperature", None), default_mode["temperature"])
        max_tokens = sanitize_mode_max_tokens(getattr(settings, f"{mode}_max_tokens", None), default_mode["max_tokens"])
        result[mode] = {
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
    return result


def serialize_intelligent_settings(settings: models.IntelligentControlSettings) -> dict:
    mode_settings = build_effective_intelligent_mode_settings(settings)
    return {
        "director_last_mode": normalize_intelligent_mode(settings.director_last_mode, default="delfin"),
        "docente_mode": normalize_intelligent_mode(settings.docente_mode, default="guepardo"),
        "guepardo": mode_settings["guepardo"],
        "delfin": mode_settings["delfin"],
        "ballena": mode_settings["ballena"],
        "available_models": INTELLIGENT_AVAILABLE_MODELS,
        "updated_at": settings.updated_at,
    }


def normalize_intelligent_mode(value: str | None, default: str = "delfin") -> str:
    mode = normalize_header(value or default)
    if mode not in {"guepardo", "delfin", "ballena"}:
        return default
    return mode


def get_or_create_intelligent_settings(db: Session) -> models.IntelligentControlSettings:
    settings = db.query(models.IntelligentControlSettings).order_by(models.IntelligentControlSettings.id.asc()).first()
    defaults = default_intelligent_mode_settings()
    if settings:
        changed = False
        if not settings.director_last_mode:
            settings.director_last_mode = "delfin"
            changed = True
        if not settings.docente_mode:
            settings.docente_mode = "guepardo"
            changed = True
        for mode in ("guepardo", "delfin", "ballena"):
            model_key = f"{mode}_model"
            temp_key = f"{mode}_temperature"
            tokens_key = f"{mode}_max_tokens"
            if not getattr(settings, model_key, None):
                setattr(settings, model_key, defaults[mode]["model"])
                changed = True
            if getattr(settings, temp_key, None) is None:
                setattr(settings, temp_key, defaults[mode]["temperature"])
                changed = True
            if getattr(settings, tokens_key, None) is None:
                setattr(settings, tokens_key, defaults[mode]["max_tokens"])
                changed = True
        if changed:
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    settings = models.IntelligentControlSettings(
        director_last_mode="delfin",
        docente_mode="guepardo",
        guepardo_model=defaults["guepardo"]["model"],
        guepardo_temperature=defaults["guepardo"]["temperature"],
        guepardo_max_tokens=defaults["guepardo"]["max_tokens"],
        delfin_model=defaults["delfin"]["model"],
        delfin_temperature=defaults["delfin"]["temperature"],
        delfin_max_tokens=defaults["delfin"]["max_tokens"],
        ballena_model=defaults["ballena"]["model"],
        ballena_temperature=defaults["ballena"]["temperature"],
        ballena_max_tokens=defaults["ballena"]["max_tokens"],
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def normalize_intelligent_topic(topic: str | None) -> str:
    raw = normalize_header(topic or "")
    if not raw:
        return "minimum_content"
    return INTELLIGENT_TOPIC_ALIASES.get(raw, raw.replace(" ", "_"))


def normalize_associated_topics(topics: list[str] | None, main_topic: str | None = None) -> list[str]:
    if not isinstance(topics, list):
        return []
    normalized_main = normalize_intelligent_topic(main_topic or "") if main_topic else None
    result: list[str] = []
    seen: set[str] = set()
    for item in topics:
        topic = normalize_intelligent_topic(str(item or "").strip())
        if not topic:
            continue
        if normalized_main and topic == normalized_main:
            continue
        if topic in seen:
            continue
        seen.add(topic)
        result.append(topic)
    return result


def build_topic_payload(proposal: models.Proposal, topic: str) -> dict:
    normalized = normalize_intelligent_topic(topic)
    if normalized == "teaching_team":
        team = proposal.teaching_team or []
        def normalize_teacher_category(value: str | None) -> str:
            raw = normalize_header(value or "")
            if not raw:
                return "SIN INFORMAR"
            mapping = {
                "titular": "TITULAR",
                "asociado": "ASOCIADO",
                "adjunto": "ADJUNTO",
                "jtp": "JTP",
                "ayudante 1": "AYUDANTE 1º",
                "ayudante 1o": "AYUDANTE 1º",
                "ayudante 1º": "AYUDANTE 1º",
            }
            return mapping.get(raw, str(value or "").strip().upper() or "SIN INFORMAR")

        normalized_team = []
        categories_count: dict[str, int] = {}
        senior_categories = {"ADJUNTO", "ASOCIADO", "TITULAR"}
        senior_teachers = []
        for member in team:
            category = normalize_teacher_category((member or {}).get("category"))
            name = str((member or {}).get("name") or "").strip()
            normalized_member = {
                "id": (member or {}).get("id"),
                "name": name,
                "category": category,
                "email": (member or {}).get("email"),
            }
            normalized_team.append(normalized_member)
            categories_count[category] = categories_count.get(category, 0) + 1
            if category in senior_categories:
                senior_teachers.append({"name": name, "category": category})

        return {
            "topic": normalized,
            "content": {
                "team": normalized_team,
                "summary": {
                    "total_teachers": len(normalized_team),
                    "categories_count": categories_count,
                    "senior_categories": sorted(list(senior_categories)),
                    "has_senior_teacher": len(senior_teachers) > 0,
                    "senior_teachers": senior_teachers,
                },
            },
            "has_content": bool(team),
        }
    if normalized == "fundamentals":
        payload = {
            "importancia": proposal.fundamentals_part1 or "",
            "perfil_profesional": proposal.fundamentals_part2 or "",
        }
        return {
            "topic": normalized,
            "content": payload,
            "has_content": bool(payload["importancia"].strip() or payload["perfil_profesional"].strip()),
        }
    if normalized == "minimum_content":
        text = proposal.minimum_content or ""
        return {"topic": normalized, "content": text, "has_content": bool(text.strip())}
    if normalized == "learning_outcomes":
        outcomes = proposal.learning_outcomes or []
        return {"topic": normalized, "content": outcomes, "has_content": bool(outcomes)}
    if normalized == "units":
        units = proposal.units or []
        return {"topic": normalized, "content": units, "has_content": bool(units)}
    if normalized == "practicals":
        practicals = proposal.practicals or []
        return {"topic": normalized, "content": practicals, "has_content": bool(practicals)}
    if normalized == "methodology":
        text = proposal.methodology or ""
        return {"topic": normalized, "content": text, "has_content": bool(text.strip())}
    if normalized == "evaluation":
        text = proposal.evaluation or ""
        return {"topic": normalized, "content": text, "has_content": bool(text.strip())}
    if normalized == "bibliography":
        text = proposal.bibliography or ""
        return {"topic": normalized, "content": text, "has_content": bool(text.strip())}

    text = proposal.observations or ""
    return {"topic": normalized, "content": text, "has_content": bool(text.strip())}


def build_associated_topic_payloads(proposal: models.Proposal, associated_topics: list[str] | None) -> list[dict]:
    topics = normalize_associated_topics(associated_topics)
    payloads: list[dict] = []
    for topic in topics:
        topic_payload = build_topic_payload(proposal, topic)
        payloads.append({
            "topic": topic,
            "has_content": bool(topic_payload.get("has_content")),
            "content": topic_payload.get("content"),
        })
    return payloads


def parse_llm_json_response(content: str) -> dict:
    raw = (content or "").strip()
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"```$", "", raw).strip()

    def try_parse(candidate: str):
        text = str(candidate or "").strip()
        if not text:
            return None
        for parser in (
            lambda v: json.loads(v),
            lambda v: json.loads(re.sub(r",\s*([}\]])", r"\1", v)),
        ):
            try:
                parsed = parser(text)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                continue
        normalized_quotes = (
            text.replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("‘", "'")
        )
        try:
            parsed = ast.literal_eval(normalized_quotes)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
        return None

    parsed = try_parse(raw)
    if parsed is not None:
        return parsed

    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        parsed = try_parse(match.group(0))
        if parsed is not None:
            return parsed

    if not raw:
        return {
            "pass": False,
            "what_failed": "No se pudo interpretar respuesta JSON del modelo.",
            "why_failed": "El modelo devolvió una respuesta vacía.",
            "suggestion": "Reintentar con más tokens o con otro modo/modelo.",
            "proposed_text": "",
            "summary": "Respuesta vacía del modelo",
        }

    return {
        "pass": False,
        "what_failed": "No se pudo interpretar respuesta JSON del modelo.",
        "why_failed": raw[:1500],
        "suggestion": "Revisar manualmente este tópico y volver a ejecutar el control.",
        "proposed_text": "",
        "summary": "Respuesta no estructurada del modelo",
    }


ENGLISH_HINT_WORDS = {
    "the", "and", "or", "with", "without", "requires", "require", "should", "must", "only",
    "because", "reason", "suggestion", "add", "include", "team", "teacher", "teachers", "senior",
    "presence", "meets", "does", "not", "fail", "failed", "rule", "rules", "compliance",
}


def text_looks_english(text: str) -> bool:
    value = str(text or "").strip()
    if not value:
        return False
    words = re.findall(r"[A-Za-z']+", value.lower())
    if not words:
        return False
    english_hits = sum(1 for token in words if token in ENGLISH_HINT_WORDS)
    return english_hits >= 2


def force_intelligent_feedback_spanish(data: dict, client: OpenAI) -> dict:
    if not isinstance(data, dict):
        return data

    fields = ["what_failed", "why_failed", "suggestion", "proposed_text", "summary"]
    payload = {field: str(data.get(field) or "").strip() for field in fields}
    if not any(text_looks_english(payload[field]) for field in fields):
        return data

    system_prompt = (
        "Eres traductor técnico académico. Convierte al español claro y natural el contenido recibido. "
        "Debes devolver SOLO JSON válido con las mismas claves: what_failed, why_failed, suggestion, proposed_text, summary."
    )
    user_prompt = (
        "Traduce al español (sin cambiar sentido) este JSON:\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )
    try:
        translation = create_chat_completion_compatible(
            client,
            model=os.getenv("OPENAI_MODEL_FAST", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            max_tokens=450,
        )
        translated_raw = (translation.choices[0].message.content or "").strip()
        translated = parse_llm_json_response(translated_raw)
        for field in fields:
            translated_value = str(translated.get(field) or "").strip()
            if translated_value:
                data[field] = translated_value
    except Exception:
        return data
    return data


def evaluate_control_with_llm(
    control: models.IntelligentControl,
    proposal: models.Proposal,
    topic_payload: dict,
    mode: str = "delfin",
    associated_context: list[dict] | None = None,
) -> dict:
    selected_mode = normalize_header(mode or "delfin")
    if selected_mode not in {"guepardo", "delfin", "ballena"}:
        selected_mode = "delfin"

    db = SessionLocal()
    try:
        persisted_settings = get_or_create_intelligent_settings(db)
        mode_settings = build_effective_intelligent_mode_settings(persisted_settings)
    finally:
        db.close()
    effective_mode = selected_mode
    topic_normalized = normalize_intelligent_topic(control.topic)
    instruction_text = str(control.instruction or "")
    senior_category_rule = bool(re.search(r"adjunt|asociad|titular", normalize_header(instruction_text)))
    if topic_normalized == "teaching_team" and senior_category_rule and selected_mode in {"guepardo", "delfin"}:
        effective_mode = "ballena"

    config = mode_settings[effective_mode]

    system_prompt = (
        "Eres un evaluador académico estricto de programas analíticos universitarios. "
        "Debes responder SOLO JSON válido con claves: "
        "pass (boolean), what_failed (string), why_failed (string), suggestion (string), proposed_text (string), summary (string). "
        "En proposed_text devuelve texto reformulado sugerido SOLO si aplica (p.ej. evaluación, metodología, contenidos, fundamentación). "
        "Si no aplica, devuelve cadena vacía. "
        "Debes escribir SIEMPRE en español (nunca en inglés). "
        "No inventes datos ni contradigas evidencia explícita del JSON. "
        "Si el JSON trae un resumen estructurado, úsalo como fuente principal para decidir."
    )
    user_prompt = (
        f"Control: {control.name}\n"
        f"Tópico: {control.topic}\n"
        f"Regla de control:\n{control.instruction}\n\n"
        f"Datos de la propuesta (JSON):\n{json.dumps(topic_payload.get('content'), ensure_ascii=False, indent=2)}\n\n"
        + (
            f"Contexto adicional asociado (JSON por tópico):\n{json.dumps(associated_context or [], ensure_ascii=False, indent=2)}\n\n"
            if associated_context else ""
        )
        + "Evalúa si cumple estrictamente la regla."
    )
    client = get_openai_client()
    response = create_chat_completion_compatible(
        client,
        model=config["model"],
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=config["temperature"],
        max_tokens=config["max_tokens"],
    )
    response_choice = response.choices[0]
    finish_reason = str(getattr(response_choice, "finish_reason", "") or "").lower()
    content = (response_choice.message.content or "").strip()
    retried_for_length = False
    used_max_tokens = int(config["max_tokens"])

    if not content and finish_reason == "length":
        retry_tokens = min(max(used_max_tokens + 300, used_max_tokens * 2), 4000)
        if retry_tokens > used_max_tokens:
            retry_response = create_chat_completion_compatible(
                client,
                model=config["model"],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=config["temperature"],
                max_tokens=retry_tokens,
            )
            response = retry_response
            response_choice = retry_response.choices[0]
            finish_reason = str(getattr(response_choice, "finish_reason", "") or "").lower()
            content = (response_choice.message.content or "").strip()
            retried_for_length = True
            used_max_tokens = retry_tokens

    data = parse_llm_json_response(content)
    data = force_intelligent_feedback_spanish(data, client)
    passed = bool(data.get("pass") or data.get("passed") or data.get("ok"))
    return {
        "pass": passed,
        "what_failed": str(data.get("what_failed") or "").strip(),
        "why_failed": str(data.get("why_failed") or "").strip(),
        "suggestion": str(data.get("suggestion") or "").strip(),
        "proposed_text": str(data.get("proposed_text") or "").strip(),
        "summary": str(data.get("summary") or "").strip(),
        "raw_response": {
            **(data if isinstance(data, dict) else {"data": data}),
            "requested_mode": selected_mode,
            "effective_mode": effective_mode,
            "finish_reason": finish_reason,
            "retried_for_length": retried_for_length,
            "used_max_tokens": used_max_tokens,
            "model": str(config.get("model") or ""),
            "raw_content": content[:3000],
            "associated_topics": normalize_associated_topics(getattr(control, "associated_topics", None), control.topic),
        },
    }


def compute_intelligent_status(active_controls: list[models.IntelligentControl], results_by_control_id: dict[int, models.ProposalIntelligentControlResult]) -> str:
    if not active_controls:
        return "Sin ejecutar"
    if not results_by_control_id:
        return "Sin ejecutar"
    for control in active_controls:
        result = results_by_control_id.get(control.id)
        if not result:
            return "Con sugerencias"
        if not result.passed:
            return "Con sugerencias"
    return "Validada"


def build_intelligent_summary(db: Session, proposal: models.Proposal) -> dict:
    active_controls = db.query(models.IntelligentControl).filter(models.IntelligentControl.is_active == True).order_by(
        models.IntelligentControl.topic.asc(),
        models.IntelligentControl.sort_order.asc().nulls_last(),
        models.IntelligentControl.id.asc(),
    ).all()

    control_ids = [control.id for control in active_controls]
    results = []
    if control_ids:
        results = db.query(models.ProposalIntelligentControlResult).filter(
            models.ProposalIntelligentControlResult.proposal_id == proposal.id,
            models.ProposalIntelligentControlResult.control_id.in_(control_ids),
        ).all()

    results_by_control_id = {row.control_id: row for row in results}
    status = compute_intelligent_status(active_controls, results_by_control_id)
    proposal.intelligent_status = status
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    result_items = []
    passed_controls = 0
    failed_controls = 0
    last_updated = None

    controls_by_id = {control.id: control for control in active_controls}
    for control in active_controls:
        row = results_by_control_id.get(control.id)
        if not row:
            continue
        if row.passed:
            passed_controls += 1
        else:
            failed_controls += 1
        if row.checked_at and (last_updated is None or row.checked_at > last_updated):
            last_updated = row.checked_at
        result_items.append({
            "id": row.id,
            "proposal_id": row.proposal_id,
            "control_id": row.control_id,
            "control_topic": controls_by_id[row.control_id].topic,
            "control_name": controls_by_id[row.control_id].name,
            "passed": row.passed,
            "what_failed": row.what_failed,
            "why_failed": row.why_failed,
            "suggestion": row.suggestion,
            "proposed_text": row.proposed_text,
            "summary": row.summary,
            "checked_at": row.checked_at,
        })

    return {
        "proposal_id": proposal.id,
        "intelligent_status": status,
        "total_controls": len(active_controls),
        "passed_controls": passed_controls,
        "failed_controls": failed_controls,
        "results": result_items,
        "updated_at": last_updated,
    }


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


def normalize_term_name(value: str) -> str:
    if not value:
        return ""
    normalized = str(value).strip().lower()
    if "anual" in normalized or normalized == "a":
        return "Anual"
    if "1" in normalized or "primer" in normalized:
        return "1er Cuatrimestre"
    if "2" in normalized or "segundo" in normalized:
        return "2do Cuatrimestre"
    return str(value).strip()


def parse_int(value, default=None):
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip()
    if not text:
        return default
    match = re.search(r"\d+", text)
    return int(match.group(0)) if match else default


def normalize_blocks(value: str) -> list[str]:
    if not value:
        return []
    raw = str(value)
    parts = [part.strip() for part in re.split(r"\s*-\s*", raw) if part.strip()]
    return parts


def get_or_create_study_plan(db: Session, career: str, name: str) -> models.StudyPlan:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.career == career,
        models.StudyPlan.name == name,
    ).first()
    if plan:
        return plan
    plan = models.StudyPlan(career=career, name=name)
    db.add(plan)
    db.flush()
    return plan


def get_or_create_study_year(db: Session, plan_id: int, year_number: int, label: str | None = None) -> models.StudyYear:
    year = db.query(models.StudyYear).filter(
        models.StudyYear.plan_id == plan_id,
        models.StudyYear.year_number == year_number,
    ).first()
    if year:
        return year
    year = models.StudyYear(
        plan_id=plan_id,
        year_number=year_number,
        label=label,
        sort_order=year_number,
    )
    db.add(year)
    db.flush()
    return year


def get_or_create_study_term(db: Session, year_id: int, name: str) -> models.StudyTerm:
    term = db.query(models.StudyTerm).filter(
        models.StudyTerm.year_id == year_id,
        models.StudyTerm.name == name,
    ).first()
    if term:
        return term
    sort_order = 3
    if "1" in name:
        sort_order = 1
    elif "2" in name:
        sort_order = 2
    term = models.StudyTerm(year_id=year_id, name=name, sort_order=sort_order)
    db.add(term)
    db.flush()
    return term


def find_subject_by_plan_name(db: Session, plan_id: int, name: str) -> models.StudySubject | None:
    """
    Find subject by name within a plan, normalizing accents and case.
    This allows "Programacion I" to match "Programación I"
    """
    if not name:
        return None
    
    # Get all subjects in the plan
    subjects = db.query(models.StudySubject).join(models.StudyTerm).join(models.StudyYear).filter(
        models.StudyYear.plan_id == plan_id
    ).all()
    
    # Normalize the search name
    search_normalized = normalize_header(name)
    
    # Find first matching subject (normalized comparison)
    for subject in subjects:
        if normalize_header(subject.name) == search_normalized:
            return subject
    
    return None


def get_or_create_study_subject(db: Session, plan_id: int, term_id: int, name: str) -> models.StudySubject:
    subject = find_subject_by_plan_name(db, plan_id, name)
    if subject:
        if subject.term_id != term_id:
            subject.term_id = term_id
            db.add(subject)
        return subject
    subject = models.StudySubject(term_id=term_id, name=name)
    db.add(subject)
    db.flush()
    return subject


def replace_subject_prerequisites(db: Session, subject_id: int, prerequisite_ids: list[int]) -> None:
    db.query(models.StudySubjectPrerequisite).filter(
        models.StudySubjectPrerequisite.subject_id == subject_id
    ).delete()
    for prereq_id in prerequisite_ids:
        db.add(models.StudySubjectPrerequisite(subject_id=subject_id, prerequisite_id=prereq_id))


def build_practice_scope_from_proposal(proposal: models.Proposal) -> str:
    scopes = []
    for tp in proposal.practicals or []:
        scope = ""
        if isinstance(tp, dict):
            scope = tp.get("scope") or ""
        if scope:
            scopes.append(scope.strip())
    unique = [s for s in dict.fromkeys(scopes) if s]
    return "\n".join(unique)


def sync_subject_from_proposal(db: Session, proposal: models.Proposal) -> None:
    if not proposal.career or not proposal.subject:
        return
    plan_name = proposal.study_plan or "Plan"
    plan = get_or_create_study_plan(db, proposal.career, plan_name)
    year_number = parse_int(proposal.year_of_career, default=0)
    term_name = normalize_term_name(proposal.quarter)
    year = get_or_create_study_year(db, plan.id, year_number, label=str(proposal.year_of_career or ""))
    term = get_or_create_study_term(db, year.id, term_name or "Sin Cuatrimestre")
    subject = get_or_create_study_subject(db, plan.id, term.id, proposal.subject)
    subject.character = proposal.character
    subject.regime = proposal.regime
    subject.theoretical_hours = proposal.theoretical_hours
    subject.practical_hours = proposal.practical_hours
    subject.total_hours = proposal.total_hours
    subject.weekly_hours = proposal.weekly_hours
    subject.minimum_content = proposal.minimum_content
    subject.generic_competencies = proposal.generic_competencies
    subject.specific_competencies = proposal.specific_competencies
    practice_scope = build_practice_scope_from_proposal(proposal)
    subject.practice_scope = practice_scope or subject.practice_scope
    db.add(subject)
    proposal.study_subject_id = subject.id
    db.add(proposal)


def normalize_header(value: str) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", str(value))
    normalized = "".join([c for c in normalized if not unicodedata.combining(c)])
    return normalized.strip().lower()


def build_subject_out(db: Session, subject: models.StudySubject) -> dict:
    prereq_ids = [
        row.prerequisite_id
        for row in db.query(models.StudySubjectPrerequisite)
        .filter(models.StudySubjectPrerequisite.subject_id == subject.id)
        .all()
    ]
    
    # Get associated proposals
    proposals = db.query(models.Proposal).filter(
        models.Proposal.study_subject_id == subject.id
    ).all()
    associated_proposals = [
        {
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "gdoc_url": p.gdoc_url,
            "gdoc_status": p.gdoc_status,
        }
        for p in proposals
    ]
    
    return {
        "id": subject.id,
        "term_id": subject.term_id,
        "code": subject.code,
        "name": subject.name,
        "character": subject.character,
        "regime": subject.regime,
        "theoretical_hours": subject.theoretical_hours,
        "practical_hours": subject.practical_hours,
        "total_hours": subject.total_hours,
        "weekly_hours": subject.weekly_hours,
        "practice_scope": subject.practice_scope,
        "minimum_content": subject.minimum_content,
        "generic_competencies": subject.generic_competencies,
        "specific_competencies": subject.specific_competencies,
        "blocks": subject.blocks or [],
        "prerequisite_ids": prereq_ids,
        "associated_proposals": associated_proposals,
        "created_at": subject.created_at,
        "updated_at": subject.updated_at,
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
        try:
            level = int(value)
            return level if level in (0, 1, 2, 3) else 0
        except Exception:
            return 0
    text = strip_accents(str(value)).strip().lower()
    if not text:
        return 0
    if text.isdigit():
        level = int(text)
        return level if level in (0, 1, 2, 3) else 0
    if text in LEVEL_VALUES:
        return LEVEL_VALUES[text]
    return 0


@app.get("/study-plans", response_model=list[schemas.StudyPlanOut])
def list_study_plans(career: str = "", db: Session = Depends(get_db)):
    query = db.query(models.StudyPlan)
    if career:
        query = query.filter(models.StudyPlan.career == career)
    return query.order_by(models.StudyPlan.name.asc()).all()


@app.post("/study-plans", response_model=schemas.StudyPlanOut)
def create_study_plan(payload: schemas.StudyPlanCreate, db: Session = Depends(get_db)):
    existing = db.query(models.StudyPlan).filter(
        models.StudyPlan.career == payload.career,
        models.StudyPlan.name == payload.name,
    ).first()
    if existing:
        return existing
    plan = models.StudyPlan(career=payload.career, name=payload.name)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.get("/study-plans-storage", response_model=list[schemas.StudyPlanStorageOut])
def list_study_plans_storage(career: str = "", db: Session = Depends(get_db)):
    query = db.query(models.StudyPlan)
    if career:
        query = query.filter(models.StudyPlan.career == career)
    return query.order_by(models.StudyPlan.name.asc()).all()


@app.post("/study-plans-storage", response_model=schemas.StudyPlanStorageOut)
def upsert_study_plan_storage(payload: schemas.StudyPlanStorageIn, db: Session = Depends(get_db)):
    plan = None
    if payload.id:
        plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == payload.id).first()
    if not plan:
        plan = db.query(models.StudyPlan).filter(
            models.StudyPlan.career == payload.career,
            models.StudyPlan.name == payload.name,
        ).first()
    if not plan:
        plan = models.StudyPlan(career=payload.career, name=payload.name)
        db.add(plan)
        db.flush()

    plan.career = payload.career
    plan.name = payload.name
    if payload.is_active is not None:
        plan.is_active = bool(payload.is_active)
    if payload.payload is not None:
        plan.payload = payload.payload

    if plan.is_active:
        db.query(models.StudyPlan).filter(
            models.StudyPlan.career == payload.career,
            models.StudyPlan.id != plan.id,
        ).update({models.StudyPlan.is_active: False})

    db.commit()
    db.refresh(plan)
    return plan


@app.post("/study-plans-storage/{plan_id}/activate", response_model=schemas.StudyPlanStorageOut)
def activate_study_plan_storage(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.query(models.StudyPlan).filter(
        models.StudyPlan.career == plan.career,
        models.StudyPlan.id != plan.id,
    ).update({models.StudyPlan.is_active: False})
    plan.is_active = True
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.delete("/study-plans-storage/{plan_id}")
def delete_study_plan_storage(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.delete(plan)
    db.commit()
    return {"status": "deleted", "id": plan_id}


@app.get("/drive-settings", response_model=schemas.DriveSettingsOut | None)
def get_drive_settings(career: str, plan_name: str | None = None, db: Session = Depends(get_db)):
    if not career:
        raise HTTPException(status_code=400, detail="Career is required")
    query = db.query(models.DriveSettings).filter(models.DriveSettings.career == career)
    if plan_name:
        query = query.filter(models.DriveSettings.plan_name == plan_name)
    else:
        query = query.filter(models.DriveSettings.plan_name.is_(None))
    settings = query.first()
    if not settings:
        return None
    return settings


@app.put("/drive-settings", response_model=schemas.DriveSettingsOut)
def upsert_drive_settings(payload: schemas.DriveSettingsCreate, db: Session = Depends(get_db)):
    career = (payload.career or "").strip()
    plan_name = (payload.plan_name or "").strip() or None
    root_folder_url = (payload.root_folder_url or "").strip() or None
    pdf_folder_url = (payload.pdf_folder_url or "").strip() or None
    if not career:
        raise HTTPException(status_code=400, detail="Career is required")
    if not root_folder_url and not pdf_folder_url:
        raise HTTPException(status_code=400, detail="At least one Drive URL is required")
    query = db.query(models.DriveSettings).filter(models.DriveSettings.career == career)
    if plan_name:
        query = query.filter(models.DriveSettings.plan_name == plan_name)
    else:
        query = query.filter(models.DriveSettings.plan_name.is_(None))
    settings = query.first()
    if not settings:
        settings = models.DriveSettings(
            career=career,
            plan_name=plan_name,
            root_folder_url=root_folder_url,
            pdf_folder_url=pdf_folder_url,
        )
    else:
        settings.plan_name = plan_name
        settings.root_folder_url = root_folder_url
        settings.pdf_folder_url = pdf_folder_url
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@app.get("/study-plans/{plan_id}", response_model=schemas.StudyPlanDetail)
def get_study_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    years = db.query(models.StudyYear).filter(models.StudyYear.plan_id == plan.id).order_by(
        models.StudyYear.sort_order.asc().nullslast(),
        models.StudyYear.year_number.asc(),
    ).all()
    years_payload = []
    for year in years:
        terms = db.query(models.StudyTerm).filter(models.StudyTerm.year_id == year.id).order_by(
            models.StudyTerm.sort_order.asc().nullslast(),
            models.StudyTerm.name.asc(),
        ).all()
        terms_payload = []
        for term in terms:
            subjects = db.query(models.StudySubject).filter(models.StudySubject.term_id == term.id).order_by(
                models.StudySubject.name.asc()
            ).all()
            subjects_payload = [build_subject_out(db, subject) for subject in subjects]
            terms_payload.append({
                "id": term.id,
                "year_id": year.id,
                "name": term.name,
                "sort_order": term.sort_order,
                "subjects": subjects_payload,
            })
        years_payload.append({
            "id": year.id,
            "plan_id": plan.id,
            "year_number": year.year_number,
            "label": year.label,
            "sort_order": year.sort_order,
            "terms": terms_payload,
        })
    return {
        "id": plan.id,
        "career": plan.career,
        "name": plan.name,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
        "years": years_payload,
    }


@app.post("/study-plans/{plan_id}/years", response_model=schemas.StudyYearOut)
def add_study_year(plan_id: int, payload: schemas.StudyYearBase, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    year = get_or_create_study_year(db, plan.id, payload.year_number, payload.label)
    if payload.sort_order is not None:
        year.sort_order = payload.sort_order
        db.add(year)
    db.commit()
    db.refresh(year)
    return year


@app.post("/study-years/{year_id}/terms", response_model=schemas.StudyTermOut)
def add_study_term(year_id: int, payload: schemas.StudyTermBase, db: Session = Depends(get_db)):
    year = db.query(models.StudyYear).filter(models.StudyYear.id == year_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Study year not found")
    term = get_or_create_study_term(db, year.id, payload.name)
    if payload.sort_order is not None:
        term.sort_order = payload.sort_order
        db.add(term)
    db.commit()
    db.refresh(term)
    return {
        "id": term.id,
        "year_id": term.year_id,
        "name": term.name,
        "sort_order": term.sort_order,
        "subjects": [],
    }


@app.post("/study-terms/{term_id}/subjects", response_model=schemas.StudySubjectOut)
def add_study_subject(term_id: int, payload: schemas.StudySubjectBase, db: Session = Depends(get_db)):
    term = db.query(models.StudyTerm).filter(models.StudyTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Study term not found")
    plan_id = db.query(models.StudyYear.plan_id).filter(models.StudyYear.id == term.year_id).scalar()
    subject = get_or_create_study_subject(db, plan_id, term.id, payload.name)
    subject.code = payload.code
    subject.character = payload.character
    subject.regime = payload.regime
    subject.theoretical_hours = payload.theoretical_hours
    subject.practical_hours = payload.practical_hours
    subject.total_hours = payload.total_hours
    subject.weekly_hours = payload.weekly_hours
    subject.practice_scope = payload.practice_scope
    subject.minimum_content = payload.minimum_content
    subject.generic_competencies = payload.generic_competencies
    subject.specific_competencies = payload.specific_competencies
    subject.blocks = payload.blocks or []
    db.add(subject)
    replace_subject_prerequisites(db, subject.id, payload.prerequisite_ids or [])
    db.commit()
    db.refresh(subject)
    return build_subject_out(db, subject)


@app.patch("/study-subjects/{subject_id}", response_model=schemas.StudySubjectOut)
def update_study_subject(subject_id: int, payload: schemas.StudySubjectUpdate, db: Session = Depends(get_db)):
    subject = db.query(models.StudySubject).filter(models.StudySubject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Study subject not found")
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    prereq_ids = data.pop("prerequisite_ids", None)
    for key, value in data.items():
        setattr(subject, key, value)
    if prereq_ids is not None:
        replace_subject_prerequisites(db, subject.id, prereq_ids)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return build_subject_out(db, subject)


@app.delete("/study-subjects/{subject_id}")
def delete_study_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(models.StudySubject).filter(models.StudySubject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Study subject not found")
    db.delete(subject)
    db.commit()
    return {"status": "deleted", "id": subject_id}


@app.get("/study-subjects")
def list_study_subjects(career: str = "", plan: str = "", db: Session = Depends(get_db)):
    query = db.query(models.StudySubject, models.StudyTerm, models.StudyYear, models.StudyPlan).join(
        models.StudyTerm, models.StudySubject.term_id == models.StudyTerm.id
    ).join(
        models.StudyYear, models.StudyTerm.year_id == models.StudyYear.id
    ).join(
        models.StudyPlan, models.StudyYear.plan_id == models.StudyPlan.id
    )
    if career:
        query = query.filter(models.StudyPlan.career == career)
    if plan:
        query = query.filter(models.StudyPlan.name == plan)
    rows = query.order_by(models.StudyYear.year_number.asc(), models.StudyTerm.sort_order.asc()).all()
    return [
        {
            "id": subject.id,
            "code": subject.code,
            "name": subject.name,
            "year_number": year.year_number,
            "term_name": term.name,
            "plan_name": plan_row.name,
        }
        for subject, term, year, plan_row in rows
    ]


@app.post("/study-plans/import-xlsx")
async def import_study_plan_xlsx(
    career: str = Form(...),
    plan_name: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
        try:
            import openpyxl  # type: ignore
        except ImportError:
            raise HTTPException(status_code=500, detail="openpyxl no esta instalado")
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Archivo vacio")
        filename = file.filename or "Plan"
        plan_name = plan_name or os.path.splitext(filename)[0]
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
        sheet = wb.active
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            raise HTTPException(status_code=400, detail="Archivo sin filas")
        header = rows[0]
        header_map = {normalize_header(value): idx for idx, value in enumerate(header)}
        def col(name: str) -> int | None:
            return header_map.get(normalize_header(name))
        idx_asignatura = col("Asignatura")
        if idx_asignatura is None:
            raise HTTPException(status_code=400, detail="Columna Asignatura no encontrada")
        plan = get_or_create_study_plan(db, career, plan_name)
        imported = 0
        for row in rows[1:]:
            subject_name = row[idx_asignatura] if idx_asignatura < len(row) else None
            if not subject_name:
                continue
            year_number = parse_int(row[col("Año")] if col("Año") is not None else None, default=0)
            term_name = normalize_term_name(row[col("Cuatrimestre")] if col("Cuatrimestre") is not None else "")
            year = get_or_create_study_year(db, plan.id, year_number, label=str(row[col("Año")]) if col("Año") is not None else None)
            term = get_or_create_study_term(db, year.id, term_name or "Sin Cuatrimestre")
            subject = get_or_create_study_subject(db, plan.id, term.id, str(subject_name).strip())
            blocks = normalize_blocks(row[col("Bloque / Campo")] if col("Bloque / Campo") is not None else "")
            subject.blocks = sorted({*(subject.blocks or []), *blocks}) if blocks else subject.blocks
            subject.practice_scope = row[col("Ámbito de Práctica")] if col("Ámbito de Práctica") is not None else subject.practice_scope
            subject.minimum_content = row[col("Contenido Mínimo")] if col("Contenido Mínimo") is not None else subject.minimum_content
            subject.character = row[col("Caracter")] if col("Caracter") is not None else subject.character
            subject.regime = row[col("Régimen")] if col("Régimen") is not None else subject.regime
            subject.total_hours = parse_int(row[col("Horas Totales")] if col("Horas Totales") is not None else None, subject.total_hours)
            subject.theoretical_hours = parse_int(row[col("Hs Teoría")] if col("Hs Teoría") is not None else None, subject.theoretical_hours)
            subject.practical_hours = parse_int(row[col("Hs Práctica")] if col("Hs Práctica") is not None else None, subject.practical_hours)
            subject.weekly_hours = parse_int(row[col("Hs Semanales")] if col("Hs Semanales") is not None else None, subject.weekly_hours)
            subject.generic_competencies = row[col("Competencias Genéricas")] if col("Competencias Genéricas") is not None else subject.generic_competencies
            subject.specific_competencies = row[col("Competencias Específicas")] if col("Competencias Específicas") is not None else subject.specific_competencies
            db.add(subject)
            imported += 1
        db.commit()
        return {"status": "ok", "plan_id": plan.id, "imported": imported}


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
    if not teacher_data or not isinstance(teacher_data, dict):
        return None
    
    name = normalize_teacher_name(teacher_data.get("name"))
    email = (teacher_data.get("email") or "").strip().lower() or None
    category = normalize_teacher_category(teacher_data.get("category"))
    dedication = normalize_teacher_dedication(teacher_data.get("dedication"))
    normalized_key = normalize_teacher_key(name) if name else None

    # If no valid data, return None (don't create empty teacher)
    if not name and not email:
        return None

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

    # Only create new teacher if we have at least a name
    if not name:
        return None
    
    teacher = models.Teacher(
        name=name,
        normalized_key=normalized_key,
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
            description = (item.get("description") or item.get("descripcion") or "").strip()
            level = normalize_competency_level(item.get("level") or item.get("level_label") or item.get("nivel"))
        else:
            data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
            code = (data.get("code") or "").strip()
            description = (data.get("description") or data.get("descripcion") or "").strip()
            level = normalize_competency_level(data.get("level") or data.get("level_label") or data.get("nivel"))
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


def ensure_competency_catalog(
    db: Session,
    career: str,
    items: list[dict],
    competency_type: str,
    plan_name: str | None = None,
) -> None:
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
            models.CompetencyCatalog.plan_name == (plan_name or None),
        ).first()
        if existing:
            if not existing.description and description:
                existing.description = description
                db.add(existing)
            continue
        db.add(models.CompetencyCatalog(
            career=career,
            plan_name=plan_name or None,
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
        filename=file.filename,
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
        resp = create_chat_completion_compatible(
            client,
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=300,
        )
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
        resp = create_chat_completion_compatible(
            client,
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
        resp = create_chat_completion_compatible(
            client,
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


@app.get("/intelligent-controls", response_model=list[schemas.IntelligentControlOut])
def list_intelligent_controls(topic: str = "", db: Session = Depends(get_db)):
    query = db.query(models.IntelligentControl)
    if topic:
        query = query.filter(models.IntelligentControl.topic == normalize_intelligent_topic(topic))
    return query.order_by(
        models.IntelligentControl.topic.asc(),
        models.IntelligentControl.sort_order.asc(),
        models.IntelligentControl.id.asc(),
    ).all()


@app.get("/intelligent-controls/settings", response_model=schemas.IntelligentControlSettingsOut)
def get_intelligent_control_settings(db: Session = Depends(get_db)):
    settings = get_or_create_intelligent_settings(db)
    return serialize_intelligent_settings(settings)


@app.patch("/intelligent-controls/settings", response_model=schemas.IntelligentControlSettingsOut)
def update_intelligent_control_settings(payload: schemas.IntelligentControlSettingsUpdate, db: Session = Depends(get_db)):
    settings = get_or_create_intelligent_settings(db)
    defaults = default_intelligent_mode_settings()
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

    if "director_last_mode" in data and data["director_last_mode"] is not None:
        settings.director_last_mode = normalize_intelligent_mode(data["director_last_mode"], default="delfin")
    if "docente_mode" in data and data["docente_mode"] is not None:
        settings.docente_mode = normalize_intelligent_mode(data["docente_mode"], default="guepardo")

    for mode in ("guepardo", "delfin", "ballena"):
        mode_payload = data.get(mode)
        if not isinstance(mode_payload, dict):
            continue

        if "model" in mode_payload and mode_payload.get("model") is not None:
            model_value = str(mode_payload.get("model") or "").strip()
            if model_value:
                setattr(settings, f"{mode}_model", model_value)

        if "temperature" in mode_payload and mode_payload.get("temperature") is not None:
            setattr(
                settings,
                f"{mode}_temperature",
                sanitize_mode_temperature(mode_payload.get("temperature"), defaults[mode]["temperature"]),
            )

        if "max_tokens" in mode_payload and mode_payload.get("max_tokens") is not None:
            setattr(
                settings,
                f"{mode}_max_tokens",
                sanitize_mode_max_tokens(mode_payload.get("max_tokens"), defaults[mode]["max_tokens"]),
            )

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return serialize_intelligent_settings(settings)


@app.post("/intelligent-controls", response_model=schemas.IntelligentControlOut)
def create_intelligent_control(payload: schemas.IntelligentControlCreate, db: Session = Depends(get_db)):
    main_topic = normalize_intelligent_topic(payload.topic)
    control = models.IntelligentControl(
        topic=main_topic,
        name=payload.name.strip(),
        instruction=payload.instruction.strip(),
        is_active=bool(payload.is_active) if payload.is_active is not None else True,
        sort_order=payload.sort_order,
        associated_topics=normalize_associated_topics(payload.associated_topics, main_topic),
    )
    db.add(control)
    db.commit()
    db.refresh(control)
    return control


@app.patch("/intelligent-controls/{control_id}", response_model=schemas.IntelligentControlOut)
def update_intelligent_control(control_id: int, payload: schemas.IntelligentControlUpdate, db: Session = Depends(get_db)):
    control = db.query(models.IntelligentControl).filter(models.IntelligentControl.id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    if "topic" in data:
        data["topic"] = normalize_intelligent_topic(data["topic"])
    if "name" in data and data["name"] is not None:
        data["name"] = str(data["name"]).strip()
    if "instruction" in data and data["instruction"] is not None:
        data["instruction"] = str(data["instruction"]).strip()
    if "associated_topics" in data:
        main_topic = data.get("topic", control.topic)
        data["associated_topics"] = normalize_associated_topics(data.get("associated_topics"), main_topic)

    for key, value in data.items():
        setattr(control, key, value)

    db.add(control)
    db.commit()
    db.refresh(control)
    return control


@app.delete("/intelligent-controls/{control_id}")
def delete_intelligent_control(control_id: int, db: Session = Depends(get_db)):
    control = db.query(models.IntelligentControl).filter(models.IntelligentControl.id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    db.query(models.ProposalIntelligentControlResult).filter(
        models.ProposalIntelligentControlResult.control_id == control_id
    ).delete()
    db.delete(control)
    db.commit()
    return {"status": "deleted", "id": control_id}


@app.get("/proposals/{proposal_id}/intelligent-controls/results", response_model=schemas.ProposalIntelligentControlsSummary)
def get_intelligent_control_results(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return build_intelligent_summary(db, proposal)


@app.post("/proposals/{proposal_id}/intelligent-controls/run", response_model=schemas.ProposalIntelligentControlsSummary)
def run_intelligent_controls(
    proposal_id: int,
    payload: schemas.IntelligentControlRunRequest = Body(default=None),
    db: Session = Depends(get_db),
):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    query = db.query(models.IntelligentControl).filter(models.IntelligentControl.is_active == True)
    requested_ids = []
    if payload and payload.control_ids:
        requested_ids = [int(value) for value in payload.control_ids if value is not None]
        if requested_ids:
            query = query.filter(models.IntelligentControl.id.in_(requested_ids))

    controls = query.order_by(
        models.IntelligentControl.topic.asc(),
        models.IntelligentControl.sort_order.asc(),
        models.IntelligentControl.id.asc(),
    ).all()

    selected_mode = normalize_intelligent_mode((payload.mode if payload else "delfin") or "delfin", default="delfin")

    if not controls:
        return build_intelligent_summary(db, proposal)

    for control in controls:
        topic_payload = build_topic_payload(proposal, control.topic)
        associated_context = build_associated_topic_payloads(proposal, getattr(control, "associated_topics", None))
        if not topic_payload.get("has_content"):
            llm_result = {
                "pass": False,
                "what_failed": f"El tópico '{control.topic}' no tiene contenido suficiente en la propuesta.",
                "why_failed": "No hay datos para aplicar el control inteligente.",
                "suggestion": "Completar este tópico en la propuesta y volver a ejecutar el control.",
                "proposed_text": "",
                "summary": "Control no ejecutable por falta de contenido",
                "raw_response": {"reason": "missing-topic-content"},
            }
        else:
            try:
                llm_result = evaluate_control_with_llm(
                    control,
                    proposal,
                    topic_payload,
                    mode=selected_mode,
                    associated_context=associated_context,
                )
            except Exception as exc:
                llm_result = {
                    "pass": False,
                    "what_failed": "No se pudo evaluar el control con el modelo.",
                    "why_failed": str(exc),
                    "suggestion": "Reintentar el control o revisar la configuración del modelo.",
                    "proposed_text": "",
                    "summary": "Error al ejecutar control inteligente",
                    "raw_response": {"error": str(exc)},
                }

        existing = db.query(models.ProposalIntelligentControlResult).filter(
            models.ProposalIntelligentControlResult.proposal_id == proposal.id,
            models.ProposalIntelligentControlResult.control_id == control.id,
        ).first()
        if not existing:
            existing = models.ProposalIntelligentControlResult(
                proposal_id=proposal.id,
                control_id=control.id,
            )
        existing.passed = bool(llm_result.get("pass"))
        existing.what_failed = llm_result.get("what_failed")
        existing.why_failed = llm_result.get("why_failed")
        existing.suggestion = llm_result.get("suggestion")
        existing.proposed_text = llm_result.get("proposed_text")
        existing.summary = llm_result.get("summary")
        existing.raw_response = llm_result.get("raw_response")
        existing.checked_at = datetime.utcnow()
        db.add(existing)
        db.commit()

    return build_intelligent_summary(db, proposal)


@app.patch("/proposals/{proposal_id}/intelligent-controls/results/{result_id}")
def update_intelligent_result(
    proposal_id: int,
    result_id: int,
    payload: schemas.ProposalIntelligentResultUpdate,
    db: Session = Depends(get_db),
):
    result = db.query(models.ProposalIntelligentControlResult).filter(
        models.ProposalIntelligentControlResult.id == result_id,
        models.ProposalIntelligentControlResult.proposal_id == proposal_id,
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(result, key, value)
    result.checked_at = datetime.utcnow()
    db.add(result)
    db.commit()
    return {"status": "updated", "id": result.id}


@app.patch("/proposals/{proposal_id}", response_model=schemas.Proposal)
def update_proposal(proposal_id: int, payload: schemas.ProposalUpdate, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)
    generic_items_raw = data.pop("generic_competencies_items", None)
    specific_items_raw = data.pop("specific_competencies_items", None)
    create_in_drive = bool(data.pop("create_in_drive", False))
    
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
        proposal_plan = data.get("study_plan") or proposal.study_plan
        ensure_competency_catalog(db, proposal_career, normalized, "generic", proposal_plan)
        replace_proposal_competencies(db, proposal.id, normalized, "generic")

    if specific_items_raw is not None:
        normalized = normalize_competency_items(specific_items_raw)
        data['specific_competencies'] = data.get('specific_competencies') or build_competencies_text(normalized)
        proposal_plan = data.get("study_plan") or proposal.study_plan
        ensure_competency_catalog(db, proposal_career, normalized, "specific", proposal_plan)
        replace_proposal_competencies(db, proposal.id, normalized, "specific")

    if 'teaching_team' in data:
        teacher_objs = []
        teacher_ids = []
        for entry in data['teaching_team'] or []:
            if not isinstance(entry, dict):
                continue
            teacher = upsert_teacher(db, entry)
            if teacher:  # Only process if teacher was created
                db.flush()
                ensure_teacher_career(db, teacher.id, proposal_career)
                teacher_objs.append(teacher)
                teacher_ids.append(teacher.id)
        if teacher_ids:
            replace_proposal_teachers(db, proposal.id, teacher_ids)
        data['teaching_team'] = build_teaching_team_payload(teacher_objs)
    
    for key, value in data.items():
        setattr(proposal, key, value)
    db.add(proposal)
    sync_subject_from_proposal(db, proposal)
    if create_in_drive and not proposal.gdoc_url:
        try_create_gdoc_for_proposal(db, proposal)
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


@app.post("/competencies/map-plans")
def map_competencies_to_plans(career: str = "", db: Session = Depends(get_db)):
    if not career:
        raise HTTPException(status_code=400, detail="Career is required")

    rows = db.query(models.ProposalCompetency, models.Proposal).join(models.Proposal).filter(
        models.Proposal.career == career
    ).all()

    entries = {}
    plans_by_code = {}
    for comp, proposal in rows:
        plan_name = (proposal.study_plan or "").strip()
        if not plan_name:
            continue
        code = (comp.code or "").strip()
        if not code:
            continue
        key = (comp.competency_type, code, plan_name)
        plans_by_code.setdefault((comp.competency_type, code), set()).add(plan_name)
        description = (comp.description or "").strip()
        if description and (key not in entries or len(description) > len(entries[key])):
            entries[key] = description

    created = 0
    updated = 0
    deleted = 0

    for (ctype, code, plan_name), description in entries.items():
        existing = db.query(models.CompetencyCatalog).filter(
            models.CompetencyCatalog.career == career,
            models.CompetencyCatalog.competency_type == ctype,
            models.CompetencyCatalog.code == code,
            models.CompetencyCatalog.plan_name == plan_name,
        ).first()
        if existing:
            if description and not existing.description:
                existing.description = description
                db.add(existing)
                updated += 1
            continue
        db.add(models.CompetencyCatalog(
            career=career,
            plan_name=plan_name,
            competency_type=ctype,
            code=code,
            description=description or "",
        ))
        created += 1

    unscoped_items = db.query(models.CompetencyCatalog).filter(
        models.CompetencyCatalog.career == career,
        models.CompetencyCatalog.plan_name.is_(None),
    ).all()
    for item in unscoped_items:
        code_key = (item.competency_type, (item.code or "").strip())
        plan_names = sorted(plans_by_code.get(code_key, set()))
        if len(plan_names) == 1:
            item.plan_name = plan_names[0]
            db.add(item)
            updated += 1
            continue
        if len(plan_names) > 1:
            for plan_name in plan_names:
                existing = db.query(models.CompetencyCatalog).filter(
                    models.CompetencyCatalog.career == career,
                    models.CompetencyCatalog.competency_type == item.competency_type,
                    models.CompetencyCatalog.code == item.code,
                    models.CompetencyCatalog.plan_name == plan_name,
                ).first()
                if existing:
                    continue
                description = entries.get((item.competency_type, item.code, plan_name)) or item.description or ""
                db.add(models.CompetencyCatalog(
                    career=career,
                    plan_name=plan_name,
                    competency_type=item.competency_type,
                    code=item.code,
                    description=description,
                ))
                created += 1
            db.delete(item)
            deleted += 1

    db.commit()

    catalog_items = db.query(models.CompetencyCatalog).filter(
        models.CompetencyCatalog.career == career,
    ).all()
    grouped = {}
    for item in catalog_items:
        key = (
            (item.plan_name or "").strip().lower(),
            (item.competency_type or "").strip().lower(),
            (item.code or "").strip().lower(),
        )
        grouped.setdefault(key, []).append(item)

    for key, items in grouped.items():
        if len(items) <= 1:
            continue
        def score(entry):
            description = (entry.description or "").strip()
            updated_at = entry.updated_at or entry.created_at
            timestamp = updated_at.timestamp() if updated_at else 0
            return (len(description), timestamp, entry.id)
        items_sorted = sorted(items, key=score, reverse=True)
        keep = items_sorted[0]
        for duplicate in items_sorted[1:]:
            db.delete(duplicate)
            deleted += 1
        db.add(keep)

    db.commit()
    return {
        "career": career,
        "created": created,
        "updated": updated,
        "deleted": deleted,
        "mapped": len(entries),
    }


@app.get("/competencies", response_model=list[schemas.CompetencyCatalogOut])
def list_competencies(
    career: str = "",
    competency_type: str = "",
    plan_name: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(models.CompetencyCatalog)
    if career:
        query = query.filter(models.CompetencyCatalog.career == career)
    if competency_type:
        query = query.filter(models.CompetencyCatalog.competency_type == competency_type)
    if plan_name:
        query = query.filter(models.CompetencyCatalog.plan_name == plan_name)
    return query.order_by(models.CompetencyCatalog.code.asc()).all()


@app.post("/competencies", response_model=schemas.CompetencyCatalogOut)
def create_competency(payload: schemas.CompetencyCatalogCreate, db: Session = Depends(get_db)):
    if not payload.plan_name:
        raise HTTPException(status_code=400, detail="Competency plan is required")
    existing = db.query(models.CompetencyCatalog).filter(
        models.CompetencyCatalog.career == payload.career,
        models.CompetencyCatalog.competency_type == payload.competency_type,
        func.lower(models.CompetencyCatalog.code) == payload.code.strip().lower(),
        func.coalesce(models.CompetencyCatalog.plan_name, "") == (payload.plan_name or ""),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Competency code already exists")
    item = models.CompetencyCatalog(
        career=payload.career,
        plan_name=payload.plan_name,
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
    target_career = data.get("career", item.career)
    target_type = data.get("competency_type", item.competency_type)
    target_code = data.get("code", item.code)
    target_plan = data.get("plan_name", item.plan_name)
    if target_code and target_career and target_type:
        existing = db.query(models.CompetencyCatalog).filter(
            models.CompetencyCatalog.id != competency_id,
            models.CompetencyCatalog.career == target_career,
            models.CompetencyCatalog.competency_type == target_type,
            func.lower(models.CompetencyCatalog.code) == str(target_code).strip().lower(),
            func.coalesce(models.CompetencyCatalog.plan_name, "") == (target_plan or ""),
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Competency code already exists")
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
    query = db.query(models.ProposalCompetency).join(models.Proposal).filter(
        models.Proposal.career == item.career,
        models.ProposalCompetency.competency_type == item.competency_type,
        models.ProposalCompetency.code == item.code,
    )
    if item.plan_name:
        query = query.filter(models.Proposal.study_plan == item.plan_name)
    rows = query.all()
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
    query = db.query(models.ProposalCompetency).join(models.Proposal).filter(
        models.Proposal.career == item.career,
        models.ProposalCompetency.competency_type == item.competency_type,
        models.ProposalCompetency.code == item.code,
    )
    if item.plan_name:
        query = query.filter(models.Proposal.study_plan == item.plan_name)
    affected_rows = query.all()
    affected_ids = {row.proposal_id for row in affected_rows}
    if affected_ids:
        delete_query = db.query(models.ProposalCompetency).filter(
            models.ProposalCompetency.proposal_id.in_(affected_ids),
            models.ProposalCompetency.competency_type == item.competency_type,
            models.ProposalCompetency.code == item.code,
        )
        if item.plan_name:
            delete_query = delete_query.join(models.Proposal).filter(
                models.Proposal.study_plan == item.plan_name
            )
        delete_query.delete(synchronize_session=False)
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
    if not teacher:
        raise HTTPException(status_code=400, detail="El docente debe tener al menos un nombre o correo")
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
            "quarter": proposal.quarter,
            "year_of_career": proposal.year_of_career,
            "academic_year": proposal.academic_year,
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

    # Generate filename: Año°_Cuatrimestre - Asignatura.docx
    year = proposal.year_of_career or "0"
    quarter_raw = proposal.quarter or "0"
    subject = proposal.subject or "Sin_Asignatura"
    
    # Normalize quarter to 1° , 2° , or A
    import re
    quarter_lower = str(quarter_raw).lower()
    if "anual" in quarter_lower or quarter_lower.strip() == "a":
        quarter = "A"
    elif "1" in quarter_lower or "primer" in quarter_lower:
        quarter = "1°"
    elif "2" in quarter_lower or "segundo" in quarter_lower:
        quarter = "2°"
    else:
        quarter = quarter_raw
    
    # Clean filename (remove invalid characters)
    subject_clean = re.sub(r'[<>:"/\\|?*]', '', subject)
    
    year_display = f"{year}°" if str(year).strip() else "0°"
    filename = f"{year_display}_{quarter} - {subject_clean}.docx"
    return FileResponse(
        output_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )


@app.post("/proposals")
def create_proposal(proposal: schemas.ProposalCreate, db: Session = Depends(get_db)):
    """Create a new proposal from form data (no file upload)."""
    try:
        subject_clean = re.sub(r'[<>:"/\\|?*]', '', proposal.subject or '').strip()
        safe_subject = subject_clean or "Sin materia"
        safe_year = proposal.academic_year or "Sin año"
        safe_quarter = proposal.quarter or "Sin cuatrimestre"
        filename = f"{safe_year} - {safe_quarter} - {safe_subject}.docx"

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
            if teacher:  # Only process if teacher was created
                db.flush()
                ensure_teacher_career(db, teacher.id, proposal.career)
                teacher_objs.append(teacher)
                teacher_ids.append(teacher.id)
        teaching_team_payload = build_teaching_team_payload(teacher_objs)
        
        generic_items = normalize_competency_items(proposal.generic_competencies_items or [])
        specific_items = normalize_competency_items(proposal.specific_competencies_items or [])

        create_in_drive = bool(getattr(proposal, "create_in_drive", False))

        db_proposal = models.Proposal(
            title=proposal.title,
            filename=filename,
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
            source_type=proposal.source_type or ("gdoc" if proposal.gdoc_url else "manual"),
            gdoc_url=proposal.gdoc_url,
            status=proposal.status or "EnProceso"
        )
        db.add(db_proposal)
        db.flush()
        if teacher_ids:
            replace_proposal_teachers(db, db_proposal.id, teacher_ids)
        if generic_items:
            ensure_competency_catalog(db, proposal.career, generic_items, "generic", proposal.study_plan)
        if specific_items:
            ensure_competency_catalog(db, proposal.career, specific_items, "specific", proposal.study_plan)
        if generic_items:
            replace_proposal_competencies(db, db_proposal.id, generic_items, "generic")
        if specific_items:
            replace_proposal_competencies(db, db_proposal.id, specific_items, "specific")
        sync_subject_from_proposal(db, db_proposal)
        drive_creation_success = False
        drive_creation_error = None
        if create_in_drive and not db_proposal.gdoc_url:
            drive_creation_success, drive_creation_error = try_create_gdoc_for_proposal(db, db_proposal)
        
        db.commit()
        db.refresh(db_proposal)
        return {
            "id": db_proposal.id,
            "title": db_proposal.title,
            "career": db_proposal.career,
            "subject": db_proposal.subject,
            "study_plan": db_proposal.study_plan,
            "status": db_proposal.status,
            "created_at": db_proposal.created_at,
            "study_subject_id": db_proposal.study_subject_id,
            "gdoc_url": db_proposal.gdoc_url,
            "drive_creation_requested": create_in_drive,
            "drive_creation_success": drive_creation_success,
            "drive_creation_error": drive_creation_error,
        }
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


@app.post("/proposals/{proposal_id}/sync-to-study-plan")
async def sync_proposal_to_study_plan(proposal_id: int, db: Session = Depends(get_db)):
    """
    Force synchronization of a proposal to the study plan.
    Useful for debugging why a proposal isn't linking to the plan.
    """
    db_proposal = db.query(models.Proposal).filter(models.Proposal.id == proposal_id).first()
    if not db_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Log the current state
    log_message = f"Syncing proposal {proposal_id} to study plan:\n"
    log_message += f"  - career: {db_proposal.career}\n"
    log_message += f"  - subject: {db_proposal.subject}\n"
    log_message += f"  - study_plan: {db_proposal.study_plan}\n"
    log_message += f"  - year_of_career: {db_proposal.year_of_career}\n"
    log_message += f"  - quarter: {db_proposal.quarter}\n"
    print(f"[DEBUG] {log_message}")
    
    # Check prerequisites
    if not db_proposal.career:
        raise HTTPException(status_code=400, detail="Proposal has no career specified")
    if not db_proposal.subject:
        raise HTTPException(status_code=400, detail="Proposal has no subject specified")
    
    try:
        # Perform the sync
        sync_subject_from_proposal(db, db_proposal)
        db.commit()
        db.refresh(db_proposal)
        
        return {
            "success": True,
            "message": "Proposal synced to study plan",
            "study_subject_id": db_proposal.study_subject_id,
            "debug_info": log_message.replace("\n", " | ")
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
