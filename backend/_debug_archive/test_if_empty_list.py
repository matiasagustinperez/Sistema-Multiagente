"""Verificar si [] es falsy"""

ra_codes = []
print(f"if {ra_codes}: {bool(ra_codes)}")

ra_codes = ['RA3', 'RA4']
print(f"if {ra_codes}: {bool(ra_codes)}")

# Verificar en práctica
practical = {'number': '1'}

if ra_codes:
    practical['ra_codes'] = ra_codes
    print("RA_codes ASIGNADOS")
else:
    print("RA_codes NO ASIGNADOS")

print(f"practical: {practical}")
