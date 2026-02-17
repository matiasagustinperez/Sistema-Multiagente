import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies

# Texto exacto del usuario
test_text = """CGT1 - Identificar, formular y resolver problemas de ingeniería mecatrónica (Alto - CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto - CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica - Alto - CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto)"""

print("="*70)
print("PRUEBA CON FORMATO REAL DEL USUARIO")
print("="*70)

print(f"\nTEXTO:\n{test_text[:150]}...\n")

comps = extract_generic_competencies(test_text)

print(f"COMPETENCIAS ENCONTRADAS: {len(comps)}\n")

for idx, comp in enumerate(comps, 1):
    print(f"{idx}. [{comp['code']}] {comp['level']}")
    print(f"   {comp['description'][:60]}...")
    print()

# Contar unitarios
print(f"TOTAL: {len(comps)} competencias\n")

if len(comps) >= 5:
    print("✓ Se detectaron múltiples competencias")
    print("\nVERIFICACIÓN:")
    for comp in comps:
        if not comp['level']:
            print(f"  ✗ {comp['code']} - SIN NIVEL")
        else:
            print(f"  ✓ {comp['code']} - Nivel: {comp['level']}")
else:
    print(f"✗ ERROR: Solo {len(comps)} competencias (esperaba al menos 5)")

print("\n" + "="*70)
