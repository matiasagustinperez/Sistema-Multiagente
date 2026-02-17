"""Verificar qué RAs detecta el regex exacto"""
import re

# Texto directo de TP1
text = """Objetivo (especificar además el/los RA que cubre el práctico):        
RA 3. Identifica las características y propiedades de los vectores usando el método gráfico y analítico.                                    RA 4. Colabora y se responsabiliza en la ejecución de tareas que permiten lograr la consecución de                                          objetivos propuestos.
RA 5. Busca información complementaria para la mejora de los propios procesos en la resolución de                                           problemas.

Actividades a desarrollar (especificar las actividades formativas necesarias para lograr que el estudiante alcance el/los RA especificados):Resolución de ejercicios y problemas de aplicación en forma individual y grupal."""

print("="*80)
print("BÚSQUEDA DE RAs CON DIFERENTES REGEXES")
print("="*80)

print(f"\nTexto a buscar (primeros 300 chars):")
print(text[:300])

# Regex 1: El que usa extract_practicals_from_docx (sin \b al final )
regex1 = r'RA\s*(\d+)'
matches1 = re.findall(regex1, text, re.IGNORECASE)
print(f"\nRegex 1: r'RA\\s*(\\d+)'")
print(f"  Coincidencias: {['RA' + m for m in matches1]}")

# Regex 2: Con word boundary (línea 908 del código de limpieza)
regex2 = r'\bRA\s*\d+\b'
matches2 = re.findall(regex2, text, re.IGNORECASE)
print(f"\nRegex 2 (para limpieza): r'\\bRA\\s*\\d+\\b'")
print(f"  Coincidencias: {matches2}")

# Buscar con finditer como lo hace el código
print(f"\nUsando finditer (método del código real):")
ra_codes = []
for match in re.finditer(r'RA\s*(\d+)', text, re.IGNORECASE):
    code = f"RA{match.group(1)}"
    if code not in ra_codes:
        ra_codes.append(code)

print(f"  Códigos encontrados: {ra_codes}")
