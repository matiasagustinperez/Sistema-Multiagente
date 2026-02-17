import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import extract_learning_outcomes_parsed

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

print("="*80)
print("TEST: EXTRACT_LEARNING_OUTCOMES_PARSED CON PATRÓN ACTUALIZADO")
print("="*80)

print("\nCASO 1: RA 1: descripción (sin guión, con dos puntos)")
print("-" * 80)
result1 = extract_learning_outcomes_parsed(caso1)
print(f"RAs encontrados: {len(result1)}\n")

for idx, ra in enumerate(result1, 1):
    desc = ra['description'][:80]
    print(f"{idx}. {ra['code']}: {desc}...")

# Verificar
if len(result1) == 5:
    print("\n✓ CASO 1: OK (se encontraron 5/5)")
else:
    print(f"\n✗ CASO 1: FALLO (se encontraron {len(result1)}/5)")

print("\n" + "="*80)
print("CASO 2: - RA 1. descripción (con guión, punto, multi-línea)")
print("-" * 80)
result2 = extract_learning_outcomes_parsed(caso2)
print(f"RAs encontrados: {len(result2)}\n")

for idx, ra in enumerate(result2, 1):
    desc = ra['description'][:80]
    print(f"{idx}. {ra['code']}: {desc}...")

# Verificar
if len(result2) == 5:
    print("\n✓ CASO 2: OK (se encontraron 5/5)")
else:
    print(f"\n✗ CASO 2: FALLO (se encontraron {len(result2)}/5)")

print("\n" + "="*80)
if len(result1) == 5 and len(result2) == 5:
    print("✓✓✓ ¡ÉXITO! Ambos casos funcionan correctamente")
else:
    print("✗ Hay problemas con algunos casos")
print("="*80)
