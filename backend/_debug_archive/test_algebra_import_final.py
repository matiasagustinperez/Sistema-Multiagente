"""Test final: Importar archivo de Álgebra a través del API"""
import requests
import time
import json

API_URL = "http://127.0.0.1:8001"

# Leer el archivo
with open(r"1º_1º - CBI - Álgebra I.docx", "rb") as f:
    files = {"file": f}
    data = {"subject": "Álgebra I"}
    
    print("="*80)
    print("IMPORTANDO ÁLGEBRA A TRAVÉS DEL API")
    print("="*80)
    print(f"\nPOST {API_URL}/upload")
    print(f"Subject: {data['subject']}")
    print(f"File: 1º_1º - CBI - Álgebra I.docx\n")
    
    response = requests.post(f"{API_URL}/upload", files=files, data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}\n")
    
    if response.status_code == 200:
        result = response.json()
        print("✓ Upload exitoso")
        print(f"  Files processed: {result.get('files_processed', 0)}")
        print(f"  Proposals created: {result.get('proposals_created', 0)}")
        
        # Esperar a que se procese
        print("\nEsperando a que se procese (5 segundos)...")
        time.sleep(5)
        
        # Obtener propuestas de Álgebra
        print("\nObteniendo propuestas de Álgebra...")
        get_response = requests.get(f"{API_URL}/proposals?subject=Álgebra I")
        
        if get_response.status_code == 200:
            proposals = get_response.json()
            print(f"\n✓ Se encontraron {len(proposals)} propuestas de Álgebra")
            
            # Mostrar TPs con sus RAs
            for proposal in proposals:
                print(f"\n  ID: {proposal.get('id')}")
                print(f"  Título: {proposal.get('title')}")
                print(f"  Asignatura: {proposal.get('subject')}")
                print(f"  Competencias: {proposal.get('competencias', [])}")
                
                # Mostrar prácticos
                practicals = proposal.get('practicals', [])
                if practicals:
                    print(f"  Prácticos ({len(practicals)}):")
                    for idx, practical in enumerate(practicals, 1):
                        ra_codes = practical.get('ra_codes', [])
                        print(f"    TP{idx}: {practical.get('title', 'Sin título')} → RAs: {ra_codes}")
        else:
            print(f"❌ Error obteniendo propuestas: {get_response.status_code}")
    else:
        print(f"❌ Upload fallido: {response.status_code}")
