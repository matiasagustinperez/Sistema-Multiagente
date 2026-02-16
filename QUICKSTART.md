# ⚡ TesisMCD — 5-Minute Quick Start (Windows)

**Estimated time**: 5 minutes (assuming you have Python 3.10+ and Node.js 18+ installed)

## ✅ Pre-Flight Checklist (2 min)

```powershell
# Check Python version (must be 3.10+)
python --version

# Check Node version (must be 18+)
node --version

# Navigate to project root
cd C:\TesisMCD
```

---

## 🔑 Step 1: Configure Your OpenAI Key (1 min)

🔴 **CRITICAL** — You need an OpenAI API key to proceed

```powershell
# Create .env file from template
cd C:\TesisMCD\backend
copy .env.example .env

# Open .env in your editor
notepad .env

# Inside .env, find this line:
#   OPENAI_API_KEY=sk-your-actual-key-here
#
# Replace with your actual key from:
# https://platform.openai.com/account/api-keys
#
# Save the file (Ctrl+S, then close)
```

✅ **Verify it worked:**
```powershell
# You should see "True" below
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key loaded:', 'sk-' in os.getenv('OPENAI_API_KEY', ''))"
```

> **Don't have an OpenAI key?**
> 1. Visit https://platform.openai.com/account/api-keys
> 2. Click "Create new secret key"
> 3. Copy it (only shown once!)
> 4. Paste in `.env` file

---

## ⚙️ Step 2: Install Python Dependencies (1 min)

```powershell
# Activate virtual environment
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1

# Install packages from requirements.txt
pip install -r requirements.txt

# Verify installations
python -c "import fastapi, openai, sqlalchemy; print('✓ All dependencies installed')"
```

> **Windows-specific note on hnswlib:**  
> `hnswlib` (vector search optimization) requires C++ build tools. If installation fails:
> - Option A: Install from conda instead (easier): `conda install -c conda-forge hnswlib`
> - Option B: Skip it for now (uses slower numpy fallback, still works fine for testing)

---

## 📦 Step 3: Install Frontend & Create Config (1 min)

```powershell
# Install Node packages
cd C:\TesisMCD\frontend
npm install

# Create frontend environment config (should already exist, verify)
ls .env.local  # Should exist and contain: VITE_API_URL=http://localhost:8001

# If it doesn't exist, create it:
echo "VITE_API_URL=http://localhost:8001" > .env.local
```

---

## 🚀 Step 4: Start Backend Server (30 sec)

**Open PowerShell Terminal #1:**

```powershell
cd C:\TesisMCD\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# You should see:
# ✓ Uvicorn running on http://127.0.0.1:8001
# ✓ Backend startup validation passed
```

✅ **Keep this terminal running!**

---

## 🎨 Step 5: Start Frontend Dev Server (30 sec)

**Open PowerShell Terminal #2:**

```powershell
cd C:\TesisMCD\frontend

# Start Vite dev server
npm run dev

# You should see:
# ✓ VITE v5.0.0  ready in 150 ms
# ➜  Local: http://localhost:5173/
```

✅ **Keep this terminal running!**

---

## 🧪 Test It! (1 min)

1. **Open browser**: http://localhost:5173
2. **Upload a test file**:
   - Click "Choose file"
   - Select any .docx file (Word document) from your computer
   - Fill in optional fields: email, career, subject
   - Click "Subir" (Upload)
   - You should see the file appear in the table below
3. **Get an AI Suggestion**:
   - Click "Get suggestion" button next to the uploaded file
   - Wait 5-10 seconds (it's calling OpenAI)
   - You should see a text suggestion appear
4. **Accept the suggestion**:
   - Click "Accept suggestion" to save it

✅ **If all this works, you're done!**

---

## 🆘 Troubleshooting

### ❌ Backend won't start: "OPENAI_API_KEY not set"
```powershell
# Check .env file exists and has your real key
cat C:\TesisMCD\backend\.env

# If it shows "sk-your-actual-key-here", you haven't set your real key
# Edit the file: notepad C:\TesisMCD\backend\.env
```

### ❌ Frontend can't connect: "fetch failed"
```powershell
# Verify backend is running
curl http://localhost:8001/proposals
# Should return JSON like: [...]

# If backend is running, try refreshing browser (Ctrl+F5)
```

### ❌ Port 8001 already in use
```powershell
# Find what's using it
Get-NetTCPConnection -LocalPort 8001 | Select-Object OwningProcess

# Kill the process (replace 1234 with actual PID)
Stop-Process -Id 1234 -Force

# Or use different port
uvicorn app.main:app --port 8000
# Then update .env.local: VITE_API_URL=http://localhost:8000
```

### ❌ npm: command not found
```powershell
# Node.js is not installed
# Download from https://nodejs.org/
# Install and restart PowerShell, then try npm install again
```

---

## 📚 Next Steps

- **✅ Done with basic setup?**
  
- **Want to understand the code?**  
  Read [DEV_SETUP.md](./DEV_SETUP.md) for architecture overview

- **Ready for production?**  
  Follow [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) (8 items)

- **Found a bug?**  
  Check [PRODUCTION_CHECKLIST.md#-common-issues--fixes](./PRODUCTION_CHECKLIST.md) for solutions

---

## 🎯 Quick Reference: Commands

```powershell
# Backend
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001

# Frontend
cd C:\TesisMCD\frontend
npm run dev

# API Docs (when running)
http://localhost:8001/docs

# Frontend
http://localhost:5173
```

---

**Status**: ✅ Setup Complete!  
**Need help?** Check the docs in the troubleshooting section above or read [DEV_SETUP.md](./DEV_SETUP.md)
