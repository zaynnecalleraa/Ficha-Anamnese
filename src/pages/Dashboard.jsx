import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, LogOut, User, Link, ChevronRight, Settings, Search, Trash2, ArrowUpDown } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mais recente' },
  { value: 'oldest', label: 'Mais antigo' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
]

function sortPatients(list, order) {
  const copy = [...list]
  switch (order) {
    case 'oldest': return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    case 'az': return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    case 'za': return copy.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
    default: return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

export default function Dashboard() {
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPatients()
  }, [])

  // Real-time subscription for anamnesis status updates
  useEffect(() => {
    const channel = supabase
      .channel('anamnesis-status-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'anamnesis_forms' },
        (payload) => {
          setPatients(prev => prev.map(p =>
            p.id === payload.new.patient_id
              ? { ...p, anamnesis_status: payload.new.status }
              : p
          ))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    let result = patients

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      )
    }

    setFiltered(sortPatients(result, sortOrder))
  }, [search, patients, sortOrder])

  async function fetchPatients() {
    setLoading(true)
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')

    if (!patientsData) { setLoading(false); return }

    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const { data: form } = await supabase
          .from('anamnesis_forms')
          .select('status')
          .eq('patient_id', patient.id)
          .single()
        return { ...patient, anamnesis_status: form?.status || 'pending' }
      })
    )

    setPatients(patientsWithStatus)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleCreatePatient(e) {
    e.preventDefault()
    setSaving(true)

    let photo_url = null

    if (photoFile) {
      const fileName = `${Date.now()}_${photoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, photoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('patient-photos')
          .getPublicUrl(fileName)
        photo_url = urlData.publicUrl
      }
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert({ name: form.name, phone: form.phone, email: form.email, photo_url })
      .select()
      .single()

    if (error) { setSaving(false); return }

    const token = crypto.randomUUID()
    await supabase.from('anamnesis_forms').insert({
      patient_id: patient.id,
      token,
      status: 'pending'
    })

    setSaving(false)
    setShowModal(false)
    setForm({ name: '', phone: '', email: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    fetchPatients()
  }

  async function handleDeletePatient(patientId) {
    setDeleting(true)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('patient_id', patientId)

    if (sessions?.length) {
      const sessionIds = sessions.map(s => s.id)
      await supabase.from('session_photos').delete().in('session_id', sessionIds)
      await supabase.from('sessions').delete().eq('patient_id', patientId)
    }

    await supabase.from('exams').delete().eq('patient_id', patientId)
    await supabase.from('anamnesis_forms').delete().eq('patient_id', patientId)
    await supabase.from('patients').delete().eq('id', patientId)

    setDeleteConfirm(null)
    setDeleting(false)
    fetchPatients()
  }

  async function copyAnamnesisLink(patientId) {
    const { data } = await supabase
      .from('anamnesis_forms')
      .select('token')
      .eq('patient_id', patientId)
      .single()

    if (data) {
      const link = `${window.location.origin}/ficha/${data.token}`
      await navigator.clipboard.writeText(link)
      alert('Link copiado! Envie para a paciente.')
    }
  }

  const patientToDelete = deleteConfirm ? patients.find(p => p.id === deleteConfirm) : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-yellow-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-display text-2xl text-yellow-600 font-bold">Callera Clinic</h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase">Painel Profissional</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/procedimentos')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-yellow-600 transition"
          >
            <Settings size={15} />
            Procedimentos
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-gray-700">Pacientes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            <UserPlus size={16} />
            Nova Paciente
          </button>
        </div>

        {/* Busca + Ordenação */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-yellow-400 transition bg-white shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl pl-9 pr-8 py-3 text-sm bg-white shadow-sm focus:outline-none focus:border-yellow-400 transition text-gray-600 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
          </div>
        </div>

        {/* Lista de pacientes */}
        {loading ? (
          <p className="text-center text-gray-400 py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            {search ? (
              <p>Nenhuma paciente encontrada para "<strong>{search}</strong>"</p>
            ) : (
              <>
                <p>Nenhuma paciente cadastrada ainda.</p>
                <p className="text-sm mt-1">Clique em "Nova Paciente" para começar.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(patient => (
              <div
                key={patient.id}
                className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:border-yellow-200 transition"
              >
                <div className="flex items-center gap-4">
                  {patient.photo_url ? (
                    <img src={patient.photo_url} alt={patient.name}
                      className="w-10 h-10 rounded-full object-cover border border-yellow-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-display font-bold text-lg">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-700">{patient.name}</p>
                    <p className="text-xs text-gray-400">{patient.phone} {patient.email && `· ${patient.email}`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    patient.anamnesis_status === 'completed'
                      ? 'bg-green-50 text-green-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {patient.anamnesis_status === 'completed' ? '✓ Ficha preenchida' : '○ Ficha pendente'}
                  </span>
                  <button
                    onClick={() => copyAnamnesisLink(patient.id)}
                    className="flex items-center gap-1 text-xs border border-yellow-300 text-yellow-600 hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition"
                  >
                    <Link size={13} />
                    Copiar link
                  </button>
                  <button
                    onClick={() => navigate(`/paciente/${patient.id}`)}
                    className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Ver
                    <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(patient.id)}
                    className="flex items-center justify-center text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
                    title="Excluir paciente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nova paciente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h3 className="font-display text-2xl text-gray-700 mb-6">Nova Paciente</h3>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="flex justify-center mb-2">
                <label className="cursor-pointer group relative">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-yellow-300 flex items-center justify-center bg-yellow-50 overflow-hidden group-hover:border-yellow-500 transition">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-2xl">📷</span>
                        <p className="text-xs text-yellow-400 mt-1">Foto</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nome completo *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
                  required />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Telefone</label>
                <input type="text" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">E-mail</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => { setShowModal(false); setPhotoPreview(null); setPhotoFile(null) }}
                  className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg text-sm transition">
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="font-display text-xl text-gray-700 mb-2">Excluir paciente?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Tem certeza que deseja excluir <strong className="text-gray-600">{patientToDelete?.name}</strong>?
              <br />
              <span className="text-red-400">Todos os dados, sessões e exames serão apagados permanentemente.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePatient(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg text-sm transition"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
