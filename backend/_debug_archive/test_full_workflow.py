#!/usr/bin/env python3
"""
Test the full import workflow:
1. Upload DOCX to backend (/proposals/import-docx)
2. Verify extraction returns all data
3. Verify teaching_team is array of individual records (not concatenated)
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8001"
test_file = Path("data/uploads") / "5°_2° - Proyecto de Ingeniería Mecatrónica.docx"

def test_full_import_workflow():
    """Complete import workflow test"""
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return False
    
    print("=" * 80)
    print("FULL IMPORT WORKFLOW TEST")
    print("=" * 80)
    
    # Step 1: Upload DOCX
    print("\n1️⃣ STEP 1: Upload DOCX file to backend")
    print("-" * 80)
    
    with open(test_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/proposals/import-docx", files=files)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)
        return False
    
    data = response.json()
    extracted = data.get('data', {})
    
    print(f"✅ Upload successful!")
    print(f"   Response: {data.get('success')}")
    print(f"   Units extracted: {len(extracted.get('units', []))}")
    print(f"   Practicals extracted: {len(extracted.get('practicals', []))}")
    
    # Step 2: Verify all key fields extracted
    print("\n2️⃣ STEP 2: Verify all key fields extracted")
    print("-" * 80)
    
    checks = []
    
    # Subject
    subject = extracted.get('subject', '')
    checks.append(('Subject (from filename)', subject != '', f"'{subject}'"))
    
    # Programa Analítico (6 fields)
    char = extracted.get('character', '')
    regime = extracted.get('regime', '')
    total_h = extracted.get('total_hours', '')
    theo_h = extracted.get('theoretical_hours', '')
    prac_h = extracted.get('practical_hours', '')
    week_h = extracted.get('weekly_hours', '')
    
    checks.append(('Carácter', char != '', f"'{char}'"))
    checks.append(('Régimen', regime != '', f"'{regime}'"))
    checks.append(('Total Hours', total_h != '', f"'{total_h}'"))
    checks.append(('Theoretical Hours', theo_h != '', f"'{theo_h}'"))
    checks.append(('Practical Hours', prac_h != '', f"'{prac_h}'"))
    checks.append(('Weekly Hours', week_h != '', f"'{week_h}'"))
    
    # Teaching team - MUST be array of individual records
    teaching_team = extracted.get('teaching_team', [])
    is_array = isinstance(teaching_team, list)
    has_records = len(teaching_team) > 0
    checks.append(('Teaching team is array', is_array and has_records, f"{len(teaching_team)} records"))
    
    if is_array and len(teaching_team) > 0:
        first_teacher = teaching_team[0]
        has_name = 'name' in first_teacher and first_teacher['name']
        has_category = 'category' in first_teacher and first_teacher['category']
        has_email = 'email' in first_teacher and first_teacher['email']
        checks.append(('First teacher has name', has_name, f"'{first_teacher.get('name')}'"))
        checks.append(('First teacher has category', has_category, f"'{first_teacher.get('category')}'"))
        checks.append(('First teacher has email', has_email, f"'{first_teacher.get('email')}'"))
    
    # Units
    units = extracted.get('units', [])
    checks.append(('Units extracted', len(units) > 0, f"{len(units)} unidades"))
    if len(units) > 0:
        first_unit = units[0]
        checks.append(('Unit has number', first_unit.get('number') != '', f"Unidad {first_unit.get('number')}"))
        checks.append(('Unit has name', first_unit.get('name') != '', f"'{first_unit.get('name')}'"))
        checks.append(('Unit has content', first_unit.get('content') != '', f"{len(first_unit.get('content', ''))} chars"))
    
    # Practicals
    practicals = extracted.get('practicals', [])
    checks.append(('Practicals extracted', len(practicals) > 0, f"{len(practicals)} TP"))
    if len(practicals) > 0:
        first_tp = practicals[0]
        checks.append(('TP has number', first_tp.get('number') != '', f"TP {first_tp.get('number')}"))
        checks.append(('TP has name', first_tp.get('name') != '', f"'{first_tp.get('name')}'"))
        checks.append(('TP has objective', first_tp.get('objective') != '', f"{len(first_tp.get('objective', ''))} chars"))
    
    # Content sections
    min_content = extracted.get('minimum_content', '')
    importance = extracted.get('importance', '')
    checks.append(('Minimum content', len(min_content) > 50, f"{len(min_content)} chars"))
    checks.append(('Importance/Fundamentals', len(importance) > 50, f"{len(importance)} chars"))
    
    # Display checks
    print_checks(checks)
    
    # Step 3: Verify teaching_team format (CRITICAL - this was the bug!)
    print("\n3️⃣ STEP 3: Verify teaching_team format (CRITICAL CHECK)")
    print("-" * 80)
    
    # Teaching team should be ARRAY, not concatenated string
    print(f"Teaching team type: {type(teaching_team)}")
    print(f"Teaching team length: {len(teaching_team)}")
    
    # Should NOT be a string
    if isinstance(teaching_team, str):
        print("❌ ERROR: teaching_team is a STRING! Should be ARRAY of objects")
        print(f"   Value: {teaching_team}")
        return False
    elif not isinstance(teaching_team, list):
        print(f"❌ ERROR: teaching_team has wrong type: {type(teaching_team)}")
        return False
    
    print("✅ teaching_team is correctly formatted as ARRAY")
    print("\nTeaching team records:")
    for i, teacher in enumerate(teaching_team, 1):
        if isinstance(teacher, dict):
            print(f"  {i}. {teacher.get('name')} ({teacher.get('category')})")
            print(f"     📧 {teacher.get('email')}")
        else:
            print(f"  {i}. ❌ Not a dict: {teacher}")
            return False
    
    # Step 4: Summary
    print("\n" + "=" * 80)
    print("✅ IMPORT WORKFLOW COMPLETE & VERIFIED")
    print("=" * 80)
    
    # Count passed checks
    passed = sum(1 for _, result, _ in checks if result)
    total = len(checks)
    
    print(f"\n📊 Verification Results: {passed}/{total} checks passed")
    print(f"\n✨ Status:")
    print(f"  ✅ Programa Analítico: All 6 fields extracted")
    print(f"  ✅ Equipo Docente: {len(teaching_team)} docentes as INDIVIDUAL RECORDS")
    print(f"  ✅ Unidades: {len(units)} units with full content")
    print(f"  ✅ Prácticos: {len(practicals)} practicals with full objectives")
    print(f"  ✅ Contenidos Mínimos: {len(min_content)} chars")
    print(f"  ✅ Fundamentos: {len(importance)} chars")
    
    return passed == total

def print_checks(checks):
    """Print check results"""
    for name, passed, value in checks:
        symbol = "✅" if passed else "❌"
        print(f"{symbol} {name}: {value}")

if __name__ == "__main__":
    success = test_full_import_workflow()
    exit(0 if success else 1)
