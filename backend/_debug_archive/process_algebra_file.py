"""Ejecutar process_file manualmente para propuesta existente"""
import sys
import os
sys.path.insert(0, os.getcwd())

from agents import extract

file_path = r"1º_1º - CBI - Álgebra I.docx"
proposal_id = 9

print("="*80)
print(f"PROCESANDO ARCHIVO PARA PROPUESTA {proposal_id}")
print("="*80)

result = extract.process_file(file_path, proposal_id)

print(f"\n✓ Resultado: {result}")
