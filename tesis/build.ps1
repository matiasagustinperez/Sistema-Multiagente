# build.ps1 — Compilar la tesis completa
# Uso: .\build.ps1
# Uso (solo PDF rápido, sin referencias): .\build.ps1 -Quick
# Uso (limpiar auxiliares): .\build.ps1 -Clean

param(
    [switch]$Quick,
    [switch]$Clean
)

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH", "User")

$tesis = "c:\TesisMCD\tesis"
Set-Location $tesis

if ($Clean) {
    Write-Host "Limpiando archivos auxiliares..." -ForegroundColor Yellow
    $extensions = "*.aux", "*.bbl", "*.bcf", "*.blg", "*.log", "*.out",
                  "*.toc", "*.lof", "*.lot", "*.run.xml", "*.fls", "*.fdb_latexmk", "*.synctex.gz"
    foreach ($ext in $extensions) {
        Remove-Item $ext -ErrorAction SilentlyContinue
    }
    Write-Host "Listo." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "=== Compilando tesis ===" -ForegroundColor Cyan

if ($Quick) {
    Write-Host "Modo rapido: una sola pasada de pdflatex" -ForegroundColor Yellow
    pdflatex -interaction=nonstopmode main.tex
} else {
    Write-Host "[1/3] pdflatex (primera pasada)..." -ForegroundColor Gray
    pdflatex -interaction=nonstopmode main.tex | Out-Null

    Write-Host "[2/3] biber (bibliografia APA)..." -ForegroundColor Gray
    biber main | Out-Null

    Write-Host "[3/3] pdflatex x2 (referencias + TOC)..." -ForegroundColor Gray
    pdflatex -interaction=nonstopmode main.tex | Out-Null
    pdflatex -interaction=nonstopmode main.tex | Out-Null
}

if (Test-Path "main.pdf") {
    $size = [math]::Round((Get-Item "main.pdf").Length / 1KB)
    Write-Host ""
    Write-Host "EXITO: main.pdf generado ($size KB)" -ForegroundColor Green
    Write-Host "Ruta: $tesis\main.pdf" -ForegroundColor Green
} else {
    Write-Host "ERROR: no se genero main.pdf. Revisa main.log para detalles." -ForegroundColor Red
    exit 1
}
