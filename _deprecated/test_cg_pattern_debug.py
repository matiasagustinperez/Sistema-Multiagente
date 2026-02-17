import sys
import re
sys.path.insert(0, r"C:\TesisMCD\backend")

# Simular el patrón actual
text = """CGT1 - Identificar, formular y resolver problemas de ingeniería mecatrónica - Alto - CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Alto - CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto"""

# Patrón actual
pattern_current = r'([Cc][Gg][A-Za-z]\d+)\s*-\s*(.+?)\s*-\s*(Alto|Medio|Bajo)(?=\s*-\s*[Cc][Gg][A-Za-z]|\s*\))'

print("="*80)
print("PATRÓN ACTUAL")
print("="*80)
print(f"Patrón: {pattern_current}\n")

matches = list(re.finditer(pattern_current, text))
print(f"Matches encontrados: {len(matches)}\n")

for idx, match in enumerate(matches, 1):
    code = match.group(1)
    desc = match.group(2)
    level = match.group(3)
    print(f"{idx}. Código: {code}")
    print(f"   Descripción: {desc[:80]}")
    print(f"   Nivel: {level}")
    print()

# Problema: el .+? se detiene en el PRIMER dash
# Necesitamos capturar TODO hasta el ÚLTIMO dash antes del nivel

# Patrón mejorado: capturar todo lo que NO sea un dash seguido de nivel
pattern_fixed = r'([Cc][Gg][A-Za-z]\d+)\s*-\s*(.+?)\s*-\s*(Alto|Medio|Bajo)(?=\s*(?:$|-\s*[Cc][Gg][A-Za-z]))'

print("="*80)
print("PATRÓN MEJORADO (intento 1)")
print("="*80)
print(f"Patrón: {pattern_fixed}\n")

matches = list(re.finditer(pattern_fixed, text))
print(f"Matches encontrados: {len(matches)}\n")

for idx, match in enumerate(matches, 1):
    code = match.group(1)
    desc = match.group(2)
    level = match.group(3)
    print(f"{idx}. Código: {code}")
    print(f"   Descripción: {desc[:80]}")
    print(f"   Nivel: {level}")
    print()

# Mejor: capturar descripción que contiene MÚLTIPLES palabras pero se detiene
# exactamente antes de " - Alto/Medio/Bajo"
# Usar negación: capturar todo EXCEPTO la secuencia " - LEVEL"

pattern_v2 = r'([Cc][Gg][A-Za-z]\d+)\s*-\s*((?:(?!\s*-\s*(?:Alto|Medio|Bajo)).)+?)\s*-\s*(Alto|Medio|Bajo)'

print("="*80)
print("PATRÓN MEJORADO (intento 2 - negative lookahead)")
print("="*80)
print(f"Patrón: {pattern_v2}\n")

matches = list(re.finditer(pattern_v2, text))
print(f"Matches encontrados: {len(matches)}\n")

for idx, match in enumerate(matches, 1):
    code = match.group(1)
    desc = match.group(2).strip()
    level = match.group(3)
    print(f"{idx}. Código: {code}")
    print(f"   Descripción: {desc[:80]}")
    print(f"   Nivel: {level}")
    print()
