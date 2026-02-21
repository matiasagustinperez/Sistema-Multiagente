import React, { useState, useEffect, useRef } from 'react'
import logoMacau from '../Logo MACAU.png'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8011').replace(/\/$/, '')
const LEGACY_API_BASE_URLS = [
  'http://localhost:8001',
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8011',
  'http://localhost:8011'
]

const careerOptions = [
  'Ingeniería en Sistemas',
  'Ingeniería Mecatrónica',
  'Licenciatura en Sistemas'
]

const App = () => {
  useEffect(() => {
    const nativeFetch = window.fetch.bind(window)
    const replaceLegacyApiBase = (url) => {
      let nextUrl = url
      LEGACY_API_BASE_URLS.forEach((legacyBase) => {
        if (legacyBase && nextUrl.includes(legacyBase)) {
          nextUrl = nextUrl.replace(legacyBase, API_BASE_URL)
        }
      })
      return nextUrl
    }
    window.fetch = (input, init) => {
      if (typeof input === 'string') {
        return nativeFetch(replaceLegacyApiBase(input), init)
      }
      if (input instanceof Request) {
        const nextUrl = replaceLegacyApiBase(input.url)
        if (nextUrl !== input.url) {
          const nextRequest = new Request(nextUrl, input)
          return nativeFetch(nextRequest, init)
        }
      }
      return nativeFetch(input, init)
    }
    return () => {
      window.fetch = nativeFetch
    }
  }, [])

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
  const [importGdocUrl, setImportGdocUrl] = useState('')
  const [viewProposalLinkIssue, setViewProposalLinkIssue] = useState('')
  const [viewProposalGdocInput, setViewProposalGdocInput] = useState('')
  const [viewProposalGdocError, setViewProposalGdocError] = useState('')
  const [viewProposalGdocLoading, setViewProposalGdocLoading] = useState(false)
  const [viewProposalCreateGdocLoading, setViewProposalCreateGdocLoading] = useState(false)
  const [viewProposalGdocUpdateAvailable, setViewProposalGdocUpdateAvailable] = useState(false)
  const [viewProposalGdocUpdateMessage, setViewProposalGdocUpdateMessage] = useState('')
  const [viewProposalGdocSyncLoading, setViewProposalGdocSyncLoading] = useState(false)
  const [viewProposalGdocValidateLoading, setViewProposalGdocValidateLoading] = useState(false)
  const [showGdocDiff, setShowGdocDiff] = useState(false)
  const [gdocDiffLoading, setGdocDiffLoading] = useState(false)
  const [gdocDiffData, setGdocDiffData] = useState(null)
  const [gdocDiffSelection, setGdocDiffSelection] = useState({})
  const [showLocalDiff, setShowLocalDiff] = useState(false)
  const [localDiffData, setLocalDiffData] = useState(null)
  const [localDiffSelection, setLocalDiffSelection] = useState({})
  const [gdocStatusById, setGdocStatusById] = useState({})
  const [gdocStatusLoading, setGdocStatusLoading] = useState(false)
  const [lastGdocCheckAt, setLastGdocCheckAt] = useState(null)

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
  const [createInDriveOnSave, setCreateInDriveOnSave] = useState(false)
  const [isCreatingInDrive, setIsCreatingInDrive] = useState(false)
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
    observaciones: '',
    gdocUrl: '',
    sourceType: ''
  }

  const [formData, setFormData] = useState(emptyFormData)
  
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('')
  const [proposals, setProposals] = useState([])
  const [careerCompetencies, setCareerCompetencies] = useState({ generic: [], specific: [] })
  const [catalogCareer, setCatalogCareer] = useState('')
  const [catalogType, setCatalogType] = useState('generic')
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogFormGeneric, setCatalogFormGeneric] = useState({ code: '', description: '', plan_name: '' })
  const [catalogFormSpecific, setCatalogFormSpecific] = useState({ code: '', description: '', plan_name: '' })
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
  const [driveSettingsByCareer, setDriveSettingsByCareer] = useState({})
  const [driveSettingsForm, setDriveSettingsForm] = useState({
    rootFolderUrl: '',
    pdfFolderUrl: ''
  })
  const [driveSettingsError, setDriveSettingsError] = useState('')
  const [driveSettingsEditing, setDriveSettingsEditing] = useState(false)
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
  const [teacherFocusTargetId, setTeacherFocusTargetId] = useState(null)
  const [teacherHighlightId, setTeacherHighlightId] = useState(null)
  const teacherAnchorRefs = useRef({})
  const [teacherViewMode, setTeacherViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'table'
    const saved = window.localStorage.getItem('teacherViewMode')
    return saved === 'cards' ? 'cards' : 'table'
  })
  const [docenteAutocompleteId, setDocenteAutocompleteId] = useState(null)
  const [completeProposalFilters, setCompleteProposalFilters] = useState({
    id: '',
    subject: '',
    academic_year: '',
    year_of_career: '',
    quarter: '',
    plan: '',
    updated_at: '',
    status: '',
    drive: ''
  })
  const [completeProposalSort, setCompleteProposalSort] = useState({ key: '', direction: 'asc' })
  const [pendingProposalFilters, setPendingProposalFilters] = useState({
    id: '',
    subject: '',
    academic_year: '',
    year_of_career: '',
    quarter: '',
    plan: '',
    updated_at: '',
    status: '',
    drive: ''
  })
  const [pendingProposalSort, setPendingProposalSort] = useState({ key: '', direction: 'asc' })
  const [teacherTableFilters, setTeacherTableFilters] = useState({
    name: '',
    category: '',
    dedication: '',
    email: '',
    subject_count: ''
  })
  const [teacherTableSort, setTeacherTableSort] = useState({ key: '', direction: 'asc' })
  const [genericCompetencyFilters, setGenericCompetencyFilters] = useState({ code: '', description: '', plan: '' })
  const [genericCompetencySort, setGenericCompetencySort] = useState({ key: '', direction: 'asc' })
  const [specificCompetencyFilters, setSpecificCompetencyFilters] = useState({ code: '', description: '', plan: '' })
  const [specificCompetencySort, setSpecificCompetencySort] = useState({ key: '', direction: 'asc' })
  const [controlOnlyWithErrors, setControlOnlyWithErrors] = useState(false)
  const [controlFailureFilter, setControlFailureFilter] = useState('all')
  const [controlSubjectFilter, setControlSubjectFilter] = useState('')
  const [intelligentNameFilter, setIntelligentNameFilter] = useState('')
  const [intelligentQuickStatusFilter, setIntelligentQuickStatusFilter] = useState('all')
  const [intelligentIaStatusFilter, setIntelligentIaStatusFilter] = useState('all')
  const [controlProposalDetailsById, setControlProposalDetailsById] = useState({})
  const [controlDetailsLoading, setControlDetailsLoading] = useState(false)
  const [controlPanelMode, setControlPanelMode] = useState('quick')
  const [intelligentControls, setIntelligentControls] = useState([])
  const [intelligentControlsLoading, setIntelligentControlsLoading] = useState(false)
  const [intelligentControlsError, setIntelligentControlsError] = useState('')
  const [intelligentControlDraft, setIntelligentControlDraft] = useState({ topic: 'teaching_team', name: '', instruction: '', is_active: true, associated_topics: [] })
  const [editingIntelligentControlId, setEditingIntelligentControlId] = useState(null)
  const [editingIntelligentControlDraft, setEditingIntelligentControlDraft] = useState({ topic: '', name: '', instruction: '', is_active: true, associated_topics: [] })
  const [intelligentResultsByProposal, setIntelligentResultsByProposal] = useState({})
  const [intelligentResultsLoading, setIntelligentResultsLoading] = useState(false)
  const [runningIntelligentByProposal, setRunningIntelligentByProposal] = useState({})
  const [intelligentRunMode, setIntelligentRunMode] = useState('delfin')
  const [docenteIntelligentRunMode, setDocenteIntelligentRunMode] = useState('guepardo')
  const [intelligentModeSettingsLoading, setIntelligentModeSettingsLoading] = useState(false)
  const [intelligentModeSettingsSaving, setIntelligentModeSettingsSaving] = useState(false)
  const [intelligentModelOptions, setIntelligentModelOptions] = useState([
    'gpt-5.2',
    'gpt-5.2-pro',
    'gpt-5.1',
    'gpt-5-mini',
    'gpt-4o',
    'o3',
    'o3-pro',
    'o4-mini',
    'gpt-4.1',
    'gpt-4.1-mini'
  ])
  const [intelligentModeConfig, setIntelligentModeConfig] = useState({
    guepardo: { model: 'gpt-4o-mini', temperature: 0.15, max_tokens: 420 },
    delfin: { model: 'gpt-4o-mini', temperature: 0.1, max_tokens: 500 },
    ballena: { model: 'gpt-4o', temperature: 0.1, max_tokens: 700 }
  })
  const [showIntelligentRunModal, setShowIntelligentRunModal] = useState(false)
  const [intelligentRunModalData, setIntelligentRunModalData] = useState(null)
  const intelligentRunAbortRef = useRef({})
  const intelligentRunProgressPollerRef = useRef({})
  const intelligentConfigCardRef = useRef(null)
  const [selectedIntelligentProposalIds, setSelectedIntelligentProposalIds] = useState([])
  const [batchIntelligentRun, setBatchIntelligentRun] = useState({
    isRunning: false,
    isCancelling: false,
    total: 0,
    completed: 0,
    currentProposalId: null,
    items: {}
  })
  const batchIntelligentAbortRef = useRef({ cancelled: false })
  const [docenteControlActivation, setDocenteControlActivation] = useState({})
  const [viewProposalIntelligentSummary, setViewProposalIntelligentSummary] = useState(null)
  const [viewProposalIntelligentLoading, setViewProposalIntelligentLoading] = useState(false)
  const [editingSuggestionByResultId, setEditingSuggestionByResultId] = useState({})
  const [viewProposalOriginMenu, setViewProposalOriginMenu] = useState('')
  const [viewProposalExpandedSuggestions, setViewProposalExpandedSuggestions] = useState({})
  const [competencyPlanMappedByCareer, setCompetencyPlanMappedByCareer] = useState({})
  const variantPaletteRegistry = useRef({
    year: { index: 0, map: {} },
    plan: { index: 0, map: {} }
  })
  
  // Study Plan state
  const [planName, setPlanName] = useState('')
  const [planYears, setPlanYears] = useState([])
  const [planError, setPlanError] = useState('')
  const [savedPlans, setSavedPlans] = useState({}) // {careerId: [{id, name, is_active, terms}]}
  const [activePlanId, setActivePlanId] = useState(null)
  const [selectedPlanFilterId, setSelectedPlanFilterId] = useState(null)
  const [planMode, setPlanMode] = useState('list') // 'view', 'edit', 'new', 'list'
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [correlativeMode, setCorrelativeMode] = useState(false)
  const [selectedSubjectForCorrelatives, setSelectedSubjectForCorrelatives] = useState(null)
  const [confirmActivePlanId, setConfirmActivePlanId] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [showDuplicatePlanModal, setShowDuplicatePlanModal] = useState(false)
  const [duplicatePlanTarget, setDuplicatePlanTarget] = useState(null)
  const [duplicatePlanName, setDuplicatePlanName] = useState('')
  const [duplicatePlanError, setDuplicatePlanError] = useState('')
  const [showPlanNameDuplicateModal, setShowPlanNameDuplicateModal] = useState(false)
  const [planNameDuplicateValue, setPlanNameDuplicateValue] = useState('')
  const [planNameDuplicateAcknowledged, setPlanNameDuplicateAcknowledged] = useState('')
  const [isPlanNameDuplicate, setIsPlanNameDuplicate] = useState(false)
  const [subjectAutocompleteQuery, setSubjectAutocompleteQuery] = useState('')
  const [subjectAutocompleteFocus, setSubjectAutocompleteFocus] = useState(false)

  // Matriz de Tributación state
  const [showMatrizModal, setShowMatrizModal] = useState(false)
  const [matrizData, setMatrizData] = useState(null)
  const [matrixColumnFilters, setMatrixColumnFilters] = useState({})

  const capsuleBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
    whiteSpace: 'nowrap'
  }

  const capsuleVariants = {
    default: { background: '#eef2ff', color: '#1e3a8a', border: '1px solid #c7d2fe' }
  }

  const dedicationCapsuleStyles = {
    'SIN INFORMAR': { background: 'rgba(244, 63, 94, 0.15)', color: '#b91c1c', border: '1px solid rgba(244, 63, 94, 0.4)' },
    SIMPLE: { background: 'rgba(14, 165, 233, 0.15)', color: '#0c4a6e', border: '1px solid rgba(14, 165, 233, 0.4)' },
    PARCIAL: { background: 'rgba(59, 130, 246, 0.18)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.5)' },
    'PARCIAL + SIMPLE': { background: 'rgba(147, 51, 234, 0.16)', color: '#6d28d9', border: '1px solid rgba(147, 51, 234, 0.4)' },
    EXCLUSIVO: { background: 'rgba(16, 185, 129, 0.18)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.4)' },
    default: capsuleVariants.default
  }

  const categoryCapsuleStyles = {
    TITULAR: { background: 'rgba(16, 185, 129, 0.18)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.4)' },
    ASOCIADO: { background: 'rgba(59, 130, 246, 0.18)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.4)' },
    ADJUNTO: { background: 'rgba(251, 191, 36, 0.18)', color: '#b45309', border: '1px solid rgba(250, 204, 21, 0.4)' },
    JTP: { background: 'rgba(14, 165, 233, 0.15)', color: '#0c4a6e', border: '1px solid rgba(14, 165, 233, 0.4)' },
    'AYUDANTE 1º': { background: 'rgba(236, 72, 153, 0.15)', color: '#9d174d', border: '1px solid rgba(236, 72, 153, 0.4)' },
    default: capsuleVariants.default
  }

  const quarterCapsuleStyles = {
    '1ER CUATRIMESTRE': { background: 'rgba(59, 130, 246, 0.18)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.4)' },
    '2DO CUATRIMESTRE': { background: 'rgba(251, 191, 36, 0.2)', color: '#92400e', border: '1px solid rgba(251, 191, 36, 0.5)' },
    ANUAL: { background: 'rgba(168, 85, 247, 0.18)', color: '#6b21a8', border: '1px solid rgba(168, 85, 247, 0.4)' },
    default: capsuleVariants.default
  }

  const variantPalettePools = {
    year: [
      { background: '#e0f2fe', color: '#0c4a6e', border: '1px solid #bae6fd' },
      { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' },
      { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
      { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
      { background: '#ede9fe', color: '#312e81', border: '1px solid #c4b5fd' },
      { background: '#f0fdf4', color: '#047857', border: '1px solid #bbf7d0' }
    ],
    plan: [
      { background: '#ecfeff', color: '#0f766e', border: '1px solid #5eead4' },
      { background: '#f9f5ff', color: '#6d28d9', border: '1px solid #c4b5fd' },
      { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' },
      { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' },
      { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
      { background: '#f0fdfa', color: '#115e59', border: '1px solid #6ee7b7' },
      { background: '#e0f2fe', color: '#0c4a6e', border: '1px solid #bae6fd' },
      { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }
    ],
    default: [
      { background: '#eef2ff', color: '#1e3a8a', border: '1px solid #c7d2fe' },
      { background: '#ecfdf5', color: '#0f766e', border: '1px solid #86efac' },
      { background: '#fff1f2', color: '#831843', border: '1px solid #fecdd3' },
      { background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8' },
      { background: '#fefce8', color: '#a16207', border: '1px solid #fde047' }
    ]
  }

  const normalizeLabelKey = (value) => {
    const normalized = String(value ?? 'Sin valor').trim()
    return normalized || 'Sin valor'
  }

  const getDynamicVariantStyle = (variant, valueLabel) => {
    const normalized = normalizeLabelKey(valueLabel)
    const registry = variantPaletteRegistry.current[variant]
    if (!registry) {
      return capsuleVariants.default
    }
    if (registry.map[normalized]) {
      return registry.map[normalized]
    }
    const pool = variantPalettePools[variant] || variantPalettePools.default
    const selected = pool[registry.index % pool.length]
    registry.map[normalized] = selected
    registry.index += 1
    return selected
  }

  const getCapsuleVariantStyle = (variant, value) => {
    const labelKey = normalizeLabelKey(value)
    switch (variant) {
      case 'dedication':
        return dedicationCapsuleStyles[labelKey.toUpperCase()] || dedicationCapsuleStyles.default
      case 'category':
        return categoryCapsuleStyles[labelKey.toUpperCase()] || categoryCapsuleStyles.default
      case 'year':
        return getDynamicVariantStyle('year', labelKey)
      case 'plan':
        return getDynamicVariantStyle('plan', labelKey)
      case 'quarter':
        return quarterCapsuleStyles[labelKey.toUpperCase()] || quarterCapsuleStyles.default
      default:
        return capsuleVariants.default
    }
  }

  const renderCapsule = (value, variant = 'default', overrides = {}) => {
    const displayValue = value ?? '-'
    const variantStyle = getCapsuleVariantStyle(variant, value)
    return (
      <span style={{ ...capsuleBaseStyle, ...capsuleVariants.default, ...variantStyle, ...overrides }}>
        {displayValue}
      </span>
    )
  }

  const statusCapsuleStyles = {
    CREADA: { background: 'rgba(16, 185, 129, 0.18)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.4)' },
    ENPROCESO: { background: 'rgba(249, 115, 22, 0.18)', color: '#b45309', border: '1px solid rgba(249, 115, 22, 0.45)' },
    IMPORTADA: { background: 'rgba(59, 130, 246, 0.18)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.45)' },
    REVISADA: { background: 'rgba(14, 165, 233, 0.18)', color: '#0c4a6e', border: '1px solid rgba(14, 165, 233, 0.45)' },
    APROBADA: { background: 'rgba(34, 197, 94, 0.18)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.45)' },
    RECHAZADA: { background: 'rgba(239, 68, 68, 0.18)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.45)' },
    DEFAULT: { background: '#f5f5f5', color: '#374151', border: '1px solid #d1d5db' }
  }

  const normalizeStatusKey = (status) => (String(status || '').replace(/\s+/g, '')).toUpperCase()

  const renderStatusCapsule = (status) => {
    const variantStyle = statusCapsuleStyles[normalizeStatusKey(status)] || statusCapsuleStyles.DEFAULT
    return (
      <span style={{ ...capsuleBaseStyle, ...variantStyle }}>
        {status || 'Sin estado'}
      </span>
    )
  }

  const isPlanNameTaken = (career, name, excludeId = null) => {
    const normalized = String(name || '').trim().toLowerCase()
    if (!career || !normalized) return false
    return (savedPlans[career] || []).some((plan) => {
      if (excludeId != null && plan.id === excludeId) return false
      return String(plan.name || '').trim().toLowerCase() === normalized
    })
  }

  useEffect(() => {
    const isDuplicate = isPlanNameTaken(activeCareer, planName, editingPlanId)
    setIsPlanNameDuplicate(isDuplicate)
    if (!isDuplicate) {
      setPlanNameDuplicateAcknowledged('')
      setPlanNameDuplicateValue('')
    }
  }, [activeCareer, planName, editingPlanId, savedPlans])

  useEffect(() => {
    const normalizedPlanName = String(planName || '').trim().toLowerCase()
    if (!normalizedPlanName || !isPlanNameDuplicate) return
    if (normalizedPlanName === planNameDuplicateAcknowledged) return
    setPlanNameDuplicateValue(String(planName || '').trim())
    setShowPlanNameDuplicateModal(true)
  }, [isPlanNameDuplicate, planName, planNameDuplicateAcknowledged])

  const toggleMatrixColumnFilter = (key, level) => {
    setMatrixColumnFilters((prev) => {
      const current = new Set(prev[key] || [])
      if (current.has(level)) {
        current.delete(level)
      } else {
        current.add(level)
      }
      return { ...prev, [key]: Array.from(current) }
    })
  }

  const clearMatrixColumnFilter = (key) => {
    setMatrixColumnFilters((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const getMatrixColumnLevels = (type, compKey) => {
    if (!matrizData) return []
    const levels = new Set()
    matrizData.subjects.forEach((subject) => {
      const subjectMatrix = matrizData.matrix[subject.id]
      if (!subjectMatrix) return
      const level = type === 'generic'
        ? subjectMatrix.generic[compKey]
        : subjectMatrix.specific[compKey]
      if (level !== undefined && level !== null) levels.add(level)
    })
    return Array.from(levels).sort((a, b) => a - b)
  }

  const getMatrixLevel = (subjectMatrix, type, compKey) => {
    if (!subjectMatrix) return 0
    if (type === 'generic') {
      return subjectMatrix.generic[compKey] ?? 0
    }
    return subjectMatrix.specific[compKey] ?? 0
  }

  const matrixActiveFilters = matrizData
    ? Object.entries(matrixColumnFilters).filter(([, levels]) => Array.isArray(levels) && levels.length > 0)
    : []

  const matrixFilteredSubjects = matrizData
    ? (matrixActiveFilters.length === 0
      ? matrizData.subjects
      : matrizData.subjects.filter((subject) => {
          const subjectMatrix = matrizData.matrix[subject.id]
          return matrixActiveFilters.every(([filterKey, levels]) => {
            const [prefix, compKey] = filterKey.split(':')
            const type = prefix === 'gen' ? 'generic' : 'specific'
            const level = getMatrixLevel(subjectMatrix, type, compKey)
            return levels.includes(level)
          })
        }))
    : []

  useEffect(() => {
    fetchProposals()
    fetchTeacherTotals()
  }, [])

  // Cargar planes de estudios guardados (backend)
  useEffect(() => {
    if (!activeCareer) {
      setSelectedPlanFilterId(null)
      setPlanMode('list')
      setPlanName('')
      setPlanYears([])
      setEditingPlanId(null)
      setPlanError('')
      return
    }

    fetchStudyPlans(activeCareer)
    setPlanName('')
    setPlanYears([])
    setEditingPlanId(null)
    setPlanError('')
  }, [activeCareer])

  // Reset all form data when changing menus
  const handleMenuChange = (menu) => {
    setActiveMenu(menu)
    setFormData(emptyFormData)
    setProposalsMode(null)
    setSubjectAutocompleteQuery('')
    setSubjectAutocompleteFocus(false)
    // Reset Plan de Estudios state
    setPlanName('')
    setPlanYears([])
    setPlanError('')
    setPlanMode('list')
    setSelectedSubjectForCorrelatives(null)
    setCorrelativeMode(false)
    setShowMatrizModal(false)
    setMatrizData(null)
    setMatrixColumnFilters({})
    // Reset Competencias state
    setCatalogCareer('')
    setCatalogType('generic')
    setCatalogItems([])
    setCatalogFormGeneric({ code: '', description: '', plan_name: '' })
    setCatalogFormSpecific({ code: '', description: '', plan_name: '' })
    setCatalogEditId(null)
    setCatalogEditForm({ code: '', description: '' })
    // Reset Docentes state
    setTeacherForm({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
    setTeacherEditId(null)
    setTeacherEditForm({ name: '', category: 'AYUDANTE 1º', dedication: 'Sin Informar', email: '' })
    setMatrixColumnFilters({})
  }

  useEffect(() => {
    if (activeCareer) {
      localStorage.setItem('activeCareer', activeCareer)
    } else {
      localStorage.removeItem('activeCareer')
    }
  }, [activeCareer])

  useEffect(() => {
    localStorage.setItem('teacherViewMode', teacherViewMode)
  }, [teacherViewMode])

  useEffect(() => {
    if (!teacherFocusTargetId) {
      return
    }
    const anchor = teacherAnchorRefs.current[String(teacherFocusTargetId)]
    if (!anchor) {
      return
    }
    anchor.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTeacherHighlightId(teacherFocusTargetId)
    const clearTimer = setTimeout(() => {
      setTeacherHighlightId((prev) => (prev === teacherFocusTargetId ? null : prev))
    }, 3000)
    setTeacherFocusTargetId(null)
    return () => clearTimeout(clearTimer)
  }, [teacherFocusTargetId, teacherCatalogItems, teacherViewMode])

  useEffect(() => {
    setSelectedTeacherId(null)
    setSelectedTeacherName('')
    setSubjectAutocompleteQuery('')
    setSubjectAutocompleteFocus(false)
  }, [activeCareer])

  useEffect(() => {
    if (viewRole !== 'docente') {
      setSelectedTeacherId(null)
      setSelectedTeacherName('')
    }
  }, [viewRole])

  useEffect(() => {
    if (activeMenu !== 'control-propuestas' || controlPanelMode !== 'intelligent') {
      setSelectedIntelligentProposalIds([])
      setBatchIntelligentRun({
        isRunning: false,
        isCancelling: false,
        total: 0,
        completed: 0,
        currentProposalId: null,
        items: {}
      })
    }
  }, [activeMenu, controlPanelMode])

  useEffect(() => {
    if (viewRole !== 'docente') {
      return
    }
    const allowedMenus = ['propuestas', 'control-propuestas', 'resoluciones']
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
    if (viewRole !== 'docente') {
      setDocenteControlActivation({})
      return
    }
    setDocenteControlActivation({})
  }, [viewRole, activeCareer, selectedTeacherId, selectedTeacherName])

  useEffect(() => {
    if (!activeCareer) {
      return
    }
    if (editingProposalId) {
      return
    }
    const plan = getActivePlan(activeCareer)
    setFormData(prev => ({
      ...prev,
      carrera: activeCareer,
      plan: plan ? plan.name : '',
      asignatura: '', // Reset subject when career changes
      ciclo: '',
      cuatrimestre: ''
    }))
  }, [activeCareer])

  useEffect(() => {
    if (activeCareer) {
      fetchCareerCompetencies(activeCareer)
    }
  }, [activeCareer])

  // Reload matriz when competencies change and modal is open
  useEffect(() => {
    if (showMatrizModal && editingPlanId && activeCareer) {
      const matriz = buildCompetencyMatrix(activeCareer, editingPlanId)
      setMatrizData(matriz)
    }
  }, [careerCompetencies, showMatrizModal, editingPlanId, activeCareer])

  useEffect(() => {
    const stored = localStorage.getItem('driveSettingsByCareer')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (!parsed || typeof parsed !== 'object') return
      const parsedKeys = Object.keys(parsed)
      const isLegacyFormat = parsedKeys.length > 0 && parsedKeys.every((key) => careerOptions.includes(key))
      if (isLegacyFormat) {
        const migrated = {}
        parsedKeys.forEach((career) => {
          const entry = parsed[career] || {}
          migrated[`${career}::__career__`] = {
            rootFolderUrl: entry.rootFolderUrl || '',
            pdfFolderUrl: entry.pdfFolderUrl || ''
          }
        })
        setDriveSettingsByCareer(migrated)
        localStorage.setItem('driveSettingsByCareer', JSON.stringify(migrated))
      } else {
        setDriveSettingsByCareer(parsed)
      }
    } catch (err) {
      console.warn('No se pudieron leer las configuraciones de Drive', err)
    }
  }, [])

  useEffect(() => {
    if (!activeCareer) {
      return
    }
    const planName = getDriveSettingsPlanName(activeCareer, selectedPlanFilterId)
    const queryPlan = planName ? `&plan_name=${encodeURIComponent(planName)}` : ''
    const loadDriveSettings = async () => {
      try {
        const res = await fetch(`http://localhost:8001/drive-settings?career=${encodeURIComponent(activeCareer)}${queryPlan}`)
        if (!res.ok) {
          if (res.status === 404) {
            return
          }
          throw new Error(`Error ${res.status}`)
        }
        const data = await res.json()
        if (!data) {
          return
        }
        setDriveSettingsByCareer((prev) => {
          const key = getDriveSettingsKey(activeCareer, planName)
          const next = {
            ...prev,
            [key]: {
              rootFolderUrl: data.root_folder_url || '',
              pdfFolderUrl: data.pdf_folder_url || ''
            }
          }
          localStorage.setItem('driveSettingsByCareer', JSON.stringify(next))
          return next
        })
      } catch (err) {
        console.warn('No se pudieron cargar las configuraciones de Drive', err)
      }
    }
    loadDriveSettings()
  }, [activeCareer, selectedPlanFilterId])

  useEffect(() => {
    if (!activeCareer) {
      setDriveSettingsForm({ rootFolderUrl: '', pdfFolderUrl: '' })
      setDriveSettingsEditing(false)
      return
    }
    const planName = getDriveSettingsPlanName(activeCareer, selectedPlanFilterId)
    const key = getDriveSettingsKey(activeCareer, planName)
    const saved = driveSettingsByCareer[key] || {}
    setDriveSettingsForm({
      rootFolderUrl: saved.rootFolderUrl || '',
      pdfFolderUrl: saved.pdfFolderUrl || ''
    })
    const hasSaved = !!(saved.rootFolderUrl || saved.pdfFolderUrl)
    setDriveSettingsEditing(!hasSaved)
    setDriveSettingsError('')
  }, [activeCareer, selectedPlanFilterId, driveSettingsByCareer])

  useEffect(() => {
    if (!activeCareer) {
      return
    }
    const planName = getCatalogPlanName(activeCareer)
    if (planName) {
      setCatalogFormGeneric((prev) => ({ ...prev, plan_name: prev.plan_name || planName }))
      setCatalogFormSpecific((prev) => ({ ...prev, plan_name: prev.plan_name || planName }))
    }
  }, [activeCareer, selectedPlanFilterId, savedPlans])

  useEffect(() => {
    if (activeCareer) {
      fetchTeachers(activeCareer)
    } else {
      setTeacherCatalogItems([])
      setTeacherCatalogError('')
    }
  }, [activeCareer])

  // Load plan when entering create proposal mode
  useEffect(() => {
    if (proposalsMode === 'create' && activeCareer && !editingProposalId) {
      const plan = getActivePlan(activeCareer)
      if (plan && !formData.plan) {
        updateFormData('plan', plan.name)
      }
    }
  }, [proposalsMode, activeCareer, editingProposalId, formData.plan])

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

  const normalizeCorrelativeSelections = (subject) => {
    if (!subject) {
      return subject
    }
    const correlativesToEnroll = Array.isArray(subject.correlatives_to_enroll)
      ? subject.correlatives_to_enroll
      : []
    const correlativesToExam = Array.isArray(subject.correlatives_to_exam)
      ? subject.correlatives_to_exam
      : []
    const examSet = new Set(correlativesToExam)
    return {
      ...subject,
      correlatives_to_enroll: correlativesToEnroll.filter((name) => !examSet.has(name)),
      correlatives_to_exam: correlativesToExam
    }
  }

  const hasDuplicateSubjectName = (years, name, excludeId = null) => {
    const target = String(name || '').trim().toLowerCase()
    if (!target) {
      return false
    }
    return (years || []).some((year) =>
      (year.terms || []).some((term) =>
        (term.subjects || []).some((subject) => {
          if (excludeId !== null && subject.id === excludeId) {
            return false
          }
          return String(subject.name || '').trim().toLowerCase() === target
        })
      )
    )
  }

  // Función auxiliar para renderizar tarjetas de términos
  const renderTermCard = (term, year, layout) => (
    <div
      style={{
        padding: '10px',
        background: '#f9fafb',
        borderRadius: '6px',
        borderLeft: '3px solid #0066cc',
        width: layout === 'full' ? '100%' : 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>{term.name}</strong>
        <button
          style={{ ...styles.button, padding: '4px 8px', fontSize: '12px', marginRight: 0, background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
          title="Eliminar cuatrimestre"
          onClick={() => {
            const updatedYears = planYears.map((y) => {
              if (y.id === year.id) {
                return {
                  ...y,
                  terms: y.terms.filter((t) => t.id !== term.id)
                }
              }
              return y
            })
            setPlanYears(updatedYears)
            setPlanError('')
          }}
        >
          🗑️
        </button>
      </div>

      {term.subjects && term.subjects.length > 0 && (
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <thead>
            <tr style={{ background: '#eaf3ff' }}>
              <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Asignatura</th>
              <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {term.subjects.map((subject) => (
              <React.Fragment key={subject.id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '4px', fontSize: '11px' }}>
                    {subject.name}
                    {subject.associated_proposals && subject.associated_proposals.length > 0 && (
                      <div style={{ marginTop: '2px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {subject.associated_proposals.map((prop) => (
                          <span
                            key={prop.id}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: '#dde7f4',
                              borderRadius: '3px',
                              color: '#0066cc'
                            }}
                            title={`Propuesta: ${prop.title}`}
                          >
                            📋 {prop.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!(year.year === 1 && term.name === '1er Cuatrimestre') && (
                        <button
                          style={{ ...styles.button, padding: '2px 4px', fontSize: '10px', marginRight: 0, background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                          title="Editar correlativas"
                          onClick={() => {
                            setSelectedSubjectForCorrelatives(normalizeCorrelativeSelections(subject))
                            setCorrelativeMode(true)
                          }}
                        >
                          🔗
                        </button>
                      )}
                      <button
                        style={{ ...styles.button, padding: '2px 4px', fontSize: '10px', marginRight: 0, background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                        title="Renombrar asignatura"
                        onClick={() => {
                          const nextName = window.prompt('Nuevo nombre de asignatura', subject.name || '')
                          if (!nextName || !nextName.trim()) {
                            return
                          }
                          if (hasDuplicateSubjectName(planYears, nextName, subject.id)) {
                            setPlanError('Ya existe una asignatura con ese nombre en el plan')
                            setTimeout(() => setPlanError(''), 3000)
                            return
                          }
                          const updatedYears = planYears.map((y) => {
                            if (y.id === year.id) {
                              return {
                                ...y,
                                terms: y.terms.map((t) => {
                                  if (t.id === term.id) {
                                    return {
                                      ...t,
                                      subjects: t.subjects.map((s) =>
                                        s.id === subject.id ? { ...s, name: nextName.trim() } : s
                                      )
                                    }
                                  }
                                  return t
                                })
                              }
                            }
                            return y
                          })
                          setPlanYears(updatedYears)
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        style={{ ...styles.button, padding: '2px 4px', fontSize: '10px', marginRight: 0, background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                        title="Eliminar asignatura"
                        onClick={() => {
                          const updatedYears = planYears.map((y) => {
                            if (y.id === year.id) {
                              return {
                                ...y,
                                terms: y.terms.map((t) => {
                                  if (t.id === term.id) {
                                    return {
                                      ...t,
                                      subjects: t.subjects.filter((s) => s.id !== subject.id)
                                    }
                                  }
                                  return t
                                })
                              }
                            }
                            return y
                          })
                          setPlanYears(updatedYears)
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
        <input
          style={styles.input}
          placeholder="Asignatura"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              if (hasDuplicateSubjectName(planYears, e.target.value)) {
                setPlanError('Ya existe una asignatura con ese nombre en el plan')
                setTimeout(() => setPlanError(''), 3000)
                return
              }
              const updatedYears = planYears.map((y) => {
                if (y.id === year.id) {
                  return {
                    ...y,
                    terms: y.terms.map((t) => {
                      if (t.id === term.id) {
                        return {
                          ...t,
                          subjects: [...(t.subjects || []), { id: Date.now(), name: e.target.value.trim() }]
                        }
                      }
                      return t
                    })
                  }
                }
                return y
              })
              setPlanYears(updatedYears)
              e.target.value = ''
            }
          }}
        />
        <button
          style={{ ...styles.button, marginRight: 0, padding: '6px 12px', fontSize: '12px' }}
          onClick={(e) => {
            const input = e.target.previousElementSibling
            if (input && input.value.trim()) {
              if (hasDuplicateSubjectName(planYears, input.value)) {
                setPlanError('Ya existe una asignatura con ese nombre en el plan')
                setTimeout(() => setPlanError(''), 3000)
                return
              }
              const updatedYears = planYears.map((y) => {
                if (y.id === year.id) {
                  return {
                    ...y,
                    terms: y.terms.map((t) => {
                      if (t.id === term.id) {
                        return {
                          ...t,
                          subjects: [...(t.subjects || []), { id: Date.now(), name: input.value.trim() }]
                        }
                      }
                      return t
                    })
                  }
                }
                return y
              })
              setPlanYears(updatedYears)
              input.value = ''
            }
          }}
        >
          + Agregar
        </button>
      </div>
    </div>
  )

  const fetchProposals = async () => {
    try {
      const res = await fetch('http://localhost:8001/proposals')
      const data = await res.json()
      setProposals(data)
      return data
    } catch (err) {
      console.error('Error fetching proposals:', err)
    }
    return []
  }

  const fetchGdocStatuses = async (items) => {
    const target = Array.isArray(items) ? items : proposals
    const ids = Array.from(new Set(target.filter((p) => p?.gdoc_url).map((p) => p.id).filter((id) => id != null)))
    if (ids.length === 0) {
      return
    }
    try {
      setGdocStatusLoading(true)
      const res = await fetch('http://localhost:8001/proposals/gdoc-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo verificar el estado de los enlaces')
      }
      setGdocStatusById((prev) => ({ ...prev, ...(data.statuses || {}) }))
      setLastGdocCheckAt(Date.now())
    } catch (err) {
      console.error('Error checking gdoc statuses:', err)
    } finally {
      setGdocStatusLoading(false)
    }
  }

  const getGdocStatusTargets = (items) => {
    if (!Array.isArray(items) || items.length === 0) return []
    const normalizedCareer = normalizeCareer(activeCareer)
    const docenteMode = viewRole === 'docente'
    const teacherSelected = !!selectedTeacherId
    return items.filter((proposal) => {
      if (!proposal?.gdoc_url) return false
      if (normalizedCareer && normalizeCareer(proposal.career) !== normalizedCareer) return false
      if (docenteMode) {
        if (!teacherSelected) return false
        return proposalHasTeacher(proposal, selectedTeacherId, selectedTeacherName)
      }
      return true
    })
  }

  const handleManualGdocRefresh = async () => {
    const targets = getGdocStatusTargets(proposals)
    if (!targets.length) {
      setStatusMsg('No hay propuestas vinculadas a Google Docs para sincronizar en el contexto actual.')
      setStatusType('info')
      return
    }
    await fetchGdocStatuses(targets)
    setStatusMsg('Estado de Google Docs actualizado.')
    setStatusType('success')
  }

  const getProposalGdocStatus = (proposal) => {
    // Si no tiene link de GDoc
    if (!proposal.gdoc_url) {
      return proposal.source_type === 'gdoc' ? 'lost' : 'missing'
    }

    // Confiar SOLO en el status del backend - no comparar timestamps
    const backendStatus = gdocStatusById[proposal.id]?.status || proposal.gdoc_status
    if (backendStatus && backendStatus !== 'ok') {
      return backendStatus
    }

    // Default: sincronizado (solo confiar en status explícito del backend)
    return 'ok'
  }

  const getProposalGdocBadge = (proposal) => {
    const status = getProposalGdocStatus(proposal)
    const stylesByStatus = {
      ok: { label: 'Sincronizado', background: 'rgba(16, 185, 129, 0.18)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.4)' },
      missing: { label: 'Sin vincular', background: 'rgba(107, 114, 128, 0.18)', color: '#374151', border: '1px solid rgba(107, 114, 128, 0.4)' },
      lost: { label: 'Link perdido', background: 'rgba(239, 68, 68, 0.18)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.45)' },
      updated: { label: 'Actualizado', background: 'rgba(59, 130, 246, 0.18)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.45)' },
      unsent: { label: 'Cambios sin enviar', background: 'rgba(251, 191, 36, 0.18)', color: '#b45309', border: '1px solid rgba(251, 191, 36, 0.4)' }
    }
    return stylesByStatus[status] || stylesByStatus.missing
  }

  const renderDriveCapsule = (proposal) => {
    const badge = getProposalGdocBadge(proposal)
    return renderCapsule(badge.label, 'default', {
      background: badge.background,
      color: badge.color,
      border: badge.border
    })
  }

  useEffect(() => {
    if (activeMenu !== 'propuestas') return
    if (!proposals || proposals.length === 0) return
    const targets = getGdocStatusTargets(proposals)
    if (targets.length === 0) return
    fetchGdocStatuses(targets)
  }, [activeMenu, proposalsMode, proposals, activeCareer, viewRole, selectedTeacherId, selectedTeacherName])

  useEffect(() => {
    if (activeMenu !== 'propuestas') return undefined
    const refreshMs = 8000
    const timer = setInterval(() => {
      const targets = getGdocStatusTargets(proposals)
      if (!targets.length) return
      if (gdocStatusLoading) return
      if (lastGdocCheckAt && Date.now() - lastGdocCheckAt < refreshMs) return
      fetchGdocStatuses(targets)
    }, refreshMs)
    return () => clearInterval(timer)
  }, [activeMenu, proposals, activeCareer, viewRole, selectedTeacherId, selectedTeacherName, gdocStatusLoading, lastGdocCheckAt])

  const mapCompetenciesToPlans = async (career) => {
    if (!career || competencyPlanMappedByCareer[career]) {
      return
    }
    try {
      await fetch(`http://localhost:8001/competencies/map-plans?career=${encodeURIComponent(career)}`, {
        method: 'POST'
      })
    } catch (err) {
      console.error('Error mapping competencies to plans:', err)
    } finally {
      setCompetencyPlanMappedByCareer((prev) => ({ ...prev, [career]: true }))
    }
  }

  const getCatalogPlanName = (career) => {
    const selectedPlan = selectedPlanFilterId ? getPlanById(career, selectedPlanFilterId) : null
    const activePlan = getActivePlan(career)
    return selectedPlan?.name || activePlan?.name || ''
  }

  const filterCompetenciesByPlan = (items, planName, career) => {
    if (!planName) return items
    return items.filter((item) => planMatches(item.plan_name || '', planName, career))
  }

  const fetchCareerCompetencies = async (career) => {
    if (!career) {
      setCareerCompetencies({ generic: [], specific: [] })
      return
    }
    try {
      await mapCompetenciesToPlans(career)
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
    const planName = String(form.plan_name || getCatalogPlanName(careerValue)).trim()
    if (!careerValue || !form.code || !form.description || !planName) {
      setStatusMsg('Completa carrera activa, plan, código y descripción')
      setStatusType('error')
      return
    }
    const existing = catalogItems.find(item =>
      item.code?.trim().toLowerCase() === form.code.trim().toLowerCase() &&
      item.competency_type === type &&
      (item.plan_name || '').trim().toLowerCase() === planName.toLowerCase()
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
          plan_name: planName,
          competency_type: type,
          code: form.code,
          description: form.description
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setForm({ code: '', description: '', plan_name: planName })
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

  const getDriveSettingsKey = (career, planName) => {
    if (!career) return ''
    const normalizedPlan = String(planName || '').trim()
    return `${career}::${normalizedPlan || '__career__'}`
  }

  const getDriveSettingsPlanName = (career, planId) => {
    if (!career) return ''
    if (!planId) return ''
    const plan = getPlanById(career, planId)
    return plan?.name || ''
  }

  const normalizeDriveUrl = (value) => {
    const raw = String(value || '').trim()
    if (!raw) {
      return ''
    }
    if (/^https?:\/\//i.test(raw)) {
      return raw
    }
    if (/^drive\.google\.com/i.test(raw)) {
      return `https://${raw}`
    }
    return raw
  }

  const openDriveUrl = (value) => {
    const url = normalizeDriveUrl(value)
    if (!url) {
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      setDriveSettingsError('Ingresa una URL valida de Drive')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const openProposalGdocUrl = (value) => {
    const url = normalizeDriveUrl(value)
    if (!url) {
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      setStatusMsg('El enlace de Google Docs no es válido')
      setStatusType('error')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const linkProposalGdoc = async (proposalId) => {
    if (!proposalId) {
      return
    }
    const normalized = normalizeDriveUrl(viewProposalGdocInput)
    if (!normalized || !/^https?:\/\//i.test(normalized)) {
      setViewProposalGdocError('Ingresa una URL válida de Google Docs o Drive.')
      return
    }
    try {
      setViewProposalGdocLoading(true)
      setViewProposalGdocError('')
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/link-gdoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo validar el enlace')
      }
      setViewProposal((prev) => (prev ? { ...prev, gdoc_url: data.gdoc_url || normalized, source_type: 'gdoc' } : prev))
      setViewProposalLinkIssue('Enlace vinculado y validado correctamente.')
      setViewProposalGdocError('')
      setViewProposalGdocUpdateAvailable(false)
      setViewProposalGdocUpdateMessage('')
      setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
      fetchProposals()
    } catch (err) {
      setViewProposalGdocError(err.message || 'No se pudo validar el enlace')
    } finally {
      setViewProposalGdocLoading(false)
    }
  }

  const createAndLinkProposalGdoc = async (proposalId) => {
    if (!proposalId) {
      return
    }
    try {
      setViewProposalCreateGdocLoading(true)
      setViewProposalGdocError('')
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/create-gdoc`, {
        method: 'POST'
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo crear el documento en Drive')
      }
      setViewProposal(data)
      setViewProposalGdocInput(data.gdoc_url || '')
      setViewProposalLinkIssue('Documento creado en Drive y vinculado correctamente.')
      setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
      fetchProposals()
    } catch (err) {
      const message = err?.message === 'Failed to fetch'
        ? 'No se pudo conectar al backend. Verifica que esté levantado.'
        : (err?.message || 'No se pudo crear y vincular el documento')
      setViewProposalGdocError(message)
    } finally {
      setViewProposalCreateGdocLoading(false)
    }
  }

  const syncProposalGdoc = async (proposalId) => {
    if (!proposalId) {
      return
    }
    try {
      setViewProposalGdocSyncLoading(true)
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/sync-gdoc`, {
        method: 'POST'
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo sincronizar el documento')
      }
      setViewProposal(data)
      setViewProposalLinkIssue('Documento sincronizado desde Google Docs.')
      setViewProposalGdocUpdateAvailable(false)
      setViewProposalGdocUpdateMessage('')
      setShowGdocDiff(false)
      setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
      fetchProposals()
    } catch (err) {
      setViewProposalGdocUpdateMessage(err.message || 'No se pudo sincronizar el documento')
    } finally {
      setViewProposalGdocSyncLoading(false)
    }
  }

  const validateProposalGdocRemote = async (proposalId, { openDiffOnUpdated = false, notifyOnOk = false } = {}) => {
    if (!proposalId) {
      return null
    }
    try {
      setViewProposalGdocValidateLoading(true)
      const validationRes = await fetch(`http://localhost:8001/proposals/${proposalId}/validate-gdoc`, {
        method: 'POST'
      })
      const validation = await validationRes.json().catch(() => ({}))
      if (!validationRes.ok) {
        throw new Error(validation.detail || 'No se pudo validar el estado remoto en Google Docs')
      }

      if (validation.status === 'updated') {
        setViewProposalGdocUpdateAvailable(true)
        setViewProposalGdocUpdateMessage(validation.message || 'Documento actualizado en Google Docs.')
        setViewProposalLinkIssue('')
        setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'updated' } }))
        if (openDiffOnUpdated) {
          openGdocDiff(proposalId)
        }
      } else if (validation.status === 'ok') {
        setViewProposalGdocUpdateAvailable(false)
        setViewProposalGdocUpdateMessage('')
        setViewProposalLinkIssue('')
        setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
        if (notifyOnOk) {
          setStatusMsg(validation.message || 'No hay cambios remotos en Google Docs.')
          setStatusType('success')
        }
      } else if (validation.status) {
        setViewProposal((prev) => (prev ? { ...prev, gdoc_url: null } : prev))
        setViewProposalLinkIssue(validation.message || 'El enlace de Google Docs no está disponible.')
        setViewProposalGdocUpdateAvailable(false)
        setViewProposalGdocUpdateMessage('')
        setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'lost' } }))
        fetchProposals()
      }

      return validation
    } catch (err) {
      const message = err?.message || 'No se pudo validar el estado remoto en Google Docs'
      setViewProposalGdocError(message)
      if (notifyOnOk) {
        setStatusMsg(message)
        setStatusType('error')
      }
      return null
    } finally {
      setViewProposalGdocValidateLoading(false)
    }
  }

  const acceptLatestGdocChanges = async (proposalId) => {
    if (!proposalId) {
      return
    }
    const res = await fetch(`http://localhost:8001/proposals/${proposalId}/gdoc-accept-latest`, {
      method: 'POST'
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.detail || 'No se pudo marcar la versión actual como revisada')
    }
    setViewProposal((prev) => {
      if (!prev || prev.id !== proposalId) return prev
      return {
        ...prev,
        gdoc_hash: data.gdoc_hash || prev.gdoc_hash,
        gdoc_status: 'ok'
      }
    })
    setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
  }

  const openGdocDiff = async (proposalId) => {
    if (!proposalId) {
      return
    }
    try {
      setGdocDiffLoading(true)
      setShowGdocDiff(true)
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/gdoc-diff`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo obtener la comparación')
      }
      setGdocDiffData(data)
      const initialSelection = {}
      Object.entries(data.changes || {}).forEach(([key, change]) => {
        initialSelection[key] = !change?.review_required
      })
      setGdocDiffSelection(initialSelection)
      if (!data.changes || Object.keys(data.changes).length === 0) {
        setShowGdocDiff(false)
        setViewProposalGdocUpdateAvailable(false)
        setViewProposalGdocUpdateMessage('')
        setGdocStatusById((prev) => ({ ...prev, [proposalId]: { status: 'ok' } }))
      }
    } catch (err) {
      setViewProposalGdocUpdateMessage(err.message || 'No se pudo obtener la comparación')
    } finally {
      setGdocDiffLoading(false)
    }
  }

  const normalizeUnitsForPatch = (items = []) => {
    if (!Array.isArray(items)) return []
    return items
      .map((unit, idx) => ({
        id: unit?.id ?? idx + 1,
        name: String(unit?.name || unit?.nombre || '').trim(),
        content: String(unit?.content || unit?.contenidos || unit?.contents || '').trim(),
        bibliography_basic: String(unit?.bibliography_basic || unit?.bib_basica || unit?.bib_basic || unit?.bibliografia_basica || '').trim(),
        bibliography_complementary: String(unit?.bibliography_complementary || unit?.bib_complementaria || unit?.bib_comp || unit?.bibliografia_complementaria || '').trim()
      }))
      .filter((unit) => isNonEmptyText(unit.name) || isNonEmptyText(unit.content) || isNonEmptyText(unit.bibliography_basic) || isNonEmptyText(unit.bibliography_complementary))
  }

  const buildPatchFromDiff = (latest, selection) => {
    const patch = {}
    if (selection.importance) {
      patch.fundamentals_part1 = latest.importance || ''
    }
    if (selection.professional_profile) {
      patch.fundamentals_part2 = latest.professional_profile || ''
    }
    if (selection.learning_outcomes) {
      patch.learning_outcomes = (latest.learning_outcomes || []).map((lo, idx) => ({
        id: lo.id ?? idx + 1,
        description: lo.description || lo.descripcion || '',
        observable_verb: lo.observable_verb || ''
      }))
    }
    if (selection.units) {
      const normalizedUnits = normalizeUnitsForPatch(latest.units || [])
      if (normalizedUnits.length > 0) {
        patch.units = normalizedUnits
      }
    }
    if (selection.practicals) {
      patch.practicals = (latest.practicals || []).map((tp, idx) => ({
        id: tp.id ?? idx + 1,
        number: tp.number || tp.numero || String(idx + 1),
        name: tp.name || '',
        objective: tp.objective || '',
        activities: tp.activities || '',
        materials: tp.materials || '',
        scope: tp.scope || ''
      }))
    }
    if (selection.methodology) {
      patch.methodology = latest.methodology || ''
    }
    if (selection.evaluation) {
      patch.evaluation = latest.evaluation || ''
    }
    if (selection.generic_competencies) {
      patch.generic_competencies_items = latest.generic_competencies || []
    }
    if (selection.specific_competencies) {
      patch.specific_competencies_items = latest.specific_competencies || []
    }
    return patch
  }

  const applyGdocSelectedChanges = async () => {
    if (!viewProposal?.id || !gdocDiffData?.latest) {
      return
    }
    try {
      const reviewOnlyKeys = ['minimum_content', 'teaching_team']
      const selectedReviewOnly = reviewOnlyKeys.filter((key) => !!gdocDiffSelection[key])
      const patch = buildPatchFromDiff(gdocDiffData.latest, gdocDiffSelection)
      const unitsSelected = !!gdocDiffSelection.units
      const unitsReady = Array.isArray(patch.units) && patch.units.length > 0
      if (unitsSelected && !unitsReady) {
        setViewProposalGdocUpdateMessage('Se detectaron cambios en Unidades, pero no se pudo construir un bloque válido para guardar (contenido/bibliografía vacíos o formato no compatible).')
      }
      if (Object.keys(patch).length === 0) {
        if (selectedReviewOnly.length > 0) {
          setViewProposalGdocUpdateMessage('Los bloques sensibles seleccionados son solo de revisión y no se aplican automáticamente.')
        } else {
          setViewProposalGdocUpdateMessage('No hay cambios seleccionados para aplicar.')
        }
        return
      }
      const res = await fetch(`http://localhost:8001/proposals/${viewProposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudieron aplicar los cambios')
      }
      setViewProposal(data)
      setViewProposalLinkIssue('Cambios aplicados desde Google Docs.')
      if (selectedReviewOnly.length > 0) {
        setViewProposalGdocUpdateMessage('Se aplicaron los cambios permitidos. Los bloques sensibles quedan marcados para revisión manual.')
      }
      await acceptLatestGdocChanges(viewProposal.id)
      setShowGdocDiff(false)
      setViewProposalGdocUpdateAvailable(false)
      if (selectedReviewOnly.length === 0) {
        setViewProposalGdocUpdateMessage('')
      }
      fetchProposals()
    } catch (err) {
      setViewProposalGdocUpdateMessage(err.message || 'No se pudieron aplicar los cambios')
    }
  }

  const closeGdocDiff = () => {
    setShowGdocDiff(false)
    setViewProposalLinkIssue('Revisión cerrada. Los cambios de Google Docs quedan pendientes hasta sincronizar o marcar como revisados.')
  }

  const unlinkProposalGdoc = async (proposalId) => {
    if (!proposalId) {
      return
    }
    try {
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/unlink-gdoc`, {
        method: 'POST'
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setViewProposal((prev) => (prev ? { ...prev, gdoc_url: null } : prev))
      setViewProposalLinkIssue('Se desvinculó el enlace de Google Docs.')
      fetchProposals()
    } catch (err) {
      setStatusMsg('Error al desvincular enlace: ' + err.message)
      setStatusType('error')
    }
  }

  const openLocalDiff = async (proposalId) => {
    if (!proposalId) {
      return
    }
    try {
      setGdocDiffLoading(true)
      setShowLocalDiff(true)
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/local-diff`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo obtener los cambios locales')
      }
      setLocalDiffData(data)
      const initialSelection = {}
      Object.entries(data.changes || {}).forEach(([key, change]) => {
        initialSelection[key] = true // Por defecto, seleccionar todos los cambios locales
      })
      setLocalDiffSelection(initialSelection)
      if (!data.changes || Object.keys(data.changes).length === 0) {
        setShowLocalDiff(false)
        setStatusMsg('No hay cambios locales para enviar a Google Docs')
        setStatusType('info')
      }
    } catch (err) {
      setStatusMsg(err.message || 'No se pudo obtener los cambios locales')
      setStatusType('error')
    } finally {
      setGdocDiffLoading(false)
    }
  }

  const closeLocalDiff = () => {
    setShowLocalDiff(false)
    setLocalDiffData(null)
    setLocalDiffSelection({})
  }

  const pushProposalToGdoc = async () => {
    if (!viewProposal?.id || !localDiffData?.changes) {
      return
    }
    try {
      setGdocDiffLoading(true)
      const changesToApply = localDiffSelection
      const res = await fetch(`http://localhost:8001/proposals/${viewProposal.id}/push-to-gdoc-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes_to_apply: changesToApply })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || data.message || `Error ${res.status}`)
      }
      
      closeLocalDiff()
      
      // Refrescar los datos de la propuesta después del push exitoso
      await loadProposals()
      
      // Construir mensaje de éxito con detalles de los campos actualizados
      const fieldsText = data.updated_fields && data.updated_fields.length > 0
        ? ` Campos actualizados: ${data.updated_fields.join(', ')}.`
        : ''
      
      setStatusMsg(`✓ Cambios aplicados a Google Docs correctamente.${fieldsText}`)
      setStatusType('success')
      
    } catch (err) {
      setStatusMsg(err.message || 'Error al aplicar cambios a Google Docs')
      setStatusType('error')
    } finally {
      setGdocDiffLoading(false)
    }
  }

  const saveDriveSettings = async () => {
    if (!activeCareer) {
      setDriveSettingsError('Selecciona una carrera para guardar la configuración')
      return
    }
    const planName = getDriveSettingsPlanName(activeCareer, selectedPlanFilterId)
    const rootFolderUrl = normalizeDriveUrl(driveSettingsForm.rootFolderUrl)
    const pdfFolderUrl = normalizeDriveUrl(driveSettingsForm.pdfFolderUrl)
    if (!rootFolderUrl && !pdfFolderUrl) {
      setDriveSettingsError('Ingresa al menos una carpeta de Drive')
      return
    }
    if (rootFolderUrl && !/^https?:\/\//i.test(rootFolderUrl)) {
      setDriveSettingsError('Ingresa una URL valida de Drive')
      return
    }
    if (pdfFolderUrl && !/^https?:\/\//i.test(pdfFolderUrl)) {
      setDriveSettingsError('Ingresa una URL valida de Drive')
      return
    }
    try {
      const res = await fetch('http://localhost:8001/drive-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career: activeCareer,
          plan_name: planName || null,
          root_folder_url: rootFolderUrl,
          pdf_folder_url: pdfFolderUrl || null
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      const key = getDriveSettingsKey(activeCareer, planName)
      const next = {
        ...driveSettingsByCareer,
        [key]: {
          rootFolderUrl: data.root_folder_url || rootFolderUrl,
          pdfFolderUrl: data.pdf_folder_url || pdfFolderUrl
        }
      }
      setDriveSettingsByCareer(next)
      localStorage.setItem('driveSettingsByCareer', JSON.stringify(next))
      setDriveSettingsError('')
      setStatusMsg('Configuración de Drive guardada')
      setStatusType('success')
      setDriveSettingsEditing(false)
    } catch (err) {
      setDriveSettingsError(err.message || 'No se pudo guardar la configuración')
    }
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
      setTeacherFocusTargetId(teacher.id)
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

  function mapPlanFromStorage(plan) {
    const payload = plan?.payload || {}
    return {
      id: plan.id,
      name: plan.name || payload.name || 'Plan',
      years: Array.isArray(payload.years) ? payload.years : (plan.years || []),
      is_active: plan.is_active === true,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }
  }

  async function fetchStudyPlans(career) {
    if (!career) return
    try {
      const res = await fetch(`http://localhost:8001/study-plans-storage?career=${encodeURIComponent(career)}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      const plans = Array.isArray(data) ? data.map(mapPlanFromStorage) : []
      setSavedPlans((prev) => ({
        ...prev,
        [career]: plans
      }))
      const activePlan = plans.find((p) => p.is_active === true) || plans[0] || null
      setSelectedPlanFilterId(activePlan?.id || null)
      setPlanMode('list')
    } catch (err) {
      console.error('Error loading study plans:', err)
      setSavedPlans((prev) => ({
        ...prev,
        [career]: []
      }))
      setSelectedPlanFilterId(null)
      setPlanMode('list')
      setStatusMsg(`Error al cargar planes: ${err.message || 'desconocido'}`)
      setStatusType('error')
    }
  }

  async function saveStudyPlanToBackend(career, plan) {
    if (!career || !plan) return null
    const payload = {
      career,
      name: plan.name,
      is_active: plan.is_active === true,
      payload: {
        name: plan.name,
        years: plan.years || []
      }
    }
    if (plan.id) payload.id = plan.id

    const res = await fetch('http://localhost:8001/study-plans-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(errorData.detail || `Error ${res.status}`)
    }
    const saved = await res.json()
    await fetchStudyPlans(career)
    return saved
  }

  async function activateStudyPlanBackend(planId) {
    if (!planId) return
    const res = await fetch(`http://localhost:8001/study-plans-storage/${planId}/activate`, {
      method: 'POST'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(errorData.detail || `Error ${res.status}`)
    }
    return res.json()
  }

  async function deleteStudyPlanBackend(planId) {
    if (!planId) return
    const res = await fetch(`http://localhost:8001/study-plans-storage/${planId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(errorData.detail || `Error ${res.status}`)
    }
    return res.json()
  }


  // Get active (vigente) study plan for a career
  const getActivePlan = (career) => {
    if (!career || !savedPlans[career]) return null
    const plans = savedPlans[career]
    return plans.find(p => p.is_active === true) || plans[0] || null
  }

  // Get a specific plan by ID and career
  const getPlanById = (career, planId) => {
    if (!career || !savedPlans[career]) return null
    if (planId === null || planId === undefined || planId === '') return getActivePlan(career)
    const planIdValue = String(planId)
    return savedPlans[career].find(p => String(p.id) === planIdValue) || null
  }

  const getUniquePlanName = (career, baseName) => {
    const plans = savedPlans[career] || []
    const existing = new Set(plans.map((p) => String(p.name || '').trim().toLowerCase()))
    let name = baseName
    let counter = 2
    while (existing.has(String(name).trim().toLowerCase())) {
      name = `${baseName} ${counter}`
      counter += 1
    }
    return name
  }

  const duplicatePlan = async (plan, newName) => {
    if (!activeCareer || !plan) return
    let counter = 0
    const nextId = () => Date.now() + (counter += 1)
    const finalName = newName || getUniquePlanName(activeCareer, `${plan.name} (copia)`)
    const years = (plan.years || []).map((year) => ({
      id: nextId(),
      year: year.year,
      terms: (year.terms || []).map((term) => ({
        id: nextId(),
        name: term.name,
        subjects: (term.subjects || []).map((subject) => ({
          id: nextId(),
          name: subject.name,
          correlatives_to_enroll: [...(subject.correlatives_to_enroll || [])],
          correlatives_to_exam: [...(subject.correlatives_to_exam || [])]
        }))
      }))
    }))
    const newPlan = {
      name: finalName,
      years,
      is_active: false
    }

    try {
      await saveStudyPlanToBackend(activeCareer, newPlan)
      setStatusMsg(`Plan duplicado como "${finalName}"`)
      setStatusType('success')
    } catch (err) {
      setStatusMsg(`Error al duplicar plan: ${err.message || 'desconocido'}`)
      setStatusType('error')
    }
  }

  const openDuplicatePlanModal = (plan) => {
    if (!activeCareer || !plan) return
    const baseName = `${plan.name} (copia)`
    const defaultName = getUniquePlanName(activeCareer, baseName)
    setDuplicatePlanTarget(plan)
    setDuplicatePlanName(defaultName)
    setDuplicatePlanError('')
    setShowDuplicatePlanModal(true)
  }

  // Get all subjects from a specific plan (or active if planId not provided)
  const getPlanSubjects = (career, planId = null) => {
    const plan = planId ? getPlanById(career, planId) : getActivePlan(career)
    if (!plan || !plan.years) return []
    
    const subjects = []
    plan.years.forEach(year => {
      if (year.terms) {
        year.terms.forEach(term => {
          if (term.subjects) {
            term.subjects.forEach(subject => {
              subjects.push({
                id: subject.id,
                name: subject.name,
                year: year.year,
                termName: term.name,
                termId: term.id,
                yearId: year.id,
                ...subject
              })
            })
          }
        })
      }
    })
    return subjects
  }

  // Find subject location in plan (year and term)
  const findSubjectLocation = (career, subjectName) => {
    const subjects = getPlanSubjects(career)
    const targetName = normalizeText(subjectName)
    const subject = subjects.find((s) => normalizeText(s.name) === targetName)
    if (subject) {
      return {
        found: true,
        year: subject.year,
        termName: subject.termName,
        termId: subject.termId,
        yearId: subject.yearId,
        subjectId: subject.id
      }
    }
    return { found: false }
  }

  // Find proposals for a subject (return latest modified)
  const findProposalForSubject = (career, subjectName, planName = '') => {
    const targetName = normalizeText(subjectName)
    const targetCareer = normalizeText(career)
    const matching = proposals.filter(p => {
      if (normalizeText(p.career) !== targetCareer) return false
      if (!p.subject || normalizeText(p.subject) !== targetName) return false
      if (!planName) return true
      const proposalPlan = p.study_plan || p.plan || ''
      return planMatches(proposalPlan, planName, career)
    })
    if (matching.length === 0) return null
    // Return the one with latest updated_at
    return matching.reduce((latest, current) => {
      const latestTime = new Date(latest.updated_at || latest.created_at).getTime()
      const currentTime = new Date(current.updated_at || current.created_at).getTime()
      return currentTime > latestTime ? current : latest
    })
  }

  // Build competency matrix for Plan de Estudios
  const buildCompetencyMatrix = (career, planId = null) => {
    const plan = planId ? getPlanById(career, planId) : getActivePlan(career)
    const planName = plan?.name || ''
    const subjects = getPlanSubjects(career, planId)
    const matrixData = {}

    // Use all career competencies (already loaded in state)
    const filteredGeneric = filterCompetenciesByPlan(careerCompetencies.generic || [], planName, career)
    const filteredSpecific = filterCompetenciesByPlan(careerCompetencies.specific || [], planName, career)
    let genericComps = filteredGeneric.sort((a, b) => 
      (a.code || '').localeCompare(b.code || '')
    )
    let specificComps = filteredSpecific.sort((a, b) => 
      (a.code || '').localeCompare(b.code || '')
    )

    // Debug: Log career competencies
    console.log('Career Competencies:', { generic: genericComps.length, specific: specificComps.length })

    // If no competencies from career, gather from proposals
    if (genericComps.length === 0 || specificComps.length === 0) {
      const genSet = new Map()
      const specSet = new Map()

      subjects.forEach((subject) => {
        const proposal = findProposalForSubject(career, subject.name, planName)
        if (proposal) {
          if (Array.isArray(proposal.generic_competencies_items)) {
            proposal.generic_competencies_items.forEach((comp) => {
              if (comp.code) {
                genSet.set(comp.code, { code: comp.code, description: comp.description || '', level: comp.level || 0 })
              }
            })
          }
          if (Array.isArray(proposal.specific_competencies_items)) {
            proposal.specific_competencies_items.forEach((comp) => {
              if (comp.code) {
                specSet.set(comp.code, { code: comp.code, description: comp.description || '', level: comp.level || 0 })
              }
            })
          }
        }
      })

      if (genericComps.length === 0) {
        genericComps = Array.from(genSet.values()).sort((a, b) => a.code.localeCompare(b.code))
      }
      if (specificComps.length === 0) {
        specificComps = Array.from(specSet.values()).sort((a, b) => a.code.localeCompare(b.code))
      }
      console.log('Gathered Competencies from Proposals:', { generic: genericComps.length, specific: specificComps.length })
    }

    // Process ALL subjects, with or without proposals
    subjects.forEach((subject) => {
      const proposal = findProposalForSubject(career, subject.name, planName)

      // Initialize row with zeros for all competencies
      const subjectRow = {
        name: subject.name,
        year: subject.year,
        termName: subject.termName,
        generic: {},
        specific: {}
      }

      // Initialize all generic competencies to 0
      genericComps.forEach((comp) => {
        const key = comp.code || comp.id
        if (key) subjectRow.generic[key] = 0
      })

      // Initialize all specific competencies to 0
      specificComps.forEach((comp) => {
        const key = comp.code || comp.id
        if (key) subjectRow.specific[key] = 0
      })

      // If proposal exists, fill in the actual levels
      if (proposal) {
        console.log(`Filling proposal for subject: ${subject.name}`, { 
          hasGeneric: !!proposal.generic_competencies_items,
          hasSpecific: !!proposal.specific_competencies_items,
          genericCount: proposal.generic_competencies_items?.length || 0,
          specificCount: proposal.specific_competencies_items?.length || 0
        })

        // Fill generic competencies from proposal
        if (Array.isArray(proposal.generic_competencies_items)) {
          proposal.generic_competencies_items.forEach((comp) => {
            const code = comp.code?.trim() || null
            const level = Number(comp.level) || 0
            
            if (code && code.length > 0) {
              if (subjectRow.generic.hasOwnProperty(code)) {
                subjectRow.generic[code] = level
                console.log(`  ✓ Set ${code} = ${level}`)
              } else {
                console.log(`  ⚠ Code ${code} not found in initialized keys`)
              }
            } else {
              console.log(`  ✗ Invalid code for competency:`, comp)
            }
          })
        }

        // Fill specific competencies from proposal
        if (Array.isArray(proposal.specific_competencies_items)) {
          proposal.specific_competencies_items.forEach((comp) => {
            const code = comp.code?.trim() || null
            const level = Number(comp.level) || 0
            
            if (code && code.length > 0) {
              if (subjectRow.specific.hasOwnProperty(code)) {
                subjectRow.specific[code] = level
                console.log(`  ✓ Set ${code} = ${level}`)
              } else {
                console.log(`  ⚠ Code ${code} not found in initialized keys`)
              }
            } else {
              console.log(`  ✗ Invalid code for competency:`, comp)
            }
          })
        }
      }

      matrixData[subject.id] = subjectRow
    })

    // Sort subjects by year, then by term order
    const termOrder = { 'Anual': 0, '1er Cuatrimestre': 1, '2do Cuatrimestre': 2 }
    const sortedSubjects = subjects.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return (termOrder[a.termName] || 99) - (termOrder[b.termName] || 99)
    })

    // Group subjects by year and term
    const groupedByYear = {}
    sortedSubjects.forEach((subject) => {
      if (!groupedByYear[subject.year]) {
        groupedByYear[subject.year] = {}
      }
      if (!groupedByYear[subject.year][subject.termName]) {
        groupedByYear[subject.year][subject.termName] = []
      }
      groupedByYear[subject.year][subject.termName].push(subject)
    })

    return {
      planName,
      subjects: sortedSubjects,
      competencies: {
        generic: genericComps,
        specific: specificComps
      },
      matrix: matrixData,
      groupedByYear: groupedByYear
    }
  }

  // Get level display text
  const getLevelDisplay = (level) => {
    const levelNum = level || 0
    if (levelNum === 0 || level === null) return '-'
    if (levelNum === 1) return 'Bajo (1)'
    if (levelNum === 2) return 'Medio (2)'
    if (levelNum === 3) return 'Alto (3)'
    return '-'
  }

  // Get subject suggestions for autocomplete
  const getSubjectSuggestions = (query, career) => {
    if (!query || !career) return []
    const term = normalizeSearchText(query)
    const subjects = getPlanSubjects(career)
    return subjects
      .filter(s => normalizeSearchText(s.name).includes(term))
      .slice(0, 8)
  }

  // Auto-populate year and cuatrimestre when subject is selected
  const handleSubjectSelection = (subjectName) => {
    updateFormData('asignatura', subjectName)
    
    if (!activeCareer) return
    
    const plan = getActivePlan(activeCareer)
    if (!plan) return
    
    // Find the location of this subject in the plan
    const location = findSubjectLocation(activeCareer, subjectName)
    if (location.found) {
      // Auto-fill year and quarter
      updateFormData('ciclo', String(location.year))
      updateFormData('cuatrimestre', location.termName)
      // Auto-fill plan name
      updateFormData('plan', plan.name)
    }
  }

  // Create a new subject in the active plan if it doesn't exist
  const ensureSubjectInPlan = async (career, subjectName, year, cuatrimestre) => {
    if (!career || !subjectName) return false
    
    const plan = getActivePlan(career)
    if (!plan) return false
    
    // Check if subject already exists
    const location = findSubjectLocation(career, subjectName)
    if (location.found) return true
    
    // Create year if it doesn't exist
    let targetYear = plan.years?.find(y => y.year === parseInt(year))
    if (!targetYear) {
      targetYear = {
        id: Date.now(),
        year: parseInt(year),
        terms: []
      }
      if (!plan.years) plan.years = []
      plan.years.push(targetYear)
      plan.years.sort((a, b) => a.year - b.year)
    }
    
    // Create term if it doesn't exist
    let targetTerm = targetYear.terms?.find(t => t.name === cuatrimestre)
    if (!targetTerm) {
      targetTerm = {
        id: Date.now() + 1,
        name: cuatrimestre,
        subjects: []
      }
      if (!targetYear.terms) targetYear.terms = []
      targetYear.terms.push(targetTerm)
    }
    
    // Add subject
    if (!targetTerm.subjects) targetTerm.subjects = []
    targetTerm.subjects.push({
      id: Date.now() + 2,
      name: subjectName,
      correlatives_to_enroll: [],
      correlatives_to_exam: []
    })
    
    // Save updated plan
    const updatedPlans = savedPlans[career].map(p => 
      p.is_active ? plan : p
    )
    setSavedPlans(prev => ({
      ...prev,
      [career]: updatedPlans
    }))
    try {
      await saveStudyPlanToBackend(career, {
        id: plan.id,
        name: plan.name,
        years: plan.years,
        is_active: plan.is_active
      })
    } catch (err) {
      setStatusMsg(`Error al guardar plan: ${err.message || 'desconocido'}`)
      setStatusType('error')
      return false
    }

    return true
  }

  // Precarga de propuesta desde Plan de Estudios
  const preloadProposalFromPlan = (career, subjectName, year, cuatrimestre) => {
    const plan = getActivePlan(career)
    if (!plan) return
    
    // Precargar el formulario
    setFormData(prev => ({
      ...prev,
      carrera: career,
      asignatura: subjectName,
      plan: plan.name,
      anio: new Date().getFullYear().toString(), // Año actual
      ciclo: String(year),
      cuatrimestre: cuatrimestre,
      caracter: 'Obligatoria',
      regimen: 'Cuatrimestral'
    }))
    
    // Cambiar a modo create
    setProposalsMode('create')
    
    // Scroll al formulario
    setTimeout(() => {
      if (informacionGeneralRef.current) {
        informacionGeneralRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const normalizeCareer = (value) => {
    if (!value) return ''
    const normalized = String(value).toLowerCase().trim()
    const found = careerOptions.find(opt => opt.toLowerCase().trim() === normalized)
    return found || String(value).trim()
  }

  // Calculate subject statistics for home dashboard
  const getSubjectStatistics = (planId = null) => {
    if (!activeCareer) return { total: 0, withProposals: 0, withoutProposals: 0 }

    let plansToUse = []
    const hasPlanFilter = planId !== null && planId !== undefined && planId !== ''
    if (hasPlanFilter) {
      const selectedPlan = getPlanById(activeCareer, planId)
      if (!selectedPlan || !selectedPlan.years) {
        return { total: 0, withProposals: 0, withoutProposals: 0 }
      }
      plansToUse = [selectedPlan]
    } else {
      plansToUse = (savedPlans[activeCareer] || []).filter((plan) => plan.years)
      if (!plansToUse.length) {
        return { total: 0, withProposals: 0, withoutProposals: 0 }
      }
    }

    const subjects = plansToUse.flatMap((plan) =>
      getPlanSubjects(activeCareer, plan.id).map((subject) => ({
        ...subject,
        planName: plan.name || ''
      }))
    )
    const total = subjects.length

    const withProposals = subjects.filter((subject) => {
      return proposals.some((p) =>
        p.subject?.toLowerCase().trim() === subject.name.toLowerCase().trim() &&
        p.career?.toLowerCase().trim() === activeCareer.toLowerCase().trim() &&
        planMatches(p.study_plan || p.plan || '', subject.planName, activeCareer)
      )
    }).length

    const withoutProposals = total - withProposals

    return { total, withProposals, withoutProposals }
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
        if (code) return `${code} - ${levelLabel}`
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
    setCreateInDriveOnSave(false)
    setIsCreatingInDrive(false)
    setEquipoDocente([{ id: 1, teacherId: null, nombre: '', categoria: 'TITULAR', correo: '' }])
    setEditingProposalId(null)
    setEditingProposalStatus(null)
    setViewProposal(null)
    setViewProposalLinkIssue('')
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

  const getTeachingTeamView = (team = []) => {
    const order = { 'TITULAR': 0, 'ASOCIADO': 1, 'ADJUNTO': 2, 'JTP': 3, 'AYUDANTE 1º': 4 }
    return [...team].sort((a, b) => {
      const left = order[a?.category] ?? 99
      const right = order[b?.category] ?? 99
      if (left !== right) return left - right
      const nameA = (a?.name || '').toLowerCase()
      const nameB = (b?.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
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

  const getTpRaCodesFromRaIds = (raIds) => {
    if (!Array.isArray(raIds) || raIds.length === 0) {
      return []
    }
    const raMap = new Map((formData.resultadosAprendizaje || []).map((ra, idx) => [ra.id, idx + 1]))
    return raIds
      .map((id) => raMap.get(id))
      .filter((idx) => Number.isInteger(idx) && idx > 0)
      .map((idx) => `RA ${idx}`)
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
    
    // Validate required fields: carrera, asignatura, plan, año académico, año en carrera, cuatrimestre, régimen, carácter
    const requiredFields = [
      { field: formData.carrera, name: 'Carrera' },
      { field: formData.asignatura, name: 'Asignatura' },
      { field: formData.plan, name: 'Plan de Estudios' },
      { field: formData.anio, name: 'Año Académico' },
      { field: formData.ciclo, name: 'Año en carrera' },
      { field: formData.cuatrimestre, name: 'Cuatrimestre' },
      { field: formData.regimen, name: 'Régimen' },
      { field: formData.caracter, name: 'Carácter' }
    ]
    
    const missingFields = requiredFields.filter(rf => !rf.field)
    if (missingFields.length > 0) {
      if (!silent) {
        setStatusMsg(`Campos requeridos: ${missingFields.map(f => f.name).join(', ')}`)
        setStatusType('error')
      }
      return
    }

    if (isSaving) {
      return
    }

    // Only ensure subject in plan for NEW proposals, not for existing ones
    if (!isEditing) {
      const subjectEnsured = await ensureSubjectInPlan(careerValue, formData.asignatura, formData.ciclo, formData.cuatrimestre)
      if (!subjectEnsured && !silent) {
        setStatusMsg('No se pudo crear la asignatura en el plan')
        setStatusType('error')
        return
      }
    }

    // Status logic: preserve "Creada" and "Importada", only compute for new or "EnProceso"
    const computedStatus = isEditing
      ? (editingProposalStatus === 'Importada' || editingProposalStatus === 'Creada'
          ? editingProposalStatus
          : (isProposalReadyToCreate() ? 'Creada' : 'EnProceso'))
      : (isProposalReadyToCreate() ? 'Creada' : 'EnProceso')

    const shouldCreateInDrive = createInDriveOnSave && !formData.gdocUrl
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
        ra_codes: getTpRaCodesFromRaIds(tp.raIds),
        objective: getTpObjectiveFromRaIds(tp.raIds) || tp.objetivo || '',
        activities: tp.actividades || '',
        materials: tp.materiales || '',
        scope: tp.ambito || ''
      })),
      methodology: formData.metodologia,
      evaluation: formData.evaluacion,
      bibliography: formData.bibliografia,
      observations: formData.observaciones,
      gdoc_url: formData.gdocUrl || null,
      source_type: formData.sourceType || (formData.gdocUrl ? 'gdoc' : ''),
      create_in_drive: shouldCreateInDrive,
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
      setIsCreatingInDrive(shouldCreateInDrive)
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
      const savedProposalId = data?.id || editingProposalId
      let createdDriveLink = data?.gdoc_url || null

      if (shouldCreateInDrive && !createdDriveLink && savedProposalId) {
        try {
          const driveRes = await fetch(`http://localhost:8001/proposals/${savedProposalId}/create-gdoc`, {
            method: 'POST'
          })
          if (driveRes.ok) {
            const driveData = await driveRes.json()
            createdDriveLink = driveData?.gdoc_url || createdDriveLink
          }
        } catch (driveErr) {
          console.warn('No se pudo crear en Drive tras guardar', driveErr)
        }
      }

      if (createdDriveLink) {
        setFormData((prev) => ({ ...prev, gdocUrl: createdDriveLink, sourceType: 'gdoc' }))
        setCreateInDriveOnSave(false)
      }
      if (!silent) {
        if (shouldCreateInDrive && createdDriveLink) {
          setStatusMsg(isEditing
            ? `Propuesta actualizada y vinculada a Drive - ID: ${data.id}`
            : `Borrador guardado y vinculado a Drive - ID: ${data.id}`)
        } else if (shouldCreateInDrive && !createdDriveLink) {
          setStatusMsg(isEditing
            ? `Propuesta actualizada - ID: ${data.id} (no se pudo vincular en Drive)`
            : `Borrador guardado - ID: ${data.id} (no se pudo vincular en Drive)`)
        } else {
          setStatusMsg(isEditing ? `Propuesta actualizada - ID: ${data.id}` : 'Borrador guardado - ID: ' + data.id)
        }
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
      setIsCreatingInDrive(false)
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
        observaciones: data.observations || '',
        gdocUrl: data.gdoc_url || '',
        sourceType: data.source_type || ''
      })
      setCreateInDriveOnSave(!(data.gdoc_url || '').trim())
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
      setViewProposalOriginMenu(activeMenu || '')
      setViewProposalExpandedSuggestions({})
      setViewProposal(data)
      setViewProposalIntelligentSummary(null)
      setViewProposalIntelligentLoading(true)
      setViewProposalLinkIssue('')
      setViewProposalGdocInput(data.gdoc_url || '')
      setViewProposalGdocError('')
      setViewProposalGdocUpdateAvailable(false)
      setViewProposalGdocUpdateMessage('')
      fetchProposalIntelligentSummary(proposalId)
        .then((summary) => {
          if (summary) {
            setViewProposalIntelligentSummary(summary)
          }
        })
        .finally(() => setViewProposalIntelligentLoading(false))
      if (data.career) {
        setActiveCareer(normalizeCareer(data.career))
      }
      if (data.gdoc_url) {
        await validateProposalGdocRemote(proposalId, { openDiffOnUpdated: true, notifyOnOk: false })
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
        contenidos: unit.contenidos || unit.content || '',
        bibBasica: unit.bib_basica || unit.bibliography_basic || '',
        bibCompl: unit.bib_complementaria || unit.bibliography_complementary || ''
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
      observaciones: data.observations || '',
      gdocUrl: data.gdoc_url || importPreview?.gdoc_url || importGdocUrl || '',
      sourceType: data.gdoc_url || importPreview?.gdoc_url || importGdocUrl ? 'gdoc' : 'docx'
    })
    setCreateInDriveOnSave(!(data.gdoc_url || importPreview?.gdoc_url || importGdocUrl || '').trim())
    
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
  const normalizeText = (value) => {
    const raw = String(value || '')
    const noAccents = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return noAccents.replace(/\s+/g, ' ').trim().toLowerCase()
  }
  const normalizePlanName = (value) => normalizeText(value).replace(/\s+/g, ' ')
  const extractPlanCode = (value) => {
    const text = normalizeText(value)
    if (!text) return ''
    const direct = text.match(/(\d{3})\s*[-\/]\s*(\d{2})/)
    if (direct) return `${direct[1]}-${direct[2]}`
    const compact = text.replace(/\s+/g, '')
    const digits = compact.match(/(\d{3})(\d{2})/)
    if (digits) return `${digits[1]}-${digits[2]}`
    return ''
  }
  const isPlanCodeAmbiguous = (career, targetPlanName) => {
    if (!career) return false
    const targetCode = extractPlanCode(targetPlanName)
    if (!targetCode) return false
    const plans = savedPlans[career] || []
    const matches = plans.filter((plan) => extractPlanCode(plan.name) === targetCode)
    return matches.length > 1
  }
  const planMatches = (proposalPlanValue, targetPlanName, career = null) => {
    if (!targetPlanName) return true
    const proposalNameNormalized = normalizePlanName(proposalPlanValue || '')
    const targetNameNormalized = normalizePlanName(targetPlanName || '')
    if (!proposalNameNormalized || !targetNameNormalized) return false
    if (proposalNameNormalized === targetNameNormalized) return true
    const isAmbiguous = isPlanCodeAmbiguous(career, targetPlanName)
    const proposalPlanCode = extractPlanCode(proposalPlanValue)
    const targetPlanCode = extractPlanCode(targetPlanName)
    if (!isAmbiguous && proposalPlanCode && targetPlanCode && proposalPlanCode === targetPlanCode) return true
    if (isAmbiguous) return false
    if (proposalNameNormalized.includes(targetNameNormalized)) return true
    if (targetNameNormalized.includes(proposalNameNormalized)) return true
    return false
  }
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
  const canSaveDraft = !!(
    (formData.carrera || activeCareer) && 
    formData.asignatura && 
    formData.plan &&
    formData.anio &&
    formData.ciclo &&
    formData.cuatrimestre &&
    formData.regimen &&
    formData.caracter &&
    (!isDocenteView || !!editingProposalId)
  )
  const canSaveEdits = !!(formData.carrera || activeCareer) && !!formData.asignatura && (!isDocenteView || !!editingProposalId)
  const normalizedActiveCareer = normalizeCareer(activeCareer)
  const filteredByCareer = normalizedActiveCareer
    ? proposals.filter((proposal) => normalizeCareer(proposal.career) === normalizedActiveCareer)
    : []
  const selectedPlan = selectedPlanFilterId ? getPlanById(activeCareer, selectedPlanFilterId) : null
  const selectedPlanName = selectedPlan?.name || ''
  const filteredByPlan = selectedPlanName
    ? filteredByCareer.filter((proposal) => {
        const proposalPlan = proposal.study_plan || proposal.plan || ''
        return planMatches(proposalPlan, selectedPlanName, activeCareer)
      })
    : filteredByCareer
  const controlPlansToUse = activeCareer
    ? (selectedPlanName
        ? (selectedPlan ? [selectedPlan] : [])
        : (savedPlans[activeCareer] || []).filter((plan) => plan?.years))
    : []
  const controlSubjectsFromPlans = controlPlansToUse.length
    ? (() => {
        const subjectMap = new Map()
        controlPlansToUse.forEach((plan) => {
          getPlanSubjects(activeCareer, plan.id).forEach((subject) => {
            const key = [
              normalizeText(plan.name || ''),
              normalizeText(subject?.name || ''),
              String(subject?.year || ''),
              normalizeText(subject?.termName || '')
            ].join('|')
            if (!subjectMap.has(key)) {
              subjectMap.set(key, {
                ...subject,
                planName: plan.name || ''
              })
            }
          })
        })
        return Array.from(subjectMap.values())
      })()
    : []
  const controlProposalCandidates = isDocenteView
    ? (hasSelectedTeacher
        ? filteredByPlan.filter((proposal) => proposalHasTeacher(proposal, selectedTeacherId, selectedTeacherName))
        : [])
    : filteredByPlan
  const intelligentTopicOptions = [
    { value: 'teaching_team', label: 'Equipo docente' },
    { value: 'fundamentals', label: 'Fundamentación' },
    { value: 'minimum_content', label: 'Contenidos mínimos' },
    { value: 'learning_outcomes', label: 'Resultados de aprendizaje' },
    { value: 'units', label: 'Unidades' },
    { value: 'practicals', label: 'Trabajos prácticos' },
    { value: 'methodology', label: 'Metodología' },
    { value: 'evaluation', label: 'Evaluación' },
    { value: 'bibliography', label: 'Bibliografía' }
  ]
  const getIntelligentTopicLabel = (topic) => {
    const found = intelligentTopicOptions.find((item) => item.value === topic)
    return found ? found.label : topic
  }
  const toggleAssociatedTopic = (topics, topic, mainTopic) => {
    const normalizedMain = String(mainTopic || '').trim()
    const normalizedTopic = String(topic || '').trim()
    const current = Array.isArray(topics) ? topics : []
    if (!normalizedTopic || normalizedTopic === normalizedMain) {
      return current.filter((item) => item !== normalizedMain)
    }
    if (current.includes(normalizedTopic)) {
      return current.filter((item) => item !== normalizedTopic)
    }
    return [...current, normalizedTopic]
  }
  const isControlActiveForCurrentView = (control) => {
    if (!control) return false
    if (!isDocenteView) return !!control.is_active
    if (!control.is_active) return false
    if (Object.prototype.hasOwnProperty.call(docenteControlActivation, control.id)) {
      return !!docenteControlActivation[control.id]
    }
    return !!control.is_active
  }
  const activeControlIdsForCurrentView = intelligentControls
    .filter((control) => isControlActiveForCurrentView(control))
    .map((control) => control.id)
  const intelligentModeOptions = [
    { key: 'guepardo', icon: '🐆', title: 'Guepardo', desc: 'Más rápido, menos preciso' },
    { key: 'delfin', icon: '🐬', title: 'Delfín', desc: 'Equilibrado' },
    { key: 'ballena', icon: '🐋', title: 'Ballena', desc: 'Más lento, más preciso' }
  ]
  const effectiveIntelligentRunMode = isDocenteView ? docenteIntelligentRunMode : intelligentRunMode
  const effectiveIntelligentRunModeLabel = intelligentModeOptions.find((mode) => mode.key === effectiveIntelligentRunMode)?.title || 'Delfín'
  const normalizeIntelligentMode = (mode, fallback = 'delfin') => {
    const normalized = String(mode || '').trim().toLowerCase()
    return ['guepardo', 'delfin', 'ballena'].includes(normalized) ? normalized : fallback
  }
  const normalizeTemperature = (value, fallback) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return fallback
    if (numeric < 0) return 0
    if (numeric > 2) return 2
    return Number(numeric.toFixed(2))
  }
  const normalizeMaxTokens = (value, fallback) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return fallback
    return Math.max(100, Math.min(4000, Math.round(numeric)))
  }
  const normalizeModeSettingsPayload = (data) => {
    const defaults = {
      guepardo: { model: 'gpt-4o-mini', temperature: 0.15, max_tokens: 420 },
      delfin: { model: 'gpt-4o-mini', temperature: 0.1, max_tokens: 500 },
      ballena: { model: 'gpt-4o', temperature: 0.1, max_tokens: 700 }
    }
    const normalizeModeConfig = (mode) => {
      const source = data?.[mode] || {}
      return {
        model: String(source.model || defaults[mode].model),
        temperature: normalizeTemperature(source.temperature, defaults[mode].temperature),
        max_tokens: normalizeMaxTokens(source.max_tokens, defaults[mode].max_tokens)
      }
    }
    const baseModels = Array.isArray(data?.available_models) && data.available_models.length
      ? data.available_models.map((item) => String(item || '').trim()).filter(Boolean)
      : [
          'gpt-5.2',
          'gpt-5.2-pro',
          'gpt-5.1',
          'gpt-5-mini',
          'gpt-4o',
          'o3',
          'o3-pro',
          'o4-mini',
          'gpt-4.1',
          'gpt-4.1-mini'
        ]
    const modeModelValues = ['guepardo', 'delfin', 'ballena']
      .map((mode) => String(data?.[mode]?.model || '').trim())
      .filter(Boolean)
    const models = Array.from(new Set([...baseModels, ...modeModelValues]))
    return {
      director_last_mode: normalizeIntelligentMode(data?.director_last_mode, 'delfin'),
      docente_mode: normalizeIntelligentMode(data?.docente_mode, 'guepardo'),
      models,
      config: {
        guepardo: normalizeModeConfig('guepardo'),
        delfin: normalizeModeConfig('delfin'),
        ballena: normalizeModeConfig('ballena')
      }
    }
  }
  const applyIntelligentModeSettings = (data) => {
    const normalized = normalizeModeSettingsPayload(data)
    setIntelligentRunMode(normalized.director_last_mode)
    setDocenteIntelligentRunMode(normalized.docente_mode)
    setIntelligentModelOptions(normalized.models)
    setIntelligentModeConfig(normalized.config)
  }
  const fetchIntelligentModeSettings = async () => {
    try {
      setIntelligentModeSettingsLoading(true)
      const res = await fetch('http://localhost:8001/intelligent-controls/settings')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudieron cargar los modos IA' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      applyIntelligentModeSettings(data)
    } catch (err) {
      setStatusMsg(err.message || 'No se pudieron cargar los modos IA persistidos')
      setStatusType('error')
    } finally {
      setIntelligentModeSettingsLoading(false)
    }
  }
  const saveIntelligentModeSettings = async (payload) => {
    setIntelligentModeSettingsSaving(true)
    try {
      const res = await fetch('http://localhost:8001/intelligent-controls/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudo guardar la configuración de modos IA' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      applyIntelligentModeSettings(data)
      return data
    } finally {
      setIntelligentModeSettingsSaving(false)
    }
  }
  const saveIntelligentModeParameters = async () => {
    const payload = {
      guepardo: {
        model: intelligentModeConfig.guepardo.model,
        temperature: normalizeTemperature(intelligentModeConfig.guepardo.temperature, 0.15),
        max_tokens: normalizeMaxTokens(intelligentModeConfig.guepardo.max_tokens, 420)
      },
      delfin: {
        model: intelligentModeConfig.delfin.model,
        temperature: normalizeTemperature(intelligentModeConfig.delfin.temperature, 0.1),
        max_tokens: normalizeMaxTokens(intelligentModeConfig.delfin.max_tokens, 500)
      },
      ballena: {
        model: intelligentModeConfig.ballena.model,
        temperature: normalizeTemperature(intelligentModeConfig.ballena.temperature, 0.1),
        max_tokens: normalizeMaxTokens(intelligentModeConfig.ballena.max_tokens, 700)
      }
    }
    try {
      await saveIntelligentModeSettings(payload)
      setStatusMsg('Parámetros IA guardados correctamente')
      setStatusType('success')
    } catch (err) {
      setStatusMsg(err.message || 'No se pudieron guardar los parámetros IA')
      setStatusType('error')
    }
  }
  const computeScopedIntelligentStatus = (summary) => {
    if (!summary) return 'Sin ejecutar'
    const scopedIds = new Set(activeControlIdsForCurrentView)
    if (scopedIds.size === 0) return 'Sin ejecutar'
    const resultsById = new Map((summary.results || []).map((item) => [item.control_id, item]))
    let hasFailed = false
    let hasMissing = false
    let hasAnyResult = false
    for (const id of scopedIds) {
      const result = resultsById.get(id)
      if (!result) {
        hasMissing = true
        continue
      }
      hasAnyResult = true
      if (!result.passed) {
        hasFailed = true
      }
    }
    if (!hasAnyResult) return 'Sin ejecutar'
    if (hasFailed) return 'Con sugerencias'
    if (hasMissing) return 'Pendiente de validar'
    return 'Validada'
  }
  const getScopedResultCounts = (summary) => {
    const scopedIds = new Set(activeControlIdsForCurrentView)
    if (!summary || scopedIds.size === 0) {
      return { total: 0, executed: 0, failed: 0, passed: 0 }
    }
    const scopedResults = (summary.results || []).filter((item) => scopedIds.has(item.control_id))
    const failed = scopedResults.filter((item) => !item.passed).length
    const executed = scopedResults.length
    return {
      total: scopedIds.size,
      executed,
      failed,
      passed: Math.max(executed - failed, 0)
    }
  }
  const fetchIntelligentControls = async () => {
    try {
      setIntelligentControlsLoading(true)
      setIntelligentControlsError('')
      const res = await fetch('http://localhost:8001/intelligent-controls')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error al cargar controles inteligentes' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      setIntelligentControls(Array.isArray(data) ? data : [])
    } catch (err) {
      setIntelligentControlsError(err.message || 'No se pudieron cargar los controles inteligentes')
    } finally {
      setIntelligentControlsLoading(false)
    }
  }
  const fetchProposalIntelligentSummary = async (proposalId) => {
    if (!proposalId) return null
    try {
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/intelligent-controls/results`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error al obtener resultados inteligentes' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      return data
    } catch {
      return null
    }
  }
  const refreshIntelligentSummaries = async (proposalIds, { silent = false } = {}) => {
    const ids = (proposalIds || []).filter((id) => id != null)
    if (!ids.length) {
      return
    }
    try {
      if (!silent) {
        setIntelligentResultsLoading(true)
      }
      const summaries = await Promise.all(ids.map((id) => fetchProposalIntelligentSummary(id)))
      setIntelligentResultsByProposal((prev) => {
        const next = { ...prev }
        summaries.forEach((summary) => {
          if (summary?.proposal_id != null) {
            next[summary.proposal_id] = summary
          }
        })
        return next
      })
    } finally {
      if (!silent) {
        setIntelligentResultsLoading(false)
      }
    }
  }
  const runIntelligentControlsForProposal = async (proposalId, options = {}) => {
    if (!proposalId) return
    const {
      withModal = true,
      suppressStatus = false,
      rethrow = false,
      refreshAfter = true,
      onProgress = null
    } = options
    if (activeControlIdsForCurrentView.length === 0) {
      if (!suppressStatus) {
        setStatusMsg('No hay controles activos para ejecutar en el entorno actual')
        setStatusType('info')
      }
      return
    }
    const proposal = controlRowsWithProposal.find((row) => row.proposal?.id === proposalId)?.proposal
    const activeIdsSet = new Set(activeControlIdsForCurrentView)
    const modalControls = intelligentControls
      .filter((control) => activeIdsSet.has(control.id))
      .sort((a, b) => {
        const topicCmp = String(a.topic || '').localeCompare(String(b.topic || ''), 'es', { sensitivity: 'base' })
        if (topicCmp !== 0) return topicCmp
        const sortA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : Number.MAX_SAFE_INTEGER
        const sortB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : Number.MAX_SAFE_INTEGER
        if (sortA !== sortB) return sortA - sortB
        return Number(a.id || 0) - Number(b.id || 0)
      })
      .map((control) => ({
        id: control.id,
        topic: control.topic,
        name: control.name,
        label: `${getIntelligentTopicLabel(control.topic)} · ${control.name}`
      }))

    const controller = new AbortController()
    intelligentRunAbortRef.current[proposalId] = controller

    const clearIntelligentRunProgressPoller = () => {
      const ticker = intelligentRunProgressPollerRef.current[proposalId]
      if (ticker) {
        clearInterval(ticker)
        delete intelligentRunProgressPollerRef.current[proposalId]
      }
    }

    const startIntelligentRunProgressPoller = ({ proposalId: pollProposalId, controlIds, startedAtIso }) => {
      clearIntelligentRunProgressPoller()
      const parseBackendDate = (value) => {
        const raw = String(value || '').trim()
        if (!raw) return NaN
        const hasTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
        return Date.parse(hasTz ? raw : `${raw}Z`)
      }
      const startedAtMs = startedAtIso ? Date.parse(startedAtIso) : Date.now()
      const safeStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : Date.now()
      const selectedControlIds = new Set((Array.isArray(controlIds) ? controlIds : []).map((value) => Number(value)))
      const total = selectedControlIds.size
      if (total <= 0) {
        return
      }

      const poll = async () => {
        if (controller.signal.aborted) {
          return
        }
        try {
          const res = await fetch(`http://localhost:8001/proposals/${pollProposalId}/intelligent-controls/results`)
          if (!res.ok) return
          const summary = await res.json()
          const results = Array.isArray(summary?.results) ? summary.results : []
          let completed = 0
          results.forEach((row) => {
            const controlId = Number(row?.control_id)
            if (!selectedControlIds.has(controlId)) return
            const checkedAtRaw = row?.checked_at
            if (!checkedAtRaw) return
            const checkedAtMs = parseBackendDate(checkedAtRaw)
            if (!Number.isFinite(checkedAtMs)) return
            if (checkedAtMs + 250 >= safeStartedAtMs) {
              completed += 1
            }
          })

          if (withModal) {
            setIntelligentRunModalData((prev) => {
              if (!prev || prev.proposalId !== pollProposalId) return prev
              return {
                ...prev,
                completedControls: Math.min(completed, prev.controlsCount || total)
              }
            })
          }
          if (typeof onProgress === 'function') {
            onProgress(Math.min(completed, total), total)
          }
        } catch (error) {
        }
      }

      poll()
      intelligentRunProgressPollerRef.current[pollProposalId] = setInterval(poll, 700)
    }
    try {
      setRunningIntelligentByProposal((prev) => ({ ...prev, [proposalId]: true }))
      if (withModal) {
        setShowIntelligentRunModal(true)
        const runStartedAt = new Date().toISOString()
        setIntelligentRunModalData({
          proposalId,
          subject: proposal?.subject || `#${proposalId}`,
          mode: effectiveIntelligentRunMode,
          controlsCount: modalControls.length || activeControlIdsForCurrentView.length,
          controls: modalControls,
          completedControls: 0,
          status: 'running',
          startedAt: runStartedAt
        })
        startIntelligentRunProgressPoller({
          proposalId,
          controlIds: activeControlIdsForCurrentView,
          startedAtIso: runStartedAt,
        })
      } else {
        const runStartedAt = new Date().toISOString()
        startIntelligentRunProgressPoller({
          proposalId,
          controlIds: activeControlIdsForCurrentView,
          startedAtIso: runStartedAt,
        })
      }
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/intelligent-controls/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: effectiveIntelligentRunMode, control_ids: activeControlIdsForCurrentView }),
        signal: controller.signal
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudo ejecutar el control inteligente' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      if (withModal) {
        clearIntelligentRunProgressPoller()
        setIntelligentRunModalData((prev) => {
          if (!prev || prev.proposalId !== proposalId) return prev
          const total = prev.controlsCount || 0
          return {
            ...prev,
            completedControls: total,
            status: 'completed'
          }
        })
      }
      if (typeof onProgress === 'function') {
        const scoped = getScopedResultCounts(data)
        onProgress(scoped.executed, scoped.total)
      }
      setIntelligentResultsByProposal((prev) => ({ ...prev, [proposalId]: data }))
      if (!suppressStatus) {
        setStatusMsg(`Control inteligente ejecutado en propuesta #${proposalId}`)
        setStatusType('success')
      }
      if (refreshAfter) {
        fetchProposals()
      }
      if (viewProposal?.id === proposalId) {
        setViewProposalIntelligentSummary(data)
      }
      return data
    } catch (err) {
      if (err?.name === 'AbortError') {
        if (!suppressStatus) {
          setStatusMsg(`Ejecución inteligente cancelada en propuesta #${proposalId}`)
          setStatusType('info')
        }
        if (rethrow) throw err
        return
      }
      if (!suppressStatus) {
        setStatusMsg(err.message || 'Error al ejecutar control inteligente')
        setStatusType('error')
      }
      if (rethrow) throw err
    } finally {
      clearIntelligentRunProgressPoller()
      delete intelligentRunAbortRef.current[proposalId]
      if (withModal) {
        setShowIntelligentRunModal(false)
        setIntelligentRunModalData(null)
      }
      setRunningIntelligentByProposal((prev) => ({ ...prev, [proposalId]: false }))
    }
  }
  const goToIntelligentConfigForDirector = () => {
    if (isDocenteView) {
      setStatusMsg('No hay controles activos. Solicita al directivo activar controles IA.')
      setStatusType('info')
      return
    }
    setControlPanelMode('config')
    setStatusMsg('No hay controles activos. Te llevamos a Configuración IA para activarlos.')
    setStatusType('info')
    setTimeout(() => {
      intelligentConfigCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }
  const cancelIntelligentRun = (proposalId) => {
    if (!proposalId) return
    const controller = intelligentRunAbortRef.current[proposalId]
    if (controller) {
      controller.abort()
    }
    setShowIntelligentRunModal(false)
    setIntelligentRunModalData(null)
  }
  const startBatchIntelligentRun = async () => {
    const proposalIds = selectedIntelligentProposalIds.filter((id) => id != null)
    if (!proposalIds.length) {
      setStatusMsg('Selecciona al menos una propuesta para ejecutar control inteligente')
      setStatusType('info')
      return
    }
    if (!activeControlIdsForCurrentView.length) {
      setStatusMsg('No hay controles activos para ejecutar en el entorno actual')
      setStatusType('info')
      return
    }

    const proposalById = controlRowsWithProposal.reduce((acc, row) => {
      if (row.proposal?.id != null) {
        acc[row.proposal.id] = row.proposal
      }
      return acc
    }, {})

    const initialItems = proposalIds.reduce((acc, proposalId) => {
      const subject = proposalById[proposalId]?.subject || `#${proposalId}`
      acc[proposalId] = {
        proposalId,
        subject,
        status: 'pendiente',
        evaluatedControls: 0,
        totalControls: activeControlIdsForCurrentView.length,
        error: ''
      }
      return acc
    }, {})

    batchIntelligentAbortRef.current = { cancelled: false }
    setBatchIntelligentRun({
      isRunning: true,
      isCancelling: false,
      total: proposalIds.length,
      completed: 0,
      currentProposalId: null,
      items: initialItems
    })

    let completed = 0
    for (const proposalId of proposalIds) {
      if (batchIntelligentAbortRef.current.cancelled) {
        break
      }

      setBatchIntelligentRun((prev) => ({
        ...prev,
        currentProposalId: proposalId,
        items: {
          ...prev.items,
          [proposalId]: {
            ...prev.items[proposalId],
            status: 'ejecutando',
            evaluatedControls: 0,
            error: ''
          }
        }
      }))

      try {
        const summary = await runIntelligentControlsForProposal(proposalId, {
          withModal: false,
          suppressStatus: true,
          rethrow: true,
          refreshAfter: false,
          onProgress: (done, totalControls) => {
            setBatchIntelligentRun((prev) => ({
              ...prev,
              items: {
                ...prev.items,
                [proposalId]: {
                  ...prev.items[proposalId],
                  evaluatedControls: Math.min(done, totalControls || activeControlIdsForCurrentView.length),
                  totalControls: totalControls || activeControlIdsForCurrentView.length,
                }
              }
            }))
          }
        })
        const scoped = getScopedResultCounts(summary)
        completed += 1
        setBatchIntelligentRun((prev) => ({
          ...prev,
          completed,
          items: {
            ...prev.items,
            [proposalId]: {
              ...prev.items[proposalId],
              status: 'completado',
              evaluatedControls: scoped.executed,
              totalControls: scoped.total,
              error: ''
            }
          }
        }))
        setSelectedIntelligentProposalIds((prev) => prev.filter((id) => id !== proposalId))
      } catch (err) {
        const aborted = err?.name === 'AbortError'
        completed += 1
        setBatchIntelligentRun((prev) => ({
          ...prev,
          completed,
          items: {
            ...prev.items,
            [proposalId]: {
              ...prev.items[proposalId],
              status: aborted ? 'cancelado' : 'error',
              error: aborted ? 'Cancelado por usuario' : (err?.message || 'Error en ejecución')
            }
          }
        }))
        setSelectedIntelligentProposalIds((prev) => prev.filter((id) => id !== proposalId))
        if (aborted) {
          break
        }
      }
    }

    setBatchIntelligentRun((prev) => ({
      ...prev,
      isRunning: false,
      isCancelling: false,
      currentProposalId: null
    }))
    setSelectedIntelligentProposalIds([])
    fetchProposals()
    setStatusMsg('Ejecución por lote finalizada')
    setStatusType('success')
  }
  const cancelBatchIntelligentRun = () => {
    if (!batchIntelligentRun.isRunning || batchIntelligentRun.isCancelling) {
      return
    }
    setBatchIntelligentRun((prev) => ({ ...prev, isCancelling: true }))
    batchIntelligentAbortRef.current = { cancelled: true }
    const currentProposalId = batchIntelligentRun.currentProposalId
    if (currentProposalId) {
      const controller = intelligentRunAbortRef.current[currentProposalId]
      if (controller) {
        controller.abort()
      }
    }
    setStatusMsg('Cancelando ejecución por lote...')
    setStatusType('info')
  }
  const saveIntelligentSuggestionEdits = async (proposalId, resultId) => {
    const draft = editingSuggestionByResultId[resultId]
    if (!draft) return
    try {
      const res = await fetch(`http://localhost:8001/proposals/${proposalId}/intelligent-controls/results/${resultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_failed: draft.what_failed,
          why_failed: draft.why_failed,
          suggestion: draft.suggestion,
          proposed_text: draft.proposed_text,
          summary: draft.summary
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudieron guardar los cambios de sugerencia' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      const summary = await fetchProposalIntelligentSummary(proposalId)
      if (summary) {
        setIntelligentResultsByProposal((prev) => ({ ...prev, [proposalId]: summary }))
        if (viewProposal?.id === proposalId) {
          setViewProposalIntelligentSummary(summary)
        }
      }
      setStatusMsg('Sugerencia actualizada correctamente')
      setStatusType('success')
    } catch (err) {
      setStatusMsg(err.message || 'No se pudieron guardar cambios en sugerencias')
      setStatusType('error')
    }
  }
  const createIntelligentControl = async () => {
    if (!isNonEmptyText(intelligentControlDraft.name) || !isNonEmptyText(intelligentControlDraft.instruction)) {
      setIntelligentControlsError('Nombre e instrucción son obligatorios para crear un control.')
      return
    }
    try {
      setIntelligentControlsError('')
      const res = await fetch('http://localhost:8001/intelligent-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intelligentControlDraft)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudo crear el control' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      setIntelligentControlDraft({ topic: 'teaching_team', name: '', instruction: '', is_active: true, associated_topics: [] })
      await fetchIntelligentControls()
    } catch (err) {
      setIntelligentControlsError(err.message || 'No se pudo crear el control')
    }
  }
  const updateIntelligentControl = async (controlId, payload) => {
    const res = await fetch(`http://localhost:8001/intelligent-controls/${controlId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'No se pudo actualizar el control' }))
      throw new Error(errorData.detail || `Error ${res.status}`)
    }
    return res.json()
  }
  const deleteIntelligentControl = async (controlId) => {
    if (!window.confirm('¿Eliminar este control inteligente?')) {
      return
    }
    try {
      const res = await fetch(`http://localhost:8001/intelligent-controls/${controlId}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'No se pudo eliminar el control' }))
        throw new Error(errorData.detail || `Error ${res.status}`)
      }
      await fetchIntelligentControls()
    } catch (err) {
      setIntelligentControlsError(err.message || 'No se pudo eliminar el control')
    }
  }
  useEffect(() => {
    if (activeMenu !== 'control-propuestas') {
      return
    }
    fetchIntelligentControls()
    fetchIntelligentModeSettings()
  }, [activeMenu])
  useEffect(() => {
    if (activeMenu !== 'control-propuestas') {
      return
    }
    const ids = controlProposalCandidates.map((proposal) => proposal?.id).filter((id) => id != null)
    const idsToFetch = ids.filter((id) => !intelligentResultsByProposal[id])
    if (!idsToFetch.length) {
      return
    }
    refreshIntelligentSummaries(idsToFetch, { silent: true })
  }, [activeMenu, controlProposalCandidates, intelligentResultsByProposal])
  useEffect(() => {
    if (activeMenu !== 'control-propuestas') {
      setControlDetailsLoading(false)
      return
    }
    const missingIds = controlProposalCandidates
      .map((proposal) => proposal?.id)
      .filter((id) => id != null && !controlProposalDetailsById[id])
    if (!missingIds.length) {
      setControlDetailsLoading(false)
      return
    }

    let cancelled = false
    setControlDetailsLoading(true)

    ;(async () => {
      const loaded = await Promise.all(missingIds.map(async (id) => {
        try {
          const res = await fetch(`http://localhost:8001/proposals/${id}`)
          if (!res.ok) return null
          return await res.json()
        } catch {
          return null
        }
      }))

      if (cancelled) {
        return
      }

      setControlProposalDetailsById((prev) => {
        const next = { ...prev }
        loaded.forEach((item) => {
          if (item?.id != null) {
            next[item.id] = item
          }
        })
        return next
      })
      setControlDetailsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [activeMenu, controlProposalCandidates, controlProposalDetailsById])
  const controlChecklistColumns = [
    { key: 'hours', label: 'Horas' },
    { key: 'teachers', label: 'Docentes' },
    { key: 'minimum_content', label: 'Cont. mín.' },
    { key: 'fundamentals', label: 'Fundamentación' },
    { key: 'objectives', label: 'Objetivos' },
    { key: 'units', label: 'Unidades' },
    { key: 'practicals', label: 'TPs' },
    { key: 'methodology', label: 'Metodología' },
    { key: 'evaluation', label: 'Evaluación' },
    { key: 'bibliography', label: 'Bibliografía' }
  ]
  const parseControlYear = (proposal) => {
    const rawYear = proposal?.year_of_career || proposal?.academic_year || ''
    const match = String(rawYear).match(/\d+/)
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
  }
  const parseControlQuarter = (proposal) => {
    const value = normalizeText(proposal?.quarter || '')
    if (value.includes('anual')) return { order: 0, label: 'Anual' }
    if (value.includes('1er') || value.includes('1ro') || value.includes('primer')) return { order: 1, label: '1er Cuatrimestre' }
    if (value.includes('2do') || value.includes('segundo')) return { order: 2, label: '2do Cuatrimestre' }
    return { order: 99, label: proposal?.quarter || '-' }
  }
  const controlChecklistRowsBase = (isDocenteView
    ? [...controlProposalCandidates].map((proposalSummary) => ({ proposalSummary, subjectItem: null }))
    : controlSubjectsFromPlans.map((subjectItem) => ({
        subjectItem,
        proposalSummary: findProposalForSubject(activeCareer, subjectItem.name, subjectItem.planName)
      })))
    .map(({ proposalSummary, subjectItem }, idx) => {
      const fallbackProposal = subjectItem
        ? {
            id: null,
            subject: subjectItem.name || '',
            year_of_career: subjectItem.year || '',
            quarter: subjectItem.termName || '',
            study_plan: subjectItem.planName || '',
            status: 'Sin propuesta'
          }
        : null
      const proposal = proposalSummary
        ? (controlProposalDetailsById[proposalSummary?.id] || proposalSummary)
        : fallbackProposal
      const hasProposal = !!proposalSummary
      const noProposalReason = 'La asignatura está en el plan de estudios pero no tiene propuesta cargada.'
      const teachingTeam = Array.isArray(proposal?.teaching_team) ? proposal.teaching_team : []
      const hasAnyTeacher = teachingTeam.some((teacher) => teacher?.id != null || isNonEmptyText(teacher?.name))
      const hasRequiredTeacher = teachingTeam.some((teacher) => {
        const category = normalizeText(teacher?.category || '')
        return category.includes('titular') || category.includes('asociado') || category.includes('adjunto')
      })
      const practicals = Array.isArray(proposal?.practicals) ? proposal.practicals : []
      const hasTpRaAssociation = (tp) => {
        if (Array.isArray(tp?.ra_codes) && tp.ra_codes.length > 0) {
          return true
        }
        const objectiveText = String(tp?.objective || '').trim()
        if (!objectiveText) {
          return false
        }
        if (/\bRA\s*\d+\b/i.test(objectiveText)) {
          return true
        }
        const learningOutcomes = Array.isArray(proposal?.learning_outcomes) ? proposal.learning_outcomes : []
        const loweredObjective = objectiveText.toLowerCase()
        return learningOutcomes.some((item) => {
          const description = String(item?.description || item || '').trim().toLowerCase()
          return description && loweredObjective.includes(description)
        })
      }
      const practicalsWithoutRa = practicals.filter((tp) => !hasTpRaAssociation(tp))
      const practicalsWithoutRaLabels = practicalsWithoutRa.map((tp, idx) => {
        const number = String(tp?.number || tp?.numero || idx + 1).trim()
        const name = String(tp?.name || tp?.nombre || '').trim()
        return name ? `TP ${number} - ${name}` : `TP ${number}`
      })
      const totalHours = Number(proposal?.total_hours ?? (Number(proposal?.theoretical_hours || 0) + Number(proposal?.practical_hours || 0)))
      const learningOutcomes = Array.isArray(proposal?.learning_outcomes) ? proposal.learning_outcomes : []
      const validLearningOutcomes = learningOutcomes.filter((item) => isNonEmptyText(item?.description || item))
      const units = Array.isArray(proposal?.units) ? proposal.units : []
      const validUnits = units.filter((unit) => isNonEmptyText(unit?.name) && isNonEmptyText(unit?.content))

      const checks = {
        hours: {
          ok: hasProposal && totalHours > 0,
          reason: !hasProposal ? noProposalReason : (totalHours > 0 ? '' : 'Debe tener horas teóricas/prácticas (o total de horas) mayores a 0.')
        },
        teachers: {
          ok: hasProposal && hasAnyTeacher && hasRequiredTeacher,
          reason: !hasProposal
            ? noProposalReason
            : !hasAnyTeacher
            ? 'No tiene docentes asignados.'
            : 'Debe incluir al menos un docente con cargo TITULAR, ASOCIADO o ADJUNTO.'
        },
        minimum_content: {
          ok: hasProposal && isNonEmptyText(proposal?.minimum_content),
          reason: !hasProposal ? noProposalReason : 'Faltan contenidos mínimos.'
        },
        fundamentals: {
          ok: hasProposal && isNonEmptyText(proposal?.fundamentals_part1) && isNonEmptyText(proposal?.fundamentals_part2),
          reason: !hasProposal ? noProposalReason : 'La fundamentación debe tener Importancia y Perfil Profesional.'
        },
        objectives: {
          ok: hasProposal && validLearningOutcomes.length > 0,
          reason: !hasProposal ? noProposalReason : 'Faltan objetivos/resultados de aprendizaje.'
        },
        units: {
          ok: hasProposal && validUnits.length > 0,
          reason: !hasProposal ? noProposalReason : 'Debe incluir al menos una unidad con nombre y contenidos.'
        },
        practicals: {
          ok: hasProposal && practicals.length > 0 && practicalsWithoutRa.length === 0,
          reason: !hasProposal
            ? noProposalReason
            : practicals.length === 0
            ? 'Debe incluir al menos un trabajo práctico.'
            : `Hay ${practicalsWithoutRa.length} TP(s) sin RA detectable: ${practicalsWithoutRaLabels.join('; ')}`
        },
        methodology: {
          ok: hasProposal && isNonEmptyText(proposal?.methodology),
          reason: !hasProposal ? noProposalReason : 'Falta la metodología de enseñanza.'
        },
        evaluation: {
          ok: hasProposal && isNonEmptyText(proposal?.evaluation),
          reason: !hasProposal ? noProposalReason : 'Falta el método de evaluación.'
        },
        bibliography: {
          ok: hasProposal && isNonEmptyText(proposal?.bibliography),
          reason: !hasProposal ? noProposalReason : 'Falta la bibliografía.'
        }
      }

      const passedCount = controlChecklistColumns.reduce((sum, column) => sum + (checks[column.key].ok ? 1 : 0), 0)
      const quarterInfo = parseControlQuarter(proposal)
      const rowKey = hasProposal
        ? `control-proposal-${proposal?.id}`
        : `control-missing-${normalizeText(subjectItem?.planName || '')}-${normalizeText(subjectItem?.name || '')}-${String(subjectItem?.year || '')}-${normalizeText(subjectItem?.termName || '')}-${idx}`
      return {
        rowKey,
        missingProposal: !hasProposal,
        proposal,
        checks,
        rowTotal: passedCount,
        rowTotalLabel: `${passedCount}/${controlChecklistColumns.length}`,
        yearValue: parseControlYear(proposal),
        quarterOrder: quarterInfo.order,
        quarterLabel: quarterInfo.label,
        yearLabel: proposal?.year_of_career || proposal?.academic_year || '-'
      }
    })
    .sort((a, b) => {
      if (a.yearValue !== b.yearValue) return a.yearValue - b.yearValue
      if (a.quarterOrder !== b.quarterOrder) return a.quarterOrder - b.quarterOrder
      return String(a.proposal?.subject || '').localeCompare(String(b.proposal?.subject || ''), 'es', { sensitivity: 'base' })
    })
  const normalizedControlSubjectFilter = normalizeText(controlSubjectFilter)
  const controlChecklistRows = controlChecklistRowsBase.filter((row) => {
    if (normalizedControlSubjectFilter) {
      const subjectText = normalizeText(row.proposal?.subject || '')
      const idText = normalizeText(row.missingProposal ? 'sin propuesta' : String(row.proposal?.id || ''))
      if (!subjectText.includes(normalizedControlSubjectFilter) && !idText.includes(normalizedControlSubjectFilter)) {
        return false
      }
    }
    if (controlOnlyWithErrors && row.rowTotal === controlChecklistColumns.length) {
      return false
    }
    if (controlFailureFilter !== 'all' && row.checks[controlFailureFilter]?.ok) {
      return false
    }
    return true
  })
  const controlRowsGrouped = controlChecklistRows.reduce((acc, row) => {
    const groupKey = `${row.yearLabel}-${row.quarterLabel}`
    if (!acc[groupKey]) {
      acc[groupKey] = {
        key: groupKey,
        title: `Año ${row.yearLabel} - ${row.quarterLabel}`,
        rows: []
      }
    }
    acc[groupKey].rows.push(row)
    return acc
  }, {})
  const controlRowGroups = Object.values(controlRowsGrouped)
  const controlColumnTotals = controlChecklistColumns.reduce((totals, column) => {
    totals[column.key] = controlChecklistRows.reduce((sum, row) => sum + (row.checks[column.key].ok ? 1 : 0), 0)
    return totals
  }, {})
  const controlRowsWithProposal = controlChecklistRows.filter((row) => !row.missingProposal && row.proposal?.id != null)
  const intelligentRowsBase = controlChecklistRows
  const getIntelligentQuickStatus = (row) => (row.rowTotal === controlChecklistColumns.length ? 'Completa' : 'Incompleta')
  const getIntelligentIaStatus = (row) => {
    if (row.missingProposal) return 'Sin propuesta'
    const summary = intelligentResultsByProposal[row.proposal.id]
    return computeScopedIntelligentStatus(summary)
  }
  const intelligentQuickStatusOptions = Array.from(new Set(intelligentRowsBase.map((row) => getIntelligentQuickStatus(row))))
  const intelligentIaStatusOptions = Array.from(new Set(intelligentRowsBase.map((row) => getIntelligentIaStatus(row))))
  const normalizedIntelligentNameFilter = normalizeText(intelligentNameFilter)
  const intelligentRowsForTable = intelligentRowsBase.filter((row) => {
    if (normalizedIntelligentNameFilter) {
      const subjectText = normalizeText(row.proposal?.subject || '')
      const idText = normalizeText(row.missingProposal ? 'sin propuesta' : String(row.proposal?.id || ''))
      if (!subjectText.includes(normalizedIntelligentNameFilter) && !idText.includes(normalizedIntelligentNameFilter)) {
        return false
      }
    }
    if (intelligentQuickStatusFilter !== 'all' && getIntelligentQuickStatus(row) !== intelligentQuickStatusFilter) {
      return false
    }
    if (intelligentIaStatusFilter !== 'all' && getIntelligentIaStatus(row) !== intelligentIaStatusFilter) {
      return false
    }
    return true
  })
  const selectableIntelligentProposalIds = intelligentRowsForTable
    .filter((row) => !row.missingProposal && row.proposal?.id != null)
    .map((row) => row.proposal.id)
  const selectableIntelligentProposalSet = new Set(selectableIntelligentProposalIds)
  const selectedIntelligentVisibleIds = selectedIntelligentProposalIds.filter((id) => selectableIntelligentProposalSet.has(id))
  const areAllIntelligentRowsSelected = selectableIntelligentProposalIds.length > 0 && selectedIntelligentVisibleIds.length === selectableIntelligentProposalIds.length
  const hasAnyIntelligentSelection = selectedIntelligentVisibleIds.length > 0
  const batchCompletionPct = batchIntelligentRun.total > 0
    ? Math.round((batchIntelligentRun.completed / batchIntelligentRun.total) * 100)
    : 0
  const intelligentRowsGrouped = intelligentRowsForTable.reduce((acc, row) => {
    const groupKey = `${row.yearLabel}-${row.quarterLabel}`
    if (!acc[groupKey]) {
      acc[groupKey] = {
        key: groupKey,
        title: `Año ${row.yearLabel} - ${row.quarterLabel}`,
        rows: []
      }
    }
    acc[groupKey].rows.push(row)
    return acc
  }, {})
  const intelligentRowGroups = Object.values(intelligentRowsGrouped)
  const intelligentValidatedCount = controlRowsWithProposal.filter((row) => {
    const summary = intelligentResultsByProposal[row.proposal.id]
    const scopedStatus = computeScopedIntelligentStatus(summary)
    return scopedStatus === 'Validada'
  }).length
  const intelligentSuggestedCount = controlRowsWithProposal.filter((row) => {
    const summary = intelligentResultsByProposal[row.proposal.id]
    const scopedStatus = computeScopedIntelligentStatus(summary)
    return scopedStatus === 'Con sugerencias'
  }).length
  useEffect(() => {
    setSelectedIntelligentProposalIds((prev) => {
      const next = prev.filter((id) => selectableIntelligentProposalSet.has(id))
      const same = next.length === prev.length && next.every((id, idx) => id === prev[idx])
      return same ? prev : next
    })
  }, [controlChecklistRows])
  const filteredProposals = isDocenteView
    ? (hasSelectedTeacher
        ? filteredByPlan.filter((proposal) => proposalHasTeacher(proposal, selectedTeacherId, selectedTeacherName))
        : [])
    : filteredByPlan
  const completeProposals = filteredProposals.filter(isProposalComplete)
  const inProcessProposals = filteredProposals.filter(isProposalInProcess)
  const totalProposalsHome = completeProposals.length + inProcessProposals.length
  const proposalsCreatedPct = totalProposalsHome > 0
    ? Math.round((completeProposals.length / totalProposalsHome) * 100)
    : 0
  const subjectStatsHome = getSubjectStatistics(selectedPlanFilterId)
  const subjectsWithProposalPct = subjectStatsHome.total > 0
    ? Math.round((subjectStatsHome.withProposals / subjectStatsHome.total) * 100)
    : 0
  const teachersCompleteCount = teacherCatalogItems.filter((teacher) => {
    const dedication = String(teacher?.dedication || '').trim().toLowerCase()
    return !!dedication && dedication !== 'sin informar'
  }).length
  const teachersIncompleteCount = Math.max(teacherCatalogItems.length - teachersCompleteCount, 0)
  const teachersCompletePct = teacherCatalogItems.length > 0
    ? Math.round((teachersCompleteCount / teacherCatalogItems.length) * 100)
    : 0
  const proposalTableGetters = {
    id: (p) => p.id ?? '',
    subject: (p) => p.subject ?? '',
    academic_year: (p) => p.academic_year ?? '',
    year_of_career: (p) => p.year_of_career ?? '',
    quarter: (p) => p.quarter ?? '',
    plan: (p) => p.study_plan || p.plan || '',
    updated_at: (p) => formatDateTime(p.updated_at || p.created_at),
    status: (p) => p.status ?? '',
    drive: (p) => getProposalGdocBadge(p).label
  }
  const getProposalFilterOptions = (rows, key) => {
    const getter = proposalTableGetters[key]
    if (!getter) return []
    return Array.from(
      new Set(
        rows
          .map((row) => String(getter(row) ?? '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }
  const proposalFilterOptions = {
    academic_year: getProposalFilterOptions(filteredProposals, 'academic_year'),
    year_of_career: getProposalFilterOptions(filteredProposals, 'year_of_career'),
    quarter: getProposalFilterOptions(filteredProposals, 'quarter'),
    plan: getProposalFilterOptions(filteredProposals, 'plan'),
    status: getProposalFilterOptions(filteredProposals, 'status'),
    drive: getProposalFilterOptions(filteredProposals, 'drive')
  }
  const pendingProposalFilterOptions = {
    academic_year: getProposalFilterOptions(inProcessProposals, 'academic_year'),
    year_of_career: getProposalFilterOptions(inProcessProposals, 'year_of_career'),
    quarter: getProposalFilterOptions(inProcessProposals, 'quarter'),
    plan: getProposalFilterOptions(inProcessProposals, 'plan'),
    drive: getProposalFilterOptions(inProcessProposals, 'drive')
  }
  const completeProposalsFiltered = applyTableSort(
    applyTableFilters(completeProposals, completeProposalFilters, proposalTableGetters),
    completeProposalSort,
    proposalTableGetters
  )
  const allProposalsFiltered = applyTableSort(
    applyTableFilters(filteredProposals, completeProposalFilters, proposalTableGetters),
    completeProposalSort,
    proposalTableGetters
  )
  const inProcessProposalsFiltered = applyTableSort(
    applyTableFilters(inProcessProposals, pendingProposalFilters, proposalTableGetters),
    pendingProposalSort,
    proposalTableGetters
  )
  const teacherSubjectSetsById = {}
  const teacherSubjectSetsByName = {}
  filteredByCareer.forEach((proposal) => {
    if (!Array.isArray(proposal?.teaching_team)) return
    const subjectKey = normalizeText(proposal.subject || '')
    if (!subjectKey) return
    proposal.teaching_team.forEach((doc) => {
      const idKey = doc?.id != null ? String(doc.id) : ''
      const nameKey = normalizeText(doc?.name || '')
      if (idKey) {
        if (!teacherSubjectSetsById[idKey]) teacherSubjectSetsById[idKey] = new Set()
        teacherSubjectSetsById[idKey].add(subjectKey)
      }
      if (nameKey) {
        if (!teacherSubjectSetsByName[nameKey]) teacherSubjectSetsByName[nameKey] = new Set()
        teacherSubjectSetsByName[nameKey].add(subjectKey)
      }
    })
  })
  const getTeacherSubjectCount = (teacher) => {
    const idKey = teacher?.id != null ? String(teacher.id) : ''
    const nameKey = normalizeText(teacher?.name || '')
    const byId = idKey ? teacherSubjectSetsById[idKey] : null
    const byName = nameKey ? teacherSubjectSetsByName[nameKey] : null
    if (byId) return byId.size
    return byName ? byName.size : 0
  }
  const parseTeacherYearValue = (value) => {
    const text = String(value || '').trim()
    if (!text) return Number.MAX_SAFE_INTEGER
    const match = text.match(/\d+/)
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
  }
  const getTeacherUsageQuarterKey = (value) => {
    const normalized = normalizeText(value)
    if (!normalized) return 'other'
    if (normalized.includes('anual')) return 'annual'
    if (normalized.includes('1er') || normalized.includes('1ro') || normalized.includes('primer')) return 'first'
    if (normalized.includes('2do') || normalized.includes('segundo')) return 'second'
    return 'other'
  }
  const teacherUsageRows = teacherUsageInfo.items.length
    ? teacherUsageInfo.items.map((row) => ({
        ...row,
        yearValue: parseTeacherYearValue(row.year_of_career || row.academic_year),
        quarterKey: getTeacherUsageQuarterKey(row.quarter)
      }))
    : []
  const sortTeacherUsageRows = (rows) => [...rows].sort((a, b) => {
    if (a.yearValue !== b.yearValue) return a.yearValue - b.yearValue
    return String(a.subject || '').localeCompare(String(b.subject || ''), 'es', { sensitivity: 'base' })
  })
  const teacherUsageAnnualRows = sortTeacherUsageRows(teacherUsageRows.filter((row) => row.quarterKey === 'annual'))
  const teacherUsageFirstRows = sortTeacherUsageRows(teacherUsageRows.filter((row) => row.quarterKey === 'first'))
  const teacherUsageSecondRows = sortTeacherUsageRows(teacherUsageRows.filter((row) => row.quarterKey === 'second'))
  const teacherUsageOtherRows = sortTeacherUsageRows(teacherUsageRows.filter((row) => row.quarterKey === 'other'))
  const renderTeacherUsageTable = (rows, title) => {
    if (!rows.length) return null
    return (
      <div style={{ border: '1px solid #dfe8f6', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ background: '#eef4ff', color: '#1f2d3d', fontWeight: 700, fontSize: '12px', padding: '8px 10px', borderBottom: '1px solid #dfe8f6' }}>
          {title}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f8fbff' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #edf1f7' }}>Año</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #edf1f7' }}>Asignatura</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${title}-${row.id}-${idx}`} style={{ borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #f0f2f6' }}>
                <td style={{ padding: '6px 8px', width: '64px' }}>{row.year_of_career || '-'}</td>
                <td style={{ padding: '6px 8px' }}>#{row.id}{row.subject ? ` - ${row.subject}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  const teacherCatalogItemsWithSubjectCount = teacherCatalogItems.map((teacher) => ({
    ...teacher,
    subject_count: getTeacherSubjectCount(teacher)
  }))
  const teacherTableGetters = {
    name: (t) => t.name ?? '',
    category: (t) => t.category ?? '',
    dedication: (t) => t.dedication ?? '',
    email: (t) => t.email ?? '',
    subject_count: (t) => t.subject_count ?? 0
  }
  const teacherCatalogFiltered = applyTableSort(
    applyTableFilters(teacherCatalogItemsWithSubjectCount, teacherTableFilters, teacherTableGetters),
    teacherTableSort,
    teacherTableGetters
  )
  const competencyTableGetters = {
    code: (c) => c.code ?? '',
    description: (c) => c.description ?? '',
    plan: (c) => c.plan_name ?? ''
  }
  const competenciesPlanName = selectedPlan?.name || ''
  const genericCompetenciesByPlan = competenciesPlanName
    ? filterCompetenciesByPlan(careerCompetencies.generic, competenciesPlanName, activeCareer)
    : careerCompetencies.generic
  const specificCompetenciesByPlan = competenciesPlanName
    ? filterCompetenciesByPlan(careerCompetencies.specific, competenciesPlanName, activeCareer)
    : careerCompetencies.specific
  const genericCompetenciesFiltered = applyTableSort(
    applyTableFilters(genericCompetenciesByPlan, genericCompetencyFilters, competencyTableGetters),
    genericCompetencySort,
    competencyTableGetters
  )
  const specificCompetenciesFiltered = applyTableSort(
    applyTableFilters(specificCompetenciesByPlan, specificCompetencyFilters, competencyTableGetters),
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
  const planOptions = activeCareer ? (savedPlans[activeCareer] || []) : []
  const planOptionNames = new Set(planOptions.map((plan) => plan.name))
  const hasCustomPlanOption = isNonEmptyText(formData.plan) && !planOptionNames.has(formData.plan)
  const drivePlan = activeCareer && selectedPlanFilterId ? getPlanById(activeCareer, selectedPlanFilterId) : null
  const drivePlanName = drivePlan?.name || ''
  const driveSettingsKey = activeCareer ? getDriveSettingsKey(activeCareer, drivePlanName) : ''
  const savedDriveSettings = driveSettingsKey ? (driveSettingsByCareer[driveSettingsKey] || {}) : {}
  const hasSavedDriveSettings = !!(savedDriveSettings.rootFolderUrl || savedDriveSettings.pdfFolderUrl)

  const renderCompetencySection = ({ title, type, required }) => {
    const items = Array.isArray(formData[type]) ? formData[type] : []
    const isGeneric = type === 'competenciasGenItems'
    const canEditCompetencies = !isDocenteView
    const catalogList = isGeneric ? careerCompetencies.generic : careerCompetencies.specific
    const planName = formData.plan || getCatalogPlanName(activeCareer)
    const filteredCatalogList = filterCompetenciesByPlan(catalogList, planName, activeCareer)
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
                  {filteredCatalogList.map((entry) => (
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
          <MenuButton label="Inicio" onClick={() => handleMenuChange('home')} active={activeMenu === 'home'} />
        )}
        {!isDocenteView && (
          <MenuButton label="Plan de Estudios" onClick={() => handleMenuChange('plan')} active={activeMenu === 'plan'} />
        )}
        {!isDocenteView && (
          <MenuButton
            label="Competencias"
            onClick={() => handleMenuChange('competencias')}
            active={activeMenu === 'competencias'}
          />
        )}
        <MenuButton
          label="Propuestas"
          onClick={() => handleMenuChange('propuestas')}
          active={activeMenu === 'propuestas'}
        />
        <MenuButton
          label="Control de Propuestas"
          onClick={() => handleMenuChange('control-propuestas')}
          active={activeMenu === 'control-propuestas'}
        />
        {!isDocenteView && (
          <MenuButton label="Docentes" onClick={() => handleMenuChange('docentes')} active={activeMenu === 'docentes'} />
        )}
        <MenuButton label="Resoluciones" onClick={() => handleMenuChange('resoluciones')} active={activeMenu === 'resoluciones'} />

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
          {activeCareer && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#1a3d5c', fontWeight: 600 }}>
              Plan activo: {getActivePlan(activeCareer)?.name || 'Sin plan'}
            </div>
          )}
          <label style={{ ...styles.label, marginTop: '10px' }}>Filtrar por plan</label>
          <select
            style={{ ...styles.input, marginBottom: 0 }}
            value={selectedPlanFilterId || ''}
            onChange={(e) => setSelectedPlanFilterId(e.target.value ? Number(e.target.value) : null)}
            disabled={!activeCareer || !(savedPlans[activeCareer] || []).length}
          >
            <option value="">Todos los planes</option>
            {(savedPlans[activeCareer] || []).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}{plan.is_active ? ' (vigente)' : ''}
              </option>
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
              <div style={{ border: '1px solid #d0d0d0', borderRadius: '10px', padding: '16px', background: '#f8f9fb', display: 'flex', flexDirection: 'column', minHeight: '170px' }}>
                <div style={{ fontSize: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>📘</span> Propuestas
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800 }}>{totalProposalsHome}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    <div>✅ Creadas: {completeProposals.length}</div>
                    <div>⏳ En proceso: {inProcessProposals.length}</div>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                  {proposalsCreatedPct}% creadas
                </div>
              </div>
              <div style={{ border: '1px solid #cde7d6', borderRadius: '10px', padding: '16px', background: '#f1fbf4', display: 'flex', flexDirection: 'column', minHeight: '170px' }}>
                <div style={{ fontSize: '16px', color: '#2b6a3b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>👩‍🏫</span> Docentes
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#2b6a3b' }}>{teacherCatalogItems.length}</div>
                  <div style={{ fontSize: '12px', color: '#2b6a3b', marginTop: '8px' }}>
                    <div>✅ Con datos completos: {teachersCompleteCount}</div>
                    <div>⚠️ Con datos incompletos: {teachersIncompleteCount}</div>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#2b6a3b' }}>
                  {teachersCompletePct}% completos
                </div>
              </div>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', background: '#fafafa' }}>
                <div style={{ fontSize: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>📄</span> Resoluciones
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800 }}>0</div>
              </div>
              <div style={{ border: '1px solid #d4a5d4', borderRadius: '10px', padding: '16px', background: '#f9f1f9', display: 'flex', flexDirection: 'column', minHeight: '170px' }}>
                <div style={{ fontSize: '16px', color: '#6b2c6b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ fontSize: '24px' }}>📚</span> Asignaturas
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#6b2c6b' }}>{subjectStatsHome.total}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    <div>✅ Con propuesta: {subjectStatsHome.withProposals}</div>
                    <div>❌ Sin propuesta: {subjectStatsHome.withoutProposals}</div>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#6b2c6b' }}>
                  {subjectsWithProposalPct}% con propuesta
                </div>
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
            {!isDocenteView && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px', marginTop: '20px' }}>
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

                {/* Card 2: Importar */}
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

                <div style={{ 
                  border: '2px solid #6b7280', 
                  borderRadius: '8px', 
                  padding: '20px', 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  backgroundColor: 'rgba(243, 244, 246, 0.45)'
                }}
                onMouseEnter={(e) => { e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)'; e.target.style.backgroundColor = 'rgba(238, 242, 247, 0.55)'; }}
                onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = 'rgba(243, 244, 246, 0.45)'; }}
                onClick={() => setActiveMenu('configuracion')}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚙️</div>
                  <h3 style={{ color: '#4b5563', margin: '0 0 10px 0' }}>Configuración Drive</h3>
                  <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>Definir carpetas por carrera</p>
                </div>
              </div>
            )}

            {/* PROPOSALS TABLE */}
            <div style={{ ...styles.section, marginTop: '30px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>Propuestas Cargadas ({filteredProposals.length})</h3>
                <button
                  style={{ ...styles.button, background: '#1a73e8', marginRight: 0, padding: '8px 12px', fontSize: '12px' }}
                  onClick={handleManualGdocRefresh}
                  disabled={gdocStatusLoading}
                  title="Forzar chequeo inmediato del estado de Google Docs"
                >
                  {gdocStatusLoading ? 'Sincronizando...' : '🔄 Sincronizar ahora'}
                </button>
              </div>
              {filteredProposals.length > 0 ? (
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
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'plan')}
                        >
                          Plan de estudio{getSortIndicator(completeProposalSort, 'plan')}
                        </th>
                        <th
                          style={{ width: '150px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'updated_at')}
                        >
                          Ultima edición{getSortIndicator(completeProposalSort, 'updated_at')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'status')}
                        >
                          Estado{getSortIndicator(completeProposalSort, 'status')}
                        </th>
                        <th
                          style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #0066cc', cursor: 'pointer' }}
                          onClick={() => toggleSort(setCompleteProposalSort, 'drive')}
                        >
                          Drive{getSortIndicator(completeProposalSort, 'drive')}
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
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.academic_year}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.academic_year.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </th>
                        <th style={{ padding: '6px' }}>
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.year_of_career}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, year_of_career: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.year_of_career.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </th>
                        <th style={{ padding: '6px' }}>
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.quarter}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, quarter: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.quarter.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </th>
                        <th style={{ padding: '6px' }}>
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.plan}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, plan: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.plan.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
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
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.status}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.status.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </th>
                        <th style={{ padding: '6px' }}>
                          <select
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #cfd8dc', borderRadius: '4px' }}
                            value={completeProposalFilters.drive}
                            onChange={(e) => setCompleteProposalFilters(prev => ({ ...prev, drive: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {proposalFilterOptions.drive.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </th>
                        <th style={{ padding: '6px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {allProposalsFiltered.map((prop, idx) => (
                        <tr
                          key={prop.id}
                          style={{
                            backgroundColor: prop.status === 'EnProceso'
                              ? (idx % 2 === 0 ? '#fff8ef' : '#fff5e6')
                              : (idx % 2 === 0 ? '#f9f9f9' : '#fff'),
                            borderBottom: '1px solid #eee'
                          }}
                        >
                          <td style={{ width: '70px', padding: '10px' }}>#{prop.id}</td>
                          <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                          <td style={{ padding: '10px' }}>{renderCapsule(prop.academic_year || '-', 'year')}</td>
                          <td style={{ padding: '10px' }}>{renderCapsule(prop.year_of_career || '-', 'year')}</td>
                          <td style={{ padding: '10px' }}>{renderCapsule(prop.quarter || '-', 'quarter')}</td>
                          <td style={{ padding: '10px' }}>{renderCapsule(prop.study_plan || prop.plan || '-', 'plan')}</td>
                          <td style={{ padding: '10px' }}>{formatDateTime(prop.updated_at || prop.created_at)}</td>
                          <td style={{ padding: '10px' }}>{renderStatusCapsule(prop.status || '-')}</td>
                          <td style={{ padding: '10px' }}>
                            {renderDriveCapsule(prop)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                              title="Ver propuesta"
                              onClick={() => openProposalView(prop.id)}
                            >
                              👁️
                            </button>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                              title="Editar propuesta"
                              onClick={() => loadProposalForEdit(prop.id)}
                            >
                              ✏️
                            </button>
                            <button
                              style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                              title="Descargar propuesta"
                              onClick={() => downloadProposalDocx(prop.id)}
                            >
                              ⬇️
                            </button>
                            {!isDocenteView && (
                              <button
                                style={{ ...styles.button, padding: '6px 10px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
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

        {activeMenu === 'configuracion' && !isDocenteView && (
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>Configuración de Drive</h2>
                <div style={{ color: '#666' }}>Aplica a la carrera activa</div>
              </div>
              <button
                style={{ ...styles.button, background: '#999' }}
                onClick={() => setActiveMenu('propuestas')}
              >
                ← Volver
              </button>
            </div>

            <div style={{ marginTop: '16px', background: '#f8f8f8', padding: '16px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <div style={{ marginBottom: '12px', color: '#1a3d5c', fontWeight: 600 }}>
                Carrera: {activeCareer || 'Sin seleccionar'} {drivePlanName && `→ Plan: ${drivePlanName}`}
              </div>
              {(!hasSavedDriveSettings || driveSettingsEditing) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={styles.label}>Carpeta Raíz (Drive)</label>
                    <input
                      style={styles.input}
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={driveSettingsForm.rootFolderUrl}
                      onChange={(e) => setDriveSettingsForm((prev) => ({ ...prev, rootFolderUrl: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        style={{ ...styles.button, background: '#455a64' }}
                        onClick={() => openDriveUrl(driveSettingsForm.rootFolderUrl)}
                        disabled={!driveSettingsForm.rootFolderUrl}
                        title={!driveSettingsForm.rootFolderUrl ? 'No configurado' : ''}
                      >
                        {driveSettingsForm.rootFolderUrl ? 'Abrir carpeta' : 'Abrir carpeta (no configurado)'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={styles.label}>Carpeta PDF (Drive)</label>
                    <input
                      style={styles.input}
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={driveSettingsForm.pdfFolderUrl}
                      onChange={(e) => setDriveSettingsForm((prev) => ({ ...prev, pdfFolderUrl: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        style={{ ...styles.button, background: '#455a64' }}
                        onClick={() => openDriveUrl(driveSettingsForm.pdfFolderUrl)}
                        disabled={!driveSettingsForm.pdfFolderUrl}
                        title={!driveSettingsForm.pdfFolderUrl ? 'No configurado' : ''}
                      >
                        {driveSettingsForm.pdfFolderUrl ? 'Abrir carpeta PDF' : 'Abrir carpeta PDF (no configurado)'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    {hasSavedDriveSettings && (
                      <button
                        style={{ ...styles.button, background: '#999' }}
                        onClick={() => {
                          setDriveSettingsForm({
                            rootFolderUrl: savedDriveSettings.rootFolderUrl || '',
                            pdfFolderUrl: savedDriveSettings.pdfFolderUrl || ''
                          })
                          setDriveSettingsError('')
                          setDriveSettingsEditing(false)
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                    <button style={{ ...styles.button, background: '#4caf50' }} onClick={saveDriveSettings}>
                      Guardar configuración
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    style={{ ...styles.button, background: '#455a64' }}
                    onClick={() => openDriveUrl(savedDriveSettings.rootFolderUrl)}
                    disabled={!savedDriveSettings.rootFolderUrl}
                    title={!savedDriveSettings.rootFolderUrl ? 'No configurado' : ''}
                  >
                    {savedDriveSettings.rootFolderUrl ? 'Abrir carpeta' : 'Abrir carpeta (no configurado)'}
                  </button>
                  <button
                    style={{ ...styles.button, background: '#455a64' }}
                    onClick={() => openDriveUrl(savedDriveSettings.pdfFolderUrl)}
                    disabled={!savedDriveSettings.pdfFolderUrl}
                    title={!savedDriveSettings.pdfFolderUrl ? 'No configurado' : ''}
                  >
                    {savedDriveSettings.pdfFolderUrl ? 'Abrir carpeta PDF' : 'Abrir carpeta PDF (no configurado)'}
                  </button>
                  <button
                    style={{ ...styles.button, background: '#999' }}
                    onClick={() => setDriveSettingsEditing(true)}
                  >
                    Editar
                  </button>
                </div>
              )}
              {driveSettingsError && (
                <div style={{ color: '#b00020', marginTop: '10px' }}>{driveSettingsError}</div>
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
                      onChange={(e) => {
                        const career = e.target.value
                        setActiveCareer(career)
                        // Auto-load the active plan for this career
                        const plan = getActivePlan(career)
                        if (plan) {
                          updateFormData('plan', plan.name)
                        }
                      }}
                      disabled={isDocenteView}
                    >
                      <option value="">Seleccionar carrera...</option>
                      {careerOptions.map((career) => (
                        <option key={career} value={career}>{career}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={styles.label}>Asignatura *</label>
                    {activeCareer && getActivePlan(activeCareer) ? (
                      <div style={{ position: 'relative' }}>
                        <input
                          style={styles.input}
                          placeholder="Buscar o escribir asignatura..."
                          value={subjectAutocompleteQuery || formData.asignatura}
                          onChange={(e) => {
                            setSubjectAutocompleteQuery(e.target.value)
                            if (!e.target.value.trim()) {
                              updateFormData('asignatura', '')
                              updateFormData('ciclo', '')
                              updateFormData('cuatrimestre', '')
                            }
                          }}
                          onFocus={() => setSubjectAutocompleteFocus(true)}
                          onBlur={() => {
                            // If user typed something but didn't select from suggestions, save it anyway
                            if (subjectAutocompleteQuery && !formData.asignatura) {
                              updateFormData('asignatura', subjectAutocompleteQuery)
                            }
                            setTimeout(() => setSubjectAutocompleteFocus(false), 150)
                          }}
                          onKeyDown={(e) => {
                            // Allow Enter to confirm current input without selecting from suggestions
                            if (e.key === 'Enter' && subjectAutocompleteQuery && getSubjectSuggestions(subjectAutocompleteQuery, activeCareer).length === 0) {
                              updateFormData('asignatura', subjectAutocompleteQuery)
                              setSubjectAutocompleteQuery('')
                              setSubjectAutocompleteFocus(false)
                            }
                          }}
                          disabled={isDocenteView}
                        />
                        {subjectAutocompleteFocus && subjectAutocompleteQuery && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            background: '#fff', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px', 
                            zIndex: 5, 
                            maxHeight: '200px', 
                            overflowY: 'auto',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            {getSubjectSuggestions(subjectAutocompleteQuery, activeCareer).map((subject, idx) => (
                              <div
                                key={`${subject.id}-${idx}`}
                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                onMouseDown={() => {
                                  handleSubjectSelection(subject.name)
                                  setSubjectAutocompleteQuery('')
                                  setSubjectAutocompleteFocus(false)
                                }}
                              >
                                <div style={{ fontWeight: '600' }}>{subject.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Año {subject.year} • {subject.termName}</div>
                              </div>
                            ))}
                            {getSubjectSuggestions(subjectAutocompleteQuery, activeCareer).length === 0 && (
                              <div style={{ padding: '10px', color: '#999', fontSize: '12px' }}>
                                No encontrado. Presiona Enter para continuar con este nombre.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input 
                        style={styles.input} 
                        value={formData.asignatura} 
                        onChange={(e) => updateFormData('asignatura', e.target.value)} 
                        disabled={isDocenteView}
                        placeholder="Selecciona carrera con plan vigente"
                      />
                    )}
                  </div>

                  {/* ROW 1: Plan, Año, Ciclo, Cuatrimestre */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px', padding: '0 10px', gridColumn: '1 / -1' }}>
                    <div>
                      <label style={styles.label}>Plan de Estudios *</label>
                      {activeCareer ? (
                        <select
                          style={styles.input}
                          value={formData.plan}
                          onChange={(e) => updateFormData('plan', e.target.value)}
                          disabled={isDocenteView || planOptions.length === 0}
                        >
                          <option value="">Seleccionar...</option>
                          {hasCustomPlanOption && (
                            <option value={formData.plan}>{formData.plan} (actual)</option>
                          )}
                          {planOptions.map((plan) => (
                            <option key={plan.id} value={plan.name}>
                              {plan.name}{plan.is_active ? ' (vigente)' : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          style={{ ...styles.input, ...styles.readonlyField, color: '#666', fontWeight: 'bold' }}
                        >
                          Sin plan vigente
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={styles.label}>Año Académico *</label>
                      <input style={styles.input} value={formData.anio} onChange={(e) => updateFormData('anio', e.target.value)} placeholder="Ej: 2024" disabled={isDocenteView} />
                    </div>
                    <div>
                      <label style={styles.label}>Año en carrera *</label>
                      <input style={styles.input} value={formData.ciclo} onChange={(e) => updateFormData('ciclo', e.target.value)} placeholder="Ej: 1, 2, 3, 4, 5" disabled={isDocenteView} />
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
                {!formData.gdocUrl && (
                  <div style={{ background: '#ffffff', border: '1px solid #d9e1e6', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: '260px' }}>
                    <div style={{ fontSize: '12px', color: '#445', marginBottom: '6px', fontWeight: 600 }}>Crear en Google Drive al guardar</div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                      <span style={{ fontSize: '12px', color: '#555' }}>{createInDriveOnSave ? 'Activado' : 'Desactivado'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isSaving) return
                          setCreateInDriveOnSave((prev) => !prev)
                        }}
                        style={{
                          width: '46px',
                          height: '24px',
                          borderRadius: '20px',
                          border: '1px solid #c7d3df',
                          background: createInDriveOnSave ? '#2e7d32' : '#cfd8dc',
                          position: 'relative',
                          padding: 0,
                          outline: 'none',
                          cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                        title="Activar creación en Drive"
                        disabled={isSaving}
                        aria-pressed={createInDriveOnSave}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: createInDriveOnSave ? '24px' : '2px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s ease'
                          }}
                        />
                      </button>
                    </label>
                    {isCreatingInDrive && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#0066cc' }}>
                        ⏳ Guardando y creando documento en Drive...
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={!canSaveDraft || isSaving}
                    title={canSaveDraft ? 'Guardar borrador (estado: En Proceso)' : 'Completa Carrera y Asignatura'}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Borrador'}
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
                    disabled={!canCreateProposal || isSaving}
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
                    {isSaving ? 'Guardando...' : 'Crear Propuesta'}
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
                      disabled={!canSaveEdits || isSaving}
                      title={canSaveEdits ? 'Guardar como borrador (incompleto)' : 'Completa Carrera y Asignatura'}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Borrador'}
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
                      disabled={!canSaveEdits || isSaving}
                      title={canSaveEdits ? 'Guardar propuesta' : 'Completa Carrera y Asignatura'}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Propuesta'}
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
            <h2>Propuestas</h2>
            {filteredProposals.length === 0 ? (
              <p>No hay propuestas guardadas</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3d5c', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Asignatura</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Carrera</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Plan de Estudios</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Creada</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Ultima edición</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #006ba8' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #006ba8' }}>Descargar</th>
                  </tr>
                </thead>
                <tbody>
                  {allProposalsFiltered.map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #ddd',
                        backgroundColor: p.status === 'EnProceso'
                          ? (idx % 2 === 0 ? '#fff8ef' : '#fff5e6')
                          : (idx % 2 === 0 ? '#f9f9f9' : '#fff')
                      }}
                    >
                      <td style={{ padding: '10px' }}>{p.id}</td>
                      <td style={{ padding: '10px' }}>{p.title || 'Sin título'}</td>
                      <td style={{ padding: '10px' }}>{p.career || '-'}</td>
                      <td style={{ padding: '10px' }}>{p.study_plan || p.plan || '-'}</td>
                      <td style={{ padding: '10px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>{formatDateTime(p.updated_at || p.created_at)}</td>
                      <td style={{ padding: '10px' }}>{renderStatusCapsule(p.status || '-')}</td>
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
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900' }}>
                        Plan de Estudios
                      </th>
                      <th
                        style={{ width: '150px', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'updated_at')}
                      >
                        Ultima edición{getSortIndicator(pendingProposalSort, 'updated_at')}
                      </th>
                      <th
                        style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ff9900', cursor: 'pointer' }}
                        onClick={() => toggleSort(setPendingProposalSort, 'drive')}
                      >
                        Drive{getSortIndicator(pendingProposalSort, 'drive')}
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
                        <select
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.academic_year}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                        >
                          <option value="">Todos</option>
                          {pendingProposalFilterOptions.academic_year.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </th>
                      <th style={{ padding: '6px' }}>
                        <select
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.year_of_career}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, year_of_career: e.target.value }))}
                        >
                          <option value="">Todos</option>
                          {pendingProposalFilterOptions.year_of_career.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </th>
                      <th style={{ padding: '6px' }}>
                        <select
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.quarter}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, quarter: e.target.value }))}
                        >
                          <option value="">Todos</option>
                          {pendingProposalFilterOptions.quarter.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </th>
                      <th style={{ padding: '6px' }}>
                        <select
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.plan}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, plan: e.target.value }))}
                        >
                          <option value="">Todos</option>
                          {pendingProposalFilterOptions.plan.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
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
                        <select
                          style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #e0c9a0', borderRadius: '4px' }}
                          value={pendingProposalFilters.drive}
                          onChange={(e) => setPendingProposalFilters(prev => ({ ...prev, drive: e.target.value }))}
                        >
                          <option value="">Todos</option>
                          {pendingProposalFilterOptions.drive.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </th>
                      <th style={{ padding: '6px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {inProcessProposalsFiltered.map((prop, idx) => (
                      <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ width: '70px', padding: '10px' }}>#{prop.id}</td>
                        <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                        <td style={{ padding: '10px' }}>{renderCapsule(prop.academic_year || '-', 'year')}</td>
                        <td style={{ padding: '10px' }}>{renderCapsule(prop.year_of_career || '-', 'year')}</td>
                        <td style={{ padding: '10px' }}>{renderCapsule(prop.quarter || '-', 'quarter')}</td>
                        <td style={{ padding: '10px' }}>{renderCapsule(prop.study_plan || prop.plan || '-', 'plan')}</td>
                        <td style={{ padding: '10px' }}>{formatDateTime(prop.updated_at || prop.created_at)}</td>
                        <td style={{ padding: '10px' }}>
                          {renderDriveCapsule(prop)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                            title="Ver propuesta"
                            onClick={() => openProposalView(prop.id)}
                          >
                            👁︎
                          </button>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                            title="Editar propuesta"
                            onClick={() => loadProposalForEdit(prop.id)}
                          >
                            ✏︎
                          </button>
                          <button
                            style={{ ...styles.button, padding: '6px 10px', marginRight: '6px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
                            title="Descargar propuesta"
                            onClick={() => downloadProposalDocx(prop.id)}
                          >
                            ⬇︎
                          </button>
                          {!isDocenteView && (
                            <button
                              style={{ ...styles.button, padding: '6px 10px', background: 'rgba(120, 144, 156, 0.35)', color: '#1f2d3d' }}
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
                <div style={{ marginTop: '30px', borderTop: '1px solid #d0e6d0', paddingTop: '20px' }}>
                  <p style={{ color: '#00a854', fontWeight: 'bold', marginBottom: '8px' }}>O importa desde Google Docs (público)</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setImportError('');
                    setImportLoading(true);
                    setImportPreview(null);
                    try {
                      if (!importGdocUrl.trim()) {
                        setImportError('Pega el enlace público de Google Docs');
                        setImportLoading(false);
                        return;
                      }
                      // Validar formato básico de Google Docs
                      const gdocRegex = /https:\/\/(docs|drive)\.google\.com\/(document\/d\/[\w-]+|open\?id=[\w-]+|file\/d\/[\w-]+)/;
                      if (!gdocRegex.test(importGdocUrl.trim())) {
                        setImportError('El enlace no parece ser de un documento público de Google Docs');
                        setImportLoading(false);
                        return;
                      }
                      const res = await fetch('http://localhost:8001/proposals/import-gdoc-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: importGdocUrl.trim() })
                      });
                      if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ detail: 'Error desconocido' }));
                        throw new Error(errorData.detail || `Error ${res.status}`);
                      }
                      const result = await res.json();
                      if (result.success) {
                        setImportPreview(result);
                        setStatusMsg('Documento importado exitosamente');
                        setStatusType('success');
                      } else {
                        throw new Error(result.error || 'Error desconocido');
                      }
                    } catch (err) {
                      const msg = err.message === 'Failed to fetch' 
                        ? 'No hay conexión con el Backend (8001)' 
                        : err.message;
                      setImportError('Error al importar: ' + msg);
                      setStatusMsg('Error al importar: ' + msg);
                      setStatusType('error');
                    } finally {
                      setImportLoading(false);
                    }
                  }}>
                    <input
                      type="text"
                      placeholder="Pega el enlace público de Google Docs"
                      value={importGdocUrl || ''}
                      onChange={e => setImportGdocUrl(e.target.value)}
                      disabled={importLoading}
                      style={{ width: '100%', padding: '8px', border: '1px solid #b2dfdb', borderRadius: '4px', marginBottom: '8px' }}
                    />
                    <button
                      type="submit"
                      style={{ ...styles.button, background: '#00a854', color: '#fff', marginRight: 0 }}
                      disabled={importLoading}
                    >
                      Importar desde Google Docs
                    </button>
                  </form>
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
                    El documento debe ser público o tener permisos de "Cualquiera con el enlace".<br />
                    Se descargará como DOCX y se procesará igual que un archivo subido.
                  </p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <select
                      style={styles.input}
                      value={catalogFormGeneric.plan_name}
                      onChange={(e) => setCatalogFormGeneric(prev => ({ ...prev, plan_name: e.target.value }))}
                      disabled={!activeCareer}
                    >
                      <option value="">Seleccionar plan...</option>
                      {(savedPlans[activeCareer] || []).map((plan) => (
                        <option key={plan.id} value={plan.name}>
                          {plan.name}{plan.is_active ? ' (vigente)' : ''}
                        </option>
                      ))}
                    </select>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <select
                      style={styles.input}
                      value={catalogFormSpecific.plan_name}
                      onChange={(e) => setCatalogFormSpecific(prev => ({ ...prev, plan_name: e.target.value }))}
                      disabled={!activeCareer}
                    >
                      <option value="">Seleccionar plan...</option>
                      {(savedPlans[activeCareer] || []).map((plan) => (
                        <option key={plan.id} value={plan.name}>
                          {plan.name}{plan.is_active ? ' (vigente)' : ''}
                        </option>
                      ))}
                    </select>
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
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setGenericCompetencySort, 'plan')}
                          >
                            Plan{getSortIndicator(genericCompetencySort, 'plan')}
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
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={genericCompetencyFilters.plan}
                              onChange={(e) => setGenericCompetencyFilters(prev => ({ ...prev, plan: e.target.value }))}
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
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {renderCapsule(item.plan_name || '-', 'plan')}
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
                          <th
                            style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => toggleSort(setSpecificCompetencySort, 'plan')}
                          >
                            Plan{getSortIndicator(specificCompetencySort, 'plan')}
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
                          <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                            <input
                              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                              value={specificCompetencyFilters.plan}
                              onChange={(e) => setSpecificCompetencyFilters(prev => ({ ...prev, plan: e.target.value }))}
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
                            <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                              {renderCapsule(item.plan_name || '-', 'plan')}
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
                  {teacherUsageInfo.items.length ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {renderTeacherUsageTable(teacherUsageAnnualRows, 'Anual')}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {renderTeacherUsageTable(teacherUsageFirstRows, '1er Cuatrimestre') || (
                          <div style={{ border: '1px dashed #d5deea', borderRadius: '6px', padding: '10px', color: '#8a98ad', fontSize: '12px' }}>
                            Sin asignaturas en 1er cuatrimestre
                          </div>
                        )}
                        {renderTeacherUsageTable(teacherUsageSecondRows, '2do Cuatrimestre') || (
                          <div style={{ border: '1px dashed #d5deea', borderRadius: '6px', padding: '10px', color: '#8a98ad', fontSize: '12px' }}>
                            Sin asignaturas en 2do cuatrimestre
                          </div>
                        )}
                      </div>
                      {renderTeacherUsageTable(teacherUsageOtherRows, 'Otros')}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {teacherUsageInfo.ids.map((id) => (
                        <div key={id}>#{id}</div>
                      ))}
                    </div>
                  )}
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
                      placeholder="Apellido y Nombre"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', color: '#4d4d4d', fontWeight: 600 }}>Vista:</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '12px', color: teacherViewMode === 'table' ? '#1f2d3d' : '#7a8793', fontWeight: teacherViewMode === 'table' ? 700 : 500 }}>
                      Tabla
                    </span>
                    <button
                      type="button"
                      onClick={() => setTeacherViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
                      style={{
                        width: '46px',
                        height: '24px',
                        borderRadius: '20px',
                        border: '1px solid #c7d3df',
                        background: teacherViewMode === 'cards' ? '#2e7d32' : '#cfd8dc',
                        position: 'relative',
                        padding: 0,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      title="Cambiar vista Tabla/Tarjetas"
                      aria-pressed={teacherViewMode === 'cards'}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: teacherViewMode === 'cards' ? '24px' : '2px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s ease'
                        }}
                      />
                    </button>
                    <span style={{ fontSize: '12px', color: teacherViewMode === 'cards' ? '#1f2d3d' : '#7a8793', fontWeight: teacherViewMode === 'cards' ? 700 : 500 }}>
                      Tarjetas
                    </span>
                  </label>
                </div>
                {teacherCatalogLoading ? (
                  <div style={{ color: '#555' }}>Cargando docentes...</div>
                ) : teacherCatalogError ? (
                  <div style={{ color: '#b00020' }}>{teacherCatalogError}</div>
                ) : teacherCatalogItems.length === 0 ? (
                  <div style={{ color: '#777', fontStyle: 'italic' }}>No hay docentes cargados.</div>
                ) : teacherViewMode === 'table' ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' }}>
                    <thead>
                      <tr style={{ background: '#0066cc', color: '#fff', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>ID</th>
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'name')}
                        >
                          Apellido y Nombre{getSortIndicator(teacherTableSort, 'name')}
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
                        <th
                          style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', cursor: 'pointer' }}
                          onClick={() => toggleSort(setTeacherTableSort, 'subject_count')}
                        >
                          Cant. asignaturas{getSortIndicator(teacherTableSort, 'subject_count')}
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
                      </tr>
                      <tr style={{ background: '#eaf3ff' }}>
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }} />
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
                        <th style={{ padding: '6px', borderRight: '1px solid #eee' }}>
                          <input
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', marginBottom: 0, border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            value={teacherTableFilters.subject_count}
                            onChange={(e) => setTeacherTableFilters(prev => ({ ...prev, subject_count: e.target.value }))}
                            placeholder="Buscar"
                          />
                        </th>
                        <th style={{ padding: '6px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {teacherCatalogFiltered.map((teacher, idx) => (
                        <tr
                          key={teacher.id ?? idx}
                          ref={(node) => {
                            if (!teacher?.id) return
                            const key = String(teacher.id)
                            if (node) teacherAnchorRefs.current[key] = node
                            else delete teacherAnchorRefs.current[key]
                          }}
                          style={{
                            borderBottom: '1px solid #eee',
                            background: teacherHighlightId === teacher.id ? '#eaf6ff' : (idx % 2 === 0 ? '#fff' : '#f9f9f9'),
                            transition: 'background 0.4s ease'
                          }}
                        >
                          {teacherEditId === teacher.id ? (
                            <>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.id ?? idx + 1}</td>
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
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{getTeacherSubjectCount(teacher)}</td>
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
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.id ?? idx + 1}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.name || '-'}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{renderCapsule(teacher.category || '-', 'category')}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                                {renderCapsule(teacher.dedication || 'Sin Informar', 'dedication')}
                              </td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{teacher.email || '-'}</td>
                              <td style={{ padding: '8px', borderRight: '1px solid #ddd' }}>{getTeacherSubjectCount(teacher)}</td>
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
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {teacherCatalogFiltered.map((teacher, idx) => (
                      <div key={teacher.id ?? idx} ref={(node) => {
                        if (!teacher?.id) return
                        const key = String(teacher.id)
                        if (node) teacherAnchorRefs.current[key] = node
                        else delete teacherAnchorRefs.current[key]
                      }} style={{
                        border: teacherHighlightId === teacher.id ? '1px solid #8ccfff' : '1px solid rgba(0, 102, 204, 0.22)',
                        borderRadius: '10px',
                        background: teacherHighlightId === teacher.id ? '#eef8ff' : '#fff',
                        padding: '14px',
                        boxShadow: teacherHighlightId === teacher.id
                          ? '0 0 0 2px rgba(140, 207, 255, 0.32), 0 6px 16px rgba(140, 207, 255, 0.22)'
                          : '0 1px 4px rgba(0, 102, 204, 0.08)',
                        transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease'
                      }}>
                        {teacherEditId === teacher.id ? (
                          <>
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>ID: {teacher.id ?? idx + 1}</div>
                            <input
                              style={{ ...styles.input, marginBottom: '8px' }}
                              placeholder="Apellido y Nombre"
                              value={teacherEditForm.name}
                              onChange={(e) => setTeacherEditForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                            />
                            <input
                              style={{ ...styles.input, marginBottom: '8px' }}
                              placeholder="Correo"
                              value={teacherEditForm.email}
                              onChange={(e) => setTeacherEditForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <select
                              style={{ ...styles.input, marginBottom: '8px' }}
                              value={teacherEditForm.dedication}
                              onChange={(e) => setTeacherEditForm(prev => ({ ...prev, dedication: e.target.value }))}
                            >
                              <option>Sin Informar</option>
                              <option>Simple</option>
                              <option>Parcial</option>
                              <option>Parcial + Simple</option>
                              <option>Exclusivo</option>
                            </select>
                            <select
                              style={{ ...styles.input, marginBottom: '8px' }}
                              value={teacherEditForm.category}
                              onChange={(e) => setTeacherEditForm(prev => ({ ...prev, category: e.target.value }))}
                            >
                              <option>TITULAR</option>
                              <option>ASOCIADO</option>
                              <option>ADJUNTO</option>
                              <option>JTP</option>
                              <option>AYUDANTE 1º</option>
                            </select>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button
                                style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', marginRight: 0 }}
                                onClick={() => saveTeacherEdit(teacher)}
                              >
                                Guardar
                              </button>
                              <button
                                style={{ ...styles.button, background: '#999', color: '#fff', marginRight: 0 }}
                                onClick={cancelTeacherEdit}
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '6px' }}>ID: {teacher.id ?? idx + 1}</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: '#1f2d3d' }}>
                              {teacher.name || '-'}
                            </div>
                            <div style={{ marginBottom: '6px' }}><strong>Correo:</strong> {teacher.email || '-'}</div>
                            <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong>Dedicación:</strong> {renderCapsule(teacher.dedication || 'Sin Informar', 'dedication')}
                            </div>
                            <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong>Cargo:</strong> {renderCapsule(teacher.category || '-', 'category')}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>Cantidad de asignaturas:</strong> {getTeacherSubjectCount(teacher)}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', marginRight: 0 }}
                                onClick={() => loadTeacherUsage(teacher)}
                              >
                                Ver
                              </button>
                              <button
                                style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', marginRight: 0 }}
                                onClick={() => startTeacherEdit(teacher)}
                              >
                                Editar
                              </button>
                              <button
                                style={{ ...styles.button, background: 'rgba(69, 90, 100, 0.85)', color: '#fff', marginRight: 0 }}
                                onClick={() => openDeleteTeacherModal(teacher)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </>
            )}
          </div>
        )}

        {/* CONTROL DE PROPUESTAS */}
        {activeMenu === 'control-propuestas' && (
          <div style={styles.section}>
            <h2>Control de Propuestas</h2>
            {!activeCareer ? (
              <div style={{ color: '#777', fontStyle: 'italic' }}>
                Selecciona una carrera para ver el control.
              </div>
            ) : (isDocenteView && !hasSelectedTeacher) ? (
              <div style={{ marginTop: '10px', background: '#fff6e6', border: '1px solid #ffcc80', padding: '10px 12px', borderRadius: '6px', color: '#7a4b00' }}>
                Selecciona un docente para ver el control solo de sus asignaturas.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '12px', color: '#555' }}>
                  Panel de control por asignatura ({selectedPlanName ? `Plan: ${selectedPlanName}` : 'Todos los planes'}).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  {[
                    { key: 'quick', icon: '⚡', title: 'Control rápido', subtitle: `${controlChecklistRows.length} asignaturas`, description: 'Chequeos automáticos de completitud por campo.' },
                    { key: 'intelligent', icon: '🧠', title: 'Control inteligente', subtitle: `Validadas: ${intelligentValidatedCount} · Con sugerencias: ${intelligentSuggestedCount}`, description: 'Evaluación LLM por tópico y sugerencias accionables.' },
                    {
                      key: 'config',
                      icon: '⚙️',
                      title: 'Configuración IA',
                      subtitle: `${intelligentControls.length} controles`,
                      description: isDocenteView
                        ? 'Solo puedes activar o desactivar reglas para tu entorno docente.'
                        : 'Alta, edición, activación y baja de reglas inteligentes.'
                    }
                  ].map((card) => (
                    <button
                      key={`control-card-${card.key}`}
                      ref={card.key === 'config' ? intelligentConfigCardRef : null}
                      onClick={() => setControlPanelMode(card.key)}
                      style={{
                        textAlign: 'left',
                        border: controlPanelMode === card.key ? '2px solid #1a73e8' : '1px solid #d7deea',
                        background: controlPanelMode === card.key ? '#eef5ff' : '#fff',
                        borderRadius: '8px',
                        padding: '14px',
                        minHeight: '108px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1a3d5c', marginBottom: '4px', fontSize: '18px' }}>
                        <span style={{ fontSize: '21px', lineHeight: 1 }}>{card.icon}</span>
                        <span>{card.title}</span>
                      </div>
                      <div style={{ color: '#607d8b', fontSize: '12px' }}>{card.subtitle}</div>
                      <div style={{ color: '#4f6476', fontSize: '12px', marginTop: '6px' }}>{card.description}</div>
                    </button>
                  ))}
                </div>

                {controlPanelMode === 'quick' && (
                  <>
                    {controlDetailsLoading && (
                      <div style={{ marginBottom: '10px', color: '#355070', fontSize: '12px' }}>
                        Cargando detalles completos de propuestas para validar checklist...
                      </div>
                    )}
                    <div style={{
                      marginBottom: '12px',
                      padding: '10px',
                      border: '1px solid #d8e2f0',
                      borderRadius: '8px',
                      background: '#f8fbff',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr auto',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      <input
                        style={{ ...styles.input, marginBottom: 0 }}
                        placeholder="Buscar por ID o asignatura"
                        value={controlSubjectFilter}
                        onChange={(e) => setControlSubjectFilter(e.target.value)}
                      />
                      <select
                        style={{ ...styles.input, marginBottom: 0 }}
                        value={controlFailureFilter}
                        onChange={(e) => setControlFailureFilter(e.target.value)}
                      >
                        <option value="all">Todos los criterios</option>
                        {controlChecklistColumns.map((column) => (
                          <option key={`control-filter-${column.key}`} value={column.key}>
                            Falla en: {column.label}
                          </option>
                        ))}
                      </select>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#355070', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={controlOnlyWithErrors}
                          onChange={(e) => setControlOnlyWithErrors(e.target.checked)}
                        />
                        Solo con errores
                      </label>
                    </div>
                    {controlChecklistRows.length === 0 ? (
                      <div style={{ color: '#777', fontStyle: 'italic' }}>
                        No hay asignaturas para la combinación de filtros actual.
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
                            <thead>
                              <tr style={{ background: '#0066cc', color: '#fff' }}>
                                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.25)', position: 'sticky', top: 0, zIndex: 3, background: '#0066cc' }}>ID</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.25)', position: 'sticky', top: 0, zIndex: 3, background: '#0066cc' }}>Asignatura</th>
                                {controlChecklistColumns.map((column) => (
                                  <th key={`control-head-${column.key}`} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)', minWidth: '95px', position: 'sticky', top: 0, zIndex: 3, background: '#0066cc' }}>
                                    {column.label}
                                  </th>
                                ))}
                                <th style={{ padding: '8px', textAlign: 'center', background: '#004d99', minWidth: '90px', position: 'sticky', top: 0, zIndex: 4 }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {controlRowGroups.map((group, groupIdx) => (
                                <React.Fragment key={group.key}>
                                  <tr style={{ background: '#e3f2fd', borderTop: groupIdx === 0 ? 'none' : '2px solid #90caf9' }}>
                                    <td colSpan={controlChecklistColumns.length + 3} style={{ padding: '8px 12px', fontWeight: 700, color: '#1565c0' }}>
                                      📚 {group.title}
                                    </td>
                                  </tr>
                                  {group.rows.map((row, idx) => (
                                    <tr key={row.rowKey} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #eee' }}>
                                      <td style={{ padding: '8px', borderRight: '1px solid #eee' }}>
                                        {row.missingProposal ? 'Sin propuesta' : `#${row.proposal.id}`}
                                      </td>
                                      <td style={{ padding: '8px', borderRight: '1px solid #eee', fontWeight: 600 }}>{row.proposal.subject || '-'}</td>
                                      {controlChecklistColumns.map((column) => {
                                        const check = row.checks[column.key]
                                        return (
                                          <td
                                            key={`control-cell-${row.rowKey}-${column.key}`}
                                            title={!check.ok ? check.reason : ''}
                                            style={{
                                              padding: '8px',
                                              textAlign: 'center',
                                              borderRight: '1px solid #eee',
                                              background: check.ok ? 'rgba(56, 142, 60, 0.08)' : 'rgba(211, 47, 47, 0.1)',
                                              color: check.ok ? '#1b5e20' : '#b00020',
                                              fontWeight: 700,
                                              cursor: check.ok ? 'default' : 'help'
                                            }}
                                          >
                                            {check.ok ? '✓' : '✗'}
                                          </td>
                                        )
                                      })}
                                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, background: '#f3f7ff', color: '#1a3d5c' }}>
                                        {row.rowTotalLabel}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: '#eef4ff', borderTop: '2px solid #c6d8ff' }}>
                                <td colSpan={2} style={{ padding: '8px', fontWeight: 700, color: '#1a3d5c' }}>
                                  Totales por criterio
                                </td>
                                {controlChecklistColumns.map((column) => (
                                  <td key={`control-total-${column.key}`} style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#1a3d5c' }}>
                                    {controlColumnTotals[column.key]}/{controlChecklistRows.length}
                                  </td>
                                ))}
                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#1a3d5c', background: '#dfe9ff' }}>
                                  {controlChecklistRows.reduce((sum, row) => sum + row.rowTotal, 0)}/{controlChecklistRows.length * controlChecklistColumns.length}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {controlPanelMode === 'intelligent' && (
                  <>
                    <div style={{ marginBottom: '8px', minHeight: '18px', color: '#355070', fontSize: '12px' }}>
                      {intelligentResultsLoading ? 'Actualizando estado de controles inteligentes...' : ''}
                    </div>
                    <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #d8e2f0', borderRadius: '8px', background: '#f8fbff' }}>
                      <div style={{ fontWeight: 700, color: '#355070', marginBottom: '8px' }}>Modo de ejecución IA</div>
                      <div style={{ color: '#607d8b', fontSize: '12px', marginBottom: '8px' }}>
                        Controles activos en este entorno: {activeControlIdsForCurrentView.length}
                      </div>
                      {isDocenteView && (
                        <div style={{ color: '#607d8b', fontSize: '12px', marginBottom: '8px' }}>
                          Dirección definió el modo para docentes: <strong>{effectiveIntelligentRunModeLabel}</strong>.
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(170px, 1fr))', gap: '8px' }}>
                        {intelligentModeOptions.map((mode) => (
                          <button
                            key={`run-mode-${mode.key}`}
                            onClick={() => {
                              if (isDocenteView) return
                              setIntelligentRunMode(mode.key)
                              saveIntelligentModeSettings({ director_last_mode: mode.key }).catch((err) => {
                                setStatusMsg(err.message || 'No se pudo guardar el modo IA del directivo')
                                setStatusType('error')
                              })
                            }}
                            disabled={isDocenteView}
                            title={isDocenteView ? `Modo fijado por Dirección: ${effectiveIntelligentRunModeLabel}` : ''}
                            style={{
                              textAlign: 'left',
                              border: effectiveIntelligentRunMode === mode.key ? '2px solid #1a73e8' : '1px solid #d0d8e6',
                              background: effectiveIntelligentRunMode === mode.key ? '#eaf2ff' : '#fff',
                              borderRadius: '8px',
                              padding: '10px',
                              cursor: isDocenteView ? 'not-allowed' : 'pointer',
                              minHeight: '72px',
                              opacity: isDocenteView ? 0.8 : 1
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#1a3d5c', marginBottom: '4px' }}>{mode.icon} {mode.title}</div>
                            <div style={{ color: '#607d8b', fontSize: '12px' }}>{mode.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{
                      marginBottom: '10px',
                      padding: '10px',
                      border: '1px solid #d8e2f0',
                      borderRadius: '8px',
                      background: '#f8fbff',
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr 1fr',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      <input
                        style={{ ...styles.input, marginBottom: 0 }}
                        placeholder="Filtrar por nombre o ID"
                        value={intelligentNameFilter}
                        onChange={(e) => setIntelligentNameFilter(e.target.value)}
                      />
                      <select
                        style={{ ...styles.input, marginBottom: 0 }}
                        value={intelligentQuickStatusFilter}
                        onChange={(e) => setIntelligentQuickStatusFilter(e.target.value)}
                      >
                        <option value="all">Estado rápido (todos)</option>
                        {intelligentQuickStatusOptions.map((status) => (
                          <option key={`int-quick-status-${status}`} value={status}>{status}</option>
                        ))}
                      </select>
                      <select
                        style={{ ...styles.input, marginBottom: 0 }}
                        value={intelligentIaStatusFilter}
                        onChange={(e) => setIntelligentIaStatusFilter(e.target.value)}
                      >
                        <option value="all">Estado IA (todos)</option>
                        {intelligentIaStatusOptions.map((status) => (
                          <option key={`int-ia-status-${status}`} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    {intelligentRowsForTable.length === 0 ? (
                      <div style={{ color: '#777', fontStyle: 'italic' }}>
                        No hay propuestas para los filtros seleccionados.
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                              <tr style={{ background: '#1a73e8', color: '#fff' }}>
                                <th style={{ padding: '8px', textAlign: 'center', width: '52px' }}>
                                  <input
                                    type="checkbox"
                                    checked={areAllIntelligentRowsSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedIntelligentProposalIds(selectableIntelligentProposalIds)
                                      } else {
                                        setSelectedIntelligentProposalIds([])
                                      }
                                    }}
                                    disabled={!selectableIntelligentProposalIds.length || batchIntelligentRun.isRunning}
                                  />
                                </th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Propuesta</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Asignatura</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Estado rápido</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Estado IA</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Resultado</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {intelligentRowGroups.map((group, groupIdx) => (
                                <React.Fragment key={`intelligent-group-${group.key}`}>
                                  <tr style={{ background: '#e8f1ff', borderTop: groupIdx === 0 ? 'none' : '2px solid #d2e3ff' }}>
                                    <td colSpan={7} style={{ padding: '8px 12px', fontWeight: 700, color: '#1a5fb4' }}>
                                      🗂️ {group.title}
                                    </td>
                                  </tr>
                                  {group.rows.map((row, idx) => {
                                    const proposalId = row.missingProposal ? null : row.proposal.id
                                    const isSelected = !!proposalId && selectedIntelligentProposalIds.includes(proposalId)
                                    const summary = proposalId ? intelligentResultsByProposal[proposalId] : null
                                    const quickStatus = getIntelligentQuickStatus(row)
                                    const scopedCounts = getScopedResultCounts(summary)
                                    const status = getIntelligentIaStatus(row)
                                    const failed = scopedCounts.failed
                                    const total = scopedCounts.total
                                    const executed = scopedCounts.executed
                                    const passed = scopedCounts.passed
                                    const resultProgress = total > 0 ? Math.round((executed / total) * 100) : 0
                                    const hasExecutedResults = executed > 0
                                    const batchItem = proposalId ? batchIntelligentRun.items?.[proposalId] : null
                                    const runDisabled = !proposalId || batchIntelligentRun.isRunning || !activeControlIdsForCurrentView.length || !!runningIntelligentByProposal[proposalId]
                                    const hasSuggestions = !!proposalId && failed > 0
                                    const viewDisabled = !proposalId || batchIntelligentRun.isRunning || !hasSuggestions
                                    return (
                                      <tr key={`intelligent-row-${row.rowKey}`} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                          {proposalId ? (
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={(e) => {
                                                setSelectedIntelligentProposalIds((prev) => {
                                                  if (e.target.checked) {
                                                    return prev.includes(proposalId) ? prev : [...prev, proposalId]
                                                  }
                                                  return prev.filter((id) => id !== proposalId)
                                                })
                                              }}
                                              disabled={batchIntelligentRun.isRunning}
                                            />
                                          ) : '-'}
                                        </td>
                                        <td style={{ padding: '8px' }}>{row.missingProposal ? 'Sin propuesta' : `#${proposalId}`}</td>
                                        <td style={{ padding: '8px', fontWeight: 600 }}>{row.proposal.subject || '-'}</td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                          <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            background: quickStatus === 'Completa' ? 'rgba(56, 142, 60, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                                            color: quickStatus === 'Completa' ? '#1b5e20' : '#b00020',
                                            fontWeight: 700,
                                            fontSize: '12px'
                                          }}>{quickStatus}</span>
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                          <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            background: status === 'Validada'
                                              ? 'rgba(56, 142, 60, 0.15)'
                                              : status === 'Con sugerencias'
                                              ? 'rgba(255, 152, 0, 0.2)'
                                              : status === 'Pendiente de validar'
                                              ? 'rgba(33, 150, 243, 0.18)'
                                              : status === 'Sin propuesta'
                                              ? 'rgba(189, 189, 189, 0.25)'
                                              : 'rgba(96, 125, 139, 0.2)',
                                            color: status === 'Validada'
                                              ? '#1b5e20'
                                              : status === 'Con sugerencias'
                                              ? '#8d5100'
                                              : status === 'Pendiente de validar'
                                              ? '#0b5cab'
                                              : status === 'Sin propuesta'
                                              ? '#616161'
                                              : '#455a64',
                                            fontWeight: 700,
                                            fontSize: '12px'
                                          }}>{status}</span>
                                        </td>
                                        <td style={{ padding: '8px', minWidth: '180px' }}>
                                          {row.missingProposal ? (
                                            <div style={{ textAlign: 'center', color: '#8a96a3', fontSize: '12px' }}>-</div>
                                          ) : total === 0 ? (
                                            <div style={{ textAlign: 'center', color: '#8a96a3', fontSize: '12px' }}>Sin controles</div>
                                          ) : (
                                            <div>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4f6476', marginBottom: '4px' }}>
                                                <span>{hasExecutedResults ? `${passed}/${total} aprobados` : 'Sin ejecutar'}</span>
                                                <span>{executed}/{total}</span>
                                              </div>
                                              <div style={{ height: '8px', borderRadius: '999px', background: '#edf2fb', overflow: 'hidden' }}>
                                                <div
                                                  style={{
                                                    width: `${resultProgress}%`,
                                                    height: '100%',
                                                    background: failed > 0 ? '#ff9800' : '#1a73e8',
                                                    transition: 'width 0.25s ease'
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                            {batchItem && (
                                              <div style={{ fontSize: '11px', color: '#5b6b7a' }}>
                                                {batchItem.status === 'ejecutando' && 'Procesando (esperando respuesta IA...)'}
                                                {batchItem.status === 'completado' && `Completado ${batchItem.evaluatedControls}/${batchItem.totalControls || total || 0}`}
                                                {batchItem.status === 'error' && 'Error'}
                                                {batchItem.status === 'cancelado' && 'Cancelado'}
                                                {batchItem.status === 'pendiente' && 'Pendiente'}
                                              </div>
                                            )}
                                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                                            <button
                                              style={{
                                                ...styles.button,
                                                background: runDisabled ? '#b7c1cc' : '#5c6bc0',
                                                color: runDisabled ? '#6b7280' : '#fff',
                                                padding: '6px 10px',
                                                cursor: runDisabled ? 'not-allowed' : 'pointer',
                                                opacity: runDisabled ? 0.7 : 1
                                              }}
                                              onClick={() => {
                                                if (!proposalId) return
                                                if (!activeControlIdsForCurrentView.length) {
                                                  goToIntelligentConfigForDirector()
                                                  return
                                                }
                                                runIntelligentControlsForProposal(proposalId)
                                              }}
                                              disabled={!proposalId || batchIntelligentRun.isRunning || !!runningIntelligentByProposal[proposalId]}
                                              title={!proposalId
                                                ? 'La asignatura no tiene propuesta cargada.'
                                                : !activeControlIdsForCurrentView.length
                                                ? (isDocenteView ? 'No hay controles activos. Solicita activación al directivo.' : 'No hay controles activos. Haz click para ir a Configuración IA.')
                                                : ''}
                                            >
                                              {!proposalId
                                                ? 'Sin propuesta'
                                                : !activeControlIdsForCurrentView.length
                                                ? 'Sin controles activos'
                                                : (runningIntelligentByProposal[proposalId] ? 'Ejecutando...' : 'Ejecutar IA')}
                                            </button>
                                            <button
                                              style={{
                                                ...styles.button,
                                                background: viewDisabled ? '#c3ccd5' : '#607d8b',
                                                color: viewDisabled ? '#6b7280' : '#fff',
                                                padding: '6px 10px',
                                                cursor: viewDisabled ? 'not-allowed' : 'pointer',
                                                opacity: viewDisabled ? 0.7 : 1
                                              }}
                                              onClick={() => proposalId && openProposalView(proposalId)}
                                              disabled={viewDisabled}
                                              title={!proposalId
                                                ? 'La asignatura no tiene propuesta cargada.'
                                                : batchIntelligentRun.isRunning
                                                ? 'Espera a que termine la ejecución por lote.'
                                                : !hasSuggestions
                                                ? 'No hay sugerencias para mostrar.'
                                                : ''}
                                            >
                                              {hasSuggestions ? 'Ver sugerencias' : 'Sin sugerencias'}
                                            </button>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {controlPanelMode === 'config' && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {!isDocenteView && (
                      <div style={{ border: '1px solid #d8e2f0', borderRadius: '8px', padding: '12px', background: '#f8fbff' }}>
                        <div style={{ fontWeight: 700, color: '#1a3d5c', marginBottom: '10px' }}>Nuevo control inteligente</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '10px', marginBottom: '10px' }}>
                          <select
                            style={{ ...styles.input, marginBottom: 0 }}
                            value={intelligentControlDraft.topic}
                            onChange={(e) => {
                              const nextTopic = e.target.value
                              setIntelligentControlDraft((prev) => ({
                                ...prev,
                                topic: nextTopic,
                                associated_topics: (prev.associated_topics || []).filter((item) => item !== nextTopic)
                              }))
                            }}
                          >
                            {intelligentTopicOptions.map((topic) => (
                              <option key={`topic-opt-${topic.value}`} value={topic.value}>{topic.label}</option>
                            ))}
                          </select>
                          <input
                            style={{ ...styles.input, marginBottom: 0 }}
                            placeholder="Nombre del control"
                            value={intelligentControlDraft.name}
                            onChange={(e) => setIntelligentControlDraft((prev) => ({ ...prev, name: e.target.value }))}
                          />
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#355070' }}>
                            <input
                              type="checkbox"
                              checked={!!intelligentControlDraft.is_active}
                              onChange={(e) => setIntelligentControlDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                            Activo
                          </label>
                        </div>
                        <textarea
                          style={{ ...styles.textarea, minHeight: '90px', marginBottom: '10px' }}
                          placeholder="Regla/instrucción exacta para evaluar con LLM"
                          value={intelligentControlDraft.instruction}
                          onChange={(e) => setIntelligentControlDraft((prev) => ({ ...prev, instruction: e.target.value }))}
                        />
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ color: '#355070', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Bloques asociados opcionales (contexto extra para IA)</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {intelligentTopicOptions
                              .filter((topic) => topic.value !== intelligentControlDraft.topic)
                              .map((topic) => (
                                <label key={`new-assoc-${topic.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#355070', background: '#f3f7ff', border: '1px solid #d8e2f0', borderRadius: '999px', padding: '4px 10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={(intelligentControlDraft.associated_topics || []).includes(topic.value)}
                                    onChange={() => setIntelligentControlDraft((prev) => ({
                                      ...prev,
                                      associated_topics: toggleAssociatedTopic(prev.associated_topics, topic.value, prev.topic)
                                    }))}
                                  />
                                  {topic.label}
                                </label>
                              ))}
                          </div>
                        </div>
                        <button style={{ ...styles.button, background: '#4caf50' }} onClick={createIntelligentControl}>Agregar control</button>
                        {intelligentControlsError && (
                          <div style={{ marginTop: '8px', color: '#b00020', fontSize: '13px' }}>{intelligentControlsError}</div>
                        )}
                      </div>
                    )}
                    {isDocenteView && (
                      <div style={{ border: '1px solid #d8e2f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fbff', color: '#355070', fontSize: '13px' }}>
                        En vista docente puedes ver los controles definidos por Dirección y activarlos/desactivarlos solo para tu entorno actual.
                      </div>
                    )}
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 12px', background: '#eef4ff', fontWeight: 700, color: '#1a3d5c' }}>
                        Controles configurados
                      </div>
                      {intelligentControlsLoading ? (
                        <div style={{ padding: '12px', color: '#607d8b' }}>Cargando controles...</div>
                      ) : intelligentControls.length === 0 ? (
                        <div style={{ padding: '12px', color: '#607d8b' }}>No hay controles configurados.</div>
                      ) : (
                        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                          {intelligentControls.map((control) => {
                            const isEditing = editingIntelligentControlId === control.id
                            const rowDraft = isEditing ? editingIntelligentControlDraft : control
                            return (
                              <div
                                key={`int-control-${control.id}`}
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid #f0f0f0',
                                  background: control.is_active ? '#fff' : '#f8f9fb',
                                  opacity: control.is_active ? 1 : 0.6
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                  <div style={{ fontWeight: 700, color: '#1a3d5c' }}>{getIntelligentTopicLabel(control.topic)} · {control.name}</div>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#355070' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!(isEditing ? rowDraft.is_active : isControlActiveForCurrentView(control))}
                                      onChange={async (e) => {
                                        if (isEditing) {
                                          setEditingIntelligentControlDraft((prev) => ({ ...prev, is_active: e.target.checked }))
                                          return
                                        }
                                        if (isDocenteView) {
                                          setDocenteControlActivation((prev) => ({ ...prev, [control.id]: e.target.checked }))
                                          return
                                        }
                                        try {
                                          if (isDocenteView && !control.is_active) {
                                            return
                                          }
                                          await updateIntelligentControl(control.id, { is_active: e.target.checked })
                                          fetchIntelligentControls()
                                        } catch (err) {
                                          setIntelligentControlsError(err.message || 'No se pudo actualizar el control')
                                        }
                                      }}
                                      disabled={isDocenteView && !control.is_active}
                                      title={isDocenteView && !control.is_active ? 'Este control fue desactivado por Dirección y no puede activarse desde vista docente.' : ''}
                                    />
                                    Activo
                                  </label>
                                </div>
                                {isEditing ? (
                                  <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginBottom: '8px' }}>
                                      <select
                                        style={{ ...styles.input, marginBottom: 0 }}
                                        value={rowDraft.topic}
                                        onChange={(e) => {
                                          const nextTopic = e.target.value
                                          setEditingIntelligentControlDraft((prev) => ({
                                            ...prev,
                                            topic: nextTopic,
                                            associated_topics: (prev.associated_topics || []).filter((item) => item !== nextTopic)
                                          }))
                                        }}
                                      >
                                        {intelligentTopicOptions.map((topic) => (
                                          <option key={`edit-topic-${topic.value}`} value={topic.value}>{topic.label}</option>
                                        ))}
                                      </select>
                                      <input
                                        style={{ ...styles.input, marginBottom: 0 }}
                                        value={rowDraft.name}
                                        onChange={(e) => setEditingIntelligentControlDraft((prev) => ({ ...prev, name: e.target.value }))}
                                      />
                                    </div>
                                    <textarea
                                      style={{ ...styles.textarea, minHeight: '75px', marginBottom: '8px' }}
                                      value={rowDraft.instruction}
                                      onChange={(e) => setEditingIntelligentControlDraft((prev) => ({ ...prev, instruction: e.target.value }))}
                                    />
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ color: '#355070', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Bloques asociados opcionales</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {intelligentTopicOptions
                                          .filter((topic) => topic.value !== rowDraft.topic)
                                          .map((topic) => (
                                            <label key={`edit-assoc-${control.id}-${topic.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#355070', background: '#f3f7ff', border: '1px solid #d8e2f0', borderRadius: '999px', padding: '4px 10px' }}>
                                              <input
                                                type="checkbox"
                                                checked={(rowDraft.associated_topics || []).includes(topic.value)}
                                                onChange={() => setEditingIntelligentControlDraft((prev) => ({
                                                  ...prev,
                                                  associated_topics: toggleAssociatedTopic(prev.associated_topics, topic.value, prev.topic)
                                                }))}
                                              />
                                              {topic.label}
                                            </label>
                                          ))}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        style={{ ...styles.button, background: '#4caf50', padding: '6px 10px' }}
                                        onClick={async () => {
                                          try {
                                            await updateIntelligentControl(control.id, rowDraft)
                                            setEditingIntelligentControlId(null)
                                            fetchIntelligentControls()
                                          } catch (err) {
                                            setIntelligentControlsError(err.message || 'No se pudo guardar el control')
                                          }
                                        }}
                                      >Guardar</button>
                                      <button
                                        style={{ ...styles.button, background: '#9e9e9e', padding: '6px 10px' }}
                                        onClick={() => setEditingIntelligentControlId(null)}
                                      >Cancelar</button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ color: '#455a64', fontSize: '13px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{control.instruction}</div>
                                    {!!(control.associated_topics && control.associated_topics.length) && (
                                      <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#607d8b' }}>Asociado con:</span>
                                        {control.associated_topics.map((topic) => (
                                          <span key={`assoc-view-${control.id}-${topic}`} style={{ fontSize: '11px', background: '#eaf2ff', color: '#1a5fb4', border: '1px solid #d2e3ff', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                                            {getIntelligentTopicLabel(topic)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {!isDocenteView && (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          style={{ ...styles.button, background: '#546e7a', padding: '6px 10px' }}
                                          onClick={() => {
                                            setEditingIntelligentControlId(control.id)
                                            setEditingIntelligentControlDraft({
                                              topic: control.topic,
                                              name: control.name,
                                              instruction: control.instruction,
                                              is_active: !!control.is_active,
                                              associated_topics: Array.isArray(control.associated_topics) ? control.associated_topics : []
                                            })
                                          }}
                                        >Editar</button>
                                        <button
                                          style={{ ...styles.button, background: '#e53935', padding: '6px 10px' }}
                                          onClick={() => deleteIntelligentControl(control.id)}
                                        >Eliminar</button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {!isDocenteView && (
                      <div style={{ border: '1px solid #d8e2f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fbff' }}>
                        <div style={{ fontWeight: 700, color: '#1a3d5c', marginBottom: '8px' }}>Modo de ejecución permitido para docente</div>
                        {intelligentModeSettingsLoading && (
                          <div style={{ color: '#607d8b', fontSize: '12px', marginBottom: '8px' }}>Cargando configuración persistida...</div>
                        )}
                        <div style={{ color: '#607d8b', fontSize: '12px', marginBottom: '8px' }}>
                          Esta configuración define el modo que se aplicará automáticamente cuando un docente ejecute controles IA.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: '8px' }}>
                          {intelligentModeOptions.map((mode) => (
                            <button
                              key={`docente-mode-${mode.key}`}
                              onClick={() => {
                                setDocenteIntelligentRunMode(mode.key)
                                saveIntelligentModeSettings({ docente_mode: mode.key }).catch((err) => {
                                  setStatusMsg(err.message || 'No se pudo guardar el modo docente')
                                  setStatusType('error')
                                })
                              }}
                              style={{
                                textAlign: 'left',
                                border: docenteIntelligentRunMode === mode.key ? '2px solid #1a73e8' : '1px solid #d0d8e6',
                                background: docenteIntelligentRunMode === mode.key ? '#eaf2ff' : '#fff',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                minHeight: '72px'
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#1a3d5c', marginBottom: '4px' }}>{mode.icon} {mode.title}</div>
                              <div style={{ color: '#607d8b', fontSize: '12px' }}>{mode.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isDocenteView && (
                      <div style={{ border: '1px solid #d8e2f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fbff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#1a3d5c' }}>Parámetros por modo IA</div>
                          <button
                            style={{
                              ...styles.button,
                              background: intelligentModeSettingsSaving ? '#9fb3d1' : '#1a73e8',
                              padding: '6px 10px',
                              marginRight: 0,
                              cursor: intelligentModeSettingsSaving ? 'not-allowed' : 'pointer'
                            }}
                            disabled={intelligentModeSettingsSaving}
                            onClick={saveIntelligentModeParameters}
                          >
                            {intelligentModeSettingsSaving ? 'Guardando...' : 'Guardar parámetros'}
                          </button>
                        </div>
                        <div style={{ color: '#607d8b', fontSize: '12px', marginBottom: '8px' }}>
                          Configura modelo, temperatura y tokens por modo. Los valores quedan persistidos en base de datos.
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {intelligentModeOptions.map((mode) => (
                            <div
                              key={`mode-config-${mode.key}`}
                              style={{
                                border: '1px solid #d0d8e6',
                                borderRadius: '8px',
                                padding: '8px',
                                background: '#fff',
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                                gap: '8px',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#1a3d5c' }}>{mode.icon} {mode.title}</div>
                              <select
                                style={{ ...styles.input, marginBottom: 0 }}
                                value={intelligentModeConfig[mode.key]?.model || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setIntelligentModeConfig((prev) => ({
                                    ...prev,
                                    [mode.key]: {
                                      ...prev[mode.key],
                                      model: value
                                    }
                                  }))
                                }}
                              >
                                {intelligentModelOptions.map((modelOption) => (
                                  <option key={`model-opt-${mode.key}-${modelOption}`} value={modelOption}>{modelOption}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.01"
                                style={{ ...styles.input, marginBottom: 0 }}
                                value={intelligentModeConfig[mode.key]?.temperature ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setIntelligentModeConfig((prev) => ({
                                    ...prev,
                                    [mode.key]: {
                                      ...prev[mode.key],
                                      temperature: value
                                    }
                                  }))
                                }}
                              />
                              <input
                                type="number"
                                min="100"
                                max="4000"
                                step="1"
                                style={{ ...styles.input, marginBottom: 0 }}
                                value={intelligentModeConfig[mode.key]?.max_tokens ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setIntelligentModeConfig((prev) => ({
                                    ...prev,
                                    [mode.key]: {
                                      ...prev[mode.key],
                                      max_tokens: value
                                    }
                                  }))
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '8px', marginTop: '6px', color: '#607d8b', fontSize: '11px' }}>
                          <span>Modo</span>
                          <span>Modelo</span>
                          <span>Temperatura</span>
                          <span>Max tokens</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {controlPanelMode === 'intelligent' && (hasAnyIntelligentSelection || batchIntelligentRun.isRunning) && (
                  <div style={{
                    position: 'fixed',
                    right: '22px',
                    bottom: '20px',
                    width: 'min(460px, calc(100vw - 36px))',
                    background: '#ffffff',
                    border: '1px solid #d8e2f0',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(24,39,75,0.2)',
                    padding: '12px',
                    zIndex: 1250
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#1a3d5c' }}>🧠 Ejecutar control inteligente</div>
                      <div style={{ fontSize: '12px', color: '#607d8b' }}>Seleccionadas: {selectedIntelligentVisibleIds.length}</div>
                    </div>
                    {isDocenteView && (
                      <div style={{ fontSize: '12px', color: '#607d8b', marginBottom: '8px' }}>
                        Modo docente definido por Dirección: <strong>{effectiveIntelligentRunModeLabel}</strong>.
                      </div>
                    )}
                    {!activeControlIdsForCurrentView.length && (
                      <div style={{
                        marginBottom: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #ffcc80',
                        background: '#fff8e1',
                        color: '#8d5100',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        Sin controles activos para el entorno actual.
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(88px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { key: 'guepardo', label: 'Guepardo' },
                        { key: 'delfin', label: 'Delfín' },
                        { key: 'ballena', label: 'Ballena' }
                      ].map((mode) => (
                        <button
                          key={`batch-mode-${mode.key}`}
                          onClick={() => {
                            if (isDocenteView) return
                            setIntelligentRunMode(mode.key)
                            saveIntelligentModeSettings({ director_last_mode: mode.key }).catch((err) => {
                              setStatusMsg(err.message || 'No se pudo guardar el modo IA del directivo')
                              setStatusType('error')
                            })
                          }}
                          disabled={batchIntelligentRun.isRunning || !activeControlIdsForCurrentView.length || isDocenteView}
                          title={isDocenteView ? `Modo fijado por Dirección: ${effectiveIntelligentRunModeLabel}` : ''}
                          style={{
                            border: effectiveIntelligentRunMode === mode.key ? '2px solid #1a73e8' : '1px solid #d0d8e6',
                            background: effectiveIntelligentRunMode === mode.key ? '#eaf2ff' : '#fff',
                            borderRadius: '8px',
                            padding: '7px 8px',
                            fontWeight: 700,
                            color: '#1a3d5c',
                            cursor: (batchIntelligentRun.isRunning || !activeControlIdsForCurrentView.length || isDocenteView) ? 'not-allowed' : 'pointer',
                            opacity: (batchIntelligentRun.isRunning || !activeControlIdsForCurrentView.length || isDocenteView) ? 0.45 : 1,
                            filter: (batchIntelligentRun.isRunning || !activeControlIdsForCurrentView.length || isDocenteView) ? 'grayscale(0.25)' : 'none'
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {batchIntelligentRun.total > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4f6476', marginBottom: '4px' }}>
                          <span>Progreso por propuestas</span>
                          <span>{batchIntelligentRun.completed}/{batchIntelligentRun.total} ({batchCompletionPct}%)</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '999px', background: '#edf2fb', overflow: 'hidden' }}>
                          <div style={{ width: `${batchCompletionPct}%`, height: '100%', background: '#1a73e8', transition: 'width 0.25s ease' }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {(() => {
                        const noActiveControls = !activeControlIdsForCurrentView.length
                        const canGuideToConfig = noActiveControls && !isDocenteView
                        const disableMainAction = batchIntelligentRun.isRunning || !selectedIntelligentVisibleIds.length || (noActiveControls && isDocenteView)
                        return (
                      <button
                        style={{
                          ...styles.button,
                          background: (disableMainAction || noActiveControls) ? '#9fb3d1' : '#1a73e8',
                          marginRight: 0,
                          cursor: (disableMainAction || canGuideToConfig) ? (canGuideToConfig ? 'pointer' : 'not-allowed') : 'pointer',
                          opacity: (disableMainAction || noActiveControls) ? 0.65 : 1
                        }}
                        onClick={() => {
                          if (noActiveControls) {
                            goToIntelligentConfigForDirector()
                            return
                          }
                          startBatchIntelligentRun()
                        }}
                        disabled={disableMainAction && !canGuideToConfig}
                        title={noActiveControls
                          ? (isDocenteView
                            ? 'No hay controles activos. Solicita activación al directivo.'
                            : 'No hay controles activos. Haz click para ir a Configuración IA.')
                          : ''}
                      >
                        {batchIntelligentRun.isRunning
                          ? 'Ejecutando lote...'
                          : !activeControlIdsForCurrentView.length
                          ? 'Sin controles activos'
                          : 'Ejecutar control inteligente'}
                      </button>
                        )
                      })()}
                      {batchIntelligentRun.isRunning ? (
                        <button
                          style={{
                            ...styles.button,
                            background: '#78909c',
                            marginRight: 0,
                            opacity: batchIntelligentRun.isCancelling ? 0.7 : 1,
                            cursor: batchIntelligentRun.isCancelling ? 'not-allowed' : 'pointer'
                          }}
                          onClick={cancelBatchIntelligentRun}
                          disabled={batchIntelligentRun.isCancelling}
                        >
                          {batchIntelligentRun.isCancelling ? 'Cancelando...' : 'Cancelar lote'}
                        </button>
                      ) : (
                        <button
                          style={{ ...styles.button, background: '#ffb300', color: '#3e2723', marginRight: 0 }}
                          onClick={() => setSelectedIntelligentProposalIds([])}
                        >
                          Limpiar selección
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PLAN DE ESTUDIOS */}
        {activeMenu === 'plan' && (
          <div style={styles.section}>
            <h2>Planes de Estudio</h2>
            {!activeCareer ? (
              <div style={{ color: '#777', fontStyle: 'italic' }}>Selecciona una carrera activa para crear un plan de estudios.</div>
            ) : (
              <div>
                {/* Lista de planes guardados */}
                {planMode === 'list' && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#555', marginTop: '-4px', marginBottom: '10px', fontWeight: 600 }}>
                      {activeCareer}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button
                        style={{ ...styles.button, background: '#4caf50' }}
                        onClick={() => {
                          setPlanMode('new')
                          setPlanName('')
                          setPlanYears([{ id: Date.now(), year: 1, terms: [] }])
                          setEditingPlanId(null)
                        }}
                      >
                        + Nuevo Plan
                      </button>
                    </div>

                    {savedPlans[activeCareer] && savedPlans[activeCareer].length > 0 ? (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {savedPlans[activeCareer].map((plan) => (
                          <div key={plan.id} style={{ border: '1px solid #d9e1e6', borderRadius: '8px', padding: '12px', background: plan.is_active ? '#eaffea' : '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{plan.name}</strong>
                                {plan.is_active && <span style={{ marginLeft: '10px', background: '#4caf50', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Vigente</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                  title="Ver plan"
                                  onClick={() => {
                                    setPlanMode('view')
                                    setPlanName(plan.name)
                                    setPlanYears(plan.years || [])
                                    setEditingPlanId(plan.id)
                                    setActivePlanId(plan.id)
                                  }}
                                >
                                  👁️
                                </button>
                                <button
                                  style={{ ...styles.button, padding: '6px 10px', background: '#7c3aed', color: '#fff' }}
                                  title="Ver Matriz de Tributación"
                                  onClick={() => {
                                    setPlanName(plan.name)
                                    setPlanYears(plan.years || [])
                                    setEditingPlanId(plan.id)
                                    const matriz = buildCompetencyMatrix(activeCareer, plan.id)
                                    setMatrizData(matriz)
                                    setShowMatrizModal(true)
                                  }}
                                >
                                  📊
                                </button>
                                <button
                                  style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                  title="Editar plan"
                                  onClick={() => {
                                    setPlanMode('edit')
                                    setPlanName(plan.name)
                                    setPlanYears(plan.years || [])
                                    setEditingPlanId(plan.id)
                                  }}
                                >
                                  ✏️
                                </button>
                                  <button
                                    style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                    title="Duplicar plan"
                                    onClick={() => openDuplicatePlanModal(plan)}
                                  >
                                    📑
                                  </button>
                                {!plan.is_active && (
                                  <button
                                    style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                    title="Marcar como vigente"
                                    onClick={() => setConfirmActivePlanId(plan.id)}
                                  >
                                    ⭐
                                  </button>
                                )}
                                <button
                                  style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                                  title="Eliminar plan"
                                  onClick={() => setShowConfirmDelete(plan.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#777' }}>No hay planes creados. Crea uno nuevo para empezar.</p>
                    )}
                  </div>
                )}

                {/* Modo edición/nuevo */}
                {(planMode === 'new' || planMode === 'edit') && (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button
                        style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                        title="Volver a lista de planes"
                        onClick={() => {
                          setPlanMode('list')
                          setPlanName('')
                          setPlanYears([])
                          setEditingPlanId(null)
                          setPlanError('')
                        }}
                      >
                        ← Volver a Lista
                      </button>
                    </div>

                    <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                      <h3>{planMode === 'new' ? 'Nuevo' : 'Editar'} Plan de Estudios</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px' }}>
                        <div>
                          <label style={styles.label}>Nombre del Plan</label>
                          <input
                            style={{
                              ...styles.input,
                              border: isPlanNameDuplicate ? '1px solid #b00020' : styles.input.border
                            }}
                            value={planName}
                            onChange={(e) => {
                              setPlanName(e.target.value)
                              if (planError) setPlanError('')
                            }}
                            placeholder="Ej: Plan 2023"
                          />
                        </div>
                      </div>
                      {planError && <div style={{ color: '#b00020', fontSize: '12px' }}>{planError}</div>}
                    </div>

                    {planYears.length > 0 && (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {planYears.map((year) => {
                          const anualTerms = year.terms.filter((t) => t.name === 'Anual')
                          const otherTerms = year.terms.filter((t) => t.name !== 'Anual')
                          const firstTerm = otherTerms.find((t) => t.name === '1er Cuatrimestre')
                          const secondTerm = otherTerms.find((t) => t.name === '2do Cuatrimestre')
                          const remainingTerms = otherTerms.filter(
                            (t) => t !== firstTerm && t !== secondTerm
                          )
                          const orderedTerms = [firstTerm, secondTerm, ...remainingTerms].filter(Boolean)

                          return (
                            <div key={year.id} style={{ border: '1px solid #d9e1e6', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0 }}>Año {year.year}</h4>
                                <button
                                  style={{ ...styles.button, padding: '6px 10px', background: '#999', marginRight: 0 }}
                                  onClick={() => {
                                    const filtered = planYears.filter((y) => y.id !== year.id)
                                    setPlanYears(filtered)
                                  }}
                                >
                                  Eliminar Año
                                </button>
                              </div>

                              {/* Mostrar Anual primero si existe */}
                              {anualTerms.length > 0 && (
                                <div style={{ marginBottom: '15px' }}>
                                  {anualTerms.map((term) => renderTermCard(term, year, 'full'))}
                                </div>
                              )}

                              {/* Mostrar cuatrimestres en 2 columnas */}
                              {orderedTerms.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                                  {orderedTerms.map((term) => (
                                    <div key={term.id}>
                                      {renderTermCard(term, year, 'half')}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Selector para agregar cuatrimestre */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end', marginTop: '12px' }}>
                                <select
                                  style={styles.input}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      // Validar que no exista ya
                                      const existingTermNames = year.terms.map((t) => t.name)
                                      if (existingTermNames.includes(e.target.value)) {
                                        setPlanError(`Ya existe "${e.target.value}" en este año`)
                                        setTimeout(() => setPlanError(''), 3000)
                                        e.target.value = ''
                                        return
                                      }

                                      const updatedYears = planYears.map((y) => {
                                        if (y.id === year.id) {
                                          return {
                                            ...y,
                                            terms: [...(y.terms || []), { id: Date.now(), name: e.target.value, subjects: [] }]
                                          }
                                        }
                                        return y
                                      })
                                      setPlanYears(updatedYears)
                                      setPlanError('')
                                      e.target.value = ''
                                    }
                                  }}
                                >
                                  <option value="">Agregar Cuatrimestre...</option>
                                  {!year.terms.some((t) => t.name === '1er Cuatrimestre') && <option value="1er Cuatrimestre">1er Cuatrimestre</option>}
                                  {!year.terms.some((t) => t.name === '2do Cuatrimestre') && <option value="2do Cuatrimestre">2do Cuatrimestre</option>}
                                  {!year.terms.some((t) => t.name === 'Anual') && <option value="Anual">Anual</option>}
                                </select>
                              </div>
                            </div>
                          )
                        })}

                        <button
                          style={{
                            ...styles.button,
                            background: '#2196F3',
                            marginTop: '12px'
                          }}
                          onClick={() => {
                            if (planYears.length === 0) {
                              setPlanYears([{ id: Date.now(), year: 1, terms: [] }])
                            } else {
                              const lastYear = planYears[planYears.length - 1]
                              setPlanYears([
                                ...planYears,
                                { id: Date.now(), year: lastYear.year + 1, terms: [] }
                              ])
                            }
                          }}
                        >
                          + Agregar Año
                        </button>
                      </div>
                    )}

                    {/* Botones de acción (siempre visibles) */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button
                        style={{
                          ...styles.button,
                          background: '#4caf50',
                          flex: 1,
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          ...(isPlanNameDuplicate && styles.buttonDisabled)
                        }}
                        disabled={isPlanNameDuplicate}
                        onClick={async () => {
                          const trimmedPlanName = String(planName || '').trim()
                          if (!trimmedPlanName) {
                            setPlanError('Ingresa un nombre para el plan')
                            return
                          }
                          if (isPlanNameDuplicate) {
                            setPlanNameDuplicateValue(trimmedPlanName)
                            setShowPlanNameDuplicateModal(true)
                            return
                          }
                          const existingNames = (savedPlans[activeCareer] || [])
                            .filter((p) => p.id !== editingPlanId)
                            .map((p) => String(p.name || '').trim().toLowerCase())
                          if (existingNames.includes(trimmedPlanName.toLowerCase())) {
                            setPlanNameDuplicateValue(trimmedPlanName)
                            setShowPlanNameDuplicateModal(true)
                            return
                          }

                          if (planYears.length === 0) {
                            setPlanError('Agrega al menos un año al plan')
                            return
                          }

                          // Determinar si este plan debe ser vigente
                          let isActive = false
                          if (editingPlanId) {
                            // Si estamos editando, mantener su estado actual
                            isActive = savedPlans[activeCareer]?.find((p) => p.id === editingPlanId)?.is_active === true
                          } else {
                            // Si es nuevo plan, solo es vigente si no hay ninguno vigente actualmente
                            const hasActivePlan = (savedPlans[activeCareer] || []).some((p) => p.is_active === true)
                            isActive = !hasActivePlan
                          }

                          const newPlan = {
                            id: editingPlanId || undefined,
                            name: trimmedPlanName,
                            years: planYears,
                            is_active: isActive
                          }

                          try {
                            const saved = await saveStudyPlanToBackend(activeCareer, newPlan)
                            setStatusMsg(`Plan "${saved?.name || trimmedPlanName}" guardado correctamente`)
                            setStatusType('success')
                            setPlanMode('list')
                            setPlanName('')
                            setPlanYears([])
                            setEditingPlanId(null)
                          } catch (err) {
                            setStatusMsg(`Error al guardar plan: ${err.message || 'desconocido'}`)
                            setStatusType('error')
                          }
                        }}
                      >
                        {editingPlanId ? '✓ Guardar Cambios' : '✓ Guardar Nuevo Plan'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Modo vista */}
                {planMode === 'view' && (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button
                        style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                        title="Volver a lista de planes"
                        onClick={() => {
                          setPlanMode('list')
                          setPlanError('')
                        }}
                      >
                        ← Volver a Lista
                      </button>
                      <button
                        style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff' }}
                        title="Editar plan"
                        onClick={() => setPlanMode('edit')}
                      >
                        ✏️ Editar Plan
                      </button>
                      <button
                        style={{ ...styles.button, padding: '6px 10px', background: '#7c3aed', color: '#fff' }}
                        title="Ver Matriz de Tributación"
                        onClick={() => {
                          const matriz = buildCompetencyMatrix(activeCareer, editingPlanId)
                          setMatrizData(matriz)
                          setShowMatrizModal(true)
                        }}
                      >
                        📊 Matriz de Tributación
                      </button>
                    </div>

                    <h3>{planName}</h3>
                    {planYears.map((year) => {
                      const anualTerms = year.terms.filter((t) => t.name === 'Anual')
                      const otherTerms = year.terms.filter((t) => t.name !== 'Anual')
                      const firstTerm = otherTerms.find((t) => t.name === '1er Cuatrimestre')
                      const secondTerm = otherTerms.find((t) => t.name === '2do Cuatrimestre')
                      const remainingTerms = otherTerms.filter(
                        (t) => t !== firstTerm && t !== secondTerm
                      )
                      const orderedTerms = [firstTerm, secondTerm, ...remainingTerms].filter(Boolean)

                      return (
                        <div key={year.id} style={{ border: '1px solid #d9e1e6', borderRadius: '8px', padding: '12px', marginBottom: '15px', background: '#f9fafb' }}>
                          <h4>Año {year.year}</h4>

                          {anualTerms.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                              {anualTerms.map((term) => (
                                <div key={term.id}>
                                  <h5>{term.name}</h5>
                                  {term.subjects && term.subjects.length > 0 ? (
                                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '8px' }}>
                                      <thead>
                                        <tr style={{ background: '#eaf3ff' }}>
                                          <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Asignatura</th>
                                          <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Correlativas</th>
                                          <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Propuesta</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {term.subjects.map((subject) => {
                                          const proposal = findProposalForSubject(activeCareer, subject.name, planName)
                                          return (
                                            <tr key={subject.id} style={{ borderBottom: '1px solid #eee' }}>
                                              <td style={{ padding: '6px' }}>{subject.name}</td>
                                              <td style={{ padding: '6px' }}>
                                              {subject.correlatives_to_enroll?.length > 0 || subject.correlatives_to_exam?.length > 0 ? (
                                                <span style={{ fontSize: '11px', color: '#666' }}>
                                                  <div style={{ marginBottom: '4px' }}>
                                                    <strong>📋 Para poder Cursar:</strong>
                                                    {subject.correlatives_to_enroll?.length > 0 && <div style={{ marginLeft: '8px' }}>📌 Regular: {subject.correlatives_to_enroll.join(', ')}</div>}
                                                    {subject.correlatives_to_exam?.length > 0 && <div style={{ marginLeft: '8px' }}>📌 Rendida: {subject.correlatives_to_exam.join(', ')}</div>}
                                                  </div>
                                                  {(subject.correlatives_to_enroll?.length > 0 || subject.correlatives_to_exam?.length > 0) && (
                                                    <div>
                                                      <strong>📋 Para poder Rendir:</strong>
                                                      <div style={{ marginLeft: '8px' }}>
                                                        {[...(subject.correlatives_to_enroll || []), ...(subject.correlatives_to_exam || [])].join(', ')}
                                                      </div>
                                                    </div>
                                                  )}
                                                </span>
                                              ) : (
                                                <span style={{ fontSize: '11px', color: '#999' }}>Sin correlativas</span>
                                              )}
                                              </td>
                                              <td style={{ padding: '6px' }}>
                                                {proposal ? (
                                                  <div style={{ fontSize: '11px' }}>
                                                    <div style={{ color: '#0066cc', marginBottom: '4px' }}>✅ ID: {proposal.id}</div>
                                                    <button
                                                      style={{ ...styles.button, padding: '2px 6px', fontSize: '10px', marginRight: 0, background: 'rgba(0, 102, 204, 0.85)', color: '#fff' }}
                                                      onClick={() => openProposalView(proposal.id)}
                                                      title="Ver propuesta"
                                                    >
                                                      Ver
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    style={{ ...styles.button, padding: '2px 6px', fontSize: '10px', marginRight: 0, background: 'rgba(0, 168, 84, 0.85)', color: '#fff' }}
                                                    onClick={() => {
                                                      setActiveMenu('propuestas')
                                                      preloadProposalFromPlan(activeCareer, subject.name, year.year, term.name)
                                                    }}
                                                    title="Crear propuesta"
                                                  >
                                                    Crear
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p style={{ color: '#777', fontSize: '12px' }}>Sin asignaturas</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {orderedTerms.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              {orderedTerms.map((term) => (
                                <div key={term.id}>
                                  <h5>{term.name}</h5>
                                  {term.subjects && term.subjects.length > 0 ? (
                                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ background: '#eaf3ff' }}>
                                          <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Asignatura</th>
                                          <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Correlativas</th>
                                          <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Propuesta</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {term.subjects.map((subject) => {
                                          const proposal = findProposalForSubject(activeCareer, subject.name, planName)
                                          return (
                                            <tr key={subject.id} style={{ borderBottom: '1px solid #eee' }}>
                                              <td style={{ padding: '4px', fontSize: '11px' }}>{subject.name}</td>
                                              <td style={{ padding: '4px' }}>
                                              {subject.correlatives_to_enroll?.length > 0 || subject.correlatives_to_exam?.length > 0 ? (
                                                <span style={{ fontSize: '10px', color: '#666' }}>
                                                  <div style={{ marginBottom: '3px' }}>
                                                    <strong>📋 Para poder Cursar:</strong>
                                                    {subject.correlatives_to_enroll?.length > 0 && <div style={{ marginLeft: '6px' }}>📌 Regular: {subject.correlatives_to_enroll.join(', ')}</div>}
                                                    {subject.correlatives_to_exam?.length > 0 && <div style={{ marginLeft: '6px' }}>📌 Rendida: {subject.correlatives_to_exam.join(', ')}</div>}
                                                  </div>
                                                  {(subject.correlatives_to_enroll?.length > 0 || subject.correlatives_to_exam?.length > 0) && (
                                                    <div>
                                                      <strong>📋 Para poder Rendir:</strong>
                                                      <div style={{ marginLeft: '6px' }}>
                                                        {[...(subject.correlatives_to_enroll || []), ...(subject.correlatives_to_exam || [])].join(', ')}
                                                      </div>
                                                    </div>
                                                  )}
                                                </span>
                                              ) : (
                                                <span style={{ fontSize: '10px', color: '#999' }}>Sin correlativas</span>
                                              )}
                                              </td>
                                              <td style={{ padding: '4px' }}>
                                                {proposal ? (
                                                  <div style={{ fontSize: '10px' }}>
                                                    <div style={{ color: '#0066cc', marginBottom: '3px' }}>✅ ID: {proposal.id}</div>
                                                    <button
                                                      style={{ ...styles.button, padding: '1px 4px', fontSize: '9px', marginRight: 0, background: 'rgba(0, 102, 204, 0.85)', color: '#fff' }}
                                                      onClick={() => openProposalView(proposal.id)}
                                                      title="Ver propuesta"
                                                    >
                                                      Ver
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    style={{ ...styles.button, padding: '1px 4px', fontSize: '9px', marginRight: 0, background: 'rgba(0, 168, 84, 0.85)', color: '#fff' }}
                                                    onClick={() => {
                                                      setActiveMenu('propuestas')
                                                      preloadProposalFromPlan(activeCareer, subject.name, year.year, term.name)
                                                    }}
                                                    title="Crear propuesta"
                                                  >
                                                    Crear
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p style={{ color: '#777', fontSize: '11px' }}>Sin asignaturas</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Modal de correlativas */}
                {correlativeMode && selectedSubjectForCorrelatives && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Mapeo de Correlativas - {selectedSubjectForCorrelatives.name}</h3>
                        <button
                          style={{ ...styles.button, padding: '6px 10px', background: 'rgba(69, 90, 100, 0.85)', color: '#fff', marginRight: 0, fontWeight: 'bold' }}
                          title="Cerrar"
                          onClick={() => setCorrelativeMode(false)}
                        >
                          ✕
                        </button>
                      </div>

                    {/* Obtener asignaturas previas */}
                    {(() => {
                      // Encontrar en qué año/cuatrimestre está esta asignatura
                      let currentYearNum = 0
                      let currentTermIndex = 0
                      let currentTermName = ''

                      for (let y of planYears) {
                        for (let t of y.terms) {
                          if (t.subjects?.some((s) => s.id === selectedSubjectForCorrelatives.id)) {
                            currentYearNum = y.year
                            currentTermName = t.name
                            break
                          }
                        }
                      }

                      // Obtener asignaturas previas (año anterior completo + cuatrimestres anteriores del año actual)
                      const previousSubjects = []
                      const termOrder = { 'Anual': 999, '1er Cuatrimestre': 1, '2do Cuatrimestre': 2 }
                      const currentTermOrder = termOrder[currentTermName] || 0
                      
                      for (let y of planYears) {
                        if (y.year < currentYearNum) {
                          // Todos los años anteriores
                          for (let t of y.terms) {
                            for (let s of t.subjects || []) {
                              // No agregar la misma asignatura como correlativa de sí misma
                              if (s.id !== selectedSubjectForCorrelatives.id) {
                                previousSubjects.push({ ...s, yearNum: y.year, termName: t.name })
                              }
                            }
                          }
                        } else if (y.year === currentYearNum) {
                          // Mismo año: mostrar Anual + cuatrimestres anteriores (pero NO el cuatrimestre actual)
                          for (let t of y.terms) {
                            const tOrder = termOrder[t.name] || 0
                            // Mostrar Anual siempre, o cuatrimestres anteriores al actual
                            if (t.name === 'Anual' || (tOrder > 0 && tOrder < currentTermOrder)) {
                              for (let s of t.subjects || []) {
                                // No agregar la misma asignatura como correlativa de sí misma
                                if (s.id !== selectedSubjectForCorrelatives.id) {
                                  previousSubjects.push({ ...s, yearNum: y.year, termName: t.name })
                                }
                              }
                            }
                          }
                        }
                      }

                      const normalizedCorrelatives = normalizeCorrelativeSelections(selectedSubjectForCorrelatives)

                      return (
                        <>
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#fff', borderRadius: '6px' }}>
                            <small style={{ color: '#666' }}>
                              Asignaturas disponibles para vincular como correlativas:
                              {previousSubjects.length === 0 && ' (Ninguna)'}
                            </small>
                          </div>

                          {previousSubjects.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                              <div>
                                <label style={styles.label}>Regular para Cursar</label>
                                <div style={{ border: '1px solid #ddd', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                                  {previousSubjects.map((subject) => (
                                    <div key={`enroll-${subject.id}`} style={{ marginBottom: '6px' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={normalizedCorrelatives?.correlatives_to_enroll?.includes(subject.name) || false}
                                          onChange={(e) => {
                                            setSelectedSubjectForCorrelatives((prev) => {
                                              const currentEnroll = prev.correlatives_to_enroll || []
                                              const currentExam = prev.correlatives_to_exam || []
                                              const nextEnroll = e.target.checked
                                                ? [...currentEnroll, subject.name]
                                                : currentEnroll.filter((n) => n !== subject.name)
                                              const nextExam = e.target.checked
                                                ? currentExam.filter((n) => n !== subject.name)
                                                : currentExam
                                              return {
                                                ...prev,
                                                correlatives_to_enroll: nextEnroll,
                                                correlatives_to_exam: nextExam
                                              }
                                            })
                                          }}
                                          style={{ marginRight: '6px' }}
                                        />
                                        <span>{subject.name} <small style={{ color: '#888' }}>({subject.yearNum}° - {subject.termName})</small></span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label style={styles.label}>Rendida para Cursar</label>
                                <div style={{ border: '1px solid #ddd', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                                  {previousSubjects.map((subject) => (
                                    <div key={`exam-${subject.id}`} style={{ marginBottom: '6px' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={normalizedCorrelatives?.correlatives_to_exam?.includes(subject.name) || false}
                                          onChange={(e) => {
                                            setSelectedSubjectForCorrelatives((prev) => {
                                              const currentEnroll = prev.correlatives_to_enroll || []
                                              const currentExam = prev.correlatives_to_exam || []
                                              const nextExam = e.target.checked
                                                ? [...currentExam, subject.name]
                                                : currentExam.filter((n) => n !== subject.name)
                                              const nextEnroll = e.target.checked
                                                ? currentEnroll.filter((n) => n !== subject.name)
                                                : currentEnroll
                                              return {
                                                ...prev,
                                                correlatives_to_enroll: nextEnroll,
                                                correlatives_to_exam: nextExam
                                              }
                                            })
                                          }}
                                          style={{ marginRight: '6px' }}
                                        />
                                        <span>{subject.name} <small style={{ color: '#888' }}>({subject.yearNum}° - {subject.termName})</small></span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '15px', background: '#fff', borderRadius: '6px', marginBottom: '15px', color: '#777', textAlign: 'center' }}>
                              Esta es la primera asignatura del plan, no hay correlativas disponibles.
                            </div>
                          )}

                          <button
                            style={{ ...styles.button, background: '#4caf50' }}
                            onClick={async () => {
                              // Guardar las correlatividades en el plan
                              const updatedYears = planYears.map((y) => ({
                                ...y,
                                terms: y.terms.map((t) => ({
                                  ...t,
                                  subjects: t.subjects.map((s) =>
                                    s.id === selectedSubjectForCorrelatives.id
                                      ? {
                                          ...s,
                                          correlatives_to_enroll: normalizedCorrelatives.correlatives_to_enroll || [],
                                          correlatives_to_exam: normalizedCorrelatives.correlatives_to_exam || []
                                        }
                                      : s
                                  )
                                }))
                              }))
                              setPlanYears(updatedYears)

                              if (editingPlanId) {
                                try {
                                  await saveStudyPlanToBackend(activeCareer, {
                                    id: editingPlanId,
                                    name: planName,
                                    years: updatedYears,
                                    is_active: getActivePlan(activeCareer)?.id === editingPlanId
                                  })
                                } catch (err) {
                                  setStatusMsg(`Error al guardar correlativas: ${err.message || 'desconocido'}`)
                                  setStatusType('error')
                                  return
                                }
                              }

                              setStatusMsg('Correlativas guardadas')
                              setStatusType('success')
                              setCorrelativeMode(false)
                            }}
                          >
                            ✓ Guardar Correlativas
                          </button>
                        </>
                      )
                    })()}
                    </div>
                  </div>
                )}

            {/* MODAL: Confirmar cambio de plan vigente */}
            {confirmActivePlanId && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px' }}>
                  <h3 style={{ marginTop: 0 }}>¿Cambiar plan vigente?</h3>
                  <p>Al seleccionar este plan como vigente, el plan anterior dejará de serlo. ¿Deseas continuar?</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      style={{ ...styles.button, background: '#999' }}
                      onClick={() => setConfirmActivePlanId(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{ ...styles.button, background: '#4caf50' }}
                      onClick={async () => {
                        try {
                          const result = await activateStudyPlanBackend(confirmActivePlanId)
                          await fetchStudyPlans(activeCareer)
                          const planName = result?.name || 'Plan'
                          setSelectedPlanFilterId(confirmActivePlanId)
                          setStatusMsg(`Plan "${planName}" marcado como vigente`)
                          setStatusType('success')
                          setConfirmActivePlanId(null)
                        } catch (err) {
                          setStatusMsg(`Error al marcar plan vigente: ${err.message || 'desconocido'}`)
                          setStatusType('error')
                        }
                      }}
                    >
                      Sí, cambiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Duplicar plan */}
            {showDuplicatePlanModal && duplicatePlanTarget && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '420px', width: '90%' }}>
                  <h3 style={{ marginTop: 0 }}>Duplicar plan</h3>
                  <div style={{ marginBottom: '10px', color: '#555' }}>
                    Se creara una copia de <strong>{duplicatePlanTarget.name}</strong>.
                  </div>
                  <label style={styles.label}>Nombre del nuevo plan</label>
                  <input
                    style={styles.input}
                    value={duplicatePlanName}
                    onChange={(e) => {
                      setDuplicatePlanName(e.target.value)
                      setDuplicatePlanError('')
                    }}
                    placeholder="Ej: Plan 2023 (copia)"
                  />
                  {duplicatePlanError && (
                    <div style={{ color: '#b00020', fontSize: '12px', marginTop: '6px' }}>{duplicatePlanError}</div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button
                      style={{ ...styles.button, background: '#999' }}
                      onClick={() => {
                        setShowDuplicatePlanModal(false)
                        setDuplicatePlanTarget(null)
                        setDuplicatePlanName('')
                        setDuplicatePlanError('')
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{ ...styles.button, background: '#4caf50' }}
                      onClick={async () => {
                        const trimmedName = String(duplicatePlanName || '').trim()
                        if (!trimmedName) {
                          setDuplicatePlanError('Ingresa un nombre para el nuevo plan.')
                          return
                        }
                        const existingNames = new Set((savedPlans[activeCareer] || []).map((p) => String(p.name || '').trim().toLowerCase()))
                        if (existingNames.has(trimmedName.toLowerCase())) {
                          setDuplicatePlanError('Ya existe un plan con ese nombre.')
                          return
                        }
                        await duplicatePlan(duplicatePlanTarget, trimmedName)
                        setShowDuplicatePlanModal(false)
                        setDuplicatePlanTarget(null)
                        setDuplicatePlanName('')
                        setDuplicatePlanError('')
                      }}
                    >
                      Duplicar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Nombre de plan duplicado */}
            {showPlanNameDuplicateModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '420px', width: '90%' }}>
                  <h3 style={{ marginTop: 0 }}>Nombre de plan ya existente</h3>
                  <p style={{ marginBottom: '12px' }}>
                    Ya existe un plan con el nombre <strong>{planNameDuplicateValue || planName}</strong>.
                  </p>
                  <p style={{ color: '#555', marginTop: 0 }}>
                    Escribe un nombre diferente para poder guardar.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button
                      style={{ ...styles.button, background: '#999' }}
                      onClick={() => {
                        const normalized = String(planName || '').trim().toLowerCase()
                        setShowPlanNameDuplicateModal(false)
                        setPlanNameDuplicateAcknowledged(normalized)
                      }}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Confirmar eliminación de plan */}
            {showConfirmDelete && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px' }}>
                  <h3 style={{ marginTop: 0, color: '#b00020' }}>¿Eliminar plan?</h3>
                  <p>Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este plan?</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      style={{ ...styles.button, background: '#999' }}
                      onClick={() => setShowConfirmDelete(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{ ...styles.button, background: '#b00020' }}
                      onClick={async () => {
                        try {
                          await deleteStudyPlanBackend(showConfirmDelete)
                          await fetchStudyPlans(activeCareer)
                          setStatusMsg('Plan eliminado correctamente')
                          setStatusType('success')
                          setShowConfirmDelete(null)
                        } catch (err) {
                          setStatusMsg(`Error al eliminar plan: ${err.message || 'desconocido'}`)
                          setStatusType('error')
                        }
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...styles.button, background: '#2196F3' }} onClick={() => downloadProposalDocx(viewProposal.id)}>Descargar DOCX</button>
                  <button
                    style={{ ...styles.button, background: viewProposal.gdoc_url ? '#bbb' : '#7c4dff' }}
                    onClick={() => createAndLinkProposalGdoc(viewProposal.id)}
                    disabled={!!viewProposal.gdoc_url || viewProposalCreateGdocLoading}
                    title={viewProposal.gdoc_url ? 'La propuesta ya tiene link de Google Docs' : 'Crear documento en Drive y vincular'}
                  >
                    {viewProposalCreateGdocLoading ? 'Creando en Drive...' : 'Crear en Drive y vincular'}
                  </button>
                  <button
                    style={{ ...styles.button, background: viewProposal.gdoc_url ? '#4caf50' : '#bbb' }}
                    onClick={() => openProposalGdocUrl(viewProposal.gdoc_url)}
                    disabled={!viewProposal.gdoc_url}
                    title={!viewProposal.gdoc_url ? 'Sin enlace de Google Docs' : 'Abrir en Google Docs'}
                  >
                    Abrir en Google Docs
                  </button>
                  <button
                    style={{ ...styles.button, background: viewProposal.gdoc_url ? '#00695c' : '#bbb' }}
                    onClick={() => validateProposalGdocRemote(viewProposal.id, { openDiffOnUpdated: true, notifyOnOk: true })}
                    disabled={!viewProposal.gdoc_url || viewProposalGdocValidateLoading}
                    title={!viewProposal.gdoc_url ? 'Sin enlace de Google Docs' : 'Validar si hay cambios remotos en Google Docs'}
                  >
                    {viewProposalGdocValidateLoading ? 'Validando remoto...' : 'Validar cambios remotos (GDoc)'}
                  </button>
                  <button
                    style={{ ...styles.button, background: viewProposal.gdoc_url ? '#ff9800' : '#bbb' }}
                    onClick={() => unlinkProposalGdoc(viewProposal.id)}
                    disabled={!viewProposal.gdoc_url}
                    title={!viewProposal.gdoc_url ? 'Sin enlace de Google Docs' : 'Desvincular enlace'}
                  >
                    Desvincular link
                  </button>
                  <button
                    style={{ ...styles.button, background: '#999' }}
                    onClick={() => {
                      setViewProposal(null)
                      setViewProposalOriginMenu('')
                      setViewProposalExpandedSuggestions({})
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {viewProposalLinkIssue && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#fff3e0', borderRadius: '6px', border: '1px solid #ffcc80', color: '#b35b00' }}>
                  {viewProposalLinkIssue}
                </div>
              )}

              {(viewProposalGdocUpdateAvailable || viewProposalGdocUpdateMessage) && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#e8f0fe', borderRadius: '6px', border: '1px solid #c6dafc', color: '#174ea6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div>{viewProposalGdocUpdateMessage || 'El documento fue actualizado en Google Docs.'}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{ ...styles.button, background: '#1a73e8' }}
                      onClick={() => openGdocDiff(viewProposal.id)}
                    >
                      Ver cambios
                    </button>
                    <button
                      style={{ ...styles.button, background: '#1a73e8' }}
                      onClick={() => syncProposalGdoc(viewProposal.id)}
                      disabled={viewProposalGdocSyncLoading}
                    >
                      {viewProposalGdocSyncLoading ? 'Sincronizando...' : 'Sincronizar todo'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '12px', padding: '12px', background: '#f9fbff', borderRadius: '6px', border: '1px solid #d9e7ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1a3d5c' }}>Sugerencias de control inteligente</div>
                  {viewProposal?.id && (
                    <button
                      style={{ ...styles.button, background: '#5c6bc0' }}
                      onClick={() => runIntelligentControlsForProposal(viewProposal.id)}
                      disabled={!!runningIntelligentByProposal[viewProposal.id]}
                    >
                      {runningIntelligentByProposal[viewProposal.id] ? 'Ejecutando...' : 'Ejecutar control inteligente'}
                    </button>
                  )}
                </div>
                {viewProposalIntelligentLoading ? (
                  <div style={{ color: '#607d8b', fontSize: '13px' }}>Cargando resultados inteligentes...</div>
                ) : !viewProposalIntelligentSummary || !Array.isArray(viewProposalIntelligentSummary.results) || viewProposalIntelligentSummary.results.length === 0 ? (
                  <div style={{ color: '#607d8b', fontSize: '13px' }}>Aún no hay resultados. Ejecuta el control inteligente para ver sugerencias.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#355070', fontWeight: 600 }}>
                      Estado: {viewProposalIntelligentSummary.intelligent_status || 'Sin ejecutar'} • Fallas: {viewProposalIntelligentSummary.failed_controls || 0}
                    </div>
                    {viewProposalIntelligentSummary.results
                      .filter((result) => !result.passed)
                      .map((result) => {
                        const hasSuggestionContent = [
                          result.what_failed,
                          result.why_failed,
                          result.suggestion,
                          result.proposed_text,
                        ].some((value) => String(value || '').trim().length > 0)
                        const autoOpenByOrigin = viewProposalOriginMenu === 'control-propuestas'
                        const isOpen = autoOpenByOrigin || !!viewProposalExpandedSuggestions[result.id]

                        return (
                          <div key={`view-proposal-suggestion-${result.id}`} style={{ border: '1px solid #ffd6d6', background: '#fff8f8', borderRadius: '6px', padding: '8px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: isOpen ? '4px' : 0 }}>
                              <div style={{ fontWeight: 700, color: '#ad1457' }}>
                                {getIntelligentTopicLabel(result.control_topic)} · {result.control_name}
                              </div>
                              {!autoOpenByOrigin && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', color: '#8a1c3a', fontWeight: 700 }}>
                                    {hasSuggestionContent ? 'Hay sugerencias' : 'Sin detalle generado'}
                                  </span>
                                  <button
                                    style={{ ...styles.button, background: '#5c6bc0', padding: '4px 10px' }}
                                    onClick={() => setViewProposalExpandedSuggestions((prev) => ({ ...prev, [result.id]: !prev[result.id] }))}
                                  >
                                    {isOpen ? 'Ocultar' : 'Ver'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {isOpen && (
                              <>
                                <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px', fontWeight: 700 }}>Qué no cumple</div>
                                <textarea
                                  style={{ ...styles.textarea, minHeight: '60px', marginBottom: '6px', background: '#fff' }}
                                  value={(editingSuggestionByResultId[result.id]?.what_failed ?? result.what_failed ?? '')}
                                  onChange={(e) => setEditingSuggestionByResultId((prev) => ({
                                    ...prev,
                                    [result.id]: {
                                      ...{
                                        what_failed: result.what_failed ?? '',
                                        why_failed: result.why_failed ?? '',
                                        suggestion: result.suggestion ?? '',
                                        proposed_text: result.proposed_text ?? '',
                                        summary: result.summary ?? ''
                                      },
                                      ...prev[result.id],
                                      why_failed: prev[result.id]?.why_failed ?? result.why_failed ?? '',
                                      suggestion: prev[result.id]?.suggestion ?? result.suggestion ?? '',
                                      proposed_text: prev[result.id]?.proposed_text ?? result.proposed_text ?? '',
                                      summary: prev[result.id]?.summary ?? result.summary ?? '',
                                      what_failed: e.target.value
                                    }
                                  }))}
                                />
                                <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px', fontWeight: 700 }}>Por qué</div>
                                <textarea
                                  style={{ ...styles.textarea, minHeight: '60px', marginBottom: '6px', background: '#fff' }}
                                  value={(editingSuggestionByResultId[result.id]?.why_failed ?? result.why_failed ?? '')}
                                  onChange={(e) => setEditingSuggestionByResultId((prev) => ({
                                    ...prev,
                                    [result.id]: {
                                      ...{
                                        what_failed: result.what_failed ?? '',
                                        why_failed: result.why_failed ?? '',
                                        suggestion: result.suggestion ?? '',
                                        proposed_text: result.proposed_text ?? '',
                                        summary: result.summary ?? ''
                                      },
                                      ...prev[result.id],
                                      why_failed: e.target.value
                                    }
                                  }))}
                                />
                                <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px', fontWeight: 700 }}>Sugerencia</div>
                                <textarea
                                  style={{ ...styles.textarea, minHeight: '70px', marginBottom: '8px', background: '#fff' }}
                                  value={(editingSuggestionByResultId[result.id]?.suggestion ?? result.suggestion ?? '')}
                                  onChange={(e) => setEditingSuggestionByResultId((prev) => ({
                                    ...prev,
                                    [result.id]: {
                                      ...{
                                        what_failed: result.what_failed ?? '',
                                        why_failed: result.why_failed ?? '',
                                        suggestion: result.suggestion ?? '',
                                        proposed_text: result.proposed_text ?? '',
                                        summary: result.summary ?? ''
                                      },
                                      ...prev[result.id],
                                      suggestion: e.target.value
                                    }
                                  }))}
                                />
                                {result.control_topic !== 'teaching_team' && (
                                  <>
                                    <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px', fontWeight: 700 }}>Texto propuesto por IA (opcional)</div>
                                    <textarea
                                      style={{ ...styles.textarea, minHeight: '90px', marginBottom: '8px', background: '#fff', borderColor: '#d6e4ff' }}
                                      value={(editingSuggestionByResultId[result.id]?.proposed_text ?? result.proposed_text ?? '')}
                                      onChange={(e) => setEditingSuggestionByResultId((prev) => ({
                                        ...prev,
                                        [result.id]: {
                                          ...{
                                            what_failed: result.what_failed ?? '',
                                            why_failed: result.why_failed ?? '',
                                            suggestion: result.suggestion ?? '',
                                            proposed_text: result.proposed_text ?? '',
                                            summary: result.summary ?? ''
                                          },
                                          ...prev[result.id],
                                          proposed_text: e.target.value
                                        }
                                      }))}
                                    />
                                  </>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    style={{ ...styles.button, background: '#2e7d32', padding: '6px 10px' }}
                                    onClick={() => saveIntelligentSuggestionEdits(viewProposal.id, result.id)}
                                  >
                                    Guardar sugerencia
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}

                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1a3d5c' }}>Vincular Google Docs</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    style={{ ...styles.input, marginBottom: 0 }}
                    placeholder="https://docs.google.com/document/d/..."
                    value={viewProposalGdocInput}
                    onChange={(e) => setViewProposalGdocInput(e.target.value)}
                  />
                  <button
                    style={{ ...styles.button, background: '#4caf50' }}
                    onClick={() => linkProposalGdoc(viewProposal.id)}
                    disabled={viewProposalGdocLoading}
                  >
                    {viewProposalGdocLoading ? 'Validando...' : 'Validar y vincular'}
                  </button>
                </div>
                {viewProposalGdocError && (
                  <div style={{ marginTop: '8px', color: '#b00020' }}>{viewProposalGdocError}</div>
                )}
              </div>

              {viewProposal.gdoc_url && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: '#15803d' }}>📤 Cambios locales a Google Docs</div>
                  <button
                    style={{ ...styles.button, background: '#16a34a', width: '100%' }}
                    onClick={() => openLocalDiff(viewProposal.id)}
                    disabled={gdocDiffLoading}
                  >
                    {gdocDiffLoading ? 'Cargando...' : 'Validar cambios locales'}
                  </button>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                    Detecta qué cambios hiciste en local para enviarlos a Google Docs.
                  </div>
                </div>
              )}

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
                    {getTeachingTeamView(viewProposal.teaching_team).map((doc, idx) => (
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

        {showGdocDiff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '95%', maxWidth: '1100px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>Comparar cambios de Google Docs</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...styles.button, background: '#999' }} onClick={closeGdocDiff}>Cerrar</button>
                </div>
              </div>

              {gdocDiffLoading && (
                <div style={{ marginTop: '12px', color: '#555' }}>Cargando comparación...</div>
              )}

              {!gdocDiffLoading && gdocDiffData && (
                <div style={{ marginTop: '16px' }}>
                  {Object.keys(gdocDiffData.changes || {}).length === 0 ? (
                    <div style={{ color: '#555' }}>No se encontraron cambios para comparar.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.entries(gdocDiffData.changes).map(([key, change]) => (
                        <div
                          key={key}
                          style={{
                            border: change.review_required ? '1px solid #ef4444' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '12px',
                            background: change.review_required ? '#fef2f2' : '#fff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: change.review_required ? '#b91c1c' : '#111827' }}>{change.label || key}</strong>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!gdocDiffSelection[key]}
                                onChange={(e) => setGdocDiffSelection((prev) => ({ ...prev, [key]: e.target.checked }))}
                              />
                              Aplicar cambio
                            </label>
                          </div>
                          {change.review_required && (
                            <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                              Revisión obligatoria: cambio sensible detectado.
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tu versión</div>
                              <pre style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{change.current_display || '-'}</pre>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Última en Google Docs</div>
                              <pre style={{ background: '#f0f9ff', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{change.latest_display || '-'}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button style={{ ...styles.button, background: '#1a73e8' }} onClick={applyGdocSelectedChanges}>
                      Aplicar seleccionados
                    </button>
                    <button style={{ ...styles.button, background: '#1a73e8' }} onClick={() => syncProposalGdoc(viewProposal.id)}>
                      Sincronizar todo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showLocalDiff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '95%', maxWidth: '1100px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>Cambios locales para enviar a Google Docs</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...styles.button, background: '#999' }} onClick={closeLocalDiff}>Cerrar</button>
                </div>
              </div>

              {gdocDiffLoading && (
                <div style={{ marginTop: '12px', color: '#555' }}>Cargando cambios locales...</div>
              )}

              {!gdocDiffLoading && localDiffData && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>{localDiffData.message}</p>
                  {Object.keys(localDiffData.changes || {}).length === 0 ? (
                    <div style={{ color: '#555' }}>No se encontraron cambios locales que enviar.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.entries(localDiffData.changes).map(([key, change]) => (
                        <div
                          key={key}
                          style={{
                            border: change.review_required ? '1px solid #16a34a' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '12px',
                            background: change.review_required ? '#f0fdf4' : '#fff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: change.review_required ? '#15803d' : '#111827' }}>{change.label || key}</strong>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!localDiffSelection[key]}
                                onChange={(e) => setLocalDiffSelection((prev) => ({ ...prev, [key]: e.target.checked }))}
                              />
                              Incluir en envío
                            </label>
                          </div>
                          {change.review_required && (
                            <div style={{ color: '#15803d', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                              ℹ️ Campo importante: se recomienda revisar antes de enviar.
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tu versión local</div>
                              <pre style={{ background: '#f0fdf4', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{change.local_display || '-'}</pre>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Versión en Google Docs</div>
                              <pre style={{ background: '#f0f9ff', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{change.gdoc_display || '-'}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button style={{ ...styles.button, background: '#16a34a' }} onClick={pushProposalToGdoc}>
                      � Enviar a Google Docs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Matriz de Tributación */}
        {showMatrizModal && matrizData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 1000,
            padding: '10px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              width: '98%',
              height: '95vh',
              maxHeight: '95vh',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Matriz de Tributación - {activeCareer}</h2>
                <button
                  style={{ ...styles.button, background: '#999', padding: '8px 16px' }}
                  onClick={() => {
                    setShowMatrizModal(false)
                    setMatrixColumnFilters({})
                  }}
                >
                  Cerrar ✕
                </button>
              </div>

              {matrizData.subjects.length === 0 ? (
                <p style={{ color: '#777', textAlign: 'center', padding: '20px' }}>No hay asignaturas en el plan</p>
              ) : (
                <div style={{ 
                  flex: 1, 
                  overflowX: 'auto', 
                  overflowY: 'auto',
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  background: '#fafafa'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead>
                      {/* Row 1: Competency Types Headers */}
                      <tr style={{ background: '#3949ab', color: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{
                          padding: '12px 10px',
                          textAlign: 'left',
                          borderRight: '2px solid #fff',
                          minWidth: '220px',
                          position: 'sticky',
                          left: 0,
                          background: '#3949ab',
                          zIndex: 11,
                          fontWeight: 600
                        }}>
                          Asignatura
                        </th>
                        
                        {/* Generic Competencies Header */}
                        {matrizData.competencies.generic.length > 0 && (
                          <th colSpan={matrizData.competencies.generic.length} style={{
                            padding: '12px 10px',
                            textAlign: 'center',
                            borderRight: '2px solid #fff',
                            background: '#283593',
                            fontWeight: 600
                          }}>
                            📋 COMPETENCIAS GENÉRICAS
                          </th>
                        )}

                        {/* Specific Competencies Header */}
                        {matrizData.competencies.specific.length > 0 && (
                          <th colSpan={matrizData.competencies.specific.length} style={{
                            padding: '12px 10px',
                            textAlign: 'center',
                            background: '#283593',
                            fontWeight: 600
                          }}>
                            🎯 COMPETENCIAS ESPECÍFICAS
                          </th>
                        )}
                      </tr>

                      {/* Row 2: Competency Code Headers */}
                      <tr style={{ background: '#5c6bc0', color: '#fff', position: 'sticky', top: '48px', zIndex: 9 }}>
                        <th style={{
                          padding: '8px 10px',
                          textAlign: 'left',
                          borderRight: '2px solid #fff',
                          minWidth: '220px',
                          position: 'sticky',
                          left: 0,
                          background: '#5c6bc0',
                          zIndex: 11,
                          fontWeight: 600,
                          fontSize: '12px'
                        }}></th>
                        {matrizData.competencies.generic.map((comp) => {
                          const compKey = comp.code || comp.id
                          const filterKey = `gen:${compKey}`
                          const selectedLevels = matrixColumnFilters[filterKey] || []
                          const availableLevels = getMatrixColumnLevels('generic', compKey)
                          return (
                          <th key={`gen-${compKey}`} title={comp.description || ''} style={{
                            padding: '8px 4px',
                            textAlign: 'center',
                            borderRight: '1px solid #999',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '80px',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {comp.code}
                            <details style={{ marginTop: '4px' }}>
                              <summary style={{ cursor: 'pointer', fontSize: '10px', color: '#eef', listStyle: 'none' }}>
                                Filtro{selectedLevels.length > 0 ? ` (${selectedLevels.length})` : ''}
                              </summary>
                              <div style={{ display: 'grid', gap: '4px', padding: '6px 4px', background: '#fff', color: '#333', borderRadius: '4px', border: '1px solid #c5cae9' }}>
                                {[
                                  { label: 'Alto (3)', value: 3 },
                                  { label: 'Medio (2)', value: 2 },
                                  { label: 'Bajo (1)', value: 1 },
                                  { label: 'Sin Aporte (0)', value: 0 }
                                ].map((opt) => (
                                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedLevels.includes(opt.value)}
                                      disabled={availableLevels.length > 0 && !availableLevels.includes(opt.value)}
                                      onChange={() => toggleMatrixColumnFilter(filterKey, opt.value)}
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => clearMatrixColumnFilter(filterKey)}
                                  style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid #c5cae9', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
                                >
                                  Limpiar
                                </button>
                              </div>
                            </details>
                          </th>
                        )})}
                        {matrizData.competencies.specific.map((comp) => {
                          const compKey = comp.code || comp.id
                          const filterKey = `spec:${compKey}`
                          const selectedLevels = matrixColumnFilters[filterKey] || []
                          const availableLevels = getMatrixColumnLevels('specific', compKey)
                          return (
                          <th key={`spec-${compKey}`} title={comp.description || ''} style={{
                            padding: '8px 4px',
                            textAlign: 'center',
                            borderRight: '1px solid #999',
                            fontSize: '11px',
                            fontWeight: 600,
                            minWidth: '80px',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {comp.code}
                            <details style={{ marginTop: '4px' }}>
                              <summary style={{ cursor: 'pointer', fontSize: '10px', color: '#eef', listStyle: 'none' }}>
                                Filtro{selectedLevels.length > 0 ? ` (${selectedLevels.length})` : ''}
                              </summary>
                              <div style={{ display: 'grid', gap: '4px', padding: '6px 4px', background: '#fff', color: '#333', borderRadius: '4px', border: '1px solid #c5cae9' }}>
                                {[
                                  { label: 'Alto (3)', value: 3 },
                                  { label: 'Medio (2)', value: 2 },
                                  { label: 'Bajo (1)', value: 1 },
                                  { label: 'Sin Aporte (0)', value: 0 }
                                ].map((opt) => (
                                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedLevels.includes(opt.value)}
                                      disabled={availableLevels.length > 0 && !availableLevels.includes(opt.value)}
                                      onChange={() => toggleMatrixColumnFilter(filterKey, opt.value)}
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => clearMatrixColumnFilter(filterKey)}
                                  style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid #c5cae9', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}
                                >
                                  Limpiar
                                </button>
                              </div>
                            </details>
                          </th>
                        )})}
                        {/* Total column header */}
                        <th style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          borderLeft: '2px solid #fff',
                          background: '#3f51b5',
                          fontWeight: 600,
                          fontSize: '18px',
                          minWidth: '60px',
                          position: 'sticky',
                          right: 0,
                          zIndex: 11
                        }}>
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {matrixFilteredSubjects.length > 0 && (
                        <tr>
                          <td colSpan="999" style={{ padding: '2px', background: '#e8eaf6', height: '2px' }}></td>
                        </tr>
                      )}

                      {(() => {
                        // Agrupar asignaturas por año y cuatrimestre
                        const grouped = {}
                        matrixFilteredSubjects.forEach((subject) => {
                          const key = `${subject.year || 0}-${subject.termName || 'Desconocido'}`
                          if (!grouped[key]) {
                            grouped[key] = { year: subject.year, termName: subject.termName, subjects: [] }
                          }
                          grouped[key].subjects.push(subject)
                        })

                        const groups = Object.values(grouped).sort((a, b) => {
                          if (a.year !== b.year) return a.year - b.year
                          const termOrder = { 'Anual': 0, '1er Cuatrimestre': 1, '2do Cuatrimestre': 2 }
                          return (termOrder[a.termName] || 999) - (termOrder[b.termName] || 999)
                        })

                        return groups.map((group, groupIdx) => (
                          <React.Fragment key={`group-${group.year}-${group.termName}`}>
                            <tr style={{
                              background: '#e3f2fd',
                              borderTop: groupIdx > 0 ? '2px solid #90caf9' : 'none',
                              borderBottom: '1px solid #90caf9'
                            }}>
                              <td colSpan="999" style={{
                                padding: '8px 12px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#1565c0'
                              }}>
                                📚 Año {group.year} - {group.termName}
                              </td>
                            </tr>

                            {group.subjects.map((subject, idx) => {
                              const subjectMatrix = matrizData.matrix[subject.id]
                              const hasProposal = !!findProposalForSubject(activeCareer, subject.name, matrizData.planName)

                              return (
                                <tr key={subject.id} style={{
                                  background: hasProposal ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#fffbf0',
                                  borderBottom: '1px solid #e0e0e0',
                                  opacity: hasProposal ? 1 : 0.85
                                }}>
                                  {/* Subject Name (Sticky) */}
                                  <td style={{
                                    padding: '10px 8px',
                                    borderRight: '3px solid #ddd',
                                    fontWeight: hasProposal ? 600 : 400,
                                    minWidth: '150px',
                                    position: 'sticky',
                                    left: 0,
                                    background: hasProposal ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#fffbf0',
                                    zIndex: 5,
                                    color: hasProposal ? '#000' : '#999',
                                    fontSize: '12px'
                                  }}>
                                    {subject.name}
                                    {!hasProposal && <span style={{ fontSize: '10px', marginLeft: '4px', color: '#bbb' }}>(sin ✽)</span>}
                                  </td>

                                  {/* Generic Competency Levels */}
                                  {matrizData.competencies.generic.map((comp) => {
                                    const compKey = comp.code || comp.id
                                    const level = subjectMatrix ? subjectMatrix.generic[compKey] : 0
                                    const filterKey = `gen:${compKey}`
                                    const selectedLevels = matrixColumnFilters[filterKey] || []
                                    const isFiltered = selectedLevels.length > 0
                                    const isMatch = !isFiltered || selectedLevels.includes(level)
                                    return (
                                      <td key={`${subject.id}-gen-${compKey}`} style={{
                                        padding: '8px 4px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e0e0e0',
                                        minWidth: '70px',
                                        maxWidth: '70px',
                                        background: level > 0 && hasProposal ? 'rgba(124, 58, 237, 0.12)' : (hasProposal ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#fffbf0'),
                                        fontWeight: level > 0 && hasProposal ? 600 : 400,
                                        fontSize: '11px',
                                        opacity: isMatch ? 1 : 0.2,
                                        boxShadow: isFiltered && isMatch ? 'inset 0 0 0 2px #3f51b5' : 'none'
                                      }}>
                                        <span style={{
                                          display: 'inline-block',
                                          minWidth: '48px',
                                          padding: '4px 6px',
                                          borderRadius: '3px',
                                          color: level === 3 ? '#388e3c' : (level === 2 ? '#f57c00' : (level === 1 ? '#d32f2f' : '#bbb')),
                                          fontWeight: 600
                                        }}>
                                          {getLevelDisplay(level)}
                                        </span>
                                      </td>
                                    )
                                  })}

                                  {/* Specific Competency Levels */}
                                  {matrizData.competencies.specific.map((comp) => {
                                    const compKey = comp.code || comp.id
                                    const level = subjectMatrix ? subjectMatrix.specific[compKey] : 0
                                    const filterKey = `spec:${compKey}`
                                    const selectedLevels = matrixColumnFilters[filterKey] || []
                                    const isFiltered = selectedLevels.length > 0
                                    const isMatch = !isFiltered || selectedLevels.includes(level)
                                    return (
                                      <td key={`${subject.id}-spec-${compKey}`} style={{
                                        padding: '8px 4px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e0e0e0',
                                        minWidth: '70px',
                                        maxWidth: '70px',
                                        background: level > 0 && hasProposal ? 'rgba(124, 58, 237, 0.12)' : (hasProposal ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#fffbf0'),
                                        fontWeight: level > 0 && hasProposal ? 600 : 400,
                                        fontSize: '11px',
                                        opacity: isMatch ? 1 : 0.2,
                                        boxShadow: isFiltered && isMatch ? 'inset 0 0 0 2px #3f51b5' : 'none'
                                      }}>
                                        <span style={{
                                          display: 'inline-block',
                                          minWidth: '48px',
                                          padding: '4px 6px',
                                          borderRadius: '3px',
                                          color: level === 3 ? '#388e3c' : (level === 2 ? '#f57c00' : (level === 1 ? '#d32f2f' : '#bbb')),
                                          fontWeight: 600
                                        }}>
                                          {getLevelDisplay(level)}
                                        </span>
                                      </td>
                                    )
                                  })}

                                  {/* Total Competencies Count (Sticky) */}
                                  {(() => {
                                    let totalComps = 0
                                    if (subjectMatrix) {
                                      matrizData.competencies.generic.forEach((comp) => {
                                        const key = comp.code || comp.id
                                        if (subjectMatrix.generic[key] > 0) totalComps++
                                      })
                                      matrizData.competencies.specific.forEach((comp) => {
                                        const key = comp.code || comp.id
                                        if (subjectMatrix.specific[key] > 0) totalComps++
                                      })
                                    }
                                    return (
                                      <td style={{
                                        padding: '8px 10px',
                                        textAlign: 'center',
                                        borderLeft: '2px solid #ddd',
                                        minWidth: '60px',
                                        position: 'sticky',
                                        right: 0,
                                        background: hasProposal ? (idx % 2 === 0 ? '#fff' : '#fafafa') : '#fffbf0',
                                        zIndex: 5,
                                        fontWeight: 600,
                                        fontSize: '18px',
                                        color: totalComps > 0 ? '#7c3aed' : '#999'
                                      }}>
                                        {totalComps}
                                      </td>
                                    )
                                  })()}
                                </tr>
                              )
                            })}
                          </React.Fragment>
                        ))
                      })()}

                      {/* Footer Row - Total Competencies per Subject */}
                      <tr style={{
                        background: '#3f51b5',
                        color: '#fff',
                        fontWeight: 600,
                        borderTop: '2px solid #1a1a4d'
                      }}>
                        <td style={{
                          padding: '10px 8px',
                          borderRight: '3px solid #fff',
                          minWidth: '150px',
                          position: 'sticky',
                          left: 0,
                          background: '#3f51b5',
                          zIndex: 5,
                          fontSize: '18px',
                          fontWeight: 700
                        }}>
                          📊 TOTAL
                        </td>

                        {/* Count for each generic competency */}
                        {matrizData.competencies.generic.map((comp) => {
                          const compKey = comp.code || comp.id
                          let count = 0
                          matrixFilteredSubjects.forEach((subject) => {
                            const subjectMatrix = matrizData.matrix[subject.id]
                            if (subjectMatrix && subjectMatrix.generic[compKey] > 0) {
                              count++
                            }
                          })
                          return (
                            <td key={`total-gen-${compKey}`} style={{
                              padding: '8px 4px',
                              textAlign: 'center',
                              borderRight: '1px solid #7986cb',
                              minWidth: '70px',
                              maxWidth: '70px',
                              fontSize: '18px',
                              fontWeight: 700
                            }}>
                              {count}
                            </td>
                          )
                        })}

                        {/* Count for each specific competency */}
                        {matrizData.competencies.specific.map((comp) => {
                          const compKey = comp.code || comp.id
                          let count = 0
                          matrixFilteredSubjects.forEach((subject) => {
                            const subjectMatrix = matrizData.matrix[subject.id]
                            if (subjectMatrix && subjectMatrix.specific[compKey] > 0) {
                              count++
                            }
                          })
                          return (
                            <td key={`total-spec-${compKey}`} style={{
                              padding: '8px 4px',
                              textAlign: 'center',
                              borderRight: '1px solid #7986cb',
                              minWidth: '70px',
                              maxWidth: '70px',
                              fontSize: '18px',
                              fontWeight: 700
                            }}>
                              {count}
                            </td>
                          )
                        })}

                        {/* Grand total - all competencies with level > 0 */}
                        <td style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          borderLeft: '2px solid #fff',
                          minWidth: '60px',
                          position: 'sticky',
                          right: 0,
                          background: '#3f51b5',
                          zIndex: 5,
                          fontSize: '18px',
                          fontWeight: 700
                        }}>
                          {(() => {
                            let grandTotal = 0
                            matrixFilteredSubjects.forEach((subject) => {
                              const subjectMatrix = matrizData.matrix[subject.id]
                              if (subjectMatrix) {
                                matrizData.competencies.generic.forEach((comp) => {
                                  const key = comp.code || comp.id
                                  if (subjectMatrix.generic[key] > 0) grandTotal++
                                })
                                matrizData.competencies.specific.forEach((comp) => {
                                  const key = comp.code || comp.id
                                  if (subjectMatrix.specific[key] > 0) grandTotal++
                                })
                              }
                            })
                            return grandTotal
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              <div style={{ marginTop: '15px', padding: '12px 15px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', borderTop: '1px solid #ddd' }}>
                <strong style={{ fontSize: '13px' }}>📌 Leyenda de Niveles:</strong>
                <div style={{ display: 'flex', gap: '25px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <div><span style={{ color: '#d32f2f', fontWeight: 700, fontSize: '13px' }}>Bajo (1)</span> - Aporte bajo</div>
                  <div><span style={{ color: '#f57c00', fontWeight: 700, fontSize: '13px' }}>Medio (2)</span> - Aporte medio</div>
                  <div><span style={{ color: '#388e3c', fontWeight: 700, fontSize: '13px' }}>Alto (3)</span> - Aporte alto</div>
                  <div><span style={{ color: '#bbb', fontWeight: 700, fontSize: '13px' }}>-</span> - Sin aporte</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showIntelligentRunModal && intelligentRunModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
            <div style={{ width: 'min(560px, 92vw)', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 18px 46px rgba(0,0,0,0.24)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#1a3d5c' }}>🧠 Ejecutando control inteligente</h3>
              <div style={{ color: '#445', marginBottom: '10px' }}>
                Evaluando propuesta <strong>#{intelligentRunModalData.proposalId}</strong> ({intelligentRunModalData.subject}) en modo{' '}
                <strong>{intelligentRunModalData.mode === 'guepardo' ? 'Guepardo' : intelligentRunModalData.mode === 'ballena' ? 'Ballena' : 'Delfín'}</strong>.
              </div>
              <div style={{ padding: '10px 12px', background: '#f3f7ff', border: '1px solid #dbe7ff', borderRadius: '8px', color: '#355070', fontSize: '13px', marginBottom: '14px' }}>
                Este proceso puede tardar unos segundos. Puedes cancelar para detener la espera del cliente.
              </div>
              {(() => {
                const controls = Array.isArray(intelligentRunModalData.controls) ? intelligentRunModalData.controls : []
                const total = intelligentRunModalData.controlsCount || controls.length || 0
                const isCompleted = intelligentRunModalData.status === 'completed'
                const done = Math.min(Number(intelligentRunModalData.completedControls || 0), total)
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#355070', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Progreso por control</span>
                      <span>{done}/{total}</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '999px', background: '#edf2fb', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#1a73e8', transition: 'width 0.25s ease' }} />
                    </div>
                    {!!controls.length && (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e4ebf7', borderRadius: '8px', background: '#fcfdff', padding: '8px' }}>
                        {controls.map((control, index) => {
                          const isDone = index < done
                          const isCurrent = !isCompleted && index === done && done < total
                          const isPending = !isDone && !isCurrent
                          return (
                            <div key={`modal-control-${control.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px', color: isDone ? '#1b5e20' : isCurrent ? '#1a5fb4' : '#607d8b', fontSize: '12px', fontWeight: isDone || isCurrent ? 700 : 500 }}>
                              <span>{isDone ? '✅' : isCurrent ? '⏳' : isPending ? '•' : '•'}</span>
                              <span>{control.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  style={{ ...styles.button, background: '#78909c' }}
                  onClick={() => cancelIntelligentRun(intelligentRunModalData.proposalId)}
                >
                  Cerrar y cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
