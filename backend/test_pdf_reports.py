import sys
sys.path.insert(0, '.')
from app.pdf_reports import report_docentes, report_propuestas, report_sugerencias

# Test report_docentes
data = [{'name': 'Juan Perez', 'email': 'j@test.com', 'category': 'Asociado', 'dedication': 'Exclusiva', 'careers': ['Ing. Civil']}]
pdf = report_docentes(data)
print(f'report_docentes: {len(pdf)} bytes, valid={pdf[:4]==b"%PDF"}')

# Test report_propuestas
data2 = [{'subject': 'Algebra', 'career': 'Ing. Civil', 'year_of_career': '1', 'quarter': '1er Cuatrimestre', 'minimum_content': 'Numeros reales', 'teaching_team': [{'nombre': 'Juan'}], 'status': 'aprobada'}]
pdf2 = report_propuestas(data2)
print(f'report_propuestas: {len(pdf2)} bytes, valid={pdf2[:4]==b"%PDF"}')

# Test report_sugerencias (empty)
pdf3 = report_sugerencias([])
print(f'report_sugerencias (empty): {len(pdf3)} bytes, valid={pdf3[:4]==b"%PDF"}')

print('All tests passed OK')
