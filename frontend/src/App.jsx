import React, { useState, useEffect } from 'react'
import logoMacau from '../Logo MACAU.png'

export default function App() {
  // Main navigation
  const [activeMenu, setActiveMenu] = useState('home')
  const [proposalsMode, setProposalsMode] = useState(null)
  
  // AI state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSection, setAiSection] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState({ original: '', reformulated: '' })
  const [comparisonField, setComparisonField] = useState(null)
  
  // Form state
  const [equipoDocente, setEquipoDocente] = useState([
    { id: 1, nombre: '', categoria: 'TITULAR', dedic: '' }
  ])
  
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
  }

  const isFormComplete = () => {
    return formData.carrera && formData.asignatura && formData.plan &&
           formData.ciclo && formData.cuatrimestre && formData.caracter &&
           formData.regimen && formData.contenidosMin && 
           formData.competenciasGen && formData.competenciasEsp
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
    setEquipoDocente([...equipoDocente, { id: newId, nombre: '', categoria: 'AYUDANTE 1º', dedic: '' }])
  }

  const updateDocente = (id, field, value) => {
    const updated = equipoDocente.map(d => 
      d.id === id ? { ...d, [field]: field === 'nombre' ? value.toUpperCase() : value } : d
    )
    setEquipoDocente(updated)
    sortDocentes(updated)
  }

  const deleteDocente = (id) => {
    if (equipoDocente.length > 1) {
      setEquipoDocente(equipoDocente.filter(d => d.id !== id))
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
  }

  const updateRA = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      resultadosAprendizaje: prev.resultadosAprendizaje.map(ra =>
        ra.id === id ? { ...ra, [field]: value } : ra
      )
    }))
  }

  const deleteRA = (id) => {
    setFormData(prev => ({
      ...prev,
      resultadosAprendizaje: prev.resultadosAprendizaje.filter(ra => ra.id !== id)
    }))
  }

  // Units management
  const addUnidad = () => {
    setFormData(prev => ({
      ...prev,
      unidades: [...prev.unidades, { id: Date.now(), nombre: '', contenidos: '', bibBasica: '', bibCompl: '' }]
    }))
  }

  const updateUnidad = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.map(u =>
        u.id === id ? { ...u, [field]: value } : u
      )
    }))
  }

  const deleteUnidad = (id) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.filter(u => u.id !== id)
    }))
  }

  // Practicals management
  const addTP = () => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: [...prev.trabajosPracticos, { id: Date.now(), nombre: '', objetivo: '', actividades: '', materiales: '', ambito: '' }]
    }))
  }

  const updateTP = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: prev.trabajosPracticos.map(tp =>
        tp.id === id ? { ...tp, [field]: value } : tp
      )
    }))
  }

  const deleteTP = (id) => {
    setFormData(prev => ({
      ...prev,
      trabajosPracticos: prev.trabajosPracticos.filter(tp => tp.id !== id)
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
        updateFormData('metodologia', data.content)
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

  const reformulateField = async (field, currentValue) => {
    if (!currentValue) {
      setStatusMsg('Escribe algo primero para reformular')
      setStatusType('info')
      return
    }

    setAiLoading(true)
    setAiSection(field)
    try {
      const res = await fetch('http://localhost:8001/ai-reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentValue })
      })
      const data = await res.json()
      
      if (data.status === 'success') {
        setComparisonData({ original: currentValue, reformulated: data.content })
        setComparisonField(field)
        setShowComparison(true)
      }
    } catch (err) {
      setStatusMsg('Error al reformular: ' + err.message)
      setStatusType('error')
    } finally {
      setAiLoading(false)
      setAiSection(null)
    }
  }

  const acceptReformulation = () => {
    if (comparisonField) {
      updateFormData(comparisonField, comparisonData.reformulated)
      setShowComparison(false)
    }
  }

  const rejectReformulation = () => {
    setShowComparison(false)
  }

  const saveProposal = async () => {
    try {
      const res = await fetch('http://localhost:8001/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.asignatura,
          career: formData.carrera,
          subject: formData.asignatura,
          study_plan: formData.plan,
          academic_year: formData.anio,
          year_of_career: formData.ciclo,
          quarter: formData.cuatrimestre,
          character: formData.caracter,
          regime: formData.regimen,
          theoretical_hours: parseInt(formData.hsTeo),
          practical_hours: parseInt(formData.hsPrac),
          minimum_content: formData.contenidosMin,
          generic_competencies: formData.competenciasGen,
          specific_competencies: formData.competenciasEsp,
          fundamentals_part1: formData.fundamentosP1,
          fundamentals_part2: formData.fundamentosP2,
          learning_outcomes: formData.resultadosAprendizaje,
          units: formData.unidades,
          practicals: formData.trabajosPracticos,
          methodology: formData.metodologia,
          evaluation: formData.evaluacion,
          bibliography: formData.bibliografia,
          observations: formData.observaciones
        })
      })
      const data = await res.json()
      setStatusMsg('Propuesta guardada correctamente')
      setStatusType('success')
      fetchProposals()
    } catch (err) {
      setStatusMsg('Error al guardar: ' + err.message)
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
        title={tooltip}
      >
        {hasContent ? '✏️' : '✍️'} {hasContent ? 'Reformular' : 'Escribir'}
      </button>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <img src={logoMacau} alt="MACAU" style={{ maxWidth: '140px', height: 'auto' }} />
          <h3 style={{ color: '#1a3d5c', fontSize: '16px', marginTop: '10px' }}>MACAU</h3>
        </div>
        <MenuButton label="Home" onClick={() => setActiveMenu('home')} active={activeMenu === 'home'} />
        <MenuButton label="Propuestas" onClick={() => setActiveMenu('propuestas')} active={activeMenu === 'propuestas'} />
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
              onClick={() => setProposalsMode('create')}>
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
              <h3>Propuestas Cargadas ({proposals.length})</h3>
              {proposals.length > 0 ? (
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
                      {proposals.map((prop, idx) => (
                        <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>#{prop.id}</td>
                          <td style={{ padding: '10px' }}>{prop.career || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                          <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px' }} 
                              onClick={() => alert(`Detalles de propuesta #${prop.id}`)}>Ver</button>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px', background: '#ff9900', color: 'white' }} 
                              onClick={() => alert(`Editar propuesta #${prop.id}`)}>Editar</button>
                            <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', background: '#d9534f', color: 'white' }} 
                              onClick={() => alert(`Eliminar propuesta #${prop.id}`)}>Eliminar</button>
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
                  <div>
                    <label style={styles.label}>Plan de Estudios</label>
                    <input style={styles.input} value={formData.plan} onChange={(e) => updateFormData('plan', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Año Académico</label>
                    <input style={styles.input} value={formData.anio} onChange={(e) => updateFormData('anio', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Ciclo</label>
                    <input style={styles.input} value={formData.ciclo} onChange={(e) => updateFormData('ciclo', e.target.value)} />
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
                    <label style={styles.label}>Horas Teóricas</label>
                    <input style={styles.input} type="number" value={formData.hsTeo} onChange={(e) => updateFormData('hsTeo', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Horas Prácticas</label>
                    <input style={styles.input} type="number" value={formData.hsPrac} onChange={(e) => updateFormData('hsPrac', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Carga Horaria Total</label>
                    <div style={{ ...styles.input, ...styles.readonlyField, color: '#666' }}>{getCartTotal()}</div>
                  </div>
                  <div>
                    <label style={styles.label}>Hs Semanales</label>
                    <div style={{ ...styles.input, ...styles.readonlyField, color: '#666' }}>{getHsSemanales()}</div>
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
                    <input style={styles.input} placeholder="Dedicación" value={doc.dedic} onChange={(e) => updateDocente(doc.id, 'dedic', e.target.value)} />
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
                <AIButton onClick={() => reformulateField('fundamentosP1', formData.fundamentosP1)} hasContent={!!formData.fundamentosP1} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />

                <label style={styles.label}>Perfil Profesional (100-200 palabras)</label>
                <textarea style={styles.textarea} value={formData.fundamentosP2} onChange={(e) => updateFormData('fundamentosP2', e.target.value)} />
                <AIButton onClick={() => reformulateField('fundamentosP2', formData.fundamentosP2)} hasContent={!!formData.fundamentosP2} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />
              </div>

              {/* LEARNING OUTCOMES */}
              <div style={styles.section}>
                <h3>Resultados de Aprendizaje</h3>
                {formData.resultadosAprendizaje.map(ra => (
                  <div key={ra.id} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <input style={styles.input} placeholder="Verbo observable (Ej: Implementa, Analiza)" value={ra.verbo} onChange={(e) => updateRA(ra.id, 'verbo', e.target.value)} />
                    <textarea style={styles.textarea} placeholder="Descripción del RA" value={ra.descripcion} onChange={(e) => updateRA(ra.id, 'descripcion', e.target.value)} />
                    <AIButton onClick={() => reformulateField(`ra_${ra.id}`, ra.descripcion)} hasContent={!!ra.descripcion} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />
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
                    <AIButton onClick={() => reformulateField(`tp_obj_${tp.id}`, tp.objetivo)} hasContent={!!tp.objetivo} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />
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
                <AIButton onClick={() => reformulateField('metodologia', formData.metodologia)} hasContent={!!formData.metodologia} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />
              </div>

              <div style={styles.section}>
                <h3>Evaluación</h3>
                <textarea style={styles.textarea} value={formData.evaluacion} onChange={(e) => updateFormData('evaluacion', e.target.value)} />
                <AIButton onClick={() => reformulateField('evaluacion', formData.evaluacion)} hasContent={!!formData.evaluacion} disabled={!isFormComplete()} tooltip={isFormComplete() ? '' : 'Completa info general primero'} />
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
                <button style={{ ...styles.button, background: '#388e3c', fontSize: '16px', padding: '15px 30px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} 
                  onClick={saveProposal}
                  disabled={!formData.asignatura}>
                  Guardar Propuesta
                </button>
              </div>
            </div>

            {/* COMPARISON MODAL */}
            {showComparison && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '900px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <h2>Comparación de Reformulación</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div>
                      <h3>Original</h3>
                      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', minHeight: '200px', whiteSpace: 'pre-wrap' }}>
                        {comparisonData.original}
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
            {proposals.length === 0 ? (
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
                  {proposals.map(p => (
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
            {proposals.length === 0 ? (
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
                    {proposals.map((prop, idx) => (
                      <tr key={prop.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>#{prop.id}</td>
                        <td style={{ padding: '10px' }}>{prop.career || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.subject || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.academic_year || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.year_of_career || '-'}</td>
                        <td style={{ padding: '10px' }}>{prop.quarter || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', marginRight: '5px' }} 
                            onClick={() => alert(`Continuar edición de propuesta #${prop.id}`)}>Continuar</button>
                          <button style={{ ...styles.button, padding: '5px 10px', fontSize: '11px', background: '#d9534f', marginRight: '5px' }} 
                            onClick={() => alert(`Eliminar propuesta #${prop.id}`)}>Eliminar</button>
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
      </div>
    </div>
  )
}
