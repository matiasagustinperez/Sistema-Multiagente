import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies

# Test con el formato que el usuario mostró
test_text = """
CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica (Medio - CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto - CGS2 - Comunicarse con efectividad - Medio - CGS4 - Aprender en forma continua y autónoma - Alto)
"""

print("=== TEST CON MÚLTIPLES COMPETENCIAS EN UNA LÍNEA ===\n")
print(f"Texto de entrada:\n{test_text}\n")

competencies = extract_generic_competencies(test_text)

print(f"Competencias encontradas: {len(competencies)}\n")

for idx, comp in enumerate(competencies, 1):
    print(f"{idx}. {comp['code']} - {comp['description'][:50]}... ({comp['level']})")

print("\n" + "="*60)

# Verificar que obtenemos las 4 competencias
expected = [
    ('CGT4', 'Medio'),
    ('CGT5', 'Alto'),
    ('CGS2', 'Medio'),
    ('CGS4', 'Alto')
]

print(f"\nVerificación:")
print(f"Esperadas: {len(expected)} competencias")
print(f"Encontradas: {len(competencies)} competencias")

if len(competencies) == len(expected):
    print("✓ Cantidad correcta")
    all_match = True
    for comp, (exp_code, exp_level) in zip(competencies, expected):
        match = comp['code'] == exp_code and comp['level'] == exp_level
        status = "✓" if match else "✗"
        print(f"  {status} {comp['code']} (nivel: {comp['level']}) == {exp_code} ({exp_level})")
        if not match:
            all_match = False
    
    if all_match:
        print("\n✓✓✓ ¡ÉXITO! Todas las competencias extraídas correctamente con niveles")
    else:
        print("\n✗ Algunos niveles no coinciden")
else:
    print(f"✗ Error: se encontraron {len(competencies)} en lugar de {len(expected)}")
