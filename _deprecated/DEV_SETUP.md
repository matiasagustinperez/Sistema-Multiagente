# TesisMCD — Production Readiness Guide

**Status**: Ready for development. Production deployment requires completing the 8-step checklist.

## 📋 Quick Links
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** ← Start here for production readiness
- **[INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md)** — Windows-specific setup instructions
- **API Docs**: http://localhost:8001/docs (when running)

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Python 3.10+ (check: `python --version`)
- Node.js 18+ (check: `node --version`)
- Git (already installed)

### 1️⃣ Clone & Initialize
```powershell
cd C:\TesisMCD

# Ensure venv exists
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
```

### 2️⃣ Configure Secrets
```powershell
# Backend secrets
cd C:\TesisMCD\backend
copy .env.example .env
# Open .env and paste your OPENAI_API_KEY from https://platform.openai.com/account/api-keys

# Frontend settings (already created)
# C:\TesisMCD\frontend\.env.local has correct API URL
```

### 3️⃣ Start Development Servers
**Terminal 1 (Backend)**:
```powershell
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 (Frontend)**:
```powershell
cd C:\TesisMCD\frontend
npm run dev
```

### 4️⃣ Test It Works
- Open http://localhost:5173
- Upload a Word document (.docx)
- Click "Get suggestion" (uses OpenAI)
- Celebrate! 🎉

---

## 🆚 What's Fixed So Far

| Item | Status | Details |
|------|--------|---------|
| Hardcoded port mismatch | ✅ Fixed | Frontend now uses env var `VITE_API_URL` |
| API key security | ✅ Secured | `.env` template created, never commit actual keys |
| Environment variables | ✅ Complete | Both backend and frontend `.env` files ready |
| Port configuration | ✅ Configurable | Via `.env` and environment variables |
| Startup validation | ✅ Added | Backend checks for required env vars on startup |

---

## 📊 Production Checklist (8 Items)

Before deploying to production, complete these in order:

| # | Task | Priority | Time | Status |
|---|------|----------|------|--------|
| 1 | Fix hardcoded ports | 🔴 Critical | 10m | ✅ Done |
| 2 | Install hnswlib | 🟠 High | 15m | ⏳ Optional |
| 3 | Secure API keys | 🔴 Critical | 10m | ✅ Done |
| 4 | Database migrations | 🟡 Medium | 30m | ⏳ Optional |
| 5 | Environment variables | 🔴 Critical | 10m | ✅ Done |
| 6 | Logging & monitoring | 🟡 Medium | 1h | 📋 Next |
| 7 | Rate limiting | 🟡 Medium | 30m | 📋 Next |
| 8 | Tests & CI/CD | 🟡 Medium | 2h | 📋 Next |

**See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for detailed instructions for each item.**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ React + Vite Frontend (http://localhost:5173)             │
│ ├─ Upload .docx files                                    │
│ ├─ List proposals                                        │
│ └─ Accept AI suggestions                                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST API
                     │ (VITE_API_URL env var)
┌────────────────────▼────────────────────────────────────┐
│ FastAPI Backend (http://localhost:8001)                   │
│ ├─ /upload          → Save file + trigger extraction     │
│ ├─ /proposals       → List all proposals                 │
│ ├─ /search          → Semantic search in index           │
│ ├─ /suggest         → Generate AI suggestion             │
│ └─ /proposals/{id}  → Update proposal status/notes       │
└────────────────┬──────────────────┬──────────────────────┘
                 │                  │
        ┌────────▼────────┐ ┌───────▼──────────┐
        │ LocalIndexer    │ │ SQLite/Postgres  │
        │ (HNSW or numpy) │ │ Database         │
        │ Vector Search   │ │ Proposal Metadata│
        └─────────────────┘ └──────────────────┘
        
        ✓ OpenAI API (text-embedding-3-small, gpt-4o-mini)
```

---

## 🔧 Key Components

### Backend (`backend/`)
- **`app/main.py`** — FastAPI app, endpoints, middleware
- **`app/database.py`** — SQLAlchemy ORM setup
- **`app/models.py`** — Database schema (Proposal table)
- **`agents/extract.py`** — Document extraction, chunking, embeddings
- **`agents/indexer.py`** — Local vector index (HNSW or numpy)

### Frontend (`frontend/`)
- **`src/App.jsx`** — Main React component
- **`src/main.jsx`** — Vite entry point
- **`.env.local`** — Environment variables (VITE_API_URL)

### Data (`data/`)
- **`uploads/`** — Uploaded .docx files
- **`vector_index/`** — Persisted vector index (hnsw_index.bin, metadata.json)
- **`proposals.db`** — SQLite database (dev only)

---

## 📖 API Endpoints Guide

### Upload Document
```bash
POST /upload
Content-Type: multipart/form-data

file: (binary .docx)
uploader: "user@university.edu"
career: "Engineering"
subject: "Data Structures"
```

**Response** (201):
```json
{
  "id": 1,
  "filename": "./data/uploads/proposal.docx",
  "original_filename": "proposal.docx",
  "uploader": "user@university.edu",
  "career": "Engineering",
  "subject": "Data Structures",
  "status": "uploaded",
  "created_at": "2026-02-15T10:30:00Z"
}
```

### Get Suggestions
```bash
POST /suggest
Content-Type: application/x-www-form-urlencoded

proposal_id=1
prompt_context=missing_details_about_course_goals
```

**Response** (200):
```json
{
  "suggestion": "Based on the provided evidence...",
  "evidence_used": [
    {"metadata": {"text": "..." }, "score": 0.92},
    {"metadata": {"text": "..." }, "score": 0.87}
  ]
}
```

**Full API docs**: http://localhost:8001/docs (interactive Swagger UI)

---

## 🆘 Troubleshooting

### Backend fails to start: `OPENAI_API_KEY not set`
**Solution:**
```powershell
cd C:\TesisMCD\backend
# Check if .env file exists
ls .env

# If not, create it from template
copy .env.example .env

# Edit and add your actual key
notepad .env
# Paste: OPENAI_API_KEY=sk-proj-xxxxx...
```

### Frontend can't connect to backend: `fetch failed`
**Solution:**
```powershell
# Check backend is running on correct port
curl http://localhost:8001/proposals  # Should work

# Check frontend has correct API URL
cat C:\TesisMCD\frontend\.env.local
# Should show: VITE_API_URL=http://localhost:8001

# Refresh frontend in browser (Ctrl+F5)
```

### Port 8001 already in use
**Solution:**
```powershell
# Find process using port 8001
Get-NetTCPConnection -LocalPort 8001

# Kill it (replace PID with actual process ID)
Stop-Process -Id 1234 -Force

# Or use different port
uvicorn app.main:app --port 8000
```

### Upload fails with `413 Payload Too Large`
**Current limit**: 20MB (configurable in `main.py`)
```python
# To increase:
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB
```

---

## 📚 next Steps

### Immediate
1. [ ] **Run the health check script**
   ```powershell
   C:\TesisMCD\health-check.ps1
   ```

2. [ ] **Start dev servers and test**
   ```powershell
   # Terminal 1: Backend
   cd backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload --port 8001
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

3. [ ] **Upload a test document**
   - Go to http://localhost:5173
   - Upload any .docx file
   - Verify it appears in the list

### Short-term (Before production)
- See **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** Items 2, 6, 7, 8

### Deployment
- Azure App Service (backend) + Static Web Apps (frontend)
- Docker containerization
- GitHub Actions CI/CD pipeline
- Environment-specific configurations

---

## 🤝 Contributing

### Code Style
- Python: PEP 8 (use `black` formatter)
- JavaScript: ESLint (use `npm run lint`)
- Commit messages: `feat:`, `fix:`, `docs:` prefixes

### Making Changes
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with descriptive message
4. Push and create pull request

### Running Tests (setup required)
```powershell
pip install pytest pytest-asyncio
pytest tests/ -v
```

---

## 📞 Support

- **API Documentation**: http://localhost:8001/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **FastAPI Guide**: https://fastapi.tiangolo.com
- **Issues**: Check [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md#-common-issues--fixes)

---

**Last updated**: 2026-02-15  
**Status**: ✅ Development Ready | ⏳ Production Setup In Progress
