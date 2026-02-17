import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import import_proposal_from_docx
import json

# Archivo de Álgebra
DOCX_PATH = r"C:\TesisMCD\backend\1º_1º - CBI - Álgebra I.docx"

try:
    print("=" * 80)
    print("ANALIZANDO ARCHIVO DE ÁLGEBRA")
    print("=" * 80)
    
    data = import_proposal_from_docx(DOCX_PATH)
    
    # Mostrar todos los RAs encontrados
    print("\n*** RAs ENCONTRADOS EN EL DOCUMENTO ***")
    all_ras = data.get('learning_outcomes', [])
    print(f"Total de RAs: {len(all_ras)}")
    for idx, ra in enumerate(all_ras, 1):
        print(f"{idx}. {ra.get('code')} - {ra.get('description', '')[0:80]}")
    
    # Mostrar los TPs y sus RAs asociados
    print("\n\n*** TRABAJOS PRÁCTICOS Y SUS RAs ***")
    practicals = data.get('practicals', [])
    print(f"Total de TPs: {len(practicals)}\n")
    
    for tp_idx, practical in enumerate(practicals, 1):
        print(f"\nTP {tp_idx}: {practical.get('name', 'SIN NOMBRE')[0:60]}")
        print("-" * 70)
        
        # Verificar RAs asociados
        associated_ras = practical.get('ra_codes', [])
        print(f"RAs asociados en el documento: {associated_ras}")
        
        # Mostrar los primeros 200 caracteres del objetivo
        objective = practical.get('objective', '')[0:200]
        if objective:
            print(f"Objetivo: {objective}...")
        
        # Mostrar los primeros 200 caracteres de actividades
        activities = practical.get('activities', '')[0:200]
        if activities:
            print(f"Actividades: {activities}...")
    
        associated_ras = practical.get('ra_codes', [])
        if not associated_ras or len(associated_ras) == 0:
            print(f"\nTP {tp_idx} NO TIENE RAs ASOCIADOS")
            print(f"  Nombre: {practical.get('name', 'SIN NOMBRE')[:60]}")
            
            # Mostrar el texto completo del objetivo para ver si menciona RAs
            print(f"\n  OBJETIVO COMPLETO:")
            obj = practical.get('objective', '')
            print(f"  {obj[:500]}")
            
            print(f"\n  ACTIVIDADES COMPLETAS:")
            act = practical.get('activities', '')
            print(f"  {act[:500]}")
        else:
            print(f"\nTP {tp_idx} SÍ TIENE RAs: {associated_ras}")
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
