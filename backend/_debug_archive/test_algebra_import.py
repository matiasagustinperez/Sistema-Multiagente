import requests
import json
import time

# Esperar a que el backend esté listo
time.sleep(2)

# URL del backend
BASE_URL = "http://localhost:8001"
ALGEBRA_FILE = r"C:\TesisMCD\backend\1º_1º - CBI - Álgebra I.docx"

print("=" * 80)
print("PRUEBA DE IMPORTACIÓN - ÁLGEBRA")
print("=" * 80)

# Subir el archivo
print("\nSubiendo archivo de Álgebra...")
with open(ALGEBRA_FILE, 'rb') as f:
    files = {'file': f}
    response = requests.post(f"{BASE_URL}/upload", files=files)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        exit(1)
    
    data = response.json()
    proposal_id = data.get('id')
    print(f"✓ Archivo importado. ID de propuesta: {proposal_id}")

# Obtener la propuesta para verificar RAs de TPs
print("\nObteniendo detalles de la propuesta...")
response = requests.get(f"{BASE_URL}/proposals/{proposal_id}")
proposal = response.json()

print(f"\n=== PROPUESTA ===")
print(f"Carrera: {proposal.get('career', '-')}")
print(f"Asignatura: {proposal.get('subject', '-')}")

print(f"\n=== RAs GENERALES ===")
ras = proposal.get('learning_outcomes') or []
if not ras:
    print("(Aún no se han extraído - esperando background task)")
else:
    print(f"Total: {len(ras)}")
    for ra in ras:
        print(f"  {ra.get('code', '?')}: {ra.get('description', '')[0:70]}...")

print(f"\n=== TRABAJOS PRÁCTICOS ===")
practicals = proposal.get('practicals') or []
print(f"Total: {len(practicals)}\n")

for tp_idx, tp in enumerate(practicals, 1):
    print(f"TP {tp_idx}: {tp.get('name', 'SIN NOMBRE')}")
    
    # Verificar RAs asociados
    ra_codes = tp.get('ra_codes', [])
    if ra_codes:
        print(f"  RAs: {', '.join(ra_codes)} ✓")
        # Mostrar descripción de cada RA
        for ra_code in ra_codes:
            for ra in ras:
                if ra.get('code') == ra_code:
                    desc = ra.get('description', '')[0:60]
                    print(f"    - {ra_code}: {desc}...")
                    break
    else:
        print(f"  RAs: (ninguno)")
    
    print()

print("\n" + "=" * 80)
print("CONCLUSIÓN:")
print("=" * 80)

# Verificar si RA5 aparece en algún TP
ra5_found = False
for tp in practicals:
    if 'RA5' in tp.get('ra_codes', []):
        ra5_found = True
        break

if ra5_found:
    print("✓ RA5 SÍ aparece en los TPs")
else:
    print("ℹ RA5 NO aparece en los TPs (no está en los objetivos del documento)")

print("\nRAs detectados en TPs:")
all_ra_codes = set()
for tp in practicals:
    all_ra_codes.update(tp.get('ra_codes', []))
print(f"  {', '.join(sorted(all_ra_codes))}")
