"""
Módulo mejorado para importar datos desde archivos DOCX.
Estrategia: Búsqueda por secciones numeradas (1., 2., 3., etc.)
"""
from __future__ import annotations

import re
from typing import List, Dict, Any, Tuple, Optional
from docx import Document
from docx.table import Table


def extract_text_from_table_cell(cell) -> str:
    """Extrae todo el texto de una celda, preservando párrafos."""
    return '\n'.join([p.text for p in cell.paragraphs if p.text.strip()])


def find_section_paragraphs(doc: Document) -> Dict[str, Tuple[int, int]]:
    """
    Encuentra índices de párrafos con secciones (con o sin números).
    Retorna: {nombre_sección: (inicio_idx, fin_idx)}
    
    Secciones esperadas (sin números en DOCX real):
    - CONTENIDOS MÍNIMOS:
    - FUNDAMENTOS:
    - OBJETIVOS:
    - CONTENIDOS DE LA ASIGNATURA: (UNIDADES)
    - PROGRAMA DE TRABAJOS PRÁCTICOS:
    - METODOLOGÍA:
    - EVALUACIÓN:
    - BIBLIOGRAFÍA:
    - OBSERVACIONES:
    """
    sections = {}
    section_starts = {}
    section_order = []
    
    # Palabras clave para identificar secciones
    section_keywords = {
        'CONTENIDOS MÍNIMOS': 0,
        'CONTENIDOS MINIMOS': 0,
        'FUNDAMENTOS': 1,
        'OBJETIVOS': 2,
        'CONTENIDOS DE LA ASIGNATURA': 3,
        'CONTENIDOS DE LA ASIGNATUR': 3,  # Por si está cortado
        'PROGRAMA DE TRABAJOS PRÁCTICOS': 4,
        'PROGRAMA DE TRABAJOS PRACTICOS': 4,
        'PROGRAMA DE TRABAJO PRACTICO': 4,
        'PROGRAMA DE TRABAJO PRÁCTICO': 4,
        'METODOLOGÍA': 5,
        'METODOLOGIA': 5,
        'EVALUACIÓN': 6,
        'EVALUACION': 6,
        'BIBLIOGRAFÍA': 7,
        'BIBLIOGRAFIA': 7,
        'OBSERVACIONES': 8,
    }
    
    # Buscar inicio de cada sección
    for idx, para in enumerate(doc.paragraphs):
        text = para.text.strip().upper()
        
        # Buscar coincidencia con palabras clave
        for keyword, order in section_keywords.items():
            if text.startswith(keyword):
                # Limpiar el nombre de la sección
                section_name = para.text.strip().rstrip(':')
                section_starts[order] = (idx, section_name)
                section_order.append((order, idx, section_name))
    
    # Crear rangos: desde cada sección hasta la siguiente
    section_order.sort(key=lambda x: x[0])  # Ordenar por número de sección
    for i, (order_num, start_idx, section_name) in enumerate(section_order):
        # Buscar índice final (inicio de siguiente sección)
        if i < len(section_order) - 1:
            end_idx = section_order[i + 1][1]
        else:
            end_idx = len(doc.paragraphs)
        
        sections[section_name] = (start_idx, end_idx)
    
    return sections


def extract_section_content_from_tables(doc: Document, keywords: List[str]) -> str:
    """
    Extrae contenido de TABLAS que coincidan con los keywords dados.
    Usado cuando los párrafos entre secciones están vacíos y el contenido
    está dentro de tablas.
    """
    for table in doc.tables:
        table_text = ' '.join([cell.text for row in table.rows for cell in row.cells]).lower()
        
        # Buscar tabla que contenga todos los keywords
        if all(keyword.lower() in table_text for keyword in keywords):
            content_parts = []
            for row in table.rows[1:]:  # Saltar encabezado
                row_text = '\n'.join([extract_text_from_table_cell(cell) for cell in row.cells])
                if row_text.strip():
                    content_parts.append(row_text)
            return '\n---\n'.join(content_parts)
    
    return ''


def extract_section_content(doc: Document, section_start_idx: int, section_end_idx: int) -> str:
    """
    Extrae contenido de texto entre dos índices de párrafo.
    Como muchas secciones usan tablas, esto busca el contenido textual.
    """
    paragraphs = []
    
    # Extraer párrafos (aunque muchos estén vacíos)
    for idx in range(section_start_idx + 1, section_end_idx):  # +1 para saltar título
        para = doc.paragraphs[idx]
        text = para.text.strip()
        if text and text not in [':', ''] and len(text) > 2:
            paragraphs.append(text)
    
    return '\n'.join(paragraphs)


def extract_section_tables(doc: Document, section_start_idx: int, section_end_idx: int) -> List[Table]:
    """Extrae todas las tablas dentro de un rango de párrafos."""
    tables_in_range = []
    
    # Obtener posiciones de tablas
    para_idx = 0
    for table_idx, table in enumerate(doc.tables):
        # Buscar en qué posición está cada tabla (aproximado)
        # Nota: python-docx no proporciona índice directo, así que usamos heurística
        # Contamos párrafos y tablas hasta encontrar las tablas en el rango
        pass
    
    # Alternativa: buscar tablas por contenido
    for table in doc.tables:
        table_text = extract_text_from_table_cell(table.rows[0].cells[0]) if table.rows else ""
        # Heurística: si la tabla está en este rango, incluirla
        # (Esto es aproximado; mejor sería mapeo directo)
        tables_in_range.append(table)
    
    return tables_in_range


def extract_programa_analitico(doc: Document) -> Dict[str, str]:
    """
    Extrae TODOS los campos de la tabla "Programa Analítico":
    Carácter, Régimen, Carga Horaria Tot, Hs Teóricas, Hs Prácticas, Hs Sem
    """
    program_data = {
        'character': '',
        'regime': '',
        'total_hours': '',
        'theoretical_hours': '',
        'practical_hours': '',
        'weekly_hours': '',
    }
    
    for table in doc.tables:
        table_text = ' '.join([cell.text.lower() for row in table.rows for cell in row.cells])
        
        # Buscar tabla con "régimen" o "programa"
        if ('régimen' in table_text or 'regimen' in table_text or 'carácter' in table_text):
            if len(table.rows) >= 2:
                header_row = table.rows[0]
                data_row = table.rows[1]
                
                # Mapear encabezados a índices
                headers = {}
                for col_idx, cell in enumerate(header_row.cells):
                    header_lower = cell.text.lower().strip()
                    headers[header_lower] = col_idx
                
                # Extraer valores basados en encabezados
                for header_key, col_idx in headers.items():
                    if col_idx < len(data_row.cells):
                        value = data_row.cells[col_idx].text.strip()
                        
                        if 'carácter' in header_key or 'caracter' in header_key:
                            program_data['character'] = value
                        elif 'régimen' in header_key or 'regimen' in header_key:
                            program_data['regime'] = value
                        elif 'carga horaria tot' in header_key or 'carga horaria total' in header_key:
                            program_data['total_hours'] = value
                        elif 'hs teórica' in header_key or 'hs teorica' in header_key:
                            program_data['theoretical_hours'] = value
                        elif 'hs prácti' in header_key or 'hs practi' in header_key:
                            program_data['practical_hours'] = value
                        elif 'hs sem' in header_key:
                            program_data['weekly_hours'] = value
    
    return program_data


def extract_equipo_docente(doc: Document) -> List[Dict[str, str]]:
    """Extrae tabla de Equipo Docente con profesores, categoría, correo."""
    teaching_team = []
    
    for table in doc.tables:
        table_text = ' '.join([cell.text.lower() for row in table.rows for cell in row.cells])
        
        # Buscar tabla de equipo docente
        if ('equipo' in table_text and 'docente' in table_text) or \
           ('profesor' in table_text and 'categoría' in table_text and 'correo' in table_text):
            
            # Encontrar fila de encabezado
            header_row_idx = 0
            for row_idx, row in enumerate(table.rows):
                row_text = ' '.join([cell.text.lower() for cell in row.cells])
                if 'profesor' in row_text or 'categoría' in row_text:
                    header_row_idx = row_idx
                    break
            
            # Mapear columnas desde encabezado
            header_row = table.rows[header_row_idx]
            name_idx = 0
            category_idx = 1
            email_idx = 2
            
            for col_idx, cell in enumerate(header_row.cells):
                cell_lower = cell.text.lower().strip()
                if 'profesor' in cell_lower or 'docente' in cell_lower or 'nombre' in cell_lower:
                    name_idx = col_idx
                elif 'categoría' in cell_lower or 'categoria' in cell_lower:
                    category_idx = col_idx
                elif 'correo' in cell_lower or 'email' in cell_lower:
                    email_idx = col_idx
            
            # Extraer filas de datos
            for row_idx in range(header_row_idx + 1, len(table.rows)):
                row = table.rows[row_idx]
                
                if len(row.cells) > max(name_idx, category_idx, email_idx):
                    name = row.cells[name_idx].text.strip() if name_idx < len(row.cells) else ''
                    category = row.cells[category_idx].text.strip() if category_idx < len(row.cells) else ''
                    email = row.cells[email_idx].text.strip() if email_idx < len(row.cells) else ''
                    
                    # Solo agregar si tiene nombre válido
                    if name and name not in ['', '{{doc1}}', '{{doc2}}', '{{doc3}}']:
                        teaching_team.append({
                            'name': name,
                            'category': category,
                            'email': email,
                        })
    
    return teaching_team


def extract_units_from_docx(doc: Document, section_start_idx: int, section_end_idx: int) -> List[Dict[str, str]]:
    """
    Extrae unidades de la sección 4 (entre CONTENIDOS DE LA ASIGNATURA y PROGRAMA DE TRABAJOS PRÁCTICOS).
    Puede haber múltiples tablas con estructura: Unidad N| Nombre de la Unidad, Contenidos: [texto]
    """
    units = []
    unit_counter = 0
    
    # Buscar todas las tablas en el documento que tengan "unidad" en contenidos
    for table in doc.tables:
        # Verificar si es tabla de unidad
        has_unidad = any('unidad' in cell.text.lower() for row in table.rows for cell in row.cells)
        has_contenidos = any('contenidos' in cell.text.lower() for row in table.rows for cell in row.cells)
        
        if has_unidad and has_contenidos:
            unit_counter += 1
            unit_data = {
                'number': str(unit_counter),
                'name': '',
                'content': '',
                'bibliography_basic': '',
                'bibliography_complementary': '',
            }
            
            # Procesar tabla de unidad
            for row in table.rows:
                row_text = ' '.join([cell.text for cell in row.cells]).strip()
                
                # Primera parte: Unidad N | Nombre
                for cell in row.cells:
                    cell_lower = cell.text.lower()
                    if 'unidad' in cell_lower:
                        # Extraer "Unidad N°: X Nombre de la Unidad"
                        match = re.search(r'unidad\s+n[°º]?\s*:?\s*(\d+)\s+(.*)', cell.text, re.IGNORECASE)
                        if match:
                            unit_data['name'] = match.group(2).strip()
                    elif 'contenidos:' in cell_lower:
                        # Extraer contenido
                        content = cell.text.replace('Contenidos:', '').replace('contenidos:', '').strip()
                        unit_data['content'] = content
                    elif 'bib' in cell_lower and 'básica' in cell_lower:
                        unit_data['bibliography_basic'] = cell.text.replace('Bibliografía Básica', '').strip()
                    elif 'bib' in cell_lower and 'complementaria' in cell_lower:
                        unit_data['bibliography_complementary'] = cell.text.replace('Bibliografía Complementaria', '').strip()
            
            if unit_data['name'] or unit_data['content']:
                units.append(unit_data)
    
    return units


def extract_practicals_from_docx(doc: Document) -> List[Dict[str, str]]:
    """
    Extrae practicales desde sección 5 (PROGRAMA DE TRABAJOS PRÁCTICOS).
    Busca tablas con "Práctico" y "Objetivo".
    """
    practicals = []
    tp_counter = 0
    
    for table in doc.tables:
        table_text = ' '.join([cell.text for row in table.rows for cell in row.cells])
        table_text_lower = table_text.lower()
        
        # Buscar tabla de TP
        if ('practico' in table_text_lower or 'práctico' in table_text_lower) and 'objetivo' in table_text_lower:
            tp_counter += 1
            practical_data = {
                'number': str(tp_counter),
                'name': '',
                'objective': '',
                'activities': '',
                'evaluation_method': '',
                'expected_results': '',
            }
            
            # Procesar tabla
            for row in table.rows:
                for cell in row.cells:
                    cell_lower = cell.text.lower()
                    cell_text = cell.text.strip()
                    
                    if 'practico' in cell_lower or 'práctico' in cell_lower:
                        # Extraer "Práctico Nº: X Nombre"
                        match = re.search(r'pr[áa]ctico\s+n[°º]?\s*:?\s*(\d+)\s+(.*)', cell.text, re.IGNORECASE)
                        if match:
                            practical_data['name'] = match.group(2).strip()
                    elif 'objetivo' in cell_lower:
                        practical_data['objective'] = cell_text.replace('Objetivo', '').replace('objetivo', '').strip()
                    elif 'actividad' in cell_lower:
                        practical_data['activities'] = cell_text.replace('Actividades', '').replace('actividades', '').strip()
                    elif 'evaluación' in cell_lower or 'evaluacion' in cell_lower:
                        practical_data['evaluation_method'] = cell_text.replace('Evaluación', '').replace('evaluacion', '').strip()
                    elif 'resultado' in cell_lower and 'esperado' in cell_lower:
                        practical_data['expected_results'] = cell_text.replace('Resultados esperados', '').strip()
            
            if practical_data['name'] or practical_data['objective']:
                practicals.append(practical_data)
    
    return practicals


def extract_header_fields_improved(doc: Document, filename: str = "") -> Dict[str, str]:
    """
    Extrae campos del encabezado mejorado.
    """
    fields = {
        'career': '',
        'subject': '',
        'year_of_career': '',
        'quarter': '',
        'study_plan': '',
    }
    
    # Parsear filename para extraer metadatos
    if filename:
        year_match = re.search(r'(\d+)[°º]', filename)
        if year_match:
            fields['year_of_career'] = year_match.group(1)
        
        quarter_match = re.search(r'(\d+)[°º]\s*[-_]\s*(\d+)[°º]', filename)
        if quarter_match:
            fields['quarter'] = quarter_match.group(2)
        
        if ' - ' in filename:
            subject_part = filename.split(' - ', 1)[1]
            subject_part = subject_part.replace('.docx', '').replace('.DOCX', '').strip()
            if subject_part:
                fields['subject'] = subject_part
    
    # Buscar carrera en párrafos iniciales o documento
    for para in doc.paragraphs[:50]:
        text_lower = para.text.lower()
        if 'carrera' in text_lower and ':' in para.text:
            fields['career'] = para.text.split(':', 1)[1].strip()
            break
    
    return fields


def import_proposal_from_docx(file_path: str, filename: str = "") -> Dict[str, Any]:
    """
    Importa una propuesta completa desde un DOCX usando estrategia de secciones.
    Retorna un diccionario con TODOS los campos extraídos.
    """
    doc = Document(file_path)
    
    # Extraer metadata del encabezado
    header_fields = extract_header_fields_improved(doc, filename)
    
    # Extraer tabla de Programa Analítico (TODOS los campos)
    programa_analitico = extract_programa_analitico(doc)
    
    # Extraer equipo docente
    teaching_team = extract_equipo_docente(doc)
    teaching_team_str = '; '.join([
        f"{t['name']} ({t['category']})"
        for t in teaching_team if t.get('name')
    ])
    
    # Buscar secciones numeradas
    sections = find_section_paragraphs(doc)
    
    # Extraer contenidos mínimos (sección 1)
    contenidos_minimos = ""
    for section_key in sections.keys():
        if 'CONTENIDOS MÍNIMOS' in section_key or 'CONTENIDOS MINIMOS' in section_key:
            start_idx, end_idx = sections[section_key]
            contenidos_minimos = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Extraer fundamentos (sección 2)
    fundamentals = ""
    importance = ""
    professional_profile = ""
    for section_key in sections.keys():
        if 'FUNDAMENTOS' in section_key:
            start_idx, end_idx = sections[section_key]
            fundamentals_text = extract_section_content(doc, start_idx, end_idx)
            # Buscar subsecciones dentro
            if 'Importancia en el Plan de estudio:' in fundamentals_text:
                importance = fundamentals_text.split('Importancia en el Plan de estudio:')[1]
                importance = importance.split('Relación con el perfil')[0] if 'Relación con el perfil' in fundamentals_text else importance
            if 'Relación con el perfil profesional esperado:' in fundamentals_text:
                professional_profile = fundamentals_text.split('Relación con el perfil profesional esperado:')[1]
            fundamentals = fundamentals_text
            break
    
    # Extraer objetivos (sección 3)
    generic_competencies = ""
    specific_competencies = ""
    learning_outcomes = []
    for section_key in sections.keys():
        if 'OBJETIVOS' in section_key:
            start_idx, end_idx = sections[section_key]
            objectives_text = extract_section_content(doc, start_idx, end_idx)
            
            # Buscar subsecciones
            if 'Competencias genéricas' in objectives_text:
                generic_comp_part = objectives_text.split('Competencias genéricas')[1]
                generic_competencies = generic_comp_part.split('Competencias específicas')[0] if 'Competencias específicas' in generic_comp_part else generic_comp_part
            
            if 'Competencias específicas' in objectives_text:
                specific_comp_part = objectives_text.split('Competencias específicas')[1]
                specific_competencies = specific_comp_part.split('Resultados de aprendizaje')[0] if 'Resultados de aprendizaje' in specific_comp_part else specific_comp_part
            
            if 'Resultados de aprendizaje' in objectives_text:
                ra_text = objectives_text.split('Resultados de aprendizaje')[1]
                # Buscar RA1, RA2, etc.
                learning_outcomes = re.findall(r'RA\d+[:\-]?\s*([^\n]+)', ra_text, re.IGNORECASE)
            break
    
    # Extraer unidades (sección 4)
    units = extract_units_from_docx(doc, 0, len(doc.paragraphs))
    
    # Extraer prácticos (sección 5)
    practicals = extract_practicals_from_docx(doc)
    
    # Extraer metodología (sección 6)
    methodology = ""
    for section_key in sections.keys():
        if 'METODOLOGÍA' in section_key or 'METODOLOGIA' in section_key:
            start_idx, end_idx = sections[section_key]
            methodology = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Extraer evaluación (sección 7)
    evaluation = ""
    for section_key in sections.keys():
        if 'EVALUACIÓN' in section_key or 'EVALUACION' in section_key:
            start_idx, end_idx = sections[section_key]
            evaluation = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Extraer bibliografía (sección 8)
    bibliography = ""
    for section_key in sections.keys():
        if 'BIBLIOGRAFÍA' in section_key or 'BIBLIOGRAFIA' in section_key:
            start_idx, end_idx = sections[section_key]
            bibliography = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Extraer observaciones (sección 9)
    observations = ""
    for section_key in sections.keys():
        if 'OBSERVACIONES' in section_key:
            start_idx, end_idx = sections[section_key]
            observations = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Compilar respuesta final
    data = {
        # Encabezado
        'career': header_fields.get('career', ''),
        'subject': header_fields.get('subject', ''),
        'study_plan': header_fields.get('study_plan', ''),
        'year_of_career': header_fields.get('year_of_career', ''),
        'quarter': header_fields.get('quarter', ''),
        
        # Programa Analítico (TODO)
        'character': programa_analitico.get('character', ''),
        'regime': programa_analitico.get('regime', ''),
        'total_hours': programa_analitico.get('total_hours', ''),
        'theoretical_hours': programa_analitico.get('theoretical_hours', ''),
        'practical_hours': programa_analitico.get('practical_hours', ''),
        'weekly_hours': programa_analitico.get('weekly_hours', ''),
        
        # Equipo docente
        'teachers': teaching_team_str,
        'teaching_team': teaching_team,
        
        # Secciones del documento
        'minimum_content': contenidos_minimos,
        'importance': importance.strip(),
        'professional_profile': professional_profile.strip(),
        'fundamentals': fundamentals,
        'generic_competencies': generic_competencies.strip(),
        'specific_competencies': specific_competencies.strip(),
        'learning_outcomes': learning_outcomes,
        
        # Contenido
        'units': units,
        'practicals': practicals,
        'methodology': methodology,
        'evaluation': evaluation,
        'bibliography': bibliography,
        'observations': observations,
    }
    
    return data
