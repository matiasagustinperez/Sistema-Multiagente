test_text = """
CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica (Medio - CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto - CGS2 - Comunicarse con efectividad - Medio - CGS4 - Aprender en forma continua y autónoma - Alto)
"""

print("=== ANALIZANDO ESTRUCTURA DEL TEXTO ===\n")
print("Texto original:")
print(repr(test_text))
print("\n" + "="*60)

# Mostrar caracteres
print("\nCaracteres relevantes:")
lines = test_text.split('\n')
for idx, line in enumerate(lines):
    if line.strip():
        print(f"Línea {idx}: {repr(line)}")

print("\n" + "="*60)
print("\nBuscando patrones CG...")

import re
# Simple: cualquier cosa que empiece con CG
cg_pattern = r'CG[A-Za-z]\d+'
matches = re.findall(cg_pattern, test_text)
print(f"Códigos CG encontrados: {matches}")

print("\n" + "="*60)
print("\nMostrando contexto de cada CG...")
for match in re.finditer(cg_pattern, test_text):
    start = max(0, match.start() - 10)
    end = min(len(test_text), match.end() + 50)
    context = test_text[start:end]
    print(f"\n{match.group()}: ...{repr(context)}...")

print("\n" + "="*60)
print("\nBuscando niveles...")
nivel_pattern = r'(Alto|Medio|Bajo)'
for match in re.finditer(nivel_pattern, test_text):
    start = max(0, match.start() - 30)
    end = min(len(test_text), match.end() + 10)
    context = test_text[start:end]
    print(f"{match.group()}: ...{repr(context)}...")
