import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

/* ─── constants ─── */
const STATUS_CONFIG = {
  'Screening':           { color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' },
  'Interview Scheduled': { color: '#2563EB', bg: '#DBEAFE', dot: '#3B82F6' },
  'Interview Done':      { color: '#7C3AED', bg: '#EDE9FE', dot: '#8B5CF6' },
  'Offer Extended':      { color: '#059669', bg: '#D1FAE5', dot: '#10B981' },
  'Hired':               { color: '#047857', bg: '#ECFDF5', dot: '#059669' },
  'Rejected':            { color: '#DC2626', bg: '#FEE2E2', dot: '#EF4444' },
  'On Hold':             { color: '#4B5563', bg: '#F3F4F6', dot: '#6B7280' },
}
const SOURCE_CONFIG = {
  'Naukri India': { color: '#FF6B35', abbr: 'N' },
  'Indeed India': { color: '#2164F3', abbr: 'I' },
  'LinkedIn':     { color: '#0A66C2', abbr: 'L' },
  'Referral':     { color: '#7C3AED', abbr: 'R' },
  'Other':        { color: '#6B7280', abbr: 'O' },
}
const RATING_LABELS = ['', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent']
const DEFAULT_POSITIONS = ['Software Engineer', 'Product Manager', 'Data Analyst', 'HR Manager', 'Sales Executive']

/* ─── helpers ─── */
function avatarColor(name = 'A') {
  const h = ((name.charCodeAt(0) || 65) * 37 + (name.charCodeAt(1) || 65) * 13) % 360
  return { bg: `hsl(${h},55%,88%)`, fg: `hsl(${h},55%,32%)` }
}
const blank = () => ({
  name: '', email: '', phone: '', position: '', source: 'Naukri India',
  status: 'Screening', experience: '', current_ctc: '', expected_ctc: '',
  notice_period: '', location: '', skills: '', resume_text: '', resume_file_name: '', resume_url: '',
  feedback: '', rating: 0, interview_date: '', interviewer_name: '',
  notes: '', applied_date: new Date().toISOString().slice(0, 10),
})

/* ─── tiny components ─── */
function Stars({ value = 0, onChange, size = 20 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange && onChange(n === value ? 0 : n)}
          style={{ fontSize: size, color: n <= value ? '#F59E0B' : '#D1D5DB',
            cursor: onChange ? 'pointer' : 'default', lineHeight: 1 }}>★</span>
      ))}
      {value > 0 && onChange && (
        <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>{RATING_LABELS[value]}</span>
      )}
    </span>
  )
}
function Pill({ label, cfg }) {
  const c = cfg || { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px',
      borderRadius:99, background:c.bg, color:c.color, fontSize:11, fontWeight:700,
      letterSpacing:.2, whiteSpace:'nowrap' }}>
      <span style={{ width:5,height:5,borderRadius:'50%',background:c.dot,display:'inline-block' }} />
      {label}
    </span>
  )
}
function SrcTag({ src }) {
  const s = SOURCE_CONFIG[src] || SOURCE_CONFIG['Other']
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      background: s.color+'18', color: s.color, borderRadius:7,
      padding:'3px 8px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
      {s.abbr} {src}
    </span>
  )
}
function Toast({ msg, type }) {
  return (
    <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)',
      background: type==='error'?'#FEE2E2':'#ECFDF5',
      color: type==='error'?'#DC2626':'#047857',
      border:`1px solid ${type==='error'?'#FECACA':'#A7F3D0'}`,
      borderRadius:12, padding:'10px 18px', fontSize:13, fontWeight:600,
      zIndex:999, boxShadow:'0 4px 16px rgba(0,0,0,.12)', whiteSpace:'nowrap' }}>
      {msg}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   SETUP SCREEN  (shown when env vars are missing)
══════════════════════════════════════════════════════ */
function SetupScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, background:'#F5F4F1' }}>
      <div style={{ maxWidth:540, width:'100%', background:'#fff', borderRadius:20,
        padding:32, boxShadow:'0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#FF6B35,#FFAA80)',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#18181B' }}>H</div>
          <div>
            <div style={{ fontWeight:800, fontSize:20, color:'#18181B' }}>HireTrack Setup</div>
            <div style={{ fontSize:13, color:'#71717A' }}>Connect your database to get started</div>
          </div>
        </div>

        <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:12,
          padding:'12px 16px', marginBottom:24, fontSize:13, color:'#92400E', fontWeight:500 }}>
          ⚠️ Environment variables not configured. Follow the steps below.
        </div>

        {[
          {
            n: '1', title: 'Create a Supabase project',
            body: <>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:'#FF6B35'}}>supabase.com</a> → New Project. Copy your <strong>Project URL</strong> and <strong>anon public key</strong> from Settings → API.</>
          },
          {
            n: '2', title: 'Run the database migration',
            body: <>In Supabase → SQL Editor, paste and run the contents of <code style={{background:'#F4F4F5',borderRadius:4,padding:'2px 6px',fontSize:12}}>supabase/migration.sql</code> included in this project.</>
          },
          {
            n: '3', title: 'Add your .env file',
            body: <><p>Create a <code style={{background:'#F4F4F5',borderRadius:4,padding:'2px 6px',fontSize:12}}>.env</code> file in the project root:</p>
              <pre style={{ background:'#18181B', color:'#E2E8F0', borderRadius:10, padding:'12px 14px',
                fontSize:12, marginTop:8, overflowX:'auto', fontFamily:'monospace', lineHeight:1.7 }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-key`}
              </pre></>
          },
          {
            n: '4', title: 'Get your Anthropic API key',
            body: <>Go to <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:'#FF6B35'}}>console.anthropic.com</a> → API Keys → Create Key. Paste it as <code style={{background:'#F4F4F5',borderRadius:4,padding:'2px 6px',fontSize:12}}>VITE_ANTHROPIC_API_KEY</code>.</>
          },
          {
            n: '5', title: 'Restart the dev server',
            body: <><pre style={{ background:'#18181B', color:'#E2E8F0', borderRadius:10, padding:'10px 14px',
              fontSize:12, fontFamily:'monospace' }}>npm run dev</pre></>
          },
        ].map(step => (
          <div key={step.n} style={{ display:'flex', gap:14, marginBottom:20 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:'linear-gradient(135deg,#FF6B35,#E8511E)',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:13, flexShrink:0, marginTop:2 }}>{step.n}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#18181B', marginBottom:4 }}>{step.title}</div>
              <div style={{ fontSize:13, color:'#52525B', lineHeight:1.6 }}>{step.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  if (!isConfigured) return <SetupScreen />

  return <HireTrack />
}

function HireTrack() {
  const [candidates, setCandidates] = useState([])
  const [positions, setPositions]   = useState(DEFAULT_POSITIONS)
  const [page, setPage]             = useState('list')
  const [formData, setFormData]     = useState(blank())
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab]               = useState('cv')
  const [detailTab, setDetailTab]   = useState('info')
  const [search, setSearch]         = useState('')
  const [fStatus, setFStatus]       = useState('All')
  const [fPos, setFPos]             = useState('All')
  const [fSrc, setFSrc]             = useState('All')
  const [parsing, setParsing]       = useState(false)
  const [parseMsg, setParseMsg]     = useState('')
  const [newPos, setNewPos]         = useState('')
  const [showAddPos, setShowAddPos] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  // Detail page states — must live at top level (Rules of Hooks)
  const [schedDate, setSchedDate]         = useState('')
  const [schedInterviewer, setSchedInter] = useState('')
  const [schedSaving, setSchedSaving]     = useState(false)
  const [intRating, setIntRating]         = useState(0)
  const [intFeedback, setIntFeedback]     = useState('')
  const [intNotes, setIntNotes]           = useState('')
  const [intSaving, setIntSaving]         = useState(false)
  const fileRef = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── load data ── */
  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [{ data: cands, error: ce }, { data: pos, error: pe }] = await Promise.all([
        supabase.from('candidates').select('*').order('created_at', { ascending: false }),
        supabase.from('positions').select('name').order('name'),
      ])
      if (ce) throw ce
      if (pe) throw pe
      setCandidates(cands || [])
      if (pos && pos.length) setPositions(pos.map(p => p.name))
    } catch (e) {
      showToast('Failed to load data: ' + e.message, 'error')
    }
    setLoading(false)
  }

  /* ── derived ── */
  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return (!q || [c.name,c.email,c.position,c.skills||''].join(' ').toLowerCase().includes(q))
      && (fStatus==='All' || c.status===fStatus)
      && (fPos==='All'    || c.position===fPos)
      && (fSrc==='All'    || c.source===fSrc)
  })
  const stats = {
    total:     candidates.length,
    screening: candidates.filter(c=>c.status==='Screening').length,
    active:    candidates.filter(c=>['Interview Scheduled','Interview Done'].includes(c.status)).length,
    offers:    candidates.filter(c=>c.status==='Offer Extended').length,
    hired:     candidates.filter(c=>c.status==='Hired').length,
  }

  /* ── nav ── */
  function goNew()     { setFormData(blank()); setTab('cv'); setParseMsg(''); setPage('form') }
  function goEdit(c)   { setFormData({...c, rating: c.rating||0 }); setTab('info'); setParseMsg(''); setPage('form') }
  function goDetail(c) {
    setSelectedId(c.id)
    setDetailTab('info')
    // Seed detail page states from candidate data
    setSchedDate(c.interview_date || '')
    setSchedInter(c.interviewer_name || '')
    setSchedSaving(false)
    setIntRating(c.rating || 0)
    setIntFeedback(c.feedback || '')
    setIntNotes(c.notes || '')
    setIntSaving(false)
    setPage('detail')
  }
  function goList()    { setPage('list') }

  /* ── save ── */
  async function save() {
    if (!formData.name.trim()) return showToast('Name is required', 'error')
    if (!formData.position.trim()) return showToast('Position is required', 'error')
    setSaving(true)
    try {
      const payload = { ...formData }
      delete payload.id
      delete payload.created_at
      delete payload.updated_at
      // Supabase DATE columns reject empty strings — convert to null
      const dateFields = ['interview_date', 'applied_date']
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null })
      if (formData.id) {
        const { error } = await supabase.from('candidates').update(payload).eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('candidates').insert(payload)
        if (error) throw error
      }
      await loadAll()
      showToast(formData.id ? 'Candidate updated!' : 'Candidate added!')
      goList()
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error')
    }
    setSaving(false)
  }

  async function del(id) {
    if (!confirm('Delete this candidate? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', id)
      if (error) throw error
      setCandidates(prev => prev.filter(c => c.id !== id))
      showToast('Candidate deleted')
      goList()
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error')
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase.from('candidates').update({ status }).eq('id', id)
      if (error) throw error
      setCandidates(prev => prev.map(c => c.id===id ? {...c,status} : c))
    } catch (e) {
      showToast('Status update failed', 'error')
    }
  }

  async function addPosition() {
    if (!newPos.trim()) return
    const name = newPos.trim()
    try {
      await supabase.from('positions').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })
      setPositions(prev => [...new Set([...prev, name])])
      setFormData(f => ({...f, position: name}))
      setNewPos(''); setShowAddPos(false)
    } catch {}
  }

  /* ── AI CV parse ── */
  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib
    await new Promise((res, rej) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = res
      script.onerror = rej
      document.head.appendChild(script)
    })
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    return window.pdfjsLib
  }

  async function extractTextFromFile(file) {
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (isPDF) {
      try {
        const pdfjsLib = await loadPdfJs()
        const arrayBuffer = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = e => res(e.target.result)
          reader.onerror = rej
          reader.readAsArrayBuffer(file)
        })
        const typedArray = new Uint8Array(arrayBuffer)
        const loadingTask = pdfjsLib.getDocument({ data: typedArray, useWorkerFetch: false, isEvalSupported: false })
        const pdf = await loadingTask.promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items.map(item => item.str).join(' ')
          fullText += pageText + ' '
        }
        if (!fullText.trim()) throw new Error('No text extracted')
        return fullText
      } catch (err) {
        console.error('PDF error:', err)
        throw err
      }
    }
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = e => res(e.target.result)
      r.onerror = rej
      r.readAsText(file)
    })
  }

    async function parseCV(file) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setParseMsg('⚠️ VITE_ANTHROPIC_API_KEY not set. Fill in details manually.')
      setFormData(f => ({...f, resume_file_name: file.name, resume_url: ''}))
      return
    }
    setParsing(true)
    setParseMsg('Reading file…')
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 20) {
        throw new Error('Could not extract text from file')
      }

      // Upload file to Supabase Storage
      setParseMsg('Uploading CV to storage…')
      let resumeUrl = ''
      try {
        const ext = file.name.split('.').pop()
        const path = `resumes/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path)
          resumeUrl = urlData?.publicUrl || ''
        }
      } catch (uploadErr) {
        console.warn('Storage upload failed:', uploadErr)
      }

      setFormData(f => ({...f, resume_file_name: file.name, resume_text: text, resume_url: resumeUrl}))
      setParseMsg('AI is analysing your CV…')

      const prompt = `You are a CV parsing assistant for the Indian job market. Extract structured information from this CV and return ONLY a raw JSON object (no markdown, no backticks, no explanation):
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "experience": "",
  "current_ctc": "",
  "expected_ctc": "",
  "notice_period": "",
  "skills": "",
  "position": ""
}
Rules:
- experience = total years as a number string e.g. "5"
- skills = comma-separated technical/professional skills (max 10)
- position = most recent job title or role they are applying for
- current_ctc = current salary if mentioned (include LPA/month)
- notice_period = notice period if mentioned
- Return empty string "" for any field not found

CV TEXT:
${text.slice(0, 7000)}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'API error')
      const raw = (data.content || []).map(b => b.text || '').join('')
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setFormData(f => ({
        ...f,
        name:          parsed.name          || f.name,
        email:         parsed.email         || f.email,
        phone:         parsed.phone         || f.phone,
        location:      parsed.location      || f.location,
        experience:    parsed.experience    || f.experience,
        current_ctc:   parsed.current_ctc   || f.current_ctc,
        expected_ctc:  parsed.expected_ctc  || f.expected_ctc,
        notice_period: parsed.notice_period || f.notice_period,
        skills:        parsed.skills        || f.skills,
        position:      parsed.position      || f.position,
      }))
      setParseMsg('✅ CV parsed! Review and edit below.')
    } catch (e) {
      setParseMsg('⚠️ Could not parse: ' + (e.message || 'unknown error') + '. Try a .txt file if issue persists.')
    }
    setParsing(false)
  }

  /* ─── shared styles ─── */
  const inp = {
    width:'100%', background:'#FAFAF8', border:'1.5px solid #E4E4E7',
    borderRadius:10, padding:'11px 13px', fontSize:14, color:'#18181B',
    transition:'border-color .15s',
  }
  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#71717A',
    letterSpacing:.6, marginBottom:5, textTransform:'uppercase' }
  const card = { background:'#fff', borderRadius:14, border:'1px solid #EFEFED',
    boxShadow:'0 1px 3px rgba(0,0,0,.06)' }
  const primaryBtn = {
    background:'linear-gradient(135deg,#FF6B35,#E8511E)', color:'#fff',
    border:'none', borderRadius:10, padding:'11px 18px', fontWeight:700,
    fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
    opacity: saving ? 0.7 : 1,
  }
  const outlineBtn = {
    background:'#fff', color:'#18181B', border:'1.5px solid #E4E4E7',
    borderRadius:10, padding:'10px 16px', fontWeight:600, fontSize:13,
    cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
  }
  const ghostBtn = {
    background:'transparent', color:'#94A3B8', border:'1px solid #334155',
    borderRadius:9, padding:'7px 12px', fontWeight:600, fontSize:13, cursor:'pointer',
  }
  const dangerBtn = {
    background:'#FEE2E2', color:'#DC2626', border:'none',
    borderRadius:10, padding:'11px 14px', fontWeight:600, fontSize:13, cursor:'pointer',
  }
  const tabStyle = (active) => ({
    padding:'12px 14px', fontSize:13, fontWeight:600, cursor:'pointer',
    whiteSpace:'nowrap', borderBottom: active ? '2px solid #FF6B35' : '2px solid transparent',
    marginBottom:-2, color: active ? '#FF6B35' : '#94A3B8', transition:'all .15s',
  })
  const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }
  const stickyHeader = {
    background:'#18181B', padding:'0 16px', height:56,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,.2)',
  }

  /* ══════ LIST PAGE ══════ */
  if (page === 'list') return (
    <div style={{ minHeight:'100vh', background:'#F5F4F1', paddingBottom:90 }}>
      {toast && <Toast {...toast} />}

      <div style={stickyHeader}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:33,height:33,borderRadius:9,background:'linear-gradient(135deg,#FF6B35,#FFAA80)',
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:'#18181B' }}>H</div>
          <div>
            <div style={{ color:'#fff',fontWeight:700,fontSize:15,letterSpacing:-.3 }}>HireTrack</div>
            <div style={{ color:'#64748B',fontSize:9,letterSpacing:.8,textTransform:'uppercase' }}>Candidate Database</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <span style={{ background:'#FF6B3520',color:'#FF6B35',borderRadius:6,padding:'3px 7px',fontSize:10,fontWeight:700 }}>N Naukri</span>
          <span style={{ background:'#2164F320',color:'#2164F3',borderRadius:6,padding:'3px 7px',fontSize:10,fontWeight:700 }}>I Indeed</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, flexDirection:'column', gap:14 }}>
          <div style={{ width:36,height:36,border:'3px solid #FF6B35',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite' }}/>
          <div style={{ color:'#94A3B8',fontSize:14 }}>Loading candidates…</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ padding:'14px 14px 0', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7 }}>
            {[
              {l:'Total',    n:stats.total,     c:'#18181B'},
              {l:'Screening',n:stats.screening, c:'#D97706'},
              {l:'Active',   n:stats.active,    c:'#2563EB'},
              {l:'Offers',   n:stats.offers,    c:'#059669'},
              {l:'Hired',    n:stats.hired,     c:'#047857'},
            ].map(s=>(
              <div key={s.l} style={{...card,padding:'10px 6px',textAlign:'center',borderRadius:12}} className="fade">
                <div style={{fontSize:20,fontWeight:800,color:s.c,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:9,color:'#94A3B8',marginTop:2,fontWeight:600,letterSpacing:.3}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:14,pointerEvents:'none' }}>🔍</span>
              <input style={{...inp,paddingLeft:34,fontSize:13}} placeholder="Search name, position, skills…"
                value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:2 }}>
              {[
                {val:fStatus, set:setFStatus, opts:['All',...Object.keys(STATUS_CONFIG)]},
                {val:fPos,    set:setFPos,    opts:['All',...positions]},
                {val:fSrc,    set:setFSrc,    opts:['All',...Object.keys(SOURCE_CONFIG)]},
              ].map((f,i)=>(
                <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{...inp,width:'auto',flexShrink:0,padding:'8px 10px',fontSize:12}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:9 }}>
            {filtered.length===0 ? (
              <div style={{ textAlign:'center', padding:'50px 0', color:'#94A3B8' }}>
                <div style={{ fontSize:42, marginBottom:8 }}>👤</div>
                <div style={{ fontWeight:700, fontSize:15, color:'#52525B' }}>No candidates found</div>
                <div style={{ fontSize:12, marginTop:4 }}>Tap + to add your first</div>
              </div>
            ) : filtered.map(c => {
              const av = avatarColor(c.name||'A')

              // Derive stage number + label for this candidate
              const stageNum = (() => {
                if (['Hired','Rejected','On Hold','Offer Extended','Interview Done'].includes(c.status)) return 4
                if (c.status === 'Interview Scheduled') return 3
                return c.status === 'Screening' ? 1 : 2
              })()
              const stageLabel = ['','Screening','Schedule Interview','Interview','Outcome'][stageNum]
              const stageDotColor = ['','#D97706','#2563EB','#7C3AED','#059669'][stageNum]

              // Mini pipeline dots
              const miniSteps = [1,2,3,4]

              return (
                <div key={c.id} style={{...card,cursor:'pointer',overflow:'hidden'}} className="fade" onClick={()=>goDetail(c)}>
                  {/* Stage bar at top */}
                  <div style={{ background: stageDotColor+'12', borderBottom:'1px solid '+stageDotColor+'25',
                    padding:'5px 13px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:6,height:6,borderRadius:'50%',background:stageDotColor }}/>
                      <span style={{ fontSize:10,fontWeight:700,color:stageDotColor,letterSpacing:.3 }}>
                        STAGE {stageNum} · {stageLabel.toUpperCase()}
                      </span>
                    </div>
                    {/* Mini pipeline progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {miniSteps.map((s,i) => (
                        <span key={s} style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <div style={{ width: s <= stageNum ? 16 : 10, height:4, borderRadius:99,
                            background: s < stageNum ? '#10B981' : s === stageNum ? stageDotColor : '#E4E4E7',
                            transition:'all .2s' }}/>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding:13 }}>
                    <div style={{ display:'flex', gap:11, alignItems:'flex-start' }}>
                      <div style={{ width:42,height:42,borderRadius:11,background:av.bg,color:av.fg,
                        display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:17,flexShrink:0 }}>
                        {(c.name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{c.name||'—'}</div>
                        <div style={{ fontSize:12,color:'#71717A',marginTop:1 }}>{c.position||'No position'}</div>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginTop:6 }}>
                          <Pill label={c.status} cfg={STATUS_CONFIG[c.status]}/>
                          <SrcTag src={c.source}/>
                          {c.rating>0 && <Stars value={c.rating} size={11}/>}
                        </div>
                      </div>
                      <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0 }}>
                        {c.experience && <span style={{ fontSize:11,color:'#94A3B8' }}>{c.experience}yr</span>}
                        {c.expected_ctc && <span style={{ fontSize:11,color:'#94A3B8',fontWeight:600 }}>{c.expected_ctc}</span>}
                        {c.notice_period && <span style={{ fontSize:10,color:'#94A3B8' }}>{c.notice_period}</span>}
                      </div>
                    </div>

                    {/* Interview scheduled banner */}
                    {c.interview_date && (stageNum === 3 || stageNum === 4) && (
                      <div style={{ marginTop:9, background:'#EFF6FF', border:'1px solid #BFDBFE',
                        borderRadius:8, padding:'7px 10px', display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:14 }}>📅</span>
                        <div>
                          <div style={{ fontSize:11,fontWeight:700,color:'#1D4ED8' }}>
                            Interview: {c.interview_date}
                          </div>
                          {c.interviewer_name && (
                            <div style={{ fontSize:10,color:'#3B82F6',marginTop:1 }}>
                              with {c.interviewer_name}
                            </div>
                          )}
                        </div>
                        {c.status === 'Interview Done' && (
                          <span style={{ marginLeft:'auto',fontSize:10,fontWeight:700,color:'#7C3AED',
                            background:'#EDE9FE',borderRadius:5,padding:'2px 6px' }}>Done</span>
                        )}
                      </div>
                    )}

                    {/* Skills */}
                    {c.skills && (
                      <div style={{ marginTop:9, display:'flex', flexWrap:'wrap', gap:3 }}>
                        {c.skills.split(',').map(s=>s.trim()).filter(Boolean).slice(0,4).map(s=>(
                          <span key={s} style={{ background:'#F4F4F5',color:'#52525B',borderRadius:5,padding:'2px 7px',fontSize:11 }}>{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Outcome badge */}
                    {['Hired','Rejected','Offer Extended','On Hold'].includes(c.status) && (
                      <div style={{ marginTop:9, display:'flex', alignItems:'center', gap:6,
                        background: STATUS_CONFIG[c.status]?.bg, borderRadius:8, padding:'6px 10px',
                        border:'1px solid '+STATUS_CONFIG[c.status]?.dot+'40' }}>
                        <span style={{ fontSize:13 }}>
                          {c.status==='Hired'?'🎉':c.status==='Rejected'?'❌':c.status==='Offer Extended'?'📋':'⏸'}
                        </span>
                        <span style={{ fontSize:11,fontWeight:700,color:STATUS_CONFIG[c.status]?.color }}>
                          {c.status}
                          {c.rating>0 ? ' · ' : ''}
                        </span>
                        {c.rating>0 && <Stars value={c.rating} size={11}/>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <button onClick={goNew} style={{
        position:'fixed',bottom:22,right:18,zIndex:99,
        width:54,height:54,borderRadius:17,border:'none',cursor:'pointer',
        background:'linear-gradient(135deg,#FF6B35,#E8511E)',color:'#fff',
        fontSize:26,fontWeight:300, boxShadow:'0 4px 18px rgba(255,107,53,.5)',
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>＋</button>
    </div>
  )

  /* ══════ FORM PAGE ══════ */
  if (page === 'form') {
    const isNew = !formData.id
    const set = (k,v) => setFormData(f=>({...f,[k]:v}))
    const formTabs = ['cv','info','professional','notes']
    const formTabLabels = {cv:'📄 CV',info:'Basic',professional:'Pro',notes:'Notes'}

    return (
      <div style={{ minHeight:'100vh', background:'#F5F4F1', paddingBottom:90 }}>
        {toast && <Toast {...toast} />}

        <div style={{ ...stickyHeader, padding:'12px 16px', height:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button style={ghostBtn} onClick={goList}>← Back</button>
            <div>
              <div style={{ color:'#fff',fontWeight:700,fontSize:15 }}>{isNew?'Add Candidate':'Edit Candidate'}</div>
              <div style={{ color:'#64748B',fontSize:11 }}>{formData.name||'Fill in details'}</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', borderBottom:'2px solid #F4F4F5', background:'#fff',
          overflowX:'auto', scrollbarWidth:'none' }}>
          {formTabs.map(t=>(
            <div key={t} style={tabStyle(tab===t)} onClick={()=>setTab(t)}>{formTabLabels[t]}</div>
          ))}
        </div>

        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

          {/* CV tab */}
          {tab==='cv' && (
            <>
              <div style={{
                ...card, padding:24, textAlign:'center',
                cursor: parsing ? 'default' : 'pointer',
                border: parsing ? '2px dashed #FF6B35' : formData.resume_file_name ? '2px dashed #10B981' : '2px dashed #E4E4E7',
                background: parsing ? '#FFF7F4' : formData.resume_file_name ? '#F0FDF4' : '#FAFAF8',
                borderRadius:16, transition:'all .2s',
              }} onClick={()=>!parsing && fileRef.current.click()}>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.rtf"
                  style={{ display:'none' }} onChange={e=>{const f=e.target.files[0];if(f)parseCV(f)}} />
                {parsing ? (
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}>
                    <div style={{ width:38,height:38,border:'3px solid #FF6B35',borderTopColor:'transparent',
                      borderRadius:'50%',animation:'spin .7s linear infinite' }}/>
                    <div style={{ fontWeight:700,color:'#FF6B35',fontSize:15 }}>Parsing CV with AI…</div>
                    <div style={{ fontSize:12,color:'#94A3B8' }}>{parseMsg}</div>
                  </div>
                ) : formData.resume_file_name ? (
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                    <div style={{ fontSize:38 }}>📄</div>
                    <div style={{ fontWeight:700,color:'#15803D',fontSize:14 }}>{formData.resume_file_name}</div>
                    <div style={{ fontSize:12,color:'#94A3B8' }}>Tap to replace</div>
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
                    <div style={{ fontSize:44 }}>📋</div>
                    <div style={{ fontWeight:700,fontSize:16,color:'#18181B' }}>Upload CV / Resume</div>
                    <div style={{ fontSize:13,color:'#94A3B8' }}>AI will auto-fill candidate details</div>
                    <div style={{ fontSize:12,color:'#B0B0B0' }}>PDF · DOC · DOCX · TXT</div>
                    <div style={{ marginTop:6,...primaryBtn,borderRadius:10 }}>Choose File</div>
                  </div>
                )}
              </div>

              {parseMsg && !parsing && (
                <div style={{
                  background: parseMsg.startsWith('✅')?'#F0FDF4':'#FFFBEB',
                  border:`1px solid ${parseMsg.startsWith('✅')?'#86EFAC':'#FCD34D'}`,
                  borderRadius:10, padding:'11px 14px', fontSize:13,
                  color: parseMsg.startsWith('✅')?'#15803D':'#92400E', fontWeight:600,
                }}>{parseMsg}</div>
              )}

              {formData.resume_file_name && !parsing && (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:'#18181B' }}>✨ Auto-filled — review & edit:</div>
                  {[
                    {label:'Name',           k:'name'},
                    {label:'Email',          k:'email'},
                    {label:'Phone',          k:'phone'},
                    {label:'Location',       k:'location'},
                    {label:'Experience (yrs)',k:'experience'},
                    {label:'Current CTC',    k:'current_ctc'},
                    {label:'Notice Period',  k:'notice_period'},
                    {label:'Skills',         k:'skills'},
                  ].map(({label,k})=>(
                    <div key={k}><label style={lbl}>{label}</label>
                      <input style={inp} value={formData[k]||''} onChange={e=>set(k,e.target.value)}/></div>
                  ))}
                  <button style={{...primaryBtn,justifyContent:'center',marginTop:4}} onClick={()=>setTab('info')}>
                    Next: Complete Details →
                  </button>
                </div>
              )}
              {!formData.resume_file_name && !parsing && (
                <div style={{ textAlign:'center' }}>
                  <button style={{...outlineBtn,fontSize:13,color:'#71717A'}} onClick={()=>setTab('info')}>
                    Skip — Enter manually →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Basic info tab */}
          {tab==='info' && (
            <>
              <div><label style={lbl}>Full Name *</label>
                <input style={inp} value={formData.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Priya Sharma"/></div>
              <div style={grid2}>
                <div><label style={lbl}>Email</label>
                  <input style={inp} value={formData.email} onChange={e=>set('email',e.target.value)} type="email"/></div>
                <div><label style={lbl}>Phone</label>
                  <input style={inp} value={formData.phone} onChange={e=>set('phone',e.target.value)} type="tel"/></div>
              </div>
              <div><label style={lbl}>Location</label>
                <input style={inp} value={formData.location} onChange={e=>set('location',e.target.value)} placeholder="Mumbai, India"/></div>
              <div>
                <label style={lbl}>Position Applied For *</label>
                <div style={{ display:'flex', gap:8 }}>
                  <select style={{...inp,flex:1}} value={formData.position} onChange={e=>set('position',e.target.value)}>
                    <option value="">Select…</option>
                    {positions.map(p=><option key={p}>{p}</option>)}
                  </select>
                  <button style={{...outlineBtn,flexShrink:0,padding:'10px 12px'}} onClick={()=>setShowAddPos(v=>!v)}>+ New</button>
                </div>
                {showAddPos && (
                  <div style={{ display:'flex',gap:8,marginTop:8 }}>
                    <input style={{...inp,flex:1}} value={newPos} onChange={e=>setNewPos(e.target.value)}
                      placeholder="New position title" onKeyDown={e=>e.key==='Enter'&&addPosition()}/>
                    <button style={{...primaryBtn,flexShrink:0}} onClick={addPosition}>Add</button>
                  </div>
                )}
              </div>
              <div style={grid2}>
                <div><label style={lbl}>Source</label>
                  <select style={inp} value={formData.source} onChange={e=>set('source',e.target.value)}>
                    {Object.keys(SOURCE_CONFIG).map(s=><option key={s}>{s}</option>)}
                  </select></div>
                <div><label style={lbl}>Status</label>
                  <select style={inp} value={formData.status} onChange={e=>set('status',e.target.value)}>
                    {Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}
                  </select></div>
              </div>
              <div><label style={lbl}>Applied Date</label>
                <input type="date" style={inp} value={formData.applied_date} onChange={e=>set('applied_date',e.target.value)}/></div>
            </>
          )}

          {/* Professional tab */}
          {tab==='professional' && (
            <>
              <div style={grid2}>
                <div><label style={lbl}>Experience (yrs)</label>
                  <input style={inp} value={formData.experience} onChange={e=>set('experience',e.target.value)} placeholder="5"/></div>
                <div><label style={lbl}>Notice Period</label>
                  <input style={inp} value={formData.notice_period} onChange={e=>set('notice_period',e.target.value)} placeholder="30 days"/></div>
              </div>
              <div style={grid2}>
                <div><label style={lbl}>Current CTC</label>
                  <input style={inp} value={formData.current_ctc} onChange={e=>set('current_ctc',e.target.value)} placeholder="8.5 LPA"/></div>
                <div><label style={lbl}>Expected CTC</label>
                  <input style={inp} value={formData.expected_ctc} onChange={e=>set('expected_ctc',e.target.value)} placeholder="12 LPA"/></div>
              </div>
              <div><label style={lbl}>Key Skills (comma separated)</label>
                <textarea style={{...inp,resize:'vertical',minHeight:80,fontFamily:'Sora,sans-serif'}}
                  value={formData.skills} onChange={e=>set('skills',e.target.value)}
                  placeholder="React, Node.js, Python, SQL…"/></div>
            </>
          )}

          {/* Notes tab */}
          {tab==='notes' && (
            <div><label style={lbl}>Additional Notes</label>
              <textarea style={{...inp,resize:'vertical',minHeight:140,fontFamily:'Sora,sans-serif'}}
                value={formData.notes} onChange={e=>set('notes',e.target.value)}
                placeholder="Follow-up tasks, recruiter observations, reminders…"/></div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ position:'fixed',bottom:0,left:0,right:0,background:'#fff',
          padding:'12px 16px',borderTop:'1px solid #F4F4F5',
          display:'flex',gap:9,zIndex:50,boxShadow:'0 -4px 14px rgba(0,0,0,.07)' }}>
          {!isNew && <button style={dangerBtn} onClick={()=>del(formData.id)}>🗑</button>}
          <div style={{ flex:1, display:'flex', gap:9 }}>
            {formTabs.indexOf(tab)>0 && (
              <button style={{...outlineBtn,flex:1,justifyContent:'center'}}
                onClick={()=>setTab(formTabs[formTabs.indexOf(tab)-1])}>← Back</button>
            )}
            {formTabs.indexOf(tab)<formTabs.length-1 ? (
              <button style={{...primaryBtn,flex:2,justifyContent:'center'}}
                onClick={()=>setTab(formTabs[formTabs.indexOf(tab)+1])}>Next →</button>
            ) : (
              <button style={{...primaryBtn,flex:2,justifyContent:'center'}} onClick={save} disabled={saving}>
                {saving ? '⏳ Saving…' : '💾 Save Candidate'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ══════ DETAIL PAGE — 4-stage pipeline ══════ */
  if (page === 'detail') {
    const c = candidates.find(x=>x.id===selectedId)
    if (!c) { goList(); return null }
    const av = avatarColor(c.name||'A')
    const skills = c.skills ? c.skills.split(',').map(s=>s.trim()).filter(Boolean) : []

    // Derive pipeline stage from status
    const STAGE = (() => {
      if (['Hired','Rejected','On Hold','Offer Extended'].includes(c.status)) return 4
      if (c.status === 'Interview Done') return 4
      if (c.status === 'Interview Scheduled') return 3
      return 2 // Screening complete, ready to schedule
    })()

    // Stage 2 — schedule interview inline state


    async function saveSchedule() {
      if (!schedDate) return showToast('Interview date is required', 'error')
      if (!schedInterviewer.trim()) return showToast('Interviewer name is required', 'error')
      setSchedSaving(true)
      try {
        const { error } = await supabase.from('candidates').update({
          interview_date: schedDate,
          interviewer_name: schedInterviewer.trim(),
          status: 'Interview Scheduled',
        }).eq('id', c.id)
        if (error) throw error
        await loadAll()
        showToast('Interview scheduled!')
      } catch (e) { showToast('Save failed: ' + e.message, 'error') }
      setSchedSaving(false)
    }

    async function saveInterview() {
      setIntSaving(true)
      try {
        const { error } = await supabase.from('candidates').update({
          rating: intRating,
          feedback: intFeedback.trim(),
          notes: intNotes.trim(),
          status: 'Interview Done',
        }).eq('id', c.id)
        if (error) throw error
        await loadAll()
        showToast('Interview saved!')
      } catch (e) { showToast('Save failed: ' + e.message, 'error') }
      setIntSaving(false)
    }

    async function saveOutcome(status) {
      try {
        const { error } = await supabase.from('candidates').update({ status }).eq('id', c.id)
        if (error) throw error
        await loadAll()
        showToast(`Marked as ${status}`)
      } catch (e) { showToast('Update failed: ' + e.message, 'error') }
    }

    const OUTCOME_STATUSES = ['Offer Extended','Hired','Rejected','On Hold']

    // Pipeline stepper config
    const steps = [
      { n:1, label:'Screening',  done: true },
      { n:2, label:'Schedule',   done: STAGE >= 3 },
      { n:3, label:'Interview',  done: STAGE >= 4 },
      { n:4, label:'Outcome',    done: ['Hired','Rejected','Offer Extended'].includes(c.status) },
    ]

    const sectionCard = {
      background:'#fff', borderRadius:14, border:'1px solid #EFEFED',
      boxShadow:'0 1px 4px rgba(0,0,0,.05)', overflow:'hidden',
    }
    const sectionHeader = (color, done) => ({
      padding:'13px 16px', display:'flex', alignItems:'center', gap:10,
      background: done ? '#F0FDF4' : color+'0D',
      borderBottom:'1px solid #EFEFED',
    })
    const fieldGrid = {
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:1,
      background:'#EFEFED', borderRadius:0,
    }
    const fieldCell = { background:'#fff', padding:'11px 14px' }
    const fieldLabel = { fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:.5, textTransform:'uppercase', marginBottom:3 }
    const fieldValue = { fontSize:13, fontWeight:600, color:'#18181B', wordBreak:'break-all' }

    return (
      <div style={{ minHeight:'100vh', background:'#F5F4F1', paddingBottom:40 }}>
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div style={{ background:'#18181B', padding:'14px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <button style={ghostBtn} onClick={goList}>← All</button>
            <div style={{ flex:1 }}/>
            <button style={{...primaryBtn,padding:'8px 14px',fontSize:13}} onClick={()=>goEdit(c)}>✏ Edit</button>
          </div>
          <div style={{ display:'flex', gap:13, alignItems:'center' }}>
            <div style={{ width:52,height:52,borderRadius:15,background:av.bg,color:av.fg,
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:21,flexShrink:0 }}>
              {(c.name||'?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800,fontSize:18,color:'#fff',letterSpacing:-.3 }}>{c.name}</div>
              <div style={{ fontSize:13,color:'#94A3B8',marginTop:1 }}>{c.position}</div>
              {c.location && <div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>📍 {c.location}</div>}
            </div>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:12 }}>
            <Pill label={c.status} cfg={STATUS_CONFIG[c.status]}/>
            <SrcTag src={c.source}/>
            {c.rating>0 && <Stars value={c.rating} size={13}/>}
          </div>
        </div>

        {/* Pipeline stepper */}
        <div style={{ background:'#fff', padding:'14px 16px', borderBottom:'1px solid #F4F4F5' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
                    justifyContent:'center', fontWeight:800, fontSize:12,
                    background: s.done ? '#10B981' : STAGE === s.n ? '#FF6B35' : '#E4E4E7',
                    color: (s.done || STAGE === s.n) ? '#fff' : '#94A3B8',
                    boxShadow: STAGE === s.n ? '0 0 0 3px #FF6B3530' : 'none',
                    transition:'all .2s',
                  }}>
                    {s.done ? '✓' : s.n}
                  </div>
                  <div style={{ fontSize:9, fontWeight:700, color: s.done ? '#10B981' : STAGE===s.n ? '#FF6B35' : '#94A3B8',
                    letterSpacing:.3, textTransform:'uppercase', whiteSpace:'nowrap' }}>{s.label}</div>
                </div>
                {i < steps.length-1 && (
                  <div style={{ flex:1, height:2, margin:'0 4px', marginBottom:14,
                    background: steps[i+1].done || STAGE > s.n ? '#10B981' : '#E4E4E7',
                    transition:'background .3s' }}/>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'14px 14px', display:'flex', flexDirection:'column', gap:12 }}>

          {/* ── Stage 1: Screening (always visible, read-only summary) ── */}
          <div style={sectionCard}>
            <div style={sectionHeader('#10B981', true)}>
              <div style={{ width:22,height:22,borderRadius:'50%',background:'#10B981',color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>✓</div>
              <div style={{ fontWeight:700,fontSize:14,color:'#15803D' }}>Stage 1 — Screening</div>
              <div style={{ flex:1 }}/>
              <button style={{ background:'transparent',border:'none',color:'#94A3B8',fontSize:12,
                cursor:'pointer',padding:'2px 6px' }} onClick={()=>goEdit(c)}>Edit</button>
            </div>
            <div style={fieldGrid}>
              {[
                {l:'Email',   v:c.email||'—'},
                {l:'Phone',   v:c.phone||'—'},
                {l:'Applied', v:c.applied_date||'—'},
                {l:'Source',  v:c.source},
                {l:'Experience', v:c.experience?`${c.experience} yrs`:'—'},
                {l:'Notice',     v:c.notice_period||'—'},
                {l:'Current CTC',v:c.current_ctc||'—'},
                {l:'Expected CTC',v:c.expected_ctc||'—'},
              ].map(({l,v})=>(
                <div key={l} style={fieldCell}>
                  <div style={fieldLabel}>{l}</div>
                  <div style={fieldValue}>{v}</div>
                </div>
              ))}
            </div>
            {skills.length > 0 && (
              <div style={{ padding:'11px 14px', borderTop:'1px solid #F4F4F5' }}>
                <div style={fieldLabel}>Skills</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginTop:5 }}>
                  {skills.map(s=>(
                    <span key={s} style={{ background:'#F4F4F5',color:'#374151',borderRadius:5,
                      padding:'2px 8px',fontSize:11,fontWeight:500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {c.resume_file_name && (
              <div style={{ padding:'10px 14px', borderTop:'1px solid #F4F4F5',
                display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ fontSize:16 }}>📄</span>
                {c.resume_url ? (
                  <a href={c.resume_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:12,fontWeight:700,color:'#2563EB',textDecoration:'none',
                      display:'flex',alignItems:'center',gap:5 }}
                    onClick={e=>e.stopPropagation()}>
                    {c.resume_file_name}
                    <span style={{ fontSize:10,background:'#DBEAFE',color:'#1D4ED8',
                      borderRadius:4,padding:'1px 5px',fontWeight:700 }}>↓ Download</span>
                  </a>
                ) : (
                  <span style={{ fontSize:12,fontWeight:600,color:'#94A3B8' }}>{c.resume_file_name} <span style={{fontSize:10}}>(not uploaded)</span></span>
                )}
              </div>
            )}
          </div>

          {/* ── Stage 2: Schedule Interview ── */}
          <div style={{ ...sectionCard, opacity: STAGE >= 2 ? 1 : 0.5 }}>
            <div style={sectionHeader('#3B82F6', STAGE >= 3)}>
              <div style={{ width:22,height:22,borderRadius:'50%',
                background: STAGE >= 3 ? '#10B981' : STAGE === 2 ? '#3B82F6' : '#E4E4E7',
                color: STAGE >= 2 ? '#fff' : '#94A3B8',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>
                {STAGE >= 3 ? '✓' : '2'}
              </div>
              <div style={{ fontWeight:700,fontSize:14,color: STAGE >= 3 ? '#15803D' : STAGE===2 ? '#1D4ED8' : '#94A3B8' }}>
                Stage 2 — Schedule Interview
              </div>
            </div>

            {STAGE >= 3 ? (
              // Already scheduled — show read-only
              <div style={fieldGrid}>
                <div style={fieldCell}>
                  <div style={fieldLabel}>Interview Date</div>
                  <div style={fieldValue}>{c.interview_date||'—'}</div>
                </div>
                <div style={fieldCell}>
                  <div style={fieldLabel}>Interviewer</div>
                  <div style={fieldValue}>{c.interviewer_name||'—'}</div>
                </div>
              </div>
            ) : STAGE === 2 ? (
              // Active — show form
              <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{...fieldLabel,display:'block',marginBottom:5}}>Interview Date *</label>
                  <input type="date" style={inp} value={schedDate} onChange={e=>setSchedDate(e.target.value)}/>
                </div>
                <div>
                  <label style={{...fieldLabel,display:'block',marginBottom:5}}>Interviewer Name *</label>
                  <input style={inp} value={schedInterviewer} onChange={e=>setSchedInter(e.target.value)}
                    placeholder="e.g. Rahul Mehta"/>
                </div>
                <button style={{...primaryBtn,justifyContent:'center',opacity:schedSaving?.7:1}}
                  onClick={saveSchedule} disabled={schedSaving}>
                  {schedSaving ? '⏳ Saving…' : '📅 Confirm Schedule & Notify'}
                </button>
              </div>
            ) : (
              <div style={{ padding:14,color:'#94A3B8',fontSize:13,textAlign:'center' }}>
                Complete screening first
              </div>
            )}
          </div>

          {/* ── Stage 3: Interview Feedback ── */}
          <div style={{ ...sectionCard, opacity: STAGE >= 3 ? 1 : 0.5 }}>
            <div style={sectionHeader('#7C3AED', STAGE >= 4)}>
              <div style={{ width:22,height:22,borderRadius:'50%',
                background: STAGE >= 4 ? '#10B981' : STAGE === 3 ? '#7C3AED' : '#E4E4E7',
                color: STAGE >= 3 ? '#fff' : '#94A3B8',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>
                {STAGE >= 4 ? '✓' : '3'}
              </div>
              <div style={{ fontWeight:700,fontSize:14,color: STAGE >= 4 ? '#15803D' : STAGE===3 ? '#5B21B6' : '#94A3B8' }}>
                Stage 3 — Interview
              </div>
            </div>

            {STAGE >= 4 && c.status !== 'Interview Scheduled' ? (
              // Done — read-only
              <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={fieldLabel}>Rating</div>
                  <div style={{ marginTop:4 }}>{c.rating>0 ? <Stars value={c.rating} size={20}/> : <span style={{color:'#94A3B8',fontSize:13}}>Not rated</span>}</div>
                </div>
                {c.feedback && (
                  <div>
                    <div style={fieldLabel}>Feedback</div>
                    <div style={{ fontSize:13,color:'#374151',lineHeight:1.7,marginTop:4,whiteSpace:'pre-wrap' }}>{c.feedback}</div>
                  </div>
                )}
                {c.notes && (
                  <div>
                    <div style={fieldLabel}>Notes</div>
                    <div style={{ fontSize:13,color:'#374151',lineHeight:1.7,marginTop:4,whiteSpace:'pre-wrap' }}>{c.notes}</div>
                  </div>
                )}
              </div>
            ) : STAGE === 3 ? (
              // Active — show form
              <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{...fieldLabel,display:'block',marginBottom:6}}>Overall Rating</label>
                  <Stars value={intRating} onChange={setIntRating} size={28}/>
                </div>
                <div>
                  <label style={{...fieldLabel,display:'block',marginBottom:5}}>Interview Feedback</label>
                  <textarea style={{...inp,resize:'vertical',minHeight:100,fontFamily:'inherit'}}
                    value={intFeedback} onChange={e=>setIntFeedback(e.target.value)}
                    placeholder="Strengths, weaknesses, recommendation…"/>
                </div>
                <div>
                  <label style={{...fieldLabel,display:'block',marginBottom:5}}>Recruiter Notes</label>
                  <textarea style={{...inp,resize:'vertical',minHeight:70,fontFamily:'inherit'}}
                    value={intNotes} onChange={e=>setIntNotes(e.target.value)}
                    placeholder="Follow-up tasks, observations…"/>
                </div>
                <button style={{...primaryBtn,justifyContent:'center',background:'linear-gradient(135deg,#7C3AED,#5B21B6)',opacity:intSaving?.7:1}}
                  onClick={saveInterview} disabled={intSaving}>
                  {intSaving ? '⏳ Saving…' : '✅ Save Interview & Proceed to Outcome'}
                </button>
              </div>
            ) : (
              <div style={{ padding:14,color:'#94A3B8',fontSize:13,textAlign:'center' }}>
                Schedule interview first
              </div>
            )}
          </div>

          {/* ── Stage 4: Outcome ── */}
          <div style={{ ...sectionCard, opacity: STAGE >= 4 ? 1 : 0.5 }}>
            <div style={sectionHeader('#FF6B35', ['Hired','Rejected','Offer Extended'].includes(c.status))}>
              <div style={{ width:22,height:22,borderRadius:'50%',
                background: ['Hired','Rejected','Offer Extended'].includes(c.status) ? '#10B981' : STAGE===4 ? '#FF6B35' : '#E4E4E7',
                color: STAGE >= 4 ? '#fff' : '#94A3B8',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800 }}>
                {['Hired','Rejected','Offer Extended'].includes(c.status) ? '✓' : '4'}
              </div>
              <div style={{ fontWeight:700,fontSize:14,
                color: ['Hired','Rejected','Offer Extended'].includes(c.status) ? '#15803D' : STAGE===4 ? '#C2410C' : '#94A3B8' }}>
                Stage 4 — Outcome
              </div>
            </div>

            {STAGE >= 4 ? (
              <div style={{ padding:14 }}>
                {['Hired','Rejected','Offer Extended'].includes(c.status) ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Pill label={c.status} cfg={STATUS_CONFIG[c.status]}/>
                    <button style={{ background:'transparent',border:'none',color:'#94A3B8',fontSize:12,cursor:'pointer' }}
                      onClick={()=>saveOutcome('Interview Done')}>↩ Reset</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:12,color:'#6B7280',marginBottom:10,fontWeight:600 }}>Select final outcome:</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {OUTCOME_STATUSES.map(s=>(
                        <button key={s} onClick={()=>saveOutcome(s)}
                          style={{ padding:'11px 8px', borderRadius:10, border:`1.5px solid ${STATUS_CONFIG[s]?.color||'#E4E4E7'}20`,
                            background: STATUS_CONFIG[s]?.bg||'#F4F4F5',
                            color: STATUS_CONFIG[s]?.color||'#374151',
                            fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .15s',
                            boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ padding:14,color:'#94A3B8',fontSize:13,textAlign:'center' }}>
                Complete interview first
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  return null
}
