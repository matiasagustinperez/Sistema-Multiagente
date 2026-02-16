#!/usr/bin/env powershell
# TesisMCD — Quick Health Check & Startup Validator
# Run this before starting development servers

param(
    [switch]$FullCheck = $false
)

Write-Host "🏥 TesisMCD Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Colors
$success = "Green"
$warning = "Yellow"
$error = "Red"

function Check-Command {
    param([string]$Name, [string]$Test)
    try {
        Invoke-Expression $Test | Out-Null
        Write-Host "✓ $Name" -ForegroundColor $success
        return $true
    } catch {
        Write-Host "✗ $Name" -ForegroundColor $error
        return $false
    }
}

function Check-File {
    param([string]$Path)
    if (Test-Path $Path) {
        Write-Host "✓ $Path exists" -ForegroundColor $success
        return $true
    } else {
        Write-Host "✗ $Path missing" -ForegroundColor $error
        return $false
    }
}

# 1. Check directory structure
Write-Host "`n📁 Directory Structure" -ForegroundColor Cyan
Check-File ".\backend\.venv"
Check-File ".\frontend\node_modules"
Check-File ".\backend\.env"
Check-File ".\frontend\.env.local"
Check-File ".\data\uploads"

# 2. Check Python environment
Write-Host "`n🐍 Python Environment" -ForegroundColor Cyan
$pythonPath = ".\backend\.venv\Scripts\python.exe"
if (Test-Path $pythonPath) {
    Write-Host "✓ Virtual environment exists" -ForegroundColor $success
    
    # Check OPENAI_API_KEY
    $env:Path += ";.\backend\.venv\Scripts"
    $apiKeyTest = & $pythonPath -c "
import os
from dotenv import load_dotenv
load_dotenv()
has_key = bool(os.getenv('OPENAI_API_KEY'))
print('HAS_KEY' if has_key else 'NO_KEY')
"
    if ($apiKeyTest -eq "HAS_KEY") {
        Write-Host "✓ OPENAI_API_KEY is set" -ForegroundColor $success
    } else {
        Write-Host "✗ OPENAI_API_KEY not in .env (Required!)" -ForegroundColor $error
    }
} else {
    Write-Host "✗ Virtual environment not found" -ForegroundColor $error
    Write-Host "   Run: cd backend && python -m venv .venv" -ForegroundColor $warning
}

# 3. Check dependencies
Write-Host "`n📦 Python Dependencies" -ForegroundColor Cyan
$requiredPackages = @("fastapi", "uvicorn", "openai", "python-docx", "sqlalchemy")
foreach ($pkg in $requiredPackages) {
    $exists = & $pythonPath -c "import $pkg" 2>&1 -ErrorLevel
    if ($exists) {
        Write-Host "✓ $pkg" -ForegroundColor $success
    } else {
        Write-Host "⚠ $pkg not installed" -ForegroundColor $warning
    }
}

# Check hnswlib (optional but recommended)
$hnswExists = & $pythonPath -c "import hnswlib" 2>&1 -ErrorLevel
if ($hnswExists) {
    Write-Host "✓ hnswlib (optimized)" -ForegroundColor $success
} else {
    Write-Host "⚠ hnswlib not installed (numpy fallback active)" -ForegroundColor $warning
    Write-Host "   Install: conda install -c conda-forge hnswlib" -ForegroundColor $warning
}

# 4. Check Node.js environment
Write-Host "`n📱 Frontend (Node.js)" -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor $success
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor $error
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor $warning
}

# 5. Check ports availability
Write-Host "`n🔌 Port Availability" -ForegroundColor Cyan
$ports = @{ "8001" = "Backend"; "5173" = "Frontend" }
foreach ($port in $ports.GetEnumerator()) {
    $process = Get-NetTCPConnection -LocalPort $port.Key -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "⚠ Port $($port.Key) already in use ($($port.Value))" -ForegroundColor $warning
    } else {
        Write-Host "✓ Port $($port.Key) available" -ForegroundColor $success
    }
}

# 6. Full check (optional)
if ($FullCheck) {
    Write-Host "`n🔍 Full Dependency Check" -ForegroundColor Cyan
    & $pythonPath -m pip list | Select-Object -First 15
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Health Check Complete" -ForegroundColor $success
Write-Host "`nNext: Run 'npm run dev' and 'uvicorn app.main:app --reload'" -ForegroundColor Cyan
