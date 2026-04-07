"""
Búsqueda semántica global por carrera.
Construye un índice vectorial (numpy puro) con embeddings de OpenAI para todas
las entidades relevantes (propuestas, docentes, evidencias de acreditación) y
permite consultar por similitud coseno.
No requiere dependencias de compilación (sin hnswlib/faiss).
"""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import numpy as np

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
_HERE = Path(__file__).parent
VECTOR_INDEX_DIR = (_HERE.parent.parent / "data" / "vector_index").resolve()

# ── Helpers ───────────────────────────────────────────────────────────────────

def _career_slug(career: str) -> str:
    n = unicodedata.normalize("NFKD", career)
    n = "".join(c for c in n if not unicodedata.combining(c))
    n = re.sub(r"[^a-zA-Z0-9]", "_", n).lower()
    return n[:40]


def _index_paths(career: str) -> tuple[Path, Path]:
    slug = _career_slug(career)
    return VECTOR_INDEX_DIR / f"{slug}.npy", VECTOR_INDEX_DIR / f"{slug}_meta.json"


def _join(*parts: Any) -> str:
    """Join non-empty string parts with a space."""
    return " ".join(str(p) for p in parts if p and str(p).strip())


def _flatten(val: Any) -> str:
    """Recursively flatten any JSON value to a plain string."""
    if val is None:
        return ""
    if isinstance(val, str):
        return val
    if isinstance(val, (int, float, bool)):
        return str(val)
    if isinstance(val, dict):
        return " ".join(_flatten(v) for v in val.values())
    if isinstance(val, list):
        return " ".join(_flatten(v) for v in val)
    return str(val)


def _embed(texts: list[str], client: Any) -> np.ndarray:
    if not texts:
        return np.zeros((0, 1536), dtype=np.float32)
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([e.embedding for e in resp.data], dtype=np.float32)


# ── Build ─────────────────────────────────────────────────────────────────────

def build_index(db: Any, career: str, get_client_fn: Callable) -> dict:
    """
    Builds (or rebuilds) the semantic index for *career*.
    Indexes: proposals (all content), teachers, accreditation evidences.
    Returns {"indexed": N, "career": ..., "dim": ...}
    """

    from app import models

    items: list[dict] = []   # {"text": str, "meta": dict}

    # ── 1. Propuestas ──────────────────────────────────────────────────────────
    proposals = (
        db.query(models.Proposal)
        .filter(models.Proposal.career == career)
        .all()
    )

    for p in proposals:
        base = {
            "type": "propuesta",
            "id": p.id,
            "title": p.subject or "Sin nombre",
            "subtitle": _join(
                f"Año {p.year_of_career}" if p.year_of_career else None,
                f"Cuatrimestre {p.quarter}" if p.quarter else None,
                p.status,
            ),
            "career": career,
            "nav": "propuestas",
        }

        # Texto principal: todos los campos de prosa
        prose = _join(
            p.subject,
            _flatten(p.fundamentals_part1),
            _flatten(p.fundamentals_part2),
            _flatten(p.minimum_content),
            _flatten(p.methodology),
            _flatten(p.evaluation),
            _flatten(p.bibliography),
            _flatten(p.learning_outcomes),
        )
        items.append({"text": prose[:3000], "meta": {**base, "match_field": "contenido general"}})

        # Unidades
        for u in (p.units or []):
            if not isinstance(u, dict):
                continue
            ut = _join(u.get("title"), u.get("content"), u.get("description"), u.get("objectives"))
            if ut.strip():
                items.append({
                    "text": ut[:1500],
                    "meta": {**base, "match_field": f"Unidad: {u.get('title', '')}"},
                })

        # Trabajos prácticos
        for tp in (p.practicals or []):
            if not isinstance(tp, dict):
                continue
            tt = _join(tp.get("title"), tp.get("description"), tp.get("content"), tp.get("objectives"))
            if tt.strip():
                items.append({
                    "text": tt[:1500],
                    "meta": {**base, "match_field": f"TP: {tp.get('title', '')}"},
                })

    # ── 2. Docentes ────────────────────────────────────────────────────────────
    tc_rows = (
        db.query(models.TeacherCareer)
        .filter(models.TeacherCareer.career == career)
        .all()
    )
    teacher_ids: set[int] = {tc.teacher_id for tc in tc_rows}

    career_obj = db.query(models.Career).filter(models.Career.name == career).first()
    committee_ids: set[int] = set()
    if career_obj:
        if career_obj.director_id:
            teacher_ids.add(career_obj.director_id)
        if career_obj.secretario_id:
            teacher_ids.add(career_obj.secretario_id)
        cmems = (
            db.query(models.CareerCommitteeMember)
            .filter(models.CareerCommitteeMember.career_id == career_obj.id)
            .all()
        )
        committee_ids = {cm.teacher_id for cm in cmems}
        teacher_ids.update(committee_ids)

    # Proposal-teacher map for this career
    prop_by_id = {p.id: p for p in proposals}
    pt_rows = (
        db.query(models.ProposalTeacher)
        .filter(models.ProposalTeacher.proposal_id.in_(prop_by_id.keys()))
        .all()
        if prop_by_id else []
    )
    teacher_to_subjects: dict[int, list[str]] = {}
    for pt in pt_rows:
        prop = prop_by_id.get(pt.proposal_id)
        if prop and prop.subject:
            teacher_to_subjects.setdefault(pt.teacher_id, []).append(prop.subject)

    if teacher_ids:
        teachers = (
            db.query(models.Teacher)
            .filter(models.Teacher.id.in_(teacher_ids))
            .all()
        )
        for t in teachers:
            roles: list[str] = []
            if career_obj:
                if career_obj.director_id == t.id:
                    roles.append("Director de carrera")
                if career_obj.secretario_id == t.id:
                    roles.append("Secretario de carrera")
            if t.id in committee_ids:
                roles.append("Comisión Curricular")

            subjects = teacher_to_subjects.get(t.id, [])

            text = _join(
                t.name,
                t.email,
                t.category,
                t.dedication,
                " ".join(roles),
                " ".join(subjects),
            )
            items.append({
                "text": text[:1200],
                "meta": {
                    "type": "docente",
                    "id": t.id,
                    "title": t.name or "Sin nombre",
                    "subtitle": " · ".join(filter(None, [
                        t.category,
                        t.dedication,
                        " | ".join(roles) if roles else None,
                    ])),
                    "career": career,
                    "subjects": subjects,
                    "roles": roles,
                    "nav": "docentes",
                },
            })

    # ── 3. Evidencias de acreditación ──────────────────────────────────────────
    evidences = (
        db.query(models.AccreditationEvidenceRegistry)
        .filter(models.AccreditationEvidenceRegistry.career == career)
        .all()
    )
    for ev in evidences:
        meta_text = _flatten(ev.metadata_json)
        text = _join(
            ev.title,
            ev.evidence_type,
            ev.source_filename,
            meta_text[:2000] if meta_text else None,
        )
        if not text.strip():
            continue
        items.append({
            "text": text[:2000],
            "meta": {
                "type": "evidencia",
                "id": ev.id,
                "title": ev.title or ev.source_filename or "Evidencia sin título",
                "subtitle": " · ".join(filter(None, [ev.evidence_type, ev.status])),
                "career": career,
                "nav": "acreditacion",
            },
        })

    if not items:
        return {"indexed": 0, "career": career}

    # ── Embeddings en lotes ────────────────────────────────────────────────────
    client = get_client_fn()
    batch_size = 100
    all_embs: list[np.ndarray] = []
    for i in range(0, len(items), batch_size):
        batch_texts = [it["text"] for it in items[i: i + batch_size]]
        all_embs.append(_embed(batch_texts, client))
    embeddings = np.vstack(all_embs)  # shape: (N, dim)

    # Normalizar para búsqueda coseno via dot-product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    embeddings_norm = (embeddings / norms).astype(np.float32)

    # ── Persistir ─────────────────────────────────────────────────────────────
    VECTOR_INDEX_DIR.mkdir(parents=True, exist_ok=True)
    idx_path, meta_path = _index_paths(career)
    np.save(str(idx_path), embeddings_norm)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(
            {"dim": int(embeddings_norm.shape[1]), "items": [it["meta"] for it in items], "built_at": datetime.utcnow().isoformat()},
            f,
            ensure_ascii=False,
        )

    logger.info("Built search index: career=%r items=%d dim=%d", career, len(items), int(embeddings_norm.shape[1]))
    return {"indexed": len(items), "career": career, "dim": int(embeddings_norm.shape[1])}


# ── Query ─────────────────────────────────────────────────────────────────────

SCORE_THRESHOLD = 0.25

def query_index(q: str, career: str, get_client_fn: Callable, top_k: int = 20) -> list[dict]:
    """
    Returns up to *top_k* deduplicated results sorted by relevance score (best first).
    Each result contains all metadata fields plus "score" (0–1, higher = more similar).
    """
    idx_path, meta_path = _index_paths(career)
    if not idx_path.exists() or not meta_path.exists():
        return []

    with open(meta_path, encoding="utf-8") as f:
        stored = json.load(f)

    metadata: list[dict] = stored["items"]
    if not metadata:
        return []

    # Load normalized embeddings matrix
    embeddings_norm: np.ndarray = np.load(str(idx_path))  # shape: (N, dim)

    # Embed and normalize query
    client = get_client_fn()
    q_emb = _embed([q], client)[0]
    q_norm = q_emb / (np.linalg.norm(q_emb) or 1.0)

    # Cosine similarity via dot product (embeddings already normalized)
    scores: np.ndarray = embeddings_norm @ q_norm  # shape: (N,)

    # Take top candidates
    k = min(top_k * 3, len(metadata))
    top_indices = np.argpartition(scores, -k)[-k:]
    top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]

    # Deduplicate by (type, id), keep best score per entity
    seen: dict[tuple, dict] = {}
    for idx in top_indices:
        score = float(scores[idx])
        if score < SCORE_THRESHOLD:
            continue
        meta = metadata[int(idx)]
        key = (meta.get("type"), meta.get("id"))
        if key not in seen or score > seen[key]["score"]:
            seen[key] = {**meta, "score": round(score, 3)}

    return sorted(seen.values(), key=lambda x: -x["score"])[:top_k]


# ── Info ──────────────────────────────────────────────────────────────────────

def index_info(career: str) -> dict:
    _, meta_path = _index_paths(career)
    if not meta_path.exists():
        return {"exists": False, "built_at": None, "item_count": 0}
    try:
        with open(meta_path, encoding="utf-8") as f:
            stored = json.load(f)
        built_raw = stored.get("built_at", "")
        built_fmt = ""
        if built_raw:
            try:
                built_fmt = datetime.fromisoformat(built_raw).strftime("%d/%m/%Y %H:%M")
            except Exception:
                built_fmt = built_raw[:16]
        return {
            "exists": True,
            "built_at": built_fmt,
            "item_count": len(stored.get("items", [])),
        }
    except Exception:
        return {"exists": False, "built_at": None, "item_count": 0}
