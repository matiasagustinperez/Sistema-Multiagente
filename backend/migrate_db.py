#!/usr/bin/env python
"""
Script para migrar la BD antigua al nuevo schema.
Mapea columnas antiguas a nuevas y agrega columnas faltantes.
"""
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "proposals.db"

def migrate_database():
    """Migra la BD antigua al nuevo schema."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Obtener columnas existentes
    cursor.execute("PRAGMA table_info(proposals)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    print(f"Columnas existentes: {sorted(existing_columns)}\n")
    
    # Mapeo de columnas antiguas a nuevas
    column_mapping = {
        'career_year': 'year_of_career',
        'term': 'quarter',
        'plan_studies': 'study_plan',
    }
    
    # Columnas que necesitan ser añadidas
    new_columns = {
        'year_of_career': ('TEXT', None),  # Mapear de career_year si no existe
        'quarter': ('TEXT', None),  # Mapear de term o cycle si no existe
        'study_plan': ('TEXT', None),  # Mapear de plan_studies si no existe
        'character': ('TEXT', None),  # Obligatoria/Optativa
        'regime': ('TEXT', None),  # Cuatrimestral/Anual
        'theoretical_hours': ('INTEGER', None),
        'practical_hours': ('INTEGER', None),
        'total_hours': ('INTEGER', None),
        'weekly_hours': ('INTEGER', None),
        'minimum_content': ('TEXT', None),
        'generic_competencies': ('TEXT', None),
        'specific_competencies': ('TEXT', None),
        'fundamentals_part1': ('TEXT', None),  # Importancia
        'fundamentals_part2': ('TEXT', None),  # Perfil Profesional
        'learning_outcomes': ('TEXT', None),  # JSON como TEXT
        'units': ('TEXT', None),  # JSON como TEXT
        'practicals': ('TEXT', None),  # JSON como TEXT
        'methodology': ('TEXT', None),
        'evaluation': ('TEXT', None),
        'bibliography': ('TEXT', None),
        'observations': ('TEXT', None),
        'source_type': ('TEXT', None),  # docx, pdf, manual
        'updated_at': ('DATETIME', None),
    }
    
    # Paso 1: Manejar renombramiento de columnas
    print("PASO 1: Renombrando columnas...")
    
    # Renombrar career_year → year_of_career
    if 'career_year' in existing_columns and 'year_of_career' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE proposals RENAME COLUMN career_year TO year_of_career")
            existing_columns.remove('career_year')
            existing_columns.add('year_of_career')
            print("✓ Renombrado: career_year → year_of_career")
        except Exception as e:
            print(f"✗ Error al renombrar career_year: {e}")
    
    # Renombrar plan_studies → study_plan
    if 'plan_studies' in existing_columns and 'study_plan' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE proposals RENAME COLUMN plan_studies TO study_plan")
            existing_columns.remove('plan_studies')
            existing_columns.add('study_plan')
            print("✓ Renombrado: plan_studies → study_plan")
        except Exception as e:
            print(f"✗ Error al renombrar plan_studies: {e}")
    
    # Para term/cycle → quarter: necesitamos lógica especial
    if 'cycle' in existing_columns and 'quarter' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE proposals RENAME COLUMN cycle TO quarter")
            existing_columns.remove('cycle')
            existing_columns.add('quarter')
            print("✓ Renombrado: cycle → quarter")
        except Exception as e:
            print(f"✗ Error al renombrar cycle: {e}")
    elif 'term' in existing_columns and 'quarter' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE proposals RENAME COLUMN term TO quarter")
            existing_columns.remove('term')
            existing_columns.add('quarter')
            print("✓ Renombrado: term → quarter")
        except Exception as e:
            print(f"✗ Error al renombrar term: {e}")
    
    # Paso 2: Agregar columnas faltantes
    print("\nPASO 2: Agregando columnas faltantes...")
    
    for col_name, (col_type, default) in new_columns.items():
        if col_name not in existing_columns:
            try:
                if default is not None:
                    cursor.execute(f"ALTER TABLE proposals ADD COLUMN {col_name} {col_type} DEFAULT {default}")
                else:
                    cursor.execute(f"ALTER TABLE proposals ADD COLUMN {col_name} {col_type}")
                print(f"✓ Agregada columna: {col_name} ({col_type})")
                existing_columns.add(col_name)
            except Exception as e:
                print(f"✗ Error al agregar {col_name}: {e}")
    
    # Paso 3: Convertir teaching_team de JSON a TEXT si es necesario
    print("\nPASO 3: Normalizando tipos de datos...")
    
    try:
        # teaching_team probablemente es JSON, déjalo como está o conviértelo a TEXT
        if 'teaching_team' in existing_columns:
            # Asegurar que teaching_team pueda almacenar JSON
            print("✓ teaching_team está presente (asumido como JSON/TEXT)")
    except Exception as e:
        print(f"✗ Error verifying teaching_team: {e}")
    
    # Paso 4: Verificar resultado final
    print("\nPASO 4: Verificando esquema final...")
    cursor.execute("PRAGMA table_info(proposals)")
    final_columns = {row[1] for row in cursor.fetchall()}
    print(f"Columnas finales: {sorted(final_columns)}")
    
    # Verificar que tenemos todas las columnas necesarias
    required_columns = {
        'id', 'title', 'career', 'subject', 'study_plan', 'academic_year',
        'year_of_career', 'quarter', 'character', 'regime',
        'theoretical_hours', 'practical_hours', 'total_hours', 'weekly_hours',
        'minimum_content', 'generic_competencies', 'specific_competencies',
        'fundamentals_part1', 'fundamentals_part2',
        'learning_outcomes', 'units', 'practicals', 'teaching_team',
        'methodology', 'evaluation', 'bibliography', 'observations',
        'original_filename', 'source_type', 'gdoc_url', 'status',
        'study_subject_id', 'created_at', 'updated_at'
    }
    
    missing = required_columns - final_columns
    if missing:
        print(f"\n⚠ Columnas aún faltantes: {missing}")
    else:
        print(f"\n✓ ¡Todas las columnas requeridas están presentes!")
    
    # Contar registros
    cursor.execute("SELECT COUNT(*) FROM proposals")
    count = cursor.fetchone()[0]
    print(f"\nRegistros en la BD: {count}")
    
    conn.commit()
    conn.close()
    
    print("\n✓ Migración completada exitosamente")

if __name__ == "__main__":
    migrate_database()
