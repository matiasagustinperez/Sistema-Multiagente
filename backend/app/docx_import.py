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
    """Extrae campos del encabezado: Carrera, Asignatura, Docentes, etc."""
    fields = {
        'career': '',
        'subject': '',
        'teachers': '',
        'year_of_career': '',
        'quarter': '',
        'hours': '',
        'regime': '',
    }
    
    # Buscar en párrafos y tablas iniciales (antes de contenidos)
    for element in doc.element.body:
        if element.tag.endswith('}p'):
            para = next((p for p in doc.paragraphs if p._element is element), None)
            if para and para.text.strip():
                text = para.text.lower()
                
                # Buscar patrones
                if 'carrera' in text and not fields['career']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['career'] = content[1].strip()
                
                elif 'asignatura' in text and not fields['subject']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['subject'] = content[1].strip()
                
                elif 'docente' in text and not fields['teachers']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['teachers'] = content[1].strip()
                
                elif 'año' in text and not fields['year_of_career']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['year_of_career'] = content[1].strip()
                
                elif 'cuatrimestre' in text and not fields['quarter']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['quarter'] = content[1].strip()
                
                elif 'horas' in text and not fields['hours']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['hours'] = content[1].strip()
                
                elif 'régimen' in text and not fields['regime']:
                    content = para.text.split(':', 1)
                    if len(content) > 1:
                        fields['regime'] = content[1].strip()
    
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
    
    # Extraer todos los datos
    data = {
        # Encabezado
        **extract_header_fields(doc),
        
        # Secciones generales
        'contenidos_minimos': extract_section_content(doc, 'contenidos mínimos', 'importancia'),
        'importance': extract_section_content(doc, 'importancia', 'fundamentals'),
        'fundamentals': extract_section_content(doc, 'fundamental'),
        
        # Resultados de aprendizaje
        'learning_outcomes': extract_learning_outcomes(doc),
        
        # Unidades
        'units': extract_units(doc),
        
        # Trabajos prácticos
        'practicals': extract_practicals(doc),
        
        # Secciones finales
        'methodology': extract_section_content(doc, 'metodología', 'evaluación'),
        'evaluation': extract_section_content(doc, 'evaluación', 'bibliografía'),
        'bibliography_basic_apa': extract_section_content(doc, 'bibliografía básica apa', 'bibliografía complementaria'),
        'bibliography_complementary_apa': extract_section_content(doc, 'bibliografía complementaria apa', 'observaciones'),
        'observations': extract_section_content(doc, 'observaciones'),
    }
    
    return data
