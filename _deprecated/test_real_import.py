import sys
sys.path.insert(0, r"C:\TesisMCD\backend")

from app.docx_import import import_proposal_from_docx
import os

print("="*70)
print("PRUEBA: EXTRAYENDO COMPETENCIAS DEL SISTEMA")
print("="*70)

# Opción 1: Buscar un DOCX en backend/data/uploads
uploads_dir = r"C:\TesisMCD\backend\data\uploads"

if os.path.exists(uploads_dir):
    files = os.listdir(uploads_dir)
    docx_files = [f for f in files if f.lower().endswith('.docx')]
    
    print(f"\nDOCX encontrados en {uploads_dir}:")
    for f in docx_files:
        print(f"  - {f}")
    
    if docx_files:
        test_docx = os.path.join(uploads_dir, docx_files[0])
        print(f"\nProbando importación de: {docx_files[0]}\n")
        
        try:
            data = import_proposal_from_docx(test_docx)
            
            # Mostrar competencias genéricas
            generic_comps = data.get('generic_competencies', [])
            specific_comps = data.get('specific_competencies', [])
            
            print(f"COMPETENCIAS GENÉRICAS: {len(generic_comps)}")
            for comp in generic_comps:
                nivel = comp.get('level', '')
                nivel_str = f"({nivel})" if nivel else ""
                print(f"  - {comp['code']}: {comp['description'][:50]}... {nivel_str}")
            
            print(f"\nCOMPETENCIAS ESPECÍFICAS: {len(specific_comps)}")
            for comp in specific_comps:
                nivel = comp.get('level', '')
                nivel_str = f"({nivel})" if nivel else ""
                print(f"  - {comp['code']}: {comp['description'][:50]}... {nivel_str}")
            
            print(f"\nRESULTADOS:")
            print(f"  - Carrera: {data.get('career', '?')}")
            print(f"  - Asignatura: {data.get('subject', '?')}")
            print(f"  - Total CG + CE: {len(generic_comps) + len(specific_comps)}")
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("  No hay DOCX disponibles para probar")
else:
    print(f"ERROR: No existe {uploads_dir}")

print("\n" + "="*70)
