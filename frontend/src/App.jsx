import React, { useState, useEffect, useRef } from 'react'
import logoMacau from '../Logo MACAU.png'

const careerOptions = [
  'Ingeniería en Sistemas',
  'Ingeniería Mecatrónica',
  'Licenciatura en Sistemas'
]

const App = () => {
  // Main navigation
  const [activeMenu, setActiveMenu] = useState('home')
  const [proposalsMode, setProposalsMode] = useState(null)
  const [activeCareer, setActiveCareer] = useState(() => localStorage.getItem('activeCareer') || '')
  const [viewRole, setViewRole] = useState('director')
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [selectedTeacherName, setSelectedTeacherName] = useState('')

  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importPreview, setImportPreview] = useState(null)

  // AI state
  const [aiSection, setAiSection] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [aiError, setAiError] = useState('')
  const [raBatchCount, setRaBatchCount] = useState(5)
  const [unitBatchCount, setUnitBatchCount] = useState(4)
  const [tpBatchCount, setTpBatchCount] = useState(4)
  const [unitBibliografiaRef, setUnitBibliografiaRef] = useState({ basica: '', complementaria: '', preferencia: '' })
  const [unitBibliografiaDraft, setUnitBibliografiaDraft] = useState({ basica: '', complementaria: '', preferencia: '' })
  const [showUnitBibliografiaModal, setShowUnitBibliografiaModal] = useState(false)
  const [unitDebug, setUnitDebug] = useState(null)
  const [tpCommentRef, setTpCommentRef] = useState('')
  const [tpCommentDraft, setTpCommentDraft] = useState('')
  const [showTpCommentModal, setShowTpCommentModal] = useState(false)
  const [comparisonData, setComparisonData] = useState({ original: '', reformulated: '' })
  const [comparisonTarget, setComparisonTarget] = useState(null)
  
  // Form state
  const [equipoDocente, setEquipoDocente] = useState([
    { id: 1, teacherId: null, nombre: '', categoria: 'TITULAR', correo: '' }
  ])

  const [editingProposalId, setEditingProposalId] = useState(null)
  const [editingProposalStatus, setEditingProposalStatus] = useState(null)
  const [viewProposal, setViewProposal] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const autosaveTimerRef = useRef(null)
  const informacionGeneralRef = useRef(null)
  
  const emptyFormData = {
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
    competenciasGenItems: [],
    competenciasEspItems: [],
    fundamentosP1: '',
    fundamentosP2: '',
    resultadosAprendizaje: [],
    unidades: [],
    trabajosPracticos: [],
    metodologia: '',
    evaluacion: '',
    bibliografia: '',
    observaciones: ''
  }

  const [formData, setFormData] = useState(emptyFormData)
  
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('')
  const [proposals, setProposals] = useState([])
  const [careerCompetencies, setCareerCompetencies] = useState({ generic: [], specific: [] })
  const [catalogCareer, setCatalogCareer] = useState('')
  const [catalogType, setCatalogType] = useState('generic')
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogFormGeneric, setCatalogFormGeneric] = useState({ code: '', description: '' })
  const [catalogFormSpecific, setCatalogFormSpecific] = useState({ code: '', description: '' })
  const [catalogEditId, setCatalogEditId] = useState(null)
  const [catalogEditForm, setCatalogEditForm] = useState({ code: '', description: '' })
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogUsageInfo, setCatalogUsageInfo] = useState({
    itemId: null,
    type: '',
    code: '',
    ids: [],
    items: [],
    loading: false,
    error: ''
  })
  const [catalogDeleteModal, setCatalogDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    code: '',
    items: [],
    loading: false,
    error: ''
  })
  const [teacherCatalogItems, setTeacherCatalogItems] = useState([])
  const [teacherCatalogLoading, setTeacherCatalogLoading] = useState(false)
  const [teacherCatalogError, setTeacherCatalogError] = useState('')
  const [teacherTotalCount, setTeacherTotalCount] = useState(0)
  const [teacherForm, setTeacherForm] = useState({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
  const [teacherUsageInfo, setTeacherUsageInfo] = useState({
    teacherId: null,
    name: '',
    ids: [],
    items: [],
    loading: false,
    error: ''
  })
  const [teacherDeleteModal, setTeacherDeleteModal] = useState({
    isOpen: false,
    teacherId: null,
    name: '',
    items: [],
    loading: false,
    error: ''
  })
  const [teacherEditId, setTeacherEditId] = useState(null)
  const [teacherEditForm, setTeacherEditForm] = useState({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
  const [docenteAutocompleteId, setDocenteAutocompleteId] = useState(null)
  const [completeProposalFilters, setCompleteProposalFilters] = useState({
    id: '',
    subject: '',
    academic_year: '',
    year_of_career: '',
    quarter: '',
    updated_at: '',
    status: ''
  })
  const [completeProposalSort, setCompleteProposalSort] = useState({ key: '', direction: 'asc' })
  const [pendingProposalFilters, setPendingProposalFilters] = useState({
    id: '',
    subject: '',
    academic_year: '',
    year_of_career: '',
    quarter: '',
    updated_at: '',
    status: ''
  })
  const [pendingProposalSort, setPendingProposalSort] = useState({ key: '', direction: 'asc' })
  const [teacherTableFilters, setTeacherTableFilters] = useState({
    name: '',
    category: '',
    dedication: '',
    email: ''
  })
  const [teacherTableSort, setTeacherTableSort] = useState({ key: '', direction: 'asc' })
  const [genericCompetencyFilters, setGenericCompetencyFilters] = useState({ code: '', description: '' })
  const [genericCompetencySort, setGenericCompetencySort] = useState({ key: '', direction: 'asc' })
  const [specificCompetencyFilters, setSpecificCompetencyFilters] = useState({ code: '', description: '' })
  const [specificCompetencySort, setSpecificCompetencySort] = useState({ key: '', direction: 'asc' })

  useEffect(() => {
    fetchProposals()
    fetchTeacherTotals()
  }, [])

  useEffect(() => {
    if (activeCareer) {
      localStorage.setItem('activeCareer', activeCareer)
    } else {
      localStorage.removeItem('activeCareer')
    }
  }, [activeCareer])

  useEffect(() => {
    setSelectedTeacherId(null)
    setSelectedTeacherName('')
  }, [activeCareer])

  useEffect(() => {
    if (viewRole !== 'docente') {
      setSelectedTeacherId(null)
      setSelectedTeacherName('')
    }
  }, [viewRole])

  useEffect(() => {
    if (viewRole !== 'docente') {
      return
    }
    const allowedMenus = ['propuestas', 'resoluciones']
    if (!allowedMenus.includes(activeMenu)) {
      setActiveMenu('propuestas')
    }
    if (proposalsMode === 'import') {
      setProposalsMode(null)
    }
    if (!editingProposalId && proposalsMode === 'create') {
      setProposalsMode(null)
    }
  }, [viewRole, activeMenu, proposalsMode, editingProposalId])

  useEffect(() => {
    if (!activeCareer) {
      return
    }
    setFormData(prev => (prev.carrera === activeCareer ? prev : { ...prev, carrera: activeCareer }))
  }, [activeCareer])

  useEffect(() => {
    if (activeCareer) {
      fetchCareerCompetencies(activeCareer)
    }
  }, [activeCareer])

  useEffect(() => {
    if (activeCareer) {
      fetchTeachers(activeCareer)
    } else {
      setTeacherCatalogItems([])
      setTeacherCatalogError('')
    }
  }, [activeCareer])

  useEffect(() => {
    if (activeMenu !== 'competencias') {
      return
    }
    const career = activeCareer
    if (career && catalogCareer !== career) {
      setCatalogCareer(career)
    }
    if (career) {
      fetchCareerCompetencies(career)
    }
  }, [activeMenu, catalogCareer, activeCareer])

  useEffect(() => {
    if (activeMenu === 'docentes' && activeCareer) {
      fetchTeachers(activeCareer)
    }
  }, [activeMenu])

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

  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-autoresize="true"]')
    textareas.forEach((el) => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
  }, [formData, unitDebug, showComparison, showUnitBibliografiaModal, showTpCommentModal])

  const fetchProposals = async () => {
    try {
      const res = await fetch('http://localhost:8001/proposals')
      const data = await res.json()
      setProposals(data)
    } catch (err) {
      console.error('Error fetching proposals:', err)
    }
  }

  const fetchCareerCompetencies = async (career) => {
    if (!career) {
      setCareerCompetencies({ generic: [], specific: [] })
      return
    }
    try {
      const [genRes, specRes] = await Promise.all([
        fetch(`http://localhost:8001/competencies?career=${encodeURIComponent(career)}&competency_type=generic`),
        fetch(`http://localhost:8001/competencies?career=${encodeURIComponent(career)}&competency_type=specific`)
      ])
      const genData = genRes.ok ? await genRes.json() : []
      const specData = specRes.ok ? await specRes.json() : []
      setCareerCompetencies({ generic: genData, specific: specData })
    } catch (err) {
      console.error('Error fetching competencies catalog:', err)
      setCareerCompetencies({ generic: [], specific: [] })
    }
  }

  const fetchCatalogItems = async (career, type) => {
    if (!career) {
      setCatalogItems([])
      return
    }
    try {
      setCatalogLoading(true)
      const res = await fetch(`http://localhost:8001/competencies?career=${encodeURIComponent(career)}&competency_type=${type}`)
      const data = res.ok ? await res.json() : []
      setCatalogItems(data)
    } catch (err) {
      console.error('Error fetching catalog items:', err)
      setCatalogItems([])
    } finally {
      setCatalogLoading(false)
    }
  }

  const addCatalogItem = async (type, form, setForm) => {
    const careerValue = activeCareer || catalogCareer
    if (!careerValue || !form.code || !form.description) {
      setStatusMsg('Completa carrera activa, código y descripción')
      setStatusType('error')
      return
    }
    const existing = catalogItems.find(item =>
      item.code?.trim().toLowerCase() === form.code.trim().toLowerCase() &&
      item.competency_type === type
    )
    if (existing) {
      setStatusMsg('Ese código ya existe en el catálogo')
      setStatusType('error')
      return
    }
    try {
      const res = await fetch('http://localhost:8001/competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career: careerValue,
          competency_type: type,
          code: form.code,
          description: form.description
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setForm({ code: '', description: '' })
      await fetchCareerCompetencies(careerValue)
      setStatusMsg('Competencia agregada')
      setStatusType('success')
    } catch (err) {
      const message = err.message === 'Competency code already exists'
        ? 'Ese código ya existe en el catálogo'
        : err.message
      setStatusMsg('Error al agregar competencia: ' + message)
      setStatusType('error')
    }
  }

  const startCatalogEdit = (item) => {
    setCatalogEditId(item.id)
    setCatalogEditForm({
      code: item.code || '',
      description: item.description || ''
    })
  }

  const cancelCatalogEdit = () => {
    setCatalogEditId(null)
    setCatalogEditForm({ code: '', description: '' })
  }

  const saveCatalogEdit = async (item) => {
    if (!catalogEditForm.code || !catalogEditForm.description) {
      setStatusMsg('Completa código y descripción')
      setStatusType('error')
      return
    }
    try {
      const res = await fetch(`http://localhost:8001/competencies/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: catalogEditForm.code,
          description: catalogEditForm.description
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const careerValue = activeCareer || catalogCareer
      await fetchCareerCompetencies(careerValue)
      setStatusMsg('Competencia actualizada')
      setStatusType('success')
      cancelCatalogEdit()
    } catch (err) {
      setStatusMsg('Error al actualizar competencia: ' + err.message)
      setStatusType('error')
    }
  }

  const loadCatalogUsage = async (item, type) => {
    if (!item?.id) {
      return
    }
    setCatalogUsageInfo({
      itemId: item.id,
      type,
      code: item.code || '',
      ids: [],
      items: [],
      loading: true,
      error: ''
    })
    try {
      const usageRes = await fetch(`http://localhost:8001/competencies/${item.id}/usage`)
      if (!usageRes.ok) {
        const errorData = await usageRes.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${usageRes.status}`)
      }
      const usageData = await usageRes.json()
      const infoItems = Array.isArray(usageData.affected_proposals_info)
        ? usageData.affected_proposals_info
        : []
      setCatalogUsageInfo(prev => ({
        ...prev,
        ids: Array.isArray(usageData.affected_proposal_ids) ? usageData.affected_proposal_ids : [],
        items: infoItems,
        loading: false,
        error: ''
      }))
    } catch (err) {
      setCatalogUsageInfo(prev => ({
        ...prev,
        ids: [],
        items: [],
        loading: false,
        error: err.message || 'Error al consultar propuestas'
      }))
    }
  }

  const clearCatalogUsage = () => {
    setCatalogUsageInfo({ itemId: null, type: '', code: '', ids: [], items: [], loading: false, error: '' })
  }

  const formatAffectedProposals = (ids = []) => {
    if (!ids.length) {
      return 'No hay propuestas afectadas.'
    }
    const total = ids.length
    const previewLimit = 10
    const preview = ids.slice(0, previewLimit)
    const extraLine = total > previewLimit ? `\nSe muestran ${previewLimit} de ${total}.` : ''
    return `Propuestas afectadas (${total}): ${preview.join(', ')}${extraLine}`
  }

  const formatDateTime = (value) => {
    if (!value) {
      return '-'
    }
    const raw = typeof value === 'string' ? value.trim() : value
    const hasTimeZone = typeof raw === 'string' && /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)
    const date = new Date(hasTimeZone ? raw : `${raw}Z`)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    return formatter.format(date).replace('T', ' ')
  }

  const openDeleteCatalogModal = async (item) => {
    if (!item?.id) {
      return
    }
    setCatalogDeleteModal({
      isOpen: true,
      itemId: item.id,
      code: item.code || '',
      items: [],
      loading: true,
      error: ''
    })
    try {
      const usageRes = await fetch(`http://localhost:8001/competencies/${item.id}/usage`)
      if (!usageRes.ok) {
        const errorData = await usageRes.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${usageRes.status}`)
      }
      const usageData = await usageRes.json()
      const infoItems = Array.isArray(usageData.affected_proposals_info)
        ? usageData.affected_proposals_info
        : []
      setCatalogDeleteModal(prev => ({
        ...prev,
        items: infoItems,
        loading: false,
        error: ''
      }))
    } catch (err) {
      setCatalogDeleteModal(prev => ({
        ...prev,
        items: [],
        loading: false,
        error: err.message || 'Error al consultar propuestas'
      }))
    }
  }

  const closeDeleteCatalogModal = () => {
    setCatalogDeleteModal({ isOpen: false, itemId: null, code: '', items: [], loading: false, error: '' })
  }

  const confirmDeleteCatalogItem = async () => {
    if (!catalogDeleteModal.itemId) {
      return
    }
    try {
      clearCatalogUsage()
      const res = await fetch(`http://localhost:8001/competencies/${catalogDeleteModal.itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const result = await res.json().catch(() => ({}))
      const careerValue = activeCareer || catalogCareer
      await fetchCareerCompetencies(careerValue)
      if (Array.isArray(result.affected_proposal_ids) && result.affected_proposal_ids.length > 0) {
        setStatusMsg(`Competencia eliminada. Propuestas afectadas: ${result.affected_proposal_ids.join(', ')}`)
      } else {
        setStatusMsg('Competencia eliminada')
      }
      setStatusType('success')
      closeDeleteCatalogModal()
    } catch (err) {
      setStatusMsg('Error al eliminar competencia: ' + err.message)
      setStatusType('error')
    }
  }

  const fetchTeachers = async (career) => {
    if (!career) {
      setTeacherCatalogItems([])
      return
    }
    try {
      setTeacherCatalogLoading(true)
      setTeacherCatalogError('')
      const res = await fetch(`http://localhost:8001/teachers?career=${encodeURIComponent(career)}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' }))
        : []
      setTeacherCatalogItems(sorted)
    } catch (err) {
      setTeacherCatalogItems([])
      setTeacherCatalogError(err.message || 'Error al cargar docentes')
    } finally {
      setTeacherCatalogLoading(false)
    }
  }

  const fetchTeacherTotals = async () => {
    try {
      const res = await fetch('http://localhost:8001/teachers')
      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }
      const data = await res.json()
      setTeacherTotalCount(Array.isArray(data) ? data.length : 0)
    } catch (err) {
      setTeacherTotalCount(0)
    }
  }

  const normalizeSearchText = (value) => {
    if (!value) {
      return ''
    }
    return value
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
  }

  const getSortIndicator = (sortState, key) => {
    if (sortState.key !== key) {
      return ''
    }
    return sortState.direction === 'asc' ? ' ▲' : ' ▼'
  }

  const toggleSort = (setSortState, key) => {
    setSortState((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const applyTableFilters = (rows, filters, getters) => {
    return rows.filter((row) => {
      return Object.keys(filters).every((key) => {
        const term = normalizeSearchText(filters[key])
        if (!term) {
          return true
        }
        const value = getters[key] ? getters[key](row) : ''
        return normalizeSearchText(value).includes(term)
      })
    })
  }

  const applyTableSort = (rows, sortState, getters) => {
    if (!sortState.key || !getters[sortState.key]) {
      return rows
    }
    const direction = sortState.direction === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const aValue = getters[sortState.key](a)
      const bValue = getters[sortState.key](b)
      const aNum = Number(aValue)
      const bNum = Number(bValue)
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return (aNum - bNum) * direction
      }
      return String(aValue ?? '').localeCompare(String(bValue ?? ''), 'es', { sensitivity: 'base' }) * direction
    })
  }

  const normalizeTeacherKey = (value) => {
    const cleaned = normalizeSearchText(value)
      .replace(/[,]/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
    const tokens = cleaned.split(/\s+/).filter(Boolean).sort()
    return tokens.join(' ')
  }

  const getTeacherTokenSet = (value) => {
    const key = normalizeTeacherKey(value)
    return new Set(key ? key.split(' ') : [])
  }

  const isTeacherNameDuplicate = (name) => {
    const incomingTokens = Array.from(getTeacherTokenSet(name))
    if (incomingTokens.length < 2) {
      return false
    }
    return teacherCatalogItems.some((teacher) => {
      const existingTokens = Array.from(getTeacherTokenSet(teacher.name))
      if (existingTokens.length < 2) {
        return false
      }
      if (Math.abs(existingTokens.length - incomingTokens.length) > 1) {
        return false
      }
      const incomingSet = new Set(incomingTokens)
      const existingSet = new Set(existingTokens)
      const incomingInExisting = incomingTokens.every(token => existingSet.has(token))
      const existingInIncoming = existingTokens.every(token => incomingSet.has(token))
      return incomingInExisting || existingInIncoming
    })
  }

  const getTeacherSuggestions = (query) => {
    const term = normalizeSearchText(query)
    if (!term) {
      return []
    }
    return teacherCatalogItems.filter((teacher) => {
      const name = normalizeSearchText(teacher.name)
      const email = normalizeSearchText(teacher.email)
      return name.includes(term) || email.includes(term)
    }).slice(0, 6)
  }

  const addTeacher = async () => {
    if (!teacherForm.name.trim()) {
      setStatusMsg('Completa el nombre del docente')
      setStatusType('error')
      return
    }
    if (!teacherForm.dedication || teacherForm.dedication === 'Sin Informar') {
      setStatusMsg('Completa la dedicación del docente')
      setStatusType('error')
      return
    }
    const normalizedEmail = normalizeSearchText(teacherForm.email)
    const duplicate = teacherCatalogItems.some((teacher) => {
      const nameMatch = isTeacherNameDuplicate(teacherForm.name)
      const emailMatch = normalizedEmail && normalizeSearchText(teacher.email) === normalizedEmail
      return nameMatch || emailMatch
    })
    if (duplicate) {
      setStatusMsg('Ese docente ya existe en el catálogo')
      setStatusType('error')
      return
    }
    try {
      const res = await fetch('http://localhost:8001/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherForm.name.trim().toUpperCase(),
          category: teacherForm.category,
          dedication: teacherForm.dedication,
          email: teacherForm.email,
          career: activeCareer
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setTeacherForm({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
      await fetchTeachers(activeCareer)
      await fetchTeacherTotals()
      setStatusMsg('Docente agregado')
      setStatusType('success')
    } catch (err) {
      const message = err.message === 'Teacher already exists'
        ? 'Ese docente ya existe en el catálogo'
        : err.message
      setStatusMsg('Error al agregar docente: ' + message)
      setStatusType('error')
    }
  }

  const startTeacherEdit = (teacher) => {
    if (!teacher?.id) {
      return
    }
    setTeacherEditId(teacher.id)
    setTeacherEditForm({
      name: teacher.name || '',
      category: teacher.category || 'AYUDANTE 1º',
      dedication: teacher.dedication || 'Sin Informar',
      email: teacher.email || ''
    })
  }

  const cancelTeacherEdit = () => {
    setTeacherEditId(null)
    setTeacherEditForm({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
  }

  const saveTeacherEdit = async (teacher) => {
    if (!teacher?.id) {
      return
    }
    if (!teacherEditForm.name.trim()) {
      setStatusMsg('Completa el nombre del docente')
      setStatusType('error')
      return
    }
    if (!teacherEditForm.dedication || teacherEditForm.dedication === 'Sin Informar') {
      setStatusMsg('Completa la dedicación del docente')
      setStatusType('error')
      return
    }
    try {
      const res = await fetch(`http://localhost:8001/teachers/${teacher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherEditForm.name.trim().toUpperCase(),
          category: teacherEditForm.category,
          dedication: teacherEditForm.dedication,
          email: teacherEditForm.email
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      await fetchTeachers(activeCareer)
      await fetchTeacherTotals()
      setStatusMsg('Docente actualizado')
      setStatusType('success')
      cancelTeacherEdit()
    } catch (err) {
      const message = err.message === 'Teacher already exists'
        ? 'Ese docente ya existe en el catálogo'
        : err.message
      setStatusMsg('Error al actualizar docente: ' + message)
      setStatusType('error')
    }
  }

  const loadTeacherUsage = async (teacher) => {
    if (!teacher?.id) {
      return
    }
    setTeacherUsageInfo({
      teacherId: teacher.id,
      name: teacher.name || '',
      ids: [],
      items: [],
      loading: true,
      error: ''
    })
    try {
      const careerValue = activeCareer || ''
      const usageRes = await fetch(`http://localhost:8001/teachers/${teacher.id}/usage?career=${encodeURIComponent(careerValue)}`)
      if (!usageRes.ok) {
        const errorData = await usageRes.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${usageRes.status}`)
      }
      const usageData = await usageRes.json()
      const infoItems = Array.isArray(usageData.affected_proposals_info)
        ? usageData.affected_proposals_info
        : []
      setTeacherUsageInfo(prev => ({
        ...prev,
        ids: Array.isArray(usageData.affected_proposal_ids) ? usageData.affected_proposal_ids : [],
        items: infoItems,
        loading: false,
        error: ''
      }))
    } catch (err) {
      setTeacherUsageInfo(prev => ({
        ...prev,
        ids: [],
        items: [],
        loading: false,
        error: err.message || 'Error al consultar propuestas'
      }))
    }
  }

  const clearTeacherUsage = () => {
    setTeacherUsageInfo({ teacherId: null, name: '', ids: [], items: [], loading: false, error: '' })
  }

  const openDeleteTeacherModal = async (teacher) => {
    if (!teacher?.id) {
      return
    }
    setTeacherDeleteModal({
      isOpen: true,
      teacherId: teacher.id,
      name: teacher.name || '',
      items: [],
      loading: true,
      error: ''
    })
    try {
      const careerValue = activeCareer || ''
      const usageRes = await fetch(`http://localhost:8001/teachers/${teacher.id}/usage?career=${encodeURIComponent(careerValue)}`)
      if (!usageRes.ok) {
        const errorData = await usageRes.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${usageRes.status}`)
      }
      const usageData = await usageRes.json()
      const infoItems = Array.isArray(usageData.affected_proposals_info)
        ? usageData.affected_proposals_info
        : []
      setTeacherDeleteModal(prev => ({
        ...prev,
        items: infoItems,
        loading: false,
        error: ''
      }))
    } catch (err) {
      setTeacherDeleteModal(prev => ({
        ...prev,
        items: [],
        loading: false,
        error: err.message || 'Error al consultar propuestas'
      }))
    }
  }

  const closeDeleteTeacherModal = () => {
    setTeacherDeleteModal({ isOpen: false, teacherId: null, name: '', items: [], loading: false, error: '' })
  }

  const confirmDeleteTeacher = async () => {
    if (!teacherDeleteModal.teacherId) {
      return
    }
    try {
      clearTeacherUsage()
      const careerValue = activeCareer || ''
      const res = await fetch(`http://localhost:8001/teachers/${teacherDeleteModal.teacherId}?career=${encodeURIComponent(careerValue)}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const result = await res.json().catch(() => ({}))
      if (Array.isArray(result.affected_proposal_ids) && result.affected_proposal_ids.length > 0) {
        setStatusMsg(`Docente eliminado. Propuestas afectadas: ${result.affected_proposal_ids.join(', ')}`)
      } else {
        setStatusMsg('Docente eliminado')
      }
      setStatusType('success')
      closeDeleteTeacherModal()
      if (activeCareer) {
        await fetchTeachers(activeCareer)
      }
      await fetchTeacherTotals()
    } catch (err) {
      setStatusMsg('Error al eliminar docente: ' + err.message)
      setStatusType('error')
    }
  }

  const getTeacherMatches = (query) => {
    const text = (query || '').trim().toLowerCase()
    if (!text || !Array.isArray(teacherCatalogItems) || teacherCatalogItems.length === 0) {
      return []
    }
    return teacherCatalogItems
      .filter((teacher) => {
        const name = (teacher.name || '').toLowerCase()
        const email = (teacher.email || '').toLowerCase()
        return name.includes(text) || email.includes(text)
      })
      .slice(0, 6)
  }

  const applyTeacherToDocente = (docId, teacher) => {
    const updated = equipoDocente.map(d =>
      d.id === docId
        ? {
          ...d,
          nombre: (teacher?.name || '').toUpperCase(),
          categoria: teacher?.category || 'AYUDANTE 1º',
          correo: teacher?.email || ''
        }
        : d
    )
    setEquipoDocente(updated)
    sortDocentes(updated)
    setIsDirty(true)
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const normalizeCareer = (value) => {
    if (!value) return ''
    const normalized = String(value).toLowerCase().trim()
    const found = careerOptions.find(opt => opt.toLowerCase().trim() === normalized)
    return found || String(value).trim()
  }

  const levelOptions = [
    { value: 0, label: 'Nulo' },
    { value: 1, label: 'Bajo' },
    { value: 2, label: 'Medio' },
    { value: 3, label: 'Alto' }
  ]

  const getLevelLabel = (value) => {
    const option = levelOptions.find((opt) => opt.value === Number(value))
    return option ? option.label : 'Nulo'
  }

  const normalizeLevelValue = (value) => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return Math.max(0, Math.min(3, value))
    const text = String(value).trim().toLowerCase()
    const match = levelOptions.find((opt) => opt.label.toLowerCase() === text)
    if (match) return match.value
    const numeric = Number(text)
    if (!Number.isNaN(numeric)) return Math.max(0, Math.min(3, numeric))
    return 0
  }

  const buildCompetencyText = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return ''
    return items
      .filter((item) => item && (item.code || item.description))
      .map((item) => {
        const code = (item.code || '').trim()
        const description = (item.description || '').trim()
        const levelLabel = getLevelLabel(item.level)
        if (code && description) return `${code} - ${description} - ${levelLabel}`
        if (description) return `${description} - ${levelLabel}`
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  const parseCompetenciesFromText = (text = '') => {
    if (!text || typeof text !== 'string') return []
    return text
      .split(/\r?\n/)
      .map((line, idx) => {
        const parts = line.split(' - ').map((part) => part.trim()).filter(Boolean)
        const code = parts[0] && /^[A-Za-z]+\d+/.test(parts[0]) ? parts[0] : ''
        const description = parts.length > 1 ? parts[1] : (code ? '' : parts[0] || '')
        const levelLabel = parts.length > 2 ? parts[2] : ''
        return {
          id: Date.now() + idx,
          code,
          description,
          level: normalizeLevelValue(levelLabel)
        }
      })
      .filter((item) => item.code || item.description)
  }

  const normalizeCompetencyItems = (items, fallbackText = '') => {
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item, idx) => ({
        id: item.id ?? Date.now() + idx,
        code: item.code || '',
        description: item.description || '',
        level: normalizeLevelValue(item.level ?? item.level_label)
      }))
    }
    return parseCompetenciesFromText(fallbackText)
  }

  const addCompetencyItem = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), code: '', description: '', level: 0 }]
    }))
    setIsDirty(true)
  }

  const updateCompetencyItem = (type, id, field, value) => {
    setFormData(prev => {
      const updated = prev[type].map(item => {
        if (item.id !== id) return item
        const next = { ...item, [field]: field === 'level' ? Number(value) : value }
        if (field === 'code' && value) {
          const catalogList = type === 'competenciasGenItems'
            ? careerCompetencies.generic
            : careerCompetencies.specific
          const match = catalogList.find((entry) => entry.code?.toLowerCase() === String(value).toLowerCase())
          if (match) {
            next.description = match.description || ''
          }
        }
        return next
      })
      return { ...prev, [type]: updated }
    })
    setIsDirty(true)
  }

  const deleteCompetencyItem = (type, id) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }))
    setIsDirty(true)
  }

  const autoResizeTextarea = (event) => {
    const el = event?.target
    if (!el || el.tagName !== 'TEXTAREA') {
      return
    }
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const isFormComplete = () => {
    return formData.carrera && formData.asignatura && formData.plan &&
           formData.ciclo && formData.cuatrimestre && formData.caracter &&
           formData.regimen && formData.contenidosMin && 
           (formData.competenciasGenItems && formData.competenciasGenItems.length > 0)
  }

  const isNonEmptyText = (value) => typeof value === 'string' && value.trim().length > 0

  const resetProposalForm = () => {
    setFormData({ ...emptyFormData, carrera: activeCareer || '' })
    setEquipoDocente([{ id: 1, teacherId: null, nombre: '', categoria: 'TITULAR', correo: '' }])
    setEditingProposalId(null)
    setEditingProposalStatus(null)
    setViewProposal(null)
    setIsDirty(false)
    setAiSection(null)
    setAiError('')
    setShowComparison(false)
    setComparisonData({ original: '', reformulated: '' })
    setComparisonTarget(null)
    setUnitDebug(null)
    setUnitBibliografiaRef({ basica: '', complementaria: '', preferencia: '' })
    setUnitBibliografiaDraft({ basica: '', complementaria: '', preferencia: '' })
    setShowUnitBibliografiaModal(false)
    setTpCommentRef('')
    setTpCommentDraft('')
    setShowTpCommentModal(false)
  }
  const hasNumberValue = (value) => value !== '' && value !== null && value !== undefined
  const getValidationErrors = () => {
    const errors = []
    
    // Campos básicos
    if (!isNonEmptyText(formData.carrera)) errors.push('Carrera')
    if (!isNonEmptyText(formData.asignatura)) errors.push('Asignatura')
    if (!isNonEmptyText(formData.plan)) errors.push('Plan')
    if (!isNonEmptyText(formData.anio)) errors.push('Año')
    if (!isNonEmptyText(formData.ciclo)) errors.push('Ciclo')
    if (!isNonEmptyText(formData.cuatrimestre)) errors.push('Cuatrimestre')
    if (!hasNumberValue(formData.hsTeo)) errors.push('Horas Teóricas')
    if (!hasNumberValue(formData.hsPrac)) errors.push('Horas Prácticas')
    
    // Sección Contenidos
    if (!isNonEmptyText(formData.contenidosMin)) errors.push('Contenidos Mínimos')
    if (!Array.isArray(formData.competenciasGenItems) || formData.competenciasGenItems.length === 0) {
      errors.push('Competencias Genéricas')
    } else {
      const incompletas = formData.competenciasGenItems.filter((comp) =>
        !isNonEmptyText(comp.code) || !isNonEmptyText(comp.description)
      )
      if (incompletas.length > 0) {
        errors.push(`Competencias Genéricas incompletas: ${incompletas.length}`)
      }
      const sinNivel = formData.competenciasGenItems.filter((comp) => normalizeLevelValue(comp.level) === 0)
      if (sinNivel.length > 0) {
        errors.push(`Competencias Genéricas sin nivel: ${sinNivel.length}`)
      }
    }
    if (Array.isArray(formData.competenciasEspItems) && formData.competenciasEspItems.length > 0) {
      const incompletas = formData.competenciasEspItems.filter((comp) =>
        !isNonEmptyText(comp.code) || !isNonEmptyText(comp.description)
      )
      if (incompletas.length > 0) {
        errors.push(`Competencias Específicas incompletas: ${incompletas.length}`)
      }
      const sinNivel = formData.competenciasEspItems.filter((comp) => normalizeLevelValue(comp.level) === 0)
      if (sinNivel.length > 0) {
        errors.push(`Competencias Específicas sin nivel: ${sinNivel.length}`)
      }
    }
    
    // Sección Fundamentación
    if (!isNonEmptyText(formData.fundamentosP1)) errors.push('Fundamentación P1')
    if (!isNonEmptyText(formData.fundamentosP2)) errors.push('Fundamentación P2')
    
    // Resultados de Aprendizaje
    if (formData.resultadosAprendizaje.length === 0) {
      errors.push('Resultados de Aprendizaje (al menos 1)')
    } else {
      const incompletos = formData.resultadosAprendizaje.filter((ra, idx) => {
        const hasDesc = isNonEmptyText(ra.descripcion)
        if (!hasDesc) {
          console.log(`RA ${idx + 1} incompleto: descripción vacía`)
        }
        return !hasDesc
      })
      if (incompletos.length > 0) {
        errors.push(`RA incompletos: ${incompletos.length} (falta descripción)`)
      }
    }
    
    // Unidades
    if (formData.unidades.length === 0) {
      errors.push('Unidades (al menos 1)')
    } else {
      const incompletas = formData.unidades.filter((u, idx) => {
        const MissingFields = []
        if (!isNonEmptyText(u.nombre)) MissingFields.push('nombre')
        if (!isNonEmptyText(u.contenidos)) MissingFields.push('contenidos')
        if (!isNonEmptyText(u.bibBasica)) MissingFields.push('bibBasica')
        // if (!isNonEmptyText(u.bibCompl)) MissingFields.push('bibCompl') - Bibliografía complementaria es opcional
        
        if (MissingFields.length > 0) {
          console.log(`Unidad ${idx + 1} incompleta:`, MissingFields.join(', '), '- Valores:', {
            nombre: u.nombre?.substring(0, 30),
            contenidos: u.contenidos?.substring(0, 30),
            bibBasica: u.bibBasica?.substring(0, 30),
            bibCompl: u.bibCompl?.substring(0, 30)
          })
        }
        return MissingFields.length > 0
      })
      if (incompletas.length > 0) {
        errors.push(`Unidades incompletas: ${incompletas.length} (ver consola para detalles)`)
      }
    }
    
    // Trabajos Prácticos
    if (formData.trabajosPracticos.length === 0) {
      errors.push('Trabajos Prácticos (al menos 1)')
    } else {
      const incompletos = formData.trabajosPracticos.filter(tp => 
        !isNonEmptyText(tp.nombre) || !Array.isArray(tp.raIds) || tp.raIds.length === 0 || 
        !isNonEmptyText(tp.actividades) || !isNonEmptyText(tp.materiales)
      )
      if (incompletos.length > 0) {
        errors.push(`TPs incompletos: ${incompletos.length} (falta nombre, RA vinculados, actividades o materiales)`)
      }
    }
    
    // Otras secciones
    if (!isNonEmptyText(formData.metodologia)) errors.push('Metodología')
    if (!isNonEmptyText(formData.evaluacion)) errors.push('Evaluación')
    if (!isNonEmptyText(formData.bibliografia)) errors.push('Bibliografía')
    // Observaciones es opcional
    
    // Equipo docente
    if (equipoDocente.length === 0) {
      errors.push('Equipo Docente (al menos 1)')
    } else {
      const incompletos = equipoDocente.filter(doc => 
        !isNonEmptyText(doc.nombre) || !isNonEmptyText(doc.correo)
      )
      if (incompletos.length > 0) {
        errors.push(`Docentes incompletos: ${incompletos.length} (falta nombre o correo)`)
      }
    }
    
    return errors
  }

  const isProposalReadyToCreate = () => {
    return getValidationErrors().length === 0
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
    setEquipoDocente([...equipoDocente, { id: newId, teacherId: null, nombre: '', categoria: 'AYUDANTE 1º', correo: '' }])
    setIsDirty(true)
  }

  const updateDocente = (id, field, value) => {
    const updated = equipoDocente.map(d => 
      d.id === id ? { ...d, [field]: field === 'nombre' ? value.toUpperCase() : value, ...(field === 'nombre' ? { teacherId: null } : {}) } : d
    )
    setEquipoDocente(updated)
    sortDocentes(updated)
    setIsDirty(true)
  }

  const selectDocenteSuggestion = (docenteId, teacher) => {
    const updated = equipoDocente.map(d =>
      d.id === docenteId
        ? {
            ...d,
            teacherId: teacher.id,
            nombre: teacher.name || '',
            categoria: teacher.category || d.categoria || 'AYUDANTE 1º',
            correo: teacher.email || ''
          }
        : d
    )
    setEquipoDocente(updated)
    sortDocentes(updated)
    setDocenteAutocompleteId(null)
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
      resultadosAprendizaje: [...prev.resultadosAprendizaje, { id: Date.now(), descripcion: '' }]
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
      trabajosPracticos: [...prev.trabajosPracticos, { id: Date.now(), numero: prev.trabajosPracticos.length + 1, nombre: '', raIds: [], actividades: '', materiales: '', ambito: '' }]
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

  const getTpObjectiveFromRaIds = (raIds) => {
    if (!Array.isArray(raIds) || raIds.length === 0) {
      return ''
    }
    const raMap = new Map((formData.resultadosAprendizaje || []).map((ra, idx) => [ra.id, { idx, ra }]))
    return raIds
      .map((id) => raMap.get(id))
      .filter(Boolean)
      .map(({ idx, ra }) => `RA ${idx + 1}: ${ra.descripcion || ra.verbo || ''}`.trim())
      .filter(Boolean)
      .join('\n')
  }

  const inferTpRaIdsFromObjective = (objectiveText) => {
    if (!isNonEmptyText(objectiveText)) {
      return []
    }
    const text = objectiveText.toLowerCase()
    return (formData.resultadosAprendizaje || [])
      .filter((ra) => isNonEmptyText(ra.descripcion) && text.includes(ra.descripcion.toLowerCase()))
      .map((ra) => ra.id)
  }

  const toggleTpRa = (tpId, raId) => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: prev.trabajosPracticos.map(tp => {
        if (tp.id !== tpId) {
          return tp
        }
        const current = Array.isArray(tp.raIds) ? tp.raIds : []
        const next = current.includes(raId)
          ? current.filter(id => id !== raId)
          : [...current, raId]
        return { ...tp, raIds: next }
      })
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

  const stripCodeFences = (text) => text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim()

  const extractJsonCandidate = (value) => {
    const arrayStart = value.indexOf('[')
    const arrayEnd = value.lastIndexOf(']')
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return value.slice(arrayStart, arrayEnd + 1)
    }
    const objStart = value.indexOf('{')
    const objEnd = value.lastIndexOf('}')
    if (objStart !== -1 && objEnd > objStart) {
      return value.slice(objStart, objEnd + 1)
    }
    return value
  }

  const normalizeUnitField = (value) => {
    if (!value) {
      return ''
    }
    return String(value)
      .replace(/^[\["']+/, '')
      .replace(/[\]"']+,?$/g, '')
      .trim()
  }

  const isNoiseLine = (value) => {
    const cleanedValue = String(value || '').trim()
    return !cleanedValue ||
      cleanedValue === '[' ||
      cleanedValue === ']' ||
      /^contenidos?$/i.test(cleanedValue) ||
      /^bibliograf/i.test(cleanedValue)
  }

  const parseUnitNamesFromText = (text, desiredCount) => {
    if (!text || typeof text !== 'string') {
      return []
    }
    const rawItems = text
      .split(/\r?\n|•/)
      .map(line => line.replace(/^[-*\d\s.)]+/, '').trim())
      .filter(Boolean)
      .map(line => line.replace(/^Unidad\s*\d+[:.-]?\s*/i, '').trim())

    const items = rawItems.length > 0
      ? rawItems
      : text.split(';').map(item => item.trim()).filter(Boolean)

    return items.slice(0, desiredCount)
  }

  const parseTpNamesFromText = (text, desiredCount) => {
    if (!text || typeof text !== 'string') {
      return []
    }
    const rawItems = text
      .split(/\r?\n|•/)
      .map(line => line.replace(/^[-*\d\s.)]+/, '').trim())
      .filter(Boolean)
      .map(line => line.replace(/^(TP|Trabajo\s+Practico)\s*\d+[:.-]?\s*/i, '').trim())

    const items = rawItems.length > 0
      ? rawItems
      : text.split(';').map(item => item.trim()).filter(Boolean)

    return items.slice(0, desiredCount)
  }

  const normalizeBibliographyLines = (text) => {
    if (!text || typeof text !== 'string') {
      return ''
    }
    const lines = text
      .split(/\r?\n|;\s*/)
      .map(line => line.trim())
      .filter(Boolean)
    return lines.join('\n')
  }

  const normalizeBibliographyValue = (value) => {
    if (!value) {
      return ''
    }
    const pickTextFromObject = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return ''
      }
      const candidates = ['text', 'item', 'reference', 'ref', 'cita', 'entry', 'value']
      for (const key of candidates) {
        if (typeof obj[key] === 'string' && obj[key].trim()) {
          return obj[key].trim()
        }
      }
      const values = Object.values(obj).map(val => (typeof val === 'string' ? val : '')).filter(Boolean)
      if (values.length > 0) {
        return values.join(' ')
      }
      return JSON.stringify(obj)
    }

    if (typeof value === 'string') {
      return normalizeBibliographyLines(value)
    }
    if (Array.isArray(value)) {
      const lines = value.map(item => (typeof item === 'string' ? item : pickTextFromObject(item))).filter(Boolean)
      return normalizeBibliographyLines(lines.join('\n'))
    }
    if (typeof value === 'object') {
      return normalizeBibliographyLines(pickTextFromObject(value))
    }
    return normalizeBibliographyLines(String(value))
  }

  const parseUnitsFromText = (text, desiredCount) => {
    if (!text || typeof text !== 'string') {
      return []
    }

    const cleaned = stripCodeFences(text)
    let units = []

    try {
      const parsed = JSON.parse(extractJsonCandidate(cleaned))
      const array = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed.unidades) ? parsed.unidades : [])

      units = array.map((u, idx) => {
        if (typeof u === 'string') {
          return {
            id: Date.now() + idx,
            nombre: normalizeUnitField(u),
            contenidos: '',
            bibBasica: '',
            bibCompl: ''
          }
        }
        return {
          id: Date.now() + idx,
          nombre: normalizeUnitField(u.nombre || u.name),
          contenidos: normalizeUnitField(u.contenidos || u.content),
          bibBasica: normalizeUnitField(u.bibBasica || u.bibliografia_basica || u.bibliography_basic),
          bibCompl: normalizeUnitField(u.bibCompl || u.bibliografia_complementaria || u.bibliography_complementary)
        }
      })
    } catch (err) {
      units = []
    }

    if (units.length === 0) {
      const blocks = cleaned
        .split(/(?=Unidad\s*\d+[:.-])/i)
        .map(block => block.trim())
        .filter(Boolean)

      units = blocks.map((block, idx) => {
        const nameMatch = block.match(/Nombre\s*:\s*(.+)/i)
        const contentMatch = block.match(/Contenidos?\s*:\s*([\s\S]*?)(Bibliograf[ií]a\s*Basica|Bibliograf[ií]a\s*Complementaria|$)/i)
        const basicMatch = block.match(/Bibliograf[ií]a\s*Basica\s*:\s*([\s\S]*?)(Bibliograf[ií]a\s*Complementaria|$)/i)
        const complMatch = block.match(/Bibliograf[ií]a\s*Complementaria\s*:\s*([\s\S]*?)$/i)

        const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
        const rawNameLine = (lines[0] || '')
          .replace(/^Unidad\s*\d+[:.-]?/i, '')
          .trim()
        const fallbackName = rawNameLine || (lines.find(line => !/^Unidad\s*\d+/i.test(line) && !isNoiseLine(line)) || '')

        const nombre = normalizeUnitField(nameMatch?.[1] || fallbackName) || `Unidad ${idx + 1}`
        return {
          id: Date.now() + idx,
          nombre,
          contenidos: normalizeUnitField(contentMatch?.[1] || ''),
          bibBasica: normalizeUnitField(basicMatch?.[1] || ''),
          bibCompl: normalizeUnitField(complMatch?.[1] || '')
        }
      })
    }

    return units.slice(0, desiredCount).filter(u => isNonEmptyText(u.nombre) || isNonEmptyText(u.contenidos))
  }

  const parseSingleUnitFromText = (text, fallbackName) => {
    if (!text || typeof text !== 'string') {
      return null
    }
    const cleaned = stripCodeFences(text)
    const unescapeJsonString = (value) => {
      if (!value) {
        return ''
      }
      const normalized = String(value).replace(/\r?\n/g, '\\n')
      try {
        return JSON.parse(`"${normalized.replace(/"/g, '\\"')}"`)
      } catch (err) {
        return String(value).trim()
      }
    }

    const parseLooseUnitFromJsonLike = (value) => {
      if (!value || typeof value !== 'string') {
        return null
      }
      const getBetween = (field, nextField) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*,\\s*"${nextField}"`, 'i')
        const match = value.match(regex)
        return match ? match[1] : null
      }
      const getLast = (field) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*}`, 'i')
        const match = value.match(regex)
        return match ? match[1] : null
      }

      const nombreRaw = getBetween('nombre', 'contenidos') || getBetween('name', 'contenidos')
      const contenidosRaw = getBetween('contenidos', 'bibBasica') || getBetween('content', 'bibBasica')
      const bibBasicaRaw = getBetween('bibBasica', 'bibCompl') || getBetween('bibliografia_basica', 'bibCompl') || getBetween('bibliography_basic', 'bibCompl')
      const bibComplRaw = getLast('bibCompl') || getLast('bibliografia_complementaria') || getLast('bibliography_complementary')

      if (!nombreRaw && !contenidosRaw && !bibBasicaRaw && !bibComplRaw) {
        return null
      }

      return {
        nombre: normalizeUnitField(unescapeJsonString(nombreRaw) || fallbackName),
        contenidos: normalizeUnitField(unescapeJsonString(contenidosRaw)),
        bibBasica: normalizeUnitField(unescapeJsonString(bibBasicaRaw)),
        bibCompl: normalizeUnitField(unescapeJsonString(bibComplRaw))
      }
    }
    try {
      const parsed = JSON.parse(extractJsonCandidate(cleaned))
      const unitObj = Array.isArray(parsed)
        ? parsed[0]
        : (parsed?.unidad || parsed)
      if (typeof unitObj === 'string') {
        return {
          nombre: normalizeUnitField(fallbackName) || 'Unidad',
          contenidos: normalizeUnitField(unitObj),
          bibBasica: '',
          bibCompl: ''
        }
      }
      return {
        nombre: normalizeUnitField(unitObj?.nombre || unitObj?.name || fallbackName),
        contenidos: normalizeUnitField(unitObj?.contenidos || unitObj?.content),
        bibBasica: normalizeUnitField(unitObj?.bibBasica || unitObj?.bibliografia_basica || unitObj?.bibliography_basic),
        bibCompl: normalizeUnitField(unitObj?.bibCompl || unitObj?.bibliografia_complementaria || unitObj?.bibliography_complementary)
      }
    } catch (err) {
      const looseParsed = parseLooseUnitFromJsonLike(cleaned)
      if (looseParsed) {
        return {
          nombre: looseParsed.nombre || normalizeUnitField(fallbackName) || 'Unidad',
          contenidos: looseParsed.contenidos || '',
          bibBasica: looseParsed.bibBasica || '',
          bibCompl: looseParsed.bibCompl || ''
        }
      }
      return {
        nombre: normalizeUnitField(fallbackName) || 'Unidad',
        contenidos: normalizeUnitField(cleaned),
        bibBasica: '',
        bibCompl: ''
      }
    }
  }

  const parseSinglePracticalFromText = (text, fallbackName) => {
    if (!text || typeof text !== 'string') {
      return null
    }
    const cleaned = stripCodeFences(text)
    const unescapeJsonString = (value) => {
      if (!value) {
        return ''
      }
      const normalized = String(value).replace(/\r?\n/g, '\\n')
      try {
        return JSON.parse(`"${normalized.replace(/"/g, '\\"')}"`)
      } catch (err) {
        return String(value).trim()
      }
    }

    const parseLoosePracticalFromJsonLike = (value) => {
      if (!value || typeof value !== 'string') {
        return null
      }
      const getBetween = (field, nextField) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*,\\s*"${nextField}"`, 'i')
        const match = value.match(regex)
        return match ? match[1] : null
      }
      const getLast = (field) => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*}`, 'i')
        const match = value.match(regex)
        return match ? match[1] : null
      }

      const numeroRaw = getBetween('numero', 'nombre') || getBetween('number', 'nombre') || getBetween('nro', 'nombre')
      const nombreRaw = getBetween('nombre', 'objetivo') || getBetween('name', 'objetivo')
      const objetivoRaw = getBetween('objetivo', 'actividades') || getBetween('objective', 'actividades')
      const actividadesRaw = getBetween('actividades', 'materiales') || getBetween('activities', 'materiales')
      const materialesRaw = getLast('materiales') || getLast('materials')
      const raMatch = value.match(/"raIndices"\s*:\s*\[([^\]]*)\]/i)
      const raIndices = raMatch
        ? raMatch[1].split(',').map(item => parseInt(item.trim(), 10)).filter(Number.isFinite)
        : []

      if (!nombreRaw && !objetivoRaw && !actividadesRaw && !materialesRaw && !numeroRaw) {
        return null
      }

      return {
        numero: normalizeUnitField(unescapeJsonString(numeroRaw)),
        nombre: normalizeUnitField(unescapeJsonString(nombreRaw) || fallbackName),
        objetivo: normalizeUnitField(unescapeJsonString(objetivoRaw)),
        actividades: normalizeUnitField(unescapeJsonString(actividadesRaw)),
        materiales: normalizeUnitField(unescapeJsonString(materialesRaw)),
        raIndices
      }
    }

    try {
      const parsed = JSON.parse(extractJsonCandidate(cleaned))
      const tpObj = Array.isArray(parsed)
        ? parsed[0]
        : (parsed?.tp || parsed?.practica || parsed)
      if (typeof tpObj === 'string') {
        return {
          numero: '',
          nombre: normalizeUnitField(fallbackName) || 'TP',
          objetivo: normalizeUnitField(tpObj),
          actividades: '',
          materiales: ''
        }
      }
      return {
        numero: normalizeUnitField(tpObj?.numero || tpObj?.number || tpObj?.nro),
        nombre: normalizeUnitField(tpObj?.nombre || tpObj?.name || fallbackName),
        objetivo: normalizeUnitField(tpObj?.objetivo || tpObj?.objective),
        actividades: normalizeUnitField(tpObj?.actividades || tpObj?.activities),
        materiales: normalizeUnitField(tpObj?.materiales || tpObj?.materials),
        raIndices: Array.isArray(tpObj?.raIndices) ? tpObj.raIndices : []
      }
    } catch (err) {
      const looseParsed = parseLoosePracticalFromJsonLike(cleaned)
      if (looseParsed) {
        return {
          numero: looseParsed.numero || '',
          nombre: looseParsed.nombre || normalizeUnitField(fallbackName) || 'TP',
          objetivo: looseParsed.objetivo || '',
          actividades: looseParsed.actividades || '',
          materiales: looseParsed.materiales || '',
          raIndices: Array.isArray(looseParsed.raIndices) ? looseParsed.raIndices : []
        }
      }
      return {
        numero: '',
        nombre: normalizeUnitField(fallbackName) || 'TP',
        objetivo: normalizeUnitField(cleaned),
        actividades: '',
        materiales: ''
      }
    }
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
    Competencias: ${buildCompetencyText(formData.competenciasGenItems)}, ${buildCompetencyText(formData.competenciasEspItems)}`

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
    if (!Array.isArray(formData.competenciasGenItems) || formData.competenciasGenItems.length === 0) {
      setStatusMsg('Completa Competencias Genéricas antes de generar RA')
      setStatusType('info')
      return
    }

    setAiError('')
    setAiLoading(true)
    setAiSection('Resultados de Aprendizaje')
    try {
      const prompt = `Genera ${remainingCount} resultados de aprendizaje adicionales para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nCompetencias genericas: ${buildCompetencyText(formData.competenciasGenItems)}\nCompetencias especificas: ${buildCompetencyText(formData.competenciasEspItems)}\n\nReglas de RA:\n- Centrado en el estudiante.\n- Verbo observable y evaluable.\n- Presente del indicativo.\n- Desempeno demostrable y medible.\n- No mezclar demasiadas capacidades en un solo RA.\n- Estructura: verbo en presente + objeto de conocimiento + contexto/condicion + criterio.\n\nRequisitos de salida:\n- Devuelve solo una lista con ${remainingCount} items.\n- Un item por linea.\n- Solo el texto de cada RA.\n- Sin titulos ni encabezados.`
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

  const getRaContextText = () => {
    const raList = (formData.resultadosAprendizaje || []).map((ra, idx) => {
      const verbo = isNonEmptyText(ra.verbo) ? `${ra.verbo} ` : ''
      const descripcion = isNonEmptyText(ra.descripcion) ? ra.descripcion : ''
      const text = `${verbo}${descripcion}`.trim()
      return text ? `RA ${idx + 1}: ${text}` : `RA ${idx + 1}: (sin descripcion)`
    })
    return raList.length > 0 ? raList.join('\n') : 'Sin RA cargados.'
  }

  const buildMethodologyPrompt = ({ baseContext, raText, mode, currentValue }) => {
    const commonRequirements = [
      '- Referir explicitamente a los RA por numero (RA 1, RA 2, etc.).',
      '- Describir el desarrollo de clases (teoricas, practicas, actividades y secuencia).',
      '- Explicar la articulacion entre unidades, actividades y RA.',
      '- Espanol claro y formal.',
      '- Sin titulos ni encabezados, solo el texto.'
    ].join('\n')

    if (mode === 'reformulate') {
      return `Reformula la metodologia manteniendo el sentido, pero asegurando que cumpla los requisitos.
\nContexto:\n${baseContext}\n\nResultados de aprendizaje:\n${raText}\n\nTexto a reformular:\n${currentValue}\n\nRequisitos:\n${commonRequirements}`
    }

    return `Escribe la metodologia de la asignatura.
\nContexto:\n${baseContext}\n\nResultados de aprendizaje:\n${raText}\n\nRequisitos:\n${commonRequirements}`
  }

  const buildEvaluationPrompt = ({ baseContext, mode, currentValue }) => {
    const commonRequirements = [
      '- Incluir dos parciales y un recuperatorio.',
      '- Indicar que los trabajos practicos son evaluables.',
      '- Incluir examen libre con instancia practica y teorica.',
      '- Explicitar rangos de nota: 0-3 libre, 4-6 regular, 7-8 promocion indirecta, 9-10 promocion directa.',
      '- Espanol claro y formal.',
      '- Sin titulos ni encabezados, solo el texto.'
    ].join('\n')

    if (mode === 'reformulate') {
      return `Reformula la evaluacion manteniendo el sentido, pero asegurando que cumpla los requisitos.
\nContexto:\n${baseContext}\n\nTexto a reformular:\n${currentValue}\n\nRequisitos:\n${commonRequirements}`
    }

    return `Escribe la evaluacion de la asignatura.
\nContexto:\n${baseContext}\n\nRequisitos:\n${commonRequirements}`
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

    if (target?.field === 'metodologia') {
      return buildMethodologyPrompt({ baseContext, raText: getRaContextText(), mode: 'generate' })
    }

    if (target?.field === 'evaluacion') {
      return buildEvaluationPrompt({ baseContext, mode: 'generate' })
    }

    return `Escribe el contenido para: ${label}.\n\nContexto:\n${baseContext}\n\nRequisitos:\n- Espanol claro y conciso.\n- No incluyas titulos ni encabezados, solo el texto.`
  }

  const getUnitContext = (unitId) => {
    const index = formData.unidades.findIndex(u => u.id === unitId)
    const unit = formData.unidades[index] || {}
    const previousUnits = formData.unidades.slice(0, Math.max(0, index)).map((u, idx) => (
      `Unidad ${idx + 1}: ${u.nombre || 'Sin nombre'}\nContenidos: ${u.contenidos || '-'}`
    ))
    return {
      unitName: unit.nombre || '',
      previousUnitsText: previousUnits.length > 0 ? previousUnits.join('\n\n') : ''
    }
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

      const unitContext = target?.type === 'unidad' ? getUnitContext(target.id) : { unitName: '', previousUnitsText: '' }
      const baseContext = [
        `Carrera: ${formData.carrera}`,
        `Asignatura: ${formData.asignatura}`,
        `Ano en la carrera: ${formData.ciclo}`,
        `Cuatrimestre: ${formData.cuatrimestre}`
      ].join('\n')
      const isMethodologyField = target?.field === 'metodologia'
      const isEvaluationField = target?.field === 'evaluacion'
      const isBibliographyField = target?.field === 'bibliografia'
      const prompt = hasContent
        ? (isBibliographyField
          ? `Formatea la bibliografia al estilo APA 7.\n\nTexto a reformular:\n${currentValue}\n\nRequisitos:\n- Una referencia por linea.\n- Conservar el contenido original sin inventar datos.\n- Si falta anio, usar "s.f.".\n- Mantener el idioma original.\n- No incluir encabezados ni explicaciones.`
          : (target?.type === 'ra'
            ? `${raRules}\n\nReformula el siguiente RA manteniendo el sentido.\nDevuelve solo el RA reformulado, sin encabezados ni explicaciones:\n${currentValue}`
            : (target?.type === 'unidad'
              ? `Reformula los contenidos de la unidad "${unitContext.unitName}" manteniendo el sentido y coherencia con las unidades anteriores.\n\nContexto:\nCarrera: ${formData.carrera}\nAsignatura: ${formData.asignatura}\nContenidos minimos: ${formData.contenidosMin}\n${unitContext.previousUnitsText ? `\nUnidades anteriores:\n${unitContext.previousUnitsText}` : ''}\n\nRequisitos:\n- Devuelve solo los contenidos reformulados.\n- Sin titulos ni bibliografia.`
              : (isMethodologyField
                ? buildMethodologyPrompt({ baseContext, raText: getRaContextText(), mode: 'reformulate', currentValue })
                : (isEvaluationField
                  ? buildEvaluationPrompt({ baseContext, mode: 'reformulate', currentValue })
                  : currentValue)))))
        : (target?.type === 'ra'
          ? `Genera un resultado de aprendizaje para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nCompetencias genericas: ${buildCompetencyText(formData.competenciasGenItems)}\nCompetencias especificas: ${buildCompetencyText(formData.competenciasEspItems)}\n\n${raRules}\n\nRequisitos:\n- Un solo RA.\n- Solo el texto del RA.\n- Sin titulos ni encabezados.`
          : (target?.type === 'unidad'
            ? `Escribe los contenidos de la unidad "${unitContext.unitName}" en funcion de los contenidos minimos y manteniendo coherencia con las unidades anteriores.\n\nContexto:\nCarrera: ${formData.carrera}\nAsignatura: ${formData.asignatura}\nContenidos minimos: ${formData.contenidosMin}\n${unitContext.previousUnitsText ? `\nUnidades anteriores:\n${unitContext.previousUnitsText}` : ''}\n\nRequisitos:\n- Devuelve solo los contenidos.\n- Sin titulos ni bibliografia.`
            : buildAiPrompt(label || target.field || 'contenido', target)))
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
    } else if (comparisonTarget.type === 'unidad') {
      updateUnidad(comparisonTarget.id, comparisonTarget.field, comparisonData.reformulated)
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

  const openUnitBibliografiaModal = () => {
    const fallbackFromForm = parseBibliographySection(formData.bibliografia)
    setUnitBibliografiaDraft({
      basica: unitBibliografiaRef.basica || fallbackFromForm.basica || '',
      complementaria: unitBibliografiaRef.complementaria || fallbackFromForm.complementaria || '',
      preferencia: unitBibliografiaRef.preferencia || ''
    })
    setShowUnitBibliografiaModal(true)
  }

  const parseBibliographySection = (text) => {
    if (!text || typeof text !== 'string') {
      return { basica: '', complementaria: '' }
    }
    const cleaned = text.trim()
    const basicaMatch = cleaned.match(/Bibliograf[ií]a\s*basica\s*\(APA\)?:?\s*([\s\S]*?)(Bibliograf[ií]a\s*complementaria|$)/i)
    const complementariaMatch = cleaned.match(/Bibliograf[ií]a\s*complementaria\s*\(APA\)?:?\s*([\s\S]*?)$/i)
    const basica = normalizeBibliographyLines(basicaMatch?.[1] || '')
    const complementaria = normalizeBibliographyLines(complementariaMatch?.[1] || '')

    if (!basica && !complementaria) {
      return { basica: normalizeBibliographyLines(cleaned), complementaria: '' }
    }

    return { basica, complementaria }
  }

  const confirmUnitBibliografiaModal = async () => {
    const basica = unitBibliografiaDraft.basica.trim()
    const complementaria = unitBibliografiaDraft.complementaria.trim()
    const preferencia = unitBibliografiaDraft.preferencia.trim()

    if (!basica && !complementaria) {
      setStatusMsg('Completa bibliografia basica o complementaria para generar unidades')
      setStatusType('info')
      return
    }

    setUnitBibliografiaRef({ basica, complementaria, preferencia })
    setShowUnitBibliografiaModal(false)
    await generateUnitsFromContents({ basica, complementaria, preferencia })
  }

  const cancelUnitBibliografiaModal = () => {
    setShowUnitBibliografiaModal(false)
  }

  const handleGenerateUnitsClick = () => {
    if (!isNonEmptyText(formData.contenidosMin)) {
      setStatusMsg('Completa Contenidos Minimos antes de generar unidades')
      setStatusType('info')
      return
    }
    if (!isNonEmptyText(formData.carrera) || !isNonEmptyText(formData.asignatura)) {
      setStatusMsg('Completa Carrera y Asignatura antes de generar unidades')
      setStatusType('info')
      return
    }
    openUnitBibliografiaModal()
  }

  const openTpCommentModal = () => {
    setTpCommentDraft(tpCommentRef || '')
    setShowTpCommentModal(true)
  }

  const confirmTpCommentModal = async () => {
    const trimmed = tpCommentDraft.trim()
    setTpCommentRef(trimmed)
    setShowTpCommentModal(false)
    await generatePracticalsFromUnits(trimmed)
  }

  const cancelTpCommentModal = () => {
    setShowTpCommentModal(false)
  }

  const handleGeneratePracticalsClick = () => {
    if (!isNonEmptyText(formData.carrera) || !isNonEmptyText(formData.asignatura)) {
      setStatusMsg('Completa Carrera y Asignatura antes de generar TP')
      setStatusType('info')
      return
    }
    if (formData.unidades.length === 0) {
      setStatusMsg('Carga o genera unidades antes de generar TP')
      setStatusType('info')
      return
    }
    if (formData.resultadosAprendizaje.length === 0) {
      setStatusMsg('Carga resultados de aprendizaje antes de generar TP')
      setStatusType('info')
      return
    }
    openTpCommentModal()
  }

  const parseBibliographyListFromText = (text) => {
    if (!text || typeof text !== 'string') {
      return null
    }
    const cleaned = stripCodeFences(text)
    try {
      const parsed = JSON.parse(cleaned)
      const items = parsed.items || parsed.bibliografia || parsed.bibliography || parsed
      return normalizeBibliographyValue(items)
    } catch (err) {
      return null
    }
  }

  const formatBibliographyApaList = async (label, bibliographyRef) => {
    if (!isNonEmptyText(bibliographyRef)) {
      return ''
    }

    const prompt = `Convierte la siguiente bibliografia ${label} a normas APA.\n\nBibliografia:\n${bibliographyRef}\n\nRequisitos de salida:\n- Devuelve solo un JSON valido, sin texto extra.\n- Formato: {"items":"..."}\n- Una referencia por linea.\n- No inventes referencias nuevas.`

    try {
      const res = await fetch('http://localhost:8001/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!res.ok) {
        return null
      }
      const data = await res.json()
      if (data.status !== 'success') {
        return null
      }
      const parsed = parseBibliographyListFromText(data.content)
      if (!parsed) {
        return null
      }

      return normalizeBibliographyLines(parsed)
    } catch (err) {
      return null
    }
  }

  const generateUnitsFromContents = async (bibliographyData) => {
    if (!isNonEmptyText(formData.contenidosMin)) {
      setStatusMsg('Completa Contenidos Minimos antes de generar unidades')
      setStatusType('info')
      return
    }
    if (!isNonEmptyText(formData.carrera) || !isNonEmptyText(formData.asignatura)) {
      setStatusMsg('Completa Carrera y Asignatura antes de generar unidades')
      setStatusType('info')
      return
    }

    const count = Math.max(1, Math.min(12, parseInt(unitBatchCount, 10) || 1))
    if (formData.unidades.length > 0) {
      const confirmReplace = window.confirm('Ya existen unidades cargadas. Deseas reemplazarlas por las generadas con IA?')
      if (!confirmReplace) {
        return
      }
    }

    const basicaInput = normalizeBibliographyLines(bibliographyData?.basica || '')
    const complementariaInput = normalizeBibliographyLines(bibliographyData?.complementaria || '')
    const preferenciaInput = String(bibliographyData?.preferencia || '').trim()

    if (!isNonEmptyText(basicaInput) && !isNonEmptyText(complementariaInput)) {
      setStatusMsg('Se requiere bibliografia de referencia para generar unidades')
      setStatusType('info')
      return
    }

    setAiError('')
    setAiLoading(true)
    const debugSteps = []
    const debugAt = new Date().toISOString()
    const pushDebug = (step) => {
      debugSteps.push(step)
      setUnitDebug({ at: debugAt, steps: [...debugSteps] })
    }
    setAiSection('Unidades - nombres')
    try {
      const basicaApa = await formatBibliographyApaList('basica', basicaInput)
      const complementariaApa = await formatBibliographyApaList('complementaria', complementariaInput)
      const basicaFinal = normalizeBibliographyValue(basicaApa || basicaInput)
      const complementariaFinal = normalizeBibliographyValue(complementariaApa || complementariaInput)
      const bibliographyForUnits = `Basica (APA):\n${basicaFinal}\n\nComplementaria (APA):\n${complementariaFinal}`
      const basicaLines = normalizeBibliographyLines(basicaFinal)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
      const complementariaLines = normalizeBibliographyLines(complementariaFinal)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)

      setFormData(prev => ({
        ...prev,
        bibliografia: `Bibliografia basica (APA):\n${basicaFinal}\n\nBibliografia complementaria (APA):\n${complementariaFinal}`
      }))
      setIsDirty(true)

      const namesPrompt = `Genera ${count} nombres de unidades para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nContenidos minimos (debes distribuirlos sin repetir):\n${formData.contenidosMin}\n\nRequisitos de salida:\n- Devuelve solo una lista con ${count} items.\n- Un nombre por linea.\n- Sin JSON, sin encabezados.`

      const namesRes = await fetch('http://localhost:8001/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: namesPrompt })
      })
      if (!namesRes.ok) {
        const errorData = await namesRes.json().catch(() => ({ detail: 'Error desconocido' }))
        pushDebug({ label: 'Nombres de unidades', prompt: namesPrompt, response: JSON.stringify(errorData, null, 2), cleaned: '' })
        throw new Error(errorData.detail || `Error ${namesRes.status}`)
      }
      const namesData = await namesRes.json()
      if (namesData.status !== 'success') {
        pushDebug({ label: 'Nombres de unidades', prompt: namesPrompt, response: JSON.stringify(namesData, null, 2), cleaned: '' })
        throw new Error(namesData.detail || 'Respuesta invalida del servidor')
      }

      const namesCleaned = sanitizeAiOutput(namesData.content)
      pushDebug({
        label: 'Nombres de unidades',
        prompt: namesPrompt,
        response: typeof namesData.content === 'string' ? namesData.content : JSON.stringify(namesData.content, null, 2),
        cleaned: namesCleaned
      })

      let unitNames = parseUnitNamesFromText(namesCleaned, count)
      if (unitNames.length < count) {
        const missing = count - unitNames.length
        const placeholders = Array.from({ length: missing }, (_, idx) => `Unidad ${unitNames.length + idx + 1}`)
        unitNames = [...unitNames, ...placeholders]
        setStatusMsg(`Solo se recibieron ${count - missing} nombres. Se completaron ${missing} con placeholders.`)
        setStatusType('info')
      }

      const generatedUnits = []
      const suspiciousUnits = []
      for (let i = 0; i < unitNames.length; i += 1) {
        const unitName = unitNames[i]
        const previousUnits = generatedUnits.map((u, idx) => (
          `Unidad ${idx + 1}: ${u.nombre}\nContenidos: ${u.contenidos || '-'}`
        )).join('\n\n')
        const unitPrompt = `Escribe los contenidos y bibliografia de la unidad "${unitName}" en funcion de los contenidos minimos y manteniendo coherencia con las unidades anteriores.\n\nContenidos minimos (debes distribuirlos sin repetir):\n${formData.contenidosMin}\n\nBibliografia de referencia (usa y asigna en basica y complementaria para la unidad, en APA):\n${bibliographyForUnits}\n\n${preferenciaInput ? `Preferencias del docente para el orden/énfasis:\n${preferenciaInput}\n\n` : ''}${previousUnits ? `Unidades anteriores:\n${previousUnits}\n\n` : ''}Requisitos de salida:\n- Devuelve solo un JSON valido, sin texto extra.\n- Formato: {"nombre":"...","contenidos":"...","bibBasica":"...","bibCompl":"..."}.\n- Incluye al menos 2 referencias en bibBasica y 1 en bibCompl.\n- No inventes referencias nuevas, solo usa las provistas.\n- No mezcles ni cambies la categoria basica/complementaria.\n- Sin encabezados.`

        setAiSection(`Unidad ${i + 1}/${unitNames.length}`)
        const unitRes = await fetch('http://localhost:8001/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: unitPrompt })
        })
        if (!unitRes.ok) {
          const errorData = await unitRes.json().catch(() => ({ detail: 'Error desconocido' }))
          pushDebug({ label: `Unidad ${i + 1}`, prompt: unitPrompt, response: JSON.stringify(errorData, null, 2), cleaned: '' })
          throw new Error(errorData.detail || `Error ${unitRes.status}`)
        }
        const unitData = await unitRes.json()
        if (unitData.status !== 'success') {
          pushDebug({ label: `Unidad ${i + 1}`, prompt: unitPrompt, response: JSON.stringify(unitData, null, 2), cleaned: '' })
          throw new Error(unitData.detail || 'Respuesta invalida del servidor')
        }
        const unitCleaned = sanitizeAiOutput(unitData.content)
        pushDebug({
          label: `Unidad ${i + 1}`,
          prompt: unitPrompt,
          response: typeof unitData.content === 'string' ? unitData.content : JSON.stringify(unitData.content, null, 2),
          cleaned: unitCleaned
        })
        let parsedUnit = parseSingleUnitFromText(unitCleaned, unitName) || {
          nombre: unitName,
          contenidos: unitCleaned,
          bibBasica: '',
          bibCompl: ''
        }
        if (parsedUnit?.contenidos && typeof parsedUnit.contenidos === 'string') {
          const contentText = parsedUnit.contenidos
          const looksLikeJson = contentText.includes('"nombre"') && contentText.includes('"bibBasica"')
          if (looksLikeJson) {
            const reparsed = parseSingleUnitFromText(contentText, parsedUnit.nombre || unitName)
            if (reparsed && isNonEmptyText(reparsed.contenidos)) {
              parsedUnit = {
                ...parsedUnit,
                ...reparsed
              }
            }
          }
        }
        const bibBasicaFinal = isNonEmptyText(parsedUnit.bibBasica)
          ? normalizeBibliographyLines(parsedUnit.bibBasica)
          : basicaLines.slice(i * 2, i * 2 + 2).join('\n')
        const bibComplFinal = isNonEmptyText(parsedUnit.bibCompl)
          ? normalizeBibliographyLines(parsedUnit.bibCompl)
          : complementariaLines.slice(i, i + 1).join('\n')
        generatedUnits.push({
          id: Date.now() + i,
          nombre: parsedUnit.nombre || unitName,
          contenidos: parsedUnit.contenidos || '',
          bibBasica: bibBasicaFinal,
          bibCompl: bibComplFinal
        })
        if (parsedUnit?.contenidos && typeof parsedUnit.contenidos === 'string') {
          const contentText = parsedUnit.contenidos
          const looksLikeJson = contentText.trim().startsWith('{') && contentText.includes('"bibBasica"')
          if (looksLikeJson) {
            suspiciousUnits.push(i + 1)
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        unidades: generatedUnits
      }))
      setIsDirty(true)
      if (suspiciousUnits.length > 0) {
        setStatusMsg(`Se generaron ${generatedUnits.length} unidades, pero revisa las unidades: ${suspiciousUnits.join(', ')}`)
        setStatusType('info')
      } else {
        setStatusMsg(`Se generaron ${generatedUnits.length} unidades`)
        setStatusType('success')
      }
    } catch (err) {
      const errorMsg = `Error al generar unidades con IA: ${err.message}`
      setStatusMsg(errorMsg)
      setStatusType('error')
      setAiError(errorMsg)
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const generatePracticalsFromUnits = async (tpComment = '') => {
    const count = Math.max(1, Math.min(12, parseInt(tpBatchCount, 10) || 1))
    if (formData.trabajosPracticos.length > 0) {
      const confirmReplace = window.confirm('Ya existen trabajos practicos cargados. Deseas reemplazarlos por los generados con IA?')
      if (!confirmReplace) {
        return
      }
    }

    const raList = formData.resultadosAprendizaje
      .map((ra, idx) => `RA ${idx + 1}: ${ra.descripcion || ra.verbo || ''}`)
      .filter(line => isNonEmptyText(line))
      .join('\n')

    const allRaIds = (formData.resultadosAprendizaje || []).map(ra => ra.id)

    const unitsList = formData.unidades
      .map((u, idx) => `Unidad ${idx + 1}: ${u.nombre || 'Sin nombre'}\nContenidos: ${u.contenidos || '-'}`)
      .join('\n\n')
    setAiError('')
    setAiLoading(true)
    setAiSection('TP - nombres')
    try {
      const namesPrompt = `Genera ${count} nombres de trabajos practicos para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nUnidades desarrolladas:\n${unitsList}\n\nResultados de aprendizaje:\n${raList}\n\n${tpComment ? `Comentario del docente (obligatorio, debes seguirlo):\n${tpComment}\n\n` : ''}Requisitos de salida:\n- Devuelve solo una lista con ${count} items.\n- Un nombre por linea.\n- Sin JSON, sin encabezados.\n- Los nombres deben reflejar el comentario del docente.`

      const namesRes = await fetch('http://localhost:8001/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: namesPrompt })
      })
      if (!namesRes.ok) {
        const errorData = await namesRes.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${namesRes.status}`)
      }
      const namesData = await namesRes.json()
      if (namesData.status !== 'success') {
        throw new Error(namesData.detail || 'Respuesta invalida del servidor')
      }

      const namesCleaned = sanitizeAiOutput(namesData.content)
      let tpNames = parseTpNamesFromText(namesCleaned, count)
      if (tpNames.length < count) {
        const missing = count - tpNames.length
        const placeholders = Array.from({ length: missing }, (_, idx) => `Trabajo Practico ${tpNames.length + idx + 1}`)
        tpNames = [...tpNames, ...placeholders]
        setStatusMsg(`Solo se recibieron ${count - missing} nombres. Se completaron ${missing} con placeholders.`)
        setStatusType('info')
      }

      const generated = []
      for (let i = 0; i < tpNames.length; i += 1) {
        const tpNumber = i + 1
        const tpName = tpNames[i]
        const previousTps = generated.map(tp => `TP ${tp.numero || ''}: ${tp.nombre || 'Sin nombre'}`).join('\n')
        const tpPrompt = `Genera el Trabajo Practico ${tpNumber} ("${tpName}") para la asignatura ${formData.asignatura} de la carrera ${formData.carrera}.\n\nUnidades desarrolladas:\n${unitsList}\n\nResultados de aprendizaje (deben cubrirse sin modificar el texto):\n${raList}\n\n${tpComment ? `Comentario del docente (obligatorio, debes seguirlo):\n${tpComment}\n\n` : ''}${previousTps ? `TP anteriores:\n${previousTps}\n\n` : ''}Requisitos de salida:\n- Devuelve solo un JSON valido, sin texto extra.\n- Formato: {\"numero\":\"${tpNumber}\",\"nombre\":\"${tpName}\",\"objetivo\":\"...\",\"actividades\":\"...\",\"materiales\":\"...\",\"raIndices\":[1,2]}.\n- El objetivo debe incluir literalmente los RA usados (sin cambiarlos).\n- Actividades deben cubrir el objetivo y respetar el comentario del docente.\n- Materiales en lista separada por lineas.\n- raIndices debe contener los numeros de RA usados.\n- No incluyas ambito.`

        setAiSection(`TP ${tpNumber}/${tpNames.length}`)
        const tpRes = await fetch('http://localhost:8001/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: tpPrompt })
        })
        if (!tpRes.ok) {
          const errorData = await tpRes.json().catch(() => ({ detail: 'Error desconocido' }))
          throw new Error(errorData.detail || `Error ${tpRes.status}`)
        }
        const tpData = await tpRes.json()
        if (tpData.status !== 'success') {
          throw new Error(tpData.detail || 'Respuesta invalida del servidor')
        }
        const tpCleaned = sanitizeAiOutput(tpData.content)
        const parsedTp = parseSinglePracticalFromText(tpCleaned, tpName) || {
          numero: String(tpNumber),
          nombre: tpName,
          objetivo: tpCleaned,
          actividades: '',
          materiales: ''
        }
        let actividades = parsedTp.actividades || ''
        let materiales = parsedTp.materiales || ''
        if (!isNonEmptyText(actividades) || !isNonEmptyText(materiales)) {
          const fillPrompt = `Completa actividades y materiales para el TP ${tpNumber} sin cambiar el objetivo.\n\nObjetivo:\n${parsedTp.objetivo}\n\nRequisitos de salida:\n- Devuelve solo un JSON valido, sin texto extra.\n- Formato: {\"actividades\":\"...\",\"materiales\":\"...\"}.\n- Materiales en lista separada por lineas.`
          const fillRes = await fetch('http://localhost:8001/ai-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fillPrompt })
          })
          if (fillRes.ok) {
            const fillData = await fillRes.json().catch(() => null)
            if (fillData && fillData.status === 'success') {
              const fillCleaned = sanitizeAiOutput(fillData.content)
              const fillParsed = parseSinglePracticalFromText(fillCleaned, tpName)
              actividades = actividades || fillParsed?.actividades || ''
              materiales = materiales || fillParsed?.materiales || ''
            }
          }
        }
        const raIndices = Array.isArray(parsedTp.raIndices) ? parsedTp.raIndices : []
        const selectedRaIds = raIndices.length > 0
          ? raIndices
            .map((idx) => formData.resultadosAprendizaje[idx - 1]?.id)
            .filter(Boolean)
          : allRaIds
        generated.push({
          id: Date.now() + i,
          numero: parsedTp.numero || String(tpNumber),
          nombre: parsedTp.nombre || tpName,
          raIds: selectedRaIds,
          objetivo: parsedTp.objetivo || '',
          actividades,
          materiales,
          ambito: ''
        })
      }

      setFormData(prev => ({
        ...prev,
        trabajosPracticos: generated
      }))
      setIsDirty(true)
      setStatusMsg(`Se generaron ${generated.length} trabajos practicos`)
      setStatusType('success')
    } catch (err) {
      const errorMsg = `Error al generar TP con IA: ${err.message}`
      setStatusMsg(errorMsg)
      setStatusType('error')
      setAiError(errorMsg)
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const saveProposal = async ({ silent = false } = {}) => {
    const isEditing = !!editingProposalId
    const careerValue = formData.carrera || activeCareer
    if (isDocenteView && !isEditing) {
      if (!silent) {
        setStatusMsg('La vista Docente no puede crear propuestas nuevas')
        setStatusType('error')
      }
      return
    }
    // Validate required fields: carrera and asignatura only
    if (!careerValue || !formData.asignatura) {
      if (!silent) {
        setStatusMsg('Requiere al menos: Carrera y Asignatura')
        setStatusType('error')
      }
      return
    }

    if (isSaving) {
      return
    }

    // Status logic: preserve "Creada" and "Importada", only compute for new or "EnProceso"
    const computedStatus = isEditing
      ? (editingProposalStatus === 'Importada' || editingProposalStatus === 'Creada'
          ? editingProposalStatus
          : (isProposalReadyToCreate() ? 'Creada' : 'EnProceso'))
      : (isProposalReadyToCreate() ? 'Creada' : 'EnProceso')

    const payload = {
      title: formData.asignatura,
      career: careerValue,
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
      generic_competencies: buildCompetencyText(formData.competenciasGenItems),
      specific_competencies: buildCompetencyText(formData.competenciasEspItems),
      generic_competencies_items: (formData.competenciasGenItems || []).map((item) => ({
        code: item.code || '',
        description: item.description || '',
        level: normalizeLevelValue(item.level)
      })),
      specific_competencies_items: (formData.competenciasEspItems || []).map((item) => ({
        code: item.code || '',
        description: item.description || '',
        level: normalizeLevelValue(item.level)
      })),
      fundamentals_part1: formData.fundamentosP1,
      fundamentals_part2: formData.fundamentosP2,
      learning_outcomes: (formData.resultadosAprendizaje || []).map(ra => ({
        id: ra.id,
        description: ra.descripcion || '',
        observable_verb: ''
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
        number: tp.numero || '',
        name: tp.nombre || '',
        objective: getTpObjectiveFromRaIds(tp.raIds) || tp.objetivo || '',
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
        id: doc.teacherId || null,
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
        setStatusMsg(isEditing ? `Propuesta actualizada - ID: ${data.id}` : 'Borrador guardado - ID: ' + data.id)
        setStatusType('success')
      } else {
        setStatusMsg('Guardado automatico')
        setStatusType('info')
      }
      if (!isEditing) {
        // Instead of resetting, switch to edit mode for the newly created proposal
        setEditingProposalId(data.id)
        setEditingProposalStatus(data.status)
      } else {
        // Update status when editing to reflect the saved status
        setEditingProposalStatus(data.status)
      }
      // Reload proposals list
      fetchProposals()
      if (activeCareer) {
        fetchTeachers(activeCareer)
      }
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
      if (isDocenteView && hasSelectedTeacher && !proposalHasTeacher(data, selectedTeacherId, selectedTeacherName)) {
        setStatusMsg('La vista Docente solo puede editar propuestas propias')
        setStatusType('error')
        return
      }
      const loadedRaList = (data.learning_outcomes || []).map((ra, idx) => ({
        id: ra.id ?? Date.now() + idx,
        descripcion: ra.description || ''
      }))
      const mapRaCodesToIds = (raCodes, raList) => {
        if (!Array.isArray(raCodes) || raCodes.length === 0) {
          return []
        }
        const ids = []
        raCodes.forEach((code) => {
          const match = String(code).match(/RA\s*(\d+)/i)
          if (!match) {
            return
          }
          const idx = parseInt(match[1], 10) - 1
          if (idx >= 0 && idx < raList.length) {
            ids.push(raList[idx].id)
          }
        })
        return ids
      }
      const inferRaIdsFromObjectiveText = (objectiveText) => {
        if (!objectiveText || typeof objectiveText !== 'string') {
          return []
        }
        const text = objectiveText.toLowerCase()
        return loadedRaList
          .filter((ra) => ra.descripcion && text.includes(ra.descripcion.toLowerCase()))
          .map((ra) => ra.id)
      }
      const specificFallback = data.specific_competencies && data.specific_competencies !== 'No Aplica'
        ? data.specific_competencies
        : ''
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
        competenciasGenItems: normalizeCompetencyItems(data.generic_competencies_items, data.generic_competencies),
        competenciasEspItems: normalizeCompetencyItems(data.specific_competencies_items, specificFallback),
        fundamentosP1: data.fundamentals_part1 || '',
        fundamentosP2: data.fundamentals_part2 || '',
        resultadosAprendizaje: loadedRaList,
        unidades: (data.units || []).map((u, idx) => ({
          id: u.id ?? Date.now() + idx,
          nombre: u.name || '',
          contenidos: u.content || '',
          bibBasica: u.bibliography_basic || '',
          bibCompl: u.bibliography_complementary || ''
        })),
        trabajosPracticos: (data.practicals || []).map((tp, idx) => ({
          id: tp.id ?? Date.now() + idx,
          numero: tp.number || tp.numero || String(idx + 1),
          nombre: tp.name || '',
          raIds: mapRaCodesToIds(tp.ra_codes, loadedRaList).length > 0
            ? mapRaCodesToIds(tp.ra_codes, loadedRaList)
            : inferRaIdsFromObjectiveText(tp.objective || ''),
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
          id: Date.now() + idx,
          teacherId: doc.id ?? null,
          nombre: doc.name || '',
          categoria: doc.category || 'AYUDANTE 1º',
          correo: doc.email || ''
        })))
      } else {
        setEquipoDocente([{ id: 1, teacherId: null, nombre: '', categoria: 'TITULAR', correo: '' }])
      }
      setEditingProposalId(proposalId)
      setEditingProposalStatus(data.status || null)
      setIsDirty(false)
      if (data.career) {
        setActiveCareer(normalizeCareer(data.career))
      }
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
      if (isDocenteView && hasSelectedTeacher && !proposalHasTeacher(data, selectedTeacherId, selectedTeacherName)) {
        setStatusMsg('La vista Docente solo puede ver propuestas propias')
        setStatusType('error')
        return
      }
      setViewProposal(data)
      if (data.career) {
        setActiveCareer(normalizeCareer(data.career))
      }
    } catch (err) {
      setStatusMsg('Error al cargar propuesta: ' + err.message)
      setStatusType('error')
    }
  }

  const deleteProposal = async (proposalId) => {
    if (isDocenteView) {
      setStatusMsg('La vista Docente no puede eliminar propuestas')
      setStatusType('error')
      return
    }
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

  const downloadProposalDocx = async (proposalId) => {
    try {
      setStatusMsg('Generando documento...')
      setStatusType('info')
      
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/docx`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      
      // Extract filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition')
      let filename = `Propuesta_${proposalId}.docx` // default fallback
      if (disposition && disposition.includes('filename*=utf-8\'\'')) {
        const filenameMatch = disposition.match(/filename\*=utf-8''(.+)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1])
        }
      } else if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="?(.+?)"?$/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setStatusMsg(`Propuesta #${proposalId} descargada`)
      setStatusType('success')
    } catch (err) {
      const msg = err.message === 'Failed to fetch' 
        ? 'No hay conexión con el Backend (8001)' 
        : err.message
      setStatusMsg('Error al descargar: ' + msg)
      setStatusType('error')
      console.error('Download error:', err)
    }
  }

  const handleImportDocxFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
    setImportLoading(true)
    setImportError('')
    setImportPreview(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('http://localhost:8001/proposals/import-docx', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      
      const result = await res.json()
      if (result.success) {
        setImportPreview(result)
        setStatusMsg('Archivo importado exitosamente')
        setStatusType('success')
      } else {
        throw new Error(result.error || 'Error desconocido')
      }
    } catch (err) {
      const msg = err.message === 'Failed to fetch' 
        ? 'No hay conexión con el Backend (8001)' 
        : err.message
      setImportError('Error al importar: ' + msg)
      setStatusMsg(setImportError)
      setStatusType('error')
      console.error('Import error:', err)
    } finally {
      setImportLoading(false)
    }
  }

  const handleLoadImportedProposal = () => {
    if (!importPreview?.data) return
    
    const data = importPreview.data
    
    const normalizedCareer = normalizeCareer(data.career)
    
    const buildBibliografiaGlobal = (data) => {
      if (data.bibliography) {
        return data.bibliography
      }
      if (!data.bibliography_basic && !data.bibliography_complementary) {
        return ''
      }
      let merged = ''
      if (data.bibliography_basic) {
        merged = data.bibliography_basic
      }
      if (data.bibliography_complementary) {
        merged = (merged ? `${merged}\n\n` : '') + `Bibliografia complementaria:\n${data.bibliography_complementary}`
      }
      return merged
    }

    const normalizeQuarterSelection = (value) => {
      const normalized = String(value || '').toLowerCase()
      if (!normalized) return ''
      if (normalized.includes('anual') || normalized.trim() === 'a') return 'Anual'
      if (normalized.includes('1') || normalized.includes('primer')) return '1er Cuatrimestre'
      if (normalized.includes('2') || normalized.includes('segundo')) return '2do Cuatrimestre'
      return value
    }
    
    // Helper para convertir array de RAs a formato esperado
    const raListToArray = (raArray) => {
      if (!Array.isArray(raArray)) return []
      return raArray.map((ra, idx) => ({
        id: idx + 1,
        codigo: typeof ra === 'string' ? `RA${idx + 1}` : ra.code || `RA${idx + 1}`,
        descripcion: typeof ra === 'string' ? ra : ra.description || ra
      }))
    }
    const mapRaCodesToIds = (raCodes, raList) => {
      if (!Array.isArray(raCodes) || raCodes.length === 0) return []
      const ids = []
      raCodes.forEach((code) => {
        const match = String(code).match(/RA\s*(\d+)/i)
        if (!match) return
        const idx = parseInt(match[1], 10) - 1
        if (idx >= 0 && idx < raList.length) {
          ids.push(raList[idx].id)
        }
      })
      return ids
    }

    const raList = raListToArray(data.learning_outcomes) || []
    
    const genericItems = normalizeCompetencyItems(
      data.generic_competencies_items || data.generic_competencies,
      typeof data.generic_competencies === 'string' ? data.generic_competencies : ''
    )
    const specificFallback = typeof data.specific_competencies === 'string' && data.specific_competencies !== 'No Aplica'
      ? data.specific_competencies
      : ''
    const specificItems = normalizeCompetencyItems(
      data.specific_competencies_items || data.specific_competencies,
      specificFallback
    )

    // Mapear datos extraídos al formulario
    setFormData({
      carrera: normalizedCareer,
      asignatura: data.subject || '',
      plan: data.study_plan || data.plan || '',
      anio: data.academic_year || '',
      ciclo: data.year_of_career || '',
      cuatrimestre: normalizeQuarterSelection(data.quarter),
      caracter: data.character || 'Obligatoria',
      regimen: data.regime || 'Cuatrimestral',
      hsTotal: parseInt(data.total_hours) || 0,
      hsTeo: parseInt(data.theoretical_hours) || 0,
      hsPrac: parseInt(data.practical_hours) || 0,
      hsSemanal: parseInt(data.weekly_hours) || 0,
      contenidosMin: data.minimum_content || '',
      competenciasGenItems: genericItems,
      competenciasEspItems: specificItems,
      // Fundamentos: usar la sección de importancia correctamente
      fundamentosP1: data.importance || data.fundamentals || '',
      fundamentosP2: data.professional_profile || '',
      // Resultados de aprendizaje: convertir de array de objetos a array de items
      resultadosAprendizaje: raList,
      unidades: data.units?.map((unit, idx) => ({
        id: idx + 1,
        nombre: unit.name || '',
        contenidos: unit.content || '',
        bibBasica: unit.bibliography_basic || '',
        bibCompl: unit.bibliography_complementary || ''
      })) || [],
      trabajosPracticos: data.practicals?.map((tp, idx) => ({
        id: idx + 1,
        nombre: tp.name || '',
        raIds: mapRaCodesToIds(tp.ra_codes, raList),
        objetivo: tp.objective || '',
        actividades: tp.activities || '',
        materiales: tp.materials || '',
        ambito: tp.scope || ''
      })) || [],
      metodologia: data.methodology || '',
      evaluacion: data.evaluation || '',
      bibliografia: buildBibliografiaGlobal(data),
      observaciones: data.observations || ''
    })
    
    // Cargar equipo docente desde teaching_team array
    if (data.teaching_team && Array.isArray(data.teaching_team)) {
      setEquipoDocente(data.teaching_team.map((docente, idx) => ({
        id: idx + 1,
        teacherId: docente.id ?? null,
        nombre: docente.name || '',
        categoria: docente.category || '',
        correo: docente.email || ''
      })))
    } else if (data.teachers && typeof data.teachers === 'string') {
      // Fallback para compatibilidad con formato antiguo
      setEquipoDocente([{
        id: 1,
        teacherId: null,
        nombre: data.teachers,
        categoria: 'TITULAR',
        correo: ''
      }])
    }
    
    if (normalizedCareer) {
      setActiveCareer(normalizedCareer)
    }
    setProposalsMode('create')
    setEditingProposalId(null)
    setEditingProposalStatus(null)
    setViewProposal(null)
    setImportPreview(null)
    setImportFile(null)
    setStatusMsg('Propuesta cargada en el formulario')
    setStatusType('success')
    
    // Scroll a la sección de Información General con delay para que el DOM se actualice
    setTimeout(() => {
      informacionGeneralRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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
    textarea: { width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '110px', boxSizing: 'border-box', fontFamily: 'Segoe UI', resize: 'vertical', overflow: 'hidden' },
    button: { padding: '10px 20px', background: '#006ba8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
    buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    readonlyField: { background: '#f0f0f0', cursor: 'not-allowed' },
    statusToast: {
      position: 'fixed',
      right: '20px',
      top: '20px',
      padding: '12px 16px',
      borderRadius: '4px',
      color: '#fff',
      zIndex: 1000,
      maxWidth: '420px',
      boxShadow: '0 8px 18px rgba(0,0,0,0.2)'
    },
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
  const AIButton = ({ onClick, hasContent, disabled, tooltip, fullWidth = false }) => {
    const title = disabled ? tooltip : (hasContent ? 'Reformular con IA' : 'Escribir con IA')
    return (
      <button
        style={{ ...styles.button, ...(disabled && styles.buttonDisabled), ...(fullWidth && { width: '100%', marginRight: 0, flex: 1 }) }}
        onClick={onClick}
        disabled={disabled}
        title={title}
      >
        {hasContent ? '✏️' : '✍️'} {hasContent ? 'Reformular con IA' : 'Escribir con IA'}
      </button>
    )
  }

  const isDocenteView = viewRole === 'docente'
  const normalizeText = (value) => String(value || '').trim().toLowerCase()
  const hasSelectedTeacher = !!(selectedTeacherId || selectedTeacherName)
  const proposalHasTeacher = (proposal, teacherId, teacherName) => {
    if (!proposal || !Array.isArray(proposal.teaching_team)) {
      return false
    }
    const normalizedName = normalizeText(teacherName)
    return proposal.teaching_team.some((doc) => {
      if (teacherId && doc.id != null && String(doc.id) === String(teacherId)) {
        return true
      }
      if (normalizedName && normalizeText(doc.name) === normalizedName) {
        return true
      }
      return false
    })
  }

  const canCreateProposal = !isDocenteView && isProposalReadyToCreate()
  const canSaveDraft = !!(formData.carrera || activeCareer) && !!formData.asignatura && (!isDocenteView || !!editingProposalId)
  const canSaveEdits = !!(formData.carrera || activeCareer) && !!formData.asignatura && (!isDocenteView || !!editingProposalId)
  const normalizedActiveCareer = normalizeCareer(activeCareer)
  const filteredByCareer = normalizedActiveCareer
    ? proposals.filter((proposal) => normalizeCareer(proposal.career) === normalizedActiveCareer)
    : []
  const filteredProposals = isDocenteView
    ? (hasSelectedTeacher
        ? filteredByCareer.filter((proposal) => proposalHasTeacher(proposal, selectedTeacherId, selectedTeacherName))
        : [])
    : filteredByCareer
  const completeProposals = filteredProposals.filter(isProposalComplete)
  const inProcessProposals = filteredProposals.filter(isProposalInProcess)
  const proposalTableGetters = {
    id: (p) => p.id ?? '',
    subject: (p) => p.subject ?? '',
    academic_year: (p) => p.academic_year ?? '',
    year_of_career: (p) => p.year_of_career ?? '',
    quarter: (p) => p.quarter ?? '',
    updated_at: (p) => formatDateTime(p.updated_at || p.created_at),
    status: (p) => p.status ?? ''
  }
  const completeProposalsFiltered = applyTableSort(
    applyTableFilters(completeProposals, completeProposalFilters, proposalTableGetters),
    completeProposalSort,
    proposalTableGetters
  )
  const inProcessProposalsFiltered = applyTableSort(
    applyTableFilters(inProcessProposals, pendingProposalFilters, proposalTableGetters),
    pendingProposalSort,
    proposalTableGetters
  )
  const teacherTableGetters = {
    name: (t) => t.name ?? '',
    category: (t) => t.category ?? '',
    dedication: (t) => t.dedication ?? '',
    email: (t) => t.email ?? ''
  }
  const teacherCatalogFiltered = applyTableSort(
    applyTableFilters(teacherCatalogItems, teacherTableFilters, teacherTableGetters),
    teacherTableSort,
    teacherTableGetters
  )
  const competencyTableGetters = {
    code: (c) => c.code ?? '',
    description: (c) => c.description ?? ''
  }
  const genericCompetenciesFiltered = applyTableSort(
    applyTableFilters(careerCompetencies.generic, genericCompetencyFilters, competencyTableGetters),
    genericCompetencySort,
    competencyTableGetters
  )
  const specificCompetenciesFiltered = applyTableSort(
    applyTableFilters(careerCompetencies.specific, specificCompetencyFilters, competencyTableGetters),
    specificCompetencySort,
    competencyTableGetters
  )
  const previewGenericCompetencies = importPreview?.data
    ? normalizeCompetencyItems(
        importPreview.data.generic_competencies_items || importPreview.data.generic_competencies,
        typeof importPreview.data.generic_competencies === 'string' ? importPreview.data.generic_competencies : ''
      )
    : []
  const previewSpecificCompetencies = importPreview?.data
    ? normalizeCompetencyItems(
        importPreview.data.specific_competencies_items || importPreview.data.specific_competencies,
        typeof importPreview.data.specific_competencies === 'string' && importPreview.data.specific_competencies !== 'No Aplica'
          ? importPreview.data.specific_competencies
          : ''
      )
    : []

  const renderCompetencySection = ({ title, type, required }) => {
    const items = Array.isArray(formData[type]) ? formData[type] : []
    const isGeneric = type === 'competenciasGenItems'
    const canEditCompetencies = !isDocenteView
    const catalogList = isGeneric ? careerCompetencies.generic : careerCompetencies.specific
    const datalistId = `${type}-catalog`
    return (
      <div style={styles.section}>
        <h3>{title}{required ? ' *' : ''}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {items.length === 0 ? (
            <div style={{ color: '#777', fontStyle: 'italic' }}>No hay competencias cargadas.</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 3fr 1fr auto',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <input
                  style={styles.input}
                  placeholder="Codigo"
                  value={item.code || ''}
                  onChange={(e) => updateCompetencyItem(type, item.id, 'code', e.target.value)}
                  list={datalistId}
                  disabled={!canEditCompetencies}
                />
                <datalist id={datalistId}>
                  {catalogList.map((entry) => (
                    <option key={entry.id ?? entry.code} value={entry.code}>
                      {entry.description}
                    </option>
                  ))}
                </datalist>
                <input
                  style={styles.input}
                  placeholder="Descripcion"
                  value={item.description || ''}
                  onChange={(e) => updateCompetencyItem(type, item.id, 'description', e.target.value)}
                  disabled={!canEditCompetencies}
                />
                <select
                  style={styles.input}
                  value={normalizeLevelValue(item.level) || ''}
                  onChange={(e) => updateCompetencyItem(type, item.id, 'level', e.target.value)}
                  disabled={!canEditCompetencies}
                >
                  <option value="">Seleccionar nivel</option>
                  {levelOptions.filter((opt) => opt.value > 0).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  style={{ ...styles.button, marginRight: 0 }}
                  onClick={() => deleteCompetencyItem(type, item.id)}
                  disabled={!canEditCompetencies}
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button style={styles.button} onClick={() => addCompetencyItem(type)} disabled={!canEditCompetencies}>
            + Agregar competencia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <img src={logoMacau} alt="MACAU" style={{ maxWidth: '140px', height: 'auto' }} />
          <div style={{ color: '#1a3d5c', fontSize: '12px', marginTop: '10px', fontWeight: 600, lineHeight: 1.3 }}>
            Multiagente para la Acreditacion ante CONEAU
          </div>
        </div>
        {!isDocenteView && (
          <MenuButton label="Home" onClick={() => setActiveMenu('home')} active={activeMenu === 'home'} />
        )}
        <MenuButton
          label="Propuestas"
          onClick={() => {
            setActiveMenu('propuestas')
            setProposalsMode(null)
          }}
          active={activeMenu === 'propuestas'}
        />
        {!isDocenteView && (
          <MenuButton
            label="Competencias"
            onClick={() => {
              setActiveMenu('competencias')
              setProposalsMode(null)
            }}
            active={activeMenu === 'competencias'}
          />
        )}
        {!isDocenteView && (
          <MenuButton label="Docentes" onClick={() => setActiveMenu('docentes')} active={activeMenu === 'docentes'} />
        )}
        <MenuButton label="Resoluciones" onClick={() => setActiveMenu('resoluciones')} active={activeMenu === 'resoluciones'} />

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
          <label style={{ ...styles.label, marginTop: 0 }}>Carrera activa</label>
          <select
            style={{ ...styles.input, marginBottom: 0 }}
            value={activeCareer}
            onChange={(e) => setActiveCareer(e.target.value)}
          >
            <option value="">Seleccionar carrera...</option>
            {careerOptions.map((career) => (
              <option key={career} value={career}>{career}</option>
            ))}
          </select>
          {!activeCareer && (
            <div style={{ color: '#b00020', fontWeight: 600, marginTop: '8px', fontSize: '12px' }}>
              Selecciona una carrera para filtrar y crear contenido.
            </div>
          )}
          <label style={{ ...styles.label, marginTop: '12px' }}>Vista</label>
          <select
            style={{ ...styles.input, marginBottom: 0 }}
            value={viewRole}
            onChange={(e) => setViewRole(e.target.value)}
          >
            <option value="director">Director</option>
            <option value="docente">Docente</option>
          </select>
          {viewRole === 'docente' && (
            <>
              <label style={{ ...styles.label, marginTop: '12px' }}>Docente</label>
              <select
                style={{ ...styles.input, marginBottom: 0 }}
                value={selectedTeacherId || ''}
                onChange={(e) => {
                  const nextId = e.target.value || null
                  const teacher = teacherCatalogItems.find((item) => String(item.id) === String(nextId))
                  setSelectedTeacherId(nextId)
                  setSelectedTeacherName(teacher?.name || '')
                }}
                disabled={!activeCareer}
              >
                <option value="">Seleccionar docente...</option>
                {teacherCatalogItems.map((teacher) => (
                  <option key={teacher.id ?? teacher.name} value={teacher.id ?? ''}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {!activeCareer && (
                <div style={{ color: '#b00020', fontWeight: 600, marginTop: '8px', fontSize: '12px' }}>
                  Selecciona una carrera para elegir docente.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {statusMsg && (
          <div style={{ ...styles.statusToast, ...(statusType === 'error' && styles.statusError), ...(statusType === 'success' && styles.statusSuccess), ...(statusType === 'info' && styles.statusInfo) }}>
            {statusMsg}
          </div>
        )}

        {/* HOME */}
        {activeMenu === 'home' && (
          <div style={styles.section}>
            <h1>Bienvenido a MACAU</h1>
            <p>MACAU centraliza la creacion, edicion e importacion de propuestas academicas y organiza todo el proceso de acreditacion en un flujo unico.</p>
            <p>Integra catalogos de docentes y competencias, valida duplicados, y asiste con IA para redactar, reformular y estructurar contenidos clave con criterios consistentes.</p>
            <p>El resultado es un repositorio ordenado, auditable y listo para exportar, que facilita el trabajo coordinado de las catedras y mejora la trazabilidad ante CONEAU.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div style={{ border: '1px solid #d0d0d0', borderRadius: '10px', padding: '16px', background: '#f8f9fb' }}>
                <div style={{ fontSize: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>📘</span> Propuestas creadas
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800 }}>{completeProposals.length}</div>
              </div>
              <div style={{ border: '1px solid #ffd59e', borderRadius: '10px', padding: '16px', background: '#fff7ea' }}>
                <div style={{ fontSize: '16px', color: '#7a4b00', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>⏳</span> Propuestas en proceso
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#b35b00' }}>{inProcessProposals.length}</div>
              </div>
              <div style={{ border: '1px solid #cde7d6', borderRadius: '10px', padding: '16px', background: '#f1fbf4' }}>
                <div style={{ fontSize: '16px', color: '#2b6a3b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>👩‍🏫</span> Docentes
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#2b6a3b' }}>{teacherCatalogItems.length}</div>
              </div>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', background: '#fafafa' }}>
                <div style={{ fontSize: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>📄</span> Resoluciones
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800 }}>0</div>
              </div>
            </div>
          </div>
        )}

        {/* PROPUESTAS */}
        {activeMenu === 'propuestas' && !proposalsMode && (
          <div style={styles.section}>
            <h2>Propuestas Académicas</h2>
            {isDocenteView && !hasSelectedTeacher && (
              <div style={{ marginTop: '10px', background: '#fff6e6', border: '1px solid #ffcc80', padding: '10px 12px', borderRadius: '6px', color: '#7a4b00' }}>
                Selecciona un docente para ver solo sus propuestas en la carrera activa.
              </div>
            )}
            
            {/* CARDS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: isDocenteView ? '1fr' : '1fr 1fr 1fr', gap: '20px', marginBottom: '30px', marginTop: '20px' }}>
              {/* Card 1: Crear Propuesta */}
              {!isDocenteView && (
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
                  resetProposalForm()
                  setProposalsMode('create')
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
                  <h3 style={{ color: '#0066cc', margin: '0 0 10px 0' }}>Crear Propuesta</h3>
                  <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>Crear una propuesta desde cero, con asistencia de IA 🤖</p>
                </div>
              )}

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
              {!isDocenteView && (
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
              )}
            </div>

            {/* PROPOSALS TABLE */}
            <div style={{ ...styles.section, marginTop: '30px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
              <h3>Propuestas Cargadas ({completeProposals.length})</h3>
              {completeProposals.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0066cc', color: 'white' }}>
                        <th
                          style={{ width: '70px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'id')}
                        >
                          ID{getSortIndicator(completeProposalSort, 'id')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'subject')}
                        >
                          Asignatura{getSortIndicator(completeProposalSort, 'subject')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'academic_year')}
                        >
                          Año Académico{getSortIndicator(completeProposalSort, 'academic_year')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'year_of_career')}
                        >
                          Año Carrera{getSortIndicator(completeProposalSort, 'year_of_career')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'quarter')}
                        >
                          Cuatrimestre{getSortIndicator(completeProposalSort, 'quarter')}
                        </th>
                        <th
                          style={{ width: '150px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'updated_at')}
                        >
                          Ultima edición{getSortIndicator(completeProposalSort, 'updated_at')}
                        </th>
                        <th
                          style={{ width: '90px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'status')}
                        >
                          Estado{getSortIndicator(completeProposalSort, 'status')}
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #0066cc' }}>Acciones</th>
                      </tr>
                      <tr style={{ backgroundColor: '#f4f8ff' }}>
                        <th style={{ width: '70px', padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.id}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, id: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.subject}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.academic_year}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.year_of_career}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, year_of_career: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.quarter}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, quarter: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.updated_at}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, updated_at: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.status}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, status: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {completeProposalsFiltered.map((prop, idx) => (
                        <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                          <td style={{ width: '70px', padding: '10px' }}>#{prop.id}</td>
                          <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                          <td style={{ padding: '10px' }}>{formatDateTime(prop.updated_at || prop.created_at)}</td>
                          <td style={{ padding: '10px', width: '90px' }}>{prop.status || '-'}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                              title="Ver propuesta"
                              onClick={() => openProposalView(prop.id)}
                            >
                              👁️
                            </button>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                              title="Editar propuesta"
                              onClick={() => loadProposalForEdit(prop.id)}
                            >
                              ✏️
                            </button>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                              title="Descargar propuesta"
                              onClick={() => downloadProposalDocx(prop.id)}
                            >
                              ⬇️
                            </button>
                            {!isDocenteView && (
                              <button
                                style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                title="Eliminar propuesta"
                                onClick={() => deleteProposal(prop.id)}
                              >
                                🗑️
                              </button>
                            )}
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
              <div ref={informacionGeneralRef} style={{ ...styles.section, marginTop: '20px' }}>
                <h3>Información General</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={styles.label}>Carrera *</label>
                    <select
                      style={styles.input}
                      value={activeCareer}
                      onChange={(e) => setActiveCareer(e.target.value)}
                      disabled={isDocenteView}
                    >
                      <option value="">Seleccionar carrera...</option>
                      {careerOptions.map((career) => (
                        <option key={career} value={career}>{career}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Asignatura</label>
                    <input style={styles.input} value={formData.asignatura} onChange={(e) => updateFormData('asignatura', e.target.value)} disabled={isDocenteView} />
                  </div>

                  {/* ROW 1: Plan, Año, Ciclo, Cuatrimestre */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px', padding: '0 10px', gridColumn: '1 / -1' }}>
                    <div>
                      <label style={styles.label}>Plan de Estudios</label>
                      <input style={styles.input} value={formData.plan} onChange={(e) => updateFormData('plan', e.target.value)} placeholder="Ej: Plan 2023" disabled={isDocenteView} />
                    </div>
                    <div>
                      <label style={styles.label}>Año Académico</label>
                      <input style={styles.input} value={formData.anio} onChange={(e) => updateFormData('anio', e.target.value)} placeholder="Ej: 2024" disabled={isDocenteView} />
                    </div>
                    <div>
                      <label style={styles.label}>Ciclo (Año en carrera)</label>
                      <input style={styles.input} value={formData.ciclo} onChange={(e) => updateFormData('ciclo', e.target.value)} placeholder="Ej: 1º, 2º, 3º" disabled={isDocenteView} />
                    </div>
                    <div>
                      <label style={styles.label}>Cuatrimestre *</label>
                      <select style={styles.input} value={formData.cuatrimestre} onChange={(e) => updateFormData('cuatrimestre', e.target.value)} disabled={isDocenteView}>
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
                      <select style={styles.input} value={formData.caracter} onChange={(e) => updateFormData('caracter', e.target.value)} disabled={isDocenteView}>
                        <option>Obligatoria</option>
                        <option>Optativa</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Régimen</label>
                      <select style={styles.input} value={formData.regimen} onChange={(e) => updateFormData('regimen', e.target.value)} disabled={isDocenteView}>
                        <option>Cuatrimestral</option>
                        <option>Anual</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Hs Teóricas</label>
                      <input style={styles.input} type="number" value={formData.hsTeo} onChange={(e) => updateFormData('hsTeo', e.target.value)} min="0" disabled={isDocenteView} />
                    </div>
                    <div>
                      <label style={styles.label}>Hs Prácticas</label>
                      <input style={styles.input} type="number" value={formData.hsPrac} onChange={(e) => updateFormData('hsPrac', e.target.value)} min="0" disabled={isDocenteView} />
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
                {equipoDocente.map(doc => {
                  const suggestions = !isDocenteView && docenteAutocompleteId === doc.id
                    ? getTeacherSuggestions(doc.nombre)
                    : []
                  return (
                    <div key={doc.id} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          style={styles.input}
                          placeholder="Nombre"
                          value={doc.nombre}
                          onChange={(e) => {
                            updateDocente(doc.id, 'nombre', e.target.value)
                            setDocenteAutocompleteId(doc.id)
                          }}
                          onFocus={() => setDocenteAutocompleteId(doc.id)}
                          onBlur={() => setTimeout(() => setDocenteAutocompleteId(null), 150)}
                          disabled={isDocenteView}
                        />
                        {suggestions.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '4px', zIndex: 5, maxHeight: '160px', overflowY: 'auto' }}>
                            {suggestions.map((teacher) => (
                              <div
                                key={teacher.id}
                                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                onMouseDown={() => selectDocenteSuggestion(doc.id, teacher)}
                              >
                                <div style={{ fontWeight: '600' }}>{teacher.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{teacher.category || '-'} {teacher.email ? `• ${teacher.email}` : ''}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <select style={styles.input} value={doc.categoria} onChange={(e) => updateDocente(doc.id, 'categoria', e.target.value)} disabled={isDocenteView}>
                        <option>TITULAR</option>
                        <option>ASOCIADO</option>
                        <option>ADJUNTO</option>
                        <option>JTP</option>
                        <option>AYUDANTE 1º</option>
                      </select>
                      <input style={styles.input} placeholder="Correo" value={doc.correo} onChange={(e) => updateDocente(doc.id, 'correo', e.target.value)} disabled={isDocenteView} />
                      <button style={{ ...styles.button, marginRight: 0 }} onClick={() => deleteDocente(doc.id)} disabled={equipoDocente.length === 1 || isDocenteView}>X</button>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button style={styles.button} onClick={addDocente} disabled={isDocenteView}>+ Agregar Docente</button>
                </div>
              </div>

              {/* CONTENT SECTIONS */}
              <div style={styles.section}>
                <h3>Contenidos Mínimos *</h3>
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.contenidosMin} onChange={(e) => updateFormData('contenidosMin', e.target.value)} readOnly={isDocenteView} />
              </div>

              {renderCompetencySection({
                title: 'Competencias Genéricas',
                type: 'competenciasGenItems',
                required: true
              })}

              {renderCompetencySection({
                title: 'Competencias Específicas',
                type: 'competenciasEspItems',
                required: false
              })}

              {/* FUNDAMENTALS */}
              <div style={styles.section}>
                <h3>Fundamentos</h3>
                <label style={styles.label}>Importancia (100-200 palabras)</label>
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.fundamentosP1} onChange={(e) => updateFormData('fundamentosP1', e.target.value)} />
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
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.fundamentosP2} onChange={(e) => updateFormData('fundamentosP2', e.target.value)} />
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'start' }}>
                      <textarea
                        style={{ ...styles.textarea, marginBottom: 0, minHeight: '60px' }}
                        placeholder="Resultado de aprendizaje"
                        data-autoresize="true"
                        onInput={autoResizeTextarea}
                        value={ra.descripcion}
                        onChange={(e) => updateRA(ra.id, 'descripcion', e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', minWidth: '240px' }}>
                        <AIButton
                          onClick={() => runAiForField({
                            target: { type: 'ra', id: ra.id, field: 'descripcion' },
                            currentValue: ra.descripcion,
                            label: 'Resultado de Aprendizaje'
                          })}
                          hasContent={!!ra.descripcion}
                          disabled={!isFormComplete()}
                          tooltip={isFormComplete() ? '' : 'Completa info general primero'}
                          fullWidth
                        />
                        <button style={{ ...styles.button, background: '#d32f2f', marginRight: 0, flex: 1 }} onClick={() => deleteRA(ra.id)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button style={styles.button} onClick={addRA}>+ Agregar RA</button>
                </div>
              </div>

              {/* UNITS */}
              <div style={styles.section}>
                <h3>Unidades de Contenido</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 600, color: '#1a3d5c' }}>Generar</label>
                  <input
                    style={{ ...styles.input, width: '80px', marginBottom: 0 }}
                    type="number"
                    min="1"
                    max="12"
                    value={unitBatchCount}
                    onChange={(e) => setUnitBatchCount(e.target.value)}
                  />
                  <button style={styles.button} onClick={handleGenerateUnitsClick}>Generar Unidades con IA</button>
                </div>
                {unitDebug && (
                  <details style={{ marginBottom: '12px', background: '#f3f6f8', padding: '10px', borderRadius: '6px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1a3d5c' }}>Debug IA - Unidades</summary>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>Ultima ejecucion: {unitDebug.at}</div>
                    {(unitDebug.steps || []).map((step, idx) => (
                      <div key={`${step.label || 'Paso'}-${idx}`} style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #d9e1e6' }}>
                        <div style={{ fontWeight: 600, color: '#1a3d5c', marginBottom: '6px' }}>{step.label || `Paso ${idx + 1}`}</div>
                        <label style={{ ...styles.label, marginTop: '6px' }}>Prompt enviado</label>
                        <textarea style={{ ...styles.textarea, minHeight: '120px' }} data-autoresize="true" onInput={autoResizeTextarea} value={step.prompt || ''} readOnly />
                        <label style={{ ...styles.label, marginTop: '6px' }}>Respuesta recibida</label>
                        <textarea style={{ ...styles.textarea, minHeight: '120px' }} data-autoresize="true" onInput={autoResizeTextarea} value={step.response || ''} readOnly />
                        {step.cleaned ? (
                          <>
                            <label style={{ ...styles.label, marginTop: '6px' }}>Respuesta limpiada</label>
                            <textarea style={{ ...styles.textarea, minHeight: '120px' }} data-autoresize="true" onInput={autoResizeTextarea} value={step.cleaned} readOnly />
                          </>
                        ) : null}
                      </div>
                    ))}
                  </details>
                )}
                {formData.unidades.map((u, idx) => (
                  <div key={u.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#1a3d5c', marginBottom: '6px' }}>Unidad {idx + 1}</div>
                    <input style={styles.input} placeholder="Nombre de la Unidad" value={u.nombre} onChange={(e) => updateUnidad(u.id, 'nombre', e.target.value)} />
                    <label style={styles.label}>Contenidos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'start' }}>
                      <textarea style={{ ...styles.textarea, marginBottom: 0 }} placeholder="Contenidos" data-autoresize="true" onInput={autoResizeTextarea} value={u.contenidos} onChange={(e) => updateUnidad(u.id, 'contenidos', e.target.value)} />
                      <AIButton
                        onClick={() => runAiForField({
                          target: { type: 'unidad', id: u.id, field: 'contenidos' },
                          currentValue: u.contenidos,
                          label: 'Contenidos de la Unidad'
                        })}
                        hasContent={!!u.contenidos}
                        disabled={!isNonEmptyText(u.nombre) || !isNonEmptyText(formData.contenidosMin)}
                        tooltip={!isNonEmptyText(u.nombre) ? 'Completa el nombre de la unidad' : (!isNonEmptyText(formData.contenidosMin) ? 'Completa contenidos minimos primero' : '')}
                        fullWidth
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={styles.label}>Bibliografia Basica</label>
                        <textarea
                          style={{ ...styles.textarea, marginBottom: 0 }}
                          placeholder="Bibliografia Basica"
                          data-autoresize="true"
                          onInput={autoResizeTextarea}
                          value={u.bibBasica}
                          onChange={(e) => updateUnidad(u.id, 'bibBasica', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Bibliografia Complementaria</label>
                        <textarea
                          style={{ ...styles.textarea, marginBottom: 0 }}
                          placeholder="Bibliografia Complementaria"
                          data-autoresize="true"
                          onInput={autoResizeTextarea}
                          value={u.bibCompl}
                          onChange={(e) => updateUnidad(u.id, 'bibCompl', e.target.value)}
                        />
                      </div>
                    </div>
                    <button style={{ ...styles.button, background: '#d32f2f' }} onClick={() => deleteUnidad(u.id)}>Eliminar Unidad</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button style={styles.button} onClick={addUnidad}>+ Agregar Unidad</button>
                </div>
              </div>

              {/* PRACTICALS */}
              <div style={styles.section}>
                <h3>Trabajos Prácticos</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 600, color: '#1a3d5c' }}>Generar</label>
                  <input
                    style={{ ...styles.input, width: '80px', marginBottom: 0 }}
                    type="number"
                    min="1"
                    max="12"
                    value={tpBatchCount}
                    onChange={(e) => setTpBatchCount(e.target.value)}
                  />
                  <button style={styles.button} onClick={handleGeneratePracticalsClick}>Generar TP con IA</button>
                </div>
                {formData.trabajosPracticos.map((tp, idx) => (
                  <div key={tp.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#1a3d5c', marginBottom: '6px' }}>Trabajo Practico {tp.numero || idx + 1}</div>
                    <input style={styles.input} placeholder="Nombre del TP" value={tp.nombre} onChange={(e) => updateTP(tp.id, 'nombre', e.target.value)} />
                    <label style={styles.label}>Resultados de aprendizaje cubiertos</label>
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', background: '#fff' }}>
                      {formData.resultadosAprendizaje.length === 0 ? (
                        <div style={{ color: '#888', fontSize: '13px' }}>No hay RA cargados</div>
                      ) : (
                        formData.resultadosAprendizaje.map((ra, raIdx) => (
                          <label key={ra.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', marginBottom: '6px' }}>
                            <input
                              type="checkbox"
                              checked={Array.isArray(tp.raIds) && tp.raIds.includes(ra.id)}
                              onChange={() => toggleTpRa(tp.id, ra.id)}
                            />
                            <span>RA {raIdx + 1}: {ra.descripcion || ra.verbo || ''}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <label style={{ ...styles.label, marginTop: '8px' }}>Objetivo (RA seleccionados)</label>
                    <textarea
                      style={{ ...styles.textarea, minHeight: '90px' }}
                      data-autoresize="true"
                      onInput={autoResizeTextarea}
                      value={getTpObjectiveFromRaIds(tp.raIds) || tp.objetivo || ''}
                      readOnly
                    />
                    <textarea style={styles.textarea} placeholder="Actividades" data-autoresize="true" onInput={autoResizeTextarea} value={tp.actividades} onChange={(e) => updateTP(tp.id, 'actividades', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Materiales" data-autoresize="true" onInput={autoResizeTextarea} value={tp.materiales} onChange={(e) => updateTP(tp.id, 'materiales', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Ámbito de Práctica (opcional)" data-autoresize="true" onInput={autoResizeTextarea} value={tp.ambito} onChange={(e) => updateTP(tp.id, 'ambito', e.target.value)} />
                    <button style={{ ...styles.button, background: '#d32f2f' }} onClick={() => deleteTP(tp.id)}>Eliminar TP</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button style={styles.button} onClick={addTP}>+ Agregar TP</button>
                </div>
              </div>

              {/* OTHER SECTIONS */}
              <div style={styles.section}>
                <h3>Metodología</h3>
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.metodologia} onChange={(e) => updateFormData('metodologia', e.target.value)} />
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
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.evaluacion} onChange={(e) => updateFormData('evaluacion', e.target.value)} />
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
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.bibliografia} onChange={(e) => updateFormData('bibliografia', e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <AIButton
                    onClick={() => runAiForField({
                      target: { type: 'form', field: 'bibliografia' },
                      currentValue: formData.bibliografia,
                      label: 'Bibliografia'
                    })}
                    hasContent={!!formData.bibliografia}
                    disabled={!isNonEmptyText(formData.bibliografia)}
                    tooltip="Carga bibliografia para formatear"
                  />
                </div>
              </div>

              <div style={styles.section}>
                <h3>Observaciones</h3>
                <textarea style={styles.textarea} data-autoresize="true" onInput={autoResizeTextarea} value={formData.observaciones} onChange={(e) => updateFormData('observaciones', e.target.value)} />
              </div>

              {/* SAVE BUTTONS - STICKY */}
              <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Draft button - show when creating new OR editing EnProceso */}
                {(!editingProposalId || editingProposalStatus === 'EnProceso') && (
                  <button
                    style={{
                      ...styles.button,
                      background: '#757575',
                      fontSize: '14px',
                      padding: '12px 24px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      ...(!canSaveDraft && { opacity: 0.45, cursor: 'not-allowed' })
                    }}
                    onClick={saveProposal}
                    disabled={!canSaveDraft}
                    title={canSaveDraft ? 'Guardar borrador (estado: En Proceso)' : 'Completa Carrera y Asignatura'}
                  >
                    Guardar Borrador
                  </button>
                )}
                
                {/* Create/Edit button */}
                {(!editingProposalId || editingProposalStatus === 'EnProceso') ? (
                  <button
                    style={{
                      ...styles.button,
                      background: '#388e3c',
                      fontSize: '16px',
                      padding: '15px 30px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      ...(!canCreateProposal && { opacity: 0.45, cursor: 'not-allowed' })
                    }}
                    onClick={saveProposal}
                    disabled={!canCreateProposal}
                    title={canCreateProposal 
                      ? 'Crear propuesta completa (estado: Creada)' 
                      : (() => {
                          const errors = getValidationErrors()
                          return errors.length <= 3 
                            ? `Faltan: ${errors.join(', ')}`
                            : `Faltan ${errors.length} campos. Haz clic para ver detalles.`
                        })()
                    }
                  >
                    Crear Propuesta
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      style={{
                        ...styles.button,
                        background: '#ff9800',
                        fontSize: '16px',
                        padding: '15px 30px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        ...(!canSaveEdits && { opacity: 0.45, cursor: 'not-allowed' })
                      }}
                      onClick={saveProposal}
                      disabled={!canSaveEdits}
                      title={canSaveEdits ? 'Guardar como borrador (incompleto)' : 'Completa Carrera y Asignatura'}
                    >
                      Guardar Borrador
                    </button>
                    <button
                      style={{
                        ...styles.button,
                        background: '#388e3c',
                        fontSize: '16px',
                        padding: '15px 30px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        ...(!canSaveEdits && { opacity: 0.45, cursor: 'not-allowed' })
                      }}
                      onClick={saveProposal}
                      disabled={!canSaveEdits}
                      title={canSaveEdits ? 'Guardar propuesta' : 'Completa Carrera y Asignatura'}
                    >
                      Guardar Propuesta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showUnitBibliografiaModal && (
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                onClick={cancelUnitBibliografiaModal}
              >
                <div
                  style={{ background: '#fff', padding: '24px 30px', borderRadius: '8px', maxWidth: '720px', width: '92%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>Bibliografia para Unidades</h3>
                  <p style={{ color: '#555', marginTop: 0 }}>
                    Completa la bibliografia basica y complementaria. Se usara para distribuirla en cada unidad.
                  </p>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    {isNonEmptyText(formData.bibliografia)
                      ? 'Se cargo automaticamente desde la seccion Bibliografia.'
                      : 'No hay bibliografia en la seccion inferior. Cargala aqui para continuar.'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={styles.label}>Bibliografia Basica</label>
                      <textarea
                        style={{ ...styles.textarea, minHeight: '140px' }}
                        placeholder="Una referencia por linea"
                        data-autoresize="true"
                        onInput={autoResizeTextarea}
                        value={unitBibliografiaDraft.basica}
                        onChange={(e) => setUnitBibliografiaDraft(prev => ({ ...prev, basica: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Bibliografia Complementaria</label>
                      <textarea
                        style={{ ...styles.textarea, minHeight: '140px' }}
                        placeholder="Una referencia por linea"
                        data-autoresize="true"
                        onInput={autoResizeTextarea}
                        value={unitBibliografiaDraft.complementaria}
                        onChange={(e) => setUnitBibliografiaDraft(prev => ({ ...prev, complementaria: e.target.value }))}
                      />
                    </div>
                  </div>
                  <label style={{ ...styles.label, marginTop: '10px' }}>Preferencias para el orden o enfoque (opcional)</label>
                  <textarea
                    style={{ ...styles.textarea, minHeight: '90px' }}
                    placeholder="Ej: priorizar fundamentos al inicio, luego aplicacion en practicas..."
                    data-autoresize="true"
                    onInput={autoResizeTextarea}
                    value={unitBibliografiaDraft.preferencia}
                    onChange={(e) => setUnitBibliografiaDraft(prev => ({ ...prev, preferencia: e.target.value }))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={cancelUnitBibliografiaModal}>Cancelar</button>
                    <button style={styles.button} onClick={confirmUnitBibliografiaModal}>Continuar</button>
                  </div>
                </div>
              </div>
            )}

            {showTpCommentModal && (
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                onClick={cancelTpCommentModal}
              >
                <div
                  style={{ background: '#fff', padding: '24px 30px', borderRadius: '8px', maxWidth: '640px', width: '92%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>Comentario para Trabajos Practicos</h3>
                  <p style={{ color: '#555', marginTop: 0 }}>
                    Opcional. Indica el enfoque o ideas para los TP.
                  </p>
                  <textarea
                    style={{ ...styles.textarea, minHeight: '120px' }}
                    placeholder="Ej: enfocar en estructuras dinamicas primero, luego en busqueda y archivos"
                    data-autoresize="true"
                    onInput={autoResizeTextarea}
                    value={tpCommentDraft}
                    onChange={(e) => setTpCommentDraft(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={cancelTpCommentModal}>Cancelar</button>
                    <button style={styles.button} onClick={confirmTpCommentModal}>Continuar</button>
                  </div>
                </div>
              </div>
            )}

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
            {completeProposals.length === 0 ? (
              <p>No hay propuestas guardadas</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3d5c', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Asignatura</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Carrera</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Creada</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Ultima edición</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #006ba8' }}>Descargar</th>
                  </tr>
                </thead>
                <tbody>
                  {completeProposals.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{p.id}</td>
                      <td style={{ padding: '10px' }}>{p.title || 'Sin título'}</td>
                      <td style={{ padding: '10px' }}>{p.career || '-'}</td>
                      <td style={{ padding: '10px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>{formatDateTime(p.updated_at || p.created_at)}</td>
                      <td style={{ padding: '10px' }}>{p.status || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          style={{ ...styles.button, padding: '6px 10px', fontSize: '12px', marginRight: 0 }}
                          onClick={() => downloadProposalDocx(p.id)}
                        >
                          Descargar propuesta
                        </button>
                      </td>
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
            {inProcessProposals.length === 0 ? (
              <p style={{ color: '#999', marginTop: '20px' }}>No hay propuestas en edición aún.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ff9900', color: 'white' }}>
                      <th
                        style={{ width: '70px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'id')}
                      >
                        ID{getSortIndicator(pendingProposalSort, 'id')}
                      </th>
                      <th
                        style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'subject')}
                      >
                        Asignatura{getSortIndicator(pendingProposalSort, 'subject')}
                      </th>
                      <th
                        style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'academic_year')}
                      >
                        Año Académico{getSortIndicator(pendingProposalSort, 'academic_year')}
                      </th>
                      <th
                        style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'year_of_career')}
                      >
                        Año Carrera{getSortIndicator(pendingProposalSort, 'year_of_career')}
                      </th>
                      <th
                        style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'quarter')}
                      >
                        Cuatrimestre{getSortIndicator(pendingProposalSort, 'quarter')}
                      </th>
                      <th
                        style={{ width: '150px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'updated_at')}
                      >
                        Ultima edición{getSortIndicator(pendingProposalSort, 'updated_at')}
                      </th>
                      <th
                        style={{ width: '90px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'status')}
                      >
                        Estado{getSortIndicator(pendingProposalSort, 'status')}
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ff9900' }}>Acciones</th>
                    </tr>
                    <tr style={{ backgroundColor: '#fff6e6' }}>
                      <th style={{ width: '70px', padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.id}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, id: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.subject}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.academic_year}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.year_of_career}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, year_of_career: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.quarter}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, quarter: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.updated_at}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, updated_at: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }}>
                        <input
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.status}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, status: e.target.value }))}
                          placeholder="Buscar"
                        />
                      </th>
                      <th style={{ padding: '6px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {inProcessProposalsFiltered.map((prop, idx) => (
                      <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ width: '70px', padding: '10px' }}>#{prop.id}</td>
                        <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                        <td style={{ padding: '10px' }}>{formatDateTime(prop.updated_at || prop.created_at)}</td>
                        <td style={{ padding: '10px', width: '90px' }}>{prop.status || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.7)', color: '#fff' }}
                            title="Ver propuesta"
                            onClick={() => openProposalView(prop.id)}
                          >
                            👁︎
                          </button>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.7)', color: '#fff' }}
                            title="Editar propuesta"
                            onClick={() => loadProposalForEdit(prop.id)}
                          >
                            ✏︎
                          </button>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(69, 90, 100, 0.7)', color: '#fff' }}
                            title="Descargar propuesta"
                            onClick={() => downloadProposalDocx(prop.id)}
                          >
                            ⬇︎
                          </button>
                          {!isDocenteView && (
                            <button
                              style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.7)', color: '#fff' }}
                              title="Eliminar propuesta"
                              onClick={() => deleteProposal(prop.id)}
                            >
                              🗑︎
                            </button>
                          )}
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
        {activeMenu === 'propuestas' && proposalsMode === 'import' && !isDocenteView && (
          <div style={styles.section}>
            <button style={{ ...styles.button, background: '#ccc', color: '#000' }} onClick={() => {
              setProposalsMode(null)
              setImportPreview(null)
              setImportFile(null)
              setImportError('')
            }}>← Volver</button>
            <h2>Importar Propuesta</h2>
            
            {!importPreview ? (
              <div style={{ marginTop: '20px', padding: '20px', background: '#f6ffed', borderRadius: '8px', border: '2px dashed #00a854' }}>
                <p style={{ color: '#00a854', fontWeight: 'bold' }}>Sube un archivo DOCX</p>
                <div style={{ marginTop: '10px' }}>
                  <input 
                    type="file" 
                    accept=".docx" 
                    onChange={handleImportDocxFile}
                    disabled={importLoading}
                    style={{ marginTop: '10px', padding: '5px' }}
                  />
                </div>
                {importLoading && <p style={{ color: '#00a854', marginTop: '10px' }}>Procesando archivo...</p>}
                {importError && <p style={{ color: '#d32f2f', marginTop: '10px' }}>{importError}</p>}
                <p style={{ color: '#999', fontSize: '12px', marginTop: '15px' }}>El sistema extraerá automáticamente los campos de la propuesta de forma similar a la que se generan en el sistema.</p>
              </div>
            ) : (
              // Previsualización de datos importados
              <div style={{ marginTop: '20px' }}>
                <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4caf50' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Datos Extraídos</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                    <div><strong>Carrera:</strong> {importPreview.preview.career || '-'}</div>
                    <div><strong>Asignatura:</strong> {importPreview.preview.subject || '-'}</div>
                    <div><strong>Año de Carrera:</strong> {importPreview.preview.year || '-'}</div>
                    <div><strong>Cuatrimestre:</strong> {importPreview.preview.quarter || '-'}</div>
                    <div><strong>Carga Horaria Total:</strong> {importPreview.preview.total_hours || '-'} hs</div>
                    <div><strong>Horas Teóricas:</strong> {importPreview.preview.theoretical_hours || '-'} hs</div>
                    <div><strong>Horas Prácticas:</strong> {importPreview.preview.practical_hours || '-'} hs</div>
                    <div><strong>Horas Semanales:</strong> {importPreview.preview.weekly_hours || '-'} hs</div>
                    <div><strong>Régimen:</strong> {importPreview.preview.regime || '-'}</div>
                    <div><strong>Unidades:</strong> {importPreview.preview.units_count || 0}</div>
                    <div><strong>Trabajos Prácticos:</strong> {importPreview.preview.practicals_count || 0}</div>
                    <div><strong>Resultados de Aprendizaje:</strong> {importPreview.preview.ra_count || 0}</div>
                  </div>
                  
                  {/* Tabla de Docentes */}
                  {importPreview.data?.teaching_team && importPreview.data.teaching_team.length > 0 && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Equipo Docente ({importPreview.data.teaching_team.length}):</strong>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Nombre</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Categoría</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.data.teaching_team.map((docente, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{docente.name || '-'}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{docente.category || '-'}</td>
                              <td style={{ padding: '8px' }}>{docente.email || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Competencias Genéricas */}
                  {previewGenericCompetencies.length > 0 && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Competencias Genéricas ({previewGenericCompetencies.length}):</strong>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', maxHeight: '150px', overflowY: 'auto' }}>
                        {previewGenericCompetencies.map((comp, idx) => (
                          <div key={idx} style={{ padding: '5px', marginBottom: '5px', background: '#f9f9f9', borderRadius: '3px', fontSize: '13px' }}>
                            <strong>{comp.code || `CGT${idx + 1}`}</strong> - {comp.description || ''} {typeof comp.level !== 'undefined' && <span style={{ color: '#d32f2f' }}>({getLevelLabel(comp.level)})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competencias Específicas */}
                  <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Competencias Específicas {previewSpecificCompetencies.length > 0 ? `(${previewSpecificCompetencies.length})` : ''}:</strong>
                    {previewSpecificCompetencies.length > 0 ? (
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', maxHeight: '150px', overflowY: 'auto' }}>
                        {previewSpecificCompetencies.map((comp, idx) => (
                          <div key={idx} style={{ padding: '5px', marginBottom: '5px', background: '#f9f9f9', borderRadius: '3px', fontSize: '13px' }}>
                            <strong>{comp.code || `CE${idx + 1}`}</strong> - {comp.description || ''} {typeof comp.level !== 'undefined' && <span style={{ color: '#d32f2f' }}>({getLevelLabel(comp.level)})</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', color: '#999', fontStyle: 'italic' }}>No Aplica</div>
                    )}
                  </div>

                  {/* Resultados de Aprendizaje */}
                  {importPreview.data?.learning_outcomes && importPreview.data.learning_outcomes.length > 0 && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Resultados de Aprendizaje ({importPreview.data.learning_outcomes.length}):</strong>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', maxHeight: '150px', overflowY: 'auto' }}>
                        {importPreview.data.learning_outcomes.map((ra, idx) => (
                          <div key={idx} style={{ padding: '5px', marginBottom: '5px', background: '#f9f9f9', borderRadius: '3px', fontSize: '13px' }}>
                            <strong>{ra.code || `RA${idx + 1}`}</strong> - {ra.description || ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fundamentos */}
                  {(importPreview.data?.importance || importPreview.data?.professional_profile) && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Fundamentos:</strong>
                      {importPreview.data?.importance && (
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ fontSize: '13px', color: '#0066cc' }}>Importancia:</strong>
                          <p style={{ margin: '5px 0', padding: '8px', background: '#f9f9f9', borderRadius: '3px', fontSize: '12px', lineHeight: '1.4' }}>
                            {importPreview.data.importance.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                      {importPreview.data?.professional_profile && (
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0066cc' }}>Perfil Profesional:</strong>
                          <p style={{ margin: '5px 0', padding: '8px', background: '#f9f9f9', borderRadius: '3px', fontSize: '12px', lineHeight: '1.4' }}>
                            {importPreview.data.professional_profile.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metodologia */}
                  {importPreview.data?.methodology && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Metodologia:</strong>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                        {importPreview.data.methodology.substring(0, 300)}...
                      </div>
                    </div>
                  )}

                  {/* Evaluacion */}
                  {importPreview.data?.evaluation && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Evaluacion:</strong>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                        {importPreview.data.evaluation.substring(0, 300)}...
                      </div>
                    </div>
                  )}

                  {/* Bibliografia global */}
                  {(importPreview.data?.bibliography_basic || importPreview.data?.bibliography_complementary || importPreview.data?.bibliography) && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Bibliografia:</strong>
                      {importPreview.data?.bibliography_basic && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '12px', color: '#0066cc' }}>Basica:</strong>
                          <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                            {importPreview.data.bibliography_basic.substring(0, 240)}...
                          </div>
                        </div>
                      )}
                      {importPreview.data?.bibliography_complementary && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '12px', color: '#0066cc' }}>Complementaria:</strong>
                          <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                            {importPreview.data.bibliography_complementary.substring(0, 240)}...
                          </div>
                        </div>
                      )}
                      {!importPreview.data?.bibliography_basic && !importPreview.data?.bibliography_complementary && importPreview.data?.bibliography && (
                        <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                          {importPreview.data.bibliography.substring(0, 240)}...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Observaciones */}
                  {importPreview.data?.observations && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Observaciones:</strong>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', lineHeight: '1.4' }}>
                        {importPreview.data.observations.substring(0, 240)}...
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    style={{ ...styles.button, background: '#4caf50', color: 'white' }}
                    onClick={handleLoadImportedProposal}
                  >
                    ✓ Cargar Propuesta al Formulario
                  </button>
                  <button 
                    style={{ ...styles.button, background: '#ff9800', color: 'white' }}
                    onClick={() => {
                      setImportPreview(null)
                      setImportFile(null)
                      setImportError('')
                      document.querySelector('input[type="file"]')?.click()
                    }}
                  >
                    ↺ Importar Otro Archivo
                  </button>
                </div>
                
                {/* Detalles de Unidades */}
                {importPreview.data?.units && importPreview.data.units.length > 0 && (
                  <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4>Unidades Extraídas ({importPreview.data.units.length})</h4>
                    {importPreview.data.units.map((unit, idx) => (
                      <div key={idx} style={{ padding: '10px', marginTop: '8px', background: '#fff', borderRadius: '4px', borderLeft: '3px solid #0066cc' }}>
                        <strong>Unidad {unit.number || idx + 1}: {unit.name || `Unidad ${idx + 1}`}</strong>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                          Contenidos: {unit.content?.substring(0, 80) || '-'}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Detalles de TPs */}
                {importPreview.data?.practicals && importPreview.data.practicals.length > 0 && (
                  <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4>Trabajos Prácticos Extraídos ({importPreview.data.practicals.length})</h4>
                    {importPreview.data.practicals.map((tp, idx) => (
                      <div key={idx} style={{ padding: '10px', marginTop: '8px', background: '#fff', borderRadius: '4px', borderLeft: '3px solid #ff9900' }}>
                        <strong>TP {tp.number || idx + 1}: {tp.name || `TP ${idx + 1}`}</strong>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                          Objetivo: {tp.objective?.substring(0, 80) || '-'}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COMPETENCIAS CATALOG */}
        {activeMenu === 'competencias' && (
          <div style={styles.section}>
            <h2>Catálogo de Competencias</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div>
                  <h3>Nueva competencia genérica</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input
                      style={styles.input}
                      placeholder="Código"
                      value={catalogFormGeneric.code}
                      onChange={(e) => setCatalogFormGeneric(prev => ({ ...prev, code: e.target.value }))}
                    />
                    <input
                      style={styles.input}
                      placeholder="Descripción"
                      value={catalogFormGeneric.description}
                      onChange={(e) => setCatalogFormGeneric(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <button
                    style={styles.button}
                    onClick={() => addCatalogItem('generic', catalogFormGeneric, setCatalogFormGeneric)}
                    disabled={!activeCareer}
                  >
                    Agregar competencia genérica
                  </button>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <h3>Nueva competencia específica</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input
                      style={styles.input}
                      placeholder="Código"
                      value={catalogFormSpecific.code}
                      onChange={(e) => setCatalogFormSpecific(prev => ({ ...prev, code: e.target.value }))}
                    />
                    <input
                      style={styles.input}
                      placeholder="Descripción"
                      value={catalogFormSpecific.description}
                      onChange={(e) => setCatalogFormSpecific(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <button
                    style={styles.button}
                    onClick={() => addCatalogItem('specific', catalogFormSpecific, setCatalogFormSpecific)}
                    disabled={!activeCareer}
                  >
                    Agregar competencia específica
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h3>Listado genéricas</h3>
                  {!activeCareer ? (
                    <div style={{ color: '#777', fontStyle: 'italic' }}>Selecciona una carrera para ver el catálogo.</div>
                  ) : careerCompetencies.generic.length === 0 ? (
                    <div style={{ color: '#777', fontStyle: 'italic' }}>No hay competencias cargadas.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' }}>
                      <thead>
                        <tr style={{ background: '#0066cc', color: '#fff', borderBottom: '2px solid #ddd' }}>
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setGenericCompetencySort, 'code')}
                          >
                            Código{getSortIndicator(genericCompetencySort, 'code')}
                          </th>
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setGenericCompetencySort, 'description')}
                          >
                            Descripción{getSortIndicator(genericCompetencySort, 'description')}
                          </th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
                        </tr>
                        <tr style={{ background: '#eaf3ff' }}>
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={genericCompetencyFilters.code}
                              onChange={(e) => setGenericCompetencyFilters(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="Buscar"
                            />
                          </th>
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={genericCompetencyFilters.description}
                              onChange={(e) => setGenericCompetencyFilters(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Buscar"
                            />
                          </th>
                          <th style={{ padding: '6px' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {genericCompetenciesFiltered.map((item, idx) => (
                          <tr key={item.id ?? idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {catalogEditId === item.id ? (
                                <input
                                  style={styles.input}
                                  value={catalogEditForm.code}
                                  onChange={(e) => setCatalogEditForm(prev => ({ ...prev, code: e.target.value }))}
                                />
                              ) : (item.code || '-')}
                            </td>
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {catalogEditId === item.id ? (
                                <input
                                  style={styles.input}
                                  value={catalogEditForm.description}
                                  onChange={(e) => setCatalogEditForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                              ) : (item.description || '-')}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {catalogEditId === item.id ? (
                                <>
                                  <button
                                    style={{ ...styles.button, padding: '6px 10px' }}
                                    onClick={() => saveCatalogEdit(item)}
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    style={{ ...styles.button, background: '#999', padding: '6px 10px', marginRight: 0 }}
                                    onClick={cancelCatalogEdit}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                      onClick={() => startCatalogEdit(item)}
                                      disabled={catalogEditId !== null && catalogEditId !== item.id}
                                      title="Editar competencia"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px' }}
                                      onClick={() => loadCatalogUsage(item, 'generic')}
                                      disabled={catalogEditId !== null}
                                      title="Ver propuestas afectadas"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px', marginRight: 0 }}
                                      onClick={() => openDeleteCatalogModal(item)}
                                      disabled={catalogEditId !== null}
                                      title="Eliminar competencia"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h3>Listado específicas</h3>
                  {!activeCareer ? (
                    <div style={{ color: '#777', fontStyle: 'italic' }}>Selecciona una carrera para ver el catálogo.</div>
                  ) : careerCompetencies.specific.length === 0 ? (
                    <div style={{ color: '#777', fontStyle: 'italic' }}>No hay competencias cargadas.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' }}>
                      <thead>
                        <tr style={{ background: '#0066cc', color: '#fff', borderBottom: '2px solid #ddd' }}>
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setSpecificCompetencySort, 'code')}
                          >
                            Código{getSortIndicator(specificCompetencySort, 'code')}
                          </th>
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setSpecificCompetencySort, 'description')}
                          >
                            Descripción{getSortIndicator(specificCompetencySort, 'description')}
                          </th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
                        </tr>
                        <tr style={{ background: '#eaf3ff' }}>
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={specificCompetencyFilters.code}
                              onChange={(e) => setSpecificCompetencyFilters(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="Buscar"
                            />
                          </th>
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={specificCompetencyFilters.description}
                              onChange={(e) => setSpecificCompetencyFilters(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Buscar"
                            />
                          </th>
                          <th style={{ padding: '6px' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {specificCompetenciesFiltered.map((item, idx) => (
                          <tr key={item.id ?? idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {catalogEditId === item.id ? (
                                <input
                                  style={styles.input}
                                  value={catalogEditForm.code}
                                  onChange={(e) => setCatalogEditForm(prev => ({ ...prev, code: e.target.value }))}
                                />
                              ) : (item.code || '-')}
                            </td>
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {catalogEditId === item.id ? (
                                <input
                                  style={styles.input}
                                  value={catalogEditForm.description}
                                  onChange={(e) => setCatalogEditForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                              ) : (item.description || '-')}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {catalogEditId === item.id ? (
                                <>
                                  <button
                                    style={{ ...styles.button, padding: '6px 10px' }}
                                    onClick={() => saveCatalogEdit(item)}
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    style={{ ...styles.button, background: '#999', padding: '6px 10px', marginRight: 0 }}
                                    onClick={cancelCatalogEdit}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                      onClick={() => startCatalogEdit(item)}
                                      disabled={catalogEditId !== null && catalogEditId !== item.id}
                                      title="Editar competencia"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px' }}
                                      onClick={() => loadCatalogUsage(item, 'specific')}
                                      disabled={catalogEditId !== null}
                                      title="Ver propuestas afectadas"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px', marginRight: 0 }}
                                      onClick={() => openDeleteCatalogModal(item)}
                                      disabled={catalogEditId !== null}
                                      title="Eliminar competencia"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {catalogDeleteModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '520px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>Confirmar eliminación</h3>
              <p style={{ marginTop: '8px' }}>
                Vas a eliminar la competencia {catalogDeleteModal.code ? `(${catalogDeleteModal.code})` : ''}.
              </p>
              <div style={{ marginTop: '12px', background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '6px', padding: '10px' }}>
                <strong>Propuestas donde se quitará</strong>
                {catalogDeleteModal.loading ? (
                  <div style={{ marginTop: '8px', color: '#555' }}>Consultando...</div>
                ) : catalogDeleteModal.error ? (
                  <div style={{ marginTop: '8px', color: '#b00020' }}>{catalogDeleteModal.error}</div>
                ) : catalogDeleteModal.items.length === 0 ? (
                  <div style={{ marginTop: '8px', color: '#555' }}>No hay propuestas afectadas.</div>
                ) : (
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                      Total: {catalogDeleteModal.items.length}
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {catalogDeleteModal.items.map((row, idx) => (
                        <div key={`${row.id}-${idx}`}>
                          #{row.id}{row.subject ? ` - ${row.subject}` : ''}{row.career ? ` (${row.career})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  style={{ ...styles.button, background: '#999', marginRight: 0 }}
                  onClick={closeDeleteCatalogModal}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...styles.button, background: '#d32f2f', marginRight: 0 }}
                  onClick={confirmDeleteCatalogItem}
                  disabled={catalogDeleteModal.loading}
                >
                  Confirmar eliminación
                </button>
              </div>
            </div>
          </div>
        )}

        {catalogUsageInfo.itemId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '560px', width: '92%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ marginTop: 0 }}>
                  Propuestas afectadas {catalogUsageInfo.code ? `(${catalogUsageInfo.code})` : ''}
                </h3>
                <button
                  style={{ ...styles.button, background: '#999', padding: '4px 10px', marginRight: 0 }}
                  onClick={clearCatalogUsage}
                >
                  Cerrar
                </button>
              </div>
              {catalogUsageInfo.loading ? (
                <div style={{ marginTop: '8px', color: '#555' }}>Consultando...</div>
              ) : catalogUsageInfo.error ? (
                <div style={{ marginTop: '8px', color: '#b00020' }}>{catalogUsageInfo.error}</div>
              ) : (catalogUsageInfo.items.length === 0 && catalogUsageInfo.ids.length === 0) ? (
                <div style={{ marginTop: '8px', color: '#555' }}>No hay propuestas afectadas.</div>
              ) : (
                <div style={{ marginTop: '8px', maxHeight: '320px', overflowY: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                    Total: {catalogUsageInfo.items.length || catalogUsageInfo.ids.length}
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {(catalogUsageInfo.items.length ? catalogUsageInfo.items : catalogUsageInfo.ids.map((id) => ({ id }))).map((row, idx) => (
                      <div key={`${row.id}-${idx}`}>
                        #{row.id}{row.subject ? ` - ${row.subject}` : ''}{row.career ? ` (${row.career})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {teacherUsageInfo.teacherId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '560px', width: '92%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ marginTop: 0 }}>
                  Propuestas afectadas {teacherUsageInfo.name ? `(${teacherUsageInfo.name})` : ''}
                </h3>
                <button
                  style={{ ...styles.button, background: '#999', padding: '4px 10px', marginRight: 0 }}
                  onClick={clearTeacherUsage}
                >
                  Cerrar
                </button>
              </div>
              {teacherUsageInfo.loading ? (
                <div style={{ marginTop: '8px', color: '#555' }}>Consultando...</div>
              ) : teacherUsageInfo.error ? (
                <div style={{ marginTop: '8px', color: '#b00020' }}>{teacherUsageInfo.error}</div>
              ) : (teacherUsageInfo.items.length === 0 && teacherUsageInfo.ids.length === 0) ? (
                <div style={{ marginTop: '8px', color: '#555' }}>No hay propuestas afectadas.</div>
              ) : (
                <div style={{ marginTop: '8px', maxHeight: '320px', overflowY: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                    Total: {teacherUsageInfo.items.length || teacherUsageInfo.ids.length}
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {(teacherUsageInfo.items.length ? teacherUsageInfo.items : teacherUsageInfo.ids.map((id) => ({ id }))).map((row, idx) => (
                      <div key={`${row.id}-${idx}`}>
                        #{row.id}{row.subject ? ` - ${row.subject}` : ''}{row.career ? ` (${row.career})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {teacherDeleteModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '520px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>Confirmar eliminación</h3>
              <p style={{ marginTop: '8px' }}>
                Vas a eliminar el docente {teacherDeleteModal.name ? `(${teacherDeleteModal.name})` : ''}.
              </p>
              <div style={{ marginTop: '12px', background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '6px', padding: '10px' }}>
                <strong>Propuestas donde se quitará</strong>
                {teacherDeleteModal.loading ? (
                  <div style={{ marginTop: '8px', color: '#555' }}>Consultando...</div>
                ) : teacherDeleteModal.error ? (
                  <div style={{ marginTop: '8px', color: '#b00020' }}>{teacherDeleteModal.error}</div>
                ) : teacherDeleteModal.items.length === 0 ? (
                  <div style={{ marginTop: '8px', color: '#555' }}>No hay propuestas afectadas.</div>
                ) : (
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                      Total: {teacherDeleteModal.items.length}
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {teacherDeleteModal.items.map((row, idx) => (
                        <div key={`${row.id}-${idx}`}>
                          #{row.id}{row.subject ? ` - ${row.subject}` : ''}{row.career ? ` (${row.career})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  style={{ ...styles.button, background: '#999', marginRight: 0 }}
                  onClick={closeDeleteTeacherModal}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...styles.button, background: '#d32f2f', marginRight: 0 }}
                  onClick={confirmDeleteTeacher}
                  disabled={teacherDeleteModal.loading}
                >
                  Confirmar eliminación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCENTES */}
        {activeMenu === 'docentes' && (
          <div style={styles.section}>
            <h2>Gestión de Docentes</h2>
            {!activeCareer ? (
              <div style={{ color: '#777', fontStyle: 'italic' }}>Selecciona una carrera para ver el catálogo.</div>
            ) : (
              <>
                <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '16px' }}>
                  <h3>Nuevo docente</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 2fr', gap: '12px' }}>
                    <input
                      style={styles.input}
                      placeholder="Nombre"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    />
                    <select
                      style={styles.input}
                      value={teacherForm.category}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option>TITULAR</option>
                      <option>ASOCIADO</option>
                      <option>ADJUNTO</option>
                      <option>JTP</option>
                      <option>AYUDANTE 1º</option>
                    </select>
                    <select
                      style={{
                        ...styles.input,
                        borderColor: teacherForm.dedication === 'Sin Informar' ? '#d32f2f' : styles.input.borderColor
                      }}
                      value={teacherForm.dedication}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, dedication: e.target.value }))}
                    >
                      <option>Sin Informar</option>
                      <option>Simple</option>
                      <option>Parcial</option>
                      <option>Parcial + Simple</option>
                      <option>Exclusivo</option>
                    </select>
                    <input
                      style={styles.input}
                      placeholder="Correo"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <button style={styles.button} onClick={addTeacher}>
                    Agregar docente
                  </button>
                </div>
                <div style={{ marginTop: '12px', marginBottom: '12px', color: '#555' }}>
                  Docentes de la carrera {activeCareer}. Los que dicen "Sin Informar" deben completar dedicación.
                </div>
                {teacherCatalogLoading ? (
                  <div style={{ color: '#555' }}>Cargando docentes...</div>
                ) : teacherCatalogError ? (
                  <div style={{ color: '#b00020' }}>{teacherCatalogError}</div>
                ) : teacherCatalogItems.length === 0 ? (
                  <div style={{ color: '#777', fontStyle: 'italic' }}>No hay docentes cargados.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' }}>
                    <thead>
                      <tr style={{ background: '#0066cc', color: '#fff', borderBottom: '2px solid #ddd' }}>
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'name')}
                        >
                          Nombre{getSortIndicator(teacherTableSort, 'name')}
                        </th>
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'category')}
                        >
                          Categoría{getSortIndicator(teacherTableSort, 'category')}
                        </th>
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'dedication')}
                        >
                          Dedicación{getSortIndicator(teacherTableSort, 'dedication')}
                        </th>
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'email')}
                        >
                          Email{getSortIndicator(teacherTableSort, 'email')}
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
                      </tr>
                      <tr style={{ background: '#eaf3ff' }}>
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            value={teacherTableFilters.name}
                            onChange={(e) => setTeacherTableFilters(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            value={teacherTableFilters.category}
                            onChange={(e) => setTeacherTableFilters(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            value={teacherTableFilters.dedication}
                            onChange={(e) => setTeacherTableFilters(prev => ({ ...prev, dedication: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            value={teacherTableFilters.email}
                            onChange={(e) => setTeacherTableFilters(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {teacherCatalogFiltered.map((teacher, idx) => (
                        <tr key={teacher.id ?? idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          {teacherEditId === teacher.id ? (
                            <>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                                <input
                                  style={styles.input}
                                  value={teacherEditForm.name}
                                  onChange={(e) => setTeacherEditForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                                />
                              </td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                                <select
                                  style={styles.input}
                                  value={teacherEditForm.category}
                                  onChange={(e) => setTeacherEditForm(prev => ({ ...prev, category: e.target.value }))}
                                >
                                  <option>TITULAR</option>
                                  <option>ASOCIADO</option>
                                  <option>ADJUNTO</option>
                                  <option>JTP</option>
                                  <option>AYUDANTE 1º</option>
                                </select>
                              </td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                                <select
                                  style={{
                                    ...styles.input,
                                    borderColor: teacherEditForm.dedication === 'Sin Informar' ? '#d32f2f' : styles.input.borderColor
                                  }}
                                  value={teacherEditForm.dedication}
                                  onChange={(e) => setTeacherEditForm(prev => ({ ...prev, dedication: e.target.value }))}
                                >
                                  <option>Sin Informar</option>
                                  <option>Simple</option>
                                  <option>Parcial</option>
                                  <option>Parcial + Simple</option>
                                  <option>Exclusivo</option>
                                </select>
                              </td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                                <input
                                  style={styles.input}
                                  value={teacherEditForm.email}
                                  onChange={(e) => setTeacherEditForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px' }}
                                    onClick={() => saveTeacherEdit(teacher)}
                                    title="Guardar cambios"
                                  >
                                    💾
                                  </button>
                                  <button
                                    style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px', marginRight: 0 }}
                                    onClick={cancelTeacherEdit}
                                    title="Cancelar"
                                  >
                                    ✖️
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.name || '-'}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.category || '-'}</td>
                              <td style={{
                                padding: '8px',
                                borderRight: '1px solid #ddd',
                                color: (!teacher.dedication || teacher.dedication === 'Sin Informar') ? '#d32f2f' : undefined,
                                fontWeight: (!teacher.dedication || teacher.dedication === 'Sin Informar') ? '600' : undefined
                              }}>
                                {teacher.dedication || 'Sin Informar'}
                              </td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.email || '-'}</td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px' }}
                                    onClick={() => loadTeacherUsage(teacher)}
                                    title="Ver propuestas afectadas"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px' }}
                                    onClick={() => startTeacherEdit(teacher)}
                                    title="Editar docente"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', padding: '6px 10px', marginRight: 0 }}
                                    onClick={() => openDeleteTeacherModal(teacher)}
                                    title="Eliminar docente"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </>
            )}
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
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <strong>Genericas:</strong> {buildCompetencyText(viewProposal.generic_competencies_items || []) || viewProposal.generic_competencies || '-'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <strong>Especificas:</strong> {buildCompetencyText(viewProposal.specific_competencies_items || []) || viewProposal.specific_competencies || 'No Aplica'}
                </div>
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

export default App
