#!/usr/bin/env python
"""
Script para importar y debuggear una propuesta desde Google Docs
"""
import sys
import os
from pathlib import Path

# Agregar el backend a la path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.docx_import import import_proposal_from_docx
from app.main import get_docx_from_gdoc_url
import tempfile
import json

# URL del Google Docs del usuario
gdoc_url = "1_7uykNmL_3QM0f_WjyvxJgLCw5nl00ME-fMZoVFDdQs"

try:
    print("📥 Descargando documento desde Google Docs...")
    docx_bytes = get_docx_from_gdoc_url(gdoc_url)
    
    # Guardar en archivo temporal
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(docx_bytes)
        tmp_path = tmp.name
    
    print(f"✓ Documento descargado a {tmp_path}")
    print("\n📖 Extrayendo contenido...")
    
    # Importar
    data = import_proposal_from_docx(tmp_path, "propuesta_test.docx")
    
    print("\n" + "="*80)
    print("RESULTADO DE LA EXTRACCIÓN")
    print("="*80)
    
    # Información general
    print(f"\n📋 Información General:")
    print(f"  Carrera: {data.get('career')}")
    print(f"  Asignatura: {data.get('subject')}")
    print(f"  Año: {data.get('year')}")
    print(f"  Cuatrimestre: {data.get('quarter')}")
    
    # Unidades
    print(f"\n📚 Unidades ({len(data.get('units', []))} encontradas):")
    for i, unit in enumerate(data.get('units', []), 1):
        print(f"\n  Unidad {i}: {unit.get('name')}")
        print(f"    Contenidos (primeros 200 caracteres):")
        contenidos = unit.get('contenidos', '')[:200]
        print(f"    {contenidos}...")
        
        # ESPECIAL: mostrar Unidad 4 completa
        if i == 4:
            print(f"\n    🔍 UNIDAD 4 - CONTENIDO COMPLETO:")
            print(f"    {unit.get('contenidos', 'NO ENCONTRADO')}")
            print(f"\n    Longitud: {len(unit.get('contenidos', ''))} caracteres")
    
    # Competencias
    print(f"\n🎯 Competencias Genéricas: {len(data.get('generic_competencies_items', []))}")
    print(f"🎯 Competencias Específicas: {len(data.get('specific_competencies_items', []))}")
    
    # RAs
    print(f"\n📊 Resultados de Aprendizaje: {len(data.get('learning_outcomes', []))}")
    
    # Limpiar
    os.unlink(tmp_path)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
