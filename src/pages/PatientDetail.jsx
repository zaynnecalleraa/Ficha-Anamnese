import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, FileText, Upload, Plus, Printer, CheckCircle, Clock, Pencil, Camera, X, Image } from 'lucide-react'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [anamnesisForm, setAnamnesisForm] = useState(null)
  const [sessions, setSessions] = useState([])
  const [exams, setExams] = useState([])
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAnswers, setShowAnswers] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sessionForm, setSessionForm] = useState({ session_date: '', procedure_id: '', how_arrived: '', how_left: '', observations: '' })
  const [sessionPhotos, setSessionPhotos] = useState({ antes: null, depois: null })
  const [sessionPhotosPreviews, setSessionPhotosPreviews] = useState({ antes: null, depois: null })
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [savingSession, setSavingSession] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploadingExam, setUploadingExam] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [sessionPhotosList, setSessionPhotosList] = useState({})

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    const [{ data: pat }, { data: form }, { data: sess }, { data: exam }, { data: proc }] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('anamnesis_forms').select('*').eq('patient_id', id).single(),
      supabase.from('sessions').select('*, procedures(name)').eq('patient_id', id).order('session_date', { ascending: false }),
      supabase.from('exams').select('*').eq('patient_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('procedures').select('*').order('name'),
    ])
    setPatient(pat)
    setAnamnesisForm(form)
    setSessions(sess || [])
    setExams(exam || [])
    setProcedures(proc || [])
    setLoading(false)
  }

  async function fetchSessionPhotos(sessionId) {
    const { data } = await supabase
      .from('session_photos')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at')
    setSessionPhotosList(prev => ({ ...prev, [sessionId]: data || [] }))
  }

  function toggleSession(sessionId) {
    if (expandedSession === sessionId) {
      setExpandedSession(null)
    } else {
      setExpandedSession(sessionId)
      fetchSessionPhotos(sessionId)
    }
  }

  function openEditModal() {
    setEditForm({ name: patient.name, phone: patient.phone || '', email: patient.email || '' })
    setPhotoPreview(patient.photo_url || null)
    setPhotoFile(null)
    setShowEditModal(true)
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleSessionPhotoChange(type, e) {
    const file = e.target.files[0]
    if (!file) return
    setSessionPhotos(prev => ({ ...prev, [type]: file }))
    setSessionPhotosPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }))
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSavingEdit(true)

    let photo_url = patient.photo_url

    if (photoFile) {
      const fileName = `${Date.now()}_${photoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, photoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('patient-photos').getPublicUrl(fileName)
        photo_url = urlData.publicUrl
      }
    }

    await supabase.from('patients').update({
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      photo_url,
    }).eq('id', id)

    setSavingEdit(false)
    setShowEditModal(false)
    fetchAll()
  }

  async function handleSaveSession(e) {
    e.preventDefault()
    setSavingSession(true)

    const { data: session } = await supabase
      .from('sessions')
      .insert({ ...sessionForm, patient_id: id })
      .select()
      .single()

    // Upload das fotos antes/depois
    if (session) {
      for (const type of ['antes', 'depois']) {
        const file = sessionPhotos[type]
        if (!file) continue
        const fileName = `${session.id}/${type}_${Date.now()}_${file.name}`
        const { error } = await supabase.storage.from('session-photos').upload(fileName, file)
        if (!error) {
          const { data: urlData } = supabase.storage.from('session-photos').getPublicUrl(fileName)
          await supabase.from('session_photos').insert({
            session_id: session.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
            type,
          })
        }
      }
    }

    setSavingSession(false)
    setShowSessionModal(false)
    setSessionForm({ session_date: '', procedure_id: '', how_arrived: '', how_left: '', observations: '' })
    setSessionPhotos({ antes: null, depois: null })
    setSessionPhotosPreviews({ antes: null, depois: null })
    fetchAll()
  }

  async function handleExamUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingExam(true)
    const fileName = `${id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('exams').upload(fileName, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('exams').getPublicUrl(fileName)
      await supabase.from('exams').insert({
        patient_id: id,
        file_url: urlData.publicUrl,
        file_name: file.name,
      })
      fetchAll()
    }
    setUploadingExam(false)
  }

  function handlePrint() {
    window.open(`/imprimir/${anamnesisForm.token}`, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-yellow-600 font-display text-xl">Carregando...</p>
    </div>
  )

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">Paciente não encontrada.</p>
    </div>
  )

  const answers = anamnesisForm?.answers || {}

  const questoes = [
    { key: 'q1', label: 'Gosta do formato e volume dos seus lábios?' },
    { key: 'q2', label: 'Marcas de expressão ao sorrir ou falar?' },
    { key: 'q3', label: 'Flacidez no rosto?' },
    { key: 'q4', label: 'Alergias?', detail: 'q4_detail' },
    { key: 'q5', label: 'Lesões na pele?', detail: 'q5_detail' },
    { key: 'q6', label: 'Herpes labial ou Zoster?' },
    { key: 'q7', label: 'Medicação frequente?', detail: 'q7_detail' },
    { key: 'q8', label: 'Usa/usava Roacutan?', detail: 'q8_detail' },
    { key: 'q9', label: 'Anticoagulantes / problema de coagulação?' },
    { key: 'q10', label: 'Vacina antitetânica recente?' },
    { key: 'q11', label: 'Vacina COVID-19?', detail: 'q11_detail' },
    { key: 'q12', label: 'Fumante?' },
    { key: 'q13', label: 'Doença renal?' },
    { key: 'q14', label: 'Problemas hormonais / tireoide / fígado?' },
    { key: 'q15', label: 'Bronquite / asma / tuberculose?' },
    { key: 'q16', label: 'Dores de cabeça / febre frequente?' },
    { key: 'q17', label: 'Doença viral (HIV, Sífilis, hepatite)?' },
    { key: 'q18', label: 'Diabetes / hipertenso / anemia?' },
    { key: 'q19', label: 'Doença autoimune / reumatismo?' },
    { key: 'q20', label: 'Infecção na boca?' },
    { key: 'q21', label: 'Outra doença?', detail: 'q21_detail' },
    { key: 'q22', label: 'Dorme bem?' },
    { key: 'q23', label: 'Sente-se desmotivado(a)?' },
    { key: 'q24', label: 'Queda de cabelo / unhas fracas / pele ressecada?' },
    { key: 'q25', label: 'Nível de concentração' },
    { key: 'q26', label: 'Memória' },
    { key: 'q27', label: 'Sente-se cansado(a)?', detail: 'q27_detail' },
    { key: 'q28', label: 'Intestino funciona bem?' },
    { key: 'q30', label: 'Água por dia' },
    { key: 'q32', label: 'Antidepressivos / ansiedade?', detail: 'q32_detail' },
    { key: 'q34', label: 'Procedimento estético anterior?', detail: 'q34_detail' },
    { key: 'q35', label: 'Exposição ao sol?' },
    { key: 'q36', label: 'Acne?' },
    { key: 'q37', label: 'Atividade física' },
    { key: 'q38', label: 'Gestante ou tentando engravidar?' },
    { key: 'q39', label: 'Anticoncepcional / DIU?' },
    { key: 'q40', label: 'Menopausa / reposição hormonal?' },
    { key: 'q41', label: 'O que gostaria de melhorar?' },
    { key: 'q42', label: 'Informações adicionais' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-yellow-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yellow-600 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-xl text-yellow-600 font-bold">Callera Clinic</h1>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Card paciente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt={patient.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-display font-bold text-3xl">
                {patient.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl text-gray-700">{patient.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{patient.phone} {patient.email && `· ${patient.email}`}</p>
            <p className="text-xs text-gray-300 mt-1">Cadastrada em {new Date(patient.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={openEditModal}
            className="flex items-center gap-1.5 text-xs border border-yellow-300 text-yellow-600 hover:bg-yellow-50 px-3 py-2 rounded-lg transition">
            <Pencil size={13} /> Editar
          </button>
        </div>

        {/* Ficha de anamnese */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-gray-700 flex items-center gap-2">
              <FileText size={18} className="text-yellow-500" />
              Ficha de Anamnese
            </h3>
            {anamnesisForm?.status === 'completed' ? (
              <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
                <CheckCircle size={14} /> Preenchida
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-300 text-xs font-medium">
                <Clock size={14} /> Pendente
              </span>
            )}
          </div>

          {anamnesisForm?.status === 'completed' ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Nome', anamnesisForm.full_name],
                  ['Nascimento', anamnesisForm.birth_date],
                  ['CPF', anamnesisForm.cpf],
                  ['Profissão', anamnesisForm.profession],
                  ['Estado civil', anamnesisForm.marital_status],
                  ['E-mail', anamnesisForm.email],
                  ['Telefone', anamnesisForm.phone],
                  ['Endereço', anamnesisForm.address],
                ].map(([label, val]) => val ? (
                  <div key={label}>
                    <span className="text-gray-400 text-xs">{label}</span>
                    <p className="text-gray-700">{val}</p>
                  </div>
                ) : null)}
              </div>

              <button onClick={() => setShowAnswers(!showAnswers)}
                className="text-sm text-yellow-600 hover:text-yellow-700 transition font-medium">
                {showAnswers ? 'Ocultar respostas ▲' : 'Ver todas as respostas ▼'}
              </button>

              {showAnswers && (
                <div className="space-y-2 pt-2">
                  {questoes.map(q => answers[q.key] ? (
                    <div key={q.key} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500 flex-1">{q.label}</span>
                      <span className="text-gray-700 font-medium ml-4">
                        {Array.isArray(answers[q.key]) ? answers[q.key].join(', ') : answers[q.key]}
                        {q.detail && answers[q.detail] ? ` — ${answers[q.detail]}` : ''}
                      </span>
                    </div>
                  ) : null)}
                  {(answers.q33_pressao || answers.q33_peso || answers.q33_altura) && (
                    <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Pressão / Peso / Altura</span>
                      <span className="text-gray-700 font-medium">{answers.q33_pressao} / {answers.q33_peso} / {answers.q33_altura}</span>
                    </div>
                  )}
                  {answers.q44_dia && (
                    <div className="text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Rotina manhã</span>
                      <p className="text-gray-700">{answers.q44_dia}</p>
                    </div>
                  )}
                  {answers.q44_noite && (
                    <div className="text-sm pb-2">
                      <span className="text-gray-500">Rotina noite</span>
                      <p className="text-gray-700">{answers.q44_noite}</p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handlePrint}
                className="flex items-center gap-2 text-sm border border-yellow-300 text-yellow-600 hover:bg-yellow-50 px-4 py-2 rounded-lg transition mt-2">
                <Printer size={15} /> Imprimir ficha
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">A paciente ainda não preencheu a ficha.</p>
          )}
        </div>

        {/* Sessões */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-gray-700">Histórico de Sessões</h3>
            <button onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition">
              <Plus size={13} /> Nova sessão
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-300">Nenhuma sessão registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Header da sessão */}
                  <button
                    onClick={() => toggleSession(s.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-700 text-sm">
                        {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                      {s.procedures && (
                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                          {s.procedures.name}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">
                      {expandedSession === s.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Detalhes expandidos */}
                  {expandedSession === s.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                      <div className="pt-3 space-y-1">
                        {s.how_arrived && <p className="text-xs text-gray-400">Como chegou: <span className="text-gray-600">{s.how_arrived}</span></p>}
                        {s.how_left && <p className="text-xs text-gray-400">Como saiu: <span className="text-gray-600">{s.how_left}</span></p>}
                        {s.observations && <p className="text-xs text-gray-400">Obs: <span className="text-gray-600">{s.observations}</span></p>}
                      </div>

                      {/* Fotos antes/depois */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Image size={12} /> Fotos
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {['antes', 'depois'].map(type => {
                            const photos = (sessionPhotosList[s.id] || []).filter(p => p.type === type)
                            return (
                              <div key={type}>
                                <p className="text-xs text-gray-300 mb-1 capitalize">{type}</p>
                                {photos.length > 0 ? (
                                  <div className="space-y-1">
                                    {photos.map(photo => (
                                      <a key={photo.id} href={photo.file_url} target="_blank" rel="noreferrer">
                                        <img src={photo.file_url} alt={type}
                                          className="w-full h-28 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition" />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full h-28 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                    <p className="text-xs text-gray-300">Sem foto</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exames */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-gray-700">Exames</h3>
            <label className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition cursor-pointer">
              <Upload size={13} />
              {uploadingExam ? 'Enviando...' : 'Anexar exame'}
              <input type="file" className="hidden" onChange={handleExamUpload} accept=".pdf,.jpg,.jpeg,.png" />
            </label>
          </div>

          {exams.length === 0 ? (
            <p className="text-sm text-gray-300">Nenhum exame anexado ainda.</p>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => (
                <a key={exam.id} href={exam.file_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:border-yellow-200 transition">
                  <FileText size={16} className="text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{exam.file_name}</p>
                    <p className="text-xs text-gray-300">{new Date(exam.uploaded_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal editar paciente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-gray-700">Editar Paciente</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex justify-center mb-2">
                <label className="cursor-pointer group relative">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-yellow-300 flex items-center justify-center bg-yellow-50 overflow-hidden group-hover:border-yellow-500 transition">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera size={24} className="text-yellow-400 mx-auto" />
                        <p className="text-xs text-yellow-400 mt-1">Foto</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nome completo *</label>
                <input type="text" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" required />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Telefone</label>
                <input type="text" value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">E-mail</label>
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-lg text-sm hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={savingEdit}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg text-sm transition">
                  {savingEdit ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nova sessão */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-gray-700">Nova Sessão</h3>
              <button onClick={() => setShowSessionModal(false)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Data *</label>
                <input type="date" value={sessionForm.session_date}
                  onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" required />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Procedimento</label>
                <select value={sessionForm.procedure_id}
                  onChange={e => setSessionForm({ ...sessionForm, procedure_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition">
                  <option value="">Selecionar...</option>
                  {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Como chegou</label>
                <input type="text" value={sessionForm.how_arrived}
                  onChange={e => setSessionForm({ ...sessionForm, how_arrived: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Como saiu</label>
                <input type="text" value={sessionForm.how_left}
                  onChange={e => setSessionForm({ ...sessionForm, how_left: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Observações</label>
                <textarea value={sessionForm.observations}
                  onChange={e => setSessionForm({ ...sessionForm, observations: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition resize-none" />
              </div>

              {/* Fotos antes/depois */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Fotos antes / depois</label>
                <div className="grid grid-cols-2 gap-3">
                  {['antes', 'depois'].map(type => (
                    <div key={type}>
                      <p className="text-xs text-gray-400 mb-1 capitalize">{type}</p>
                      <label className="cursor-pointer block">
                        <div className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-yellow-300 transition">
                          {sessionPhotosPreviews[type] ? (
                            <img src={sessionPhotosPreviews[type]} alt={type} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <Camera size={20} className="text-gray-300 mx-auto" />
                              <p className="text-xs text-gray-300 mt-1">Adicionar</p>
                            </div>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => handleSessionPhotoChange(type, e)} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSessionModal(false)}
                  className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-lg text-sm hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={savingSession}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg text-sm transition">
                  {savingSession ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}