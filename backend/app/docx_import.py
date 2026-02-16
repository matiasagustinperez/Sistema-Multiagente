"""
Módulo para importar datos desde archivos DOCX.
Extrae contenido de un DOCX generado por el sistema y lo convierte en JSON.
"""
from __future__ import annotations

import re
from typing import List, Dict, Any
from docx import Document
from docx.table import Table


def extract_text_from_table_cell(cell) -> str:
    """Extrae todo el texto de una celda, preservando párrafos."""
    return '\n'.join([p.text for p in cell.paragraphs if p.text.strip()])


def extract_header_fields(doc: Document) -> Dict[str, str]:
    """
    Extrae campos del encabezado del documento.
    Busca en tres lugares:
    1. Párrafos iniciales (carrera, asignatura, plan, ciclo, año, cuatrimestre)
    2. Tabla de Programa Analítico (régimen, carga horaria, horas)
    3. Tabla de Equipo Docente (profesores, categorías, emails)
    """
    fields = {
        'career': '',
        'subject': '',
        'teachers': '',
        'year_of_career': '',
        'quarter': '',
        'hours': '',
        'regime': '',
        'teaching_team': [],
    }
    
    # 1. EXTRAER DEL ENCABEZADO (párrafos iniciales)
    # Limitar a los primeros 15 párrafos para evitar buscar en contenido
    for idx, para in enumerate(doc.paragraphs[:15]):
        if idx > 15:  # Safety limit
            break
        
        text = para.text.strip()
        if not text:
            continue
        
        text_lower = text.lower()
        
        # Carrera (exacto: debe empezar con "Carrera:")
        if text_lower.startswith('carrera:') and not fields['career']:
            fields['career'] = text.split(':', 1)[1].strip()
        
        # Asignatura/Nombre de Asignatura
        elif text_lower.startswith('asignatura:') and not fields['subject']:
            fields['subject'] = text.split(':', 1)[1].strip()
        
        # Plan de Estudio
        elif text_lower.startswith('plan') and ':' in text and not fields.get('study_plan'):
            fields['study_plan'] = text.split(':', 1)[1].strip()
        
        # Ciclo (puede decir "Ciclo:" o "Ciclo Lectivo:")
        elif 'ciclo' in text_lower and ':' in text and not fields.get('cycle'):
            fields['cycle'] = text.split(':', 1)[1].strip()
        
        # Año de Carrera - ser más específico
        elif text_lower.startswith('año') and 'carrera' in text_lower and ':' in text and not fields['year_of_career']:
            fields['year_of_career'] = text.split(':', 1)[1].strip()
        
        # Cuatrimestre
        elif 'cuatrimestre' in text_lower and ':' in text and not fields['quarter']:
            fields['quarter'] = text.split(':', 1)[1].strip()
    
    # 2. EXTRAER TABLA DE PROGRAMA ANALÍTICO (Carácter, Régimen, Carga Horaria)
    for table in doc.tables:
        # Buscar tabla que contiene "Programa Analítico de Asignatura" o similar
        table_text = ' '.join([cell.text.lower() for row in table.rows for cell in row.cells])
        
        if 'régimen' in table_text or 'regimen' in table_text:
            # Esta es la tabla de características
            for row in table.rows:
                for cell_idx, cell in enumerate(row.cells):
                    cell_lower = cell.text.lower()
                    cell_text = cell.text.strip()
                    
                    if 'régimen' in cell_lower or 'regimen' in cell_lower:
                        # El valor está en la siguiente celda
                        if cell_idx + 1 < len(row.cells):
                            fields['regime'] = row.cells[cell_idx + 1].text.strip()
                    
                    elif 'carga horaria' in cell_lower and not fields['hours']:
                        # El valor está en la siguiente celda
                        if cell_idx + 1 < len(row.cells):
                            fields['hours'] = row.cells[cell_idx + 1].text.strip()
    
    # 3. EXTRAER TABLA DE EQUIPO DOCENTE
    for table in doc.tables:
        table_text = ' '.join([cell.text.lower() for row in table.rows for cell in row.cells])
        
        # Buscar tabla que contiene "Docente", "Profesor", "Equipo Docente"
        if ('equipo' in table_text and 'docente' in table_text) or \
           ('profesor' in table_text and 'categoría' in table_text and 'correo' in table_text):
            
            # Extraer docentes de las filas (saltando encabezado)
            header_row_idx = 0
            for row_idx, row in enumerate(table.rows):
                row_text = ' '.join([cell.text.lower() for cell in row.cells])
                if 'profesor' in row_text or 'docente' in row_text or 'categoría' in row_text:
                    header_row_idx = row_idx
                    break
            
            # Procesar filas de datos después del encabezado
            for row_idx in range(header_row_idx + 1, len(table.rows)):
                row = table.rows[row_idx]
                
                # Necesitamos al menos nombre + categoría + email (3 celdas)
                if len(row.cells) >= 3:
                    name = row.cells[0].text.strip()
                    category = row.cells[1].text.strip() if len(row.cells) > 1 else ''
                    email = row.cells[2].text.strip() if len(row.cells) > 2 else ''
                    
                    # Solo agregar si tiene al menos nombre válido
                    if name and name not in ['', '{{doc1}}', '{{doc2}}', '{{doc3}}']:
                        fields['teaching_team'].append({
                            'name': name,
                            'category': category,
                            'email': email,
                        })
    
    # Formatear docentes como string si es necesario (para compatibilidad)
    if fields['teaching_team']:
        fields['teachers'] = '; '.join([
            f"{t['name']} ({t['category']})" 
            for t in fields['teaching_team'] 
            if t.get('name')
        ])
    
    return fields


def extract_section_content(doc: Document, section_keyword: str, end_keyword: str = None) -> str:
    """Extrae contenido completo entre dos secciones."""
    content = []
    found = False
    
    for para in doc.paragraphs:
        text_lower = para.text.lower()
        
        if section_keyword in text_lower:
            found = True
            # Agregar el contenido después de la etiqueta
            if ':' in para.text:
                content_after = para.text.split(':', 1)[1].strip()
                if content_after:
                    content.append(content_after)
        elif found:
            if end_keyword and end_keyword in text_lower:
                break
            if para.text.strip():
                content.append(para.text)
    
    return '\n'.join(content).strip()


def extract_units(doc: Document) -> List[Dict[str, str]]:
    """Extrae todas las unidades de las tablas."""
    units = []
    
    # Encontrar tablas de unidades
    for table in doc.tables:
        has_unidad = any("unidad" in cell.text.lower() for row in table.rows for cell in row.cells)
        has_contenidos = any("contenidos:" in cell.text.lower() for row in table.rows for cell in row.cells)
        
        if not (has_unidad and has_contenidos):
            continue
        
        unit = {
            'name': '',
            'content': '',
            'bibliography_basic': '',
            'bibliography_complementary': '',
        }
        
        # Primera fila contiene el número y nombre
        if table.rows:
            first_row = table.rows[0]
            if len(first_row.cells) > 1:
                # Extraer nombre de la unidad
                unit['name'] = first_row.cells[1].text.strip()
        
        # Buscar contenido, bibliografía básica y complementaria
        for row in table.rows:
            for cell in row.cells:
                cell_text = cell.text
                
                if 'contenidos:' in cell_text.lower():
                    # Extraer contenido después del label
                    lines = cell_text.split('\n')
                    content_lines = []
                    found_label = False
                    for line in lines:
                        if 'contenidos:' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                content_lines.append(content_after)
                        elif found_label and line.strip() and 'bibliograf' not in line.lower():
                            content_lines.append(line.strip())
                        elif found_label and 'bibliograf' in line.lower():
                            break
                    unit['content'] = '\n'.join(content_lines).strip()
                
                elif 'bibliografía básica' in cell_text.lower():
                    # Extraer bibliografía básica
                    lines = cell_text.split('\n')
                    bib_lines = []
                    found_label = False
                    for line in lines:
                        if 'bibliografía básica' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                bib_lines.append(content_after)
                        elif found_label and line.strip() and 'complementaria' not in line.lower():
                            bib_lines.append(line.strip())
                        elif found_label and 'complementaria' in line.lower():
                            break
                    unit['bibliography_basic'] = '\n'.join(bib_lines).strip()
                
                elif 'bibliografía complementaria' in cell_text.lower():
                    # Extraer bibliografía complementaria
                    lines = cell_text.split('\n')
                    bib_lines = []
                    found_label = False
                    for line in lines:
                        if 'bibliografía complementaria' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                bib_lines.append(content_after)
                        elif found_label and line.strip():
                            bib_lines.append(line.strip())
                    unit['bibliography_complementary'] = '\n'.join(bib_lines).strip()
        
        if unit['name']:  # Solo agregar si tiene nombre
            units.append(unit)
    
    return units


def extract_practicals(doc: Document) -> List[Dict[str, str]]:
    """Extrae todos los trabajos prácticos de las tablas."""
    practicals = []
    
    # Encontrar tablas de TPs
    for table in doc.tables:
        has_practico = any(("practico" in cell.text.lower() or "práctico" in cell.text.lower())
                          for row in table.rows for cell in row.cells)
        has_objetivo = any("objetivo" in cell.text.lower() for row in table.rows for cell in row.cells)
        
        if not (has_practico and has_objetivo):
            continue
        
        practical = {
            'name': '',
            'objective': '',
            'activities': '',
            'materials': '',
            'scope': '',
        }
        
        # Primera fila contiene el número y nombre
        if table.rows:
            first_row = table.rows[0]
            if len(first_row.cells) > 1:
                practical['name'] = first_row.cells[1].text.strip()
        
        # Buscar objetivo, actividades, materiales, ámbito
        for row in table.rows:
            for cell in row.cells:
                cell_text = cell.text
                
                if 'objetivo' in cell_text.lower():
                    lines = cell_text.split('\n')
                    obj_lines = []
                    found_label = False
                    for line in lines:
                        if 'objetivo' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                obj_lines.append(content_after)
                        elif found_label and line.strip() and 'actividad' not in line.lower():
                            obj_lines.append(line.strip())
                        elif found_label and 'actividad' in line.lower():
                            break
                    practical['objective'] = '\n'.join(obj_lines).strip()
                
                elif 'actividad' in cell_text.lower() and 'desarrollar' in cell_text.lower():
                    lines = cell_text.split('\n')
                    act_lines = []
                    found_label = False
                    for line in lines:
                        if 'actividad' in line.lower() and 'desarrollar' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                act_lines.append(content_after)
                        elif found_label and line.strip() and 'material' not in line.lower():
                            act_lines.append(line.strip())
                        elif found_label and 'material' in line.lower():
                            break
                    practical['activities'] = '\n'.join(act_lines).strip()
                
                elif 'material' in cell_text.lower():
                    lines = cell_text.split('\n')
                    mat_lines = []
                    found_label = False
                    for line in lines:
                        if 'material' in line.lower():
                            found_label = True
                            content_after = line.split(':', 1)[1].strip() if ':' in line else ''
                            if content_after:
                                mat_lines.append(content_after)
                        elif found_label and line.strip() and ('ámbito' in line.lower() or 'ambito' in line.lower()):
                            break
                        elif found_label and line.strip():
                            mat_lines.append(line.strip())
                    practical['materials'] = '\n'.join(mat_lines).strip()
                
                elif 'ámbito' in cell_text.lower() or 'ambito' in cell_text.lower():
                    lines = cell_text.split('\n')
                    scope_lines = []
                    found_label = False
                    for line in lines:
                        if ('ámbito' in line.lower() or 'ambito' in line.lower()) and ':' in line:
                            found_label = True
                            content_after = line.split(':', 1)[1].strip()
                            if content_after:
                                scope_lines.append(content_after)
                        elif found_label and line.strip():
                            scope_lines.append(line.strip())
                    practical['scope'] = '\n'.join(scope_lines).strip()
        
        if practical['name']:  # Solo agregar si tiene nombre
            practicals.append(practical)
    
    return practicals


def extract_learning_outcomes(doc: Document) -> List[str]:
    """Extrae los Resultados de Aprendizaje (RA)."""
    outcomes = []
    found_ra_section = False
    
    for para in doc.paragraphs:
        text_lower = para.text.lower()
        
        if 'resultado' in text_lower and 'aprendizaje' in text_lower:
            found_ra_section = True
            continue
        
        if found_ra_section:
            if para.text.strip().startswith('RA ') or para.text.strip().startswith('ra '):
                outcomes.append(para.text.strip())
            elif any(keyword in text_lower for keyword in ['contenido', 'unidad', 'fundamental']):
                break
    
    return outcomes


def import_proposal_from_docx(file_path: str) -> Dict[str, Any]:
    """
    Importa una propuesta completa desde un DOCX.
    Retorna un diccionario con todos los campos extraídos.
    """
    doc = Document(file_path)
    
    # Extraer headers con la nueva lógica mejorada
    header_fields = extract_header_fields(doc)
    
    # Extraer teaching team si existe
    teaching_team = header_fields.pop('teaching_team', [])
    
    # Construir lista de docentes en el formato esperado
    teaching_team_list = []
    for idx, teacher in enumerate(teaching_team[:3]):  # Max 3 docentes
        teaching_team_list.append({
            'name': teacher.get('name', ''),
            'category': teacher.get('category', ''),
            'email': teacher.get('email', ''),
        })
    
    # Extraer todos los datos
    data = {
        # Encabezado (como se envía al API)
        'career': header_fields.get('career', ''),
        'subject': header_fields.get('subject', ''),
        'study_plan': header_fields.get('study_plan', ''),
        'cycle': header_fields.get('cycle', ''),
        'year_of_career': header_fields.get('year_of_career', ''),
        'quarter': header_fields.get('quarter', ''),
        'character': header_fields.get('character', ''),
        'regime': header_fields.get('regime', ''),
        'total_hours': header_fields.get('hours', ''),  # Carga Horaria
        'teaching_team': teaching_team_list,
        
        # Secciones generales
        'minimum_content': extract_section_content(doc, 'contenidos mínimos', 'importancia'),
        'importance': extract_section_content(doc, 'importancia', 'fundamental'),
        'fundamentals_part1': extract_section_content(doc, 'fundamental'),
        'fundamentals_part2': '',
        
        # Competencias
        'generic_competencies': extract_section_content(doc, 'competencias genérica', 'competencias específica'),
        'specific_competencies': extract_section_content(doc, 'competencias específica', 'resultado'),
        
        # Resultados de aprendizaje
        'learning_outcomes': extract_learning_outcomes(doc),
        
        # Unidades
        'units': extract_units(doc),
        
        # Trabajos prácticos
        'practicals': extract_practicals(doc),
        
        # Secciones finales
        'methodology': extract_section_content(doc, 'metodología', 'evaluación'),
        'evaluation': extract_section_content(doc, 'evaluación', 'bibliografía'),
        'bibliography': extract_section_content(doc, 'bibliografía', 'observaciones'),
        'observations': extract_section_content(doc, 'observaciones'),
    }
    
    # Limpiar valores vacíos en teaching_team
    data['teaching_team'] = [
        t for t in data['teaching_team'] 
        if t.get('name') and t['name'] not in ['', '-']
    ]
    
    return data
