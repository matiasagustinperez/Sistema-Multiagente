import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_learning_outcomes_parsed

# Test 1: Formato original con guión
test1 = """
- RA1 - Identificar operaciones matemáticas
- RA2 - Resolver ecuaciones diferenciales
- RA3 - Aplicar conceptos avanzados
"""

# Test 2: Formato nuevo sin guión con espacio
test2 = """
RA 1: Identificar operaciones matemáticas
RA 2: Resolver ecuaciones diferenciales
RA 3: Aplicar conceptos avanzados
"""

# Test 3: Formato sin guión sin espacio
test3 = """
RA1: Identificar operaciones matemáticas
RA2: Resolver ecuaciones diferenciales
RA3: Aplicar conceptos avanzados
"""

# Test 4: Formato mixto
test4 = """
- RA1 - Identificar operaciones matemáticas
RA 2: Resolver ecuaciones diferenciales
RA3. Aplicar conceptos avanzados
- RA4. Método alternativo
"""

print("="*70)
print("TEST 1: Formato original con guión (- RA1 - desc)")
print("="*70)
result1 = extract_learning_outcomes_parsed(test1)
for ra in result1:
    print(f"  {ra['code']}: {ra['description']}")

print("\n" + "="*70)
print("TEST 2: Formato nuevo sin guión (RA 1: desc)")
print("="*70)
result2 = extract_learning_outcomes_parsed(test2)
for ra in result2:
    print(f"  {ra['code']}: {ra['description']}")

print("\n" + "="*70)
print("TEST 3: Formato sin guión sin espacio (RA1: desc)")
print("="*70)
result3 = extract_learning_outcomes_parsed(test3)
for ra in result3:
    print(f"  {ra['code']}: {ra['description']}")

print("\n" + "="*70)
print("TEST 4: Formato mixto (combinados)")
print("="*70)
result4 = extract_learning_outcomes_parsed(test4)
for ra in result4:
    print(f"  {ra['code']}: {ra['description']}")

# Verificar que todos funcionan
all_ok = (
    len(result1) == 3 and len(result2) == 3 and 
    len(result3) == 3 and len(result4) == 4
)

print("\n" + "="*70)
if all_ok:
    print("✓✓✓ TODOS LOS FORMATOS FUNCIONAN CORRECTAMENTE")
else:
    print("✗ FALLO EN ALGUNOS FORMATOS")
    print(f"  Test1: {len(result1)} (esperado 3)")
    print(f"  Test2: {len(result2)} (esperado 3)")
    print(f"  Test3: {len(result3)} (esperado 3)")
    print(f"  Test4: {len(result4)} (esperado 4)")
print("="*70)
