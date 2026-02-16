#!/usr/bin/env python
"""Test del endpoint de importación DOCX"""
import requests
import json

# Endpoint
url = "http://localhost:8001/proposals/import-docx"

# Archivo DOCX
file_path = r'c:\TesisMCD\backend\data\uploads\5°_2° - Proyecto de Ingeniería Mecatrónica.docx'

with open(file_path, 'rb') as f:
    files = {'file': (f.name, f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    response = requests.post(url, files=files)

print(f"Status Code: {response.status_code}")
print(f"\nResponse JSON:\n")
data = response.json()
print(json.dumps(data, indent=2, ensure_ascii=False))

# Mostrar preview específico
if data.get('success'):
    print("\n" + "=" * 80)
    print("PREVIEW RESUMEN")
    print("=" * 80)
    preview = data.get('preview', {})
    for key, value in preview.items():
        print(f"{key}: {value}")
    
    # Mostrar teaching team
    print("\n" + "=" * 80)
    print("EQUIPO DOCENTE COMPLETO")
    print("=" * 80)
    teaching_team = data.get('data', {}).get('teaching_team', [])
    for idx, prof in enumerate(teaching_team, 1):
        print(f"{idx}. {prof['name']} ({prof['category']}) - {prof['email']}")
    
    # Mostrar unidades
    print("\n" + "=" * 80)
    print("UNIDADES")
    print("=" * 80)
    units = data.get('data', {}).get('units', [])
    for unit in units:
        print(f"Unidad {unit['number']}: {unit['name']}")
    
    # Mostrar prácticos
    print("\n" + "=" * 80)
    print("PRÁCTICOS")
    print("=" * 80)
    practicals = data.get('data', {}).get('practicals', [])
    for tp in practicals:
        print(f"TP {tp['number']}: {tp['name']}")
