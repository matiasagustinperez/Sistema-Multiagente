#!/usr/bin/env python3
"""
Test para validar la extracción mejorada de competencias, RAs, Importancia y Perfil Profesional
"""
import sys
import re
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import (
    extract_generic_competencies,
    extract_specific_competencies,
    extract_learning_outcomes_parsed
)

# Test data similar al DOCX del usuario
test_objectives = """
Competencias genéricas a las que aporta la asignatura (utilizar la codificación y nivel de dominio especificada en el Plan de Estudios)
- CGT1 - Identificar, formular y resolver problemas de ingeniería mecatrónica - Alto
- CGT2 - Concebir, diseñar y desarrollar proyectos de ingeniería mecatrónica - Alto
- CGT3 - Gestionar, planificar, ejecutar y controlar proyectos de ingeniería mecatrónica - Alto
- CGT4 - Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería mecatrónica - Alto
- CGT5 - Contribuir a la generación de desarrollos tecnológicos y/o innovaciones - Alto

Competencias específicas a las que aporta la asignatura (utilizar la codificación y nivel de dominio especificada en el Plan de Estudios)
- CE1 - Analizar la funcionalidad y aplicabilidad de máquinas, equipos, dispositivos, instalaciones y sistemas cuyo principio de funcionamiento combina la electrónica, mecánica e informática y sistemas de automatización industrial - Alto
- CE2 - Diseñar, calcular e implementar soluciones tecnológicas en la construcción de máquinas, equipos, dispositivos, instalaciones y sistemas cuyo principio de funcionamiento combine la electrónica, mecánica e informática y sistemas de automatización industrial - Alto
- CE3 - Proyectar, dirigir y controlar la construcción, operación y mantenimiento de máquinas, equipos, dispositivos, instalaciones y sistemas cuyo principio de funcionamiento combine la electrónica, mecánica e informática y sistemas de automatización industrial - Alto
- CE4 - Identificar, seleccionar y utilizar las técnicas y herramientas disponibles - Alto
- CE5 - Evaluar y certificar el funcionamiento y condiciones de uso de dispositivos o sistemas mecatrónicos de acuerdo a las especificaciones - Alto
- CE6 - Proyectar, dirigir, supervisar y controlar lo referido a la higiene y seguridad en proyectos mecatrónicos - Alto

Resultados de aprendizaje de la asignatura (redactar de acuerdo a las competencias y descriptores a las que aporta la asignatura)
- RA1 - Establece la forma y realiza la evaluación previa del proyecto, mediante estudio de factibilidad técnica/operativa, para decidir la viabilidad antes de iniciar su ejecución.
- RA2 - Formula la planificación del proyecto mediante evaluación y selección de la metodología, herramientas y buenas prácticas de gestión de proyectos más adecuadas, para ejecutarlo con el nivel de calidad correspondiente y lograr el plan propuesto.
- RA3 - Desarrolla el proyecto mediante la gestión de recursos, entregables y documentación para garantizar y asegurar la calidad del proceso.
- RA4 - Analiza críticamente los resultados obtenidos y redacta información técnica referente al Proyecto.
- RA5 - Expone eficazmente de forma oral los resultados obtenidos en el Proyecto
"""

test_fundamentals_text = """
Importancia en el Plan de estudio:
Proyecto de Ingeniería Mecatrónica es la asignatura integradora horizontal y vertical, en el último nivel de Ingeniería Mecatrónica, para lograr una adecuada integración y aplicación del aprendizaje de las y los estudiantes en la Carrera.
Incluye contenido y actividades didácticas destinadas a que las y los estudiantes logren capacidades para la formulación, planificación, ejecución, desarrollo y control de proyectos, análisis de factibilidad, emplear conceptos de gestión de equipos, alcances, costos, cronograma y gestión de la comunicación.

Relación con el perfil profesional esperado:
Esta asignatura contribuye a que el futuro ingeniero/a pueda formular, planificar, gestionar y desarrollar un proyecto seleccionando y utilizando las metodologías y herramientas más adecuadas. Facilitar el desarrollo de competencias en el trabajo en equipo y en forma individual. Contribuye a la formación de recursos humanos.
"""

def test_competencies():
    """Test extracción de competencias genéricas"""
    print("=" * 80)
    print("TEST: EXTRACCIÓN DE COMPETENCIAS Y RAS")
    print("=" * 80)
    
    # Test Competencias Genéricas
    print("\n1. COMPETENCIAS GENÉRICAS:")
    generic_comps = extract_generic_competencies(test_objectives)
    print(f"   Encontradas: {len(generic_comps)}")
    for comp in generic_comps:
        print(f"   - {comp['code']}: {comp['description'][:60]}... [{comp['level']}]")
    
    if len(generic_comps) == 5:
        print("   ✅ CORRECTO (5 competencias genéricas)")
    else:
        print(f"   ⚠️ Se esperaban 5, encontradas {len(generic_comps)}")
    
    # Test Competencias Específicas
    print("\n2. COMPETENCIAS ESPECÍFICAS:")
    specific_comps = extract_specific_competencies(test_objectives)
    print(f"   Encontradas: {len(specific_comps)}")
    for comp in specific_comps:
        print(f"   - {comp['code']}: {comp['description'][:60]}... [{comp['level']}]")
    
    if len(specific_comps) == 6:
        print("   ✅ CORRECTO (6 competencias específicas)")
    else:
        print(f"   ⚠️ Se esperaban 6, encontradas {len(specific_comps)}")
    
    # Test RAs
    print("\n3. RESULTADOS DE APRENDIZAJE:")
    ras = extract_learning_outcomes_parsed(test_objectives)
    print(f"   Encontrados: {len(ras)}")
    for ra in ras:
        print(f"   - {ra['code']}: {ra['description'][:70]}...")
    
    if len(ras) == 5:
        print("   ✅ CORRECTO (5 RAs)")
    else:
        print(f"   ⚠️ Se esperaban 5, encontrados {len(ras)}")
    
    return len(generic_comps) == 5 and len(specific_comps) == 6 and len(ras) == 5


def test_fundamentals():
    """Test extracción de Importancia y Perfil Profesional"""
    print("\n" + "=" * 80)
    print("TEST: EXTRACCIÓN DE IMPORTANCIA Y PERFIL PROFESIONAL")
    print("=" * 80)
    
    # Extract Importancia
    print("\n1. IMPORTANCIA EN EL PLAN DE ESTUDIO:")
    import_match = re.search(
        r'importancia\s+en\s+el\s+plan\s+de\s+estudio\s*:?\s*(.+?)(?=relación\s+con\s+el\s+perfil|$)',
        test_fundamentals_text,
        re.IGNORECASE | re.DOTALL
    )
    
    if import_match:
        importance = import_match.group(1).strip()
        print(f"   Extraído ({len(importance)} chars):")
        print(f"   {importance[:150]}...")
        print("   ✅ CORRECTO")
    else:
        print("   ❌ NO ENCONTRADO")
        return False
    
    # Extract Perfil Profesional
    print("\n2. RELACIÓN CON PERFIL PROFESIONAL ESPERADO:")
    profile_match = re.search(
        r'relación\s+con\s+el\s+perfil\s+profesional\s+esperado\s*:?\s*(.+?)$',
        test_fundamentals_text,
        re.IGNORECASE | re.DOTALL
    )
    
    if profile_match:
        profile = profile_match.group(1).strip()
        print(f"   Extraído ({len(profile)} chars):")
        print(f"   {profile[:150]}...")
        print("   ✅ CORRECTO")
    else:
        print("   ❌ NO ENCONTRADO")
        return False
    
    return True


if __name__ == '__main__':
    print("\nValidando funciones mejoradas de extracción...\n")
    
    comp_test = test_competencies()
    fund_test = test_fundamentals()
    
    print("\n" + "=" * 80)
    print("RESUMEN")
    print("=" * 80)
    
    if comp_test:
        print("✅ Competencias y RAs extraídos correctamente")
    else:
        print("❌ Error en extracción de competencias/RAs")
    
    if fund_test:
        print("✅ Importancia y Perfil Profesional extraídos correctamente")
    else:
        print("❌ Error en extracción de Importancia/Perfil")
    
    print("=" * 80)
    
    exit(0 if (comp_test and fund_test) else 1)
