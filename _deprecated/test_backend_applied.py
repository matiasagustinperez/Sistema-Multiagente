import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies, extract_specific_competencies

# Test con el formato del usuario
test_text = """
CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica (Medio - CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto - CGS2 - Comunicarse con efectividad - Medio - CGS4 - Aprender en forma continua y autónoma - Alto)
"""

print("="*70)
print("PRUEBA DE EXTRACCIÓN CON NUEVO PATRÓN")
print("="*70)

print(f"\nTEXTO DE ENTRADA:\n{test_text}\n")

cg_comps = extract_generic_competencies(test_text)

print(f"COMPETENCIAS GENÉRICAS ENCONTRADAS: {len(cg_comps)}\n")

for idx, comp in enumerate(cg_comps, 1):
    print(f"{idx}. [{comp['code']}] NIVEL: {comp['level']}")
    print(f"   Descripción: {comp['description'][:70]}...")
    print()

# Verificación
if len(cg_comps) == 4:
    print("✓ CORRECTO: Se encontraron las 4 competencias")
    
    checks = [
        (cg_comps[0]['code'] == 'CGT4' and cg_comps[0]['level'] == 'Medio', "CGT4 Medio"),
        (cg_comps[1]['code'] == 'CGT5' and cg_comps[1]['level'] == 'Alto', "CGT5 Alto"),
        (cg_comps[2]['code'] == 'CGS2' and cg_comps[2]['level'] == 'Medio', "CGS2 Medio"),
        (cg_comps[3]['code'] == 'CGS4' and cg_comps[3]['level'] == 'Alto', "CGS4 Alto"),
    ]
    
    print("\nVERIFICACIÓN INDIVIDUAL:")
    all_ok = True
    for check, desc in checks:
        status = "✓" if check else "✗"
        print(f"  {status} {desc}")
        if not check:
            all_ok = False
    
    if all_ok:
        print("\n✓✓✓ ¡ÉXITO! El nuevo patrón está funcionando correctamente")
    else:
        print("\n✗ Algunos niveles no coinciden")
else:
    print(f"✗ ERROR: Se encontraron {len(cg_comps)} en lugar de 4")

print("\n" + "="*70)
