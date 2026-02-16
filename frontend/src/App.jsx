import React, { useState, useEffect } from 'react'

export default function App(){
  const [file, setFile] = useState(null)
  const [uploader, setUploader] = useState('')
  const [career, setCareer] = useState('')
  const [subject, setSubject] = useState('')
  const [proposals, setProposals] = useState([])
  const [status, setStatus] = useState('')

  useEffect(()=>{ fetchProposals() }, [])

  async function fetchProposals(){
    try{
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      const res = await fetch(`${apiUrl}/proposals`)
      const data = await res.json()
      setProposals(data)
    }catch(e){ console.error(e) }
  }

  async function handleUpload(e){
    e.preventDefault()
    if(!file) return setStatus('Select a file')
    const form = new FormData()
    form.append('file', file)
    form.append('uploader', uploader)
    form.append('career', career)
    form.append('subject', subject)
    setStatus('Uploading...')
    try{
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      const res = await fetch(`${apiUrl}/upload`, { method: 'POST', body: form })
      if(!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStatus('Uploaded')
      setFile(null)
      setUploader('')
      setCareer('')
      setSubject('')
      fetchProposals()
    }catch(err){
      console.error(err)
      setStatus('Upload failed')
    }
  }

  async function getSuggestion(proposalId){
    setStatus('Requesting suggestion...')
    const form = new FormData()
    form.append('proposal_id', proposalId)
    try{
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      const res = await fetch(`${apiUrl}/suggest`, { method: 'POST', body: form })
      if(!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStatus('Suggestion ready')
      setProposals(prev => prev.map(p=> p.id===proposalId ? {...p, _suggestion: data.suggestion} : p))
    }catch(err){
      console.error(err)
      setStatus('Suggestion failed')
    }
  }

  async function acceptSuggestion(proposalId){
    const prop = proposals.find(p=>p.id===proposalId)
    if(!prop || !prop._suggestion) return
    try{
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      const res = await fetch(`${apiUrl}/proposals/${proposalId}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ notes: prop._suggestion, status: 'suggested' }) })
      if(!res.ok) throw new Error(await res.text())
      setStatus('Suggestion accepted')
      fetchProposals()
    }catch(err){
      console.error(err)
      setStatus('Accept failed')
    }
  }

  return (
    <div className="container">
      <h1>TesisMCD — Subir Propuesta</h1>
      <form onSubmit={handleUpload} className="upload-form">
        <label>Archivo
          <input type="file" onChange={e=>setFile(e.target.files[0])} />
        </label>
        <label>Tu correo
          <input value={uploader} onChange={e=>setUploader(e.target.value)} placeholder="tu@correo" />
        </label>
        <label>Carrera
          <input value={career} onChange={e=>setCareer(e.target.value)} placeholder="Ingenieria" />
        </label>
        <label>Asignatura
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Algoritmos" />
        </label>
        <button type="submit">Subir</button>
      </form>
      <p>{status}</p>

      <h2>Propuestas</h2>
      <table className="proposals-table">
        <thead><tr><th>ID</th><th>Archivo</th><th>Uploader</th><th>Carrera</th><th>Asignatura</th><th>Estado</th></tr></thead>
        <tbody>
          {proposals.map(p=> (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.original_filename}</td>
              <td>{p.uploader}</td>
              <td>{p.career}</td>
              <td>{p.subject}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={()=>getSuggestion(p.id)}>Get suggestion</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {proposals.map(p=> p._suggestion ? (
        <div key={`sugg-${p.id}`} className="suggestion-box">
          <h3>Suggestion for proposal {p.id}</h3>
          <textarea value={p._suggestion} readOnly rows={6} style={{width:'100%'}} />
          <div style={{marginTop:8}}>
            <button onClick={()=>acceptSuggestion(p.id)}>Accept suggestion</button>
          </div>
        </div>
      ) : null)}
    </div>
  )
}
