import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies

# Texto EXACTO del DOCX real
test_text = """- CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Bajo
- CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica - Bajo
- CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Bajo
- CGS1 - Desempeñarse de manera efectiva en equipos de trabajo - Medio
- CGS2 - Comunicarse con efectividad - Bajo
- CGS4 - Aprender en forma continua y autónoma - Bajo"""

print("="*70)
print("PRUEBA CON FORMATO REAL DEL DOCX")
print("="*70)

print(f"\nTEXTO:\n{test_text}\n")

comps = extract_generic_competencies(test_text)

print(f"COMPETENCIAS ENCONTRADAS: {len(comps)}\n")

for comp in comps:
    print(f"{comp['code']}: {comp['description'][:50]}... ({comp['level']})")

print(f"\nESPERADAS: 6")
print(f"ENCONTRADAS: {len(comps)}")

if len(comps) == 6:
    print("✓ CORRECTO")
else:
    print("✗ ERROR")

print("\n" + "="*70)
