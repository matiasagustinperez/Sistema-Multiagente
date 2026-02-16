import React, { useState, useEffect, useRef } from 'react'
import logoMacau from '../Logo MACAU.png'

export default function App() {
  // Main navigation
  const [activeMenu, setActiveMenu] = useState('home')
  const [proposalsMode, setProposalsMode] = useState(null)
  
  // AI state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSection, setAiSection] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [aiError, setAiError] = useState('')
  const [raBatchCount, setRaBatchCount] = useState(5)
  const [comparisonData, setComparisonData] = useState({ original: '', reformulated: '' })
  const [comparisonTarget, setComparisonTarget] = useState(null)
  
  // Form state
  const [equipoDocente, setEquipoDocente] = useState([
    { id: 1, nombre: '', categoria: 'TITULAR', correo: '' }
  ])

  const [editingProposalId, setEditingProposalId] = useState(null)
  const [editingProposalStatus, setEditingProposalStatus] = useState(null)
  const [viewProposal, setViewProposal] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const autosaveTimerRef = useRef(null)
  
  const [formData, setFormData] = useState({
    carrera: '',
    asignatura: '',
    plan: '',
    anio: '',
    ciclo: '',
    cuatrimestre: '',
    caracter: 'Obligatoria',
    regimen: 'Cuatrimestral',
    hsTeo: 0,
    hsPrac: 0,
    contenidosMin: '',
    competenciasGen: '',
    competenciasEsp: '',
    fundamentosP1: '',
    fundamentosP2: '',
    resultadosAprendizaje: [],
    unidades: [],
    trabajosPracticos: [],
    metodologia: '',
    evaluacion: '',
    bibliografia: '',
    observaciones: ''
  })
  
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('')
  const [proposals, setProposals] = useState([])

  useEffect(() => {
    fetchProposals()
  }, [])

  // Auto-clear status messages after 3 seconds
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => {
        setStatusMsg('')
        setStatusType('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [statusMsg])

  const fetchProposals = async () => {
    try {
      const res = await fetch('http://localhost:8001/proposals')
      const data = await res.json()
      setProposals(data)
    } catch (err) {
      console.error('Error fetching proposals:', err)
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const isFormComplete = () => {
    return formData.carrera && formData.asignatura && formData.plan &&
           formData.ciclo && formData.cuatrimestre && formData.caracter &&
           formData.regimen && formData.contenidosMin && 
           formData.competenciasGen && formData.competenciasEsp
  }

  const isNonEmptyText = (value) => typeof value === 'string' && value.trim().length > 0
  const hasNumberValue = (value) => value !== '' && value !== null && value !== undefined
  const isProposalReadyToCreate = () => {
    const requiredTextFields = [
      formData.carrera,
      formData.asignatura,
      formData.plan,
      formData.anio,
      formData.ciclo,
      formData.cuatrimestre,
      formData.caracter,
      formData.regimen,
      formData.contenidosMin,
      formData.competenciasGen,
      formData.competenciasEsp,
      formData.fundamentosP1,
      formData.fundamentosP2,
      formData.metodologia,
      formData.evaluacion,
      formData.bibliografia,
      formData.observaciones
    ]

    const requiredArraysFilled =
      formData.resultadosAprendizaje.length > 0 &&
      formData.resultadosAprendizaje.every(ra => isNonEmptyText(ra.verbo) && isNonEmptyText(ra.descripcion)) &&
      formData.unidades.length > 0 &&
      formData.unidades.every(u => isNonEmptyText(u.nombre) && isNonEmptyText(u.contenidos) && isNonEmptyText(u.bibBasica) && isNonEmptyText(u.bibCompl)) &&
      formData.trabajosPracticos.length > 0 &&
      formData.trabajosPracticos.every(tp => isNonEmptyText(tp.nombre) && isNonEmptyText(tp.objetivo) && isNonEmptyText(tp.actividades) && isNonEmptyText(tp.materiales) && isNonEmptyText(tp.ambito))

    const docentesCompletos = equipoDocente.length > 0 &&
      equipoDocente.every(doc => isNonEmptyText(doc.nombre) && isNonEmptyText(doc.correo))

    return requiredTextFields.every(isNonEmptyText) &&
      hasNumberValue(formData.hsTeo) &&
      hasNumberValue(formData.hsPrac) &&
      requiredArraysFilled &&
      docentesCompletos
  }

  const getCartTotal = () => {
    const teo = parseInt(formData.hsTeo) || 0
    const prac = parseInt(formData.hsPrac) || 0
    return teo + prac
  }

  const getHsSemanales = () => {
    const total = getCartTotal()
    const divisor = formData.regimen === 'Anual' ? 30 : 15
    return Math.round(total / divisor)
  }

  // Docent management
  const addDocente = () => {
    const newId = Math.max(...equipoDocente.map(d => d.id), 0) + 1
    setEquipoDocente([...equipoDocente, { id: newId, nombre: '', categoria: 'AYUDANTE 1º', correo: '' }])
    setIsDirty(true)
  }

  const updateDocente = (id, field, value) => {
    const updated = equipoDocente.map(d => 
      d.id === id ? { ...d, [field]: field === 'nombre' ? value.toUpperCase() : value } : d
    )
    setEquipoDocente(updated)
    sortDocentes(updated)
    setIsDirty(true)
  }

  const deleteDocente = (id) => {
    if (equipoDocente.length > 1) {
      setEquipoDocente(equipoDocente.filter(d => d.id !== id))
      setIsDirty(true)
    }
  }

  const sortDocentes = (docentes = equipoDocente) => {
    const order = { 'TITULAR': 0, 'ASOCIADO': 1, 'ADJUNTO': 2, 'JTP': 3, 'AYUDANTE 1º': 4 }
    const sorted = [...docentes].sort((a, b) => order[a.categoria] - order[b.categoria])
    setEquipoDocente(sorted)
  }

  // RA management
  const addRA = () => {
    setFormData(prev => ({
      ...prev,
      resultadosAprendizaje: [...prev.resultadosAprendizaje, { id: Date.now(), descripcion: '', verbo: '' }]
    }))
    setIsDirty(true)
  }

  const updateRA = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      resultadosAprendizaje: prev.resultadosAprendizaje.map(ra =>
        ra.id === id ? { ...ra, [field]: value } : ra
      )
    }))
    setIsDirty(true)
  }

  const deleteRA = (id) => {
    setFormData(prev => ({
      ...prev,
      resultadosAprendizaje: prev.resultadosAprendizaje.filter(ra => ra.id !== id)
    }))
    setIsDirty(true)
  }

  // Units management
  const addUnidad = () => {
    setFormData(prev => ({
      ...prev,
      unidades: [...prev.unidades, { id: Date.now(), nombre: '', contenidos: '', bibBasica: '', bibCompl: '' }]
    }))
    setIsDirty(true)
  }

  const updateUnidad = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.map(u =>
        u.id === id ? { ...u, [field]: value } : u
      )
    }))
    setIsDirty(true)
  }

  const deleteUnidad = (id) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.filter(u => u.id !== id)
    }))
    setIsDirty(true)
  }

  // Practicals management
  const addTP = () => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: [...prev.trabajosPracticos, { id: Date.now(), nombre: '', objetivo: '', actividades: '', materiales: '', ambito: '' }]
    }))
    setIsDirty(true)
  }

  const updateTP = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: prev.trabajosPracticos.map(tp =>
        tp.id === id ? { ...tp, [field]: value } : tp
      )
    }))
    setIsDirty(true)
  }

  const deleteTP = (id) => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: prev.trabajosPracticos.filter(tp => tp.id !== id)
    }))
    setIsDirty(true)
  }

  const parseLearningOutcomesFromText = (text, desiredCount) => {
    if (!text || typeof text !== 'string') {
      return []
    }
    const rawItems = text
      .split(/\r?\n|•/)
      .map(line => line.replace(/^[-*\d\s.)]+/, '').trim())
      .filter(Boolean)

    const items = rawItems.length > 0 ? rawItems : text.split(';').map(item => item.trim()).filter(Boolean)
    return items.slice(0, desiredCount).map((item, idx) => ({
      id: Date.now() + idx,
      descripcion: item
    }))
  }

  // AI functions
  const generateWithAI = async () => {
    if (!isFormComplete()) {
      setStatusMsg('Completa todos los campos requeridos antes de usar IA')
      setStatusType('error')
      return
    }

    setAiLoading(true)
    setAiSection('propuesta_completa')
    try {
      const prompt = `Crea una propuesta de cátedra académica:
Carrera: ${formData.carrera}
Asignatura: ${formData.asignatura}
Fundamentación: ${formData.fundamentosP1}
Contenidos mínimos: ${formData.contenidosMin}
Competencias: ${formData.competenciasGen}, ${formData.competenciasEsp}`

      const res = await fetch('http://localhost:8001/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      
      if (data.status === 'success') {
        updateFormData('metodologia', sanitizeAiOutput(data.content))
        setStatusMsg('Propuesta generada exitosamente')
        setStatusType('success')
      }
    } catch (err) {
      setStatusMsg('Error al generar con IA: ' + err.message)
      setStatusType('error')
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const generateLearningOutcomes = async () => {
    const count = Math.max(1, Math.min(10, parseInt(raBatchCount, 10) || 1))
    const existingCount = formData.resultadosAprendizaje.length
    const remainingCount = Math.max(0, count - existingCount)
    if (remainingCount === 0) {
      setStatusMsg(`Ya hay ${existingCount} RA cargados`)
      setStatusType('info')
      return
    }
    if (!isNonEmptyText(formData.carrera) || !isNonEmptyText(formData.asignatura)) {
      setStatusMsg('Completa Carrera y Asignatura antes de generar RA')
      setStatusType('info')
      return
    }
    if (!isNonEmptyText(formData.competenciasGen) || !isNonEmptyText(formData.competenciasEsp)) {
      setStatusMsg('Completa Competencias Genericas y Especificas antes de generar RA')
      setStatusType('info')
      return
    }

    setAiError('')
    setAiLoading(true)
    setAiSection('Resultados de Aprendizaje')
    try {
      const prompt = `Genera ${remainingCount} resultados de aprendizaje adicionales para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nCompetencias genericas: ${formData.competenciasGen}\nCompetencias especificas: ${formData.competenciasEsp}\n\nReglas de RA:\n- Centrado en el estudiante.\n- Verbo observable y evaluable.\n- Presente del indicativo.\n- Desempeno demostrable y medible.\n- No mezclar demasiadas capacidades en un solo RA.\n- Estructura: verbo en presente + objeto de conocimiento + contexto/condicion + criterio.\n\nRequisitos de salida:\n- Devuelve solo una lista con ${remainingCount} items.\n- Un item por linea.\n- Solo el texto de cada RA.\n- Sin titulos ni encabezados.`
      const res = await fetch('http://localhost:8001/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      if (data.status === 'success') {
        const cleaned = sanitizeAiOutput(data.content)
        const generated = parseLearningOutcomesFromText(cleaned, remainingCount)
        if (generated.length === 0) {
          throw new Error('No se pudieron interpretar los resultados de aprendizaje')
        }
        setFormData(prev => ({
          ...prev,
          resultadosAprendizaje: [...prev.resultadosAprendizaje, ...generated]
        }))
        setIsDirty(true)
        setStatusMsg(`Se generaron ${generated.length} RA`)
        setStatusType('success')
      } else {
        throw new Error(data.detail || 'Respuesta invalida del servidor')
      }
    } catch (err) {
      const errorMsg = `Error al generar RA con IA: ${err.message}`
      setStatusMsg(errorMsg)
      setStatusType('error')
      setAiError(errorMsg)
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const sanitizeAiOutput = (text) => {
    if (typeof text !== 'string') {
      return ''
    }
    const lines = text.split('\n')
    const cleanedLines = []
    let removedHeading = false
    for (const line of lines) {
      const trimmed = line.trim()
      const isHeading = /^#{1,6}\s+/.test(trimmed) || /^\*\*.+\*\*$/.test(trimmed)
      const isMetaLine = /^directrices/i.test(trimmed) || /^reformulaci[oó]n/i.test(trimmed)
      if (!removedHeading && (isHeading || isMetaLine || trimmed.toLowerCase().startsWith('fundamentos'))) {
        removedHeading = true
        continue
      }
      cleanedLines.push(line)
    }
    return cleanedLines.join('\n').trim()
  }

  const buildAiPrompt = (label, target) => {
    const baseContext = [
      `Carrera: ${formData.carrera}`,
      `Asignatura: ${formData.asignatura}`,
      `Ano en la carrera: ${formData.ciclo}`,
      `Cuatrimestre: ${formData.cuatrimestre}`
    ].join('\n')

    const isFundamentos = target?.field === 'fundamentosP1' || target?.field === 'fundamentosP2'
    if (isFundamentos) {
      return `Escribe el contenido para: ${label}.\n\nContexto:\n${baseContext}\nContenidos minimos: ${formData.contenidosMin}\n\nRequisitos:\n- Entre 100 y 200 palabras.\n- Espanol claro y formal.\n- No incluyas titulos ni encabezados, solo el texto.`
    }

    return `Escribe el contenido para: ${label}.\n\nContexto:\n${baseContext}\n\nRequisitos:\n- Espanol claro y conciso.\n- No incluyas titulos ni encabezados, solo el texto.`
  }

  const runAiForField = async ({ target, currentValue, label }) => {
    const hasContent = typeof currentValue === 'string' && currentValue.trim().length > 0
    if (!hasContent && !isFormComplete()) {
      setStatusMsg('Completa la informacion general antes de usar IA')
      setStatusType('info')
      return
    }

    setAiError('')
    setAiLoading(true)
    setAiSection(label || target.field || 'IA')
    try {
      const endpoint = hasContent ? 'ai-reformulate' : 'ai-generate'
      const raRules = [
        'Reglas de RA: centrado en el estudiante, verbo observable y evaluable, presente del indicativo, desempeño demostrable y medible.',
        'Estructura: verbo en presente + objeto de conocimiento + contexto/condicion + criterio.',
        'No mezclar demasiadas capacidades en un solo RA.',
        'No usar infinitivo (terminaciones -ar, -er, -ir).'
      ].join(' ')

      const prompt = hasContent
        ? (target?.type === 'ra'
          ? `${raRules}\n\nReformula el siguiente RA manteniendo el sentido.\nDevuelve solo el RA reformulado, sin encabezados ni explicaciones:\n${currentValue}`
          : currentValue)
        : (target?.type === 'ra'
          ? `Genera un resultado de aprendizaje para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nCompetencias genericas: ${formData.competenciasGen}\nCompetencias especificas: ${formData.competenciasEsp}\n\n${raRules}\n\nRequisitos:\n- Un solo RA.\n- Solo el texto del RA.\n- Sin titulos ni encabezados.`
          : buildAiPrompt(label || target.field || 'contenido', target))
      const res = await fetch(`http://localhost:8001/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()

      if (data.status === 'success') {
        const cleaned = sanitizeAiOutput(data.content)
        setComparisonData({ original: currentValue || '', reformulated: cleaned })
        setComparisonTarget({ ...target, label: label || target.field || '' })
        setShowComparison(true)
      } else {
        throw new Error(data.detail || 'Respuesta invalida del servidor')
      }
    } catch (err) {
      const action = hasContent ? 'reformular' : 'escribir'
      const errorMsg = `Error al ${action} con IA: ${err.message}`
      setStatusMsg(errorMsg)
      setStatusType('error')
      setAiError(errorMsg)
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const acceptReformulation = () => {
    if (!comparisonTarget) {
      return
    }

    if (comparisonTarget.type === 'form') {
      updateFormData(comparisonTarget.field, comparisonData.reformulated)
    } else if (comparisonTarget.type === 'ra') {
      updateRA(comparisonTarget.id, comparisonTarget.field, comparisonData.reformulated)
    } else if (comparisonTarget.type === 'tp') {
      updateTP(comparisonTarget.id, comparisonTarget.field, comparisonData.reformulated)
    }

    setShowComparison(false)
    setComparisonTarget(null)
  }

  const rejectReformulation = () => {
    setShowComparison(false)
    setComparisonTarget(null)
  }

  const saveProposal = async ({ silent = false } = {}) => {
    const isEditing = !!editingProposalId
    // Validate required fields: carrera and asignatura only
    if (!formData.carrera || !formData.asignatura) {
      if (!silent) {
        setStatusMsg('Requiere al menos: Carrera y Asignatura')
        setStatusType('error')
      }
      return
    }

    if (!isEditing && !isProposalReadyToCreate()) {
      if (!silent) {
        setStatusMsg('Completa todos los campos antes de crear la propuesta')
        setStatusType('error')
      }
      return
    }

    if (isSaving) {
      return
    }

    const computedStatus = editingProposalStatus === 'Importada'
      ? 'Importada'
      : ((isEditing ? isFormComplete() : isProposalReadyToCreate()) ? 'Creada' : 'EnProceso')

    const payload = {
      title: formData.asignatura,
      career: formData.carrera,
      subject: formData.asignatura,
      study_plan: formData.plan,
      academic_year: formData.anio,
      year_of_career: formData.ciclo,
      quarter: formData.cuatrimestre,
      character: formData.caracter,
      regime: formData.regimen,
      theoretical_hours: parseInt(formData.hsTeo) || 0,
      practical_hours: parseInt(formData.hsPrac) || 0,
      total_hours: getCartTotal(),
      weekly_hours: getHsSemanales(),
      minimum_content: formData.contenidosMin,
      generic_competencies: formData.competenciasGen,
      specific_competencies: formData.competenciasEsp,
      fundamentals_part1: formData.fundamentosP1,
      fundamentals_part2: formData.fundamentosP2,
      learning_outcomes: (formData.resultadosAprendizaje || []).map(ra => ({
        id: ra.id,
        description: ra.descripcion || '',
        observable_verb: ra.verbo || ''
      })),
      units: (formData.unidades || []).map(u => ({
        id: u.id,
        name: u.nombre || '',
        content: u.contenidos || '',
        bibliography_basic: u.bibBasica || '',
        bibliography_complementary: u.bibCompl || ''
      })),
      practicals: (formData.trabajosPracticos || []).map(tp => ({
        id: tp.id,
        name: tp.nombre || '',
        objective: tp.objetivo || '',
        activities: tp.actividades || '',
        materials: tp.materiales || '',
        scope: tp.ambito || ''
      })),
      methodology: formData.metodologia,
      evaluation: formData.evaluacion,
      bibliography: formData.bibliografia,
      observations: formData.observaciones,
      status: computedStatus,
      teaching_team: equipoDocente.map(doc => ({
        id: doc.id,
        name: doc.nombre || '',
        category: doc.categoria || '',
        email: doc.correo || ''
      }))
    }

    try {
      setIsSaving(true)
      const res = await fetch(`http://localhost:8001/proposals${isEditing ? `/${editingProposalId}` : ''}`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }

      const data = await res.json()
      if (!silent) {
        setStatusMsg(isEditing ? `Propuesta actualizada - ID: ${data.id}` : 'Propuesta creada - ID: ' + data.id)
        setStatusType('success')
      } else {
        setStatusMsg('Guardado automatico')
        setStatusType('info')
      }
      if (!isEditing) {
        setEditingProposalStatus(null)
        // Reset form
        setFormData({
          carrera: '', asignatura: '', cuatrimestre: '', plan: '', anio: '', ciclo: '',
          caracter: 'Obligatoria', regimen: 'Cuatrimestral', hsTeo: '', hsPrac: '', contenidosMin: '',
          competenciasGen: '', competenciasEsp: '', fundamentosP1: '', fundamentosP2: '',
          resultadosAprendizaje: [], unidades: [], trabajosPracticos: [], metodologia: '',
          evaluacion: '', bibliografia: '', observaciones: ''
        })
        setEquipoDocente([{ id: 1, nombre: '', categoria: 'TITULAR', correo: '' }])
      }
      // Reload proposals list
      fetchProposals()
      setIsDirty(false)
    } catch (err) {
      const msg = err.message === 'Failed to fetch' 
        ? 'No hay conexión con el Backend (8001)' 
        : err.message
      if (!silent) {
        setStatusMsg('Error al guardar: ' + msg)
        setStatusType('error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!isDirty) {
      return
    }
    if (!editingProposalId) {
      return
    }
    if (!formData.carrera || !formData.asignatura) {
      return
    }
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveProposal({ silent: true })
    }, 10000)
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [formData, isDirty, editingProposalId, editingProposalStatus])

  const isProposalComplete = (proposal) => proposal.status !== 'EnProceso'
  const isProposalInProcess = (proposal) => proposal.status === 'EnProceso'

  const loadProposalForEdit = async (proposalId) => {
    try {
      setViewProposal(null)
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      setFormData({
        carrera: data.career || '',
        asignatura: data.subject || data.title || '',
        plan: data.study_plan || '',
        anio: data.academic_year || '',
        ciclo: data.year_of_career || '',
        cuatrimestre: data.quarter || '',
        caracter: data.character || 'Obligatoria',
        regimen: data.regime || 'Cuatrimestral',
        hsTeo: data.theoretical_hours ?? 0,
        hsPrac: data.practical_hours ?? 0,
        contenidosMin: data.minimum_content || '',
        competenciasGen: data.generic_competencies || '',
        competenciasEsp: data.specific_competencies || '',
        fundamentosP1: data.fundamentals_part1 || '',
        fundamentosP2: data.fundamentals_part2 || '',
        resultadosAprendizaje: (data.learning_outcomes || []).map((ra, idx) => ({
          id: ra.id ?? Date.now() + idx,
          descripcion: ra.description || ''
        })),
        unidades: (data.units || []).map((u, idx) => ({
          id: u.id ?? Date.now() + idx,
          nombre: u.name || '',
          contenidos: u.content || '',
          bibBasica: u.bibliography_basic || '',
          bibCompl: u.bibliography_complementary || ''
        })),
        trabajosPracticos: (data.practicals || []).map((tp, idx) => ({
          id: tp.id ?? Date.now() + idx,
          nombre: tp.name || '',
          objetivo: tp.objective || '',
          actividades: tp.activities || '',
          materiales: tp.materials || '',
          ambito: tp.scope || ''
        })),
        metodologia: data.methodology || '',
        evaluacion: data.evaluation || '',
        bibliografia: data.bibliography || '',
        observaciones: data.observations || ''
      })
      if (Array.isArray(data.teaching_team) && data.teaching_team.length > 0) {
        setEquipoDocente(data.teaching_team.map((doc, idx) => ({
          id: doc.id ?? Date.now() + idx,
          nombre: doc.name || '',
          categoria: doc.category || 'AYUDANTE 1º',
          correo: doc.email || ''
        })))
      } else {
        setEquipoDocente([{ id: 1, nombre: '', categoria: 'TITULAR', correo: '' }])
      }
      setEditingProposalId(proposalId)
      setEditingProposalStatus(data.status || null)
      setIsDirty(false)
      setActiveMenu('propuestas')
      setProposalsMode('create')
      setStatusMsg(`Editando propuesta #${proposalId}`)
      setStatusType('info')
    } catch (err) {
      setStatusMsg('Error al cargar propuesta: ' + err.message)
      setStatusType('error')
    }
  }

  const openProposalView = async (proposalId) => {
    try {
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      setViewProposal(data)
    } catch (err) {
      setStatusMsg('Error al cargar propuesta: ' + err.message)
      setStatusType('error')
    }
  }

  const deleteProposal = async (proposalId) => {
    if (!window.confirm(`Eliminar propuesta #${proposalId}? Esta accion no se puede deshacer.`)) {
      return
    }
    try {
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setStatusMsg(`Propuesta #${proposalId} eliminada`)
      setStatusType('success')
      fetchProposals()
    } catch (err) {
      setStatusMsg('Error al eliminar: ' + err.message)
      setStatusType('error')
    }
  }

  const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: 'Segoe UI, Arial' },
    sidebar: { width: '220px', background: '#e8f4f8', color: '#333', padding: '20px', overflowY: 'auto' },
    main: { flex: 1, overflowY: 'auto', background: '#f5f5f5' },
    menuBtn: { display: 'block', width: '100%', padding: '12px', margin: '8px 0', background: '#0066cc', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '14px' },
    menuBtnActive: { background: '#004d7a' },
    header: { background: '#1a3d5c', color: '#fff', padding: '20px', marginBottom: '20px' },
    section: { background: '#fff', margin: '15px 20px', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    label: { display: 'block', fontWeight: '600', marginTop: '12px', marginBottom: '5px', color: '#1a3d5c' },
    input: { width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'Segoe UI' },
    button: { padding: '10px 20px', background: '#006ba8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
    buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    readonlyField: { background: '#f0f0f0', cursor: 'not-allowed' },
    status: { padding: '12px', margin: '10px 20px', borderRadius: '4px', color: '#fff' },
    statusError: { background: '#d32f2f' },
    statusSuccess: { background: '#388e3c' },
    statusInfo: { background: '#1976d2' }
  }

  // Menu Button Component
  const MenuButton = ({ label, onClick, active }) => (
    <button
      style={{ ...styles.menuBtn, ...(active && styles.menuBtnActive) }}
      onClick={onClick}
    >
      {label}
    </button>
  )

  // AI Button Component
  const AIButton = ({ onClick, hasContent, disabled, tooltip }) => {
    const title = disabled ? tooltip : (hasContent ? 'Reformular con IA' : 'Escribir con IA')
    return (
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled) }}
        onClick={onClick}
        disabled={disabled}
        title={title}
      >
        {hasContent ? '✏️' : '✍️'} {hasContent ? 'Reformular con IA' : 'Escribir con IA'}
      </button>
    )
  }

  const canCreateProposal = isProposalReadyToCreate()
  const canSaveEdits = !!formData.carrera && !!formData.asignatura

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <img src={logoMacau} alt="MACAU" style={{ maxWidth: '140px', height: 'auto' }} />
          <h3 style={{ color: '#1a3d5c', fontSize: '16px', marginTop: '10px' }}>MACAU</h3>
        </div>
        <MenuButton label="Home" onClick={() => setActiveMenu('home')} active={activeMenu === 'home'} />
        <MenuButton
          label="Propuestas"
          onClick={() => {
            setActiveMenu('propuestas')
            setProposalsMode(null)
          }}
          active={activeMenu === 'propuestas'}
        />
        <MenuButton label="Docentes" onClick={() => setActiveMenu('docentes')} active={activeMenu === 'docentes'} />
        <MenuButton label="Resoluciones" onClick={() => setActiveMenu('resoluciones')} active={activeMenu === 'resoluciones'} />
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {statusMsg && (
          <div style={{ ...styles.status, ...(statusType === 'error' && styles.statusError), ...(statusType === 'success' && styles.statusSuccess), ...(statusType === 'info' && styles.statusInfo) }}>
            {statusMsg}
          </div>
        )}

        {/* HOME */}
        {activeMenu === 'home' && (
          <div style={styles.section}>
            <h1>Bienvenido a MACAU</h1>
            <p>Sistema de gestión académica para propuestas de cátedra con IA integrada</p>
            <p>Selecciona "Propuestas" para comenzar a crear una nueva propuesta académica</p>
          </div>
        )}

        {/* PROPUESTAS */}
        {activeMenu === 'propuestas' && !proposalsMode && (
          <div style={styles.section}>
            <h2>Propuestas Académicas</h2>
            
            {/* CARDS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px', marginTop: '20px' }}>
              {/* Card 1: Crear Propuesta */}
              <div style={{ 
                border: '2px solid #0066cc', 
                borderRadius: '8px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                backgroundColor: '#f0f8ff',
                ':hover': { backgroundColor: '#e6f2ff', boxShadow: '0 4px 12px rgba(0, 102, 204, 0.2)' }
              }}
              onMouseEnter={(e) => { e.target.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.2)'; e.target.style.backgroundColor = '#e6f2ff'; }}
              onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f0f8ff'; }}
              onClick={() => {
                setEditingProposalId(null)
                setEditingProposalStatus(null)
                setProposalsMode('create')
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
                <h3 style={{ color: '#0066cc', margin: '0 0 10px 0' }}>Crear Propuesta</h3>
                <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>Crear una nueva propuesta desde cero</p>
              </div>

              {/* Card 2: En Proceso */}
              <div style={{ 
                border: '2px solid #ff9900', 
                borderRadius: '8px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                backgroundColor: '#fffbf0'
              }}
              onMouseEnter={(e) => { e.target.style.boxShadow = '0 4px 12px rgba(255, 153, 0, 0.2)'; e.target.style.backgroundColor = '#fffaf0'; }}
              onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#fffbf0'; }}
              onClick={() => setProposalsMode('pending')}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                <h3 style={{ color: '#ff9900', margin: '0 0 10px 0' }}>Propuestas en Proceso</h3>
                <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>Ver y completar propuestas en edición</p>
              </div>

              {/* Card 3: Importar */}
              <div style={{ 
                border: '2px solid #00a854', 
                borderRadius: '8px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                backgroundColor: '#f6ffed'
              }}
              onMouseEnter={(e) => { e.target.style.boxShadow = '0 4px 12px rgba(0, 168, 84, 0.2)'; e.target.style.backgroundColor = '#f0fdf4'; }}
              onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#f6ffed'; }}
              onClick={() => setProposalsMode('import')}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📂</div>
                <h3 style={{ color: '#00a854', margin: '0 0 10px 0' }}>Importar Propuesta</h3>
                <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>Importar desde PDF o DOC</p>
              </div>
            </div>

            {/* PROPOSALS TABLE */}
            <div style={{ ...styles.section, marginTop: '30px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
              <h3>Propuestas Cargadas ({proposals.filter(isProposalComplete).length})</h3>
              {proposals.filter(isProposalComplete).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0066cc', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>ID</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>Carrera</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>Asignatura</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>Año Académico</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>Año Carrera</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc' }}>Cuatrimestre</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #0066cc' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.filter(isProposalComplete).map((prop, idx) => (
                        <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>#{prop.id}</td>
                          <td style={{ padding: '10px' }}>{prop.career || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px' }} 
                              onClick={() => openProposalView(prop.id)}>Ver</button>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px', background: '#ff9900', color: 'white' }} 
                              onClick={() => loadProposalForEdit(prop.id)}>Editar</button>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', background: '#d9534f', color: 'white' }} 
                              onClick={() => deleteProposal(prop.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No hay propuestas cargadas aún.</p>
              )}
            </div>
          </div>
        )}

        {/* CREATE PROPOSAL */}
        {activeMenu === 'propuestas' && proposalsMode === 'create' && (
          <div>
            <div style={styles.section}>
              <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={() => setProposalsMode(null)}>← Volver</button>
              <h2>Nueva Propuesta Académica</h2>

              {/* HEADER SECTION */}
              <div style={{ ...styles.section, marginTop: '20px' }}>
                <h3>Información General</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={styles.label}>Carrera *</label>
                    <select style={styles.input} value={formData.carrera} onChange={(e) => updateFormData('carrera', e.target.value)}>
                      <option value="">Seleccionar carrera...</option>
                      <option>Ingeniería en Sistemas</option>
                      <option>Ingeniería Mecatrónica</option>
                      <option>Licenciatura en Sistemas</option>
                      <option>Tecnicatura Universitaria en Desarrollo Web</option>
                      <option>Tecnicatura Universitaria en Ciencia de Datos</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Asignatura</label>
                    <input style={styles.input} value={formData.asignatura} onChange={(e) => updateFormData('asignatura', e.target.value)} />
                  </div>

                  {/* ROW 1: Plan, Año, Ciclo, Cuatrimestre */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px', padding: '0 10px', gridColumn: '1 / -1' }}>
                    <div>
                      <label style={styles.label}>Plan de Estudios</label>
                      <input style={styles.input} value={formData.plan} onChange={(e) => updateFormData('plan', e.target.value)} placeholder="Ej: Plan 2023" />
                    </div>
                    <div>
                      <label style={styles.label}>Año Académico</label>
                      <input style={styles.input} value={formData.anio} onChange={(e) => updateFormData('anio', e.target.value)} placeholder="Ej: 2024" />
                    </div>
                    <div>
                      <label style={styles.label}>Ciclo (Año en carrera)</label>
                      <input style={styles.input} value={formData.ciclo} onChange={(e) => updateFormData('ciclo', e.target.value)} placeholder="Ej: 1º, 2º, 3º" />
                    </div>
                    <div>
                      <label style={styles.label}>Cuatrimestre *</label>
                      <select style={styles.input} value={formData.cuatrimestre} onChange={(e) => updateFormData('cuatrimestre', e.target.value)}>
                        <option value="">Seleccionar...</option>
                        <option>1er Cuatrimestre</option>
                        <option>2do Cuatrimestre</option>
                        <option>Anual</option>
                      </select>
                    </div>
                  </div>

                  {/* ROW 2: Carácter, Régimen, Hs Teóricas, Hs Prácticas, Total, Hs Semanales */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px', padding: '0 10px', gridColumn: '1 / -1' }}>
                    <div>
                      <label style={styles.label}>Carácter</label>
                      <select style={styles.input} value={formData.caracter} onChange={(e) => updateFormData('caracter', e.target.value)}>
                        <option>Obligatoria</option>
                        <option>Optativa</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Régimen</label>
                      <select style={styles.input} value={formData.regimen} onChange={(e) => updateFormData('regimen', e.target.value)}>
                        <option>Cuatrimestral</option>
                        <option>Anual</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Hs Teóricas</label>
                      <input style={styles.input} type="number" value={formData.hsTeo} onChange={(e) => updateFormData('hsTeo', e.target.value)} min="0" />
                    </div>
                    <div>
                      <label style={styles.label}>Hs Prácticas</label>
                      <input style={styles.input} type="number" value={formData.hsPrac} onChange={(e) => updateFormData('hsPrac', e.target.value)} min="0" />
                    </div>
                    <div>
                      <label style={styles.label}>Total</label>
                      <div
                        style={{ ...styles.input, ...styles.readonlyField, color: '#666', fontWeight: 'bold' }}
                        title="Suma de Hs Teoricas + Hs Practicas"
                      >
                        {getCartTotal()}
                      </div>
                    </div>
                    <div>
                      <label style={styles.label}>Hs Semanales</label>
                      <div
                        style={{ ...styles.input, ...styles.readonlyField, color: '#666', fontWeight: 'bold' }}
                        title="Total de horas dividido en 15 si es Cuatrimestral o en 30 si es Anual"
                      >
                        {getHsSemanales()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOCENT TEAM */}
              <div style={styles.section}>
                <h3>Equipo Docente</h3>
                {equipoDocente.map(doc => (
                  <div key={doc.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <input style={styles.input} placeholder="Nombre" value={doc.nombre} onChange={(e) => updateDocente(doc.id, 'nombre', e.target.value)} />
                    <select style={styles.input} value={doc.categoria} onChange={(e) => updateDocente(doc.id, 'categoria', e.target.value)}>
                      <option>TITULAR</option>
                      <option>ASOCIADO</option>
                      <option>ADJUNTO</option>
                      <option>JTP</option>
                      <option>AYUDANTE 1º</option>
                    </select>
                    <input style={styles.input} placeholder="Correo" value={doc.correo} onChange={(e) => updateDocente(doc.id, 'correo', e.target.value)} />
                    <button style={{ ...styles.button, marginRight: 0 }} onClick={() => deleteDocente(doc.id)} disabled={equipoDocente.length === 1}>X</button>
                  </div>
                ))}
                <button style={styles.button} onClick={addDocente}>+ Agregar Docente</button>
              </div>

              {/* CONTENT SECTIONS */}
              <div style={styles.section}>
                <h3>Contenidos Mínimos *</h3>
                <textarea style={styles.textarea} value={formData.contenidosMin} onChange={(e) => updateFormData('contenidosMin', e.target.value)} />
              </div>

              <div style={styles.section}>
                <h3>Competencias Genéricas *</h3>
                <textarea style={styles.textarea} value={formData.competenciasGen} onChange={(e) => updateFormData('competenciasGen', e.target.value)} />
              </div>

              <div style={styles.section}>
                <h3>Competencias Específicas *</h3>
                <textarea style={styles.textarea} value={formData.competenciasEsp} onChange={(e) => updateFormData('competenciasEsp', e.target.value)} />
              </div>

              {/* FUNDAMENTALS */}
              <div style={styles.section}>
                <h3>Fundamentos</h3>
                <label style={styles.label}>Importancia (100-200 palabras)</label>
                <textarea style={styles.textarea} value={formData.fundamentosP1} onChange={(e) => updateFormData('fundamentosP1', e.target.value)} />
                <AIButton
                  onClick={() => runAiForField({
                    target: { type: 'form', field: 'fundamentosP1' },
                    currentValue: formData.fundamentosP1,
                    label: 'Fundamentos - Importancia'
                  })}
                  hasContent={!!formData.fundamentosP1}
                  disabled={!isFormComplete()}
                  tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                />

                <label style={styles.label}>Perfil Profesional (100-200 palabras)</label>
                <textarea style={styles.textarea} value={formData.fundamentosP2} onChange={(e) => updateFormData('fundamentosP2', e.target.value)} />
                <AIButton
                  onClick={() => runAiForField({
                    target: { type: 'form', field: 'fundamentosP2' },
                    currentValue: formData.fundamentosP2,
                    label: 'Fundamentos - Perfil Profesional'
                  })}
                  hasContent={!!formData.fundamentosP2}
                  disabled={!isFormComplete()}
                  tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                />
              </div>

              {/* LEARNING OUTCOMES */}
              <div style={styles.section}>
                <h3>Resultados de Aprendizaje</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 600, color: '#1a3d5c' }}>Generar</label>
                  <input
                    style={{ ...styles.input, width: '80px', marginBottom: 0 }}
                    type="number"
                    min="1"
                    max="10"
                    value={raBatchCount}
                    onChange={(e) => setRaBatchCount(e.target.value)}
                  />
                  <button style={styles.button} onClick={generateLearningOutcomes}>Generar RA con IA</button>
                </div>
                {formData.resultadosAprendizaje.map((ra, idx) => (
                  <div key={ra.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#1a3d5c', marginBottom: '6px' }}>RA {idx + 1}</div>
                    <textarea style={styles.textarea} placeholder="Resultado de aprendizaje" value={ra.descripcion} onChange={(e) => updateRA(ra.id, 'descripcion', e.target.value)} />
                    <AIButton
                      onClick={() => runAiForField({
                        target: { type: 'ra', id: ra.id, field: 'descripcion' },
                        currentValue: ra.descripcion,
                        label: 'Resultado de Aprendizaje'
                      })}
                      hasContent={!!ra.descripcion}
                      disabled={!isFormComplete()}
                      tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                    />
                    <button style={{ ...styles.button, background: '#d32f2f' }} onClick={() => deleteRA(ra.id)}>Eliminar</button>
                  </div>
                ))}
                <button style={styles.button} onClick={addRA}>+ Agregar RA</button>
              </div>

              {/* UNITS */}
              <div style={styles.section}>
                <h3>Unidades de Contenido</h3>
                {formData.unidades.map(u => (
                  <div key={u.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <input style={styles.input} placeholder="Nombre de la Unidad" value={u.nombre} onChange={(e) => updateUnidad(u.id, 'nombre', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Contenidos" value={u.contenidos} onChange={(e) => updateUnidad(u.id, 'contenidos', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Bibliografía Básica" value={u.bibBasica} onChange={(e) => updateUnidad(u.id, 'bibBasica', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Bibliografía Complementaria" value={u.bibCompl} onChange={(e) => updateUnidad(u.id, 'bibCompl', e.target.value)} />
                    <button style={{ ...styles.button, background: '#d32f2f' }} onClick={() => deleteUnidad(u.id)}>Eliminar Unidad</button>
                  </div>
                ))}
                <button style={styles.button} onClick={addUnidad}>+ Agregar Unidad</button>
              </div>

              {/* PRACTICALS */}
              <div style={styles.section}>
                <h3>Trabajos Prácticos</h3>
                {formData.trabajosPracticos.map(tp => (
                  <div key={tp.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <input style={styles.input} placeholder="Nombre del TP" value={tp.nombre} onChange={(e) => updateTP(tp.id, 'nombre', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Objetivo" value={tp.objetivo} onChange={(e) => updateTP(tp.id, 'objetivo', e.target.value)} />
                    <AIButton
                      onClick={() => runAiForField({
                        target: { type: 'tp', id: tp.id, field: 'objetivo' },
                        currentValue: tp.objetivo,
                        label: 'Objetivo del Trabajo Practico'
                      })}
                      hasContent={!!tp.objetivo}
                      disabled={!isFormComplete()}
                      tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                    />
                    <textarea style={styles.textarea} placeholder="Actividades" value={tp.actividades} onChange={(e) => updateTP(tp.id, 'actividades', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Materiales" value={tp.materiales} onChange={(e) => updateTP(tp.id, 'materiales', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Ámbito de Práctica" value={tp.ambito} onChange={(e) => updateTP(tp.id, 'ambito', e.target.value)} />
                    <button style={{ ...styles.button, background: '#d32f2f' }} onClick={() => deleteTP(tp.id)}>Eliminar TP</button>
                  </div>
                ))}
                <button style={styles.button} onClick={addTP}>+ Agregar TP</button>
              </div>

              {/* OTHER SECTIONS */}
              <div style={styles.section}>
                <h3>Metodología</h3>
                <textarea style={styles.textarea} value={formData.metodologia} onChange={(e) => updateFormData('metodologia', e.target.value)} />
                <AIButton
                  onClick={() => runAiForField({
                    target: { type: 'form', field: 'metodologia' },
                    currentValue: formData.metodologia,
                    label: 'Metodologia'
                  })}
                  hasContent={!!formData.metodologia}
                  disabled={!isFormComplete()}
                  tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                />
              </div>

              <div style={styles.section}>
                <h3>Evaluación</h3>
                <textarea style={styles.textarea} value={formData.evaluacion} onChange={(e) => updateFormData('evaluacion', e.target.value)} />
                <AIButton
                  onClick={() => runAiForField({
                    target: { type: 'form', field: 'evaluacion' },
                    currentValue: formData.evaluacion,
                    label: 'Evaluacion'
                  })}
                  hasContent={!!formData.evaluacion}
                  disabled={!isFormComplete()}
                  tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                />
              </div>

              <div style={styles.section}>
                <h3>Bibliografía</h3>
                <textarea style={styles.textarea} value={formData.bibliografia} onChange={(e) => updateFormData('bibliografia', e.target.value)} />
              </div>

              <div style={styles.section}>
                <h3>Observaciones</h3>
                <textarea style={styles.textarea} value={formData.observaciones} onChange={(e) => updateFormData('observaciones', e.target.value)} />
              </div>

              {/* SAVE BUTTON - STICKY */}
              <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
                <button
                  style={{
                    ...styles.button,
                    background: '#388e3c',
                    fontSize: '16px',
                    padding: '15px 30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    ...((editingProposalId ? !canSaveEdits : !canCreateProposal) && { opacity: 0.45, cursor: 'not-allowed' })
                  }}
                  onClick={saveProposal}
                  disabled={editingProposalId ? !canSaveEdits : !canCreateProposal}
                  title={editingProposalId
                    ? (canSaveEdits ? 'Guardar cambios de la propuesta' : 'Completa Carrera y Asignatura')
                    : (canCreateProposal ? 'Crear propuesta completa' : 'Completa todos los campos para habilitar')}
                >
                  {editingProposalId ? 'Guardar Cambios' : 'Crear Propuesta'}
                </button>
              </div>
            </div>

            {/* COMPARISON MODAL */}
            {aiLoading && (
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                onClick={() => setAiLoading(false)}
              >
                <div
                  style={{ background: '#fff', padding: '24px 30px', borderRadius: '8px', maxWidth: '520px', width: '90%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>Procesando con IA...</h3>
                  <p style={{ marginBottom: 0, color: '#555' }}>
                    {aiSection ? `Seccion: ${aiSection}` : 'Generando contenido'}
                  </p>
                </div>
              </div>
            )}
            {aiError && !aiLoading && (
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                onClick={() => setAiError('')}
              >
                <div
                  style={{ background: '#fff', padding: '24px 30px', borderRadius: '8px', maxWidth: '620px', width: '90%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>No se pudo generar con IA</h3>
                  <p style={{ marginBottom: '20px', color: '#555' }}>{aiError}</p>
                  <button style={{ ...styles.button, background: '#999' }} onClick={() => setAiError('')}>Cerrar</button>
                </div>
              </div>
            )}
            {showComparison && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '900px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <h2>Comparación de Reformulación</h2>
                  {comparisonTarget?.label && (
                    <div style={{ color: '#555', marginTop: '6px' }}>Seccion: {comparisonTarget.label}</div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div>
                      <h3>Original</h3>
                      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', minHeight: '200px', whiteSpace: 'pre-wrap' }}>
                        {comparisonData.original || '-'}
                      </div>
                    </div>
                    <div>
                      <h3>Reformulado</h3>
                      <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '4px', minHeight: '200px', whiteSpace: 'pre-wrap' }}>
                        {comparisonData.reformulated}
                      </div>
                    </div>
                  </div>
                  <button style={{ ...styles.button, background: '#388e3c', marginTop: '20px' }} onClick={acceptReformulation}>Aceptar</button>
                  <button style={{ ...styles.button, background: '#d32f2f' }} onClick={rejectReformulation}>Rechazar</button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* LIST PROPOSALS */}
        {activeMenu === 'propuestas' && proposalsMode === 'list' && (
          <div style={styles.section}>
            <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={() => setProposalsMode(null)}>← Volver</button>
            <h2>Propuestas Guardadas</h2>
            {proposals.filter(isProposalComplete).length === 0 ? (
              <p>No hay propuestas guardadas</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3d5c', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Asignatura</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Carrera</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Creada</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.filter(isProposalComplete).map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{p.id}</td>
                      <td style={{ padding: '10px' }}>{p.title || 'Sin título'}</td>
                      <td style={{ padding: '10px' }}>{p.career || '-'}</td>
                      <td style={{ padding: '10px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PENDING PROPOSALS */}
        {activeMenu === 'propuestas' && proposalsMode === 'pending' && (
          <div style={styles.section}>
            <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={() => setProposalsMode(null)}>← Volver</button>
            <h2>Propuestas en Proceso</h2>
            {proposals.filter(isProposalInProcess).length === 0 ? (
              <p style={{ color: '#999', marginTop: '20px' }}>No hay propuestas en edición aún.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ff9900', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>Carrera</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>Asignatura</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>Año Académico</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>Año Carrera</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>Cuatrimestre</th>
                      <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ff9900' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.filter(isProposalInProcess).map((prop, idx) => (
                      <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>#{prop.id}</td>
                        <td style={{ padding: '10px' }}>{prop.career || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px' }} 
                            onClick={() => loadProposalForEdit(prop.id)}>Continuar</button>
                          <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', background: '#d9534f', marginRight: '5px' }} 
                            onClick={() => deleteProposal(prop.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* IMPORT PROPOSAL */}
        {activeMenu === 'propuestas' && proposalsMode === 'import' && (
          <div style={styles.section}>
            <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={() => setProposalsMode(null)}>← Volver</button>
            <h2>Importar Propuesta</h2>
            <div style={{ marginTop: '20px', padding: '20px', background: '#f6ffed', borderRadius: '8px', border: '2px dashed #00a854' }}>
              <p style={{ color: '#00a854', fontWeight: 'bold' }}>Sube un archivo PDF o DOC</p>
              <input type="file" accept=".pdf,.doc,.docx" style={{ marginTop: '10px' }} />
              <button style={{ ...styles.button, marginTop: '10px', background: '#00a854', color: 'white' }}>Importar Archivo</button>
              <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>El sistema extraerá automáticamente los campos de la propuesta</p>
            </div>
          </div>
        )}

        {/* DOCENTES - Placeholder */}
        {activeMenu === 'docentes' && (
          <div style={styles.section}>
            <h2>Gestión de Docentes</h2>
            <p>Funcionalidad en desarrollo</p>
          </div>
        )}

        {/* RESOLUCIONES - Placeholder */}
        {activeMenu === 'resoluciones' && (
          <div style={styles.section}>
            <h2>Resoluciones</h2>
            <p>Funcionalidad en desarrollo</p>
          </div>
        )}

        {/* VIEW PROPOSAL MODAL */}
        {viewProposal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '900px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Resumen de Propuesta #{viewProposal.id}</h2>
                <button style={{ ...styles.button, background: '#999' }} onClick={() => setViewProposal(null)}>Cerrar</button>
              </div>

              <div style={{ marginTop: '15px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <strong>Estado:</strong> {viewProposal.status || '-'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
                <div><strong>Carrera:</strong> {viewProposal.career || '-'}</div>
                <div><strong>Asignatura:</strong> {viewProposal.subject || viewProposal.title || '-'}</div>
                <div><strong>Plan:</strong> {viewProposal.study_plan || '-'}</div>
                <div><strong>Ano Academico:</strong> {viewProposal.academic_year || '-'}</div>
                <div><strong>Ciclo:</strong> {viewProposal.year_of_career || '-'}</div>
                <div><strong>Cuatrimestre:</strong> {viewProposal.quarter || '-'}</div>
                <div><strong>Caracter:</strong> {viewProposal.character || '-'}</div>
                <div><strong>Regimen:</strong> {viewProposal.regime || '-'}</div>
                <div><strong>Hs Teoricas:</strong> {viewProposal.theoretical_hours ?? '-'}</div>
                <div><strong>Hs Practicas:</strong> {viewProposal.practical_hours ?? '-'}</div>
                <div><strong>Total:</strong> {viewProposal.total_hours ?? '-'}</div>
                <div><strong>Hs Semanales:</strong> {viewProposal.weekly_hours ?? '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Equipo Docente</h3>
                {Array.isArray(viewProposal.teaching_team) && viewProposal.teaching_team.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '8px' }}>
                    {viewProposal.teaching_team.map((doc, idx) => (
                      <React.Fragment key={doc.id ?? idx}>
                        <div>{doc.name || '-'}</div>
                        <div>{doc.category || '-'}</div>
                        <div>{doc.email || '-'}</div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999' }}>-</div>
                )}
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Contenidos Minimos</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewProposal.minimum_content || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Competencias</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>Genericas:</strong> {viewProposal.generic_competencies || '-'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>Especificas:</strong> {viewProposal.specific_competencies || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Fundamentos</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>Importancia:</strong> {viewProposal.fundamentals_part1 || '-'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}><strong>Perfil Profesional:</strong> {viewProposal.fundamentals_part2 || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Resultados de Aprendizaje</h3>
                <div>{(viewProposal.learning_outcomes || []).length} item(s)</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Unidades</h3>
                <div>{(viewProposal.units || []).length} item(s)</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Trabajos Practicos</h3>
                <div>{(viewProposal.practicals || []).length} item(s)</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Metodologia</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewProposal.methodology || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Evaluacion</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewProposal.evaluation || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Bibliografia</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewProposal.bibliography || '-'}</div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <h3>Observaciones</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewProposal.observations || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
