# TesisMCD — Accreditation Support Platform

**Local-first application for assisting university accreditation reviews (CONEAU)**

## 🚀 Quick Navigation

### 👤 I'm a Developer — Where Do I Start?

- **🏃 5-minute setup?** → [QUICKSTART.md](./QUICKSTART.md)
- **📚 Full documentation?** → [DEV_SETUP.md](./DEV_SETUP.md)
- **🪟 Windows issues?** → [INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md)
- **📋 Setup went wrong?** → Run `health-check.ps1`

### 🎯 I Want to Deploy to Production

- **Production checklist** → [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- **8-step roadmap** → Items 1-8 in production checklist
- **What's done so far?** → [SESSION_SUMMARY.md](./SESSION_SUMMARY.md)

### 🔍 Want to Understand the Architecture?

In [DEV_SETUP.md](./DEV_SETUP.md):
- Architecture diagram
- Component breakdown
- API endpoint guide
- Technology stack explanation

---

## 📋 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend (FastAPI)** | ✅ Working | Port 8001, all endpoints functional |
| **Frontend (React+Vite)** | ✅ Working | Port 5173, dynamic API URL |
| **Vector Index** | ⚠️ numpy fallback | Install hnswlib for 10-100x speedup |
| **OpenAI Integration** | ✅ Working | Embeddings + suggestions functional |
| **Security** | ✅ Fixed | API keys now properly secured |
| **Documentation** | ✅ Complete | 5 comprehensive guides created |
| **Testing** | ⏳ Pending | Pytest setup guide included |
| **CI/CD** | ⏳ Pending | GitHub Actions guide included |

---

## 🎯 What This Project Does

```
User uploads .docx → Extract text → Generate embeddings → 
  Store in local index → Search semantically → 
    Generate AI suggestions → Accept/Edit proposals
```

### Key Features
- 📤 Upload Word documents (.docx)
- 🔍 Semantic search with vector indices
- 🤖 AI-powered suggestions (OpenAI)
- 💾 Local-first (no cloud storage)
- 🚀 Fast vector search (with hnswlib)
- 📊 Track proposal status

---

## 📊 File Structure

```
C:\TesisMCD\
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── main.py            # API endpoints
│   │   ├── models.py          # Database schema
│   │   ├── database.py        # SQLite setup
│   │   └── schemas.py         # Pydantic models
│   ├── agents/
│   │   ├── extract.py         # Document → embeddings
│   │   └── indexer.py         # Vector search (HNSW/numpy)
│   ├── .venv/                 # Virtual environment
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Configuration (⚠️ never commit)
│   └── .env.example           # Template
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx            # Main UI component
│   │   └── main.jsx           # Entry point
│   ├── public/
│   ├── node_modules/          # npm dependencies
│   ├── .env.local             # Frontend config
│   └── package.json
│
├── data/                       # Local storage
│   ├── uploads/               # Uploaded .docx files
│   ├── logs/                  # Application logs
│   └── vector_index/          # Persisted vectors
│
└── docs/
    ├── QUICKSTART.md          # ✨ 5-min setup guide
    ├── INSTALL_WINDOWS.md     # Windows setup details
    ├── DEV_SETUP.md           # Full development guide
    ├── PRODUCTION_CHECKLIST.md # Production roadmap (8 items)
    ├── SESSION_SUMMARY.md     # What was done
    ├── health-check.ps1       # Validation script
    └── README.md              # This file
```

---

## ⚡ Quick Start (Copy & Paste)

```powershell
# Terminal 1: Backend
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
copy .env.example .env
# ⬇️ EDIT .env: paste your OPENAI_API_KEY
notepad .env
# ⬇️ SAVE and close
uvicorn app.main:app --reload --port 8001

# Terminal 2: Frontend
cd C:\TesisMCD\frontend
npm run dev

# Browser: http://localhost:5173
```

**That's it!** See [QUICKSTART.md](./QUICKSTART.md) for troubleshooting.

---

## 🔑 Getting Your OpenAI API Key (2 min)

1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy immediately (shown only once)
4. Paste into `backend/.env`: `OPENAI_API_KEY=sk-proj-xxxxx`

**Cost**: ~$0.10 per 500 proposal suggestions (very cheap!)

---

## 📚 Documentation Guide

### For New Developers
1. Read [QUICKSTART.md](./QUICKSTART.md) (5 min)
2. Run the health check: `health-check.ps1`
3. Start both servers and test

### For Understanding the Code
1. Read [DEV_SETUP.md](./DEV_SETUP.md) architecture section
2. Explore: `backend/app/main.py`, `frontend/src/App.jsx`
3. Check API docs: `http://localhost:8001/docs`

### For Production Deployment
1. Follow [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Items 1-3: Critical (10-30 min) — mostly already done
3. Items 4-8: Nice-to-have (2-3 hours)

### For Windows-Specific Issues
→ [INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md)

---

## ✅ Production Readiness Summary

**Currently completed:**
- ✅ (1/8) Port configuration fixed
- ✅ (3/8) API key security implemented
- ✅ (5/8) Environment variables configured
- ⏳ (2/8) hnswlib installation guide (optional, improves 10-100x)
- 📋 (4/8) Database migrations (ready with Alembic)
- 📋 (6/8) Logging & monitoring (code examples provided)
- 📋 (7/8) Rate limiting (code examples provided)
- 📋 (8/8) Testing & CI/CD (pytest guide provided)

**Progress**: 37.5% critical items done (3/8), remaining items documented

---

## 🆘 Troubleshooting

### Backend fails to start
```powershell
# Problem: "OPENAI_API_KEY not set"
# Solution: Edit backend/.env and add real key
notepad C:\TesisMCD\backend\.env
```

### Frontend can't connect
```powershell
# Problem: "fetch failed"
# Solution: Verify backend is running
curl http://localhost:8001/proposals
```

### Common errors
→ See [QUICKSTART.md](./QUICKSTART.md#-troubleshooting)

---

## 🔧 Environment Variables Quick Reference

### Backend (.env)
```
OPENAI_API_KEY=sk-proj-your-key-here    # From OpenAI dashboard
LOCAL_UPLOAD_PATH=./data/uploads        # Where to store uploaded files
LOCAL_INDEX_PATH=./data/vector_index    # Where to store vector index
DATABASE_URL=sqlite:///./data/proposals.db
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8001
FRONTEND_URL=http://localhost:5173
DEBUG=true
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8001     # Backend URL
```

---

## 💡 Key Technologies

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | FastAPI | Modern, fast, easy to use |
| Frontend | React + Vite | Fast, responsive, great DX |
| Vector DB | HNSW (or numpy) | Fast local search, no costs |
| Embeddings | OpenAI | High quality, cheap |
| Suggestions | GPT-4o-mini | Good quality, very fast |
| Storage | SQLite / .docx | Simple, no server needed |

---

## 📈 Scaling Path

### Current (MVP)
- Single-user local deployment
- SQLite database
- numpy vector search

### Next (Production)
- PostgreSQL database
- hnswlib vector search
- Rate limiting & logging
- GitHub Actions CI/CD

### Future (Enterprise)
- Dedicated vector DB (Pinecone)
- Redis caching
- Multi-user authentication
- Azure/AWS deployment

---

## 🤝 Contributing

See [DEV_SETUP.md](./DEV_SETUP.md#-contributing) for guidelines

---

## 📞 Support

| Question | Answer |
|----------|--------|
| How do I get started? | Read [QUICKSTART.md](./QUICKSTART.md) |
| Where's the API documentation? | http://localhost:8001/docs (when running) |
| How do I deploy to production? | Follow [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) |
| Windows keeps crashing? | See [INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md) |
| What's the current status? | See [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) |
| What was changed? | See [SESSION_SUMMARY.md](./SESSION_SUMMARY.md#-issues-fixed--improvements-made) |

---

## 📅 Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| Feb 15, 2026 | Development setup + security fixes | ✅ Complete |
| Soon | Install hnswlib + add logging | ⏳ Pending |
| Soon | Pytest tests + GitHub Actions | ⏳ Pending |
| Soon | Production deployment | ⏳ Pending |

---

## 📄 License

[See LICENSE file](./LICENSE)

---

## 🎯 Next Steps

### **Right Now** (5 min)
1. Run `health-check.ps1`
2. Follow [QUICKSTART.md](./QUICKSTART.md)
3. Test upload & suggestion feature

### **Today** (30 min)
1. Understand architecture ([DEV_SETUP.md](./DEV_SETUP.md))
2. Install hnswlib (optional but recommended)
3. Run health check again

### **This Week** (2-3 hours)
1. Follow [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Add pytest tests
3. Set up GitHub Actions CI/CD

---

**Welcome to TesisMCD!** 🚀  
Start here: [QUICKSTART.md](./QUICKSTART.md)
