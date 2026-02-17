#!/usr/bin/env python3
"""
Test script that imports a proposal DOCX via the backend HTTP API
"""
import os
import requests
import json

# Read test file
uploads_dir = "./data/uploads"
test_files = [f for f in os.listdir(uploads_dir) if f.endswith('.docx') and 'template' not in f.lower()]

if not test_files:
    print("No test files found")
    exit(1)

# Use first test file
test_file = test_files[0]
test_path = os.path.join(uploads_dir, test_file)

print(f"Testing with: {test_file}\n")

# Upload and import via API
try:
    with open(test_path, 'rb') as f:
        files = {'file': (test_file, f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post('http://127.0.0.1:8001/proposals/import-docx', files=files)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        exit(1)
    
    data = response.json().get('data', {})
    
    print(f"=== CARRERA ===")
    print(f"Carrera: {data.get('career', 'N/A')}")
    print(f"Asignatura: {data.get('subject', 'N/A')}")
    
    print(f"\n=== COMPETENCIAS GENÉRICAS ===")
    gen_comp = data.get('generic_competencies', [])
    print(f"Total: {len(gen_comp)}")
    for i, comp in enumerate(gen_comp, 1):
        print(f"{i}. {comp['code']} - {comp['description'][:50]}... - Nivel: '{comp['level']}'")
        if '\n' in repr(comp['level']):
            print(f"   ⚠ Nivel tiene caracteres especiales: {repr(comp['level'][:60])}")
    
    print(f"\n=== COMPETENCIAS ESPECÍFICAS ===")
    spec_comp = data.get('specific_competencies', [])
    print(f"Total: {len(spec_comp)}")
    for i, comp in enumerate(spec_comp, 1):
        print(f"{i}. {comp['code']} - {comp['description'][:50]}... - Nivel: '{comp['level']}'")
        if '\n' in repr(comp['level']):
            print(f"   ⚠ Nivel tiene caracteres especiales: {repr(comp['level'][:60])}")
    
    print(f"\n=== RESULTADOS DE APRENDIZAJE ===")
    los = data.get('learning_outcomes', [])
    print(f"Total: {len(los)}")
    for i, ra in enumerate(los, 1):
        print(f"{i}. {ra['code']}: {ra['description'][:60]}...")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
