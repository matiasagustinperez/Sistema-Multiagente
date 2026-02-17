import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_generic_competencies, extract_specific_competencies

# Texto de prueba: todas las competencias en una sola línea
test_text = "CGT1 - Identificar, formular y resolver problemas de ingeniería mecatrónica - Alto - CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto"

print("="*80)
print("TEST: EXTRACT_GENERIC_COMPETENCIES CON PATRÓN ACTUALIZADO")
print("="*80)
print(f"\nTexto de entrada (en una sola línea):")
print(test_text[:100] + "...\n")

result = extract_generic_competencies(test_text)

print(f"Competencias encontradas: {len(result)}\n")

for idx, comp in enumerate(result, 1):
    print(f"{idx}. Código: {comp['code']}")
    print(f"   Descripción: {comp['description'][:70]}...")
    print(f"   Nivel: {comp['level']}")
    print()

# Verificar
if len(result) == 3:
    print("✓✓✓ ÉXITO: Se encontraron todas las 3 competencias genéricas")
else:
    print(f"✗ FALLO: Se esperaban 3, se encontraron {len(result)}")

# Test adicional con Específicas
print("\n" + "="*80)
print("TEST: EXTRACT_SPECIFIC_COMPETENCIES")
print("="*80)

test_ce_text = "CE1 - Aplicar metodologías ágiles en proyectos - Medio - CE2 - Comunicación efectiva en equipos - Alto - CE3 - Liderazgo y gestión de recursos - Alto"

result_ce = extract_specific_competencies(test_ce_text)

print(f"Competencias específicas encontradas: {len(result_ce)}\n")

for idx, comp in enumerate(result_ce, 1):
    print(f"{idx}. Código: {comp['code']}")
    print(f"   Descripción: {comp['description'][:70]}...")
    print(f"   Nivel: {comp['level']}")
    print()

if len(result_ce) == 3:
    print("✓✓✓ ÉXITO: Se encontraron todas las 3 competencias específicas")
else:
    print(f"✗ FALLO: Se esperaban 3, se encontraron {len(result_ce)}")

print("="*80)
