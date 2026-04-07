"""
MACAU — Generador de reportes PDF con ReportLab.
Cada función recibe datos ya consultados y devuelve bytes del PDF.
"""

import html as _html

import io
from datetime import datetime, timedelta, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ─── Paleta de colores institucional ────────────────────────────────────────
C_PRIMARY = colors.HexColor("#1a237e")   # azul oscuro
C_ACCENT = colors.HexColor("#3949ab")    # azul medio
C_LIGHT = colors.HexColor("#e8eaf6")     # azul muy claro (fondo de header)
C_GREEN = colors.HexColor("#2e7d32")
C_RED = colors.HexColor("#c62828")
C_GRAY = colors.HexColor("#607d8b")
C_LIGHT_GRAY = colors.HexColor("#eceff1")
C_WHITE = colors.white
C_BLACK = colors.black

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

# Zona horaria Argentina (UTC-3, sin cambio de horario)
TZ_AR = timezone(timedelta(hours=-3))

# Ancho útil por orientación (descontando márgenes)
_USABLE_W = PAGE_W - 2 * MARGIN          # ≈ 17.0 cm  — retrato
_LAND_W, _ = landscape(A4)
_LAND_USABLE_W = _LAND_W - 2 * MARGIN   # ≈ 25.7 cm  — apaisado


# ─── Orden jerárquico de categorías docentes ────────────────────────────────
_CATEGORY_ORDER: dict[str, int] = {
    "titular": 0,
    "asociado": 1,
    "adjunto": 2,
    "jtp": 3, "jtpo": 3, "j.t.p.": 3,
    "ayudante de 1": 4, "ayudante 1": 4,
    "ayudante de 2": 5, "ayudante 2": 5,
    "ayudante": 6,
}


def _teacher_sort_key(member: dict) -> int:
    cat = (member.get("cargo") or member.get("category") or "").lower().strip()
    for k, v in _CATEGORY_ORDER.items():
        if k in cat:
            return v
    return 99


# ─── Estilos reutilizables ──────────────────────────────────────────────────
def _styles():
    base = getSampleStyleSheet()
    s = {
        "title": ParagraphStyle(
            "mac_title",
            fontSize=16,
            fontName="Helvetica-Bold",
            textColor=C_PRIMARY,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "mac_subtitle",
            fontSize=10,
            fontName="Helvetica",
            textColor=C_GRAY,
            alignment=TA_LEFT,
            spaceAfter=10,
        ),
        "section": ParagraphStyle(
            "mac_section",
            fontSize=11,
            fontName="Helvetica-Bold",
            textColor=C_PRIMARY,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "mac_body",
            fontSize=9,
            fontName="Helvetica",
            textColor=C_BLACK,
            leading=13,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "mac_small",
            fontSize=8,
            fontName="Helvetica",
            textColor=C_GRAY,
            leading=11,
        ),
        "badge_ok": ParagraphStyle(
            "mac_badge_ok",
            fontSize=8,
            fontName="Helvetica-Bold",
            textColor=C_GREEN,
        ),
        "badge_fail": ParagraphStyle(
            "mac_badge_fail",
            fontSize=8,
            fontName="Helvetica-Bold",
            textColor=C_RED,
        ),
    }
    return s


def _make_callbacks(generated_by: str = "", landscape_mode: bool = False, show_system_name: bool = True):
    """Devuelve (on_first, on_later) con encabezado/pie y datos del usuario integrados."""
    def _draw(canvas, doc):
        canvas.saveState()
        w, h = landscape(A4) if landscape_mode else A4
        # ── Encabezado ──────────────────────────────────────────────────────
        canvas.setFillColor(C_PRIMARY)
        canvas.rect(0, h - 1.2 * cm, w, 1.2 * cm, fill=True, stroke=False)
        canvas.setFillColor(C_WHITE)
        canvas.setFont("Helvetica-Bold", 9)
        header_label = ("MACAU — Sistema Multiagente de Apoyo a la Calidad Académica Universitaria"
                        if show_system_name else "")
        canvas.drawString(MARGIN, h - 0.85 * cm, header_label)
        canvas.setFont("Helvetica", 8)
        now_ar = datetime.now(TZ_AR).strftime("%d/%m/%Y %H:%M")
        canvas.drawRightString(w - MARGIN, h - 0.85 * cm, now_ar)
        # ── Pie de página ────────────────────────────────────────────────────
        canvas.setFillColor(C_LIGHT_GRAY)
        canvas.rect(0, 0, w, 0.8 * cm, fill=True, stroke=False)
        canvas.setFillColor(C_GRAY)
        canvas.setFont("Helvetica", 7)
        by_text = (f"Generado por: {generated_by}"
                   if generated_by.strip() else "MACAU — Reporte generado automáticamente")
        canvas.drawString(MARGIN, 0.25 * cm, by_text)
        canvas.drawRightString(w - MARGIN, 0.25 * cm, f"Página {doc.page}")
        canvas.restoreState()
    return _draw, _draw


def _doc(buf: io.BytesIO, title: str, landscape_mode: bool = False) -> SimpleDocTemplate:
    ps = landscape(A4) if landscape_mode else A4
    top = 1.8 * cm
    return SimpleDocTemplate(
        buf,
        pagesize=ps,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=top,
        bottomMargin=1.2 * cm,
        title=title,
        author="MACAU",
    )


def _report_title(story: list, title: str, subtitle: str = "") -> None:
    s = _styles()
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(title, s["title"]))
    if subtitle:
        story.append(Paragraph(subtitle, s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceAfter=6))


def _table_style_default() -> TableStyle:
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_WHITE, C_LIGHT]),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c5cae9")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ])


def _truncate(text: str | None, max_len: int = 120) -> str:
    if not text:
        return "—"
    text = str(text).strip()
    return text[:max_len] + "..." if len(text) > max_len else text


# ════════════════════════════════════════════════════════════════════════════
# 1. REPORTE DE DOCENTES
# ════════════════════════════════════════════════════════════════════════════

def report_docentes(teachers: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    buf = io.BytesIO()
    doc = _doc(buf, "Listado de Docentes")
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, show_system_name=show_system_name)

    _report_title(
        story,
        "Listado de Docentes",
        f"{len(teachers)} docente(s) — Generado el {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not teachers:
        story.append(Paragraph("No hay docentes registrados.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    u = _USABLE_W
    headers = ["#", "Nombre (Cargo)", "Correo electrónico", "Dedicación", "Carreras"]
    col_widths = [u*0.04, u*0.32, u*0.25, u*0.17, u*0.22]
    rows = [headers]

    for i, t in enumerate(teachers, 1):
        carreras = ", ".join(t.get("careers", [])) or "—"
        nombre = t.get("name") or "—"
        categoria = t.get("category") or ""
        nombre_con_cargo = f"{nombre} ({categoria})" if categoria else nombre
        rows.append([
            str(i),
            Paragraph(nombre_con_cargo, s["small"]),
            Paragraph(t.get("email") or "—", s["small"]),
            Paragraph(t.get("dedication") or "—", s["small"]),
            Paragraph(carreras, s["small"]),
        ])

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_table_style_default())
    story.append(tbl)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 2. REPORTE DE PROPUESTAS (listado con info básica)
# ════════════════════════════════════════════════════════════════════════════

def report_propuestas(proposals: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    buf = io.BytesIO()
    doc = _doc(buf, "Listado de Propuestas Analíticas", landscape_mode=True)
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, landscape_mode=True, show_system_name=show_system_name)

    _report_title(
        story,
        "Listado de Propuestas Analíticas",
        f"{len(proposals)} propuesta(s) — Generado el {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not proposals:
        story.append(Paragraph("No hay propuestas registradas.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    u = _LAND_USABLE_W
    headers = ["#", "Carrera", "Asignatura", "Año", "Cuatrim.", "Equipo Docente", "Contenidos Mínimos", "Estado"]
    col_widths = [u*0.03, u*0.15, u*0.14, u*0.05, u*0.07, u*0.17, u*0.30, u*0.09]
    rows = [headers]

    for i, p in enumerate(proposals, 1):
        team = p.get("teaching_team") or []
        if isinstance(team, list):
            team_parts = []
            for m in sorted(team, key=_teacher_sort_key):
                if isinstance(m, dict):
                    nombre = m.get("nombre") or m.get("name") or ""
                    cargo = m.get("cargo") or m.get("category") or ""
                    team_parts.append(f"{nombre} ({cargo})" if cargo else nombre)
            team_str = "\n".join(team_parts) or "—"
        else:
            team_str = str(team) or "—"
        rows.append([
            str(i),
            Paragraph(p.get("career") or "—", s["small"]),
            Paragraph(p.get("subject") or "—", s["small"]),
            p.get("year_of_career") or "—",
            p.get("quarter") or "—",
            Paragraph(team_str, s["small"]),
            Paragraph(p.get("minimum_content") or "—", s["small"]),
            p.get("status") or "—",
        ])

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_table_style_default())
    story.append(tbl)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 3. REPORTE DE INSTRUMENTOS DE EVALUACIÓN
# ════════════════════════════════════════════════════════════════════════════

def report_instrumentos(instruments: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    buf = io.BytesIO()
    doc = _doc(buf, "Instrumentos de Evaluación", landscape_mode=True)
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, landscape_mode=True, show_system_name=show_system_name)

    _report_title(
        story,
        "Instrumentos de Evaluación",
        f"{len(instruments)} instrumento(s) — Generado el {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not instruments:
        story.append(Paragraph("No hay instrumentos registrados.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    u = _LAND_USABLE_W
    headers = ["#", "Carrera", "Plan", "Asignatura", "Tipo", "Título", "Subido por", "Fecha"]
    col_widths = [u*0.03, u*0.15, u*0.11, u*0.18, u*0.08, u*0.22, u*0.14, u*0.09]
    rows = [headers]

    for i, inst in enumerate(instruments, 1):
        fecha = ""
        raw_date = inst.get("created_at")
        if raw_date:
            try:
                fecha = datetime.fromisoformat(str(raw_date)).strftime("%d/%m/%Y")
            except Exception:
                fecha = str(raw_date)[:10]
        rows.append([
            str(i),
            Paragraph(inst.get("career") or "—", s["small"]),
            Paragraph(inst.get("study_plan") or "—", s["small"]),
            Paragraph(inst.get("subject") or "—", s["small"]),
            Paragraph(inst.get("instrument_type") or "—", s["small"]),
            Paragraph(inst.get("title") or inst.get("original_filename") or "—", s["small"]),
            Paragraph(inst.get("uploaded_by") or "—", s["small"]),
            fecha or "—",
        ])

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_table_style_default())
    story.append(tbl)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 4. REPORTE DE SUGERENCIAS DE CONTROLES INTELIGENTES
# ════════════════════════════════════════════════════════════════════════════

def report_sugerencias(results: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    """
    results: lista de dicts con campos:
      proposal_subject, proposal_career, control_name, control_topic,
      passed, what_failed, suggestion, proposed_text, checked_at
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Sugerencias de Controles Inteligentes")
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, show_system_name=show_system_name)

    failed = [r for r in results if not r.get("passed", True)]
    passed = [r for r in results if r.get("passed", True)]

    _report_title(
        story,
        "Sugerencias de Controles Inteligentes",
        f"{len(results)} resultado(s) — {len(failed)} con observación, {len(passed)} aprobados — {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not results:
        story.append(Paragraph("No hay resultados de controles.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    def _safe(text: str | None) -> str:
        """Escape HTML-special chars so Paragraph doesn't misparse them."""
        return _html.escape(str(text or ""), quote=False)

    def _render_group(items: list, group_title: str, color: Any) -> None:
        if not items:
            return
        story.append(Paragraph(group_title, s["section"]))
        for r in items:
            fecha = ""
            raw_date = r.get("checked_at")
            if raw_date:
                try:
                    fecha = datetime.fromisoformat(str(raw_date)).strftime("%d/%m/%Y %H:%M")
                except Exception:
                    fecha = str(raw_date)[:16]

            data = [
                [Paragraph(f"<b>Propuesta:</b> {_safe(r.get('proposal_subject'))}", s["body"]),
                 Paragraph(f"<b>Carrera:</b> {_safe(r.get('proposal_career'))}", s["body"])],
                [Paragraph(f"<b>Control:</b> {_safe(r.get('control_name'))}", s["body"]),
                 Paragraph(f"<b>Tópico:</b> {_safe(r.get('control_topic', '—'))}  |  <b>Fecha:</b> {fecha or '—'}", s["body"])],
            ]
            span_cmds = []
            if r.get("what_failed"):
                idx = len(data)
                data.append([
                    Paragraph(f"<b>Observación:</b> {_safe(r.get('what_failed'))}", s["body"]),
                    Paragraph("", s["body"]),
                ])
                span_cmds.append(("SPAN", (0, idx), (-1, idx)))
            if r.get("why_failed"):
                idx = len(data)
                data.append([
                    Paragraph(f"<b>Por qué:</b> {_safe(r.get('why_failed'))}", s["body"]),
                    Paragraph("", s["body"]),
                ])
                span_cmds.append(("SPAN", (0, idx), (-1, idx)))
            if r.get("suggestion"):
                idx = len(data)
                data.append([
                    Paragraph(f"<b>Sugerencia:</b> {_safe(r.get('suggestion'))}", s["body"]),
                    Paragraph("", s["body"]),
                ])
                span_cmds.append(("SPAN", (0, idx), (-1, idx)))

            col_w = [_USABLE_W * 0.55, _USABLE_W * 0.45]
            tbl = Table(data, colWidths=col_w)
            base_style = [
                ("BOX", (0, 0), (-1, -1), 1, color),
                ("LINEABOVE", (0, 0), (-1, 0), 2, color),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ] + span_cmds
            tbl.setStyle(TableStyle(base_style))
            story.append(tbl)
            story.append(Spacer(1, 0.25 * cm))

    _render_group(failed, "Con observación", C_RED)
    _render_group(passed, "Aprobados", C_GREEN)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 5. MATRIZ DE TRIBUTACIÓN
# ════════════════════════════════════════════════════════════════════════════

def report_matriz_tributacion(matrix_data: dict, generated_by: str = "", show_system_name: bool = True) -> bytes:
    """
    matrix_data: {
      "career": str,
      "plan": str,
      "competencies": [{"code": str, "description": str, "type": str}],
      "subjects": [{"name": str, "competencies": {code: level, ...}}]
    }
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Matriz de Tributación", landscape_mode=True)
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, landscape_mode=True, show_system_name=show_system_name)

    career = matrix_data.get("career", "")
    plan = matrix_data.get("plan", "")
    competencies = matrix_data.get("competencies", [])
    subjects = matrix_data.get("subjects", [])

    _report_title(
        story,
        "Matriz de Tributación de Competencias",
        f"{career}  |  Plan: {plan}  —  {datetime.now(TZ_AR).strftime('%d/%m/%Y')}",
    )

    if not competencies or not subjects:
        story.append(Paragraph("Sin datos suficientes para generar la matriz.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    # Leyenda de competencias
    story.append(Paragraph("Competencias:", s["section"]))
    for c in competencies:
        story.append(Paragraph(
            f"<b>{c.get('code')}</b> [{c.get('type', '')[:3].upper()}]: {_truncate(c.get('description'), 150)}",
            s["small"]
        ))
    story.append(Spacer(1, 0.3 * cm))

    # Tabla: filas = asignaturas, columnas = competencias + total fila
    comp_codes = [c.get("code", "") for c in competencies]
    _ch = ParagraphStyle("ch", fontSize=6, fontName="Helvetica-Bold", alignment=TA_CENTER)
    _sc = ParagraphStyle("sc", fontSize=7, fontName="Helvetica", leading=9)
    _cv = ParagraphStyle("cv", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)
    _ct = ParagraphStyle("ct", fontSize=7, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=C_PRIMARY)

    header_row = (
        [Paragraph("<b>Asignatura</b>", _ch)]
        + [Paragraph(f"<b>{code}</b>", _ch) for code in comp_codes]
        + [Paragraph("<b>Total</b>", _ch)]
    )

    page_w, _ = landscape(A4)
    usable = page_w - 2 * MARGIN
    subj_col = min(5 * cm, usable * 0.25)
    total_col = 1.2 * cm
    comp_col = (usable - subj_col - total_col) / max(len(comp_codes), 1)
    col_widths = [subj_col] + [comp_col] * len(comp_codes) + [total_col]

    # Data rows + accumulate column sums
    col_sums = [0] * len(comp_codes)
    rows = [header_row]
    for subj in subjects:
        comp_map = subj.get("competencies", {})
        # support legacy list format (list of codes → treat as level 1)
        if isinstance(comp_map, list):
            comp_map = {code: 1 for code in comp_map}
        row_count = 0
        data_cells = []
        for idx, code in enumerate(comp_codes):
            lvl = comp_map.get(code, 0) or 0
            has_contribution = 1 if lvl > 0 else 0
            col_sums[idx] += has_contribution
            row_count += has_contribution
            cell_text = str(lvl) if lvl else ""
            data_cells.append(Paragraph(cell_text, _cv))
        rows.append(
            [Paragraph(_truncate(subj.get("name"), 55), _sc)]
            + data_cells
            + [Paragraph(str(row_count) if row_count else "", _ct)]
        )

    # Totals row at the bottom (count of subjects with contribution per competency)
    grand_total = sum(col_sums)
    totals_row = (
        [Paragraph("<b>Total</b>", _ct)]
        + [Paragraph(str(v) if v else "", _ct) for v in col_sums]
        + [Paragraph(f"<b>{grand_total}</b>", _ct)]
    )
    rows.append(totals_row)

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    style = _table_style_default()
    style.add("FONTSIZE", (0, 1), (-1, -1), 7)
    style.add("ALIGN", (1, 0), (-1, -1), "CENTER")
    style.add("ROWBACKGROUNDS", (0, 1), (-1, -2), [C_WHITE, C_LIGHT])
    # Highlight totals row
    style.add("BACKGROUND", (0, len(rows) - 1), (-1, len(rows) - 1), C_LIGHT)
    style.add("FONTNAME", (0, len(rows) - 1), (-1, len(rows) - 1), "Helvetica-Bold")
    style.add("LINEABOVE", (0, len(rows) - 1), (-1, len(rows) - 1), 0.8, C_PRIMARY)
    # Highlight totals column
    style.add("BACKGROUND", (-1, 0), (-1, -1), C_LIGHT)
    style.add("FONTNAME", (-1, 0), (-1, -1), "Helvetica-Bold")
    style.add("LINEBEFORE", (-1, 0), (-1, -1), 0.8, C_PRIMARY)
    tbl.setStyle(style)
    story.append(tbl)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 6. DOCENTES POR ASIGNATURA / ASIGNATURAS POR DOCENTE
# ════════════════════════════════════════════════════════════════════════════

def report_docentes_por_asignatura(data: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    """
    data: [{"subject": str, "career": str, "teachers": [str, ...]}]
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Docentes por Asignatura")
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, show_system_name=show_system_name)

    _report_title(
        story,
        "Docentes por Asignatura",
        f"{len(data)} asignatura(s) — {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not data:
        story.append(Paragraph("Sin datos.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    u = _USABLE_W
    headers = ["#", "Asignatura", "Carrera", "Docentes"]
    col_widths = [u*0.04, u*0.31, u*0.27, u*0.38]
    rows = [headers]
    for i, row in enumerate(data, 1):
        teachers_list = row.get("teachers", [])
        teachers_str = "\n• ".join(teachers_list) if teachers_list else "—"
        rows.append([
            str(i),
            Paragraph(row.get("subject") or "—", s["small"]),
            Paragraph(row.get("career") or "—", s["small"]),
            Paragraph(("• " + teachers_str) if teachers_list else "—", s["small"]),
        ])

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(_table_style_default())
    story.append(tbl)

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


def report_asignaturas_por_docente(data: list[dict], generated_by: str = "", show_system_name: bool = True) -> bytes:
    """
    data: [{"teacher": str, "email": str, "subjects": [{"career": str, "subject": str}]}]
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Asignaturas por Docente")
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, show_system_name=show_system_name)

    _report_title(
        story,
        "Asignaturas por Docente",
        f"{len(data)} docente(s) — {datetime.now(TZ_AR).strftime('%d/%m/%Y %H:%M')}",
    )

    if not data:
        story.append(Paragraph("Sin datos.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    u = _USABLE_W
    for t in data:
        story.append(Paragraph(
            f"<b>{t.get('teacher', '—')}</b>  <font color='#607d8b' size='8'>{t.get('email', '')}</font>",
            s["section"]
        ))
        subjects = t.get("subjects", [])
        if subjects:
            headers = ["Carrera", "Asignatura"]
            col_widths = [u * 0.35, u * 0.65]
            rows = [headers] + [[
                Paragraph(sub.get("career") or "—", s["small"]),
                Paragraph(sub.get("subject") or "—", s["small"]),
            ] for sub in subjects]
            tbl = Table(rows, colWidths=col_widths, repeatRows=1)
            tbl.setStyle(_table_style_default())
            story.append(tbl)
        else:
            story.append(Paragraph("Sin asignaturas asignadas.", s["small"]))
        story.append(Spacer(1, 0.3 * cm))

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 7. PLAN DE ESTUDIOS
# ════════════════════════════════════════════════════════════════════════════

def report_plan_estudios(plan_data: dict, include_prerequisites: bool = False, generated_by: str = "", show_system_name: bool = True) -> bytes:
    """
    plan_data: {
      "career": str, "plan": str,
      "years": [{"year_number": int, "label": str, "terms": [{"name": str, "subjects": [...]}]}]
    }
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Plan de Estudios", landscape_mode=True)
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, landscape_mode=True, show_system_name=show_system_name)

    career = plan_data.get("career", "")
    plan = plan_data.get("plan", "")
    years = plan_data.get("years", [])

    _report_title(
        story,
        "Plan de Estudios",
        f"{career}  |  Plan: {plan}  —  {datetime.now(TZ_AR).strftime('%d/%m/%Y')}",
    )

    if not years:
        story.append(Paragraph("Sin datos de plan de estudios.", s["body"]))
        doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
        return buf.getvalue()

    page_w, _ = landscape(A4)
    usable = page_w - 2 * MARGIN
    base_widths = [0.8*cm, 3.5*cm, 1.5*cm, 1.5*cm, 2*cm, 2*cm, 2*cm]
    remaining = usable - sum(base_widths)
    if include_prerequisites:
        prereq_w = max(remaining - 2.0*cm, 3.0*cm)
        last_w = remaining - prereq_w
        col_widths = base_widths + [last_w, prereq_w]  # 9 cols
    else:
        col_widths = base_widths + [remaining]  # 8 cols

    for year in years:
        label = year.get("label") or f"Año {year.get('year_number', '')}"
        story.append(Paragraph(label, s["section"]))

        for term in year.get("terms", []):
            story.append(Paragraph(term.get("name", ""), ParagraphStyle(
                "term", fontSize=9, fontName="Helvetica-BoldOblique", textColor=C_ACCENT, spaceBefore=4, spaceAfter=2
            )))

            subjects = term.get("subjects", [])
            if not subjects:
                story.append(Paragraph("Sin asignaturas.", s["small"]))
                continue

            headers = ["#", "Asignatura", "Carácter", "Régimen", "Hs. Teóricas", "Hs. Prácticas", "Hs. Totales", "Hs. Semanales"]
            if include_prerequisites:
                headers.append("Correlativas")

            rows = [headers]
            for i, subj in enumerate(subjects, 1):
                _cell = ParagraphStyle("pc", fontSize=7, fontName="Helvetica", leading=9, wordWrap="LTR")
                row = [
                    Paragraph(str(i), _cell),
                    Paragraph(subj.get("name") or "—", ParagraphStyle("sn", fontSize=7, fontName="Helvetica", leading=9)),
                    Paragraph(subj.get("character") or "—", _cell),
                    Paragraph(subj.get("regime") or "—", _cell),
                    Paragraph(str(subj.get("theoretical_hours") or "—"), _cell),
                    Paragraph(str(subj.get("practical_hours") or "—"), _cell),
                    Paragraph(str(subj.get("total_hours") or "—"), _cell),
                    Paragraph(str(subj.get("weekly_hours") or "—"), _cell),
                ]
                if include_prerequisites:
                    prereqs = subj.get("prerequisites", [])
                    prereq_text = "\n".join(prereqs) if prereqs else "—"
                    row.append(Paragraph(prereq_text, ParagraphStyle("pq", fontSize=6, fontName="Helvetica", leading=8)))
                rows.append(row)

            tbl_cols = col_widths
            tbl = Table(rows, colWidths=tbl_cols, repeatRows=1)
            tbl.setStyle(_table_style_default())
            story.append(tbl)
            story.append(Spacer(1, 0.2 * cm))

        story.append(Spacer(1, 0.3 * cm))

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# 8. REVISIÓN DE PROPUESTA (controles rápidos + inteligentes)
# ════════════════════════════════════════════════════════════════════════════

def report_revision_propuesta(
    proposal: dict,
    quick_results: list[dict],
    intelligent_results: list[dict],
    generated_by: str = "",
    show_system_name: bool = True,
) -> bytes:
    """
    proposal: basic proposal info dict.
    quick_results: [{"key": str, "label": str, "passed": bool}]
    intelligent_results: [{"control_name": str, "topic": str, "passed": bool,
                           "what_failed": str, "suggestion": str, "checked_at": str}]
    """
    buf = io.BytesIO()
    doc = _doc(buf, "Revisión de Propuesta")
    s = _styles()
    story: list = []
    cb_first, cb_later = _make_callbacks(generated_by, show_system_name=show_system_name)

    subject = proposal.get("subject") or "—"
    career = proposal.get("career") or "—"

    _report_title(
        story,
        f"Revisión de Propuesta: {subject}",
        f"Carrera: {career}",
    )

    # ── Datos básicos ────────────────────────────────────────────────────────
    story.append(Paragraph("Información de la Propuesta", s["section"]))
    info_rows = [
        ["Asignatura", subject],
        ["Carrera", career],
        ["Año", str(proposal.get("year_of_career") or "—")],
        ["Cuatrimestre", str(proposal.get("quarter") or "—")],
        ["Estado", str(proposal.get("status") or "—")],
    ]
    team = proposal.get("teaching_team") or []
    if isinstance(team, list):
        team_parts = []
        for m in sorted(team, key=_teacher_sort_key):
            if isinstance(m, dict):
                nombre = m.get("nombre") or m.get("name") or ""
                cargo = m.get("cargo") or m.get("category") or ""
                team_parts.append(f"{nombre} ({cargo})" if cargo else nombre)
        team_str = "\n".join(team_parts) or "—"
    else:
        team_str = str(team) or "—"
    info_rows.append(["Equipo Docente", team_str])

    u = _USABLE_W
    info_tbl = Table(
        [[Paragraph(f"<b>{k}</b>", s["small"]), Paragraph(v, s["small"])] for k, v in info_rows],
        colWidths=[u * 0.25, u * 0.75],
    )
    info_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_WHITE, C_LIGHT]),
        ("BOX", (0, 0), (-1, -1), 0.5, C_GRAY),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#c5cae9")),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 0.4 * cm))

    # ── Controles Rápidos ─────────────────────────────────────────────────────
    story.append(Paragraph("Controles Rápidos", s["section"]))
    if quick_results:
        q_headers = ["Control", "Estado"]
        q_rows = [q_headers]
        passed_q = sum(1 for r in quick_results if r.get("passed"))
        for r in quick_results:
            status_txt = "OK" if r.get("passed") else "Falta"
            q_rows.append([
                Paragraph(r.get("label") or r.get("key") or "—", s["small"]),
                Paragraph(status_txt, s["small"]),
            ])
        q_rows.append([
            Paragraph(f"<b>Total aprobados: {passed_q} / {len(quick_results)}</b>", s["small"]),
            "",
        ])
        q_tbl = Table(q_rows, colWidths=[u * 0.75, u * 0.25], repeatRows=1)
        q_style = _table_style_default()
        for idx, r in enumerate(quick_results, 1):
            if not r.get("passed"):
                q_style.add("TEXTCOLOR", (1, idx), (1, idx), C_RED)
                q_style.add("FONTNAME", (1, idx), (1, idx), "Helvetica-Bold")
            else:
                q_style.add("TEXTCOLOR", (1, idx), (1, idx), C_GREEN)
        q_style.add("SPAN", (0, len(quick_results) + 1), (-1, len(quick_results) + 1))
        q_tbl.setStyle(q_style)
        story.append(q_tbl)
    else:
        story.append(Paragraph("Sin resultados de controles rápidos.", s["body"]))
    story.append(Spacer(1, 0.4 * cm))

    # ── Controles Inteligentes ────────────────────────────────────────────────
    story.append(Paragraph("Controles Inteligentes", s["section"]))

    def _safe(text: str | None) -> str:
        return _html.escape(str(text or ""), quote=False)

    if intelligent_results:
        passed_i = sum(1 for r in intelligent_results if r.get("passed"))
        story.append(Paragraph(
            f"{passed_i} aprobados / {len(intelligent_results) - passed_i} con observación",
            s["body"],
        ))
        story.append(Spacer(1, 0.2 * cm))
        for r in intelligent_results:
            passed = r.get("passed", True)
            color = C_GREEN if passed else C_RED
            fecha = ""
            raw_date = r.get("checked_at")
            if raw_date:
                try:
                    fecha = datetime.fromisoformat(str(raw_date)).strftime("%d/%m/%Y %H:%M")
                except Exception:
                    fecha = str(raw_date)[:16]
            data = [
                [Paragraph(f"<b>{_safe(r.get('control_name'))}</b>", s["body"]),
                 Paragraph(f"Tópico: {_safe(r.get('topic', '—'))}  |  {fecha}", s["small"])],
            ]
            span_cmds = []
            if not passed:
                if r.get("what_failed"):
                    idx = len(data)
                    data.append([
                        Paragraph(f"<b>Observación:</b> {_safe(r.get('what_failed'))}", s["body"]),
                        Paragraph("", s["body"]),
                    ])
                    span_cmds.append(("SPAN", (0, idx), (-1, idx)))
                if r.get("suggestion"):
                    idx = len(data)
                    data.append([
                        Paragraph(f"<b>Sugerencia:</b> {_safe(r.get('suggestion'))}", s["body"]),
                        Paragraph("", s["body"]),
                    ])
                    span_cmds.append(("SPAN", (0, idx), (-1, idx)))
            base_cmds = [
                ("BOX", (0, 0), (-1, -1), 1, color),
                ("LINEABOVE", (0, 0), (-1, 0), 2, color),
                ("BACKGROUND", (0, 0), (-1, 0), C_LIGHT if passed else colors.HexColor("#fdecea")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ] + span_cmds
            i_tbl = Table(data, colWidths=[u * 0.60, u * 0.40])
            i_tbl.setStyle(TableStyle(base_cmds))
            story.append(i_tbl)
            story.append(Spacer(1, 0.2 * cm))
    else:
        story.append(Paragraph("Sin resultados de controles inteligentes.", s["body"]))

    doc.build(story, onFirstPage=cb_first, onLaterPages=cb_later)
    return buf.getvalue()
