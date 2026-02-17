# Production Readiness Checklist for TesisMCD

## 📊 5-Line Summary
**TesisMCD** is a local-first document processing system for university accreditation reviews (CONEAU). Users upload Word proposals, the backend extracts content and generates embeddings via OpenAI API, stores them in a local vector index, and provides semantic search with AI suggestions. The React+Vite frontend handles uploads, proposal listing, and suggestion acceptance. All processing runs locally without external cloud storage except OpenAI.

---

## ✅ 8-Step Production Checklist

### 1. Fix Hardcoded API Endpoints (PORT MISMATCH)
**Status**: ✅ COMPLETE
- Frontend now uses `VITE_API_URL` environment variable (defaults to `http://localhost:8001`)
- Backend configurable via `.env` (BACKEND_HOST, BACKEND_PORT)
- All `localhost:8000` references removed from App.jsx

**Verification:**
```powershell
# Frontend should connect to backend on port 8001
echo "VITE_API_URL=http://localhost:8001" > frontend/.env.local

# Backend should run on 8001
npm run dev  # Frontend
uvicorn app.main:app --port 8001  # Backend
```

---

### 2. Install hnswlib for Vector Search Optimization
**Status**: ⚠️ PENDING (numpy fallback is working but slow)

**Why**: numpy-based brute force search is O(n*d) slow. hnswlib provides O(log n) HNSW algorithm ~ 10-100x faster.

**Option A: Conda (EASIEST on Windows)**
```powershell
conda install -c conda-forge hnswlib
```

**Option B: MSVC Build Tools (Manual)**
1. Download "C++ Build Tools for Visual Studio 2022" from Microsoft
2. Install → Select "Desktop development with C++"
3. Run: `pip install hnswlib`

**Option C: Verify Current State**
```powershell
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
python -c "import hnswlib; print('hnswlib installed')" || echo "Using numpy fallback"
```

---

### 3. Secure OpenAI API Keys
**Status**: ✅ COMPLETE

**What was fixed:**
- ✅ `.env.example` created as safe template (with instructions)
- ✅ `.env` contains placeholder value (safe)
- ✅ Never commit actual `.env` to git

**For developer:**
```powershell
cd C:\TesisMCD\backend

# Copy template
copy .env.example .env

# Edit .env and replace value
notepad .env
# Paste your real API key: OPENAI_API_KEY=sk-proj-xxxxx...

# Verify it's loaded
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key loaded:', 'sk-' in os.getenv('OPENAI_API_KEY', ''))"
```

**Get your key:**
- OpenAI Dashboard: https://platform.openai.com/account/api-keys
- Create new secret key, copy immediately (shown once)

**Security checklist:**
- [ ] `.env` in `.gitignore` (check: `git status`)
- [ ] Never share `.env` content in Slack/email
- [ ] Rotate keys monthly in production
- [ ] Use read-only DB users where applicable

---

### 4. Database Migrations Setup (Optional for Dev)
**Status**: ⚠️ READY BUT OPTIONAL

**Current state**: SQLite auto-initialized via `init_db()` in `on_startup()`

**For production with schema changes, use Alembic:**
```powershell
cd C:\TesisMCD\backend

# Initialize (one time)
alembic init alembic

# Create migration from model changes
alembic revision --autogenerate -m "add_proposal_notes_field"

# Apply migration
alembic upgrade head
```

**Current DB location**: `./data/proposals.db` (configured in `.env` as DATABASE_URL)

---

### 5. Environment Variables Complete Setup
**Status**: ✅ COMPLETE

**Backend `.env` (create from `.env.example`):**
```
OPENAI_API_KEY=sk-proj-your-actual-key
LOCAL_UPLOAD_PATH=./data/uploads
LOCAL_INDEX_PATH=./data/vector_index
DATABASE_URL=sqlite:///./data/proposals.db
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8001
FRONTEND_URL=http://localhost:5173
DEBUG=true
```

**Frontend `.env.local`:**
```
VITE_API_URL=http://localhost:8001
VITE_DEBUG=true
```

**Validation script:**
```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
required = ['OPENAI_API_KEY', 'DATABASE_URL']
missing = [k for k in required if not os.getenv(k)]
print('✓ All vars set' if not missing else f'✗ Missing: {missing}')
"

# Frontend
cd frontend
npm run build  # Will show if VITE_API_URL is accessible
```

---

### 6. Logging & Error Handling (Structured)
**Status**: ⚠️ RECOMMENDED for next phase

**Recommended package**: `python-json-logger` or built-in `logging`

**Example implementation:**
```python
# backend/app/config.py
import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = os.getenv('LOG_DIR', './data/logs')
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger('TesisMCD')
logger.setLevel(logging.INFO)

# File handler
fh = RotatingFileHandler(f'{LOG_DIR}/backend.log', maxBytes=10_000_000, backupCount=5)
fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(fh)

# Console handler  
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
logger.addHandler(ch)
```

**Usage:**
```python
from app.config import logger

try:
    extract_agent.process_file(path, proposal_id)
    logger.info(f"Processed proposal {proposal_id}")
except Exception as e:
    logger.error(f"Failed to process {proposal_id}: {str(e)}", exc_info=True)
```

---

### 7. API Rate Limiting & Input Validation
**Status**: ⚠️ RECOMMENDED for next phase

**Install slowapi:**
```powershell
pip install slowapi
```

**Implement rate limiting:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def ratelimit_handler(request, exc):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

@app.post("/upload")
@limiter.limit("5/minute")  # 5 uploads per minute per IP
async def upload_proposal(...):
    # validate file size
    max_size = 20 * 1024 * 1024  # 20 MB
    if file.size > max_size:
        raise HTTPException(status_code=413, detail="File too large")
    ...
```

**File validation checklist:**
- [ ] Max file size: 20 MB
- [ ] Only .docx files allowed
- [ ] Filename sanitization (no ../, etc.)
- [ ] Timeout on OpenAI calls (30s)

---

### 8. Testing & CI/CD Pipeline
**Status**: ⚠️ READY FOR IMPLEMENTATION

**Install test framework:**
```powershell
pip install pytest pytest-asyncio
```

**Create tests structure:**
```
tests/
├── __init__.py
├── test_extract.py    # Test docx parsing and chunking
├── test_indexer.py    # Test vector search
├── test_api.py        # Test endpoints
└── conftest.py        # Pytest fixtures
```

**Example test:**
```python
# tests/test_extract.py
import pytest
from agents.extract import chunk_text, extract_text_from_docx

def test_chunk_text():
    text = "A" * 5000
    chunks = chunk_text(text, max_chars=2000)
    assert len(chunks) == 3
    assert len(chunks[-1]) == 1000

@pytest.mark.asyncio
async def test_upload_endpoint(client):
    response = await client.post(
        "/upload",
        data={"file": ("test.docx", b"dummy content")}
    )
    assert response.status_code == 200
```

**Run tests locally:**
```powershell
cd C:\TesisMCD
pytest tests/ -v
```

**CI/CD: GitHub Actions Example**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - run: pip install -r backend/requirements.txt
      - run: pytest tests/
```

---

## 🚀 Quick Start for Windows Developer

**Step 1: Backend Setup** (5 min)
```powershell
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copy and edit .env
copy .env.example .env
notepad .env  # Add your OPENAI_API_KEY
```

**Step 2: Frontend Setup** (2 min)
```powershell
cd C:\TesisMCD\frontend
npm install
echo "VITE_API_URL=http://localhost:8001" > .env.local
```

**Step 3: Run Dev Servers** (2 terminals)
```powershell
# Terminal 1
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2
cd C:\TesisMCD\frontend
npm run dev
```

**Step 4: Test**
```powershell
Start http://localhost:5173
# Upload a .docx file → Should work!
```

---

## 📈 Performance Optimization: Index Strategy

### Current State (numpy fallback)
- ✅ Works for small datasets (< 1000 vectors)
- ⚠️ Slow for large datasets (O(n) search)
- Memory: vectors stored in RAM

### Upgrade to hnswlib
- ✅ Install via conda (recommended)
- ✅ Automatic HNSW index creation on first upsert
- ✅ Index persisted to `data/vector_index/hnsw_index.bin`
- Speed improvement: ~10-100x for 10k+ vectors

### Further Optimization (Production)
1. **Batch embeddings**: Process 100 chunks at once (faster)
2. **Index tuning**: Adjust `M=16` and `ef_construction=200` in indexer.py based on dataset size
3. **Vector quantization**: Use `text-embedding-3-small` (1536 dims) not `text-embedding-3-large` (3072 dims)
4. **Database indexing**: Add SQL index on proposal_id if searches by proposal become slow

---

## 🔗 Next Steps Priority Order

1. **Immediate (Before running in production)**
   - [ ] Set real OPENAI_API_KEY in `.env`
   - [ ] Test backend + frontend together
   - [ ] Install hnswlib if planning for > 1000 proposals

2. **Short-term (1-2 weeks)**
   - [ ] Add basic logging to extract.py and indexer.py
   - [ ] Set up pytest with 10-15 tests
   - [ ] Document API schema (use Swagger: visit `http://localhost:8001/docs`)

3. **Medium-term (Production Deploy)**
   - [ ] Set up GitHub Actions CI/CD
   - [ ] Use PostgreSQL instead of SQLite
   - [ ] Add rate limiting and request validation
   - [ ] Deploy backend (Azure App Service / AWS Lambda)
   - [ ] Deploy frontend (Azure Static Web Apps / Vercel)

4. **Long-term (Scaling)**
   - [ ] Redis caching for frequent queries
   - [ ] Consider switch to cloud vector DB (Pinecone, Azure Cognitive Search) if > 100k vectors
   - [ ] Multi-region deployment if needed

---

## 🆘 Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| `Port 8001 already in use` | Another process using port | Change to 8000 or kill process: `netstat -ano \| findstr :8001` → `taskkill /PID xxxx` |
| `OPENAI_API_KEY not found` | .env not loaded or key missing | Verify: `$env:OPENAI_API_KEY` should show key |
| `hnswlib not found` | Not installed | `conda install -c conda-forge hnswlib` or `pip install hnswlib` |
| `Frontend can't reach backend` | CORS issue or wrong port | Check VITE_API_URL in .env.local matches backend port |
| `Slow vector search` | Using numpy fallback | Install hnswlib (see step 2 above) |
| `NullPointerException in App.jsx` | import.meta.env undefined | Ensure you're using Vite (check vite.config.js exists) |

---

## 📞 Support Files
- [INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md) — Detailed Windows setup guide
- Backend docs: `http://localhost:8001/docs` (Swagger UI)
- OpenAI API docs: https://platform.openai.com/docs/api-reference
- FastAPI docs: https://fastapi.tiangolo.com
