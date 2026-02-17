#!/usr/bin/env python
"""Compare direct import_proposal_from_docx result vs endpoint"""
import sys
sys.path.insert(0, 'c:\\TesisMCD\\backend')

from app.docx_import_final import import_proposal_from_docx
import json

file_path = r'c:\TesisMCD\backend\data\uploads\5°_2° - Proyecto de Ingeniería Mecatrónica.docx'
filename = '5°_2° - Proyecto de Ingeniería Mecatrónica.docx'

result = import_proposal_from_docx(file_path, filename)

print("=" * 80)
print("DIRECT FUNCTION CALL RESULT")
print("=" * 80)
print(f"Units: {len(result.get('units', []))} found")
for unit in result.get('units', []):
    print(f"  - Unidad {unit['number']}: {unit['name']}")

print(f"\nPracticals: {len(result.get('practicals', []))} found") 
for tp in result.get('practicals', []):
    print(f"  - TP {tp['number']}: {tp['name']}")

print(f"\nMinimum Content: {len(result.get('minimum_content', ''))} chars")
print(f"First 100 chars: {result.get('minimum_content', '')[:100]}")

print(f"\nFundamentals: {len(result.get('fundamentals', ''))} chars")
print(f"First 100 chars: {result.get('fundamentals', '')[:100]}")

# Mostrar TODO el resultado en JSON para debugging
print("\n" + "=" * 80)
print("FULL JSON OUTPUT")
print("=" * 80)
# Convertir a formato JSON-safe
safe_result = {}
for k, v in result.items():
    if isinstance(v, (list, dict, str, int, bool, type(None))):
        safe_result[k] = v
    else:
        safe_result[k] = str(v)

print(json.dumps(safe_result, indent=2, ensure_ascii=False)[:2000])
