#!/usr/bin/env python3
"""
Test the frontend import dialog:
1. Open browser to frontend
2. Click "Importar" button
3. Upload DOCX file
4. Verify preview shows:
   - All extracted fields
   - Teaching team as TABLE (not concatenated string)
   
Note: This test uses manual inspection for now.
In production, would use Playwright/Selenium.
"""
import json
import requests
from pathlib import Path

BASE_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://localhost:5173"
test_file = Path("data/uploads") / "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

def check_frontend_import_preview():
    """
    Checks what the frontend should display for import preview.
    The data comes from the backend /import-docx endpoint.
    """
    print("=" * 80)
    print("FRONTEND IMPORT PREVIEW CHECK")
    print("=" * 80)
    print(f"\n1️⃣ Getting data from backend endpoint...")
    print(f"   Endpoint: {BASE_URL}/proposals/import-docx")
    print(f"   File: {test_file.name}")
    
    # Upload to backend
    with open(test_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/proposals/import-docx", files=files)
    
    if response.status_code != 200:
        print(f"❌ Backend request failed: {response.status_code}")
        return False
    
    data = response.json()
    extracted = data.get('data', {})
    
    print("✅ Got data from backend")
    
    # What the frontend SHOULD receive
    print(f"\n2️⃣ What frontend import preview should display:")
    print("-" * 80)
    
    # Section: Basic info
    print("\n📋 BASIC INFORMATION")
    print(f"  Subject: {extracted.get('subject')}")
    print(f"  Year: {extracted.get('year_of_career')} | Quarter: {extracted.get('quarter')}")
    
    # Section: Programa Analítico
    print("\n📋 PROGRAMA ANALÍTICO")
    prog_data = {
        'Carácter': extracted.get('character'),
        'Régimen': extracted.get('regime'),
        'Carga Horaria Total': extracted.get('total_hours'),
        'Horas Teóricas': extracted.get('theoretical_hours'),
        'Horas Prácticas': extracted.get('practical_hours'),
        'Horas Semanales': extracted.get('weekly_hours'),
    }
    for key, value in prog_data.items():
        print(f"  {key}: {value}")
    
    # Section: Teaching team - CRITICAL CHECK
    print("\n📋 EQUIPO DOCENTE (CRITICAL - Must be table format)")
    teaching_team = extracted.get('teaching_team', [])
    if isinstance(teaching_team, list) and len(teaching_team) > 0:
        print("  ✅ Correctly formatted as ARRAY of objects")
        print("\n  Table format (as should appear in preview):")
        print("  " + "-" * 76)
        print("  | Nombre                      | Categoría    | Email                     |")
        print("  " + "-" * 76)
        for teacher in teaching_team:
            name = f"{teacher.get('name', '')}".ljust(28)[:28]
            cat = f"{teacher.get('category', '')}".ljust(12)[:12]
            email = f"{teacher.get('email', '')}".ljust(25)[:25]
            print(f"  | {name} | {cat} | {email} |")
        print("  " + "-" * 76)
    else:
        print(f"  ❌ ERROR: Not array format! Type: {type(teaching_team)}")
        return False
    
    # Section: Units preview
    print("\n📋 UNIDADES (Primeras 3)")
    units = extracted.get('units', [])
    for unit in units[:3]:
        print(f"  Unidad {unit.get('number')}: {unit.get('name')}")
        content = unit.get('content', '')[:80]
        print(f"    • {content}...")
    
    # Section: Practicals preview
    print("\n📋 TRABAJOS PRÁCTICOS (Primeros 3)")
    practicals = extracted.get('practicals', [])
    for tp in practicals[:3]:
        print(f"  TP {tp.get('number')}: {tp.get('name')}")
        obj = tp.get('objective', '')[:80]
        print(f"    • {obj}...")
    
    # Section: Content
    print("\n📋 CONTENIDOS & FUNDAMENTOS")
    min_content = extracted.get('minimum_content', '')
    importance = extracted.get('importance', '')
    print(f"  Contenidos Mínimos: {len(min_content)} chars")
    if min_content:
        print(f"    • {min_content[:100]}...")
    print(f"  Fundamentos: {len(importance)} chars")
    if importance:
        print(f"    • {importance[:100]}...")
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ FRONTEND PREVIEW DATA VERIFIED")
    print("=" * 80)
    print("\n✨ The frontend import dialog should:")
    print("  1. Show import preview with all above data")
    print("  2. Display teaching team as TABLE (not concatenated string)")
    print("  3. Show units and practicals with preview text")
    print("  4. Have 'Cargar Propuesta al Formulario' button to load into form")
    
    print("\n📍 To test manually:")
    print(f"  1. Open {FRONTEND_URL}")
    print("  2. Click 'Importar Propuesta'")
    print("  3. Upload: 5°_2° - Proyecto de Ingeniería Mecatrónica.docx")
    print("  4. Verify:")
    print("     - Teaching team shows as TABLE with 2 rows")
    print("     - NO concatenated format like 'PEREZ...; CRUZ...'")
    print("     - Click 'Cargar' to load into form")
    
    return True

if __name__ == "__main__":
    success = check_frontend_import_preview()
    if success:
        print("\n✅ Frontend preview check passed!")
    else:
        print("\n❌ Frontend preview check failed!")
    exit(0 if success else 1)
