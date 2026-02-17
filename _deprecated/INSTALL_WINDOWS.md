# TesisMCD — Windows Development Setup

## Prerequisites
- Python 3.10+ (download from python.org)
- Node.js 18+ (from nodejs.org)
- Git
- MSVC Build Tools (for hnswlib) OR Conda

## Step 1: Backend Setup

```powershell
cd C:\TesisMCD\backend

# Create virtual environment (if not already done)
python -m venv .venv

# Activate venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# (Optional but recommended) Install hnswlib for better performance
# Option A: Using Conda (easiest on Windows)
conda install -c conda-forge hnswlib
# Option B: Using MSVC Build Tools (download from Microsoft, then)
pip install hnswlib

# Create .env file with your secrets
copy .env.example .env
# Open .env in your editor and add your OPENAI_API_KEY
```

## Step 2: Frontend Setup

```powershell
cd C:\TesisMCD\frontend

# Install dependencies
npm install

# Create .env for frontend (optional, but recommended)
# echo "VITE_API_URL=http://localhost:8001" > .env.local
```

## Step 3: Run Development Servers

**Terminal 1 — Backend:**
```powershell
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 — Frontend:**
```powershell
cd C:\TesisMCD\frontend
npm run dev
```

Access the app at `http://localhost:5173`

## Troubleshooting

### Port 8001 Already in Use
```powershell
# Find and kill process on port 8001
Get-Process | Where-Object {$_.ID -eq (Get-NetTCPConnection -LocalPort 8001 -ErrorAction Ignore).OwningProcess}
# Or use different port: uvicorn app.main:app --port 8000
```

### hnswlib Installation Fails
- Ensure you have MSVC Build Tools installed (C++ Build Tools for Visual Studio)
- Alternative: Use Conda instead (see Step 1)
- Current fallback uses numpy (works but slower for large datasets)

### OPENAI_API_KEY Not Found
```powershell
# Test environment variable is loaded
$env:OPENAI_API_KEY  # Should show your key
```

## Quick Health Check
```powershell
# Test backend is running
Invoke-WebRequest http://localhost:8001/proposals -ErrorAction Ignore

# Test frontend is running
Invoke-WebRequest http://localhost:5173 -ErrorAction Ignore
```
