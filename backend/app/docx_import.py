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


def extract_generic_competencies(text: str) -> List[Dict[str, str]]:
    """
    Extrae Competencias Genéricas (CGTx) del texto.
    Formato: "- CGT1 - Descripción - Nivel"
    Retorna: [{'code': 'CGT1', 'description': 'Descripción', 'level': 'Nivel'}, ...]
    """
    competencies = []
    # Buscar líneas que comiencen con "- CGT" o "CGT"
    pattern = r'[-•]\s*([Cc][Gg][Tt]\d+)\s*[-:]\s*([^-]+?)(?:\s*[-:]\s*([^-\n]+))?(?=\n|$)'
    matches = re.finditer(pattern, text, re.MULTILINE)
    
    for match in matches:
        code = match.group(1).upper()
        description = match.group(2).strip()
        level = match.group(3).strip() if match.group(3) else ""
        
        if description:
            competencies.append({
                'code': code,
                'description': description,
                'level': level
            })
    
    return competencies


def extract_specific_competencies(text: str) -> List[Dict[str, str]]:
    """
    Extrae Competencias Específicas (CEx) del texto.
    Formato: "- CE1 - Descripción - Nivel"
    Retorna: [{'code': 'CE1', 'description': 'Descripción', 'level': 'Nivel'}, ...]
    """
    competencies = []
    # Buscar líneas que comiencen con "- CE" o "CE"
    pattern = r'[-•]\s*([Cc][Ee]\d+)\s*[-:]\s*([^-]+?)(?:\s*[-:]\s*([^-\n]+))?(?=\n|$)'
    matches = re.finditer(pattern, text, re.MULTILINE)
    
    for match in matches:
        code = match.group(1).upper()
        description = match.group(2).strip()
        level = match.group(3).strip() if match.group(3) else ""
        
        if description:
            competencies.append({
                'code': code,
                'description': description,
                'level': level
            })
    
    return competencies


def extract_learning_outcomes_parsed(text: str) -> List[Dict[str, str]]:
    """
    Extrae Resultados de Aprendizaje (RAx) del texto con descripción completa.
    Formato: "- RA1 - Descripción completa del aprendizaje"
    Retorna: [{'code': 'RA1', 'description': 'Descripción'}, ...]
    """
    outcomes = []
    # Buscar líneas que comiencen con "- RA" o "RA"
    pattern = r'[-•]\s*([Rr][Aa]\d+)\s*[-:]\s*([^\n]+)'
    matches = re.finditer(pattern, text, re.MULTILINE)
    
    seen_codes = set()
    for match in matches:
        code = match.group(1).upper()
        description = match.group(2).strip()
        
        # Evitar duplicados
        if code not in seen_codes and description:
            seen_codes.add(code)
            outcomes.append({
                'code': code,
                'description': description
            })
    
    # Renumerar RAs para que sean consecutivos (RA1, RA2, RA3, ...)
    outcomes = normalize_learning_outcomes(outcomes)
    return outcomes


def normalize_learning_outcomes(outcomes: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Normaliza los RAs para que sean consecutivos (RA1, RA2, RA3, ...).
    Si hay RAs con números no consecutivos (ej: RA1, RA3, RA5), 
    se renumeran como RA1, RA2, RA3.
    
    Args:
        outcomes: Lista de RAs extraídos
        
    Returns:
        Lista de RAs con códigos consecutivos
    """
    if not outcomes:
        return []
    
    # Renumerar cada RA con su posición en la lista
    normalized = []
    for idx, outcome in enumerate(outcomes, start=1):
        normalized.append({
            'code': f'RA{idx}',
            'description': outcome.get('description', '')
        })
    
    return normalized


def extract_competencies_from_table(doc: Document, table_idx: int) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    """
    Extrae competencias genéricas y específicas desde una tabla específica.
    La tabla generalmente está entre 'OBJETIVOS' y 'CONTENIDOS DE LA ASIGNATURA'.
    """
    gen_comp = []
    spec_comp = []
    
    if table_idx >= len(doc.tables):
        return gen_comp, spec_comp
    
    table = doc.tables[table_idx]
    
    # Buscar en todas las celdas de la tabla
    for row in table.rows:
        for cell in row.cells:
            text = cell.text.strip()
            
            # Buscar CGT - Competencias Genéricas
            cgt_matches = re.findall(r'([Cc][Gg][Tt]\d+)\s*[-:]\s*([^-\n]+?)(?:\s*[-(\[]([^)\]]+))?(?=\n|$)', text)
            for match in cgt_matches:
                code = match[0].upper()
                description = match[1].strip()
                level = match[2].strip() if len(match) > 2 and match[2] else ""
                
                if description and code not in [c['code'] for c in gen_comp]:
                    gen_comp.append({
                        'code': code,
                        'description': description,
                        'level': level
                    })
            
            # Buscar CE - Competencias Específicas
            ce_matches = re.findall(r'([Cc][Ee]\d+)\s*[-:]\s*([^-\n]+?)(?:\s*[-(\[]([^)\]]+))?(?=\n|$)', text)
            for match in ce_matches:
                code = match[0].upper()
                description = match[1].strip()
                level = match[2].strip() if len(match) > 2 and match[2] else ""
                
                if description and code not in [c['code'] for c in spec_comp]:
                    spec_comp.append({
                        'code': code,
                        'description': description,
                        'level': level
                    })
    
    return gen_comp, spec_comp


def extract_fundamentals_from_table(doc: Document, table_idx: int) -> Tuple[str, str]:
    """
    Extrae secciones de 'Importancia' y 'Perfil Profesional' desde una tabla.
    Típicamente la Tabla 3 en documentos con tablas de fundamentos.
    """
    importance = ""
    professional_profile = ""
    
    if table_idx >= len(doc.tables):
        return importance, professional_profile
    
    table = doc.tables[table_idx]
    
    # Buscar en las celdas de la tabla
    for row in table.rows:
        for cell in row.cells:
            text = cell.text.strip()
            
            # Buscar "Importancia"
            if "importancia" in text.lower() and "plan" in text.lower():
                # Extraer todo lo que viene después de los dos puntos
                match = re.search(r'importancia[^:]*:\s*(.+?)(?=relación|$)', text, re.IGNORECASE | re.DOTALL)
                if match:
                    importance = match.group(1).strip()
            
            # Buscar "Perfil Profesional"
            if "relación" in text.lower() and "perfil" in text.lower():
                # Extraer todo lo que viene después
                match = re.search(r'relación[^:]*:\s*(.+?)$', text, re.IGNORECASE | re.DOTALL)
                if match:
                    professional_profile = match.group(1).strip()
    
    return importance, professional_profile


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
    Importa una propuesta completa desde un DOCX.
    Estrategia: Buscar secciones en párrafos TAMBIÉN en tablas.
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
    
    # Buscar secciones numeradas en párrafos
    sections = find_section_paragraphs(doc)
    
    # Extraer contenidos mínimos (sección 1)
    contenidos_minimos = ""
    for section_key in sections.keys():
        if 'CONTENIDOS MÍNIMOS' in section_key or 'CONTENIDOS MINIMOS' in section_key:
            start_idx, end_idx = sections[section_key]
            contenidos_minimos = extract_section_content(doc, start_idx, end_idx)
            break
    
    # Si no se encontró en párrafos, buscar en tablas (Tabla 2)
    if not contenidos_minimos and len(doc.tables) > 2:
        table = doc.tables[2]
        contenidos_minimos = extract_text_from_table_cell(table.rows[0].cells[0]) if table.rows else ""
    
    # Extraer fundamentos (sección 2)
    fundamentals = ""
    importance = ""
    professional_profile = ""
    
    # Primero intentar desde tabla (más probable)  
    if len(doc.tables) > 3:
        importance, professional_profile = extract_fundamentals_from_table(doc, 3)
    
    # Si no se encontró, buscar en párrafos
    if not importance:
        for section_key in sections.keys():
            if 'FUNDAMENTOS' in section_key:
                start_idx, end_idx = sections[section_key]
                fundamentals_text = extract_section_content(doc, start_idx, end_idx)
                
                # Separar subsecciones con regex
                import_match = re.search(r'importancia\s+en\s+el\s+plan\s+de\s+estudio\s*:?\s*(.+?)(?=relación\s+con\s+el\s+perfil|$)', 
                                        fundamentals_text, re.IGNORECASE | re.DOTALL)
                if import_match:
                    importance = import_match.group(1).strip()
                
                profile_match = re.search(r'relación\s+con\s+el\s+perfil\s+profesional\s+esperado\s*:?\s*(.+?)$', 
                                         fundamentals_text, re.IGNORECASE | re.DOTALL)
                if profile_match:
                    professional_profile = profile_match.group(1).strip()
                
                fundamentals = fundamentals_text
                break
    
    # Extraer objetivos (sección 3)
    generic_competencies_list = []
    specific_competencies_list = []
    learning_outcomes = []
    
    # Primero intentar desde tabla de competencias (Tabla 4)
    if len(doc.tables) > 4:
        gen_comp_from_table, spec_comp_from_table = extract_competencies_from_table(doc, 4)
        if gen_comp_from_table or spec_comp_from_table:
            generic_competencies_list = gen_comp_from_table
            specific_competencies_list = spec_comp_from_table
    
    # Si no se encontró en tablas, buscar en párrafos
    if not generic_competencies_list:
        for section_key in sections.keys():
            if 'OBJETIVOS' in section_key:
                start_idx, end_idx = sections[section_key]
                objectives_text = extract_section_content(doc, start_idx, end_idx)
                
                generic_competencies_list = extract_generic_competencies(objectives_text)
                specific_competencies_list = extract_specific_competencies(objectives_text)
                learning_outcomes = extract_learning_outcomes_parsed(objectives_text)
                
                break
    
    # Si no se encontraron RAs en párrafos, intentar desde TABLAS
    if not learning_outcomes:
        for table_idx, table in enumerate(doc.tables):
            # Buscar tablas que contengan "RA"
            for row in table.rows:
                for cell in row.cells:
                    cell_text = cell.text
                    if 'RA1' in cell_text or 'RA2' in cell_text or 'RA3' in cell_text:
                        # Encontrada tabla con RAs
                        ra_pattern = r'(RA\d+)\s*[-:]\s*([^\n]+)'
                        ra_matches = re.finditer(ra_pattern, cell_text, re.IGNORECASE)
                        
                        # Deduplicación con seen_codes
                        seen_codes = set()
                        temp_outcomes = []
                        for match in ra_matches:
                            code = match.group(1).upper()
                            description = match.group(2).strip()
                            
                            # Evitar duplicados
                            if code not in seen_codes and description:
                                seen_codes.add(code)
                                temp_outcomes.append({
                                    'code': code,
                                    'description': description
                                })
                        
                        # Normalizar RAs a consecutivos
                        learning_outcomes = normalize_learning_outcomes(temp_outcomes)
                        break
            
            # Si ya encontramos RAs, salir del bucle externo
            if learning_outcomes:
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
        
        # Programa Analítico
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
        'importance': importance.strip() if importance else "",
        'professional_profile': professional_profile.strip() if professional_profile else "",
        'fundamentals': fundamentals,
        'generic_competencies': generic_competencies_list,
        'specific_competencies': specific_competencies_list,
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
