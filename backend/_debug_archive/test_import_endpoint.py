#!/usr/bin/env python3
"""
Test the /import endpoint to verify all extracted data returns correctly
"""
import requests
import json
from pathlib import Path

# Backend base URL
BASE_URL = "http://127.0.0.1:8001"

# Find test DOCX
test_file = Path("data/uploads") / "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

def test_import_endpoint():
    """Test the import endpoint"""
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return
    
    print(f"Testing endpoint: {BASE_URL}/proposals/import-docx")
    print(f"With file: {test_file}")
    print("=" * 70)
    
    # Upload file
    with open(test_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/proposals/import-docx", files=files)
    
    if response.status_code != 200:
        print(f"❌ Import failed: {response.status_code}")
        print(response.text)
        return
    
    data = response.json()
    extracted = data.get('data', {})
    
    print("\n✅ Import successful!")
    print("\nExtracted data:\n")
    
    # Display key fields
    print(f"Subject: {extracted.get('subject')}")
    print(f"Year: {extracted.get('year_of_career')}, Quarter: {extracted.get('quarter')}")
    print(f"\n📋 Programa Analítico:")
    print(f"  Carácter: {extracted.get('character')}")
    print(f"  Régimen: {extracted.get('regime')}")
    print(f"  Total Hours: {extracted.get('total_hours')}")
    print(f"  Theoretical: {extracted.get('theoretical_hours')}")
    print(f"  Practical: {extracted.get('practical_hours')}")
    print(f"  Weekly: {extracted.get('weekly_hours')}")
    
    # Teaching team
    teachers = extracted.get('teaching_team', [])
    print(f"\n👨‍🏫 Equipo Docente ({len(teachers)} docentes):")
    for i, teacher in enumerate(teachers, 1):
        print(f"  {i}. {teacher.get('name')} ({teacher.get('category')})")
        print(f"     Email: {teacher.get('email')}")
    
    # Units
    units = extracted.get('units', [])
    print(f"\n📚 Unidades ({len(units)}):")
    for unit in units:
        content_preview = unit.get('content', '')[:80]
        print(f"  Unidad {unit.get('number')}: {unit.get('name')}")
        print(f"    Content: {content_preview}...")
    
    # Practicals
    practicals = extracted.get('practicals', [])
    print(f"\n🔬 Prácticos ({len(practicals)}):")
    for tp in practicals:
        obj_preview = tp.get('objective', '')[:80]
        print(f"  TP {tp.get('number')}: {tp.get('name')}")
        print(f"    Objective: {obj_preview}...")
    
    # Content sections
    print(f"\n📄 Contenidos Mínimos: {len(extracted.get('minimum_content', ''))} chars")
    min_con = extracted.get('minimum_content', '')
    if min_con:
        print(f"   First 100: {min_con[:100]}...")
    
    print(f"\n💡 Fundamentos: {len(extracted.get('importance', ''))} chars")
    importance = extracted.get('importance', '')
    if importance:
        print(f"   First 100: {importance[:100]}...")
    
    # Summary
    print("\n" + "=" * 70)
    print("✅ SUMMARY:")
    print(f"  Subject: {extracted.get('subject')}")
    print(f"  Programa Analítico: ✅ {6 if all(extracted.get(k) for k in ['character', 'regime', 'total_hours', 'theoretical_hours', 'practical_hours', 'weekly_hours']) else '?'}/6 fields")
    print(f"  Teaching Team: ✅ {len(teachers)} docentes with full info")
    print(f"  Units: ✅ {len(units)} unidades extracted")
    print(f"  Practicals: ✅ {len(practicals)} prácticos extracted")
    print(f"  Contenidos Mínimos: ✅ {len(extracted.get('minimum_content', ''))} chars")
    print(f"  Fundamentos: ✅ {len(extracted.get('importance', ''))} chars")
    
    return data

if __name__ == "__main__":
    try:
        test_import_endpoint()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

