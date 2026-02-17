import sys
import re
sys.path.insert(0, r"C:\TesisMCD\backend")

# Caso 1: RA con dos puntos al inicio
caso1 = """RA 1: Analiza algoritmos de aprendizaje automático aplicados a sistemas mecatrónicos en un entorno simulado y evalúa su eficiencia.
RA 2: Desarrolla un prototipo de robot utilizando técnicas de inteligencia artificial y lo presenta ante un panel evaluador.
RA 3: Implementa un sistema de control adaptativo utilizando redes neuronales en un proyecto de automatización industrial y mide su desempeño.
RA 4: Elabora un informe técnico sobre las aplicaciones de la inteligencia artificial en la mejora de sistemas mecatrónicos y presenta los resultados en una conferencia.
RA 5: Evalúa el impacto de la inteligencia artificial en la innovación de productos mecatrónicos mediante un estudio de caso en la industria."""

# Caso 2: RA con punto y descripción multi-línea
caso2 = """-  RA 1. Emplea sistemas de ecuaciones lineales para construir modelos matemáticos y resolver problemas a través del método más apropiado a la situación.
RA 2. Ubica regiones del plano definidas mediante cónicas para graficar diferentes situaciones de utilidad
en la ingeniería.
RA 3. Identifica las características y propiedades de los vectores usando el método gráfico y analítico.
RA 4. Colabora y se responsabiliza en la ejecución de tareas que permiten lograr la consecución de
objetivos propuestos.
RA 5. Busca información complementaria para la mejora de los propios procesos en la resolución de
problemas."""

# Patrón actual
pattern_current = r'(?:^|\n)(?:[-•]\s*)?([Rr][Aa]\s*\d+)\s*[-:.]?\s*([^\n]+)'

# Patrón mejorado: captura multi-línea hasta el siguiente RA o fin
# Captura descripción que puede continuar en líneas siguientes
pattern_improved = r'(?:^|\n)\s*(?:[-•]\s*)?\s*([Rr][Aa]\s*\d+)\s*[-:.]?\s*([^\n]*(?:\n(?!\s*(?:[-•]\s*)?\s*[Rr][Aa]\s*\d+)[^\n]*)*)'

print("="*80)
print("CASO 1: RA 1: descripción (sin guión, con dos puntos)")
print("="*80)

print("\nPatrón actual:")
matches_current = list(re.finditer(pattern_current, caso1, re.MULTILINE))
print(f"Encontrados: {len(matches_current)}")
for m in matches_current[:2]:
    code = m.group(1).upper().replace(' ', '')
    desc = m.group(2).strip()[:60]
    print(f"  {code}: {desc}...")

print("\nPatrón mejorado:")
matches_improved = list(re.finditer(pattern_improved, caso1, re.MULTILINE))
print(f"Encontrados: {len(matches_improved)}")
for m in matches_improved[:2]:
    code = m.group(1).upper().replace(' ', '')
    desc = m.group(2).strip()[:60]
    print(f"  {code}: {desc}...")

print("\n" + "="*80)
print("CASO 2: - RA 1. descripción (con guión, punto, multi-línea)")
print("="*80)

print("\nPatrón actual:")
matches_current = list(re.finditer(pattern_current, caso2, re.MULTILINE))
print(f"Encontrados: {len(matches_current)}")
for m in matches_current[:2]:
    code = m.group(1).upper().replace(' ', '')
    desc = m.group(2).strip()[:60]
    print(f"  {code}: {desc}...")

print("\nPatrón mejorado:")
matches_improved = list(re.finditer(pattern_improved, caso2, re.MULTILINE))
print(f"Encontrados: {len(matches_improved)}")
for m in matches_improved:
    code = m.group(1).upper().replace(' ', '')
    desc = m.group(2).strip()[:80]
    print(f"  {code}: {desc}...")

print("\n" + "="*80)
if len(list(re.finditer(pattern_improved, caso1, re.MULTILINE))) == 5:
    print("✓ Caso 1: OK (5/5)")
else:
    print("✗ Caso 1: FALLO")
    
if len(list(re.finditer(pattern_improved, caso2, re.MULTILINE))) == 5:
    print("✓ Caso 2: OK (5/5)")
else:
    print("✗ Caso 2: FALLO")
print("="*80)
