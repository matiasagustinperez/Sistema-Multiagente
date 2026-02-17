#!/usr/bin/env python3
"""
Script para agregar la búsqueda de RAs en tablas al docx_import.py
"""

file_path = r"C:\TesisMCD\backend\app\docx_import.py"

# Leer el archivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el punto a insertar (después del "break" que termina la extracción de RAs)
search_text = "            break\n    \n    # Extraer unidades (sección 4)"
replacement_text = """            break
    
    # Si no se encontraron RAs en párrafos, buscar en TABLAS
    if not learning_outcomes:
        learning_outcomes = extract_learning_outcomes_from_tables(doc)
    
    # Extraer unidades (sección 4)"""

if search_text in content:
    content = content.replace(search_text, replacement_text)
    print("✓ Reemplazo exitoso")
else:
    print("✗ No se encontró el texto a reemplazar")
    print("\nBuscando alternativas...")
    
    # Intentar búsqueda más flexible
    if "# Extraer unidades (sección 4)" in content:
        lines = content.split('\n')
        target_line_idx = None
        for i, line in enumerate(lines):
            if 'Extraer unidades (sección 4)' in line:
                target_line_idx = i
                break
        
        if target_line_idx:
            print(f"  Encontrada en línea {target_line_idx}")
            # Insertar antes de ella
            new_lines = (
                lines[:target_line_idx] +
                ['    ', '    # Si no se encontraron RAs en párrafos, buscar en TABLAS',
                 '    if not learning_outcomes:',
                 '        learning_outcomes = extract_learning_outcomes_from_tables(doc)',
                 '    '] +
                lines[target_line_idx:]
            )
            content = '\n'.join(new_lines)
            print("✓ Reemplazo alternativo exitoso")
    else:
        print("✗ No se encontró marca ni punto de inserción")
        exit(1)

# Escribir el archivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Archivo actualizado")
