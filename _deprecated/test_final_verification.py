import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies

# Texto exacto que el usuario reportó (lo reprodVzco tal cual)
test_text = "CGT1 - Identificar, formular y resolver problemas de ingeniería mecatrónica (Alto - CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto - CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica - Alto - CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto)"

print("="*70)
print("PRUEBA FINAL - FORMATO EXACTO DEL USUARIO")
print("="*70)

comps = extract_generic_competencies(test_text)

print(f"\nCOMPETENCIAS ENCONTRADAS: {len(comps)}\n")

for idx, comp in enumerate(comps, 1):
    print(f"{idx}. [{comp['code']}] - {comp['level']}")
    desc = comp['description']
    print(f"   {desc[:70] if len(desc) > 70 else desc}")

# Análisis
print(f"\n{'='*70}")
codes = [c['code'] for c in comps]
unique_codes = set(codes)
print(f"Códigos únicos: {sorted(unique_codes)}")
print(f"Total extraído: {len(comps)}")
print(f"Todos tienen nivel: {all(c['level'] for c in comps)}")

if all(c['level'] for c in comps) and len(comps) >= 5:
    print("\n✓✓✓ ¡ÉXITO! El patrón funciona correctamente")
else:
    print("\n✗ Hay problemas")

print("="*70)
